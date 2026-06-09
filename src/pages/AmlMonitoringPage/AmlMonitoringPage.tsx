import React, { useState, useEffect } from 'react';
import { Button, Input } from '../../components/Shared';
import api from '../../api/axios';
import { searchClients } from '../../api/clients';
import toast from 'react-hot-toast';
import '../../styles/advancedreports.css';

type AmlSubReport = 'clientActivity' | 'clientHistory' | 'repeated' | 'frequent' | 'suspicious';

const safeNumber = (value: any, defaultValue: number = 0): number => {
  const num = Number(value);
  return isNaN(num) ? defaultValue : num;
};

const AmlMonitoringPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AmlSubReport>('clientActivity');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [clientId, setClientId] = useState('');
  const [threshold, setThreshold] = useState(10000);
  const [minCount, setMinCount] = useState(5);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [clientsList, setClientsList] = useState<any[]>([]);
  const [loadingClients, setLoadingClients] = useState(false);

  useEffect(() => {
    if (activeTab === 'clientHistory') loadClients();
  }, [activeTab]);

  const loadClients = async () => {
    setLoadingClients(true);
    try {
      const list = await searchClients();
      setClientsList(list);
    } catch (err) { console.error(err); } finally { setLoadingClients(false); }
  };

  const fetchReport = async () => {
    setLoading(true);
    try {
      let url = '';
      const params: any = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      if (activeTab === 'suspicious') params.threshold = threshold;
      if (activeTab === 'repeated' || activeTab === 'frequent') params.minCount = Number(minCount);
      switch (activeTab) {
        case 'clientActivity': url = '/reports/client-activity'; break;
        case 'clientHistory':
          if (!clientId) { toast.error('Выберите клиента'); setLoading(false); return; }
          url = `/reports/client-history/${clientId}`;
          break;
        case 'repeated': url = '/reports/repeated-operations'; break;
        case 'frequent': url = '/reports/frequent-conversions'; break;
        case 'suspicious': url = '/reports/suspicious'; break;
      }
      const res = await api.get(url, { params });
      setData(res.data);
      toast.success('Отчёт загружен');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Ошибка');
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  const renderReport = () => {
    if (!data) return <p className="no-data">Нажмите «Сформировать»</p>;

    switch (activeTab) {
      case 'clientActivity':
        if (!Array.isArray(data)) return <p>Нет данных</p>;
        return (
          <table className="report-table"><thead><tr><th>Клиент</th><th>Паспорт</th><th>Кол-во операций</th><th>Оборот (BYN)</th></tr></thead><tbody>
            {data.map((item: any, idx: number) => (<tr key={idx}><td>{item.client?.fullName || 'Аноним'}</td><td>{item.client?.passportNumber || '—'}</td><td>{safeNumber(item.operationCount)}</td><td>{safeNumber(item.totalTurnoverBYN).toFixed(2)}</td></tr>))}
          </tbody></table>
        );
      case 'clientHistory':
        if (!data?.client) return <p>Нет данных</p>;
        return (
          <div>
            <h3>История клиента: {data.client?.fullName}</h3>
            <p><strong>Паспорт:</strong> {data.client?.passportNumber || '—'}</p>
            <p><strong>Период:</strong> {new Date(data.period?.from).toLocaleDateString()} - {new Date(data.period?.to).toLocaleDateString()}</p>
            <div className="summary-cards">
              <div className="summary-card">Всего операций: {safeNumber(data.summary?.totalOperations)}</div>
              <div className="summary-card">Оборот BYN: {safeNumber(data.summary?.totalTurnoverBYN).toFixed(2)}</div>
              <div className="summary-card">Покупок: {safeNumber(data.summary?.byType?.BUY)}</div>
              <div className="summary-card">Продаж: {safeNumber(data.summary?.byType?.SELL)}</div>
              <div className="summary-card">Конверсий: {safeNumber(data.summary?.byType?.CONVERT)}</div>
            </div>
            <table className="report-table"><thead><tr><th>Дата</th><th>Тип</th><th>Отдано</th><th>Получено</th><th>Кассир</th></tr></thead><tbody>
              {data.transactions?.map((tx: any) => (<tr key={tx.id}><td>{new Date(tx.createdAt).toLocaleString()}</td><td>{tx.type === 'BUY' ? 'Покупка' : tx.type === 'SELL' ? 'Продажа' : 'Конверсия'}</td><td>{safeNumber(tx.sumIn).toFixed(2)} {tx.currencyIn}</td><td>{safeNumber(tx.sumOut).toFixed(2)} {tx.currencyOut}</td><td>{tx.cashierName}</td></tr>))}
            </tbody></table>
          </div>
        );
      case 'repeated':
        return (
          <div>
            <h3>Повторяющиеся операции (min {data.minCount} раз)</h3>
            <table className="report-table"><thead><tr><th>Клиент</th><th>Тип</th><th>Валюты</th><th>Кол-во</th></tr></thead><tbody>
              {data.repeatedOperations?.map((op: any, idx: number) => (<tr key={idx}><td>{op.client?.fullName || 'Аноним'}</td><td>{op.type === 'BUY' ? 'Покупка' : op.type === 'SELL' ? 'Продажа' : 'Конверсия'}</td><td>{op.currencyIn} → {op.currencyOut}</td><td>{safeNumber(op.operationCount)}</td></tr>))}
            </tbody></table>
          </div>
        );
      case 'frequent':
        return (
          <div>
            <h3>Частые конверсии (min {data.minCount} раз)</h3>
            <table className="report-table"><thead><tr><th>Клиент</th><th>Из валюты</th><th>В валюту</th><th>Кол-во</th></tr></thead><tbody>
              {data.frequentConversions?.map((conv: any, idx: number) => (<tr key={idx}><td>{conv.client?.fullName || 'Аноним'}</td><td>{conv.fromCurrency}</td><td>{conv.toCurrency}</td><td>{safeNumber(conv.operationCount)}</td></tr>))}
            </tbody></table>
          </div>
        );
      case 'suspicious':
        return (
          <div>
            <h3>Подозрительные операции (сумма &gt; {safeNumber(data.threshold)} BYN)</h3>
            <div className="summary-cards warning">Найдено: {safeNumber(data.count)}</div>
            <table className="report-table"><thead><tr><th>Дата</th><th>Клиент</th><th>Кассир</th><th>Тип</th><th>Сумма (BYN)</th></tr></thead><tbody>
              {data.transactions?.map((tx: any) => (<tr key={tx.id}><td>{new Date(tx.createdAt).toLocaleString()}</td><td>{tx.clientName}</td><td>{tx.cashierName}</td><td>{tx.type === 'BUY' ? 'Покупка' : tx.type === 'SELL' ? 'Продажа' : 'Конверсия'}</td><td className="suspicious">{safeNumber(tx.suspiciousAmount).toFixed(2)}</td></tr>))}
            </tbody></table>
          </div>
        );
      default: return null;
    }
  };

  return (
    <div className="container advanced-reports">
      <h1>AML и клиентский мониторинг</h1>
      <div className="tabs">
        <button className={activeTab === 'clientActivity' ? 'active' : ''} onClick={() => setActiveTab('clientActivity')}>Активность клиентов</button>
        <button className={activeTab === 'clientHistory' ? 'active' : ''} onClick={() => setActiveTab('clientHistory')}>История клиента</button>
        <button className={activeTab === 'repeated' ? 'active' : ''} onClick={() => setActiveTab('repeated')}>Повторяющиеся операции</button>
        <button className={activeTab === 'frequent' ? 'active' : ''} onClick={() => setActiveTab('frequent')}>Частые конверсии</button>
        <button className={activeTab === 'suspicious' ? 'active' : ''} onClick={() => setActiveTab('suspicious')}>Подозрительные операции</button>
      </div>
      <div className="filters-panel">
        <div className="date-filters">
          <Input type="date" label="Дата от" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          <Input type="date" label="Дата до" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </div>
        {activeTab === 'clientHistory' && (
          <div className="filter-group"><label>Клиент</label><select value={clientId} onChange={(e) => setClientId(e.target.value)} disabled={loadingClients}><option value="">-- Выберите клиента --</option>{clientsList.map(c => (<option key={c.id} value={c.id}>{c.fullName} ({c.passportNumber})</option>))}</select></div>
        )}
        {activeTab === 'suspicious' && (
          <Input type="number" label="Порог суммы (BYN)" value={threshold} onChange={(e) => setThreshold(parseFloat(e.target.value))} />
        )}
        {(activeTab === 'repeated' || activeTab === 'frequent') && (
          <Input type="number" label="Мин. количество" value={minCount} onChange={(e) => setMinCount(parseInt(e.target.value))} />
        )}
        <Button onClick={fetchReport} disabled={loading}>Сформировать</Button>
      </div>
      <div className="report-content">{loading ? <div className="loader">Загрузка...</div> : renderReport()}</div>
    </div>
  );
};

export default AmlMonitoringPage;
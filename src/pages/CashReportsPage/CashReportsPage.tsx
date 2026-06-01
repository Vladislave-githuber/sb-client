import React, { useState, useEffect } from 'react';
import { Button, Input, Select } from '../../components/Shared';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import '../../styles/advancedreports.css';

type CashSubReport = 'cashierSummary' | 'purchaseRegister' | 'saleRegister' | 'conversionRegister' | 'daily' | 'hourly';

const safeNumber = (value: any, defaultValue: number = 0): number => {
  const num = Number(value);
  return isNaN(num) ? defaultValue : num;
};

const CashReportsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<CashSubReport>('cashierSummary');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [cashierId, setCashierId] = useState('');
  const [usersList, setUsersList] = useState<any[]>([]);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const { data } = await api.get('/users');
      setUsersList(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchReport = async () => {
    setLoading(true);
    try {
      let url = '';
      const params: any = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      if (cashierId) params.cashierId = cashierId;

      switch (activeTab) {
        case 'cashierSummary':
          url = '/reports/cashier-summary';
          break;
        case 'purchaseRegister':
          url = '/reports/purchase-register';
          break;
        case 'saleRegister':
          url = '/reports/sale-register';
          break;
        case 'conversionRegister':
          url = '/reports/conversion-register';
          break;
        case 'daily':
          url = '/reports/daily';
          break;
        case 'hourly':
          url = '/reports/hourly';
          break;
        default:
          toast.error('Неизвестный отчёт');
          setLoading(false);
          return;
      }
      const res = await api.get(url, { params });
      setData(res.data);
      toast.success('Отчёт загружен');
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Ошибка загрузки');
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  const renderReport = () => {
    if (!data) return <p className="no-data">Нажмите «Сформировать»</p>;

    switch (activeTab) {
      case 'cashierSummary':
        if (!Array.isArray(data)) return <p className="no-data">Некорректные данные</p>;
        return (
          <table className="report-table">
            <thead>
              <tr><th>Кассир</th><th>Операций</th><th>BUY</th><th>SELL</th><th>CONVERT</th><th>Оборот</th><th>Возвраты</th><th>Сторно</th></tr>
            </thead>
            <tbody>
              {data.map((row: any) => (
                <tr key={row.cashierId}>
                  <td>{row.cashierName || '—'}</td>
                  <td>{safeNumber(row.totalOperations)}</td>
                  <td>{safeNumber(row.sumBuy).toFixed(2)}</td>
                  <td>{safeNumber(row.sumSell).toFixed(2)}</td>
                  <td>{safeNumber(row.sumConvert).toFixed(2)}</td>
                  <td>{safeNumber(row.totalTurnover).toFixed(2)}</td>
                  <td>{safeNumber(row.refundCount)}</td>
                  <td>{safeNumber(row.stornoCount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        );
      case 'purchaseRegister':
        if (!Array.isArray(data)) return <p className="no-data">Нет данных</p>;
        return (
          <div>
            <table className="report-table">
              <thead><tr><th>Время</th><th>Клиент</th><th>Паспорт</th><th>Валюта</th><th>Сумма</th><th>Курс (BYN)</th><th>Сумма BYN</th><th>Кассир</th></tr></thead>
              <tbody>
                {data.map((item: any, idx: number) => (
                  <tr key={idx}>
                    <td>{new Date(item.date).toLocaleTimeString()}</td>
                    <td>{item.clientName || 'Аноним'}</td>
                    <td>{item.passport || '—'}</td>
                    <td>{item.currency || '—'}</td>
                    <td>{safeNumber(item.amount).toFixed(2)}</td>
                    <td>{safeNumber(item.rate).toFixed(4)}</td>
                    <td>{safeNumber(item.amountBYN).toFixed(2)}</td>
                    <td>{item.cashier || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="summary-cards">
              <div className="summary-card">ИТОГО: {data.reduce((sum: number, i: any) => sum + safeNumber(i.amountBYN), 0).toFixed(2)} BYN</div>
            </div>
          </div>
        );
      case 'saleRegister':
        if (!Array.isArray(data)) return <p className="no-data">Нет данных</p>;
        return (
          <div>
            <table className="report-table">
              <thead><tr><th>Время</th><th>Клиент</th><th>Паспорт</th><th>Валюта</th><th>Сумма</th><th>Курс (BYN)</th><th>Сумма BYN</th><th>Кассир</th></tr></thead>
              <tbody>
                {data.map((item: any, idx: number) => (
                  <tr key={idx}>
                    <td>{new Date(item.date).toLocaleTimeString()}</td>
                    <td>{item.clientName || 'Аноним'}</td>
                    <td>{item.passport || '—'}</td>
                    <td>{item.currency || '—'}</td>
                    <td>{safeNumber(item.amount).toFixed(2)}</td>
                    <td>{safeNumber(item.rate).toFixed(4)}</td>
                    <td>{safeNumber(item.amountBYN).toFixed(2)}</td>
                    <td>{item.cashier || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="summary-cards">
              <div className="summary-card">ИТОГО: {data.reduce((sum: number, i: any) => sum + safeNumber(i.amountBYN), 0).toFixed(2)} BYN</div>
            </div>
          </div>
        );
      case 'conversionRegister':
        if (!Array.isArray(data)) return <p className="no-data">Нет данных</p>;
        return (
          <table className="report-table">
            <thead><tr><th>Время</th><th>Клиент</th><th>Паспорт</th><th>Из валюты</th><th>Сумма</th><th>В валюту</th><th>Сумма</th><th>Курс</th><th>Кассир</th></tr></thead>
            <tbody>
              {data.map((item: any, idx: number) => (
                <tr key={idx}>
                  <td>{new Date(item.date).toLocaleTimeString()}</td>
                  <td>{item.clientName || 'Аноним'}</td>
                  <td>{item.passport || '—'}</td>
                  <td>{item.fromCurrency || '—'}</td>
                  <td>{safeNumber(item.fromAmount).toFixed(2)}</td>
                  <td>{item.toCurrency || '—'}</td>
                  <td>{safeNumber(item.toAmount).toFixed(2)}</td>
                  <td>{safeNumber(item.rate).toFixed(4)}</td>
                  <td>{item.cashier || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        );
      case 'daily':
        if (!Array.isArray(data)) return <p className="no-data">Нет данных</p>;
        return (
          <table className="report-table">
            <thead><tr><th>Дата</th><th>Операций</th><th>BUY оборот</th><th>SELL оборот</th><th>CONVERT оборот</th><th>Общий оборот</th><th>Возвраты</th><th>Сторно</th></tr></thead>
            <tbody>
              {data.map((row: any) => (
                <tr key={row.date}>
                  <td>{row.date || '—'}</td>
                  <td>{safeNumber(row.totalOperations)}</td>
                  <td>{safeNumber(row.buyTurnover).toFixed(2)}</td>
                  <td>{safeNumber(row.sellTurnover).toFixed(2)}</td>
                  <td>{safeNumber(row.convertTurnover).toFixed(2)}</td>
                  <td>{safeNumber(row.totalTurnover).toFixed(2)}</td>
                  <td>{safeNumber(row.refunds)}</td>
                  <td>{safeNumber(row.storno)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        );
      case 'hourly':
        if (!Array.isArray(data)) return <p className="no-data">Нет данных</p>;
        return (
          <table className="report-table">
            <thead><tr><th>Час</th><th>Кол-во операций</th><th>Оборот (BYN)</th></tr></thead>
            <tbody>
              {data.map((row: any) => (
                <tr key={row.hour}>
                  <td>{row.hour}:00-{row.hour+1}:00</td>
                  <td>{safeNumber(row.count)}</td>
                  <td>{safeNumber(row.totalAmount).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        );
      default:
        return null;
    }
  };

  const exportExcel = async () => {
    let exportUrl = '';
    const params: any = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    if (cashierId) params.cashierId = cashierId;
    const query = new URLSearchParams(params).toString();

    switch (activeTab) {
      case 'cashierSummary':
        exportUrl = '/reports/export/cashier-summary';
        break;
      case 'daily':
        exportUrl = '/reports/export/daily';
        break;
      case 'hourly':
        exportUrl = '/reports/export/hourly';
        break;
      default:
        toast.error('Экспорт Excel для данного отчёта не реализован');
        return;
    }
    try {
      const response = await api.get(`${exportUrl}?${query}`, { responseType: 'blob' });
      const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${activeTab}.xlsx`;
      link.click();
      URL.revokeObjectURL(link.href);
      toast.success('Экспорт выполнен');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Ошибка экспорта');
    }
  };

  const exportPdf = async () => {
    let exportUrl = '';
    const params: any = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    if (cashierId) params.cashierId = cashierId;
    const query = new URLSearchParams(params).toString();

    switch (activeTab) {
      case 'cashierSummary':
        exportUrl = '/reports/export/pdf/cashier-summary';
        break;
      case 'daily':
        exportUrl = '/reports/export/pdf/daily';
        break;
      case 'hourly':
        exportUrl = '/reports/export/pdf/hourly';
        break;
      default:
        toast.error('Экспорт PDF не реализован');
        return;
    }
    try {
      const response = await api.get(`${exportUrl}?${query}`, { responseType: 'blob' });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${activeTab}.pdf`;
      link.click();
      URL.revokeObjectURL(link.href);
      toast.success('PDF сформирован');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Ошибка PDF');
    }
  };

  const showExport = ['cashierSummary', 'daily', 'hourly'].includes(activeTab);

  return (
    <div className="container advanced-reports">
      <h1>Кассовые отчёты</h1>
      <div className="tabs">
        <button className={activeTab === 'cashierSummary' ? 'active' : ''} onClick={() => setActiveTab('cashierSummary')}>Справка кассира</button>
        <button className={activeTab === 'purchaseRegister' ? 'active' : ''} onClick={() => setActiveTab('purchaseRegister')}>Реестр покупки</button>
        <button className={activeTab === 'saleRegister' ? 'active' : ''} onClick={() => setActiveTab('saleRegister')}>Реестр продажи</button>
        <button className={activeTab === 'conversionRegister' ? 'active' : ''} onClick={() => setActiveTab('conversionRegister')}>Реестр конверсий</button>
        <button className={activeTab === 'daily' ? 'active' : ''} onClick={() => setActiveTab('daily')}>Суточный Z-отчёт</button>
        <button className={activeTab === 'hourly' ? 'active' : ''} onClick={() => setActiveTab('hourly')}>Почасовой</button>
      </div>

      <div className="filters-panel">
        <div className="date-filters">
          <Input type="date" label="Дата от" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          <Input type="date" label="Дата до" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </div>
        {activeTab === 'cashierSummary' && (
          <Select value={cashierId} onChange={(e) => setCashierId(e.target.value)} options={[{ value: '', label: 'Все кассиры' }, ...usersList.map(u => ({ value: u.id, label: u.fullName }))]} />
        )}
        <Button onClick={fetchReport} disabled={loading}>Сформировать</Button>
        {showExport && <Button onClick={exportExcel} variant="secondary">Excel</Button>}
        {showExport && <Button onClick={exportPdf} variant="secondary">PDF</Button>}
      </div>

      <div className="report-content">{loading ? <div className="loader">Загрузка...</div> : renderReport()}</div>
    </div>
  );
};

export default CashReportsPage;
import React, { useState } from 'react';
import { Button, Input } from '../../components/Shared';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import '../../styles/advancedreports.css';

type FinSubReport = 'profitLoss' | 'margin' | 'consolidated' | 'detailed';

const safeNumber = (value: any, defaultValue: number = 0): number => {
  const num = Number(value);
  return isNaN(num) ? defaultValue : num;
};

const FinancialAnalysisPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<FinSubReport>('profitLoss');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [totalPages, setTotalPages] = useState(1);

  const fetchReport = async () => {
    setLoading(true);
    try {
      let url = '';
      const params: any = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      if (activeTab === 'detailed') {
        params.page = page;
        params.limit = limit;
      }
      switch (activeTab) {
        case 'profitLoss': url = '/reports/profit-loss'; break;
        case 'margin': url = '/reports/margin'; break;
        case 'consolidated': url = '/reports/consolidated-turnover'; break;
        case 'detailed': url = '/reports/detailed-turnover'; break;
      }
      const res = await api.get(url, { params });
      setData(res.data);
      if (activeTab === 'detailed') setTotalPages(res.data.totalPages || 1);
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
      case 'profitLoss':
        return (
          <div>
            <div className="summary-cards"><div className="summary-card profit">Общая прибыль: {safeNumber(data.totalProfit).toFixed(2)} BYN</div></div>
            <table className="report-table"><thead><tr><th>ID операции</th><th>Тип</th><th>Прибыль (BYN)</th><th>Описание</th><th>Дата</th></tr></thead><tbody>
              {data.details?.map((d: any) => (<tr key={d.transactionId}><td>{d.transactionId?.slice(0,8)}</td><td>{d.type === 'BUY' ? 'Покупка' : d.type === 'SELL' ? 'Продажа' : 'Конверсия'}</td><td className={safeNumber(d.profit)>=0?'profit':'loss'}>{safeNumber(d.profit).toFixed(2)}</td><td>{d.description}</td><td>{new Date(d.createdAt).toLocaleString()}</td></tr>))}
            </tbody></table>
          </div>
        );
      case 'margin':
        return (
          <table className="report-table"><thead><tr><th>Валюта</th><th>Покупка</th><th>Продажа</th><th>Спред</th><th>Маржа %</th></tr></thead><tbody>
              {data.margins?.map((m: any) => (<tr key={m.currency}><td>{m.currency}</td><td>{safeNumber(m.buyRate).toFixed(4)}</td><td>{safeNumber(m.sellRate).toFixed(4)}</td><td>{safeNumber(m.spread).toFixed(4)}</td><td>{m.marginPercent || '0'}%</td></tr>))}
          </tbody></table>
        );
      case 'consolidated':
        if (!Array.isArray(data)) return <p>Некорректные данные</p>;
        return (
          <table className="report-table"><thead><tr><th>Валюта</th><th>Покупка</th><th>Продажа</th><th>Конверсия</th><th>Всего</th></tr></thead><tbody>
            {data.map((row: any) => (<tr key={row.currency}><td>{row.currency}</td><td>{safeNumber(row.buy).toFixed(2)}</td><td>{safeNumber(row.sell).toFixed(2)}</td><td>{safeNumber(row.convert).toFixed(2)}</td><td>{safeNumber(row.total).toFixed(2)}</td></tr>))}
          </tbody></table>
        );
      case 'detailed':
        if (!data?.items) return <p>Нет данных</p>;
        return (
          <div>
            <div className="pagination-controls">
              <div className="page-size"><label>Записей на странице:</label><select value={limit} onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}><option value="10">10</option><option value="20">20</option><option value="50">50</option><option value="100">100</option></select></div>
              <div className="pagination-buttons"><Button variant="secondary" onClick={() => setPage(p=>Math.max(1,p-1))} disabled={page===1}>Назад</Button><span>Страница {page} из {totalPages}</span><Button variant="secondary" onClick={() => setPage(p=>Math.min(totalPages,p+1))} disabled={page===totalPages}>Вперёд</Button></div>
            </div>
            <table className="report-table"><thead><tr><th>ID</th><th>Тип</th><th>Отдано</th><th>Валюта</th><th>Получено</th><th>Валюта</th><th>Курс</th><th>Кассир</th><th>Клиент</th><th>Дата</th></tr></thead><tbody>
              {data.items.map((item: any) => (<tr key={item.id}><td>{item.id?.slice(0,8)}</td><td>{item.type === 'BUY' ? 'Покупка' : item.type === 'SELL' ? 'Продажа' : 'Конверсия'}</td><td>{safeNumber(item.amountIn).toFixed(2)}</td><td>{item.currencyIn}</td><td>{safeNumber(item.amountOut).toFixed(2)}</td><td>{item.currencyOut}</td><td className="rate-cell">{safeNumber(item.rate).toFixed(4)}</td><td>{item.cashierName}</td><td>{item.clientName}</td><td>{new Date(item.date).toLocaleString()}</td></tr>))}
            </tbody></table>
          </div>
        );
      default: return null;
    }
  };

  const exportExcel = async () => {
    let exportUrl = '';
    const params: any = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    const query = new URLSearchParams(params).toString();
    switch (activeTab) {
      case 'consolidated': exportUrl = '/reports/export/consolidated'; break;
      case 'detailed': exportUrl = '/reports/export/detailed'; break;
      default: toast.error('Экспорт Excel не реализован'); return;
    }
    try {
      const response = await api.get(`${exportUrl}?${query}`, { responseType: 'blob' });
      const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = `${activeTab}.xlsx`; link.click(); URL.revokeObjectURL(link.href);
      toast.success('Экспорт выполнен');
    } catch (err: any) { toast.error('Ошибка экспорта'); }
  };

  const exportPdf = async () => {
    let exportUrl = '';
    const params: any = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    const query = new URLSearchParams(params).toString();
    switch (activeTab) {
      case 'consolidated': exportUrl = '/reports/export/pdf/consolidated'; break;
      case 'detailed': exportUrl = '/reports/export/pdf/detailed'; break;
      default: toast.error('PDF не реализован'); return;
    }
    try {
      const response = await api.get(`${exportUrl}?${query}`, { responseType: 'blob' });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = `${activeTab}.pdf`; link.click(); URL.revokeObjectURL(link.href);
      toast.success('PDF сформирован');
    } catch (err: any) { toast.error('Ошибка PDF'); }
  };

  const showExport = ['consolidated', 'detailed'].includes(activeTab);

  return (
    <div className="container advanced-reports">
      <h1>Финансовый анализ</h1>
      <div className="tabs">
        <button className={activeTab === 'profitLoss' ? 'active' : ''} onClick={() => setActiveTab('profitLoss')}>Прибыль/убыток</button>
        <button className={activeTab === 'margin' ? 'active' : ''} onClick={() => setActiveTab('margin')}>Маржа</button>
        <button className={activeTab === 'consolidated' ? 'active' : ''} onClick={() => setActiveTab('consolidated')}>Сводный оборот</button>
        <button className={activeTab === 'detailed' ? 'active' : ''} onClick={() => setActiveTab('detailed')}>Развёрнутый оборот</button>
      </div>
      <div className="filters-panel">
        <div className="date-filters">
          <Input type="date" label="Дата от" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          <Input type="date" label="Дата до" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </div>
        <Button onClick={fetchReport} disabled={loading}>Сформировать</Button>
        {showExport && <Button onClick={exportExcel} variant="secondary">Excel</Button>}
        {showExport && <Button onClick={exportPdf} variant="secondary">PDF</Button>}
      </div>
      <div className="report-content">{loading ? <div className="loader">Загрузка...</div> : renderReport()}</div>
    </div>
  );
};

export default FinancialAnalysisPage;
import React, { useState, useEffect } from 'react';
import { Button, Input, Select } from '../../components/Shared';
import api from '../../api/axios';
import { getControlTape, getSystemAudit } from '../../api/reports';
import toast from 'react-hot-toast';
import '../../styles/advancedreports.css';

type AuditSubReport = 'controlTape' | 'systemAudit' | 'refunds' | 'storno' | 'cashierOps';

const safeNumber = (value: any, defaultValue: number = 0): number => {
  const num = Number(value);
  return isNaN(num) ? defaultValue : num;
};

const systemActionLabels: Record<string, string> = {
  LOGIN: 'Вход',
  LOGOUT: 'Выход',
  EXPORT_PDF: 'Экспорт PDF',
  EXPORT_EXCEL: 'Экспорт Excel',
  GENERATE_REPORT: 'Генерация отчёта',
  UPDATE_CASH_LIMIT: 'Изменение лимита',
  ADMIN_BLOCK_SHIFT: 'Блокировка смены',
};

const resultLabels: Record<string, string> = {
  SUCCESS: 'Успешно',
  ERROR: 'Ошибка',
  CANCEL: 'Отмена',
  CANCELLED: 'Отменён',
  STORNO: 'Сторнирован',
  REFUNDED: 'Возвращён',
  PENDING: 'Ожидание',
  COMPLETED: 'Завершён',
  FAILED: 'Не удалось',
};

const statusLabels: Record<string, string> = {
  COMPLETED: 'Завершена',
  CANCELLED: 'Отменена',
  CANCEL: 'Отмена',
  STORNO: 'Сторнирована',
  REFUNDED: 'Возвращена',
  PENDING: 'В ожидании',
  ACTIVE: 'Активна',
  CLOSED: 'Закрыта',
  BLOCKED: 'Заблокирована',
};

const translateSystemAction = (action: string): string => systemActionLabels[action] || action;
const translateResult = (result: string): string => resultLabels[result] || result;
const translateStatus = (status: string): string => statusLabels[status] || status;

// Определение CSS-класса для бейджа статуса (аналогично history.css)
const getStatusClass = (status: string): string => {
  const upperStatus = status?.toUpperCase() || '';
  if (upperStatus === 'ACTIVE' || upperStatus === 'COMPLETED') return 'status-active';
  if (upperStatus === 'STORNO') return 'status-storno';
  if (upperStatus === 'REFUNDED') return 'status-refunded';
  if (upperStatus === 'CANCELLED' || upperStatus === 'CANCEL') return 'status-storno';
  return 'status-active';
};

const AuditControlPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AuditSubReport>('controlTape');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [cashierId, setCashierId] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [usersList, setUsersList] = useState<any[]>([]);
  const [controlTapeData, setControlTapeData] = useState<any[] | null>(null);
  const [systemAuditData, setSystemAuditData] = useState<any[] | null>(null);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const { data } = await api.get('/users');
      setUsersList(data);
    } catch (err) { console.error(err); }
  };

  const fetchReport = async () => {
    setLoading(true);
    try {
      if (activeTab === 'controlTape') {
        const tape = await getControlTape(startDate, endDate);
        setControlTapeData(tape);
        setSystemAuditData(null);
        setData(null);
        toast.success('Контрольная лента загружена');
      } else if (activeTab === 'systemAudit') {
        const audit = await getSystemAudit(startDate, endDate, actionFilter);
        setSystemAuditData(audit);
        setControlTapeData(null);
        setData(null);
        toast.success('Системный аудит загружен');
      } else {
        let url = '';
        const params: any = {};
        if (startDate) params.startDate = startDate;
        if (endDate) params.endDate = endDate;
        if (cashierId) params.cashierId = cashierId;
        switch (activeTab) {
          case 'refunds':
            url = '/reports/refunds';
            break;
          case 'storno':
            url = '/reports/storno';
            break;
          case 'cashierOps':
            url = '/reports/cashier-operations';
            break;
        }
        const res = await api.get(url, { params });
        setData(res.data);
        setControlTapeData(null);
        setSystemAuditData(null);
        toast.success('Отчёт загружен');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Ошибка');
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  const renderReport = () => {
    if (activeTab === 'controlTape') {
      if (!controlTapeData) return <p className="no-data">Нажмите «Сформировать»</p>;
      if (controlTapeData.length === 0) return <p className="no-data">Нет операций</p>;
      return (
        <table className="report-table">
          <thead>
            <tr>
              <th>№ чека</th><th>Дата/время</th><th>Тип</th><th>Отдано</th><th>Получено</th><th>Нал/Безнал</th><th>Кассир</th><th>Статус</th>
            </tr>
          </thead>
          <tbody>
            {controlTapeData.map((item, idx) => (
              <tr key={item.checkNumber || idx}>
                <td>{item.checkNumber}</td>
                <td>{new Date(item.date).toLocaleString()}</td>
                <td>{item.operationType === 'BUY' ? 'Покупка' : item.operationType === 'SELL' ? 'Продажа' : 'Конверсия'}</td>
                <td>{safeNumber(item.amountIn).toFixed(2)} {item.currencyIn}</td>
                <td>{safeNumber(item.amountOut).toFixed(2)} {item.currencyOut}</td>
                <td>{item.paymentType === 'CASH' ? 'Наличные' : 'Безналичные'}</td>
                <td>{item.cashierName || '—'}</td>
                <td>
                  <span className={getStatusClass(item.status)}>
                    {translateStatus(item.status)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      );
    }
    if (activeTab === 'systemAudit') {
      if (!systemAuditData) return <p className="no-data">Нажмите «Сформировать»</p>;
      if (systemAuditData.length === 0) return <p className="no-data">Нет событий</p>;
      return (
        <table className="report-table">
          <thead>
            <tr><th>Время</th><th>Пользователь</th><th>Действие</th><th>Результат</th><th>Детали</th></tr>
          </thead>
          <tbody>
            {systemAuditData.map((log, idx) => (
              <tr key={log.id || idx}>
                <td>{new Date(log.createdAt).toLocaleString()}</td>
                <td>{log.userFullName || '—'}</td>
                <td>{translateSystemAction(log.action)}</td>
                <td className={`log-result log-result-${log.result?.toLowerCase() || 'unknown'}`}>
                  {translateResult(log.result)}
                </td>
                <td>{log.details || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      );
    }
    if (!data) return <p className="no-data">Нажмите «Сформировать»</p>;

    if (activeTab === 'refunds' && data.items) {
      return (
        <div>
          <div className="summary-cards">
            <div className="summary-card">Всего возвратов: {safeNumber(data.totalCount)}</div>
            <div className="summary-card">Сумма: {safeNumber(data.totalAmount).toFixed(2)} BYN</div>
          </div>
          <table className="report-table">
            <thead><tr><th>ID</th><th>Кассир</th><th>Сумма</th><th>Валюта</th><th>Причина</th><th>Дата</th></tr></thead>
            <tbody>
              {data.items.map((item: any) => (
                <tr key={item.transactionId}>
                  <td>{item.transactionId?.slice(0,8)}</td>
                  <td>{item.cashierName}</td>
                  <td>{safeNumber(item.amountIn).toFixed(2)}</td>
                  <td>{item.currencyIn}</td>
                  <td>{item.reason}</td>
                  <td>{new Date(item.date).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }
    if (activeTab === 'storno' && data.items) {
      return (
        <div>
          <div className="summary-cards">
            <div className="summary-card">Всего сторно: {safeNumber(data.totalCount)}</div>
            <div className="summary-card">Сумма: {safeNumber(data.totalAmount).toFixed(2)} BYN</div>
          </div>
          <table className="report-table">
            <thead><tr><th>ID</th><th>Кассир</th><th>Сумма</th><th>Валюта</th><th>Причина</th><th>Дата</th></tr></thead>
            <tbody>
              {data.items.map((item: any) => (
                <tr key={item.transactionId}>
                  <td>{item.transactionId?.slice(0,8)}</td>
                  <td>{item.cashierName}</td>
                  <td>{safeNumber(item.amountIn).toFixed(2)}</td>
                  <td>{item.currencyIn}</td>
                  <td>{item.reason}</td>
                  <td>{new Date(item.date).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }
    if (activeTab === 'cashierOps') {
      if (data.cashiers) {
        return (
          <table className="report-table">
            <thead><tr><th>Кассир</th><th>Операций</th><th>Оборот BYN</th><th>Покупок</th><th>Продаж</th><th>Конверсий</th></tr></thead>
            <tbody>
              {data.cashiers.map((c: any) => (
                <tr key={c.cashierId}>
                  <td>{c.cashierName}</td>
                  <td>{safeNumber(c.totalOperations)}</td>
                  <td>{safeNumber(c.totalTurnoverBYN).toFixed(2)}</td>
                  <td>{safeNumber(c.buyCount)}</td>
                  <td>{safeNumber(c.sellCount)}</td>
                  <td>{safeNumber(c.convertCount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        );
      } else {
        return (
          <div>
            <h3>Операции кассира: {data.cashier?.name}</h3>
            <table className="report-table">
              <thead><tr><th>Дата</th><th>Тип</th><th>Отдано</th><th>Получено</th><th>Клиент</th></tr></thead>
              <tbody>
                {data.transactions?.map((tx: any) => (
                  <tr key={tx.id}>
                    <td>{new Date(tx.createdAt).toLocaleString()}</td>
                    <td>{tx.type === 'BUY' ? 'Покупка' : tx.type === 'SELL' ? 'Продажа' : 'Конверсия'}</td>
                    <td>{safeNumber(tx.sumIn).toFixed(2)} {tx.currencyIn}</td>
                    <td>{safeNumber(tx.sumOut).toFixed(2)} {tx.currencyOut}</td>
                    <td>{tx.clientName}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      }
    }
    return <p className="no-data">Нет данных</p>;
  };

  const exportExcel = async () => {
    let exportUrl = '';
    const params: any = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    if (cashierId) params.cashierId = cashierId;
    const query = new URLSearchParams(params).toString();
    switch (activeTab) {
      case 'refunds': exportUrl = '/reports/export/refunds'; break;
      case 'storno': exportUrl = '/reports/export/storno'; break;
      case 'controlTape': exportUrl = '/reports/export/control-tape'; break;
      case 'systemAudit': exportUrl = '/reports/export/system-audit'; break;
      default: toast.error('Экспорт не реализован'); return;
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
    } catch (err: any) { toast.error('Ошибка экспорта'); }
  };

  const exportPdf = async () => {
    let exportUrl = '';
    const params: any = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    if (cashierId) params.cashierId = cashierId;
    const query = new URLSearchParams(params).toString();
    switch (activeTab) {
      case 'refunds': exportUrl = '/reports/export/pdf/refunds'; break;
      case 'storno': exportUrl = '/reports/export/pdf/storno'; break;
      case 'controlTape': exportUrl = '/reports/export/pdf/control-tape'; break;
      case 'systemAudit': exportUrl = '/reports/export/pdf/audit-log'; break;
      default: toast.error('PDF не реализован'); return;
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
    } catch (err: any) { toast.error('Ошибка PDF'); }
  };

  const showExport = ['refunds', 'storno', 'controlTape', 'systemAudit'].includes(activeTab);

  return (
    <div className="container advanced-reports">
      <h1>Аудит и контроль</h1>
      <div className="tabs">
        <button className={activeTab === 'controlTape' ? 'active' : ''} onClick={() => setActiveTab('controlTape')}>Журнал кассовых операций</button>
        <button className={activeTab === 'systemAudit' ? 'active' : ''} onClick={() => setActiveTab('systemAudit')}>Системный аудит</button>
        <button className={activeTab === 'refunds' ? 'active' : ''} onClick={() => setActiveTab('refunds')}>Возвраты</button>
        <button className={activeTab === 'storno' ? 'active' : ''} onClick={() => setActiveTab('storno')}>Сторно</button>
        <button className={activeTab === 'cashierOps' ? 'active' : ''} onClick={() => setActiveTab('cashierOps')}>Операции кассиров</button>
      </div>
      <div className="filters-panel">
        <div className="date-filters">
          <Input type="date" label="Дата от" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          <Input type="date" label="Дата до" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </div>
        {activeTab === 'systemAudit' && (
          <Select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            options={[
              { value: '', label: 'Все действия' },
              { value: 'LOGIN', label: 'Вход' },
              { value: 'LOGOUT', label: 'Выход' },
              { value: 'EXPORT_PDF', label: 'Экспорт PDF' },
              { value: 'EXPORT_EXCEL', label: 'Экспорт Excel' },
              { value: 'GENERATE_REPORT', label: 'Генерация отчёта' },
              { value: 'UPDATE_CASH_LIMIT', label: 'Изменение лимита' },
              { value: 'ADMIN_BLOCK_SHIFT', label: 'Блокировка смены' }
            ]}
          />
        )}
        {(activeTab === 'refunds' || activeTab === 'storno' || activeTab === 'cashierOps') && (
          <Select
            value={cashierId}
            onChange={(e) => setCashierId(e.target.value)}
            options={[{ value: '', label: 'Все кассиры' }, ...usersList.map(u => ({ value: u.id, label: u.fullName }))]}
          />
        )}
        <Button onClick={fetchReport} disabled={loading}>Сформировать</Button>
        {showExport && <Button onClick={exportExcel} variant="secondary">Excel</Button>}
        {showExport && <Button onClick={exportPdf} variant="secondary">PDF</Button>}
      </div>
      <div className="report-content">{loading ? <div className="loader">Загрузка...</div> : renderReport()}</div>
    </div>
  );
};

export default AuditControlPage;
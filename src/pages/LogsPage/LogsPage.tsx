import React, { useState, useEffect, useMemo } from 'react';
import { getLogs, type LogEntry } from '../../api/logs';
import { Button, Input, Select } from '../../components/Shared';
import Loader from '../../components/Shared/Loader';
import toast from 'react-hot-toast';
import '../../styles/logs.css';

// Словарь перевода действий
const actionLabels: Record<string, string> = {
  LOGIN: 'Вход',
  LOGOUT: 'Выход',
  CREATE_TRANSACTION: 'Создание операции',
  DELETE_TRANSACTION: 'Удаление операции',
  UPDATE_CASH_LIMIT: 'Изменение лимита',
  GENERATE_REPORT: 'Генерация отчёта',
  EXPORT_PDF: 'Экспорт PDF',
  EXPORT_EXCEL: 'Экспорт Excel',
  STORNO_OPERATION: 'Сторно операции',
  REFUND_OPERATION: 'Возврат операции',
};

// Словарь перевода результатов
const resultLabels: Record<string, string> = {
  SUCCESS: 'Успешно',
  ERROR: 'Ошибка',
  CANCEL: 'Отмена',
};

const actionOptions = [
  { value: '', label: 'Все действия' },
  { value: 'LOGIN', label: 'Вход' },
  { value: 'LOGOUT', label: 'Выход' },
  { value: 'CREATE_TRANSACTION', label: 'Создание операции' },
  { value: 'DELETE_TRANSACTION', label: 'Удаление операции' },
  { value: 'UPDATE_CASH_LIMIT', label: 'Изменение лимита' },
  { value: 'GENERATE_REPORT', label: 'Генерация отчёта' },
  { value: 'EXPORT_PDF', label: 'Экспорт PDF' },
  { value: 'EXPORT_EXCEL', label: 'Экспорт Excel' },
  { value: 'STORNO_OPERATION', label: 'Сторно операции' },
  { value: 'REFUND_OPERATION', label: 'Возврат операции' },
];

const resultOptions = [
  { value: '', label: 'Все результаты' },
  { value: 'SUCCESS', label: 'Успешно' },
  { value: 'ERROR', label: 'Ошибка' },
  { value: 'CANCEL', label: 'Отмена' },
];

const pageSizeOptions = [10, 25, 50, 100];

const LogsPage: React.FC = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    action: '',
    result: '',
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;
      if (filters.action) params.action = filters.action;
      if (filters.result) params.result = filters.result;
      
      const data = await getLogs(params);
      setLogs(data);
      setCurrentPage(1);
    } catch (err) {
      toast.error('Ошибка загрузки логов');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLogs();
  };

  const clearFilters = () => {
    setFilters({ startDate: '', endDate: '', action: '', result: '' });
    setTimeout(fetchLogs, 0);
  };

  const totalPages = Math.ceil(logs.length / pageSize);
  const paginatedLogs = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    return logs.slice(start, end);
  }, [logs, currentPage, pageSize]);

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const formatAmount = (amount: number | string | null | undefined): string => {
    if (amount === null || amount === undefined) return '—';
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(num)) return '—';
    return num.toFixed(2);
  };

  // Функции перевода
  const translateAction = (action: string): string => actionLabels[action] || action;
  const translateResult = (result: string): string => resultLabels[result] || result;

  if (loading) return <Loader />;

  return (
    <div className="container logs-container">
      <h1 className="logs-title">Системные логи</h1>

      <form onSubmit={handleSubmit} className="logs-filters">
        <div className="filter-row">
          <Input
            type="date"
            label="Дата от"
            name="startDate"
            value={filters.startDate}
            onChange={handleInputChange}
          />
          <Input
            type="date"
            label="Дата до"
            name="endDate"
            value={filters.endDate}
            onChange={handleInputChange}
          />
          <Select
            name="action"
            value={filters.action}
            onChange={handleSelectChange}
            options={actionOptions}
          />
          <Select
            name="result"
            value={filters.result}
            onChange={handleSelectChange}
            options={resultOptions}
          />
        </div>
        <div className="filter-buttons">
          <Button type="submit">Применить фильтры</Button>
          <Button type="button" variant="secondary" onClick={clearFilters}>
            Сбросить
          </Button>
        </div>
      </form>

      <div className="pagination-controls">
        <div className="page-size-selector">
          <label>Записей на странице:</label>
          <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}>
            {pageSizeOptions.map(size => (
              <option key={size} value={size}>{size}</option>
            ))}
          </select>
        </div>
        <div className="pagination-buttons">
          <Button variant="secondary" onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1}>
            Назад
          </Button>
          <span className="page-info">
            Страница {currentPage} из {totalPages || 1}
          </span>
          <Button variant="secondary" onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages || totalPages === 0}>
            Вперёд
          </Button>
        </div>
      </div>

      <div className="logs-table-wrapper">
        <table className="logs-table">
          <thead>
            <tr>
              <th>Дата и время</th>
              <th>Пользователь</th>
              <th>Действие</th>
              <th>Сумма</th>
              <th>Валюта</th>
              <th>Результат</th>
              <th>Детали</th>
            </tr>
          </thead>
          <tbody>
            {paginatedLogs.map((log) => (
              <tr key={log.id}>
                <td>{new Date(log.createdAt).toLocaleString()}</td>
                <td>{log.userFullName}</td>
                <td>{translateAction(log.action)}</td>
                <td className="amount-cell">{formatAmount(log.amount)}</td>
                <td>{log.currency || '—'}</td>
                <td className={`log-result log-result-${log.result?.toLowerCase() || 'unknown'}`}>
                  {translateResult(log.result || '—')}
                </td>
                <td>{log.details}</td>
              </tr>
            ))}
            {paginatedLogs.length === 0 && (
              <tr>
                <td colSpan={7} className="no-data">
                  Логи не найдены
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="pagination-controls bottom">
          <div className="pagination-buttons">
            <Button variant="secondary" onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1}>
              Назад
            </Button>
            <span className="page-info">
              Страница {currentPage} из {totalPages}
            </span>
            <Button variant="secondary" onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages}>
              Вперёд
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LogsPage;
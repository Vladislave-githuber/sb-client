import React, { useState, useEffect } from 'react';
import { useStore } from '../../store/useStore';
import { getCashierReport, getAdminReport, exportPdf, exportExcel, type CashierReportData, type AdminReportData } from '../../api/reports';
import { getUsers } from '../../api/users';
import { getReceiptByTransactionId, type ReceiptWithDetails } from '../../api/receipts';
import { Button, Input, Select } from '../../components/Shared';
import Loader from '../../components/Shared/Loader';
import ReceiptModal from '../../components/ReceiptModal/ReceiptModal';
import toast from 'react-hot-toast';
import '../../styles/reports.css';

const ReportsPage: React.FC = () => {
  const { currentCashier } = useStore();
  const isAdmin = currentCashier?.role === 'admin';
  const isEconomist = currentCashier?.role === 'economist';
  
  // Экономист видит отчёты как администратор (все данные)
  const canViewFullReports = isAdmin || isEconomist || currentCashier?.role === 'senior_cashier';

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedCashierId, setSelectedCashierId] = useState('');
  const [users, setUsers] = useState<Array<{ id: string; fullName: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<CashierReportData | AdminReportData | null>(null);

  // Чек
  const [selectedReceipt, setSelectedReceipt] = useState<ReceiptWithDetails | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  useEffect(() => {
    if (canViewFullReports) {
      getUsers().then(setUsers).catch(console.error);
    }
  }, [canViewFullReports]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (canViewFullReports) {
        const data = await getAdminReport(startDate, endDate, selectedCashierId || undefined);
        setReportData(data);
      } else {
        const data = await getCashierReport(startDate, endDate);
        setReportData(data);
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Ошибка загрузки отчёта');
    } finally {
      setLoading(false);
    }
  };

  const handleExportPdf = () => {
    const params: any = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    if (canViewFullReports && selectedCashierId) params.cashierId = selectedCashierId;
    exportPdf(params);
  };

  const handleExportExcel = () => {
    const params: any = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    if (selectedCashierId) params.cashierId = selectedCashierId;
    exportExcel(params);
  };

  const handleViewReceipt = async (transactionId: string) => {
    try {
      const receiptData = await getReceiptByTransactionId(transactionId);
      setSelectedReceipt(receiptData);
      setShowReceiptModal(true);
    } catch (err) {
      toast.error('Не удалось загрузить чек');
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="container">
      <h1 className="reports-title">Отчёты</h1>

      <form onSubmit={handleSubmit} className="reports-filters">
        <div className="date-filters">
          <Input
            type="date"
            label="Дата от"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <Input
            type="date"
            label="Дата до"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
        {canViewFullReports && (
          <Select
            value={selectedCashierId}
            onChange={(e) => setSelectedCashierId(e.target.value)}
            options={[
              { value: '', label: 'Все кассиры' },
              ...users.map(u => ({ value: u.id, label: u.fullName })),
            ]}
          />
        )}
        <Button type="submit">Сформировать</Button>
        {reportData && (
          <div className="export-buttons">
            <Button type="button" variant="secondary" onClick={handleExportPdf}>Экспорт PDF</Button>
            {canViewFullReports && (
              <Button type="button" variant="secondary" onClick={handleExportExcel}>Экспорт Excel</Button>
            )}
          </div>
        )}
      </form>

      {reportData && (
        <div className="report-content">
          <div className="report-summary">
            <h2>Итоги за период</h2>
            <p>Период: {new Date(reportData.period.from).toLocaleDateString()} - {new Date(reportData.period.to).toLocaleDateString()}</p>
            {!canViewFullReports && (reportData as CashierReportData).cashierName && (
              <p>Кассир: {(reportData as CashierReportData).cashierName}</p>
            )}
            <div className="summary-stats">
              <div className="stat-card">Всего операций: {Number(reportData.summary.totalOperations)}</div>
              <div className="stat-card">Оборот (BYN): {Number(reportData.summary.totalTurnoverBYN).toFixed(2)}</div>
              <div className="stat-card">Покупок: {Number(reportData.summary.byType.BUY)}</div>
              <div className="stat-card">Продаж: {Number(reportData.summary.byType.SELL)}</div>
              <div className="stat-card">Конверсий: {Number(reportData.summary.byType.CONVERT)}</div>
            </div>
          </div>

          {canViewFullReports && (reportData as AdminReportData).byCashier && (
            <div className="cashier-stats">
              <h3>Статистика по кассирам</h3>
              <table className="cashier-table">
                <thead>
                  <tr><th>Кассир</th><th>Операций</th><th>Оборот (BYN)</th></tr>
                </thead>
                <tbody>
                  {(reportData as AdminReportData).byCashier.map(c => (
                    <tr key={c.cashierName}>
                      <td>{c.cashierName}</td>
                      <td>{c.totalOperations}</td>
                      <td>{Number(c.totalTurnoverBYN).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="transactions-list">
            <h3>Детали операций</h3>
            <table className="transactions-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Дата</th>
                  <th>Тип</th>
                  <th>Отдано</th>
                  <th>Получено</th>
                  <th>Кассир</th>
                  <th>Чек</th>
                </tr>
              </thead>
              <tbody>
                {reportData.transactions.map(tx => (
                  <tr key={tx.id}>
                    <td>{tx.id}</td>
                    <td>{new Date(tx.createdAt).toLocaleString()}</td>
                    <td>{tx.type}</td>
                    <td>{tx.sumIn} {tx.currencyIn}</td>
                    <td>{tx.sumOut} {tx.currencyOut}</td>
                    <td>{tx.cashierName}</td>
                    <td>
                      <Button variant="secondary" onClick={() => handleViewReceipt(tx.id)}>
                        Чек
                      </Button>
                    </td>
                  </tr>
                ))}
                {reportData.transactions.length === 0 && (
                  <tr><td colSpan={7}>Нет операций за выбранный период</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <ReceiptModal
        isOpen={showReceiptModal}
        receiptData={selectedReceipt ? {
          transaction: selectedReceipt.transaction,
          cashier: selectedReceipt.cashier,
          officeNumber: selectedReceipt.receipt.officeNumber,
          date: new Date(selectedReceipt.receipt.createdAt).toLocaleString(),
        } : null}
        onClose={() => setShowReceiptModal(false)}
      />
    </div>
  );
};

export default ReportsPage;
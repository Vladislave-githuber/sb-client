import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import { useRates } from '../../hooks/useRates';
import CurrencyCard from '../../components/CurrencyCard/CurrencyCard';
import Loader from '../../components/Shared/Loader';
import { getTransactions } from '../../api/transactions';
import api from '../../api/axios';
import type { ITransaction } from '../../types';
import { pageConfig } from '../../components/PageConfig';
import '../../styles/dashboard.css';

const DashboardPage: React.FC = () => {
  const { currentCashier, cashBalances, fetchCashBalances, loadingBalances, errorBalances } = useStore();
  const { rates, loading: ratesLoading, error: ratesError } = useRates();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [transactions, setTransactions] = useState<ITransaction[]>([]);
  const [loadingTx, setLoadingTx] = useState(true);

  const [_suspiciousCount, setSuspiciousCount] = useState<number>(0);
  const [pendingApprovals, setPendingApprovals] = useState<number>(0);
  const [discrepancies, setDiscrepancies] = useState<{ count: number; totalDifference: number }>({
    count: 0,
    totalDifference: 0,
  });
  const [controlLoading, setControlLoading] = useState(false);

  const isAdminOrSenior = currentCashier?.role === 'admin' || currentCashier?.role === 'senior_cashier';

  const fetchControlData = async () => {
    if (!isAdminOrSenior) return;
    setControlLoading(true);
    try {
      const today = new Date().toISOString().slice(0, 10);
      const suspiciousRes = await api.get('/reports/suspicious', {
        params: { startDate: today, endDate: today },
      });
      setSuspiciousCount(suspiciousRes.data.transactions?.length || 0);

      const pendingRes = await api.get('/approvals/pending');
      setPendingApprovals(pendingRes.data.length);

      const recRes = await api.get('/cash-ledger/reconciliations');
      if (recRes.data.length) {
        const totalDiff = recRes.data.reduce((sum: number, rec: any) => sum + Math.abs(rec.difference), 0);
        setDiscrepancies({ count: recRes.data.length, totalDifference: totalDiff });
      } else {
        setDiscrepancies({ count: 0, totalDifference: 0 });
      }
    } catch (err) {
      console.error('Ошибка загрузки панели контроля:', err);
    } finally {
      setControlLoading(false);
    }
  };

  useEffect(() => {
    if (currentCashier) fetchCashBalances();
  }, [currentCashier, fetchCashBalances]);

  useEffect(() => {
    const loadTransactions = async () => {
      if (!currentCashier) return;
      try {
        setLoadingTx(true);
        const allTx = await getTransactions();
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayTx = allTx.filter(tx => {
          const txDate = new Date(tx.createdAt);
          return txDate >= today && tx.cashierId === String(currentCashier.id);
        });
        setTransactions(todayTx);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingTx(false);
      }
    };
    loadTransactions();
  }, [currentCashier]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    fetchControlData();
    const interval = setInterval(fetchControlData, 30000);
    return () => clearInterval(interval);
  }, [currentCashier]);

  const totalOperations = transactions.length;
  const totalTurnover = transactions.reduce((sum, tx) => sum + Number(tx.sumIn), 0);

  if (ratesLoading || loadingBalances || loadingTx) return <Loader />;
  if (ratesError || errorBalances) return <p className="error-message">{ratesError || errorBalances}</p>;

  // Определяем подпись роли
  let roleLabel = 'Кассир';
  if (currentCashier?.role === 'admin') roleLabel = 'Администратор';
  else if (currentCashier?.role === 'senior_cashier') roleLabel = 'Старший кассир';
  else if (currentCashier?.role === 'economist') roleLabel = 'Экономист';

  return (
    <div className="container dashboard">
      <h1 className="dashboard-title">Главная панель</h1>

      <div className="dashboard-cashier-info">
        <p><strong>{roleLabel}:</strong> {currentCashier?.fullName} (таб. №{currentCashier?.tabNumber})</p>
        <p><strong>Дата / время:</strong> {currentTime.toLocaleString()}</p>
      </div>

      <div className="dashboard-stats-grid">
        <div className="stat-card">
          <h3>Операций за смену</h3>
          <div className="stat-value">{totalOperations}</div>
        </div>
        <div className="stat-card">
          <h3>Оборот (BYN экв.)</h3>
          <div className="stat-value">{totalTurnover.toFixed(2)}</div>
        </div>
      </div>

      {/* Панель контроля только для админа/старшего кассира (экономист не видит) */}
      {isAdminOrSenior && (
        <div className="dashboard-control-panel">
          <h2>Панель контроля</h2>
          {controlLoading && <p>Загрузка...</p>}
          {!controlLoading && (
            <div className="control-stats-grid">
              <div className="control-card">
                <h4>Ожидают подтверждения</h4>
                <div className="control-value">{pendingApprovals}</div>
                <Link to={pageConfig.approvals} className="control-link">→ Обработать</Link>
              </div>
              <div className="control-card">
                <h4>Расхождения кассы</h4>
                <div className="control-value">{discrepancies.count}</div>
                <div className="control-sub">Отклонение: {discrepancies.totalDifference.toFixed(2)} BYN</div>
                <Link to={pageConfig.cash_reconciliation} className="control-link">→ Сверка</Link>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Остатки в кассе – видит экономист */}
      <div className="dashboard-section">
        <h2>Остатки в кассе</h2>
        <table className="balances-table">
          <thead>
            <tr><th>Валюта</th><th>Остаток</th></tr>
          </thead>
          <tbody>
            {cashBalances.map(bal => (
              <tr key={bal.currencyCode}>
                <td>{bal.currencyCode}</td>
                <td>{Number(bal.amount).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Курсы валют – видит экономист */}
      <div className="dashboard-section">
        <h2>Текущие курсы валют</h2>
        <div className="rates-list">
          {rates.map(curr => (
            <CurrencyCard key={curr.code} currency={curr} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import { useStore } from '../../store/useStore';
import Loader from '../../components/Shared/Loader';
import '../../styles/cashledger.css';

const CashLedgerPage: React.FC = () => {
  const { currentShift, setCurrentShift } = useStore();
  const [ledger, setLedger] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Загружаем текущую смену, если её нет в store
  useEffect(() => {
    const fetchShift = async () => {
      try {
        const response = await api.get('/shifts/current');
        setCurrentShift(response.data);
      } catch (err: any) {
        if (err.response?.status === 404) {
          setCurrentShift(null);
        } else {
          console.error('Ошибка загрузки смены:', err);
        }
      }
    };
    if (!currentShift) {
      fetchShift();
    }
  }, [currentShift, setCurrentShift]);

  // Загружаем данные кассы (ledger) после того, как смена известна
  const fetchLedger = async () => {
    if (!currentShift) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get('/cash-ledger/current');
      setLedger(data.currencies || []);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Ошибка загрузки данных кассы');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLedger();
  }, [currentShift]);

  if (loading) return <Loader />;
  if (error) return <div className="container error-message">{error}</div>;
  if (!currentShift) {
    return (
      <div className="container">
        <h1>Информация по кассе</h1>
        <p>Смена не открыта. Откройте смену для просмотра баланса кассы.</p>
      </div>
    );
  }

  return (
    <div className="container cash-ledger-page">
      <h1>Информация по кассе</h1>
      <p>Смена: {currentShift.id?.slice(0, 8)}</p>
      {ledger.length === 0 ? (
        <p>Нет данных по кассе</p>
      ) : (
        <table className="ledger-table">
          <thead>
            <tr>
              <th>Валюта</th>
              <th>Начало смены</th>
              <th>Приход</th>
              <th>Расход</th>
              <th>Остаток</th>
            </tr>
          </thead>
          <tbody>
            {ledger.map(row => (
              <tr key={row.currency}>
                <td>{row.currency}</td>
                <td>{Number(row.openingBalance).toFixed(2)}</td>
                <td>{Number(row.incomeAmount).toFixed(2)}</td>
                <td>{Number(row.expenseAmount).toFixed(2)}</td>
                <td className={Number(row.currentBalance) < 0 ? 'negative' : ''}>
                  {Number(row.currentBalance).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default CashLedgerPage;
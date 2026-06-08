import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import { useStore } from '../../store/useStore';
import Loader from '../../components/Shared/Loader';
import '../../styles/cashledger.css';

const CashLedgerPage: React.FC = () => {
  const { setCurrentShift } = useStore(); // обновляем store, но не используем currentShift напрямую
  const [ledger, setLedger] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shift, setShift] = useState<any>(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        // 1. Запрашиваем актуальную смену с сервера
        const shiftResp = await api.get('/shifts/current');
        const currentShiftData = shiftResp.data;
        setShift(currentShiftData);
        setCurrentShift(currentShiftData); // обновляем store для других компонентов

        // 2. Если смена не открыта – не загружаем остатки
        if (currentShiftData.status !== 'OPEN') {
          setLedger([]);
          setLoading(false);
          return;
        }

        // 3. Загружаем данные кассы
        const ledgerResp = await api.get('/cash-ledger/current');
        setLedger(ledgerResp.data.currencies || []);
      } catch (err: any) {
        if (err.response?.status === 404) {
          // Смена не найдена (не открыта)
          setShift(null);
          setCurrentShift(null);
          setLedger([]);
        } else {
          setError(err.response?.data?.message || 'Ошибка загрузки данных кассы');
        }
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [setCurrentShift]);

  if (loading) return <Loader />;
  if (error) return <div className="container error-message">{error}</div>;
  if (!shift || shift.status !== 'OPEN') {
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
      <p>Смена: {shift.id?.slice(0, 8)} (статус: {shift.status})</p>
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
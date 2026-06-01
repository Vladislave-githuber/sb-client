import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useStore } from '../../store/useStore';
import { Button, Input, Select } from '../../components/Shared';
import toast from 'react-hot-toast';
import '../../styles/cashreconciliation.css';

const PAGE_SIZE = 5; // количество записей истории на странице

const CashReconciliationPage: React.FC = () => {
  const { currentShift, currentCashier } = useStore();
  const [electronicBalances, setElectronicBalances] = useState<Record<string, number>>({});
  const [physicalBalances, setPhysicalBalances] = useState<Record<string, number>>({});
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [historyStartDate, setHistoryStartDate] = useState('');
  const [historyEndDate, setHistoryEndDate] = useState('');
  const [historyPage, setHistoryPage] = useState(1);

  const currencies = ['BYN', 'USD', 'EUR', 'RUB'];

  // ========== Загрузка текущих электронных остатков ==========
  const fetchElectronicBalances = async () => {
    if (!currentShift) return;
    try {
      const { data } = await api.get('/cash-ledger/current');
      const map: Record<string, number> = {};
      data.currencies.forEach((c: any) => {
        map[c.currency] = Number(c.currentBalance);
      });
      setElectronicBalances(map);
      // Инициализируем физические значения как копию электронных (для удобства)
      const initPhysical: Record<string, number> = {};
      currencies.forEach(c => { initPhysical[c] = map[c] || 0; });
      setPhysicalBalances(initPhysical);
    } catch (err) {
      toast.error('Ошибка загрузки электронной кассы');
    }
  };

  // ========== Загрузка истории сверок с пагинацией ==========
  const fetchReconciliationHistory = async () => {
    if (!currentShift) return;
    try {
      const params: any = { shiftId: currentShift.id };
      if (historyStartDate) params.startDate = historyStartDate;
      if (historyEndDate) params.endDate = historyEndDate;
      const { data } = await api.get('/cash-ledger/reconciliations', { params });
      setHistory(data);
      setHistoryPage(1); // сброс страницы при новых фильтрах
    } catch (err) {
      toast.error('Ошибка загрузки истории');
    }
  };

  useEffect(() => {
    fetchElectronicBalances();
  }, [currentShift]);

  useEffect(() => {
    fetchReconciliationHistory();
  }, [currentShift, historyStartDate, historyEndDate]);

  // ========== Логика сверки ==========
  const handlePhysicalChange = (currency: string, value: string) => {
    const num = parseFloat(value);
    setPhysicalBalances(prev => ({ ...prev, [currency]: isNaN(num) ? 0 : num }));
  };

  const getDifference = (currency: string): number => {
    const electronic = electronicBalances[currency] || 0;
    const physical = physicalBalances[currency] || 0;
    return physical - electronic;
  };

  const hasDifference = currencies.some(curr => Math.abs(getDifference(curr)) > 0.01);

  const handleSubmit = async () => {
    if (!currentShift) {
      toast.error('Смена не открыта');
      return;
    }
    if (hasDifference && !comment.trim()) {
      toast.error('Укажите причину расхождения');
      return;
    }
    setLoading(true);
    try {
      const physicalArray = Object.entries(physicalBalances).map(([currency, amount]) => ({
        currency,
        amount,
      }));
      await api.post('/cash-ledger/reconcile', {
        physicalBalances: physicalArray,
        comment: comment.trim() || 'Расхождений нет',
      });
      toast.success('Сверка сохранена');
      await fetchElectronicBalances();
      await fetchReconciliationHistory();
      setComment('');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Ошибка сверки');
    } finally {
      setLoading(false);
    }
  };

  // ========== Пагинация истории ==========
  const totalHistoryPages = Math.ceil(history.length / PAGE_SIZE);
  const paginatedHistory = history.slice(
    (historyPage - 1) * PAGE_SIZE,
    historyPage * PAGE_SIZE
  );

  if (!currentShift) {
    return <div className="container">Смена не открыта</div>;
  }

  return (
    <div className="container reconciliation-page">
      <h1>Сверка кассы и расхождения</h1>
      <p>Смена: {currentShift.id.slice(0, 8)}</p>

      {/* Блок ввода фактических остатков – сетка 2×2 */}
      <h2>1. Фактические остатки по валютам</h2>
      <div className="physical-grid">
        {currencies.map(currency => (
          <div key={currency} className="physical-card">
            <div className="currency-title">{currency}</div>
            <div className="electronic-value">
              Электронная: <strong>{electronicBalances[currency]?.toFixed(2) || '0.00'}</strong>
            </div>
            <div className="physical-input">
              <Input
                type="number"
                step="any"
                label="Физическая касса"
                value={physicalBalances[currency] || ''}
                onChange={(e) => handlePhysicalChange(currency, e.target.value)}
              />
            </div>
            <div className={`difference ${Math.abs(getDifference(currency)) > 0.01 ? 'diff-error' : 'diff-ok'}`}>
              Разница: {getDifference(currency) > 0 ? '+' : ''}{getDifference(currency).toFixed(2)}
            </div>
          </div>
        ))}
      </div>

      {/* Блок комментария при расхождении */}
      {hasDifference && (
        <div className="comment-section">
          <label>Причина расхождения:</label>
          <Select
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            options={[
              { value: '', label: '-- выберите --' },
              { value: 'ошибка пересчёта', label: 'Ошибка пересчёта' },
              { value: 'неверная операция', label: 'Неверная операция' },
              { value: 'недостача', label: 'Недостача' },
              { value: 'излишек', label: 'Излишек' },
              { value: 'техническая ошибка', label: 'Техническая ошибка' },
              { value: 'другое', label: 'Другое' },
            ]}
          />
          {comment === 'другое' && (
            <Input
              placeholder="Уточните причину"
              value={comment === 'другое' ? '' : comment}
              onChange={(e) => setComment(e.target.value)}
            />
          )}
        </div>
      )}

      <div className="actions">
        <Button onClick={handleSubmit} disabled={loading}>
          {loading ? 'Сохранение...' : 'Сохранить сверку'}
        </Button>
        {hasDifference && (
          <p className="warning-message">
            ⚠️ Обнаружено расхождение! Для закрытия смены необходимо провести инкассацию или указать причину.
          </p>
        )}
      </div>

      {/* Блок истории сверок с пагинацией */}
      <h2>2. История сверок за смену</h2>
      <div className="history-filters">
        <Input
          type="date"
          label="Дата от"
          value={historyStartDate}
          onChange={(e) => setHistoryStartDate(e.target.value)}
        />
        <Input
          type="date"
          label="Дата до"
          value={historyEndDate}
          onChange={(e) => setHistoryEndDate(e.target.value)}
        />
        <Button onClick={fetchReconciliationHistory} variant="secondary">
          Обновить
        </Button>
      </div>

      {history.length === 0 ? (
        <p>Нет сохранённых сверок за выбранный период.</p>
      ) : (
        <>
          <table className="history-table">
            <thead>
              <tr>
                <th>Дата и время</th>
                <th>Валюта</th>
                <th>Электронная</th>
                <th>Физическая</th>
                <th>Разница</th>
                <th>Комментарий</th>
              </tr>
            </thead>
            <tbody>
              {paginatedHistory.map((rec) => (
                <tr key={rec.id}>
                  <td>{new Date(rec.reconciledAt).toLocaleString()}</td>
                  <td>{rec.currency}</td>
                  <td>{Number(rec.electronicAmount).toFixed(2)}</td>
                  <td>{Number(rec.physicalAmount).toFixed(2)}</td>
                  <td className={Math.abs(Number(rec.difference)) > 0.01 ? 'diff-error' : ''}>
                    {Number(rec.difference).toFixed(2)}
                  </td>
                  <td>{rec.comment || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {totalHistoryPages > 1 && (
            <div className="pagination">
              <Button
                variant="secondary"
                onClick={() => setHistoryPage(p => Math.max(1, p - 1))}
                disabled={historyPage === 1}
              >
                Назад
              </Button>
              <span className="pagination-info">
                Страница {historyPage} из {totalHistoryPages}
              </span>
              <Button
                variant="secondary"
                onClick={() => setHistoryPage(p => Math.min(totalHistoryPages, p + 1))}
                disabled={historyPage === totalHistoryPages}
              >
                Вперёд
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default CashReconciliationPage;
import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useStore } from '../../store/useStore';
import { Button, Input, Select } from '../../components/Shared';
import toast from 'react-hot-toast';
import CashAdjustmentModal from '../../components/CashAdjustmentModal/CashAdjustmentModal';
import { getAdjustments, type CashAdjustment } from '../../api/cash-adjustments';
import '../../styles/cashreconciliation.css';

const PAGE_SIZE = 5;

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

  // Корректировки (списание/оприходование)
  const [adjustments, setAdjustments] = useState<CashAdjustment[]>([]);
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);

  const currencies = ['BYN', 'USD', 'EUR', 'RUB'];

  // Загрузка электронных остатков
  const fetchElectronicBalances = async () => {
    if (!currentShift) return;
    try {
      const { data } = await api.get('/cash-ledger/current');
      const map: Record<string, number> = {};
      data.currencies.forEach((c: any) => {
        map[c.currency] = Number(c.currentBalance);
      });
      setElectronicBalances(map);
      const initPhysical: Record<string, number> = {};
      currencies.forEach(c => { initPhysical[c] = map[c] || 0; });
      setPhysicalBalances(initPhysical);
    } catch (err) {
      toast.error('Ошибка загрузки электронной кассы');
    }
  };

  // Загрузка истории сверок
  const fetchReconciliationHistory = async () => {
    if (!currentShift) return;
    try {
      const params: any = { shiftId: currentShift.id };
      if (historyStartDate) params.startDate = historyStartDate;
      if (historyEndDate) params.endDate = historyEndDate;
      const { data } = await api.get('/cash-ledger/reconciliations', { params });
      setHistory(data);
      setHistoryPage(1);
    } catch (err) {
      toast.error('Ошибка загрузки истории');
    }
  };

  // Загрузка корректировок
  const fetchAdjustments = async () => {
    if (!currentShift) return;
    try {
      const data = await getAdjustments();
      setAdjustments(data);
    } catch (err) {
      console.error('Ошибка загрузки корректировок', err);
    }
  };

  useEffect(() => {
    fetchElectronicBalances();
  }, [currentShift]);

  useEffect(() => {
    fetchReconciliationHistory();
    fetchAdjustments();
  }, [currentShift, historyStartDate, historyEndDate]);

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

  const totalHistoryPages = Math.ceil(history.length / PAGE_SIZE);
  const paginatedHistory = history.slice(
    (historyPage - 1) * PAGE_SIZE,
    historyPage * PAGE_SIZE
  );

  if (!currentShift) {
    return <div className="container">Смена не открыта</div>;
  }

  // Проверяем, есть ли неурегулированное расхождение (учитывая корректировки)
  const hasUnresolvedDifference = (() => {
    for (const curr of currencies) {
      const diff = getDifference(curr);
      if (Math.abs(diff) <= 0.01) continue;
      // Сумма корректировок по этой валюте (излишек +, недостача -)
      const adjSum = adjustments
        .filter(a => a.currency === curr)
        .reduce((sum, a) => sum + (a.type === 'SURPLUS' ? a.amount : -a.amount), 0);
      if (Math.abs(diff - adjSum) > 0.01) return true;
    }
    return false;
  })();

  return (
    <div className="container reconciliation-page">
      <h1>Сверка кассы и расхождения</h1>
      <p>Смена: {currentShift.id.slice(0, 8)}</p>

      {/* Блок ввода фактических остатков */}
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
        {hasUnresolvedDifference && (
          <div className="warning-block" style={{ marginTop: '1rem' }}>
            <p className="warning-message">
              ⚠️ Обнаружено не урегулированное расхождение! Для закрытия смены необходимо оформить списание недостачи или оприходование излишка.
            </p>
            <Button onClick={() => setShowAdjustmentModal(true)} variant="primary">
              Урегулировать расхождение
            </Button>
          </div>
        )}
      </div>

      {/* История корректировок (списаний/оприходований) */}
      <h2>2. История урегулирований (списания / оприходования)</h2>
      {adjustments.length === 0 ? (
        <p>Нет операций урегулирования.</p>
      ) : (
        <table className="history-table">
          <thead>
            <tr>
              <th>Дата и время</th>
              <th>Валюта</th>
              <th>Тип</th>
              <th>Сумма</th>
              <th>Причина</th>
              <th>Кто создал</th>
            </tr>
          </thead>
          <tbody>
            {adjustments.map((adj) => (
              <tr key={adj.id}>
                <td>{new Date(adj.createdAt).toLocaleString()}</td>
                <td>{adj.currency}</td>
                <td>{adj.type === 'SURPLUS' ? 'Оприходование (+)' : 'Списание (-)'}</td>
                <td>{adj.amount.toFixed(2)}</td>
                <td>{adj.reason}</td>
                <td>{adj.creator?.fullName || adj.createdBy.slice(0, 8)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Блок истории сверок */}
      <h2>3. История сверок за смену</h2>
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

      <CashAdjustmentModal
        isOpen={showAdjustmentModal}
        onClose={() => setShowAdjustmentModal(false)}
        onSuccess={() => {
          fetchAdjustments();
          fetchElectronicBalances();
          fetchReconciliationHistory();
        }}
        currencies={currencies}
      />
    </div>
  );
};

export default CashReconciliationPage;
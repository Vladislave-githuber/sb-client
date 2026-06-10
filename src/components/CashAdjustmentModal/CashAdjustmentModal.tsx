import React, { useState } from 'react';
import { Button, Input, Select } from '../../components/Shared';
import { createAdjustment } from '../../api/cash-adjustments';
import toast from 'react-hot-toast';
import '../../styles/cancelmodal.css'; // переиспользуем стили модалок

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  currencies: string[];
}

const CashAdjustmentModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSuccess,
  currencies,
}) => {
  const [currency, setCurrency] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'SURPLUS' | 'SHORTAGE'>('SURPLUS');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!currency) return toast.error('Выберите валюту');
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return toast.error('Введите корректную сумму (больше 0)');
    }
    if (!reason.trim()) return toast.error('Укажите причину');

    setLoading(true);
    try {
      await createAdjustment({
        currency,
        amount: numAmount,
        type,
        reason: reason.trim(),
      });
      toast.success(
        type === 'SURPLUS' ? 'Излишек оприходован' : 'Недостача списана'
      );
      onSuccess();
      onClose();
      setCurrency('');
      setAmount('');
      setReason('');
      setType('SURPLUS');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Ошибка при сохранении');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>Урегулирование расхождения</h2>
        <div style={{ marginBottom: '1rem' }}>
          <Select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            options={currencies.map((c) => ({ value: c, label: c }))}
          />
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <Select
            value={type}
            onChange={(e) => setType(e.target.value as any)}
            options={[
              { value: 'SURPLUS', label: 'Оприходование излишка' },
              { value: 'SHORTAGE', label: 'Списание недостачи' },
            ]}
          />
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <Input
            type="number"
            step="any"
            label="Сумма"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <Input
            label="Причина"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Например: излишек при пересчёте наличных"
          />
        </div>
        <div className="modal-actions">
          <Button onClick={onClose} variant="secondary">
            Отмена
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? 'Сохранение...' : 'Сохранить'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CashAdjustmentModal;
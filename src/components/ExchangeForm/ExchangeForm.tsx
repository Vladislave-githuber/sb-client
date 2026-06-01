import React, { useState, useEffect, useMemo } from 'react';
import { Button, Input } from '../Shared';
import { useExchange } from '../../hooks/useExchange';
import { useRates } from '../../hooks/useRates';
import toast from 'react-hot-toast';

type OperationType = 'BUY' | 'SELL' | 'CONVERT';

interface ExchangeFormProps {
  onSubmit: (data: {
    type: OperationType;
    fromCurrency: string;
    toCurrency: string;
    fromAmount: number;
    toAmount: number;
  }) => void;
}

const ExchangeForm: React.FC<ExchangeFormProps> = ({ onSubmit }) => {
  const { rates, loading: ratesLoading } = useRates();
  const [type, setType] = useState<OperationType>('BUY');
  const [fromCurrency, setFromCurrency] = useState<string>('USD');
  const [toCurrency, setToCurrency] = useState<string>('BYN');
  const [fromAmount, setFromAmount] = useState<number>(0);
  const [toAmount, setToAmount] = useState<number>(0);
  const [error, setError] = useState<string>('');

  const { calculate } = useExchange(rates);

  // Мемоизация списка валют для оптимизации
  const currencyOptions = useMemo(
    () => rates.map((c) => <option key={c.code} value={c.code}>{c.code}</option>),
    [rates]
  );

  // Пересчёт суммы при изменении параметров
  useEffect(() => {
    if (fromAmount <= 0) {
      setToAmount(0);
      setError('');
      return;
    }
    try {
      const result = calculate({
        type,
        fromCurrency,
        toCurrency,
        amount: fromAmount,
      });
      setToAmount(result);
      setError('');
    } catch (err) {
      setError((err as Error).message);
      setToAmount(0);
    }
  }, [type, fromCurrency, toCurrency, fromAmount, calculate]);

  const handleFromAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    setFromAmount(isNaN(value) ? 0 : value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (fromAmount <= 0) {
      setError('Введите сумму больше нуля');
      toast.error('Введите сумму больше нуля');
      return;
    }
    if (toAmount <= 0) {
      setError('Некорректная сумма к выдаче');
      toast.error('Некорректная сумма к выдаче');
      return;
    }
    onSubmit({
      type,
      fromCurrency,
      toCurrency,
      fromAmount,
      toAmount,
    });
  };

  if (ratesLoading) return <div className="p-4 text-center">Загрузка курсов...</div>;

  return (
    <form className="exchange-form" onSubmit={handleSubmit}>
      <h2 className="exchange-form-title">Обмен валют</h2>

      <div className="exchange-form-type">
        <label className="radio-label">
          <input
            type="radio"
            value="BUY"
            checked={type === 'BUY'}
            onChange={() => setType('BUY')}
          />
          Покупка
        </label>
        <label className="radio-label">
          <input
            type="radio"
            value="SELL"
            checked={type === 'SELL'}
            onChange={() => setType('SELL')}
          />
          Продажа
        </label>
        <label className="radio-label">
          <input
            type="radio"
            value="CONVERT"
            checked={type === 'CONVERT'}
            onChange={() => setType('CONVERT')}
          />
          Конверсия
        </label>
      </div>

      <div className="exchange-form-row">
        <div className="exchange-form-group">
          <label className="label">Отдаёте</label>
          <select
            value={fromCurrency}
            onChange={(e) => setFromCurrency(e.target.value)}
            className="exchange-select"
          >
            {currencyOptions}
          </select>
          <Input
            type="number"
            step="any"
            placeholder="Сумма"
            value={fromAmount || ''}
            onChange={handleFromAmountChange}
          />
        </div>

        <div className="exchange-form-group">
          <label className="label">Получаете</label>
          <select
            value={toCurrency}
            onChange={(e) => setToCurrency(e.target.value)}
            className="exchange-select"
          >
            {currencyOptions}
          </select>
          <Input
            type="number"
            step="any"
            placeholder="Сумма"
            value={toAmount.toFixed(2)}
            disabled
          />
        </div>
      </div>

      {error && <p className="exchange-error">{error}</p>}

      <Button type="submit" fullWidth>
        Провести операцию
      </Button>
    </form>
  );
};

export default ExchangeForm;
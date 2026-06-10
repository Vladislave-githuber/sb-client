import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useStore } from "../../store/useStore";
import { useRates } from "../../hooks/useRates";
import { createTransaction } from "../../api/transactions";
import { getReceiptByTransactionId } from "../../api/receipts";
import CurrencyCard from "../../components/CurrencyCard/CurrencyCard";
import ReceiptModal from "../../components/ReceiptModal/ReceiptModal";
import ClientSearch from "../../components/Clients/ClientSearch";
import ClientModal from "../../components/Clients/ClientModal";
import { Button, Input } from "../../components/Shared";
import toast from "react-hot-toast";
import type { IClient } from "../../types";
import api from "../../api/axios";
import "../../styles/exchange.css";

type OperationType = "BUY" | "SELL" | "CONVERT";

const calculateAmount = (
  type: OperationType,
  fromCurrency: string,
  toCurrency: string,
  amount: number,
  isFromAmount: boolean,
  rates: { code: string; scale: number; rateBuy: number; rateSell: number }[]
): number => {
  if (amount <= 0) return 0;

  const fromRate = rates.find(r => r.code === fromCurrency);
  const toRate = rates.find(r => r.code === toCurrency);
  if (!fromRate || !toRate) throw new Error("Курс валюты не найден");

  if (type === "BUY") {
    if (fromCurrency !== "BYN") throw new Error("При покупке отдаваемая валюта должна быть BYN");
    if (isFromAmount) {
      return (amount / toRate.rateBuy) * toRate.scale;
    } else {
      return (amount / toRate.scale) * toRate.rateBuy;
    }
  } else if (type === "SELL") {
    if (toCurrency !== "BYN") throw new Error("При продаже получаемая валюта должна быть BYN");
    if (isFromAmount) {
      return (amount / fromRate.scale) * fromRate.rateSell;
    } else {
      return (amount / fromRate.rateSell) * fromRate.scale;
    }
  } else {
    if (fromCurrency === toCurrency) throw new Error("Нельзя конвертировать одинаковые валюты");
    if (isFromAmount) {
      const amountInBYN = (amount / fromRate.scale) * fromRate.rateSell;
      return (amountInBYN / toRate.rateBuy) * toRate.scale;
    } else {
      const amountInBYN = (amount / toRate.scale) * toRate.rateBuy;
      return (amountInBYN / fromRate.rateSell) * fromRate.scale;
    }
  }
};

const ExchangePage: React.FC = () => {
  const { 
    currentCashier, 
    fetchCashBalances, 
    loadingBalances, 
    errorBalances, 
    cashBalances,
    currentShift, 
    loadingShift, 
    fetchCurrentShift 
  } = useStore();
  const { rates, loading: ratesLoading, error: ratesError } = useRates();

  const [type, setType] = useState<OperationType>("BUY");
  const [fromCurrency, setFromCurrency] = useState<string>("USD");
  const [toCurrency, setToCurrency] = useState<string>("BYN");
  const [fromAmount, setFromAmount] = useState<number>(0);
  const [toAmount, setToAmount] = useState<number>(0);
  const [givenAmount, setGivenAmount] = useState<number>(0);
  const [changeAmount, setChangeAmount] = useState<number>(0);
  const [error, setError] = useState<string>("");
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptData, setReceiptData] = useState<any>(null);
  const [activeInput, setActiveInput] = useState<"from" | "to">("from");
  const [selectedClient, setSelectedClient] = useState<IClient | null>(null);
  const [showClientModal, setShowClientModal] = useState(false);

  const canCreateClient = currentCashier?.role === 'admin' || 
                          currentCashier?.role === 'senior_cashier' || 
                          currentCashier?.role === 'cashier';

  useEffect(() => {
    fetchCurrentShift();
  }, [fetchCurrentShift]);

  useEffect(() => {
    if (currentCashier) fetchCashBalances();
  }, [currentCashier, fetchCashBalances]);

  const currencyOptions = useMemo(
    () => rates.map(c => ({ code: c.code, label: c.code })),
    [rates]
  );

  const recalc = useCallback(
    (changedField: "from" | "to", newValue: number) => {
      if (newValue < 0) newValue = 0;
      if (newValue === 0) {
        if (changedField === "from") setToAmount(0);
        else setFromAmount(0);
        setGivenAmount(0);
        setChangeAmount(0);
        return;
      }

      try {
        if (changedField === "from") {
          const calculatedTo = calculateAmount(type, fromCurrency, toCurrency, newValue, true, rates);
          setFromAmount(newValue);
          setToAmount(Math.round(calculatedTo * 100) / 100);
        } else {
          const calculatedFrom = calculateAmount(type, fromCurrency, toCurrency, newValue, false, rates);
          setToAmount(newValue);
          setFromAmount(Math.round(calculatedFrom * 100) / 100);
        }
        setError("");
      } catch (err) {
        setError((err as Error).message);
        if (changedField === "from") setToAmount(0);
        else setFromAmount(0);
      }
    },
    [type, fromCurrency, toCurrency, rates]
  );

  useEffect(() => {
    if (givenAmount > 0 && fromAmount > 0) {
      if (givenAmount < fromAmount) {
        setError(`Внесено меньше требуемой суммы (${fromAmount} ${fromCurrency})`);
        setChangeAmount(0);
      } else {
        setError("");
        setChangeAmount(givenAmount - fromAmount);
      }
    } else {
      setChangeAmount(0);
    }
  }, [givenAmount, fromAmount, fromCurrency]);

  // ========== ОСНОВНОЕ ИСПРАВЛЕНИЕ ==========
  // Эффект сброса формы – ТОЛЬКО при смене типа операции (без зависимости от rates)
  useEffect(() => {
    // Корректируем валюты в зависимости от типа
    if (type === "BUY") {
      setFromCurrency("BYN");
      if (toCurrency === "BYN") {
        const other = rates.find(c => c.code !== "BYN")?.code;
        if (other) setToCurrency(other);
      }
    } else if (type === "SELL") {
      setToCurrency("BYN");
      if (fromCurrency === "BYN") {
        const other = rates.find(c => c.code !== "BYN")?.code;
        if (other) setFromCurrency(other);
      }
    } else if (type === "CONVERT") {
      if (fromCurrency === toCurrency) {
        const other = rates.find(c => c.code !== fromCurrency)?.code;
        if (other) setToCurrency(other);
      }
    }
    // Сбрасываем суммы и выбранного клиента ТОЛЬКО при смене типа
    setFromAmount(0);
    setToAmount(0);
    setGivenAmount(0);
    setChangeAmount(0);
    setError("");
    setSelectedClient(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type]); // rates не включён – сброса при обновлении курсов НЕ БУДЕТ

  // Дополнительный эффект для "мягкой" коррекции валют при обновлении rates (без сброса формы)
  useEffect(() => {
    if (type === "BUY" && fromCurrency !== "BYN") {
      setFromCurrency("BYN");
    }
    if (type === "SELL" && toCurrency !== "BYN") {
      setToCurrency("BYN");
    }
    if (type === "CONVERT" && fromCurrency === toCurrency) {
      const other = rates.find(c => c.code !== fromCurrency)?.code;
      if (other) setToCurrency(other);
    }
  }, [rates, type, fromCurrency, toCurrency]);

  // Эффект для синхронизации полей (остаётся без изменений)
  useEffect(() => {
    if (fromAmount !== 0 || toAmount !== 0) {
      if (activeInput === "from") recalc("from", fromAmount);
      else recalc("to", toAmount);
    }
  }, [fromCurrency, toCurrency, recalc, activeInput, fromAmount, toAmount]);

  const handleFromAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    const newVal = isNaN(val) ? 0 : val;
    setActiveInput("from");
    recalc("from", newVal);
    setGivenAmount(0);
  };

  const handleToAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    const newVal = isNaN(val) ? 0 : val;
    setActiveInput("to");
    recalc("to", newVal);
    setGivenAmount(0);
  };

  const handleGivenAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setGivenAmount(isNaN(val) ? 0 : val);
  };

  const checkCashAvailability = (): boolean => {
    if (!cashBalances.length) return true;
    const getBalance = (currency: string) => cashBalances.find(b => b.currencyCode === currency)?.amount || 0;

    if (type === "BUY") {
      if (getBalance(toCurrency) < toAmount) {
        setError(`Недостаточно ${toCurrency} в кассе. Доступно: ${getBalance(toCurrency).toFixed(2)}`);
        toast.error(`Недостаточно ${toCurrency} в кассе`);
        return false;
      }
    } else if (type === "SELL") {
      if (getBalance(fromCurrency) < fromAmount) {
        setError(`Недостаточно ${fromCurrency} в кассе. Доступно: ${getBalance(fromCurrency).toFixed(2)}`);
        toast.error(`Недостаточно ${fromCurrency} в кассе`);
        return false;
      }
    } else if (type === "CONVERT") {
      if (getBalance(fromCurrency) < fromAmount) {
        setError(`Недостаточно ${fromCurrency} в кассе. Доступно: ${getBalance(fromCurrency).toFixed(2)}`);
        toast.error(`Недостаточно ${fromCurrency} в кассе`);
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentCashier) {
      toast.error("Кассир не авторизован");
      return;
    }
    if (fromAmount <= 0 || toAmount <= 0) {
      setError("Введите положительную сумму обмена");
      toast.error("Введите положительную сумму обмена");
      return;
    }
    if (givenAmount <= 0) {
      setError("Укажите внесённую сумму");
      toast.error("Укажите внесённую сумму");
      return;
    }
    if (givenAmount < fromAmount) {
      setError(`Внесённая сумма (${givenAmount} ${fromCurrency}) меньше требуемой (${fromAmount} ${fromCurrency})`);
      toast.error("Внесённая сумма меньше требуемой");
      return;
    }
    if (type === "CONVERT" && fromCurrency === toCurrency) {
      setError("Выберите разные валюты для конверсии");
      toast.error("Выберите разные валюты");
      return;
    }
    if (cashBalances.length > 0 && !checkCashAvailability()) return;

    try {
      const payload: any = { 
        type, 
        fromCurrency, 
        toCurrency, 
        fromAmount, 
        toAmount, 
        givenAmount,
      };
      if (selectedClient) {
        payload.clientId = selectedClient.id;
      }
      const transaction = await createTransaction(payload);
      await fetchCashBalances();

      const receiptWithDetails = await getReceiptByTransactionId(transaction.id);
      setReceiptData({
        transaction: receiptWithDetails.transaction,
        cashier: receiptWithDetails.cashier,
        officeNumber: receiptWithDetails.receipt.officeNumber,
        date: new Date(receiptWithDetails.receipt.createdAt).toLocaleString(),
      });
      setShowReceipt(true);
      toast.success("Операция успешно выполнена");
      setFromAmount(0);
      setToAmount(0);
      setGivenAmount(0);
      setChangeAmount(0);
      setSelectedClient(null);
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Ошибка при проведении операции";
      setError(msg);
      toast.error(msg);
    }
  };

  const handleClientSaved = async (clientData: Omit<IClient, 'id' | 'createdAt'>) => {
    try {
      const { data } = await api.post('/clients', clientData);
      const newClient: IClient = data;
      setSelectedClient(newClient);
      setShowClientModal(false);
      toast.success('Клиент добавлен');
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Ошибка при добавлении клиента';
      toast.error(msg);
    }
  };

  // Условные рендеры загрузки и ошибок
  if (ratesLoading || loadingBalances || loadingShift) {
    return (
      <div className="container">
        <div className="loader-wrapper">Загрузка...</div>
      </div>
    );
  }
  if (ratesError || errorBalances) {
    return (
      <div className="container">
        <p className="error-message">{ratesError || errorBalances}</p>
      </div>
    );
  }
  if (!currentShift || currentShift.status !== 'OPEN') {
    return (
      <div className="container">
        <h1>Рабочее место кассира</h1>
        <p>Смена не открыта. Обратитесь к старшему кассиру.</p>
      </div>
    );
  }

  const isFromFixed = type === "BUY";
  const isToFixed = type === "SELL";
  const fromDisabled = isFromFixed && fromCurrency === "BYN";
  const toDisabled = isToFixed && toCurrency === "BYN";

  return (
    <div className="container">
      <div className="exchange-page-header">
        <h1 className="exchange-page-title">Рабочее место кассира</h1>
        <p className="exchange-page-subtitle">
          {currentCashier?.role === 'admin' ? 'Администратор' : currentCashier?.role === 'senior_cashier' ? 'Старший кассир' : 'Кассир'}
          : {currentCashier?.fullName} (таб. №{currentCashier?.tabNumber})
        </p>
      </div>

      <div className="exchange-grid">
        <div className="rates-sidebar">
          <h2 className="rates-sidebar-title">Текущие курсы</h2>
          <div className="rates-list">
            {rates.map(currency => (
              <CurrencyCard key={currency.code} currency={currency} />
            ))}
          </div>
        </div>

        <form className="exchange-form" onSubmit={handleSubmit}>
          <h2 className="exchange-form-title">Обмен валют</h2>

          <div className="exchange-form-type">
            <label className="radio-label">
              <input type="radio" value="BUY" checked={type === "BUY"} onChange={() => setType("BUY")} />
              Покупка (BYN → Валюта)
            </label>
            <label className="radio-label">
              <input type="radio" value="SELL" checked={type === "SELL"} onChange={() => setType("SELL")} />
              Продажа (Валюта → BYN)
            </label>
            <label className="radio-label">
              <input type="radio" value="CONVERT" checked={type === "CONVERT"} onChange={() => setType("CONVERT")} />
              Конверсия (Валюта → Валюта)
            </label>
          </div>

          <div className="exchange-client-section">
            <label className="label">Клиент</label>
            <div className="client-search-wrapper">
              <ClientSearch 
                onSelect={setSelectedClient} 
                selectedClient={selectedClient}
              />
              {canCreateClient && (
                <Button 
                  type="button" 
                  variant="secondary" 
                  onClick={() => setShowClientModal(true)}
                  className="new-client-btn"
                >
                  + Новый клиент
                </Button>
              )}
            </div>
          </div>

          <div className="exchange-form-row">
            <div className={`exchange-form-group ${activeInput === "from" ? "active-input" : ""}`}>
              <label className="label">Получено от клиента</label>
              <select
                value={fromCurrency}
                onChange={e => setFromCurrency(e.target.value)}
                className="exchange-select"
                disabled={fromDisabled}
              >
                {currencyOptions.map(opt => (
                  <option key={opt.code} value={opt.code}>{opt.code}</option>
                ))}
              </select>
              <Input
                type="number"
                step="any"
                placeholder="Сумма"
                value={fromAmount || ""}
                onChange={handleFromAmountChange}
              />
            </div>

            <div className={`exchange-form-group ${activeInput === "to" ? "active-input" : ""}`}>
              <label className="label">Выдано клиенту</label>
              <select
                value={toCurrency}
                onChange={e => setToCurrency(e.target.value)}
                className="exchange-select"
                disabled={toDisabled}
              >
                {currencyOptions.map(opt => (
                  <option key={opt.code} value={opt.code}>{opt.code}</option>
                ))}
              </select>
              <Input
                type="number"
                step="any"
                placeholder="Сумма"
                value={toAmount || ""}
                onChange={handleToAmountChange}
              />
            </div>
          </div>

          <div className="exchange-form-row">
            <div className="exchange-form-group">
              <label className="label">Внесено ({fromCurrency})</label>
              <Input
                type="number"
                step="any"
                placeholder="Сумма, которую дал клиент"
                value={givenAmount || ""}
                onChange={handleGivenAmountChange}
              />
            </div>
            <div className="exchange-form-group">
              <label className="label">Сдача ({fromCurrency})</label>
              <Input
                type="number"
                step="any"
                value={changeAmount.toFixed(2)}
                readOnly
                disabled
                className="readonly-input"
              />
            </div>
          </div>

          {error && <p className="exchange-error">{error}</p>}

          <Button type="submit" fullWidth>
            Провести операцию
          </Button>
        </form>
      </div>

      <ReceiptModal
        isOpen={showReceipt}
        receiptData={receiptData}
        onClose={() => setShowReceipt(false)}
      />

      <ClientModal
        isOpen={showClientModal}
        onClose={() => setShowClientModal(false)}
        onSave={handleClientSaved}
      />
    </div>
  );
};

export default ExchangePage;
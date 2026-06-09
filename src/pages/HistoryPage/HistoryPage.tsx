import React, { useState, useEffect, useMemo } from 'react';
import { useStore } from '../../store/useStore';
import { getTransactions, deleteTransaction, stornoTransaction, refundTransaction } from '../../api/transactions';
import { getUsers } from '../../api/users';
import { getRates } from '../../api/rates';
import { getReceiptByTransactionId, type ReceiptWithDetails } from '../../api/receipts';
import { Button, Select } from '../../components/Shared';
import Loader from '../../components/Shared/Loader';
import ReceiptModal from '../../components/ReceiptModal/ReceiptModal';
import CancelModal from '../../components/CancelModal/CancelModal';
import toast from 'react-hot-toast';
import type { ITransaction, IUser } from '../../types';
import '../../styles/history.css';

const PAGE_SIZE = 10;

type OperationType = 'BUY' | 'SELL' | 'CONVERT' | 'ALL';

// Функция для перевода статуса на русский
const getStatusLabel = (status?: string): string => {
  switch (status) {
    case 'ACTIVE': return 'Активна';
    case 'STORNO': return 'Сторнирована';
    case 'REFUNDED': return 'Возвращена';
    default: return 'Активна';
  }
};

const HistoryPage: React.FC = () => {
  const { currentCashier } = useStore();
  const isAdmin = currentCashier?.role === 'admin';
  const isSeniorCashier = currentCashier?.role === 'senior_cashier';
  const isEconomist = currentCashier?.role === 'economist';
  const isCashier = currentCashier?.role === 'cashier';

  // Может ли пользователь видеть всех кассиров (для фильтрации и отображения имён)
  const canViewAllUsers = isAdmin || isSeniorCashier || isEconomist;
  // Может ли пользователь выполнять удаление (только админ)
  const canDelete = isAdmin;
  // Может ли выполнять сторно/возврат (админ или старший кассир)
  const canCancel = isAdmin || isSeniorCashier;

  // Данные
  const [transactions, setTransactions] = useState<ITransaction[]>([]);
  const [users, setUsers] = useState<IUser[]>([]);
  const [rates, setRates] = useState<{ code: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingDelete, setLoadingDelete] = useState<string | null>(null);
  const [loadingCancel, setLoadingCancel] = useState<string | null>(null);

  // Фильтры
  const [typeFilter, setTypeFilter] = useState<OperationType>('ALL');
  const [currencyFilter, setCurrencyFilter] = useState('ALL');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [cashierFilter, setCashierFilter] = useState('ALL'); // Фильтр по кассиру (доступен админу, экон., старш.кассиру)

  // Пагинация
  const [currentPage, setCurrentPage] = useState(1);

  // Чек
  const [selectedReceipt, setSelectedReceipt] = useState<ReceiptWithDetails | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  // Модалка отмены
  const [cancelModal, setCancelModal] = useState<{ open: boolean; type: 'storno' | 'refund'; txId: string | null }>({
    open: false,
    type: 'storno',
    txId: null,
  });

  // Статистика (только для админа)
  const [stats, setStats] = useState({
    totalCount: 0,
    totalTurnoverBYN: 0,
    buyCount: 0,
    sellCount: 0,
    convertCount: 0,
  });

  // Загрузка начальных данных
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const promises: Promise<any>[] = [getTransactions(), getRates()];
        if (canViewAllUsers) {
          promises.push(getUsers());
        } else {
          promises.push(Promise.resolve([]));
        }
        const [txs, ratesData, usersData] = await Promise.all(promises);
        setTransactions(txs);
        setRates(ratesData);
        if (canViewAllUsers) setUsers(usersData || []);
      } catch (err) {
        toast.error('Ошибка загрузки данных');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [canViewAllUsers]);

  // Фильтрация транзакций
  const filteredTransactions = useMemo(() => {
    let filtered = [...transactions];

    if (typeFilter !== 'ALL') {
      filtered = filtered.filter((tx) => tx.type === typeFilter);
    }

    if (currencyFilter !== 'ALL') {
      filtered = filtered.filter(
        (tx) => tx.currencyIn === currencyFilter || tx.currencyOut === currencyFilter
      );
    }

    if (dateFrom) {
      const from = new Date(dateFrom);
      from.setHours(0, 0, 0, 0);
      filtered = filtered.filter((tx) => new Date(tx.createdAt) >= from);
    }
    if (dateTo) {
      const to = new Date(dateTo);
      to.setHours(23, 59, 59, 999);
      filtered = filtered.filter((tx) => new Date(tx.createdAt) <= to);
    }

    // Фильтр по кассиру:
    // - Если доступен просмотр всех пользователей (админ, эконом, старший кассир) и выбран конкретный кассир
    if (canViewAllUsers && cashierFilter !== 'ALL') {
      filtered = filtered.filter((tx) => tx.cashierId === String(cashierFilter));
    }
    // - Если обычный кассир: показываем только его операции
    else if (isCashier && currentCashier) {
      filtered = filtered.filter((tx) => tx.cashierId === String(currentCashier.id));
    }
    // Для администратора, экономиста, старшего кассира без фильтра - все операции

    return filtered;
  }, [transactions, typeFilter, currencyFilter, dateFrom, dateTo, canViewAllUsers, cashierFilter, isCashier, currentCashier]);

  // Пагинация
  const totalPages = Math.ceil(filteredTransactions.length / PAGE_SIZE);
  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  // Сброс страницы при изменении фильтров
  useEffect(() => {
    setCurrentPage(1);
  }, [typeFilter, currencyFilter, dateFrom, dateTo, cashierFilter]);

  // Подсчёт статистики (только для админа)
  useEffect(() => {
    if (!isAdmin) return;

    let totalCount = filteredTransactions.length;
    let totalTurnoverBYN = 0;
    let buyCount = 0,
      sellCount = 0,
      convertCount = 0;

    filteredTransactions.forEach((tx) => {
      const sumIn = Number(tx.sumIn);
      const sumOut = Number(tx.sumOut);

      if (tx.currencyIn === 'BYN') totalTurnoverBYN += sumIn;
      else if (tx.currencyOut === 'BYN') totalTurnoverBYN += sumOut;

      if (tx.type === 'BUY') buyCount++;
      else if (tx.type === 'SELL') sellCount++;
      else if (tx.type === 'CONVERT') convertCount++;
    });

    setStats({
      totalCount,
      totalTurnoverBYN,
      buyCount,
      sellCount,
      convertCount,
    });
  }, [filteredTransactions, isAdmin]);

  const handleDelete = async (id: string) => {
    if (!canDelete) return;
    if (!window.confirm('Вы уверены, что хотите удалить эту операцию?')) return;

    try {
      setLoadingDelete(id);
      await deleteTransaction(id);
      setTransactions((prev) => prev.filter((tx) => tx.id !== id));
      toast.success('Операция удалена');
    } catch (err) {
      console.error(err);
      toast.error('Ошибка при удалении');
    } finally {
      setLoadingDelete(null);
    }
  };

  const handleStorno = (id: string) => {
    setCancelModal({ open: true, type: 'storno', txId: id });
  };

  const handleRefund = (id: string) => {
    setCancelModal({ open: true, type: 'refund', txId: id });
  };

  const confirmCancel = async (reason: string) => {
    if (!cancelModal.txId) return;
    setLoadingCancel(cancelModal.txId);
    try {
      if (cancelModal.type === 'storno') {
        await stornoTransaction(cancelModal.txId, reason);
        toast.success('Операция сторнирована');
      } else {
        await refundTransaction(cancelModal.txId, reason);
        toast.success('Возврат выполнен');
      }
      // Обновить список транзакций
      const updated = await getTransactions();
      setTransactions(updated);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Ошибка при выполнении операции');
    } finally {
      setLoadingCancel(null);
      setCancelModal({ open: false, type: 'storno', txId: null });
    }
  };

  // Имя кассира: используем cashierName с бэкенда, если есть, иначе подставляем ID
  const getCashierName = (tx: ITransaction) => {
    if (tx.cashierName) return tx.cashierName;
    // fallback для старых данных
    if (canViewAllUsers) {
      const user = users.find(u => String(u.id) === tx.cashierId);
      if (user) return user.fullName;
    }
    return `Кассир ${tx.cashierId.slice(0, 8)}`;
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
      <h1 className="history-page-title">История операций</h1>

      <div className="filters-bar">
        <Select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as OperationType)}
          options={[
            { value: 'ALL', label: 'Все типы' },
            { value: 'BUY', label: 'Покупка' },
            { value: 'SELL', label: 'Продажа' },
            { value: 'CONVERT', label: 'Конверсия' },
          ]}
        />

        <Select
          value={currencyFilter}
          onChange={(e) => setCurrencyFilter(e.target.value)}
          options={[
            { value: 'ALL', label: 'Все валюты' },
            ...rates.map((r) => ({ value: r.code, label: r.code })),
          ]}
        />

        <div className="date-filters">
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            placeholder="Дата от"
          />
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            placeholder="Дата до"
          />
        </div>

        {canViewAllUsers && (
          <Select
            value={cashierFilter}
            onChange={(e) => setCashierFilter(e.target.value)}
            options={[
              { value: 'ALL', label: 'Все кассиры' },
              ...users.map((u) => ({ value: u.id.toString(), label: u.fullName })),
            ]}
          />
        )}
      </div>

      {isAdmin && (
        <div className="stats-cards">
          <div className="stat-card">
            <div className="stat-label">Всего операций</div>
            <div className="stat-value">{stats.totalCount}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Оборот (BYN)</div>
            <div className="stat-value">{(stats.totalTurnoverBYN || 0).toFixed(2)}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Покупок</div>
            <div className="stat-value">{stats.buyCount}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Продаж</div>
            <div className="stat-value">{stats.sellCount}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Конверсий</div>
            <div className="stat-value">{stats.convertCount}</div>
          </div>
        </div>
      )}

      <div className="history-table-container">
        <table className="history-table">
          <thead>
            <tr>
              <th>Дата/время</th>
              <th>Тип</th>
              <th>Отдано</th>
              <th>Получено</th>
              <th>Кассир</th>
              <th>Статус</th>
              {canDelete && <th>Действия</th>}
              <th>Чек</th>
            </tr>
          </thead>
          <tbody>
            {paginatedTransactions.map((tx) => (
              <tr key={tx.id}>
                <td>{new Date(tx.createdAt).toLocaleString()}</td>
                <td>{tx.type}</td>
                <td>{tx.sumIn} {tx.currencyIn}</td>
                <td>{tx.sumOut} {tx.currencyOut}</td>
                <td>{getCashierName(tx)}</td>
                <td className={`status-${(tx.status || 'ACTIVE').toLowerCase()}`}>
                  {getStatusLabel(tx.status)}
                </td>
                {canDelete && (
                  <td className="actions-cell">
                    {tx.status === 'ACTIVE' && canCancel && (
                      <>
                        <Button
                          variant="warning"
                          onClick={() => handleStorno(tx.id)}
                          disabled={loadingCancel === tx.id}
                          size="small"
                        >
                          Сторно
                        </Button>
                        <Button
                          variant="secondary"
                          onClick={() => handleRefund(tx.id)}
                          disabled={loadingCancel === tx.id}
                          size="small"
                        >
                          Возврат
                        </Button>
                      </>
                    )}
                    <Button
                      variant="danger"
                      onClick={() => handleDelete(tx.id)}
                      disabled={loadingDelete === tx.id}
                      size="small"
                    >
                      {loadingDelete === tx.id ? '...' : 'Удалить'}
                    </Button>
                  </td>
                )}
                <td>
                  <Button variant="secondary" onClick={() => handleViewReceipt(tx.id)} size="small">
                    Чек
                  </Button>
                </td>
              </tr>
            ))}
            {paginatedTransactions.length === 0 && (
              <tr>
                <td colSpan={canDelete ? 8 : 7} className="no-data">
                  Нет операций по заданным фильтрам
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="pagination">
          <Button
            variant="secondary"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            Назад
          </Button>
          <span className="pagination-info">
            Страница {currentPage} из {totalPages}
          </span>
          <Button
            variant="secondary"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            Вперёд
          </Button>
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

      <CancelModal
        isOpen={cancelModal.open}
        onClose={() => setCancelModal({ open: false, type: 'storno', txId: null })}
        onConfirm={confirmCancel}
        title={cancelModal.type === 'storno' ? 'Сторнирование операции' : 'Возврат операции'}
        confirmText={cancelModal.type === 'storno' ? 'Сторнировать' : 'Выполнить возврат'}
      />
    </div>
  );
};

export default HistoryPage;
import React, { useState, useEffect } from 'react';
import { useStore } from '../../store/useStore';
import { updateCashLimit } from '../../api/cashbox';
import { Button, Input } from '../../components/Shared';
import Loader from '../../components/Shared/Loader';
import toast from 'react-hot-toast';
import '../../styles/admin.css';

const AdminPage: React.FC = () => {
  const { cashBalances, fetchCashBalances, updateCashBalance, loadingBalances, errorBalances } = useStore();
  const [editing, setEditing] = useState<string | null>(null);
  const [newLimit, setNewLimit] = useState<number>(0);
  const [inputError, setInputError] = useState<string>('');

  useEffect(() => {
    fetchCashBalances();
  }, [fetchCashBalances]);

  const handleEdit = (code: string, currentAmount: number | string) => {
    setEditing(code);
    setNewLimit(Number(currentAmount));
    setInputError('');
  };

  const handleSave = async (code: string) => {
    if (newLimit < 0) {
      setInputError('Лимит не может быть отрицательным');
      toast.error('Лимит не может быть отрицательным');
      return;
    }
    if (isNaN(newLimit)) {
      setInputError('Введите корректное число');
      toast.error('Введите корректное число');
      return;
    }

    try {
      await updateCashLimit(code, newLimit);
      updateCashBalance(code, newLimit);
      setEditing(null);
      toast.success('Лимит обновлён');
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Не удалось обновить лимит';
      setInputError(msg);
      console.error(err);
    }
  };

  if (loadingBalances) return <Loader />;
  if (errorBalances) return <p className="error-message">{errorBalances}</p>;

  return (
    <div className="container">
      <h1 className="admin-page-title">Настройка лимитов кассы №152</h1>
      <div className="admin-card">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Валюта</th>
              <th>Текущий лимит (остаток)</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {cashBalances.map((bal) => (
              <tr key={bal.currencyCode}>
                <td className="font-medium">{bal.currencyCode}</td>
                <td>
                  {editing === bal.currencyCode ? (
                    <Input
                      type="number"
                      value={newLimit}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        setNewLimit(isNaN(val) ? 0 : val);
                        if (val < 0) setInputError('Лимит не может быть отрицательным');
                        else setInputError('');
                      }}
                      className="admin-input-small"
                    />
                  ) : (
                    <span>{Number(bal.amount).toFixed(2)}</span>
                  )}
                  {editing === bal.currencyCode && inputError && (
                    <p className="error-message-small">{inputError}</p>
                  )}
                </td>
                <td>
                  <div className="admin-actions">
                    {editing === bal.currencyCode ? (
                      <Button variant="primary" onClick={() => handleSave(bal.currencyCode)}>
                        Сохранить
                      </Button>
                    ) : (
                      <Button variant="secondary" onClick={() => handleEdit(bal.currencyCode, bal.amount)}>
                        Редактировать
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminPage;
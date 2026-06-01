import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { Button, Input, Select } from '../../components/Shared';
import toast from 'react-hot-toast';
import '../../styles/limits.css';

interface OperationLimit {
  id: string;
  operationType: 'BUY' | 'SELL' | 'CONVERT';
  currency: string;
  maxAmount: number;
  requiresSupervisorApproval: boolean;
  isActive: boolean;
}

const LimitsPage: React.FC = () => {
  const [limits, setLimits] = useState<OperationLimit[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<OperationLimit>>({});

  const fetchLimits = async () => {
    try {
      const { data } = await api.get('/operation-limits');
      setLimits(data);
    } catch (err) {
      toast.error('Ошибка загрузки лимитов');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLimits();
  }, []);

  const handleCreate = async () => {
    const newLimit = {
      operationType: 'BUY',
      currency: 'USD',
      maxAmount: 1000,
      requiresSupervisorApproval: true,
      isActive: true,
    };
    try {
      const { data } = await api.post('/operation-limits', newLimit);
      setLimits([...limits, data]);
      toast.success('Лимит добавлен');
    } catch (err) {
      toast.error('Ошибка добавления');
    }
  };

  const handleEdit = (limit: OperationLimit) => {
    setEditingId(limit.id);
    setEditForm({ ...limit });
  };

  const handleSave = async (id: string) => {
    try {
      const { data } = await api.put(`/operation-limits/${id}`, editForm);
      setLimits(limits.map(l => (l.id === id ? data : l)));
      setEditingId(null);
      toast.success('Лимит обновлён');
    } catch (err) {
      toast.error('Ошибка обновления');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Удалить лимит?')) return;
    try {
      await api.delete(`/operation-limits/${id}`);
      setLimits(limits.filter(l => l.id !== id));
      toast.success('Лимит удалён');
    } catch (err) {
      toast.error('Ошибка удаления');
    }
  };

  if (loading) return <div className="container">Загрузка...</div>;

  return (
    <div className="container limits-page">
      <h1>Настройка лимитов операций</h1>
      <Button onClick={handleCreate} variant="primary">Добавить лимит</Button>
      <table className="limits-table">
        <thead>
          <tr>
            <th>Тип операции</th>
            <th>Валюта</th>
            <th>Макс. сумма</th>
            <th>Требуется подтверждение</th>
            <th>Активен</th>
            <th>Действия</th>
          </tr>
        </thead>
        <tbody>
          {limits.map(limit => (
            <tr key={limit.id}>
              {editingId === limit.id ? (
                <>
                  <td>
                    <Select
                      value={editForm.operationType}
                      onChange={e => setEditForm({ ...editForm, operationType: e.target.value as any })}
                      options={[
                        { value: 'BUY', label: 'Покупка' },
                        { value: 'SELL', label: 'Продажа' },
                        { value: 'CONVERT', label: 'Конверсия' },
                      ]}
                    />
                  </td>
                  <td>
                    <Input
                      value={editForm.currency}
                      onChange={e => setEditForm({ ...editForm, currency: e.target.value.toUpperCase() })}
                      placeholder="USD"
                    />
                  </td>
                  <td>
                    <Input
                      type="number"
                      value={editForm.maxAmount}
                      onChange={e => setEditForm({ ...editForm, maxAmount: parseFloat(e.target.value) })}
                    />
                  </td>
                  <td>
                    <input
                      type="checkbox"
                      checked={editForm.requiresSupervisorApproval}
                      onChange={e => setEditForm({ ...editForm, requiresSupervisorApproval: e.target.checked })}
                    />
                  </td>
                  <td>
                    <input
                      type="checkbox"
                      checked={editForm.isActive}
                      onChange={e => setEditForm({ ...editForm, isActive: e.target.checked })}
                    />
                  </td>
                  <td>
                    <Button variant="primary" onClick={() => handleSave(limit.id)}>Сохранить</Button>
                    <Button variant="secondary" onClick={() => setEditingId(null)}>Отмена</Button>
                  </td>
                </>
              ) : (
                <>
                  <td>{limit.operationType}</td>
                  <td>{limit.currency}</td>
                  <td>{limit.maxAmount}</td>
                  <td>{limit.requiresSupervisorApproval ? 'Да' : 'Нет'}</td>
                  <td>{limit.isActive ? 'Да' : 'Нет'}</td>
                  <td>
                    <Button variant="secondary" onClick={() => handleEdit(limit)}>Изменить</Button>
                    <Button variant="danger" onClick={() => handleDelete(limit.id)}>Удалить</Button>
                  </td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default LimitsPage;
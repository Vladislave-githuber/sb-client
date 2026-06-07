import React, { useState, useEffect } from 'react';
import { useStore } from '../../store/useStore';
import { startShift, endShift, getCurrentShift } from '../../api/shifts';
import { Button } from '../../components/Shared';
import toast from 'react-hot-toast';
import '../../styles/shift.css';
import api from '../../api/axios';

const ShiftPage: React.FC = () => {
  const { currentShift, setCurrentShift, currentCashier } = useStore();
  const [actionLoading, setActionLoading] = useState(false);

  const isAdmin = currentCashier?.role === 'admin';
  const isSenior = currentCashier?.role === 'senior_cashier';
  const canManageShift = isAdmin || isSenior; // только старший и админ

  const refreshShift = async () => {
    if (!canManageShift) return; // нет прав – не обновляем
    try {
      const shift = await getCurrentShift();
      setCurrentShift(shift);
    } catch (err) {
      console.error('Ошибка обновления смены', err);
      setCurrentShift(null);
    }
  };

  useEffect(() => {
    if (canManageShift) {
      refreshShift();
    }
  }, [canManageShift]);

  const handleStartShift = async () => {
    if (!canManageShift) return;
    setActionLoading(true);
    try {
      await startShift();
      toast.success('Смена открыта');
      await refreshShift();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Ошибка открытия смены');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEndShift = async () => {
    if (!canManageShift) return;
    setActionLoading(true);
    try {
      await endShift();
      toast.success('Смена закрыта');
      await refreshShift();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Ошибка закрытия смены');
    } finally {
      setActionLoading(false);
    }
  };

  const getSafeNumber = (value: number | string | undefined): number => {
    if (value === undefined) return 0;
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return isNaN(num) ? 0 : num;
  };

  // Если нет прав – показываем запрет доступа
  if (!canManageShift) {
    return (
      <div className="container shift-page">
        <h1>Управление сменой</h1>
        <div className="shift-card shift-closed">
          <div className="shift-status-badge closed">Доступ запрещён</div>
          <p className="shift-description">
            Только старший кассир или администратор могут управлять сменой.
          </p>
        </div>
      </div>
    );
  }

  // Загрузка
  if (currentShift === undefined) {
    return <div className="container shift-page">Загрузка...</div>;
  }

  // Нет открытой смены
  if (!currentShift) {
    return (
      <div className="container shift-page">
        <h1>Управление сменой</h1>
        <div className="shift-card shift-closed">
          <div className="shift-status-badge closed">Смена не открыта</div>
          <p className="shift-description">
            Для проведения операций необходимо открыть смену.
          </p>
          <Button onClick={handleStartShift} disabled={actionLoading}>
            {actionLoading ? 'Открытие...' : 'Открыть смену'}
          </Button>
        </div>
      </div>
    );
  }

  const isOpen = currentShift.status === 'OPEN';
  const isBlocked = currentShift.status === 'BLOCKED';

  return (
    <div className="container shift-page">
      <h1>Управление сменой</h1>
      <div className="shift-card">
        <div className="shift-header">
          <div className={`shift-status-badge ${currentShift.status.toLowerCase()}`}>
            {currentShift.status === 'OPEN' && 'Открыта'}
            {currentShift.status === 'CLOSED' && 'Закрыта'}
            {currentShift.status === 'BLOCKED' && 'Заблокирована'}
          </div>
          <div className="shift-id">ID: {currentShift.id.slice(0, 8)}...</div>
        </div>

        <div className="shift-info">
          <div className="shift-info-row">
            <span className="shift-label">Открыта:</span>
            <span className="shift-value">
              {new Date(currentShift.startTime).toLocaleString()}
            </span>
          </div>
          {currentShift.endTime && (
            <div className="shift-info-row">
              <span className="shift-label">Закрыта:</span>
              <span className="shift-value">
                {new Date(currentShift.endTime).toLocaleString()}
              </span>
            </div>
          )}
          <div className="shift-info-row">
            <span className="shift-label">Начальный остаток BYN:</span>
            <span className="shift-value highlight">
              {getSafeNumber(currentShift.startingBalanceBYN).toFixed(2)} BYN
            </span>
          </div>
        </div>

        <div className="shift-actions">
          {isOpen && (
            <Button
              onClick={handleEndShift}
              disabled={actionLoading}
              variant="secondary"
            >
              {actionLoading ? 'Закрытие...' : 'Закрыть смену'}
            </Button>
          )}
          {isAdmin && isOpen && (
            <Button
              onClick={async () => {
                try {
                  await api.put(`/shifts/block/${currentShift.id}`);
                  toast.success('Смена заблокирована');
                  await refreshShift();
                } catch (err) {
                  toast.error('Ошибка блокировки');
                }
              }}
              disabled={actionLoading}
              variant="danger"
            >
              Заблокировать
            </Button>
          )}
          {isAdmin && isBlocked && (
            <Button
              onClick={async () => {
                try {
                  await api.put(`/shifts/unblock/${currentShift.id}`);
                  toast.success('Смена разблокирована');
                  await refreshShift();
                } catch (err) {
                  toast.error('Ошибка разблокировки');
                }
              }}
              disabled={actionLoading}
              variant="primary"
            >
              Разблокировать
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShiftPage;
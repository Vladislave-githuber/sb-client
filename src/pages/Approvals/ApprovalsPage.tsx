import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { Button } from '../../components/Shared';
import toast from 'react-hot-toast';
import '../../styles/approvals.css';

interface ApprovalRequest {
  id: string;
  transactionId: string | null;
  cashierId: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  comment: string;
  createdAt: string;
  supervisorId?: string;
}

const ApprovalsPage: React.FC = () => {
  const [requests, setRequests] = useState<ApprovalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchPending = async () => {
    try {
      const { data } = await api.get('/approvals/pending');
      setRequests(data);
    } catch (err) {
      toast.error('Ошибка загрузки запросов');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
    const interval = setInterval(fetchPending, 10000); // автообновление каждые 10 сек
    return () => clearInterval(interval);
  }, []);

  const handleAction = async (id: string, approve: boolean) => {
    setProcessingId(id);
    try {
      const comment = prompt(approve ? 'Введите комментарий (необязательно)' : 'Укажите причину отклонения');
      if (!approve && !comment) {
        toast.error('Укажите причину отклонения');
        return;
      }
      await api.post(`/approvals/${id}/${approve ? 'approve' : 'reject'}`, { comment });
      toast.success(approve ? 'Запрос одобрен' : 'Запрос отклонён');
      fetchPending();
    } catch (err) {
      toast.error('Ошибка при обработке');
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) return <div className="container">Загрузка...</div>;

  return (
    <div className="container approvals-page">
      <h1>Запросы на подтверждение операций</h1>
      {requests.length === 0 && <p>Нет ожидающих запросов</p>}
      {requests.map(req => (
        <div key={req.id} className="approval-card">
          <div className="approval-header">
            <span>Запрос от {new Date(req.createdAt).toLocaleString()}</span>
            <span className="badge pending">Ожидает</span>
          </div>
          <div className="approval-body">
            <p><strong>Кассир:</strong> {req.cashierId}</p>
            <p><strong>Комментарий:</strong> {req.comment}</p>
            {req.transactionId && <p><strong>ID операции:</strong> {req.transactionId.slice(0,8)}...</p>}
          </div>
          <div className="approval-actions">
            <Button
              variant="primary"
              onClick={() => handleAction(req.id, true)}
              disabled={processingId === req.id}
            >
              Одобрить
            </Button>
            <Button
              variant="danger"
              onClick={() => handleAction(req.id, false)}
              disabled={processingId === req.id}
            >
              Отклонить
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ApprovalsPage;
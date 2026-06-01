import React, { useState } from 'react';
import { Button, Input } from '../Shared';
import '../../styles/cancelmodal.css';

interface CancelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void>;
  title: string;
  confirmText: string;
}

const CancelModal: React.FC<CancelModalProps> = ({ isOpen, onClose, onConfirm, title, confirmText }) => {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (reason.trim().length < 5) {
      setError('Причина должна содержать минимум 5 символов');
      return;
    }
    setLoading(true);
    try {
      await onConfirm(reason);
      onClose();
    } catch (err) {
      setError('Ошибка при выполнении операции');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal cancel-modal">
        <h2>{title}</h2>
        <Input
          label="Причина"
          value={reason}
          onChange={(e) => { setReason(e.target.value); setError(''); }}
          placeholder="Укажите причину отмены"
          textarea
          rows={3}
        />
        {error && <p className="error-text">{error}</p>}
        <div className="modal-actions">
          <Button variant="secondary" onClick={onClose}>Отмена</Button>
          <Button variant="danger" onClick={handleSubmit} disabled={loading}>
            {loading ? 'Обработка...' : confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CancelModal;
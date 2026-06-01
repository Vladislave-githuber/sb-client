import React, { useState, useEffect } from 'react';
import { Button, Input } from '../Shared';
import PassportInput, { type PassportData } from './PassportInput';
import type { IClient } from '../../types';
import '../../styles/cancelmodal.css';

interface ClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (client: Omit<IClient, 'id' | 'createdAt'>) => Promise<void>;
  initialData?: IClient | null;
}

const ClientModal: React.FC<ClientModalProps> = ({ isOpen, onClose, onSave, initialData }) => {
  const [form, setForm] = useState({
    fullName: '',
    personalNumber: '',
    isResident: true,
    phone: '',
  });
  const [passport, setPassport] = useState<PassportData>({
    passportNumber: '',
    passportIssuedBy: '',
    passportIssueDate: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialData) {
      setForm({
        fullName: initialData.fullName || '',
        personalNumber: initialData.personalNumber || '',
        isResident: initialData.isResident,
        phone: initialData.phone || '',
      });
      setPassport({
        passportNumber: initialData.passportNumber || '',
        passportIssuedBy: initialData.passportIssuedBy || '',
        passportIssueDate: initialData.passportIssueDate?.split('T')[0] || '',
      });
    } else {
      setForm({
        fullName: '',
        personalNumber: '',
        isResident: true,
        phone: '',
      });
      setPassport({
        passportNumber: '',
        passportIssuedBy: '',
        passportIssueDate: '',
      });
    }
  }, [initialData]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const clientData = {
        ...form,
        ...passport,
      };
      await onSave(clientData);
      onClose();
    } catch (err) {
      // ошибка уже обработана в onSave или interceptor
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal client-modal">
        <h2>{initialData ? 'Редактировать клиента' : 'Новый клиент'}</h2>
        <form onSubmit={handleSubmit}>
          <Input
            label="ФИО"
            value={form.fullName}
            onChange={(e) => setForm({ ...form, fullName: e.target.value })}
            required
          />
          <PassportInput
            value={passport}
            onChange={setPassport}
            required
          />
          <Input
            label="Личный номер (ИНН)"
            value={form.personalNumber}
            onChange={(e) => setForm({ ...form, personalNumber: e.target.value })}
          />
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={form.isResident}
              onChange={(e) => setForm({ ...form, isResident: e.target.checked })}
            />
            Резидент
          </label>
          <Input
            label="Телефон"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
          <div className="modal-actions">
            <Button type="button" variant="secondary" onClick={onClose}>Отмена</Button>
            <Button type="submit" disabled={loading}>{loading ? 'Сохранение...' : 'Сохранить'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ClientModal;
import React, { useState } from 'react';
import { Button } from '../Shared';
import toast from 'react-hot-toast';
import type { IReceiptData } from '../../types';

interface ReceiptModalProps {
  isOpen: boolean;
  receiptData: IReceiptData | null;
  onClose: () => void;
}

const ReceiptModal: React.FC<ReceiptModalProps> = ({
  isOpen,
  receiptData,
  onClose,
}) => {
  const [isPrinting, setIsPrinting] = useState(false);

  if (!isOpen || !receiptData) return null;

  const { transaction, cashier, officeNumber } = receiptData;
  const token = localStorage.getItem('token');

  // ПЕЧАТЬ — через blob + window.open + setTimeout
  const handlePrint = async () => {
    if (!transaction?.id) {
      toast.error('Нет данных для печати чека');
      return;
    }

    setIsPrinting(true);

    try {
      const response = await fetch(
        `http://localhost:3000/receipts/transaction/${transaction.id}/pdf`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Ошибка загрузки PDF');
      }

      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const printWindow = window.open(blobUrl);

      if (!printWindow) {
        toast.error('Браузер заблокировал всплывающее окно');
        URL.revokeObjectURL(blobUrl);
        return;
      }

      // Даём время на загрузку PDF, затем вызываем печать
      setTimeout(() => {
        printWindow.focus();
        printWindow.print();
      }, 1000);
    } catch (err) {
      console.error(err);
      toast.error('Не удалось распечатать чек');
    } finally {
      setIsPrinting(false);
    }
  };

  // СКАЧИВАНИЕ — тоже через blob, но с созданием <a>
  const handleDownload = async () => {
    if (!transaction?.id) {
      toast.error('Нет данных для скачивания чека');
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:3000/receipts/transaction/${transaction.id}/pdf`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Ошибка загрузки PDF');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `receipt-${transaction.id}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      toast.error('Не удалось скачать чек');
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2 className="modal-title">Чек операции</h2>
        <div className="modal-content">
          <p><strong>Операция:</strong> {transaction.type}</p>
          <p><strong>Сумма отдано:</strong> {transaction.sumIn} {transaction.currencyIn}</p>
          <p><strong>Сумма получено:</strong> {transaction.sumOut} {transaction.currencyOut}</p>
          <p><strong>Дата:</strong> {new Date(transaction.createdAt).toLocaleString()}</p>
          <p><strong>Кассир:</strong> {cashier.fullName} (таб. №{cashier.tabNumber})</p>
          <p><strong>Офис:</strong> {officeNumber}</p>
        </div>
        <div className="modal-actions">
          <Button variant="secondary" onClick={onClose} fullWidth>
            Закрыть
          </Button>
          <Button onClick={handlePrint} fullWidth disabled={isPrinting}>
            {isPrinting ? 'Подготовка...' : 'Печать'}
          </Button>
          <Button onClick={handleDownload} fullWidth>
            Скачать чек (PDF)
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ReceiptModal;
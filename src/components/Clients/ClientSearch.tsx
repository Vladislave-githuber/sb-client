import React, { useState, useEffect, useRef } from 'react';
import { useClients } from '../../hooks/useClients';
import { Input } from '../Shared';
import type { IClient } from '../../types';
import '../../styles/clientsearch.css';

interface ClientSearchProps {
  onSelect: (client: IClient | null) => void;
  disabled?: boolean;
  selectedClient?: IClient | null;
}

const ClientSearch: React.FC<ClientSearchProps> = ({ onSelect, disabled, selectedClient }) => {
  const [query, setQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const { clients, loading, search } = useClients();
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Обновляем поле ввода при выборе клиента извне
  useEffect(() => {
    if (selectedClient) {
      setQuery(`${selectedClient.fullName} (${selectedClient.passportNumber})`);
    } else {
      setQuery('');
    }
  }, [selectedClient]);

  // Закрытие дропдауна при клике вне компонента
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Дебаунс поиска
  useEffect(() => {
    const delay = setTimeout(() => {
      if (query.trim() && showDropdown) {
        search(query);
      } else if (!query.trim()) {
        search('');
      }
    }, 300);
    return () => clearTimeout(delay);
  }, [query, search, showDropdown]);

  const handleSelect = (client: IClient) => {
    onSelect(client);
    setQuery(`${client.fullName} (${client.passportNumber})`);
    setShowDropdown(false);
  };

  const handleClear = () => {
    onSelect(null);
    setQuery('');
    setShowDropdown(false);
  };

  return (
    <div className="client-search" ref={wrapperRef}>
      <div className="client-search-input-wrapper">
        <Input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setShowDropdown(true);
            if (!e.target.value.trim()) onSelect(null);
          }}
          onFocus={() => setShowDropdown(true)}
          placeholder="Поиск клиента по ФИО, паспорту или ИНН"
          disabled={disabled}
        />
        {selectedClient && (
          <button type="button" className="client-clear-btn" onClick={handleClear}>✖</button>
        )}
      </div>

      {showDropdown && (query.trim() !== '' || clients.length > 0) && (
        <ul className="client-dropdown">
          {loading && <li>Загрузка...</li>}
          {clients.map((client) => (
            <li key={client.id} onClick={() => handleSelect(client)}>
              {client.fullName} – {client.passportNumber}
            </li>
          ))}
          {!loading && clients.length === 0 && query && <li>Ничего не найдено</li>}
        </ul>
      )}

      {/* Отображение паспортных данных выбранного клиента */}
      {selectedClient && (
        <div className="client-details">
          <div className="client-detail-row">
            <span className="detail-label">Паспорт:</span>
            <span className="detail-value">{selectedClient.passportNumber}</span>
          </div>
          <div className="client-detail-row">
            <span className="detail-label">Выдан:</span>
            <span className="detail-value">{selectedClient.passportIssuedBy || '—'}</span>
          </div>
          <div className="client-detail-row">
            <span className="detail-label">Дата выдачи:</span>
            <span className="detail-value">
              {selectedClient.passportIssueDate ? new Date(selectedClient.passportIssueDate).toLocaleDateString() : '—'}
            </span>
          </div>
          <div className="client-detail-row">
            <span className="detail-label">Резидент:</span>
            <span className="detail-value">{selectedClient.isResident ? 'Да' : 'Нет'}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientSearch;
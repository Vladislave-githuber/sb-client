import React, { useState, useEffect } from 'react';
import { useStore } from '../../store/useStore';
import { searchClients, deleteClient } from '../../api/clients';
import ClientModal from '../../components/Clients/ClientModal';
import { Button, Input } from '../../components/Shared';
import { useClients } from '../../hooks/useClients';
import toast from 'react-hot-toast';
import '../../styles/clientsearch.css';

const ClientsPage: React.FC = () => {
  const { currentCashier } = useStore();
  const role = currentCashier?.role;
  const isAdmin = role === 'admin';
  const canEdit = role === 'admin' || role === 'senior_cashier';
  const isEconomist = role === 'economist';

  const { addClient, editClient } = useClients();
  const [clients, setClients] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [_loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<any>(null);

  const loadClients = async () => {
    setLoading(true);
    try {
      const data = await searchClients(search);
      setClients(data);
    } catch (err) {
      toast.error('Ошибка загрузки');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClients();
  }, [search]);

  const handleSave = async (data: any) => {
    if (!canEdit) return;
    if (editingClient) {
      await editClient(editingClient.id, data);
      toast.success('Клиент обновлён');
    } else {
      await addClient(data);
      toast.success('Клиент добавлен');
    }
    loadClients();
    setModalOpen(false);
    setEditingClient(null);
  };

  const handleDelete = async (id: string) => {
    if (!isAdmin) return;
    if (window.confirm('Вы уверены, что хотите удалить этого клиента?')) {
      await deleteClient(id);
      toast.success('Клиент удалён');
      loadClients();
    }
  };

  const residentCount = clients.filter(c => c.isResident).length;
  const nonResidentCount = clients.filter(c => !c.isResident).length;

  // Общая разметка карточек статистики (вынесена, чтобы не дублировать)
  const statsSection = (
    <div className="stats-cards">
      <div className="stat-card">
        <div className="stat-label">Всего клиентов</div>
        <div className="stat-value">{clients.length}</div>
      </div>
      <div className="stat-card">
        <div className="stat-label">Резиденты</div>
        <div className="stat-value">{residentCount}</div>
      </div>
      <div className="stat-card">
        <div className="stat-label">Нерезиденты</div>
        <div className="stat-value">{nonResidentCount}</div>
      </div>
    </div>
  );

  // Таблица для режима только просмотра (экономист)
  const readOnlyTable = (
    <div className="history-table-container">
      <table className="history-table">
        <thead>
          <tr>
            <th>ФИО</th>
            <th>Паспорт</th>
            <th>Телефон</th>
            <th>Резидент</th>
          </tr>
        </thead>
        <tbody>
          {clients.map(c => (
            <tr key={c.id}>
              <td className="client-fullname">{c.fullName}</td>
              <td className="client-passport">{c.passportNumber}</td>
              <td>{c.phone || '—'}</td>
              <td>
                <span className={`status-badge ${c.isResident ? 'status-active' : 'status-storno'}`}>
                  {c.isResident ? 'Резидент' : 'Нерезидент'}
                </span>
              </td>
            </tr>
          ))}
          {clients.length === 0 && (
            <tr>
              <td colSpan={4} className="no-data">
                {search ? 'Клиенты не найдены' : 'Нет добавленных клиентов'}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );

  // Полная таблица с действиями (админ / старший кассир)
  const fullTable = (
    <div className="history-table-container">
      <table className="history-table">
        <thead>
          <tr>
            <th>ФИО</th>
            <th>Паспорт</th>
            <th>Телефон</th>
            <th>Резидент</th>
            <th>Действия</th>
          </tr>
        </thead>
        <tbody>
          {clients.map(c => (
            <tr key={c.id}>
              <td className="client-fullname">{c.fullName}</td>
              <td className="client-passport">{c.passportNumber}</td>
              <td>{c.phone || '—'}</td>
              <td>
                <span className={`status-badge ${c.isResident ? 'status-active' : 'status-storno'}`}>
                  {c.isResident ? 'Резидент' : 'Нерезидент'}
                </span>
              </td>
              <td className="actions-cell">
                <Button
                  variant="secondary"
                  size="small"
                  onClick={() => {
                    setEditingClient(c);
                    setModalOpen(true);
                  }}
                >
                  Изменить
                </Button>
                {isAdmin && (
                  <Button variant="danger" size="small" onClick={() => handleDelete(c.id)}>
                    Удалить
                  </Button>
                )}
              </td>
            </tr>
          ))}
          {clients.length === 0 && (
            <tr>
              <td colSpan={5} className="no-data">
                {search ? 'Клиенты не найдены' : 'Нет добавленных клиентов'}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );

  // Режим экономиста (только чтение)
  if (isEconomist && !canEdit) {
    return (
      <div className="container">
        <h1 className="history-page-title">Клиенты (просмотр)</h1>
        {statsSection}
        <div className="filters-bar">
          <Input
            placeholder="Поиск по ФИО, паспорту, телефону..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="filter-input"
          />
        </div>
        {readOnlyTable}
      </div>
    );
  }

  // Полный интерфейс для администратора и старшего кассира
  return (
    <div className="container">
      <h1 className="history-page-title">Управление клиентами</h1>

      {statsSection}

      <div className="filters-bar">
        <Input
          placeholder="Поиск по ФИО, паспорту, телефону..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="filter-input"
        />
        <Button
          onClick={() => {
            setEditingClient(null);
            setModalOpen(true);
          }}
          variant="primary"
        >
          + Новый клиент
        </Button>
      </div>

      {fullTable}

      <ClientModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingClient(null);
        }}
        onSave={handleSave}
        initialData={editingClient}
      />
    </div>
  );
};

export default ClientsPage;
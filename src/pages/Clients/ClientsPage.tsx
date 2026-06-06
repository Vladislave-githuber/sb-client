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
  const canView = canEdit || role === 'economist'; // экономист только просмотр

  const { addClient, editClient } = useClients();
  const [clients, setClients] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
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
    if (canView) loadClients();
  }, [search, canView]);

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

  if (!canView) return <div className="container">Доступ запрещён</div>;

  const residentCount = clients.filter(c => c.isResident).length;
  const nonResidentCount = clients.filter(c => !c.isResident).length;

  return (
    <div className="container clients-container">
      <h1 className="clients-page-title">Управление клиентами</h1>
      <div className="clients-stats">
        <div className="stat-card"><div className="stat-label">Всего клиентов</div><div className="stat-value">{clients.length}</div></div>
        <div className="stat-card"><div className="stat-label">Резиденты</div><div className="stat-value">{residentCount}</div></div>
        <div className="stat-card"><div className="stat-label">Нерезиденты</div><div className="stat-value">{nonResidentCount}</div></div>
      </div>
      <div className="clients-toolbar">
        <Input placeholder="Поиск..." value={search} onChange={(e) => setSearch(e.target.value)} className="clients-search-input" />
        {canEdit && <Button onClick={() => { setEditingClient(null); setModalOpen(true); }} variant="primary">+ Новый клиент</Button>}
      </div>
      <div className="clients-table-container">
        <table className="clients-table">
          <thead><tr><th>ФИО</th><th>Паспорт</th><th>Телефон</th><th>Резидент</th><th>Действия</th></tr></thead>
          <tbody>
            {clients.map(c => (
              <tr key={c.id}>
                <td>{c.fullName}</td><td>{c.passportNumber}</td><td>{c.phone || '---'}</td>
                <td><span className={`resident-badge ${c.isResident ? 'resident-yes' : 'resident-no'}`}>{c.isResident ? 'Резидент' : 'Нерезидент'}</span></td>
                <td className="actions-cell">
                  {canEdit && <Button variant="secondary" size="small" onClick={() => { setEditingClient(c); setModalOpen(true); }}>Изменить</Button>}
                  {isAdmin && <Button variant="danger" size="small" onClick={() => handleDelete(c.id)}>Удалить</Button>}
                </td>
              </tr>
            ))}
            {clients.length === 0 && <tr><td colSpan={5} className="no-data">{search ? 'Клиенты не найдены' : 'Нет добавленных клиентов'}</td></tr>}
          </tbody>
        </table>
      </div>
      <ClientModal isOpen={modalOpen} onClose={() => { setModalOpen(false); setEditingClient(null); }} onSave={handleSave} initialData={editingClient} />
    </div>
  );
};

export default ClientsPage;
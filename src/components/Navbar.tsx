import React, { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Home, History, Settings, LogOut, FileText, List, Users, Clock, ChevronDown,
  Wallet, CheckCircle, Shield, Receipt, ShieldAlert, PieChart
} from 'lucide-react';
import { useStore } from '../store/useStore';
import '../styles/navbar.css';
import { pageConfig } from './PageConfig';

const Navbar: React.FC = () => {
  const setCurrentCashier = useStore((state) => state.setCurrentCashier);
  const currentCashier = useStore((state) => state.currentCashier);
  const navigate = useNavigate();

  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const reportsDropdownRef = useRef<HTMLDivElement>(null);
  const manageDropdownRef = useRef<HTMLDivElement>(null);

  const isAdmin = currentCashier?.role === 'admin';
  const isAdminOrSenior = isAdmin || currentCashier?.role === 'senior_cashier';
  const isEconomist = currentCashier?.role === 'economist';

  const handleLogout = () => {
    localStorage.removeItem('token');
    setCurrentCashier(null);
    navigate(pageConfig.login);
  };

  const toggleDropdown = (name: string) => {
    setOpenDropdown(openDropdown === name ? null : name);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const isInsideReports = reportsDropdownRef.current?.contains(target);
      const isInsideManage = manageDropdownRef.current?.contains(target);

      if (!isInsideReports && !isInsideManage) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <NavLink to={pageConfig.dashboard}>
          <div className="navbar-logo">Касса №152</div>
        </NavLink>
        <div className="navbar-links">
          {/* Обмен – скрыт для экономиста */}
          {!isEconomist && (
            <NavLink to={pageConfig.exchange} className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
              <Home size={20} />
              <span>Обмен</span>
            </NavLink>
          )}

          <NavLink to={pageConfig.history} className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
            <History size={20} />
            <span>История</span>
          </NavLink>

          {/* Смена – скрыта для экономиста */}
          {!isEconomist && (
            <NavLink to={pageConfig.shift} className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
              <Clock size={20} />
              <span>Смена</span>
            </NavLink>
          )}

          {/* Dropdown Отчёты – доступен экономисту */}
          <div className="dropdown" ref={reportsDropdownRef}>
            <button
              className={`nav-link dropdown-toggle ${openDropdown === 'reports' ? 'active' : ''}`}
              onClick={() => toggleDropdown('reports')}
            >
              <FileText size={20} />
              <span>Отчёты</span>
              <ChevronDown size={16} className="dropdown-arrow" />
            </button>
            {openDropdown === 'reports' && (
              <div className="dropdown-menu">
                <NavLink to={pageConfig.cashReports} className="dropdown-item" onClick={() => setOpenDropdown(null)}>
                  <Receipt size={16} />
                  <span>Кассовые отчёты</span>
                </NavLink>
                <NavLink to={pageConfig.auditControl} className="dropdown-item" onClick={() => setOpenDropdown(null)}>
                  <List size={16} />
                  <span>Аудит и контроль</span>
                </NavLink>
                <NavLink to={pageConfig.financialAnalysis} className="dropdown-item" onClick={() => setOpenDropdown(null)}>
                  <PieChart size={16} />
                  <span>Финансовый анализ</span>
                </NavLink>
                <NavLink to={pageConfig.amlMonitoring} className="dropdown-item" onClick={() => setOpenDropdown(null)}>
                  <ShieldAlert size={16} />
                  <span>AML-мониторинг</span>
                </NavLink>
              </div>
            )}
          </div>

          {/* Dropdown Управление – скрыто для экономиста */}
          {isAdminOrSenior && !isEconomist && (
            <div className="dropdown" ref={manageDropdownRef}>
              <button
                className={`nav-link dropdown-toggle ${openDropdown === 'manage' ? 'active' : ''}`}
                onClick={() => toggleDropdown('manage')}
              >
                <Settings size={20} />
                <span>Управление</span>
                <ChevronDown size={16} className="dropdown-arrow" />
              </button>
              {openDropdown === 'manage' && (
                <div className="dropdown-menu">
                  <NavLink to={pageConfig.clients} className="dropdown-item" onClick={() => setOpenDropdown(null)}>
                    <Users size={16} />
                    <span>Клиенты</span>
                  </NavLink>
                  <NavLink to={pageConfig.cash_ledger} className="dropdown-item" onClick={() => setOpenDropdown(null)}>
                    <Wallet size={16} />
                    <span>Касса (остатки)</span>
                  </NavLink>
                  <NavLink to={pageConfig.cash_reconciliation} className="dropdown-item" onClick={() => setOpenDropdown(null)}>
                    <Wallet size={16} />
                    <span>Сверка кассы</span>
                  </NavLink>
                  {isAdmin && (
                    <NavLink to={pageConfig.limits} className="dropdown-item" onClick={() => setOpenDropdown(null)}>
                      <Shield size={16} />
                      <span>Лимиты операций</span>
                    </NavLink>
                  )}
                  <NavLink to={pageConfig.approvals} className="dropdown-item" onClick={() => setOpenDropdown(null)}>
                    <CheckCircle size={16} />
                    <span>Подтверждения</span>
                  </NavLink>
                  {isAdmin && (
                    <>
                      <NavLink to={pageConfig.admin} className="dropdown-item" onClick={() => setOpenDropdown(null)}>
                        <Settings size={16} />
                        <span>Лимиты кассы</span>
                      </NavLink>
                      <NavLink to={pageConfig.logs} className="dropdown-item" onClick={() => setOpenDropdown(null)}>
                        <List size={16} />
                        <span>Логи</span>
                      </NavLink>
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          <button onClick={handleLogout} className="nav-link logout-btn">
            <LogOut size={20} />
            <span>Выход</span>
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
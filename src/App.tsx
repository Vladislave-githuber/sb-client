import React, { useEffect, useState, type JSX } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useStore } from './store/useStore';
import LoginPage from './pages/LoginPage/LoginPage';
import ExchangePage from './pages/ExchangePage/ExchangePage';
import AdminPage from './pages/AdminPage/AdminPage';
import HistoryPage from './pages/HistoryPage/HistoryPage';
import Navbar from './components/Navbar';
import Loader from './components/Shared/Loader';
import { pageConfig } from './components/PageConfig';
import LogsPage from './pages/LogsPage/LogsPage';
import DashboardPage from './pages/DashboardPage/DashboardPage';
import ClientsPage from './pages/Clients/ClientsPage';
import ShiftPage from './pages/ShiftPage/ShiftPage';
import CashLedgerPage from './pages/CashLedgerPage/CashLedgerPage';
import CashReconciliationPage from './pages/CashReconciliation/CashReconciliationPage';
import LimitsPage from './pages/LimitsPage/LimitsPage';
import ApprovalsPage from './pages/Approvals/ApprovalsPage';
import CashReportsPage from './pages/CashReportsPage/CashReportsPage';
import AuditControlPage from './pages/AuditControlPage/AuditControlPage';
import FinancialAnalysisPage from './pages/FinancialAnalysisPage/FinancialAnalysisPage';
import AmlMonitoringPage from './pages/AmlMonitoringPage/AmlMonitoringPage';
import type { IUser } from './types';
import api from './api/axios';

// Компонент для защиты маршрутов по ролям
const RoleBasedRoute = ({ children, allowedRoles }: { children: JSX.Element; allowedRoles: IUser['role'][] }) => {
  const currentCashier = useStore((state) => state.currentCashier);
  if (!currentCashier) return <Navigate to={pageConfig.login} replace />;
  if (!allowedRoles.includes(currentCashier.role)) {
    return <Navigate to={pageConfig.dashboard} replace />;
  }
  return children;
};

const ProtectedLayout: React.FC = () => {
  const currentCashier = useStore((state) => state.currentCashier);
  if (!currentCashier) return <Navigate to={pageConfig.login} replace />;
  return (
    <>
      <Navbar />
      <Outlet />
    </>
  );
};

function App() {
  const { setCurrentCashier, setCurrentShift } = useStore();
  const [isLoading, setIsLoading] = useState(true);

  const { init } = useStore();

  useEffect(() => {
    init();
  }, [init]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    if (token && savedUser) {
      try {
        const user = JSON.parse(savedUser);
        setCurrentCashier(user);
      } catch (e) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    setIsLoading(false);
  }, [setCurrentCashier]);

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const response = await api.get('/shifts/current');
        setCurrentShift(response.data);
      } catch {
        setCurrentShift(null);
      }
    }, 30000); // каждые 30 секунд
    return () => clearInterval(interval);
  }, [setCurrentShift]);

  if (isLoading) return <Loader />;

  return (
    <BrowserRouter>
      <Routes>
        <Route path={pageConfig.login} element={<LoginPage />} />
        <Route element={<ProtectedLayout />}>
          {/* Доступно всем авторизованным */}
          <Route path={pageConfig.dashboard} element={<DashboardPage />} />
          <Route path={pageConfig.history} element={<HistoryPage />} />
          <Route path={pageConfig.clients} element={
            <RoleBasedRoute allowedRoles={['admin', 'senior_cashier', 'economist']}>
              <ClientsPage />
            </RoleBasedRoute>
          } />
          <Route path={pageConfig.cash_ledger} element={
            <RoleBasedRoute allowedRoles={['admin', 'senior_cashier', 'cashier', 'economist']}>
              <CashLedgerPage />
            </RoleBasedRoute>
          } />
          <Route path={pageConfig.cashReports} element={
            <RoleBasedRoute allowedRoles={['admin', 'senior_cashier', 'economist']}>
              <CashReportsPage />
            </RoleBasedRoute>
          } />
          <Route path={pageConfig.auditControl} element={
            <RoleBasedRoute allowedRoles={['admin', 'senior_cashier', 'economist']}>
              <AuditControlPage />
            </RoleBasedRoute>
          } />
          <Route path={pageConfig.financialAnalysis} element={
            <RoleBasedRoute allowedRoles={['admin', 'senior_cashier', 'economist']}>
              <FinancialAnalysisPage />
            </RoleBasedRoute>
          } />
          <Route path={pageConfig.amlMonitoring} element={
            <RoleBasedRoute allowedRoles={['admin', 'senior_cashier', 'economist']}>
              <AmlMonitoringPage />
            </RoleBasedRoute>
          } />
          <Route path={pageConfig.logs} element={
            <RoleBasedRoute allowedRoles={['admin', 'economist']}>
              <LogsPage />
            </RoleBasedRoute>
          } />

          {/* Только для кассиров, старших кассиров и админов (не экономист) */}
          <Route path={pageConfig.exchange} element={
            <RoleBasedRoute allowedRoles={['cashier', 'senior_cashier', 'admin']}>
              <ExchangePage />
            </RoleBasedRoute>
          } />
          <Route path={pageConfig.shift} element={
            <RoleBasedRoute allowedRoles={['senior_cashier', 'admin']}>
              <ShiftPage />
            </RoleBasedRoute>
          } />
          <Route path={pageConfig.cash_reconciliation} element={
            <RoleBasedRoute allowedRoles={['cashier', 'senior_cashier', 'admin']}>
              <CashReconciliationPage />
            </RoleBasedRoute>
          } />
          <Route path={pageConfig.approvals} element={
            <RoleBasedRoute allowedRoles={['senior_cashier', 'admin']}>
              <ApprovalsPage />
            </RoleBasedRoute>
          } />

          {/* Только для администратора */}
          <Route path={pageConfig.admin} element={
            <RoleBasedRoute allowedRoles={['admin']}>
              <AdminPage />
            </RoleBasedRoute>
          } />
          <Route path={pageConfig.limits} element={
            <RoleBasedRoute allowedRoles={['admin']}>
              <LimitsPage />
            </RoleBasedRoute>
          } />
        </Route>
        <Route path="*" element={<Navigate to={pageConfig.exchange} replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
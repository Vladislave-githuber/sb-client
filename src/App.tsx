import React, { useEffect, useState } from 'react';
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

const ProtectedLayout: React.FC = () => {
  const currentCashier = useStore((state) => state.currentCashier);
  if (!currentCashier) {
    return <Navigate to={pageConfig.login} replace />;
  }
  return (
    <>
      <Navbar />
      <Outlet />
    </>
  );
};

function App() {
  const { setCurrentCashier } = useStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Восстанавливаем сессию из localStorage
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    if (token && savedUser) {
      try {
        const user = JSON.parse(savedUser);
        setCurrentCashier(user);
      } catch (e) {
        // Если данные повреждены – чистим хранилище
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    setIsLoading(false);
  }, [setCurrentCashier]);

  if (isLoading) {
    return <Loader />;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path={pageConfig.login} element={<LoginPage />} />
        <Route element={<ProtectedLayout />}>
          <Route path={pageConfig.dashboard} element={<DashboardPage />} />
          <Route path={pageConfig.exchange} element={<ExchangePage />} />
          <Route path={pageConfig.history} element={<HistoryPage />} />
          <Route path={pageConfig.admin} element={<AdminPage />} />
          <Route path={pageConfig.logs} element={<LogsPage />} />
          <Route path={pageConfig.clients} element={<ClientsPage />} />
          <Route path={pageConfig.shift} element={<ShiftPage />} />
          <Route path={pageConfig.cash_ledger} element={<CashLedgerPage />} />
          <Route path={pageConfig.cash_reconciliation} element={<CashReconciliationPage />} />
          <Route path={pageConfig.limits} element={<LimitsPage />} />
          <Route path={pageConfig.approvals} element={<ApprovalsPage />} />
          <Route path={pageConfig.cashReports} element={<CashReportsPage />} />
          <Route path={pageConfig.auditControl} element={<AuditControlPage />} />
          <Route path={pageConfig.financialAnalysis} element={<FinancialAnalysisPage />} />
          <Route path={pageConfig.amlMonitoring} element={<AmlMonitoringPage />} />
        </Route>
        <Route path="*" element={<Navigate to={pageConfig.exchange} replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
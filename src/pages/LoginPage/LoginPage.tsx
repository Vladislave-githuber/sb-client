import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import { loginByTabNumber } from '../../api/auth';
import { Button, Input } from '../../components/Shared';
import toast from 'react-hot-toast';
import '../../styles/login.css';
import { pageConfig } from '../../components/PageConfig';

const LoginPage: React.FC = () => {
  const [tabNumber, setTabNumber] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const setCurrentCashier = useStore((state) => state.setCurrentCashier);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!tabNumber.trim()) {
      toast.error('Введите табельный номер');
      return;
    }
    if (!password.trim()) {
      toast.error('Введите пароль');
      return;
    }

    setLoading(true);
    try {
      const response = await loginByTabNumber({ tabNumber, password });
      localStorage.setItem('token', response.accessToken);
      localStorage.setItem('user', JSON.stringify(response.user));
      setCurrentCashier(response.user);
      toast.success(`Добро пожаловать, ${response.user.fullName}`);
      navigate(pageConfig.dashboard);
    } catch (err: any) {
      // Ошибка уже показывается в axios interceptor
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <h1 className="login-title">Вход в кассу</h1>
        <form onSubmit={handleSubmit} className="login-form">
          <Input
            label="Табельный номер"
            value={tabNumber}
            onChange={(e) => setTabNumber(e.target.value)}
            placeholder="Введите табельный номер"
            disabled={loading}
            autoComplete="off"
          />
          <Input
            label="Пароль"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Введите пароль"
            disabled={loading}
            autoComplete="off"
          />
          <Button type="submit" fullWidth disabled={loading}>
            {loading ? 'Вход...' : 'Войти'}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
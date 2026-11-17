import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { DashboardPage } from './pages/DashboardPage';
import { QuickSalePage } from './pages/QuickSalePage';
import { SalesOrdersPage } from './pages/SalesOrdersPage';
import { PurchaseOrdersPage } from './pages/PurchaseOrdersPage';
import { InventoryPage } from './pages/InventoryPage';
import { CustomersPage } from './pages/CustomersPage';
import { SuppliersPage } from './pages/SuppliersPage';
import { DebtPage } from './pages/DebtPage';
import { ProductsPage } from './pages/ProductsPage';
import { ReportsPage } from './pages/ReportsPage';
import { SettingsPage } from './pages/SettingsPage';
import { LoginPage } from './pages/LoginPage';
import { User } from './types';
import { api } from './api/client';

export const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('constructos_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('constructos_token');
  });

  // Verify current user on mount if token exists
  useEffect(() => {
    if (token && !currentUser) {
      api
        .get('/auth/me')
        .then((res) => {
          setCurrentUser(res.data);
          localStorage.setItem('constructos_user', JSON.stringify(res.data));
        })
        .catch(() => {
          handleLogout();
        });
    }
  }, [token]);

  // Global F2 keyboard shortcut to open POS
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        e.preventDefault();
        window.location.href = '/pos';
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleLoginSuccess = (user: User, accessToken: string) => {
    setCurrentUser(user);
    setToken(accessToken);
    localStorage.setItem('constructos_token', accessToken);
    localStorage.setItem('constructos_user', JSON.stringify(user));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setToken(null);
    localStorage.removeItem('constructos_token');
    localStorage.removeItem('constructos_user');
  };

  const handleSwitchRole = async (username: string) => {
    const passwordMap: Record<string, string> = {
      admin: 'Admin@123',
      sales: 'Sales@123',
      warehouse: 'Warehouse@123',
      accountant: 'Accountant@123',
    };
    try {
      const res = await api.post('/auth/login', {
        username,
        password: passwordMap[username] || 'Admin@123',
      });
      handleLoginSuccess(res.data.user, res.data.accessToken);
    } catch (err) {
      console.error('Failed to switch role', err);
    }
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={
            token ? <Navigate to="/" replace /> : <LoginPage onLoginSuccess={handleLoginSuccess} />
          }
        />

        <Route
          path="/"
          element={
            token ? (
              <Layout
                currentUser={currentUser}
                onLogout={handleLogout}
                onSwitchRole={handleSwitchRole}
              />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="pos" element={<QuickSalePage />} />
          <Route path="sales-orders" element={<SalesOrdersPage />} />
          <Route path="purchase-orders" element={<PurchaseOrdersPage />} />
          <Route path="inventory" element={<InventoryPage />} />
          <Route path="customers" element={<CustomersPage />} />
          <Route path="suppliers" element={<SuppliersPage />} />
          <Route path="debt" element={<DebtPage />} />
          <Route path="products" element={<ProductsPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

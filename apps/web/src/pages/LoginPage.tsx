import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Store, ShieldCheck, ArrowRight, UserCheck } from 'lucide-react';
import { api } from '../api/client';
import { User } from '../types';

interface LoginPageProps {
  onLoginSuccess: (user: User, token: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('Admin@123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (u = username, p = password) => {
    try {
      setLoading(true);
      setError('');
      const res = await api.post('/auth/login', { username: u, password: p });
      const { accessToken, user } = res.data;
      onLoginSuccess(user, accessToken);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Đăng nhập thất bại. Kiểm tra lại thông tin.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (roleUser: string, rolePass: string) => {
    setUsername(roleUser);
    setPassword(rolePass);
    handleLogin(roleUser, rolePass);
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4 selection:bg-brand-500 selection:text-white font-sans">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-brand-600 font-mono font-bold text-white text-xl shadow-lg border border-brand-500 mb-2">
            cOS
          </div>
          <h1 className="text-2xl font-bold font-mono tracking-tight text-white">
            constructOS
          </h1>
          <p className="text-xs text-zinc-400">
            Hệ thống Quản lý Bán hàng & Kho Bãi Vật liệu Xây dựng
          </p>
        </div>

        {/* Login Box */}
        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-none shadow-2xl space-y-5">
          {error && (
            <div className="p-3 bg-red-950/60 border border-red-800 text-red-300 text-xs font-mono">
              {error}
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleLogin();
            }}
            className="space-y-4 text-xs"
          >
            <div>
              <label className="font-semibold text-zinc-300 block mb-1 font-mono uppercase text-[11px]">
                Tên đăng nhập / Email
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-zinc-850 border border-zinc-700 p-2.5 rounded-none text-zinc-100 text-xs font-mono focus:border-brand-500 focus:bg-zinc-800 outline-none"
                required
              />
            </div>

            <div>
              <label className="font-semibold text-zinc-300 block mb-1 font-mono uppercase text-[11px]">
                Mật khẩu
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-zinc-850 border border-zinc-700 p-2.5 rounded-none text-zinc-100 text-xs font-mono focus:border-brand-500 focus:bg-zinc-800 outline-none"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-600 hover:bg-brand-500 active:bg-brand-700 text-white font-semibold py-2.5 text-xs rounded-none transition-colors border border-brand-500 shadow-md flex items-center justify-center gap-2"
            >
              <span>{loading ? 'Đang xác thực...' : 'ĐĂNG NHẬP HỆ THỐNG'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

          {/* Quick Demo Login Buttons */}
          <div className="pt-4 border-t border-zinc-800">
            <span className="text-[11px] font-mono uppercase text-zinc-400 block mb-2 font-semibold">
              Đăng nhập nhanh (Tài khoản Demo):
            </span>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <button
                type="button"
                onClick={() => handleQuickLogin('admin', 'Admin@123')}
                className="p-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 text-left transition-colors font-medium"
              >
                <div className="font-bold text-white">Chủ shop / Admin</div>
                <div className="text-[10px] text-zinc-400 font-mono">admin / Admin@123</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('sales', 'Sales@123')}
                className="p-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 text-left transition-colors font-medium"
              >
                <div className="font-bold text-white">Bán hàng (Sales)</div>
                <div className="text-[10px] text-zinc-400 font-mono">sales / Sales@123</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('warehouse', 'Warehouse@123')}
                className="p-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 text-left transition-colors font-medium"
              >
                <div className="font-bold text-white">Thủ kho / Bãi</div>
                <div className="text-[10px] text-zinc-400 font-mono">warehouse / Warehouse@123</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('accountant', 'Accountant@123')}
                className="p-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 text-left transition-colors font-medium"
              >
                <div className="font-bold text-white">Kế toán / Quỹ</div>
                <div className="text-[10px] text-zinc-400 font-mono">accountant / Accountant@123</div>
              </button>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="text-center text-[11px] text-zinc-500 font-mono">
          constructOS Enterprise ERP · Domain: construct.bloxtcgshop.com
        </div>
      </div>
    </div>
  );
};


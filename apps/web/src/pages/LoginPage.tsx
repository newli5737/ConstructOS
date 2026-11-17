import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Store, ArrowRight, UserCheck } from 'lucide-react';
import { User } from '../types';

interface LoginPageProps {
  onLogin: (username: string, password: string) => Promise<User>;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('Admin@123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (u = username, p = password) => {
    try {
      setLoading(true);
      setError('');
      await onLogin(u, p);
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
    <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4 selection:bg-brand-500 selection:text-white font-sans text-slate-900">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-brand-600 font-mono font-bold text-white text-2xl shadow-sm rounded-sm mb-1">
            cOS
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            constructOS
          </h1>
          <p className="text-xs text-slate-600 font-medium">
            Hệ thống Quản lý Bán hàng & Kho Bãi Vật liệu Xây dựng
          </p>
        </div>

        {/* Login Box */}
        <div className="bg-white border border-slate-300 p-7 rounded-sm shadow-md space-y-5">
          {error && (
            <div className="p-3 bg-red-50 border-l-4 border-red-600 text-red-800 text-xs font-semibold">
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
              <label className="font-bold text-slate-800 block mb-1 font-mono uppercase text-xs">
                Tên đăng nhập / Email
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 p-2.5 rounded-sm text-slate-900 text-sm font-medium focus:border-brand-500 focus:bg-white focus:ring-1 focus:ring-brand-500 outline-none"
                required
              />
            </div>

            <div>
              <label className="font-bold text-slate-800 block mb-1 font-mono uppercase text-xs">
                Mật khẩu
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 p-2.5 rounded-sm text-slate-900 text-sm font-medium focus:border-brand-500 focus:bg-white focus:ring-1 focus:ring-brand-500 outline-none"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-600 hover:bg-brand-700 active:bg-brand-800 text-white font-bold py-3 text-xs rounded-sm transition-colors border border-brand-700 shadow-xs flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider"
            >
              {loading ? (
                <span>Đang kết nối hệ thống...</span>
              ) : (
                <>
                  <span>Đăng nhập hệ thống</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Login Presets */}
          <div className="pt-4 border-t border-slate-200">
            <div className="text-[11px] font-mono text-slate-500 mb-2 font-bold uppercase flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-brand-600" />
              <span>Đăng nhập nhanh (Tài khoản mẫu):</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleQuickLogin('admin', 'Admin@123')}
                className="p-2.5 bg-slate-50 hover:bg-brand-50 hover:border-brand-300 border border-slate-200 rounded-sm text-left transition-colors cursor-pointer"
              >
                <div className="font-bold text-slate-900">Chủ shop / Admin</div>
                <div className="text-[11px] text-slate-500 font-mono">admin / Admin@123</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('sales', 'Sales@123')}
                className="p-2.5 bg-slate-50 hover:bg-brand-50 hover:border-brand-300 border border-slate-200 rounded-sm text-left transition-colors cursor-pointer"
              >
                <div className="font-bold text-slate-900">Bán hàng (Sales)</div>
                <div className="text-[11px] text-slate-500 font-mono">sales / Sales@123</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('warehouse', 'Warehouse@123')}
                className="p-2.5 bg-slate-50 hover:bg-brand-50 hover:border-brand-300 border border-slate-200 rounded-sm text-left transition-colors cursor-pointer"
              >
                <div className="font-bold text-slate-900">Thủ kho / Bãi</div>
                <div className="text-[11px] text-slate-500 font-mono">warehouse / Warehouse@123</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('accountant', 'Accountant@123')}
                className="p-2.5 bg-slate-50 hover:bg-brand-50 hover:border-brand-300 border border-slate-200 rounded-sm text-left transition-colors cursor-pointer"
              >
                <div className="font-bold text-slate-900">Kế toán / Quỹ</div>
                <div className="text-[11px] text-slate-500 font-mono">accountant / Accountant@123</div>
              </button>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="text-center text-xs text-slate-500 font-mono">
          constructOS Enterprise ERP · Domain: construct.bloxtcgshop.com
        </div>
      </div>
    </div>
  );
};

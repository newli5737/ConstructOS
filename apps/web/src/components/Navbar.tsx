import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, LogOut, Store, UserCheck } from 'lucide-react';
import { User } from '../types';

interface NavbarProps {
  currentUser: User | null;
  onLogout: () => void;
  onSwitchRole: (role: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentUser, onLogout, onSwitchRole }) => {
  const navigate = useNavigate();

  return (
    <header className="h-14 bg-white text-slate-800 border-b border-slate-200 px-4 flex items-center justify-between select-none shrink-0 z-30 shadow-2xs">
      {/* Brand & Store Name */}
      <div className="flex items-center space-x-3">
        <div 
          onClick={() => navigate('/')}
          className="flex items-center space-x-2.5 cursor-pointer group"
        >
          <div className="w-8 h-8 bg-brand-600 rounded-sm flex items-center justify-center font-mono font-bold text-white tracking-tighter text-base shadow-xs">
            cOS
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="font-bold tracking-tight text-slate-900 text-base">constructOS</span>
              <span className="text-[11px] font-mono uppercase bg-brand-50 text-brand-700 px-1.5 py-0.5 border border-brand-200 font-semibold">
                ERP VLXD v1.0
              </span>
            </div>
            <p className="text-xs text-slate-500 flex items-center gap-1 -mt-0.5 font-medium">
              <Store className="w-3.5 h-3.5 text-brand-600 inline" />
              <span>Đại lý VLXD & Sắt Thép Hòa Lạc</span>
            </p>
          </div>
        </div>
      </div>

      {/* Middle: POS Quick Action */}
      <div className="hidden md:flex items-center space-x-2">
        <button
          onClick={() => navigate('/pos')}
          className="bg-brand-600 hover:bg-brand-700 active:bg-brand-800 text-white text-xs font-bold px-4 py-2 rounded-sm flex items-center gap-2 border border-brand-700 shadow-xs transition-colors tracking-wide"
        >
          <ShoppingCart className="w-4 h-4" />
          <span>BÁN NHANH TẠI QUẦY (F2)</span>
        </button>
      </div>

      {/* Right: Quick Role Switcher (For Demo) & User Info */}
      <div className="flex items-center space-x-3">
        {/* Role switcher for quick demo testing */}
        <div className="hidden lg:flex items-center bg-slate-100 border border-slate-300 px-2 py-1 rounded-sm text-xs">
          <span className="text-slate-600 mr-2 flex items-center gap-1 text-xs font-medium">
            <UserCheck className="w-3.5 h-3.5 text-slate-500" />
            Đổi vai trò:
          </span>
          <div className="flex space-x-1">
            {[
              { id: 'admin', label: 'Chủ shop' },
              { id: 'sales', label: 'Bán hàng' },
              { id: 'warehouse', label: 'Thủ kho' },
              { id: 'accountant', label: 'Kế toán' },
            ].map((r) => {
              const isActive = currentUser?.username === r.id;
              return (
                <button
                  key={r.id}
                  onClick={() => onSwitchRole(r.id)}
                  className={`px-2.5 py-0.5 text-xs font-semibold transition-colors rounded-none ${
                    isActive
                      ? 'bg-white text-brand-700 shadow-2xs border border-brand-400 font-bold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  {r.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* User Card & Logout */}
        <div className="flex items-center space-x-3 pl-3 border-l border-slate-200">
          <div className="text-right">
            <div className="text-xs font-bold text-slate-900 leading-tight">
              {currentUser?.fullName || 'Người dùng'}
            </div>
            <div className="text-[11px] text-brand-700 font-mono font-semibold">
              {currentUser?.roles?.[0] || 'ADMIN'}
            </div>
          </div>

          <button
            onClick={onLogout}
            title="Đăng xuất"
            className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 rounded-sm transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};

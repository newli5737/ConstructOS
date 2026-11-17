import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, LogOut, ShieldAlert, Store, UserCheck } from 'lucide-react';
import { User } from '../types';

interface NavbarProps {
  currentUser: User | null;
  onLogout: () => void;
  onSwitchRole: (role: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentUser, onLogout, onSwitchRole }) => {
  const navigate = useNavigate();

  return (
    <header className="h-14 bg-zinc-900 text-zinc-100 border-b border-zinc-800 px-4 flex items-center justify-between select-none shrink-0 z-30">
      {/* Brand & Store Name */}
      <div className="flex items-center space-x-3">
        <div 
          onClick={() => navigate('/')}
          className="flex items-center space-x-2 cursor-pointer group"
        >
          <div className="w-8 h-8 bg-brand-600 rounded-none flex items-center justify-center font-mono font-bold text-white tracking-tighter text-base shadow-sm">
            cOS
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="font-bold tracking-tight text-white text-base">constructOS</span>
              <span className="text-[10px] font-mono uppercase bg-zinc-800 text-zinc-400 px-1 py-0.5 border border-zinc-700">v1.0</span>
            </div>
            <p className="text-[11px] text-zinc-400 flex items-center gap-1 -mt-0.5">
              <Store className="w-3 h-3 text-brand-500 inline" />
              <span>Đại lý VLXD & Sắt Thép Hòa Lạc</span>
            </p>
          </div>
        </div>
      </div>

      {/* Middle: POS Quick Action */}
      <div className="hidden md:flex items-center space-x-2">
        <button
          onClick={() => navigate('/pos')}
          className="bg-brand-600 hover:bg-brand-500 active:bg-brand-700 text-white text-xs font-semibold px-3.5 py-1.5 rounded-sm flex items-center gap-2 border border-brand-500 shadow-sm transition-colors"
        >
          <ShoppingCart className="w-3.5 h-3.5" />
          <span>BÁN NHANH TẠI QUẦY (F2)</span>
        </button>
      </div>

      {/* Right: Quick Role Switcher (For Demo) & User Info */}
      <div className="flex items-center space-x-4">
        {/* Role switcher for quick demo testing */}
        <div className="hidden lg:flex items-center bg-zinc-800 border border-zinc-700 px-2 py-1 rounded-sm text-xs">
          <span className="text-zinc-400 mr-2 flex items-center gap-1 text-[11px]">
            <UserCheck className="w-3 h-3 text-zinc-400" />
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
                  className={`px-2 py-0.5 text-[11px] font-medium transition-colors ${
                    isActive
                      ? 'bg-zinc-700 text-brand-400 border border-brand-500/40'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {r.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* User Card & Logout */}
        <div className="flex items-center space-x-3 pl-3 border-l border-zinc-800">
          <div className="text-right">
            <div className="text-xs font-medium text-zinc-200 leading-tight">
              {currentUser?.fullName || 'Người dùng'}
            </div>
            <div className="text-[10px] text-zinc-400 font-mono">
              {currentUser?.roles?.[0] || 'ADMIN'}
            </div>
          </div>

          <button
            onClick={onLogout}
            title="Đăng xuất"
            className="p-1.5 text-zinc-400 hover:text-red-400 hover:bg-zinc-800 rounded-sm transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};

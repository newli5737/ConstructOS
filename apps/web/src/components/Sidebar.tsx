import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingCart,
  Receipt,
  Truck,
  Warehouse,
  Users,
  Building2,
  CreditCard,
  Boxes,
  BarChart3,
  Settings,
} from 'lucide-react';

interface SidebarProps {
  userRole?: string;
}

export const Sidebar: React.FC<SidebarProps> = () => {
  const menuItems = [
    { to: '/', label: 'Tổng quan', icon: LayoutDashboard },
    { to: '/pos', label: 'Bán nhanh (POS)', icon: ShoppingCart, badge: 'F2' },
    { to: '/sales-orders', label: 'Đơn bán hàng', icon: Receipt },
    { to: '/purchase-orders', label: 'Mua hàng & Nhập kho', icon: Truck },
    { to: '/inventory', label: 'Kho & Bãi VLXD', icon: Warehouse },
    { to: '/customers', label: 'Khách hàng & Công trình', icon: Users },
    { to: '/suppliers', label: 'Nhà cung cấp', icon: Building2 },
    { to: '/debt', label: 'Công nợ & Thu chi', icon: CreditCard },
    { to: '/products', label: 'Danh mục sản phẩm', icon: Boxes },
    { to: '/reports', label: 'Báo cáo doanh thu & Lãi', icon: BarChart3 },
    { to: '/settings', label: 'Cài đặt hệ thống', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-slate-50 border-r border-slate-200 flex flex-col shrink-0 select-none overflow-y-auto">
      <div className="py-3 px-3">
        <div className="text-[11px] font-mono uppercase tracking-wider text-slate-500 px-3 mb-2 font-bold">
          Quản lý nghiệp vụ
        </div>
        <nav className="space-y-1">
          {menuItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex items-center justify-between px-3 py-2.5 text-xs rounded-sm transition-all relative ${
                  isActive
                    ? 'bg-brand-50 text-brand-900 border-l-4 border-brand-600 font-bold pl-2.5 shadow-2xs'
                    : 'text-slate-700 hover:text-slate-950 hover:bg-slate-200/60 font-semibold'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className="flex items-center space-x-3">
                    <item.icon
                      className={`w-4 h-4 shrink-0 transition-colors ${
                        isActive ? 'text-brand-600' : 'text-slate-500'
                      }`}
                    />
                    <span className="text-[13px]">{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[10px] font-mono px-1.5 py-0.5 bg-brand-100 text-brand-800 border border-brand-300 font-bold rounded-sm">
                      {item.badge}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="mt-auto p-3.5 border-t border-slate-200 bg-white text-xs text-slate-600">
        <div className="flex justify-between items-center mb-1">
          <span className="font-mono font-semibold text-slate-800 text-[11px]">constructOS ERP</span>
          <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 border border-emerald-200 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            ONLINE
          </span>
        </div>
        <div className="text-[11px] text-slate-500 font-mono">
          VPS: 100.104.138.69
        </div>
      </div>
    </aside>
  );
};

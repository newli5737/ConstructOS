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
    <aside className="w-60 bg-zinc-900 border-r border-zinc-800 flex flex-col shrink-0 select-none overflow-y-auto">
      <div className="py-2.5 px-3">
        <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 px-2.5 mb-1.5 font-semibold">
          Quản lý nghiệp vụ
        </div>
        <nav className="space-y-0.5">
          {menuItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex items-center justify-between px-2.5 py-2 text-xs font-medium rounded-sm transition-colors relative ${
                  isActive
                    ? 'bg-zinc-800 text-brand-400 border-l-2 border-brand-500 font-semibold pl-2'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
                }`
              }
            >
              <div className="flex items-center space-x-2.5">
                <item.icon className="w-4 h-4 shrink-0 text-zinc-400" />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className="text-[10px] font-mono px-1.5 py-0.2 bg-brand-500/20 text-brand-400 border border-brand-500/30 rounded-none">
                  {item.badge}
                </span>
              )}
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="mt-auto p-3 border-t border-zinc-800 text-[11px] text-zinc-400">
        <div className="flex justify-between items-center mb-1">
          <span className="font-mono text-zinc-400">constructOS ERP</span>
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
        </div>
        <div className="text-[10px] text-zinc-400 font-mono">
          VPS: 100.104.138.69
        </div>
      </div>
    </aside>
  );
};

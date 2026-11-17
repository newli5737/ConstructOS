import React from 'react';
import { Customer, Warehouse } from '../../types';
import { formatMoney } from '../../api/client';
import { Users, AlertTriangle, CheckCircle, ShieldAlert } from 'lucide-react';

interface PosCustomerHeaderProps {
  customers: Customer[];
  selectedCustomerId: string;
  onCustomerChange: (id: string) => void;
  selectedCustomer?: Customer;
  selectedSiteId: string;
  onSiteChange: (id: string) => void;
  warehouses: Warehouse[];
  selectedWarehouseId: string;
  onWarehouseChange: (id: string) => void;
  currentCustomerDebt: number;
  creditLimit: number;
  willExceedCredit: boolean;
}

export const PosCustomerHeader: React.FC<PosCustomerHeaderProps> = ({
  customers,
  selectedCustomerId,
  onCustomerChange,
  selectedCustomer,
  selectedSiteId,
  onSiteChange,
  warehouses,
  selectedWarehouseId,
  onWarehouseChange,
  currentCustomerDebt,
  creditLimit,
  willExceedCredit,
}) => {
  return (
    <div className="bg-white border border-slate-300 p-3.5 rounded-sm shadow-xs space-y-3 text-slate-900">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
        {/* Customer Picker */}
        <div className="md:col-span-2 space-y-1">
          <label className="font-bold text-slate-800 block font-mono uppercase text-xs">
            Khách hàng <span className="text-red-500">*</span>
          </label>
          <select
            value={selectedCustomerId}
            onChange={(e) => onCustomerChange(e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 p-2 rounded-sm text-xs font-semibold text-slate-900 focus:border-brand-500 focus:bg-white outline-none"
          >
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.code} — {c.name} ({c.phone || 'Không có SĐT'})
              </option>
            ))}
          </select>
        </div>

        {/* Site / Project Picker */}
        <div className="space-y-1">
          <label className="font-bold text-slate-800 block font-mono uppercase text-xs">
            Công trình / Điểm giao
          </label>
          <select
            value={selectedSiteId}
            onChange={(e) => onSiteChange(e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 p-2 rounded-sm text-xs font-medium text-slate-900 focus:border-brand-500 focus:bg-white outline-none"
          >
            <option value="">Giao tại kho / Địa chỉ chính</option>
            {selectedCustomer?.sites?.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.address})
              </option>
            ))}
          </select>
        </div>

        {/* Warehouse Picker */}
        <div className="space-y-1">
          <label className="font-bold text-slate-800 block font-mono uppercase text-xs">
            Xuất từ kho / bãi
          </label>
          <select
            value={selectedWarehouseId}
            onChange={(e) => onWarehouseChange(e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 p-2 rounded-sm text-xs font-semibold text-slate-900 focus:border-brand-500 focus:bg-white outline-none"
          >
            {warehouses.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name} {w.isDefault ? '(Mặc định)' : ''}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Credit & Group Status Strip */}
      <div className="flex flex-wrap items-center justify-between text-xs bg-slate-100 p-2.5 rounded-sm border border-slate-200 gap-2">
        <div className="flex items-center space-x-3">
          <span className="text-slate-600 font-medium">
            Nhóm khách: <strong className="text-slate-900">{selectedCustomer?.group?.name || 'Khách lẻ'}</strong>
          </span>
          <span className="text-slate-400">|</span>
          <span className="text-slate-600 font-medium">
            Dư nợ hiện tại: <strong className="font-mono text-slate-900">{formatMoney(currentCustomerDebt)} đ</strong>
          </span>
          <span className="text-slate-400">|</span>
          <span className="text-slate-600 font-medium">
            Hạn mức tín dụng: <strong className="font-mono text-slate-900">{formatMoney(creditLimit)} đ</strong>
          </span>
        </div>

        <div>
          {willExceedCredit ? (
            <span className="inline-flex items-center gap-1.5 text-red-700 bg-red-50 border border-red-300 px-2 py-0.5 font-bold font-mono text-[11px] rounded-none">
              <ShieldAlert className="w-3.5 h-3.5 text-red-600" />
              CẢNH BÁO: VƯỢT TRẦN HẠN MỨC CÔNG NỢ
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-emerald-800 bg-emerald-50 border border-emerald-300 px-2 py-0.5 font-semibold text-[11px] rounded-none">
              <CheckCircle className="w-3 h-3 text-emerald-600" />
              Trong hạn mức tín dụng cho phép
            </span>
          )}
        </div>
      </div>
    </div>
  );
};


import React from 'react';
import { Trash2, Plus } from 'lucide-react';
import { Product } from '../../types';
import { OrderItemRow } from '../../hooks/usePOS';
import { formatMoney, formatNumber } from '../../api/client';

interface PosOrderItemsTableProps {
  items: OrderItemRow[];
  products: Product[];
  onAddEmptyRow: () => void;
  onRemoveRow: (index: number) => void;
  onProductChange: (index: number, productId: string) => void;
  onUnitChange: (index: number, unitName: string) => void;
  onQtyChange: (index: number, qty: number) => void;
  onPriceChange: (index: number, price: number) => void;
  onDiscountChange: (index: number, discount: number) => void;
}

export const PosOrderItemsTable: React.FC<PosOrderItemsTableProps> = ({
  items,
  products,
  onAddEmptyRow,
  onRemoveRow,
  onProductChange,
  onUnitChange,
  onQtyChange,
  onPriceChange,
  onDiscountChange,
}) => {
  return (
    <div className="bg-white border border-slate-300 rounded-sm shadow-xs overflow-hidden text-slate-900">
      <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
        <div className="font-bold text-xs uppercase tracking-wider text-slate-800">
          Danh sách vật tư xuất bán ({items.length} dòng)
        </div>
        <button
          onClick={onAddEmptyRow}
          className="bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold px-3 py-1 rounded-none flex items-center gap-1 shadow-xs cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Thêm dòng (Enter)</span>
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left border-collapse">
          <thead>
            <tr className="bg-slate-100 text-slate-700 border-b border-slate-300 font-bold">
              <th className="p-2.5 w-10 text-center">#</th>
              <th className="p-2.5 min-w-[260px]">Hàng hóa / Vật tư</th>
              <th className="p-2.5 w-28">Đơn vị tính</th>
              <th className="p-2.5 w-24 text-right">Số lượng</th>
              <th className="p-2.5 w-32 text-right">Đơn giá (VND)</th>
              <th className="p-2.5 w-20 text-right">CK (%)</th>
              <th className="p-2.5 w-36 text-right font-bold text-slate-900">Thành tiền</th>
              <th className="p-2.5 w-28 text-center">Tồn kho hiện tại</th>
              <th className="p-2.5 w-12 text-center"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {items.map((item, idx) => (
              <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                <td className="p-2.5 text-center font-mono text-slate-400 font-semibold">{idx + 1}</td>

                {/* Product Dropdown */}
                <td className="p-2">
                  <select
                    value={item.productId}
                    onChange={(e) => onProductChange(idx, e.target.value)}
                    className="w-full bg-white border border-slate-300 p-1.5 rounded-none text-xs font-medium text-slate-900 focus:border-brand-500 outline-none"
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        [{p.sku}] {p.name}
                      </option>
                    ))}
                  </select>
                </td>

                {/* Unit Dropdown */}
                <td className="p-2">
                  <select
                    value={item.unitName}
                    onChange={(e) => onUnitChange(idx, e.target.value)}
                    className="w-full bg-white border border-slate-300 p-1.5 rounded-none text-xs font-mono font-bold text-slate-800 focus:border-brand-500 outline-none"
                  >
                    {item.units.map((u) => (
                      <option key={u.unitName} value={u.unitName}>
                        {u.unitName} {u.factor !== 1 ? `(x${u.factor})` : ''}
                      </option>
                    ))}
                  </select>
                </td>

                {/* Qty Input */}
                <td className="p-2">
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={item.quantity}
                    onChange={(e) => onQtyChange(idx, Number(e.target.value))}
                    className="w-full bg-white border border-slate-300 p-1.5 rounded-none text-xs font-mono font-bold text-right text-slate-900 focus:border-brand-500 outline-none"
                  />
                </td>

                {/* Price Input */}
                <td className="p-2">
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={item.unitPrice}
                    onChange={(e) => onPriceChange(idx, Number(e.target.value))}
                    className="w-full bg-white border border-slate-300 p-1.5 rounded-none text-xs font-mono font-bold text-right text-slate-900 focus:border-brand-500 outline-none"
                  />
                </td>

                {/* Discount % */}
                <td className="p-2">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={item.discountPct}
                    onChange={(e) => onDiscountChange(idx, Number(e.target.value))}
                    className="w-full bg-white border border-slate-300 p-1.5 rounded-none text-xs font-mono text-right text-slate-700 focus:border-brand-500 outline-none"
                  />
                </td>

                {/* Line Total */}
                <td className="p-2.5 text-right font-mono font-bold text-slate-900 text-sm">
                  {formatMoney(item.lineTotal)} đ
                </td>

                {/* Available Stock */}
                <td className="p-2 text-center font-mono">
                  {item.availableStock > 0 ? (
                    <span className="text-emerald-700 font-semibold text-xs">
                      Tồn: {formatNumber(item.availableStock)}
                    </span>
                  ) : (
                    <span className="text-amber-700 bg-amber-50 px-1.5 py-0.5 border border-amber-200 text-[11px] font-semibold">
                      Tồn: 0 (Bán âm)
                    </span>
                  )}
                </td>

                {/* Remove Row */}
                <td className="p-2 text-center">
                  <button
                    onClick={() => onRemoveRow(idx)}
                    className="text-slate-400 hover:text-red-600 p-1 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};


import React from 'react';
import { Product } from '../../types';
import { formatMoney, formatNumber } from '../../api/client';

interface ProductTableProps {
  products: Product[];
}

export const ProductTable: React.FC<ProductTableProps> = ({ products }) => {
  return (
    <div className="bg-white border border-slate-300 rounded-sm shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left border-collapse">
          <thead>
            <tr className="bg-slate-100 text-slate-800 border-b border-slate-300 font-bold">
              <th className="p-3 w-12 text-center">Ảnh</th>
              <th className="p-3">Mã SKU</th>
              <th className="p-3">Tên vật tư</th>
              <th className="p-3">Nhóm hàng</th>
              <th className="p-3 text-center">ĐVT chuẩn</th>
              <th className="p-3">Quy đổi ĐVT</th>
              <th className="p-3 text-right">Giá vốn BQ</th>
              <th className="p-3 text-right font-bold text-brand-700">Giá bán lẻ</th>
              <th className="p-3 text-right font-bold text-blue-700">Giá thợ</th>
              <th className="p-3 text-right font-bold text-emerald-700">Giá đại lý</th>
              <th className="p-3 text-right">Tổng tồn</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {products.map((p) => {
              const pLe = p.prices?.find((pr) => pr.priceList?.code === 'GIA-LE' && pr.unitName === p.baseUnit);
              const pTho = p.prices?.find((pr) => pr.priceList?.code === 'GIA-THO' && pr.unitName === p.baseUnit);
              const pDaiLy = p.prices?.find((pr) => pr.priceList?.code === 'GIA-DAILY' && pr.unitName === p.baseUnit);
              const totalStock = p.stockBalances?.reduce((sum, b) => sum + Number(b.quantity), 0) || 0;

              return (
                <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-2 text-center">
                    {p.imageUrl ? (
                      <img src={p.imageUrl} alt={p.name} className="w-8 h-8 object-cover rounded-xs mx-auto border border-slate-200" />
                    ) : (
                      <div className="w-8 h-8 bg-slate-200 text-slate-600 text-[10px] font-mono font-bold flex items-center justify-center mx-auto">
                        cOS
                      </div>
                    )}
                  </td>
                  <td className="p-3 font-mono font-bold text-slate-900">{p.sku}</td>
                  <td className="p-3 font-bold text-slate-900">{p.name}</td>
                  <td className="p-3 text-slate-600 font-medium">{p.category?.name || '—'}</td>
                  <td className="p-3 text-center font-mono font-bold text-slate-800">{p.baseUnit}</td>
                  <td className="p-3 font-mono text-xs">
                    {p.units && p.units.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {p.units.map((u, i) => (
                          <span key={i} className="bg-slate-100 border border-slate-200 px-1.5 py-0.5 text-slate-800 font-semibold">
                            1 {u.unitName} = {u.factor} {p.baseUnit}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="p-3 text-right font-mono text-slate-700 font-medium">{formatMoney(p.costPrice)} đ</td>
                  <td className="p-3 text-right font-mono font-bold text-brand-700">
                    {pLe ? `${formatMoney(pLe.price)} đ` : '—'}
                  </td>
                  <td className="p-3 text-right font-mono text-blue-700 font-bold">
                    {pTho ? `${formatMoney(pTho.price)} đ` : '—'}
                  </td>
                  <td className="p-3 text-right font-mono text-emerald-700 font-bold">
                    {pDaiLy ? `${formatMoney(pDaiLy.price)} đ` : '—'}
                  </td>
                  <td className="p-3 text-right font-mono font-bold text-slate-900">
                    {formatNumber(totalStock)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};


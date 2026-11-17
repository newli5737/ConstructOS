import React, { useState } from 'react';
import { Product } from '../../types';
import { formatMoney, formatNumber } from '../../api/client';
import { Search, Plus, Layers, Check } from 'lucide-react';

interface PosProductCatalogGridProps {
  products: Product[];
  onSelectProduct: (product: Product) => void;
  selectedPriceListId?: string;
  selectedWarehouseId?: string;
}

export const PosProductCatalogGrid: React.FC<PosProductCatalogGridProps> = ({
  products,
  onSelectProduct,
  selectedPriceListId,
  selectedWarehouseId,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // Categories list
  const categories = [
    { id: 'ALL', name: 'Tất cả' },
    { id: 'CAT_DA', name: 'Cát & Đá' },
    { id: 'XI_MANG', name: 'Xi măng' },
    { id: 'THEP', name: 'Sắt thép' },
    { id: 'GACH', name: 'Gạch xây' },
  ];

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (selectedCategory === 'ALL') return true;
    if (selectedCategory === 'CAT_DA') return p.sku.includes('CAT') || p.sku.includes('DA');
    if (selectedCategory === 'XI_MANG') return p.sku.includes('XM') || p.sku.includes('XI');
    if (selectedCategory === 'THEP') return p.sku.includes('THEP') || p.sku.includes('SAT');
    if (selectedCategory === 'GACH') return p.sku.includes('GACH');
    return true;
  });

  return (
    <div className="bg-white border border-slate-300 rounded-sm shadow-xs flex flex-col h-full overflow-hidden text-slate-900">
      {/* Search and Category Filter Bar */}
      <div className="p-3 border-b border-slate-200 space-y-2 bg-slate-50">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm nhanh vật tư bấm chọn..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-slate-300 pl-8 pr-3 py-1.5 rounded-sm text-xs text-slate-900 font-medium focus:border-brand-500 outline-none"
          />
        </div>

        <div className="flex gap-1 overflow-x-auto pb-0.5">
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(c.id)}
              className={`px-2.5 py-1 text-xs font-bold rounded-none whitespace-nowrap transition-colors ${
                selectedCategory === c.id
                  ? 'bg-brand-600 text-white'
                  : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Product Tiles */}
      <div className="p-3 overflow-y-auto max-h-[480px] grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
        {filteredProducts.map((p) => {
          const matchPrice = p.prices?.find(
            (pr) => pr.priceListId === selectedPriceListId && pr.unitName === p.baseUnit,
          );
          const price = matchPrice ? Number(matchPrice.price) : Number(p.prices?.[0]?.price || 0);

          const whBal = p.stockBalances?.find((b) => b.warehouseId === selectedWarehouseId);
          const stock = whBal ? Number(whBal.quantity) : 0;
          const isOutOfStock = stock <= 0;

          return (
            <div
              key={p.id}
              onClick={() => onSelectProduct(p)}
              className="bg-white border border-slate-200 hover:border-brand-500 hover:shadow-xs p-2.5 rounded-sm cursor-pointer flex flex-col justify-between transition-all group select-none"
            >
              <div>
                <div className="flex items-center justify-between text-[10px] font-mono mb-1">
                  <span className="font-bold text-brand-700 bg-brand-50 px-1 py-0.2 border border-brand-200">
                    {p.sku}
                  </span>
                  <span
                    className={`font-semibold ${
                      isOutOfStock ? 'text-red-600' : 'text-emerald-700'
                    }`}
                  >
                    {isOutOfStock ? 'Hết' : `${formatNumber(stock)} ${p.baseUnit}`}
                  </span>
                </div>

                <div className="text-xs font-bold text-slate-900 group-hover:text-brand-600 line-clamp-2 leading-tight">
                  {p.name}
                </div>
              </div>

              <div className="mt-2 pt-1.5 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] font-mono font-bold text-slate-900">
                  {formatMoney(price)} đ
                </span>
                <span className="p-1 bg-brand-50 text-brand-700 rounded-none group-hover:bg-brand-600 group-hover:text-white transition-colors">
                  <Plus className="w-3 h-3" />
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

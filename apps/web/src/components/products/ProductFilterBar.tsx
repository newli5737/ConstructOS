import React from 'react';
import { Search, LayoutGrid, List } from 'lucide-react';
import { ProductCategory } from '../../types';

interface ProductFilterBarProps {
  search: string;
  onSearchChange: (val: string) => void;
  onSearchSubmit: () => void;
  selectedCatId: string;
  onCategoryChange: (val: string) => void;
  categories: ProductCategory[];
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
}

export const ProductFilterBar: React.FC<ProductFilterBarProps> = ({
  search,
  onSearchChange,
  onSearchSubmit,
  selectedCatId,
  onCategoryChange,
  categories,
  viewMode,
  onViewModeChange,
}) => {
  return (
    <div className="bg-white border border-slate-300 p-3 rounded-sm shadow-xs flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap items-center gap-3 flex-1">
        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm theo tên vật tư, mã SKU..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onSearchSubmit()}
            className="w-full bg-slate-50 border border-slate-300 pl-9 pr-3 py-1.5 rounded-sm text-xs text-slate-900 focus:bg-white focus:border-brand-500 outline-none font-medium"
          />
        </div>

        <select
          value={selectedCatId}
          onChange={(e) => onCategoryChange(e.target.value)}
          className="bg-slate-50 border border-slate-300 px-3 py-1.5 rounded-sm text-xs font-semibold text-slate-800 focus:bg-white focus:border-brand-500 outline-none"
        >
          <option value="">Tất cả nhóm vật liệu</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        <button
          onClick={onSearchSubmit}
          className="bg-slate-100 hover:bg-slate-200 border border-slate-300 px-3.5 py-1.5 rounded-sm text-xs font-bold text-slate-800 cursor-pointer"
        >
          Lọc
        </button>
      </div>

      {/* View Mode Switcher */}
      <div className="flex items-center space-x-1 bg-slate-100 p-1 border border-slate-300 rounded-sm">
        <button
          onClick={() => onViewModeChange('grid')}
          title="Hiển thị dạng lưới thẻ (Grid)"
          className={`flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-sm transition-all ${
            viewMode === 'grid'
              ? 'bg-white text-brand-700 shadow-2xs border border-slate-300'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <LayoutGrid className="w-4 h-4 text-brand-600" />
          <span>Lưới (Grid)</span>
        </button>

        <button
          onClick={() => onViewModeChange('list')}
          title="Hiển thị dạng bảng (List)"
          className={`flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-sm transition-all ${
            viewMode === 'list'
              ? 'bg-white text-brand-700 shadow-2xs border border-slate-300'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <List className="w-4 h-4 text-slate-600" />
          <span>Danh sách (List)</span>
        </button>
      </div>
    </div>
  );
};

import React from 'react';
import { UploadCloud, Layers } from 'lucide-react';
import { Product } from '../../types';
import { formatMoney, formatNumber } from '../../api/client';

interface ProductCardProps {
  product: Product;
  onUploadImage: (productId: string) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onUploadImage }) => {
  const pLe = product.prices?.find((pr) => pr.priceList?.code === 'GIA-LE' && pr.unitName === product.baseUnit);
  const pTho = product.prices?.find((pr) => pr.priceList?.code === 'GIA-THO' && pr.unitName === product.baseUnit);
  const pDaiLy = product.prices?.find((pr) => pr.priceList?.code === 'GIA-DAILY' && pr.unitName === product.baseUnit);

  const totalStock = product.stockBalances?.reduce((sum, b) => sum + Number(b.quantity), 0) || 0;
  const isOutOfStock = totalStock <= 0;
  const isLowStock = totalStock > 0 && totalStock <= Number(product.minStock || 10);

  const getProductFallbackBg = (skuCode: string) => {
    if (skuCode.includes('XM') || skuCode.includes('XI')) return 'bg-slate-800 text-slate-100';
    if (skuCode.includes('THEP') || skuCode.includes('SAT')) return 'bg-blue-900 text-blue-100';
    if (skuCode.includes('CAT') || skuCode.includes('DA')) return 'bg-amber-900 text-amber-100';
    if (skuCode.includes('GACH')) return 'bg-orange-900 text-orange-100';
    return 'bg-slate-850 text-slate-100';
  };

  return (
    <div className="bg-white border border-slate-300 hover:border-brand-500 rounded-sm shadow-xs hover:shadow-md transition-all flex flex-col overflow-hidden group">
      {/* Product Image / Placeholder Banner */}
      <div className="relative h-36 bg-slate-100 flex items-center justify-center overflow-hidden border-b border-slate-200">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
          />
        ) : (
          <div className={`w-full h-full flex flex-col items-center justify-center p-3 text-center ${getProductFallbackBg(product.sku)}`}>
            <span className="font-mono text-xs font-bold uppercase tracking-wider opacity-75">
              {product.category?.name || 'VẬT LIỆU XÂY DỰNG'}
            </span>
            <span className="font-mono text-sm font-black mt-1">
              {product.sku}
            </span>
            <span className="text-xs font-sans opacity-90 mt-1 line-clamp-1 font-medium">
              {product.name}
            </span>
          </div>
        )}

        {/* Stock Badge Top-Right */}
        <div className="absolute top-2 right-2">
          {isOutOfStock ? (
            <span className="bg-red-600 text-white text-[11px] font-mono font-bold px-2 py-0.5 rounded-none shadow-xs">
              HẾT HÀNG
            </span>
          ) : isLowStock ? (
            <span className="bg-amber-600 text-white text-[11px] font-mono font-bold px-2 py-0.5 rounded-none shadow-xs">
              SẮP HẾT ({formatNumber(totalStock)})
            </span>
          ) : (
            <span className="bg-emerald-700 text-white text-[11px] font-mono font-bold px-2 py-0.5 rounded-none shadow-xs">
              TỒN: {formatNumber(totalStock)} {product.baseUnit}
            </span>
          )}
        </div>

        {/* Quick R2 Upload Overlay Button */}
        <button
          onClick={() => onUploadImage(product.id)}
          title="Tải ảnh lên Cloudflare R2"
          className="absolute bottom-2 right-2 p-1.5 bg-white/95 hover:bg-white text-slate-800 rounded-sm shadow-xs border border-slate-300 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-[11px] font-bold cursor-pointer"
        >
          <UploadCloud className="w-3.5 h-3.5 text-brand-600" />
          <span>Đổi ảnh (R2)</span>
        </button>
      </div>

      {/* Card Body */}
      <div className="p-3.5 flex-1 flex flex-col justify-between space-y-2.5">
        <div>
          {/* Category & SKU */}
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="font-bold text-brand-700 bg-brand-50 px-1.5 py-0.5 border border-brand-200">
              {product.sku}
            </span>
            <span className="text-slate-500 font-medium">
              {product.category?.name || 'Chưa phân nhóm'}
            </span>
          </div>

          {/* Product Name */}
          <h3 className="font-bold text-sm text-slate-900 mt-1.5 leading-snug line-clamp-2" title={product.name}>
            {product.name}
          </h3>

          {/* Units & Conversion */}
          <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-600">
            <span className="font-bold text-slate-700">ĐVT:</span>
            <span className="font-mono font-bold text-slate-900 bg-slate-100 px-1.5 py-0.5 border border-slate-200 rounded-none">
              {product.baseUnit}
            </span>
            {product.units && product.units.length > 0 && (
              <span className="text-xs text-slate-500 font-mono">
                (1 {product.units[0].unitName} = {product.units[0].factor} {product.baseUnit})
              </span>
            )}
          </div>
        </div>

        {/* 3 Tier Price Box */}
        <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-sm space-y-1 text-xs">
          <div className="flex justify-between items-center">
            <span className="text-slate-600 text-xs font-medium">Giá bán lẻ:</span>
            <span className="font-mono font-bold text-brand-700 text-sm">
              {pLe ? `${formatMoney(pLe.price)} đ` : '—'}
            </span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-600 font-medium">Giá thợ thầu:</span>
            <span className="font-mono font-bold text-blue-700">
              {pTho ? `${formatMoney(pTho.price)} đ` : '—'}
            </span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-600 font-medium">Giá đại lý:</span>
            <span className="font-mono font-bold text-emerald-700">
              {pDaiLy ? `${formatMoney(pDaiLy.price)} đ` : '—'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};


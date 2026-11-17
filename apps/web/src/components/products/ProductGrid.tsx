import React from 'react';
import { Product } from '../../types';
import { ProductCard } from './ProductCard';
import { Boxes } from 'lucide-react';

interface ProductGridProps {
  products: Product[];
  onUploadImage: (productId: string) => void;
}

export const ProductGrid: React.FC<ProductGridProps> = ({ products, onUploadImage }) => {
  if (products.length === 0) {
    return (
      <div className="bg-white border border-slate-300 p-12 text-center rounded-sm space-y-3">
        <Boxes className="w-10 h-10 text-slate-400 mx-auto" />
        <div className="text-slate-600 font-semibold text-sm">Không tìm thấy mặt hàng nào phù hợp</div>
        <p className="text-xs text-slate-400">Thử tìm kiếm với từ khóa khác hoặc xóa bộ lọc nhóm hàng</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} onUploadImage={onUploadImage} />
      ))}
    </div>
  );
};

import React, { useState, useRef } from 'react';
import { Boxes, Plus } from 'lucide-react';
import { useProducts } from '../hooks/useProducts';
import { ProductGrid } from '../components/products/ProductGrid';
import { ProductTable } from '../components/products/ProductTable';
import { ProductFilterBar } from '../components/products/ProductFilterBar';
import { ProductCreateModal } from '../components/products/ProductCreateModal';
import { storageService } from '../services/storage.service';
import { useToast } from '../context/ToastContext';

export const ProductsPage: React.FC = () => {
  const { toast } = useToast();
  const {
    products,
    categories,
    priceLists,
    loading,
    search,
    setSearch,
    selectedCatId,
    setSelectedCatId,
    viewMode,
    setViewMode,
    refetch,
    createProduct,
    updateProduct,
  } = useProducts();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [targetProductId, setTargetProductId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUploadClick = (productId: string) => {
    setTargetProductId(productId);
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !targetProductId) return;

    try {
      const res = await storageService.uploadFile(file, 'products');
      await updateProduct(targetProductId, { imageUrl: res.url });
      const storageType = res.storage === 'cloudflare_r2' ? 'Cloudflare R2' : 'Máy chủ cục bộ';
      toast.success(`Đã cập nhật ảnh sản phẩm qua ${storageType}!`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Lỗi khi tải ảnh lên Cloudflare R2');
    } finally {
      setTargetProductId(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-4 max-w-7xl mx-auto w-full text-slate-900">
      {/* Hidden input for fast R2 image upload */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Boxes className="w-5 h-5 text-brand-600" />
            <span>DANH MỤC VẬT LIỆU XÂY DỰNG & QUY ĐỔI ĐVT</span>
          </h1>
          <p className="text-xs text-slate-600 mt-0.5 font-medium">
            Quản lý hàng hóa, chế độ xem lưới/danh sách, 3 cấp giá bán, quy đổi ĐVT & lưu trữ ảnh Cloudflare R2
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-brand-600 hover:bg-brand-700 active:bg-brand-800 text-white text-xs font-bold px-4 py-2 rounded-sm flex items-center gap-2 border border-brand-700 shadow-xs cursor-pointer tracking-wide"
        >
          <Plus className="w-4 h-4" />
          <span>THÊM MẶT HÀNG MỚI</span>
        </button>
      </div>

      {/* Filter and View Toggle Toolbar */}
      <ProductFilterBar
        search={search}
        onSearchChange={setSearch}
        onSearchSubmit={refetch}
        selectedCatId={selectedCatId}
        onCategoryChange={setSelectedCatId}
        categories={categories}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      {/* Product Content: Grid vs List */}
      {loading ? (
        <div className="bg-white border border-slate-300 p-12 text-center rounded-sm font-semibold text-slate-600 text-sm">
          Đang tải dữ liệu sản phẩm...
        </div>
      ) : viewMode === 'grid' ? (
        <ProductGrid products={products} onUploadImage={handleUploadClick} />
      ) : (
        <ProductTable products={products} />
      )}

      {/* Create Product Modal */}
      <ProductCreateModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        categories={categories}
        priceLists={priceLists}
        onCreate={createProduct}
      />
    </div>
  );
};

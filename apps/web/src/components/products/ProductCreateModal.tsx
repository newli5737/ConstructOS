import React, { useState } from 'react';
import { Boxes, UploadCloud, Image as ImageIcon, X } from 'lucide-react';
import { ProductCategory, PriceList } from '../../types';
import { storageService } from '../../services/storage.service';
import { useToast } from '../../context/ToastContext';

interface ProductCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: ProductCategory[];
  priceLists: PriceList[];
  onCreate: (productData: any) => Promise<any>;
}

export const ProductCreateModal: React.FC<ProductCreateModalProps> = ({
  isOpen,
  onClose,
  categories,
  priceLists,
  onCreate,
}) => {
  const { toast } = useToast();
  const [sku, setSku] = useState('');
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState(categories[0]?.id || '');
  const [baseUnit, setBaseUnit] = useState('Bao');
  const [costPrice, setCostPrice] = useState(0);
  const [minStock, setMinStock] = useState(10);
  const [retailPrice, setRetailPrice] = useState(0);
  const [contractorPrice, setContractorPrice] = useState(0);
  const [agencyPrice, setAgencyPrice] = useState(0);
  const [altUnitName, setAltUnitName] = useState('');
  const [altUnitFactor, setAltUnitFactor] = useState(1);
  const [imageUrl, setImageUrl] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingImage(true);
      const res = await storageService.uploadFile(file, 'products');
      setImageUrl(res.url);
      const storageType = res.storage === 'cloudflare_r2' ? 'Cloudflare R2' : 'Máy chủ cục bộ';
      toast.success(`Tải ảnh lên ${storageType} thành công!`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Lỗi khi tải ảnh lên Storage');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async () => {
    if (!sku.trim() || !name.trim() || !baseUnit.trim()) {
      toast.error('Vui lòng điền đầy đủ Mã SKU, Tên hàng hóa và ĐVT cơ bản');
      return;
    }

    try {
      setSubmitting(true);
      const units: any[] = [];
      if (altUnitName.trim() && altUnitFactor > 1) {
        units.push({
          unitName: altUnitName.trim(),
          factor: altUnitFactor,
          isDefaultSale: false,
        });
      }

      const prices: any[] = [];
      const plLe = priceLists.find((p) => p.code === 'GIA-LE') || priceLists[0];
      const plTho = priceLists.find((p) => p.code === 'GIA-THO') || priceLists[1];
      const plDaiLy = priceLists.find((p) => p.code === 'GIA-DAILY') || priceLists[2];

      if (plLe && retailPrice > 0) {
        prices.push({ priceListId: plLe.id, unitName: baseUnit, price: retailPrice });
      }
      if (plTho && contractorPrice > 0) {
        prices.push({ priceListId: plTho.id, unitName: baseUnit, price: contractorPrice });
      }
      if (plDaiLy && agencyPrice > 0) {
        prices.push({ priceListId: plDaiLy.id, unitName: baseUnit, price: agencyPrice });
      }

      await onCreate({
        sku: sku.trim().toUpperCase(),
        name: name.trim(),
        categoryId: categoryId || null,
        baseUnit: baseUnit.trim(),
        costPrice,
        minStock,
        imageUrl: imageUrl || null,
        units,
        prices,
      });

      toast.success('Đã tạo mặt hàng mới thành công!');
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Lỗi khi lưu mặt hàng');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
      <div className="bg-white border border-slate-300 shadow-2xl max-w-2xl w-full p-5 rounded-sm max-h-[90vh] overflow-y-auto space-y-4 text-slate-900">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Boxes className="w-5 h-5 text-brand-600" />
            <span>THÊM MẶT HÀNG VẬT LIỆU XÂY DỰNG MỚI</span>
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 p-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-800 block mb-1">
                Mã SKU / Mã quản lý <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="VD: XM-HAPTIEN-PCB40"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 p-2.5 rounded-sm font-mono text-sm uppercase text-slate-900 focus:bg-white focus:border-brand-500 outline-none"
              />
            </div>

            <div>
              <label className="font-bold text-slate-800 block mb-1">
                Nhóm vật liệu
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 p-2.5 rounded-sm text-sm text-slate-900 focus:bg-white focus:border-brand-500 outline-none"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-800 block mb-1">
              Tên mặt hàng vật liệu <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="VD: Xi măng Hà Tiên Đa Dụng PCB40 (Bao 50kg)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 p-2.5 rounded-sm text-sm font-semibold text-slate-900 focus:bg-white focus:border-brand-500 outline-none"
            />
          </div>

          {/* Image Upload with Cloudflare R2 */}
          <div className="border border-dashed border-slate-300 p-3 bg-slate-50 rounded-sm">
            <label className="font-bold text-slate-800 block mb-1.5 flex items-center gap-1.5">
              <UploadCloud className="w-4 h-4 text-brand-600" />
              <span>Ảnh đại diện sản phẩm (Lưu trữ Cloudflare R2)</span>
            </label>
            <div className="flex items-center gap-3">
              {imageUrl ? (
                <img src={imageUrl} alt="preview" className="w-14 h-14 object-cover border border-slate-300 rounded-sm" />
              ) : (
                <div className="w-14 h-14 bg-slate-200 border border-slate-300 flex items-center justify-center text-slate-400">
                  <ImageIcon className="w-6 h-6" />
                </div>
              )}
              <div className="flex-1 space-y-1">
                <input
                  type="file"
                  onChange={handleFileUpload}
                  disabled={uploadingImage}
                  accept="image/*"
                  className="text-xs text-slate-600 file:mr-2 file:py-1 file:px-2 file:border file:border-slate-300 file:bg-white file:text-xs file:font-semibold hover:file:bg-slate-50"
                />
                <div className="text-[11px] text-slate-500">
                  {uploadingImage ? 'Đang tải lên Cloudflare R2...' : 'Hỗ trợ JPG, PNG, WEBP. Tự động lưu lên Cloudflare R2.'}
                </div>
              </div>
            </div>
          </div>

          {/* Units & Conversion */}
          <div className="p-3 bg-slate-50 border border-slate-200 space-y-3">
            <div className="font-bold text-slate-900 text-xs uppercase">
              Đơn vị tính & Quy đổi
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">ĐVT cơ bản</label>
                <input
                  type="text"
                  placeholder="Bao / Kg / m3 / Cây"
                  value={baseUnit}
                  onChange={(e) => setBaseUnit(e.target.value)}
                  className="w-full bg-white border border-slate-300 p-2 text-xs font-mono font-bold"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">ĐVT phụ (Quy đổi)</label>
                <input
                  type="text"
                  placeholder="Tấn / Cây / Kiện"
                  value={altUnitName}
                  onChange={(e) => setAltUnitName(e.target.value)}
                  className="w-full bg-white border border-slate-300 p-2 text-xs font-mono"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Hệ số quy đổi</label>
                <input
                  type="number"
                  placeholder="VD: 20 (1 Tấn = 20 Bao)"
                  value={altUnitFactor}
                  onChange={(e) => setAltUnitFactor(Number(e.target.value))}
                  className="w-full bg-white border border-slate-300 p-2 text-xs font-mono"
                />
              </div>
            </div>
          </div>

          {/* 3 Price Lists */}
          <div className="p-3 bg-slate-50 border border-slate-200 space-y-3">
            <div className="font-bold text-slate-900 text-xs uppercase">
              Bảng giá bán 3 cấp theo ĐVT cơ bản ({baseUnit})
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">1. Giá bán lẻ (VND)</label>
                <input
                  type="number"
                  value={retailPrice}
                  onChange={(e) => setRetailPrice(Number(e.target.value))}
                  className="w-full bg-white border border-slate-300 p-2 text-xs font-mono font-bold text-brand-700"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">2. Giá thợ thầu (VND)</label>
                <input
                  type="number"
                  value={contractorPrice}
                  onChange={(e) => setContractorPrice(Number(e.target.value))}
                  className="w-full bg-white border border-slate-300 p-2 text-xs font-mono font-bold text-blue-700"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">3. Giá đại lý (VND)</label>
                <input
                  type="number"
                  value={agencyPrice}
                  onChange={(e) => setAgencyPrice(Number(e.target.value))}
                  className="w-full bg-white border border-slate-300 p-2 text-xs font-mono font-bold text-emerald-700"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-2 pt-3 border-t border-slate-200">
          <button
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-sm"
          >
            Hủy bỏ
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="px-4 py-2 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 border border-brand-700 rounded-sm shadow-xs tracking-wide"
          >
            {submitting ? 'ĐANG LƯU...' : 'LƯU MẶT HÀNG'}
          </button>
        </div>
      </div>
    </div>
  );
};


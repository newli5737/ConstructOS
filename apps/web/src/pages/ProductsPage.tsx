import React, { useState, useEffect } from 'react';
import { Boxes, Plus, Search, Filter, Edit, Trash2, X } from 'lucide-react';
import { api, formatMoney, formatNumber } from '../api/client';
import { Product, ProductCategory, PriceList } from '../types';

export const ProductsPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [priceLists, setPriceLists] = useState<PriceList[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [selectedCatId, setSelectedCatId] = useState('');

  // Create Product Modal
  const [showModal, setShowModal] = useState(false);
  const [sku, setSku] = useState('');
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [baseUnit, setBaseUnit] = useState('Bao');
  const [costPrice, setCostPrice] = useState(0);
  const [minStock, setMinStock] = useState(10);
  const [retailPrice, setRetailPrice] = useState(0);
  const [contractorPrice, setContractorPrice] = useState(0);
  const [agencyPrice, setAgencyPrice] = useState(0);
  const [altUnitName, setAltUnitName] = useState('');
  const [altUnitFactor, setAltUnitFactor] = useState(1);

  const fetchCatalog = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (search) params.q = search;
      if (selectedCatId) params.categoryId = selectedCatId;

      const [pRes, cRes, plRes] = await Promise.all([
        api.get('/products', { params }),
        api.get('/product-categories'),
        api.get('/price-lists'),
      ]);
      setProducts(pRes.data || []);
      setCategories(cRes.data || []);
      setPriceLists(plRes.data || []);
      if (cRes.data?.length > 0 && !categoryId) setCategoryId(cRes.data[0].id);
    } catch (err) {
      console.error('Error fetching products', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCatalog();
  }, [selectedCatId]);

  const handleCreateProduct = async () => {
    if (!sku || !name || !baseUnit) {
      alert('Vui lòng điền mã hàng, tên hàng và đơn vị cơ bản');
      return;
    }

    try {
      const units: any[] = [];
      if (altUnitName && altUnitFactor > 1) {
        units.push({
          unitName: altUnitName,
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

      await api.post('/products', {
        sku,
        name,
        categoryId: categoryId || null,
        baseUnit,
        costPrice,
        minStock,
        units,
        prices,
      });

      alert('Thêm sản phẩm thành công!');
      setShowModal(false);
      setSku('');
      setName('');
      setCostPrice(0);
      setRetailPrice(0);
      setContractorPrice(0);
      setAgencyPrice(0);
      setAltUnitName('');
      setAltUnitFactor(1);
      fetchCatalog();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Lỗi khi tạo sản phẩm');
    }
  };

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-200 pb-3">
        <div>
          <h1 className="text-lg font-bold tracking-tight text-zinc-950 font-mono">
            DANH MỤC VẬT LIỆU XÂY DỰNG & QUY ĐỔI ĐVT
          </h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            Quản lý hàng hóa, đơn vị tính quy đổi (Bao / Tấn, Cây / Kg, Viên / Thiên) và bảng giá 3 cấp
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold px-3.5 py-1.5 rounded-sm flex items-center gap-1.5 border border-brand-500 shadow-2xs self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>THÊM MẶT HÀNG MỚI</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-zinc-200 p-3 rounded-sm shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="relative min-w-[220px]">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-zinc-400" />
            <input
              type="text"
              placeholder="Tìm theo tên sản phẩm, mã SKU..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchCatalog()}
              className="w-full bg-zinc-50 border border-zinc-300 pl-8 pr-3 py-1.5 rounded-sm text-xs outline-none"
            />
          </div>

          <select
            value={selectedCatId}
            onChange={(e) => setSelectedCatId(e.target.value)}
            className="bg-zinc-50 border border-zinc-300 px-2.5 py-1.5 rounded-sm text-xs outline-none"
          >
            <option value="">Tất cả nhóm hàng</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <button
          onClick={fetchCatalog}
          className="bg-zinc-100 hover:bg-zinc-200 border border-zinc-300 px-3 py-1.5 rounded-sm text-xs font-medium"
        >
          Lọc dữ liệu
        </button>
      </div>

      {/* Table */}
      <div className="bg-white border border-zinc-200 rounded-sm shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-zinc-100 text-zinc-700 border-b border-zinc-300 font-mono">
                <th className="p-2.5">Mã SKU</th>
                <th className="p-2.5">Tên vật liệu</th>
                <th className="p-2.5">Nhóm hàng</th>
                <th className="p-2.5 text-center">ĐVT chuẩn</th>
                <th className="p-2.5">ĐVT Quy đổi</th>
                <th className="p-2.5 text-right">Giá vốn BQ</th>
                <th className="p-2.5 text-right font-medium text-brand-700">Giá bán lẻ</th>
                <th className="p-2.5 text-right font-medium text-blue-700">Giá thợ</th>
                <th className="p-2.5 text-right font-medium text-emerald-700">Giá đại lý</th>
                <th className="p-2.5 text-right">Tồn min</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {products.map((p) => {
                const pLe = p.prices?.find((pr) => pr.priceList?.code === 'GIA-LE' && pr.unitName === p.baseUnit);
                const pTho = p.prices?.find((pr) => pr.priceList?.code === 'GIA-THO' && pr.unitName === p.baseUnit);
                const pDaiLy = p.prices?.find((pr) => pr.priceList?.code === 'GIA-DAILY' && pr.unitName === p.baseUnit);

                return (
                  <tr key={p.id} className="hover:bg-zinc-50">
                    <td className="p-2.5 font-mono font-bold text-zinc-950">{p.sku}</td>
                    <td className="p-2.5 font-semibold text-zinc-900">{p.name}</td>
                    <td className="p-2.5 text-zinc-600">{p.category?.name || '—'}</td>
                    <td className="p-2.5 text-center font-mono font-bold text-zinc-800">{p.baseUnit}</td>
                    <td className="p-2.5 font-mono text-[11px]">
                      {p.units && p.units.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {p.units.map((u, i) => (
                            <span key={i} className="bg-zinc-100 border border-zinc-200 px-1 py-0.5 text-zinc-700">
                              1 {u.unitName} = {u.factor} {p.baseUnit}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-zinc-400">—</span>
                      )}
                    </td>
                    <td className="p-2.5 text-right font-mono text-zinc-700">{formatMoney(p.costPrice)}</td>
                    <td className="p-2.5 text-right font-mono font-bold text-brand-700">
                      {pLe ? formatMoney(pLe.price) : '—'}
                    </td>
                    <td className="p-2.5 text-right font-mono text-blue-700 font-semibold">
                      {pTho ? formatMoney(pTho.price) : '—'}
                    </td>
                    <td className="p-2.5 text-right font-mono text-emerald-700 font-semibold">
                      {pDaiLy ? formatMoney(pDaiLy.price) : '—'}
                    </td>
                    <td className="p-2.5 text-right font-mono text-zinc-500">{formatNumber(p.minStock)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Thêm sản phẩm */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white border border-zinc-300 w-full max-w-xl p-5 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-zinc-200 pb-2">
              <h3 className="text-sm font-bold uppercase font-mono">THÊM MẶT HÀNG VẬT LIỆU MỚI</h3>
              <button onClick={() => setShowModal(false)}><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1">Mã SKU *</label>
                  <input
                    type="text"
                    placeholder="VD: ST-HP-D18"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    className="w-full border border-zinc-300 p-2 text-xs font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1">Nhóm hàng</label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full border border-zinc-300 p-2 text-xs"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold block mb-1">Tên sản phẩm / Quy cách vật liệu *</label>
                <input
                  type="text"
                  placeholder="VD: Thép Hòa Phát phi 18 CB400..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border border-zinc-300 p-2 text-xs font-semibold"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold block mb-1">Đơn vị cơ bản (Lưu kho) *</label>
                  <input
                    type="text"
                    placeholder="Bao, Cây, Viên, m3..."
                    value={baseUnit}
                    onChange={(e) => setBaseUnit(e.target.value)}
                    className="w-full border border-zinc-300 p-2 text-xs font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1">Giá vốn ban đầu</label>
                  <input
                    type="number"
                    value={costPrice}
                    onChange={(e) => setCostPrice(parseFloat(e.target.value) || 0)}
                    className="w-full border border-zinc-300 p-2 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1">Tồn tối thiểu</label>
                  <input
                    type="number"
                    value={minStock}
                    onChange={(e) => setMinStock(parseFloat(e.target.value) || 0)}
                    className="w-full border border-zinc-300 p-2 text-xs font-mono"
                  />
                </div>
              </div>

              {/* Unit Conversion */}
              <div className="p-3 bg-zinc-50 border border-zinc-200 space-y-2">
                <span className="font-bold uppercase text-[11px] text-zinc-700 block font-mono">
                  Đơn vị tính quy đổi phụ (Tùy chọn)
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-zinc-600 block mb-0.5">Tên ĐVT quy đổi</label>
                    <input
                      type="text"
                      placeholder="Ví dụ: Tấn, Bó, Xe 3 khối, Pallet..."
                      value={altUnitName}
                      onChange={(e) => setAltUnitName(e.target.value)}
                      className="w-full border border-zinc-300 p-1.5 text-xs bg-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-zinc-600 block mb-0.5">Hệ số quy đổi sang ĐVT chuẩn</label>
                    <input
                      type="number"
                      step="any"
                      placeholder="VD: 20 (1 Tấn = 20 Bao)"
                      value={altUnitFactor}
                      onChange={(e) => setAltUnitFactor(parseFloat(e.target.value) || 1)}
                      className="w-full border border-zinc-300 p-1.5 text-xs bg-white font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Prices */}
              <div className="p-3 bg-zinc-50 border border-zinc-200 space-y-2">
                <span className="font-bold uppercase text-[11px] text-zinc-700 block font-mono">
                  Bảng giá bán theo ĐVT chuẩn
                </span>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] text-brand-700 font-bold block mb-0.5">Giá bán lẻ</label>
                    <input
                      type="number"
                      value={retailPrice}
                      onChange={(e) => setRetailPrice(parseFloat(e.target.value) || 0)}
                      className="w-full border border-zinc-300 p-1.5 text-xs bg-white font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-blue-700 font-bold block mb-0.5">Giá thầu thợ</label>
                    <input
                      type="number"
                      value={contractorPrice}
                      onChange={(e) => setContractorPrice(parseFloat(e.target.value) || 0)}
                      className="w-full border border-zinc-300 p-1.5 text-xs bg-white font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-emerald-700 font-bold block mb-0.5">Giá đại lý / Dự án</label>
                    <input
                      type="number"
                      value={agencyPrice}
                      onChange={(e) => setAgencyPrice(parseFloat(e.target.value) || 0)}
                      className="w-full border border-zinc-300 p-1.5 text-xs bg-white font-mono font-bold"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t border-zinc-200">
              <button onClick={() => setShowModal(false)} className="px-3 py-1.5 text-xs border border-zinc-300">Hủy</button>
              <button onClick={handleCreateProduct} className="px-4 py-1.5 text-xs bg-brand-600 text-white font-semibold">LƯU MẶT HÀNG</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

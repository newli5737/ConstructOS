import React, { useState, useEffect } from 'react';
import {
  Warehouse as WarehouseIcon,
  AlertTriangle,
  ArrowRightLeft,
  SlidersHorizontal,
  Search,
  RefreshCw,
  X,
  Boxes,
} from 'lucide-react';
import { api, formatMoney, formatNumber } from '../api/client';
import { StockBalanceItem, StockMovement, Warehouse, Product } from '../types';

export const InventoryPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'balances' | 'ledger'>('balances');
  const [stockList, setStockList] = useState<StockBalanceItem[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedWhId, setSelectedWhId] = useState('');
  const [search, setSearch] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);

  // Thẻ kho
  const [selectedProductId, setSelectedProductId] = useState('');
  const [ledger, setLedger] = useState<StockMovement[]>([]);

  // Modals
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);

  // Adjust form
  const [adjProductId, setAdjProductId] = useState('');
  const [adjWarehouseId, setAdjWarehouseId] = useState('');
  const [adjQuantity, setAdjQuantity] = useState(0);
  const [adjReason, setAdjReason] = useState('Kiểm kê cuối tháng');

  // Transfer form
  const [tfFromWh, setTfFromWh] = useState('');
  const [tfToWh, setTfToWh] = useState('');
  const [tfProductId, setTfProductId] = useState('');
  const [tfQuantity, setTfQuantity] = useState(0);
  const [tfNote, setTfNote] = useState('');

  const fetchStock = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (selectedWhId) params.warehouseId = selectedWhId;
      if (search) params.q = search;
      if (lowStockOnly) params.lowStockOnly = 'true';

      const [sRes, wRes, pRes] = await Promise.all([
        api.get('/stock', { params }),
        api.get('/warehouses'),
        api.get('/products'),
      ]);
      setStockList(sRes.data || []);
      setWarehouses(wRes.data || []);
      setProducts(pRes.data || []);

      if (pRes.data?.length > 0 && !selectedProductId) {
        setSelectedProductId(pRes.data[0].id);
      }
      if (wRes.data?.length >= 2) {
        setTfFromWh(wRes.data[0].id);
        setTfToWh(wRes.data[1].id);
      }
    } catch (err) {
      console.error('Error fetching stock', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStock();
  }, [selectedWhId, lowStockOnly]);

  const fetchLedger = async (pId: string) => {
    if (!pId) return;
    try {
      const res = await api.get(`/stock/${pId}/ledger`);
      setLedger(res.data || []);
    } catch (err) {
      console.error('Error fetching ledger', err);
    }
  };

  useEffect(() => {
    if (activeTab === 'ledger' && selectedProductId) {
      fetchLedger(selectedProductId);
    }
  }, [activeTab, selectedProductId]);

  const handleAdjustStock = async () => {
    if (!adjProductId || !adjWarehouseId) return;
    try {
      await api.post('/stock/adjustments', {
        productId: adjProductId,
        warehouseId: adjWarehouseId,
        actualQuantity: adjQuantity,
        reason: adjReason,
      });
      alert('Đã cập nhật số lượng kiểm kê thành công!');
      setShowAdjustModal(false);
      fetchStock();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Lỗi khi kiểm kê');
    }
  };

  const handleTransferStock = async () => {
    if (!tfProductId || !tfFromWh || !tfToWh || tfQuantity <= 0) {
      alert('Vui lòng điền đủ thông tin chuyển kho');
      return;
    }
    try {
      await api.post('/stock/transfers', {
        fromWarehouseId: tfFromWh,
        toWarehouseId: tfToWh,
        productId: tfProductId,
        quantity: tfQuantity,
        note: tfNote,
      });
      alert('Đã tạo phiếu điều chuyển kho thành công!');
      setShowTransferModal(false);
      fetchStock();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Lỗi khi chuyển kho');
    }
  };

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-200 pb-3">
        <div>
          <h1 className="text-lg font-bold tracking-tight text-zinc-950 font-mono">
            QUẢN LÝ KHO BÃI & THẺ KHO VẬT TƯ
          </h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            Theo dõi tồn kho theo từng kho bãi · Thẻ kho chi tiết theo sản phẩm · Kiểm kê & Điều chuyển
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => {
              if (products.length > 0) {
                setAdjProductId(products[0].id);
                setAdjWarehouseId(warehouses[0]?.id || '');
              }
              setShowAdjustModal(true);
            }}
            className="bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold px-3 py-1.5 rounded-sm flex items-center gap-1.5 border border-zinc-700 shadow-2xs"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>KIỂM KÊ ĐIỀU CHỈNH</span>
          </button>
          <button
            onClick={() => {
              if (products.length > 0) setTfProductId(products[0].id);
              setShowTransferModal(true);
            }}
            className="bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold px-3 py-1.5 rounded-sm flex items-center gap-1.5 border border-brand-500 shadow-2xs"
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
            <span>ĐIỀU CHUYỂN KHO</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-zinc-200 gap-2">
        <button
          onClick={() => setActiveTab('balances')}
          className={`pb-2 px-3 text-xs font-bold font-mono transition-colors border-b-2 -mb-[1px] ${
            activeTab === 'balances'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-zinc-500 hover:text-zinc-800'
          }`}
        >
          Tồn kho tổng hợp & Phân kho ({stockList.length})
        </button>
        <button
          onClick={() => setActiveTab('ledger')}
          className={`pb-2 px-3 text-xs font-bold font-mono transition-colors border-b-2 -mb-[1px] ${
            activeTab === 'ledger'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-zinc-500 hover:text-zinc-800'
          }`}
        >
          Thẻ kho (Lịch sử biến động vật tư)
        </button>
      </div>

      {activeTab === 'balances' ? (
        <>
          {/* Filters */}
          <div className="bg-white border border-zinc-200 p-3 rounded-sm shadow-2xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3 flex-1">
              <div className="relative min-w-[220px]">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Tìm tên hàng, mã SKU..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && fetchStock()}
                  className="w-full bg-zinc-50 border border-zinc-300 pl-8 pr-3 py-1.5 rounded-sm text-xs outline-none"
                />
              </div>

              <select
                value={selectedWhId}
                onChange={(e) => setSelectedWhId(e.target.value)}
                className="bg-zinc-50 border border-zinc-300 px-2.5 py-1.5 rounded-sm text-xs outline-none"
              >
                <option value="">Tất cả kho bãi</option>
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>

              <label className="flex items-center gap-1.5 text-xs cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={lowStockOnly}
                  onChange={(e) => setLowStockOnly(e.target.checked)}
                />
                <span className="text-red-700 font-semibold">Chỉ hiện hàng sắp hết</span>
              </label>
            </div>

            <button
              onClick={fetchStock}
              className="p-1.5 text-zinc-600 hover:text-zinc-900 border border-zinc-300 rounded-sm"
              title="Làm mới"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Stock Table */}
          <div className="bg-white border border-zinc-200 rounded-sm shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-zinc-100 text-zinc-700 border-b border-zinc-300 font-mono">
                    <th className="p-2.5">Mã hàng</th>
                    <th className="p-2.5">Tên vật liệu</th>
                    <th className="p-2.5">Nhóm hàng</th>
                    <th className="p-2.5 text-center">ĐVT</th>
                    <th className="p-2.5 text-right">Tổng tồn</th>
                    <th className="p-2.5 text-right">Tồn tối thiểu</th>
                    <th className="p-2.5 text-right">Giá vốn BQ</th>
                    <th className="p-2.5 text-right">Giá trị tồn</th>
                    <th className="p-2.5">Chi tiết các kho</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200">
                  {stockList.map((item) => (
                    <tr key={item.id} className="hover:bg-zinc-50">
                      <td className="p-2.5 font-mono font-bold text-zinc-900">{item.sku}</td>
                      <td className="p-2.5 font-semibold text-zinc-900">
                        {item.name}
                        {item.isLowStock && (
                          <span className="ml-2 inline-flex items-center gap-0.5 text-[10px] text-red-700 bg-red-50 border border-red-200 px-1 font-bold">
                            <AlertTriangle className="w-3 h-3" /> Thiếu hàng
                          </span>
                        )}
                      </td>
                      <td className="p-2.5 text-zinc-600">{item.category || '—'}</td>
                      <td className="p-2.5 text-center font-mono">{item.baseUnit}</td>
                      <td className="p-2.5 text-right font-mono font-bold text-zinc-950">
                        {formatNumber(item.totalStock)}
                      </td>
                      <td className="p-2.5 text-right font-mono text-zinc-500">
                        {formatNumber(item.minStock)}
                      </td>
                      <td className="p-2.5 text-right font-mono text-zinc-800">
                        {formatMoney(item.costPrice)}
                      </td>
                      <td className="p-2.5 text-right font-mono font-bold text-brand-700">
                        {formatMoney(item.totalValue)}
                      </td>
                      <td className="p-2.5">
                        <div className="flex flex-wrap gap-1 text-[11px] font-mono">
                          {item.balances.map((b, i) => (
                            <span
                              key={i}
                              className="bg-zinc-100 border border-zinc-200 px-1.5 py-0.5 rounded-none text-zinc-700"
                            >
                              {b.warehouseName}: <strong className="text-zinc-950">{formatNumber(b.quantity)}</strong>
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        /* Thẻ kho view */
        <div className="space-y-3">
          <div className="bg-white border border-zinc-200 p-3 rounded-sm shadow-2xs flex items-center gap-3">
            <span className="text-xs font-bold uppercase font-mono text-zinc-700">
              Chọn mặt hàng để xem Thẻ Kho:
            </span>
            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className="bg-zinc-50 border border-zinc-300 p-1.5 rounded-sm text-xs font-semibold outline-none min-w-[280px]"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  [{p.sku}] {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="bg-white border border-zinc-200 rounded-sm shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-zinc-100 text-zinc-700 border-b border-zinc-300 font-mono">
                    <th className="p-2.5">Thời gian</th>
                    <th className="p-2.5">Loại giao dịch</th>
                    <th className="p-2.5">Kho bãi</th>
                    <th className="p-2.5 text-right">Số lượng (+/-)</th>
                    <th className="p-2.5 text-right">Tồn sau giao dịch</th>
                    <th className="p-2.5">Chứng từ tham chiếu</th>
                    <th className="p-2.5">Diễn giải / Ghi chú</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 font-mono">
                  {ledger.length > 0 ? (
                    ledger.map((m) => {
                      const isPlus = Number(m.quantity) > 0;
                      return (
                        <tr key={m.id} className="hover:bg-zinc-50">
                          <td className="p-2.5 text-zinc-600">
                            {new Date(m.createdAt).toLocaleString('vi-VN')}
                          </td>
                          <td className="p-2.5">
                            <span
                              className={`px-1.5 py-0.5 text-[10px] uppercase font-bold border ${
                                m.movementType.includes('IN')
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : m.movementType.includes('OUT')
                                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                                  : 'bg-amber-50 text-amber-700 border-amber-200'
                              }`}
                            >
                              {m.movementType}
                            </span>
                          </td>
                          <td className="p-2.5 font-sans font-medium text-zinc-800">
                            {m.warehouse?.name}
                          </td>
                          <td
                            className={`p-2.5 text-right font-bold ${
                              isPlus ? 'text-emerald-700' : 'text-red-700'
                            }`}
                          >
                            {isPlus ? `+${formatNumber(m.quantity)}` : formatNumber(m.quantity)}
                          </td>
                          <td className="p-2.5 text-right font-bold text-zinc-950">
                            {formatNumber(m.balanceAfter)}
                          </td>
                          <td className="p-2.5 text-zinc-700">{m.refType}</td>
                          <td className="p-2.5 font-sans text-zinc-600">{m.note || '—'}</td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-zinc-400">
                        Chưa có lịch sử thẻ kho cho mặt hàng này
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modal Kiểm kê */}
      {showAdjustModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white border border-zinc-300 w-full max-w-md p-5 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-zinc-200 pb-2">
              <h3 className="text-sm font-bold uppercase font-mono">KIỂM KÊ ĐIỀU CHỈNH TỒN KHO</h3>
              <button onClick={() => setShowAdjustModal(false)}><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold block mb-1">Mặt hàng *</label>
                <select
                  value={adjProductId}
                  onChange={(e) => setAdjProductId(e.target.value)}
                  className="w-full border border-zinc-300 p-2 text-xs"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>[{p.sku}] {p.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="font-semibold block mb-1">Kho bãi *</label>
                <select
                  value={adjWarehouseId}
                  onChange={(e) => setAdjWarehouseId(e.target.value)}
                  className="w-full border border-zinc-300 p-2 text-xs"
                >
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="font-semibold block mb-1">Số lượng thực tế sau kiểm kê *</label>
                <input
                  type="number"
                  min="0"
                  value={adjQuantity}
                  onChange={(e) => setAdjQuantity(parseFloat(e.target.value) || 0)}
                  className="w-full border border-zinc-300 p-2 text-xs font-mono font-bold"
                />
              </div>
              <div>
                <label className="font-semibold block mb-1">Lý do điều chỉnh</label>
                <input
                  type="text"
                  value={adjReason}
                  onChange={(e) => setAdjReason(e.target.value)}
                  className="w-full border border-zinc-300 p-2 text-xs"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2 pt-2 border-t border-zinc-200">
              <button onClick={() => setShowAdjustModal(false)} className="px-3 py-1.5 text-xs border border-zinc-300">Hủy</button>
              <button onClick={handleAdjustStock} className="px-4 py-1.5 text-xs bg-brand-600 text-white font-semibold">CẬP NHẬT</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Chuyển kho */}
      {showTransferModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white border border-zinc-300 w-full max-w-md p-5 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-zinc-200 pb-2">
              <h3 className="text-sm font-bold uppercase font-mono">ĐIỀU CHUYỂN VẬT TƯ GIỮA 2 KHO</h3>
              <button onClick={() => setShowTransferModal(false)}><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold block mb-1">Mặt hàng cần chuyển *</label>
                <select
                  value={tfProductId}
                  onChange={(e) => setTfProductId(e.target.value)}
                  className="w-full border border-zinc-300 p-2 text-xs"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>[{p.sku}] {p.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold block mb-1">Kho xuất *</label>
                  <select
                    value={tfFromWh}
                    onChange={(e) => setTfFromWh(e.target.value)}
                    className="w-full border border-zinc-300 p-2 text-xs"
                  >
                    {warehouses.map((w) => (
                      <option key={w.id} value={w.id}>{w.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-semibold block mb-1">Kho nhập *</label>
                  <select
                    value={tfToWh}
                    onChange={(e) => setTfToWh(e.target.value)}
                    className="w-full border border-zinc-300 p-2 text-xs"
                  >
                    {warehouses.map((w) => (
                      <option key={w.id} value={w.id}>{w.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="font-semibold block mb-1">Số lượng chuyển *</label>
                <input
                  type="number"
                  min="0.001"
                  value={tfQuantity}
                  onChange={(e) => setTfQuantity(parseFloat(e.target.value) || 0)}
                  className="w-full border border-zinc-300 p-2 text-xs font-mono font-bold"
                />
              </div>
              <div>
                <label className="font-semibold block mb-1">Ghi chú chuyến xe</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Xe trung chuyển bến bãi, bác tài Hùng..."
                  value={tfNote}
                  onChange={(e) => setTfNote(e.target.value)}
                  className="w-full border border-zinc-300 p-2 text-xs"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2 pt-2 border-t border-zinc-200">
              <button onClick={() => setShowTransferModal(false)} className="px-3 py-1.5 text-xs border border-zinc-300">Hủy</button>
              <button onClick={handleTransferStock} className="px-4 py-1.5 text-xs bg-brand-600 text-white font-semibold">XÁC NHẬN CHUYỂN</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

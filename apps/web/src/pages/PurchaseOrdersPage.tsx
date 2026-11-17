import React, { useState, useEffect } from 'react';
import { Truck, Plus, CheckCircle, PackagePlus, Search, X } from 'lucide-react';
import { api, formatMoney, formatNumber } from '../api/client';
import { Supplier, Warehouse, Product } from '../types';
import { useToast } from '../context/ToastContext';

export const PurchaseOrdersPage: React.FC = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'receipts' | 'pos'>('receipts');
  const [receipts, setReceipts] = useState<any[]>([]);
  const [pos, setPos] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // New GRN Modal
  const [showModal, setShowModal] = useState(false);
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [selectedWarehouseId, setSelectedWarehouseId] = useState('');
  const [receiptDate, setReceiptDate] = useState(new Date().toISOString().split('T')[0]);
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [note, setNote] = useState('');
  const [modalItems, setModalItems] = useState<any[]>([]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [rRes, pRes, sRes, wRes, prodRes] = await Promise.all([
        api.get('/goods-receipts'),
        api.get('/purchase-orders'),
        api.get('/suppliers'),
        api.get('/warehouses'),
        api.get('/products'),
      ]);
      setReceipts(rRes.data || []);
      setPos(pRes.data || []);
      setSuppliers(sRes.data || []);
      setWarehouses(wRes.data || []);
      setProducts(prodRes.data || []);

      if (sRes.data?.length > 0) setSelectedSupplierId(sRes.data[0].id);
      if (wRes.data?.length > 0) setSelectedWarehouseId(wRes.data[0].id);
    } catch (err) {
      console.error('Error fetching purchase data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openCreateModal = () => {
    if (products.length > 0) {
      setModalItems([
        {
          productId: products[0].id,
          unitName: products[0].baseUnit,
          quantity: 10,
          unitCost: Number(products[0].costPrice),
          factor: 1,
        },
      ]);
    }
    setShowModal(true);
  };

  const handleAddModalRow = () => {
    if (products.length === 0) return;
    setModalItems((prev) => [
      ...prev,
      {
        productId: products[0].id,
        unitName: products[0].baseUnit,
        quantity: 10,
        unitCost: Number(products[0].costPrice),
        factor: 1,
      },
    ]);
  };

  const handleProductChange = (idx: number, pId: string) => {
    const p = products.find((prod) => prod.id === pId);
    if (!p) return;
    setModalItems((prev) => {
      const updated = [...prev];
      updated[idx] = {
        productId: p.id,
        unitName: p.baseUnit,
        quantity: 10,
        unitCost: Number(p.costPrice),
        factor: 1,
      };
      return updated;
    });
  };

  const calculateModalTotal = () => {
    return modalItems.reduce((sum, item) => sum + item.quantity * item.unitCost, 0);
  };

  const handleCreateReceipt = async () => {
    if (!selectedSupplierId || !selectedWarehouseId || modalItems.length === 0) {
      toast.warning('Vui lòng điền đủ thông tin phiếu nhập');
      return;
    }

    try {
      const payload = {
        supplierId: selectedSupplierId,
        warehouseId: selectedWarehouseId,
        receiptDate,
        paidAmount,
        note,
        items: modalItems.map((i) => ({
          productId: i.productId,
          unitName: i.unitName,
          quantity: i.quantity,
          unitCost: i.unitCost,
          factor: i.factor || 1,
        })),
      };

      await api.post('/goods-receipts', payload);
      toast.success('Đã tạo phiếu nhập kho thành công! Giá vốn bình quân và tồn kho đã được cập nhật.');
      setShowModal(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Lỗi khi tạo phiếu nhập kho');
    }
  };

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-200 pb-3">
        <div>
          <h1 className="text-lg font-bold tracking-tight text-zinc-950 font-mono">
            MUA HÀNG & PHIẾU NHẬP KHO (GRN)
          </h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            Quản lý nhập vật tư từ nhà sản xuất · Tự động tính giá vốn bình quân gia quyền & tăng tồn kho
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold px-3.5 py-1.5 rounded-sm flex items-center gap-1.5 border border-brand-500 shadow-2xs self-start sm:self-auto"
        >
          <PackagePlus className="w-3.5 h-3.5" />
          <span>TẠO PHIẾU NHẬP KHO MỚI</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-zinc-200 gap-2">
        <button
          onClick={() => setActiveTab('receipts')}
          className={`pb-2 px-3 text-xs font-bold font-mono transition-colors border-b-2 -mb-[1px] ${
            activeTab === 'receipts'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-zinc-500 hover:text-zinc-800'
          }`}
        >
          Phiếu nhập kho đã thực hiện ({receipts.length})
        </button>
        <button
          onClick={() => setActiveTab('pos')}
          className={`pb-2 px-3 text-xs font-bold font-mono transition-colors border-b-2 -mb-[1px] ${
            activeTab === 'pos'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-zinc-500 hover:text-zinc-800'
          }`}
        >
          Đơn đặt hàng mua (PO) ({pos.length})
        </button>
      </div>

      {/* Table Section */}
      <div className="bg-white border border-zinc-200 rounded-sm shadow-2xs overflow-hidden">
        {activeTab === 'receipts' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-zinc-100 text-zinc-700 border-b border-zinc-300 font-mono">
                  <th className="p-2.5">Mã phiếu</th>
                  <th className="p-2.5">Nhà cung cấp</th>
                  <th className="p-2.5">Kho nhận</th>
                  <th className="p-2.5">Ngày nhập</th>
                  <th className="p-2.5 text-right">Tổng tiền hàng</th>
                  <th className="p-2.5 text-right">Đã trả NCC</th>
                  <th className="p-2.5 text-center">Thanh toán</th>
                  <th className="p-2.5">Ghi chú</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                {receipts.length > 0 ? (
                  receipts.map((r) => (
                    <tr key={r.id} className="hover:bg-zinc-50">
                      <td className="p-2.5 font-mono font-bold text-zinc-950">{r.code}</td>
                      <td className="p-2.5 font-semibold text-zinc-900">{r.supplier?.name}</td>
                      <td className="p-2.5 text-zinc-700">{r.warehouse?.name}</td>
                      <td className="p-2.5 font-mono text-zinc-600">
                        {new Date(r.receiptDate).toLocaleDateString('vi-VN')}
                      </td>
                      <td className="p-2.5 text-right font-mono font-bold text-zinc-950">
                        {formatMoney(r.total)}
                      </td>
                      <td className="p-2.5 text-right font-mono text-emerald-700 font-semibold">
                        {formatMoney(r.paidAmount)}
                      </td>
                      <td className="p-2.5 text-center">
                        <span
                          className={`inline-block px-1.5 py-0.5 text-[10px] font-mono uppercase border ${
                            r.paymentStatus === 'PAID'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : r.paymentStatus === 'PARTIAL'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-red-50 text-red-700 border-red-200'
                          }`}
                        >
                          {r.paymentStatus === 'PAID'
                            ? 'Đã trả'
                            : r.paymentStatus === 'PARTIAL'
                            ? 'Trả một phần'
                            : 'Nợ NCC'}
                        </span>
                      </td>
                      <td className="p-2.5 text-zinc-500">{r.note || '—'}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-zinc-400">
                      Chưa có phiếu nhập kho nào
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-zinc-100 text-zinc-700 border-b border-zinc-300 font-mono">
                  <th className="p-2.5">Mã PO</th>
                  <th className="p-2.5">Nhà cung cấp</th>
                  <th className="p-2.5">Ngày đặt</th>
                  <th className="p-2.5 text-right">Tổng giá trị</th>
                  <th className="p-2.5 text-center">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                {pos.length > 0 ? (
                  pos.map((p) => (
                    <tr key={p.id} className="hover:bg-zinc-50">
                      <td className="p-2.5 font-mono font-bold text-zinc-950">{p.code}</td>
                      <td className="p-2.5 font-semibold text-zinc-900">{p.supplier?.name}</td>
                      <td className="p-2.5 font-mono text-zinc-600">
                        {new Date(p.orderDate).toLocaleDateString('vi-VN')}
                      </td>
                      <td className="p-2.5 text-right font-mono font-bold text-zinc-950">
                        {formatMoney(p.total)}
                      </td>
                      <td className="p-2.5 text-center font-mono">
                        <span className="bg-blue-50 text-blue-700 border border-blue-200 px-1.5 py-0.5 text-[10px]">
                          {p.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-zinc-400">
                      Chưa có đơn đặt hàng PO nào
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Goods Receipt Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-none border border-zinc-300 w-full max-w-3xl p-5 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-zinc-200 pb-2">
              <h3 className="text-sm font-bold uppercase font-mono text-zinc-900">
                LẬP PHIẾU NHẬP KHO VẬT LIỆU XÂY DỰNG
              </h3>
              <button onClick={() => setShowModal(false)} className="text-zinc-400 hover:text-zinc-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="font-semibold text-zinc-700 block mb-1">Nhà cung cấp *</label>
                <select
                  value={selectedSupplierId}
                  onChange={(e) => setSelectedSupplierId(e.target.value)}
                  className="w-full bg-zinc-50 border border-zinc-300 p-1.5 rounded-sm text-xs outline-none"
                >
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.code} - {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-zinc-700 block mb-1">Kho / Bãi nhập vào *</label>
                <select
                  value={selectedWarehouseId}
                  onChange={(e) => setSelectedWarehouseId(e.target.value)}
                  className="w-full bg-zinc-50 border border-zinc-300 p-1.5 rounded-sm text-xs outline-none"
                >
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-zinc-700 block mb-1">Ngày lập phiếu</label>
                <input
                  type="date"
                  value={receiptDate}
                  onChange={(e) => setReceiptDate(e.target.value)}
                  className="w-full bg-zinc-50 border border-zinc-300 p-1.5 rounded-sm text-xs font-mono outline-none"
                />
              </div>
            </div>

            {/* Items */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold uppercase font-mono text-zinc-700">
                  Chi tiết hàng hóa nhập kho
                </span>
                <button
                  type="button"
                  onClick={handleAddModalRow}
                  className="text-xs text-brand-600 hover:text-brand-700 font-semibold flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Thêm dòng</span>
                </button>
              </div>

              <div className="border border-zinc-200 max-h-60 overflow-y-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-zinc-100 text-zinc-700 font-mono">
                    <tr>
                      <th className="p-2">Sản phẩm</th>
                      <th className="p-2 w-24">ĐVT</th>
                      <th className="p-2 w-24 text-right">Số lượng</th>
                      <th className="p-2 w-32 text-right">Giá nhập (VNĐ)</th>
                      <th className="p-2 w-32 text-right">Thành tiền</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200">
                    {modalItems.map((item, idx) => (
                      <tr key={idx}>
                        <td className="p-2">
                          <select
                            value={item.productId}
                            onChange={(e) => handleProductChange(idx, e.target.value)}
                            className="w-full bg-white border border-zinc-300 p-1 text-xs"
                          >
                            {products.map((p) => (
                              <option key={p.id} value={p.id}>
                                [{p.sku}] {p.name}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={item.unitName}
                            onChange={(e) => {
                              const val = e.target.value;
                              setModalItems((prev) => {
                                const u = [...prev];
                                u[idx].unitName = val;
                                return u;
                              });
                            }}
                            className="w-full border border-zinc-300 p-1 text-xs text-center font-mono"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="number"
                            min="0.001"
                            value={item.quantity}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0;
                              setModalItems((prev) => {
                                const u = [...prev];
                                u[idx].quantity = val;
                                return u;
                              });
                            }}
                            className="w-full border border-zinc-300 p-1 text-xs text-right font-mono"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="number"
                            value={item.unitCost}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0;
                              setModalItems((prev) => {
                                const u = [...prev];
                                u[idx].unitCost = val;
                                return u;
                              });
                            }}
                            className="w-full border border-zinc-300 p-1 text-xs text-right font-mono"
                          />
                        </td>
                        <td className="p-2 text-right font-mono font-bold text-zinc-900">
                          {formatMoney(item.quantity * item.unitCost)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Total & Paid */}
            <div className="flex justify-between items-center text-xs bg-zinc-50 border border-zinc-200 p-3 font-mono">
              <div>
                <span className="text-zinc-600">Đã thanh toán cho NCC: </span>
                <input
                  type="number"
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(parseFloat(e.target.value) || 0)}
                  className="border border-zinc-300 p-1 text-right font-mono w-32 bg-white"
                />
                <span className="ml-1">₫</span>
              </div>
              <div className="text-right">
                <span className="text-zinc-600 block text-[11px]">TỔNG TIỀN PHIẾU NHẬP:</span>
                <span className="text-base font-bold text-brand-600">
                  {formatMoney(calculateModalTotal())}
                </span>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t border-zinc-200">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-3 py-1.5 text-xs border border-zinc-300 text-zinc-700 hover:bg-zinc-100"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleCreateReceipt}
                className="px-4 py-1.5 text-xs bg-brand-600 hover:bg-brand-500 text-white font-semibold"
              >
                LƯU & CẬP NHẬT KHO
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Trash2,
  Printer,
  Save,
  CheckCircle,
  AlertTriangle,
  Building,
  Calendar,
  CreditCard,
  Truck,
  RotateCcw,
} from 'lucide-react';
import { api, formatMoney, formatNumber } from '../api/client';
import { Customer, CustomerSite, Product, Warehouse, SalesOrder } from '../types';
import { InvoicePrintModal } from '../components/InvoicePrintModal';

interface OrderItemRow {
  productId: string;
  productName: string;
  sku: string;
  unitName: string;
  baseUnit: string;
  factor: number;
  quantity: number;
  unitPrice: number;
  discountPct: number;
  lineTotal: number;
  availableStock: number;
  units: { unitName: string; factor: number }[];
}

export const QuickSalePage: React.FC = () => {
  const navigate = useNavigate();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [selectedSiteId, setSelectedSiteId] = useState<string>('');
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>('');
  const [orderDate, setOrderDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState<string>('');
  const [note, setNote] = useState<string>('');

  const [items, setItems] = useState<OrderItemRow[]>([]);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [shippingFee, setShippingFee] = useState<number>(0);
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'TRANSFER'>('CASH');

  const [submitting, setSubmitting] = useState(false);
  const [printOrder, setPrintOrder] = useState<SalesOrder | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [cRes, pRes, wRes] = await Promise.all([
          api.get('/customers'),
          api.get('/products'),
          api.get('/warehouses'),
        ]);
        setCustomers(cRes.data || []);
        setProducts(pRes.data || []);
        setWarehouses(wRes.data || []);

        if (cRes.data?.length > 0) {
          setSelectedCustomerId(cRes.data[0].id);
        }
        if (wRes.data?.length > 0) {
          const defaultWh = wRes.data.find((w: Warehouse) => w.isDefault) || wRes.data[0];
          setSelectedWarehouseId(defaultWh.id);
        }
      } catch (err) {
        console.error('Error fetching init data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Selected customer object
  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);

  // Update due date automatically when customer changes
  useEffect(() => {
    if (selectedCustomer) {
      const termDays = selectedCustomer.paymentTermDays || 30;
      const d = new Date();
      d.setDate(d.getDate() + termDays);
      setDueDate(d.toISOString().split('T')[0]);
    }
  }, [selectedCustomerId]);

  // Initial row if empty
  useEffect(() => {
    if (items.length === 0 && products.length > 0) {
      addRow();
    }
  }, [products]);

  const addRow = () => {
    if (products.length === 0) return;
    const firstP = products[0];
    const row = createRowFromProduct(firstP);
    setItems((prev) => [...prev, row]);
  };

  const createRowFromProduct = (product: Product): OrderItemRow => {
    // Determine price based on customer group price list
    const priceListId = selectedCustomer?.group?.priceListId;
    let unitPrice = 0;
    const matchPrice = product.prices?.find((p) => p.priceListId === priceListId && p.unitName === product.baseUnit);
    if (matchPrice) {
      unitPrice = Number(matchPrice.price);
    } else if (product.prices?.length > 0) {
      unitPrice = Number(product.prices[0].price);
    }

    // Determine current warehouse stock
    const whBal = product.stockBalances?.find((b) => b.warehouseId === selectedWarehouseId);
    const availableStock = whBal ? Number(whBal.quantity) : 0;

    const units = [
      { unitName: product.baseUnit, factor: 1 },
      ...(product.units || []).map((u) => ({ unitName: u.unitName, factor: Number(u.factor) })),
    ];

    return {
      productId: product.id,
      productName: product.name,
      sku: product.sku,
      unitName: product.baseUnit,
      baseUnit: product.baseUnit,
      factor: 1,
      quantity: 1,
      unitPrice,
      discountPct: 0,
      lineTotal: unitPrice,
      availableStock,
      units,
    };
  };

  const handleProductChange = (index: number, productId: string) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return;
    const newRow = createRowFromProduct(product);
    setItems((prev) => {
      const updated = [...prev];
      updated[index] = newRow;
      return updated;
    });
  };

  const handleUnitChange = (index: number, unitName: string) => {
    setItems((prev) => {
      const updated = [...prev];
      const row = { ...updated[index] };
      const product = products.find((p) => p.id === row.productId);
      const chosenUnit = row.units.find((u) => u.unitName === unitName);
      row.unitName = unitName;
      row.factor = chosenUnit ? chosenUnit.factor : 1;

      // Price for this unit
      const priceListId = selectedCustomer?.group?.priceListId;
      const matchPrice = product?.prices?.find((p) => p.priceListId === priceListId && p.unitName === unitName);
      if (matchPrice) {
        row.unitPrice = Number(matchPrice.price);
      } else if (product) {
        // Fallback: base price * factor
        const baseMatch = product.prices?.find((p) => p.unitName === product.baseUnit);
        if (baseMatch) {
          row.unitPrice = Number(baseMatch.price) * row.factor;
        }
      }

      row.lineTotal = row.quantity * row.unitPrice * (1 - row.discountPct / 100);
      updated[index] = row;
      return updated;
    });
  };

  const handleQtyChange = (index: number, val: number) => {
    setItems((prev) => {
      const updated = [...prev];
      const row = { ...updated[index] };
      row.quantity = Math.max(0, val);
      row.lineTotal = row.quantity * row.unitPrice * (1 - row.discountPct / 100);
      updated[index] = row;
      return updated;
    });
  };

  const handlePriceChange = (index: number, val: number) => {
    setItems((prev) => {
      const updated = [...prev];
      const row = { ...updated[index] };
      row.unitPrice = Math.max(0, val);
      row.lineTotal = row.quantity * row.unitPrice * (1 - row.discountPct / 100);
      updated[index] = row;
      return updated;
    });
  };

  const removeRow = (index: number) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Calculations
  const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
  const total = Math.max(0, subtotal - discountAmount + shippingFee);
  const remainingDebt = Math.max(0, total - paidAmount);

  // Check customer credit limit warning
  const currentCustomerDebt = Number(selectedCustomer?.currentDebt || 0);
  const creditLimit = Number(selectedCustomer?.creditLimit || 0);
  const willExceedCredit = currentCustomerDebt + remainingDebt > creditLimit;

  // Submit Order
  const handleSubmitOrder = async (confirmNow: boolean, openPrint = false) => {
    if (!selectedCustomerId) {
      alert('Vui lòng chọn khách hàng');
      return;
    }
    if (items.length === 0) {
      alert('Đơn hàng cần có ít nhất 1 dòng sản phẩm');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        customerId: selectedCustomerId,
        siteId: selectedSiteId || null,
        warehouseId: selectedWarehouseId,
        orderDate,
        dueDate: dueDate || null,
        discountAmount,
        shippingFee,
        paidAmount,
        paymentMethod,
        note,
        confirmNow,
        allowNegativeStock: true,
        items: items.map((i) => ({
          productId: i.productId,
          unitName: i.unitName,
          quantity: i.quantity,
          factor: i.factor,
          unitPrice: i.unitPrice,
          discountPct: i.discountPct,
        })),
      };

      const res = await api.post('/sales-orders', payload);
      const createdOrder = res.data;

      if (openPrint) {
        setPrintOrder(createdOrder);
      } else {
        alert(confirmNow ? 'Đã xác nhận & trừ kho đơn hàng thành công!' : 'Đã lưu nháp đơn hàng!');
        navigate('/sales-orders');
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Có lỗi khi lưu đơn hàng');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-4 space-y-4 max-w-7xl mx-auto w-full">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-200 pb-3">
        <div>
          <h1 className="text-lg font-bold tracking-tight text-zinc-950 font-mono flex items-center gap-2">
            <span>BÁN NHANH TẠI QUẦY (QUICK POS)</span>
            <span className="text-[10px] font-mono uppercase bg-brand-500/10 text-brand-700 border border-brand-500/20 px-1.5 py-0.5">
              Giao hàng & Thu tiền
            </span>
          </h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            Nhập đơn hàng nhanh dưới 1 phút · Tự động áp giá theo nhóm khách · Kiểm tra tồn kho & công nợ
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => {
              setItems([]);
              addRow();
            }}
            className="px-2.5 py-1.5 text-xs text-zinc-600 hover:text-zinc-900 border border-zinc-300 bg-white rounded-sm"
          >
            Làm mới form
          </button>
        </div>
      </div>

      {/* Customer & Project Header Card */}
      <div className="bg-white border border-zinc-200 p-3.5 rounded-sm shadow-2xs space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
          {/* Customer Picker */}
          <div className="md:col-span-2 space-y-1">
            <label className="font-semibold text-zinc-700 block font-mono uppercase text-[11px]">
              Khách hàng <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              className="w-full bg-zinc-50 border border-zinc-300 p-2 rounded-sm text-xs font-medium focus:border-brand-500 focus:bg-white outline-none"
            >
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code} — {c.name} ({c.phone || 'Không có SĐT'})
                </option>
              ))}
            </select>
          </div>

          {/* Site / Project Picker */}
          <div className="space-y-1">
            <label className="font-semibold text-zinc-700 block font-mono uppercase text-[11px]">
              Công trình / Điểm giao
            </label>
            <select
              value={selectedSiteId}
              onChange={(e) => setSelectedSiteId(e.target.value)}
              className="w-full bg-zinc-50 border border-zinc-300 p-2 rounded-sm text-xs focus:border-brand-500 focus:bg-white outline-none"
            >
              <option value="">Giao tại kho / Địa chỉ chính</option>
              {selectedCustomer?.sites?.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.address})
                </option>
              ))}
            </select>
          </div>

          {/* Warehouse Picker */}
          <div className="space-y-1">
            <label className="font-semibold text-zinc-700 block font-mono uppercase text-[11px]">
              Xuất từ Kho / Bãi
            </label>
            <select
              value={selectedWarehouseId}
              onChange={(e) => setSelectedWarehouseId(e.target.value)}
              className="w-full bg-zinc-50 border border-zinc-300 p-2 rounded-sm text-xs focus:border-brand-500 focus:bg-white outline-none"
            >
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name} {w.isDefault ? '(Mặc định)' : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Customer Financial / Debt Alert Bar */}
        {selectedCustomer && (
          <div className="flex flex-wrap items-center justify-between text-xs bg-zinc-50 border border-zinc-200 p-2.5 rounded-sm">
            <div className="flex items-center space-x-4">
              <div>
                <span className="text-zinc-500">Nhóm khách:</span>{' '}
                <span className="font-bold text-zinc-800">
                  {selectedCustomer.group?.name || 'Khách lẻ'}
                </span>
              </div>
              <div className="border-l border-zinc-300 pl-4">
                <span className="text-zinc-500">Dư nợ hiện tại:</span>{' '}
                <span className="font-mono font-bold text-zinc-900">
                  {formatMoney(selectedCustomer.currentDebt)}
                </span>
              </div>
              <div className="border-l border-zinc-300 pl-4">
                <span className="text-zinc-500">Hạn mức tín dụng:</span>{' '}
                <span className="font-mono font-semibold text-zinc-700">
                  {formatMoney(selectedCustomer.creditLimit)}
                </span>
              </div>
            </div>

            <div>
              {willExceedCredit ? (
                <span className="inline-flex items-center gap-1 bg-red-100 text-red-800 border border-red-300 px-2 py-0.5 text-[11px] font-semibold">
                  <AlertTriangle className="w-3 h-3 text-red-600" />
                  CẢNH BÁO: Đơn này sẽ vượt hạn mức nợ của khách!
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 text-[11px] font-medium">
                  Trong hạn mức tín dụng cho phép
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Main Items Table */}
      <div className="bg-white border border-zinc-200 rounded-sm shadow-2xs overflow-hidden">
        <div className="p-3 border-b border-zinc-200 bg-zinc-100/70 flex justify-between items-center">
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-800 font-mono">
            Danh sách vật tư xuất bán ({items.length} dòng)
          </span>
          <button
            onClick={addRow}
            className="bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold px-2.5 py-1 rounded-sm flex items-center gap-1 shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Thêm dòng (Enter)</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-zinc-100 text-zinc-700 border-b border-zinc-300 font-mono">
                <th className="p-2 text-center w-8">#</th>
                <th className="p-2 min-w-[240px]">Hàng hóa / Vật tư</th>
                <th className="p-2 w-32 text-center">Đơn vị tính</th>
                <th className="p-2 w-28 text-right">Số lượng</th>
                <th className="p-2 w-32 text-right">Đơn giá (VNĐ)</th>
                <th className="p-2 w-20 text-right">CK (%)</th>
                <th className="p-2 w-36 text-right">Thành tiền</th>
                <th className="p-2 w-32 text-center">Tồn kho hiện tại</th>
                <th className="p-2 w-10 text-center"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {items.map((row, idx) => {
                const isOutOfStock = row.availableStock < row.quantity * row.factor;
                return (
                  <tr key={idx} className="hover:bg-zinc-50/80">
                    <td className="p-2 text-center font-mono text-zinc-500">{idx + 1}</td>

                    {/* Product Select */}
                    <td className="p-2">
                      <select
                        value={row.productId}
                        onChange={(e) => handleProductChange(idx, e.target.value)}
                        className="w-full bg-white border border-zinc-300 p-1.5 rounded-sm text-xs font-medium focus:border-brand-500 outline-none"
                      >
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            [{p.sku}] {p.name}
                          </option>
                        ))}
                      </select>
                    </td>

                    {/* Unit Select & Conversion */}
                    <td className="p-2">
                      <select
                        value={row.unitName}
                        onChange={(e) => handleUnitChange(idx, e.target.value)}
                        className="w-full bg-white border border-zinc-300 p-1.5 rounded-sm text-xs text-center font-medium focus:border-brand-500 outline-none font-mono"
                      >
                        {row.units.map((u, i) => (
                          <option key={i} value={u.unitName}>
                            {u.unitName} {u.factor !== 1 ? `(=${u.factor} ${row.baseUnit})` : ''}
                          </option>
                        ))}
                      </select>
                    </td>

                    {/* Quantity Input */}
                    <td className="p-2">
                      <input
                        type="number"
                        min="0.001"
                        step="any"
                        value={row.quantity}
                        onChange={(e) => handleQtyChange(idx, parseFloat(e.target.value) || 0)}
                        className="w-full bg-white border border-zinc-300 p-1.5 rounded-sm text-xs text-right font-mono font-bold text-zinc-950 focus:border-brand-500 outline-none"
                      />
                    </td>

                    {/* Unit Price */}
                    <td className="p-2">
                      <input
                        type="number"
                        value={row.unitPrice}
                        onChange={(e) => handlePriceChange(idx, parseFloat(e.target.value) || 0)}
                        className="w-full bg-white border border-zinc-300 p-1.5 rounded-sm text-xs text-right font-mono text-zinc-900 focus:border-brand-500 outline-none"
                      />
                    </td>

                    {/* Discount % */}
                    <td className="p-2">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={row.discountPct}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          setItems((prev) => {
                            const updated = [...prev];
                            updated[idx].discountPct = val;
                            updated[idx].lineTotal =
                              updated[idx].quantity * updated[idx].unitPrice * (1 - val / 100);
                            return updated;
                          });
                        }}
                        className="w-full bg-white border border-zinc-300 p-1.5 rounded-sm text-xs text-right font-mono focus:border-brand-500 outline-none"
                      />
                    </td>

                    {/* Line Total */}
                    <td className="p-2 text-right font-mono font-bold text-zinc-900 text-sm">
                      {formatMoney(row.lineTotal)}
                    </td>

                    {/* Warehouse stock info */}
                    <td className="p-2 text-center font-mono">
                      {isOutOfStock ? (
                        <span className="text-red-700 bg-red-50 border border-red-200 px-1 py-0.5 text-[10px] font-bold block">
                          Tồn: {formatNumber(row.availableStock)} (Bán âm)
                        </span>
                      ) : (
                        <span className="text-zinc-600 bg-zinc-100 border border-zinc-200 px-1 py-0.5 text-[10px] block">
                          Tồn: {formatNumber(row.availableStock)} {row.baseUnit}
                        </span>
                      )}
                    </td>

                    {/* Delete row */}
                    <td className="p-2 text-center">
                      <button
                        onClick={() => removeRow(idx)}
                        disabled={items.length <= 1}
                        className="text-zinc-400 hover:text-red-600 disabled:opacity-30 p-1"
                        title="Xóa dòng"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bottom Summary & Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left: Notes & Due Date */}
        <div className="bg-white border border-zinc-200 p-3.5 rounded-sm shadow-2xs space-y-3">
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <label className="font-semibold text-zinc-700 block mb-1 font-mono uppercase text-[11px]">
                Ngày lập đơn
              </label>
              <input
                type="date"
                value={orderDate}
                onChange={(e) => setOrderDate(e.target.value)}
                className="w-full bg-zinc-50 border border-zinc-300 p-2 rounded-sm text-xs focus:border-brand-500 outline-none font-mono"
              />
            </div>
            <div>
              <label className="font-semibold text-zinc-700 block mb-1 font-mono uppercase text-[11px]">
                Hạn thanh toán công nợ
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full bg-zinc-50 border border-zinc-300 p-2 rounded-sm text-xs focus:border-brand-500 outline-none font-mono"
              />
            </div>
          </div>

          <div>
            <label className="font-semibold text-zinc-700 block mb-1 font-mono uppercase text-[11px]">
              Ghi chú giao hàng / Xe vận chuyển
            </label>
            <textarea
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ví dụ: Giao đợt 1 vào buổi sáng, xe 5 tấn biển 29C-12345 bốc xếp tại chân công trình..."
              className="w-full bg-zinc-50 border border-zinc-300 p-2 rounded-sm text-xs focus:border-brand-500 outline-none"
            ></textarea>
          </div>
        </div>

        {/* Right: Payment Calculation & Action Buttons */}
        <div className="bg-white border border-zinc-200 p-4 rounded-sm shadow-2xs space-y-3">
          <div className="space-y-2 text-xs font-mono">
            <div className="flex justify-between items-center text-zinc-600">
              <span>Tạm tính tiền hàng:</span>
              <span className="font-bold text-zinc-900">{formatMoney(subtotal)}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-zinc-600">Chiết khấu tổng đơn:</span>
              <div className="flex items-center gap-1 w-44">
                <input
                  type="number"
                  min="0"
                  value={discountAmount}
                  onChange={(e) => setDiscountAmount(parseFloat(e.target.value) || 0)}
                  className="w-full bg-zinc-50 border border-zinc-300 p-1 text-right text-xs font-mono focus:border-brand-500 outline-none"
                />
                <span className="text-zinc-500 text-[11px]">₫</span>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-zinc-600">Cước vận chuyển / bốc xếp:</span>
              <div className="flex items-center gap-1 w-44">
                <input
                  type="number"
                  min="0"
                  value={shippingFee}
                  onChange={(e) => setShippingFee(parseFloat(e.target.value) || 0)}
                  className="w-full bg-zinc-50 border border-zinc-300 p-1 text-right text-xs font-mono focus:border-brand-500 outline-none"
                />
                <span className="text-zinc-500 text-[11px]">₫</span>
              </div>
            </div>

            <div className="flex justify-between items-center border-t border-zinc-200 pt-2 text-sm font-bold text-zinc-950">
              <span className="uppercase">TỔNG TIỀN ĐƠN HÀNG:</span>
              <span className="text-brand-600 text-base">{formatMoney(total)}</span>
            </div>

            {/* Payment Section */}
            <div className="bg-zinc-50 border border-zinc-200 p-2.5 rounded-sm space-y-2 mt-2">
              <div className="flex justify-between items-center">
                <span className="font-bold text-zinc-800">Khách thanh toán ngay:</span>
                <div className="flex items-center gap-1 w-44">
                  <input
                    type="number"
                    min="0"
                    max={total}
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(parseFloat(e.target.value) || 0)}
                    className="w-full bg-white border border-zinc-300 p-1 text-right text-xs font-mono font-bold text-emerald-700 focus:border-brand-500 outline-none"
                  />
                  <span className="text-zinc-500 text-[11px]">₫</span>
                </div>
              </div>

              <div className="flex justify-between items-center text-[11px]">
                <span className="text-zinc-600">Hình thức thanh toán:</span>
                <div className="flex gap-2">
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="radio"
                      name="payMethod"
                      checked={paymentMethod === 'CASH'}
                      onChange={() => setPaymentMethod('CASH')}
                    />
                    <span>Tiền mặt</span>
                  </label>
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="radio"
                      name="payMethod"
                      checked={paymentMethod === 'TRANSFER'}
                      onChange={() => setPaymentMethod('TRANSFER')}
                    />
                    <span>Chuyển khoản (VietQR)</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-between items-center pt-1 border-t border-zinc-200 text-xs">
                <span className="font-bold text-red-700 uppercase">Còn ghi nợ công trình:</span>
                <span className="font-mono font-bold text-red-700 text-sm">
                  {formatMoney(remainingDebt)}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-3 gap-2 pt-2">
            <button
              disabled={submitting}
              onClick={() => handleSubmitOrder(false)}
              className="py-2.5 px-2 bg-zinc-200 hover:bg-zinc-300 active:bg-zinc-400 text-zinc-800 text-xs font-semibold rounded-sm transition-colors flex items-center justify-center gap-1"
            >
              <Save className="w-3.5 h-3.5" />
              <span>LƯU NHÁP</span>
            </button>

            <button
              disabled={submitting}
              onClick={() => handleSubmitOrder(true, true)}
              className="py-2.5 px-2 bg-brand-600 hover:bg-brand-500 active:bg-brand-700 text-white text-xs font-semibold rounded-sm transition-colors flex items-center justify-center gap-1 border border-brand-500 shadow-sm"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>DUYỆT & IN A4</span>
            </button>

            <button
              disabled={submitting}
              onClick={() => handleSubmitOrder(true, false)}
              className="py-2.5 px-2 bg-zinc-900 hover:bg-zinc-800 active:bg-black text-white text-xs font-semibold rounded-sm transition-colors flex items-center justify-center gap-1 shadow-sm"
            >
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
              <span>XÁC NHẬN & XUẤT</span>
            </button>
          </div>
        </div>
      </div>

      {/* Invoice Print Modal */}
      {printOrder && (
        <InvoicePrintModal
          order={printOrder}
          onClose={() => {
            setPrintOrder(null);
            navigate('/sales-orders');
          }}
        />
      )}
    </div>
  );
};


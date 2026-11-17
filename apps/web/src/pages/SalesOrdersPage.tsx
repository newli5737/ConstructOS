import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Printer,
  Plus,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Truck,
  RotateCcw,
  Eye,
} from 'lucide-react';
import { api, formatMoney } from '../api/client';
import { SalesOrder } from '../types';
import { InvoicePrintModal } from '../components/InvoicePrintModal';

export const SalesOrdersPage: React.FC = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedOrderForPrint, setSelectedOrderForPrint] = useState<SalesOrder | null>(null);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (search) params.q = search;
      if (statusFilter) params.status = statusFilter;
      const res = await api.get('/sales-orders', { params });
      setOrders(res.data || []);
    } catch (err) {
      console.error('Error fetching sales orders', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  const handleConfirmOrder = async (orderId: string) => {
    if (!confirm('Xác nhận duyệt đơn hàng và trừ tồn kho vật tư?')) return;
    try {
      await api.post(`/sales-orders/${orderId}/confirm`);
      alert('Đã duyệt đơn hàng thành công!');
      fetchOrders();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Lỗi khi duyệt đơn');
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    const reason = prompt('Nhập lý do hủy đơn hàng:');
    if (reason === null) return;
    try {
      await api.post(`/sales-orders/${orderId}/cancel`, { reason });
      alert('Đã hủy đơn hàng và hoàn nhập kho/công nợ (nếu có)!');
      fetchOrders();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Lỗi khi hủy đơn');
    }
  };

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-200 pb-3">
        <div>
          <h1 className="text-lg font-bold tracking-tight text-zinc-950 font-mono">
            QUẢN LÝ ĐƠN BÁN HÀNG & XUẤT KHO
          </h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            Danh sách đơn bán lẻ, đơn thợ và công trình · In phiếu A4 · Quản lý xuất kho & giao hàng
          </p>
        </div>

        <button
          onClick={() => navigate('/pos')}
          className="bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold px-3.5 py-1.5 rounded-sm flex items-center gap-1.5 border border-brand-500 shadow-2xs self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>TẠO ĐƠN BÁN MỚI (F2)</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-zinc-200 p-3 rounded-sm shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          <div className="relative min-w-[220px]">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-zinc-400" />
            <input
              type="text"
              placeholder="Tìm theo mã đơn (BH-...), tên khách..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchOrders()}
              className="w-full bg-zinc-50 border border-zinc-300 pl-8 pr-3 py-1.5 rounded-sm text-xs focus:border-brand-500 focus:bg-white outline-none"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-zinc-50 border border-zinc-300 px-2.5 py-1.5 rounded-sm text-xs font-mono outline-none"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="DRAFT">Nháp</option>
            <option value="CONFIRMED">Đã duyệt (Chờ giao)</option>
            <option value="DELIVERED">Đã giao hàng</option>
            <option value="COMPLETED">Hoàn tất</option>
            <option value="CANCELLED">Đã hủy</option>
          </select>
        </div>

        <button
          onClick={fetchOrders}
          className="text-xs bg-zinc-100 hover:bg-zinc-200 border border-zinc-300 px-3 py-1.5 rounded-sm text-zinc-700"
        >
          Tìm kiếm
        </button>
      </div>

      {/* Orders Table */}
      <div className="bg-white border border-zinc-200 rounded-sm shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-zinc-100 text-zinc-700 border-b border-zinc-300 font-mono">
                <th className="p-2.5">Mã đơn</th>
                <th className="p-2.5">Khách hàng & Công trình</th>
                <th className="p-2.5">Ngày lập</th>
                <th className="p-2.5">Hạn thanh toán</th>
                <th className="p-2.5 text-right">Tổng tiền</th>
                <th className="p-2.5 text-right">Đã thu</th>
                <th className="p-2.5 text-right">Còn nợ</th>
                <th className="p-2.5 text-center">Trạng thái</th>
                <th className="p-2.5 text-center">Thanh toán</th>
                <th className="p-2.5 text-center w-28">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {orders.length > 0 ? (
                orders.map((ord) => {
                  const remaining = Math.max(0, Number(ord.total) - Number(ord.paidAmount));
                  return (
                    <tr key={ord.id} className="hover:bg-zinc-50">
                      <td className="p-2.5 font-mono font-bold text-zinc-950">
                        {ord.code}
                      </td>
                      <td className="p-2.5">
                        <div className="font-semibold text-zinc-900">{ord.customer?.name}</div>
                        {ord.site && (
                          <div className="text-[11px] text-zinc-500">
                            Công trình: {ord.site.name}
                          </div>
                        )}
                      </td>
                      <td className="p-2.5 font-mono text-zinc-600">
                        {new Date(ord.orderDate).toLocaleDateString('vi-VN')}
                      </td>
                      <td className="p-2.5 font-mono">
                        {ord.dueDate ? (
                          <span className="text-zinc-700">
                            {new Date(ord.dueDate).toLocaleDateString('vi-VN')}
                          </span>
                        ) : (
                          <span className="text-zinc-400">—</span>
                        )}
                      </td>
                      <td className="p-2.5 text-right font-mono font-bold text-zinc-950">
                        {formatMoney(ord.total)}
                      </td>
                      <td className="p-2.5 text-right font-mono text-emerald-700 font-semibold">
                        {formatMoney(ord.paidAmount)}
                      </td>
                      <td className="p-2.5 text-right font-mono font-bold text-red-700">
                        {formatMoney(remaining)}
                      </td>
                      <td className="p-2.5 text-center">
                        <span
                          className={`inline-block px-1.5 py-0.5 text-[10px] font-mono uppercase border ${
                            ord.status === 'CONFIRMED'
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : ord.status === 'DELIVERED'
                              ? 'bg-purple-50 text-purple-700 border-purple-200'
                              : ord.status === 'COMPLETED'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : ord.status === 'CANCELLED'
                              ? 'bg-red-50 text-red-700 border-red-200'
                              : 'bg-zinc-100 text-zinc-700 border-zinc-300'
                          }`}
                        >
                          {ord.status === 'CONFIRMED'
                            ? 'Đã duyệt'
                            : ord.status === 'DELIVERED'
                            ? 'Đã giao'
                            : ord.status === 'COMPLETED'
                            ? 'Hoàn tất'
                            : ord.status === 'CANCELLED'
                            ? 'Đã hủy'
                            : 'Nháp'}
                        </span>
                      </td>
                      <td className="p-2.5 text-center">
                        <span
                          className={`inline-block px-1.5 py-0.5 text-[10px] font-mono uppercase border ${
                            ord.paymentStatus === 'PAID'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : ord.paymentStatus === 'PARTIAL'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-red-50 text-red-700 border-red-200'
                          }`}
                        >
                          {ord.paymentStatus === 'PAID'
                            ? 'Đủ'
                            : ord.paymentStatus === 'PARTIAL'
                            ? 'Một phần'
                            : 'Chưa thu'}
                        </span>
                      </td>
                      <td className="p-2.5 text-center">
                        <div className="flex items-center justify-center space-x-1">
                          <button
                            onClick={() => setSelectedOrderForPrint(ord)}
                            className="p-1 text-zinc-700 hover:text-brand-600 hover:bg-zinc-200 rounded-sm"
                            title="In hóa đơn A4"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>

                          {ord.status === 'DRAFT' && (
                            <button
                              onClick={() => handleConfirmOrder(ord.id)}
                              className="p-1 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-sm"
                              title="Duyệt đơn hàng"
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {ord.status !== 'CANCELLED' && (
                            <button
                              onClick={() => handleCancelOrder(ord.id)}
                              className="p-1 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-sm"
                              title="Hủy đơn"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-zinc-400">
                    Không tìm thấy đơn bán hàng nào
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoice Print Modal */}
      {selectedOrderForPrint && (
        <InvoicePrintModal
          order={selectedOrderForPrint}
          onClose={() => setSelectedOrderForPrint(null)}
        />
      )}
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Receipt,
  Plus,
  Search,
  Filter,
  Printer,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
} from 'lucide-react';
import { salesService } from '../services/sales.service';
import { formatMoney } from '../api/client';
import { SalesOrder } from '../types';
import { InvoicePrintModal } from '../components/InvoicePrintModal';
import { useToast } from '../context/ToastContext';

export const SalesOrdersPage: React.FC = () => {
  const navigate = useNavigate();
  const { toast, confirmDialog } = useToast();
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedOrderForPrint, setSelectedOrderForPrint] = useState<SalesOrder | null>(null);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (statusFilter) params.status = statusFilter;
      if (search) params.search = search;
      const data = await salesService.getOrders(params);
      setOrders(data);
    } catch (err: any) {
      toast.error('Lỗi khi tải danh sách đơn bán hàng');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  const handleConfirmOrder = (orderId: string, orderCode: string) => {
    confirmDialog({
      title: 'Xác nhận duyệt đơn bán hàng',
      message: `Bạn có chắc chắn muốn duyệt đơn hàng ${orderCode} và thực hiện xuất kho trừ tồn kho vật tư?`,
      confirmText: 'Duyệt & Trừ kho',
      onConfirm: async () => {
        try {
          await salesService.confirmOrder(orderId);
          toast.success(`Đã duyệt đơn hàng ${orderCode} thành công!`);
          fetchOrders();
        } catch (err: any) {
          toast.error(err.response?.data?.message || 'Lỗi khi duyệt đơn hàng');
        }
      },
    });
  };

  const handleCancelOrder = (orderId: string, orderCode: string) => {
    confirmDialog({
      title: 'Hủy đơn bán hàng',
      message: `Xác nhận hủy đơn hàng ${orderCode}? Hệ thống sẽ hoàn nhập tồn kho và công nợ (nếu đơn đã duyệt).`,
      confirmText: 'Hủy đơn hàng',
      isDestructive: true,
      onConfirm: async () => {
        try {
          await salesService.cancelOrder(orderId);
          toast.success(`Đã hủy đơn hàng ${orderCode}!`);
          fetchOrders();
        } catch (err: any) {
          toast.error(err.response?.data?.message || 'Lỗi khi hủy đơn hàng');
        }
      },
    });
  };

  return (
    <div className="p-4 sm:p-6 space-y-4 max-w-7xl mx-auto w-full text-slate-900">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Receipt className="w-5 h-5 text-brand-600" />
            <span>QUẢN LÝ ĐƠN BÁN HÀNG & XUẤT KHO</span>
          </h1>
          <p className="text-xs text-slate-600 mt-0.5 font-medium">
            Danh sách đơn bán lẻ, đơn thợ và công trình · In phiếu A4 · Quản lý xuất kho & giao hàng
          </p>
        </div>

        <button
          onClick={() => navigate('/pos')}
          className="bg-brand-600 hover:bg-brand-700 active:bg-brand-800 text-white text-xs font-bold px-4 py-2 rounded-sm flex items-center gap-2 border border-brand-700 shadow-xs cursor-pointer tracking-wide self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>TẠO ĐƠN BÁN MỚI (F2)</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-slate-300 p-3 rounded-sm shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          <div className="relative min-w-[240px]">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm theo mã đơn (BH-...), tên khách..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchOrders()}
              className="w-full bg-slate-50 border border-slate-300 pl-9 pr-3 py-1.5 rounded-sm text-xs font-medium text-slate-900 focus:border-brand-500 focus:bg-white outline-none"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-300 px-3 py-1.5 rounded-sm text-xs font-bold font-mono text-slate-800 outline-none"
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
          className="text-xs font-bold bg-slate-100 hover:bg-slate-200 border border-slate-300 px-3.5 py-1.5 rounded-sm text-slate-800 cursor-pointer"
        >
          Tìm kiếm
        </button>
      </div>

      {/* Orders Table */}
      <div className="bg-white border border-slate-300 rounded-sm shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-800 border-b border-slate-300 font-bold">
                <th className="p-3 font-mono">Mã đơn</th>
                <th className="p-3">Khách hàng & Công trình</th>
                <th className="p-3">Ngày lập</th>
                <th className="p-3">Hạn thanh toán</th>
                <th className="p-3 text-right">Tổng tiền</th>
                <th className="p-3 text-right">Đã thu</th>
                <th className="p-3 text-right">Còn nợ</th>
                <th className="p-3 text-center">Trạng thái</th>
                <th className="p-3 text-center">Thanh toán</th>
                <th className="p-3 text-center w-28">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {orders.length > 0 ? (
                orders.map((ord) => {
                  const remaining = Math.max(0, Number(ord.total) - Number(ord.paidAmount));
                  return (
                    <tr key={ord.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3 font-mono font-bold text-slate-900">
                        {ord.code}
                      </td>
                      <td className="p-3">
                        <div className="font-bold text-slate-900">{ord.customer?.name}</div>
                        {ord.site && (
                          <div className="text-xs text-slate-500 font-medium">
                            Công trình: {ord.site.name}
                          </div>
                        )}
                      </td>
                      <td className="p-3 font-mono text-slate-600 font-medium">
                        {new Date(ord.orderDate).toLocaleDateString('vi-VN')}
                      </td>
                      <td className="p-3 font-mono">
                        {ord.dueDate ? (
                          <span className="text-slate-700 font-medium">
                            {new Date(ord.dueDate).toLocaleDateString('vi-VN')}
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-slate-900">
                        {formatMoney(ord.total)} đ
                      </td>
                      <td className="p-3 text-right font-mono text-emerald-700 font-bold">
                        {formatMoney(ord.paidAmount)} đ
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-red-600">
                        {formatMoney(remaining)} đ
                      </td>
                      <td className="p-3 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 text-xs font-mono font-bold uppercase border ${
                            ord.status === 'CONFIRMED'
                              ? 'bg-blue-50 text-blue-700 border-blue-300'
                              : ord.status === 'DELIVERED'
                              ? 'bg-purple-50 text-purple-700 border-purple-300'
                              : ord.status === 'COMPLETED'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                              : ord.status === 'CANCELLED'
                              ? 'bg-red-50 text-red-700 border-red-300'
                              : 'bg-slate-100 text-slate-700 border-slate-300'
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
                      <td className="p-3 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 text-xs font-mono font-bold uppercase border ${
                            ord.paymentStatus === 'PAID'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                              : ord.paymentStatus === 'PARTIAL'
                              ? 'bg-amber-50 text-amber-800 border-amber-300'
                              : 'bg-red-50 text-red-800 border-red-300'
                          }`}
                        >
                          {ord.paymentStatus === 'PAID'
                            ? 'Đủ'
                            : ord.paymentStatus === 'PARTIAL'
                            ? 'Một phần'
                            : 'Chưa thu'}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center space-x-1.5">
                          <button
                            onClick={() => setSelectedOrderForPrint(ord)}
                            className="p-1.5 text-slate-700 hover:text-brand-600 hover:bg-slate-100 rounded-sm cursor-pointer"
                            title="In hóa đơn A4"
                          >
                            <Printer className="w-4 h-4" />
                          </button>

                          {ord.status === 'DRAFT' && (
                            <button
                              onClick={() => handleConfirmOrder(ord.id, ord.code)}
                              className="p-1.5 text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 rounded-sm cursor-pointer"
                              title="Duyệt đơn hàng"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                          )}

                          {ord.status !== 'CANCELLED' && (
                            <button
                              onClick={() => handleCancelOrder(ord.id, ord.code)}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-sm cursor-pointer"
                              title="Hủy đơn"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-slate-500 font-medium">
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

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  Receipt,
  AlertTriangle,
  CreditCard,
  Building,
  Package,
  ShoppingCart,
  Truck,
  ArrowUpRight,
  Printer,
  RefreshCw,
} from 'lucide-react';
import { api, formatMoney, formatNumber } from '../api/client';
import { DashboardData, SalesOrder } from '../types';
import { InvoicePrintModal } from '../components/InvoicePrintModal';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedOrderForPrint, setSelectedOrderForPrint] = useState<SalesOrder | null>(null);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await api.get('/reports/dashboard');
      setData(res.data);
    } catch (err) {
      console.error('Error fetching dashboard', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  return (
    <div className="p-5 space-y-5">
      {/* Top Banner / Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-200 pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900 font-mono flex items-center gap-2">
            <span>BẢNG ĐIỀU KHIỂN & CHỈ SỐ KINH DOANH</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          </h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            Cập nhật tình hình bán hàng, xuất nhập kho và dòng tiền công nợ thời gian thực
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={fetchDashboard}
            className="p-1.5 text-zinc-600 hover:text-zinc-900 bg-white border border-zinc-300 rounded-sm hover:bg-zinc-50"
            title="Làm mới dữ liệu"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => navigate('/pos')}
            className="bg-brand-600 hover:bg-brand-500 active:bg-brand-700 text-white text-xs font-semibold px-3 py-1.5 rounded-sm flex items-center gap-1.5 border border-brand-500 shadow-xs"
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>TẠO ĐƠN BÁN (F2)</span>
          </button>
          <button
            onClick={() => navigate('/purchase-orders')}
            className="bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold px-3 py-1.5 rounded-sm flex items-center gap-1.5 border border-zinc-700 shadow-xs"
          >
            <Truck className="w-3.5 h-3.5" />
            <span>NHẬP KHO</span>
          </button>
        </div>
      </div>

      {/* KPI Cards: 4 Industrial Stats with Sharp Corners */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Doanh thu hôm nay */}
        <div className="bg-white border border-zinc-200 p-3.5 rounded-sm shadow-2xs relative overflow-hidden">
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-500 font-semibold">
              Doanh thu hôm nay
            </span>
            <Receipt className="w-4 h-4 text-zinc-400" />
          </div>
          <div className="text-xl font-bold font-mono tracking-tight text-zinc-950 mt-1">
            {formatMoney(data?.todayRevenue || 0)}
          </div>
          <div className="text-[11px] text-zinc-500 mt-2 flex items-center gap-1">
            <span>Tháng này:</span>
            <span className="font-mono font-semibold text-zinc-800">
              {formatMoney(data?.monthRevenue || 0)}
            </span>
          </div>
          <div className="absolute top-0 left-0 w-1 h-full bg-brand-500"></div>
        </div>

        {/* Lợi nhuận gộp tháng */}
        <div className="bg-white border border-zinc-200 p-3.5 rounded-sm shadow-2xs relative overflow-hidden">
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-500 font-semibold">
              Lãi gộp ước tính (Tháng)
            </span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-bold font-mono tracking-tight text-emerald-700 mt-1">
            {formatMoney(data?.monthGrossProfit || 0)}
          </div>
          <div className="text-[11px] text-zinc-500 mt-2">
            Tính theo giá vốn bình quân gia quyền
          </div>
          <div className="absolute top-0 left-0 w-1 h-full bg-emerald-600"></div>
        </div>

        {/* Phải thu khách hàng */}
        <div 
          onClick={() => navigate('/debt')}
          className="bg-white border border-zinc-200 p-3.5 rounded-sm shadow-2xs relative overflow-hidden cursor-pointer hover:border-zinc-300 transition-colors"
        >
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-500 font-semibold">
              Phải thu khách hàng (Nợ)
            </span>
            <CreditCard className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-xl font-bold font-mono tracking-tight text-amber-800 mt-1">
            {formatMoney(data?.totalReceivable || 0)}
          </div>
          <div className="text-[11px] text-zinc-500 mt-2 flex items-center justify-between">
            <span>Phải trả NCC:</span>
            <span className="font-mono font-semibold text-zinc-700">{formatMoney(data?.totalPayable || 0)}</span>
          </div>
          <div className="absolute top-0 left-0 w-1 h-full bg-amber-500"></div>
        </div>

        {/* Tồn kho & Cảnh báo */}
        <div 
          onClick={() => navigate('/inventory')}
          className="bg-white border border-zinc-200 p-3.5 rounded-sm shadow-2xs relative overflow-hidden cursor-pointer hover:border-zinc-300 transition-colors"
        >
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-500 font-semibold">
              Giá trị tồn kho & Cảnh báo
            </span>
            <Package className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-xl font-bold font-mono tracking-tight text-zinc-900 mt-1">
            {formatMoney(data?.totalInventoryValue || 0)}
          </div>
          <div className="text-[11px] mt-2 flex items-center gap-1.5">
            {(data?.lowStockCount || 0) > 0 ? (
              <span className="text-red-700 font-semibold flex items-center gap-1 bg-red-50 border border-red-200 px-1 py-0.5">
                <AlertTriangle className="w-3 h-3" />
                {data?.lowStockCount} mặt hàng dưới mức tối thiểu
              </span>
            ) : (
              <span className="text-emerald-700 font-medium">Tồn kho đủ định mức</span>
            )}
          </div>
          <div className="absolute top-0 left-0 w-1 h-full bg-blue-600"></div>
        </div>
      </div>

      {/* Middle Section: 30-day Revenue Chart & Quick Operational Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Chart Column (2 cols) */}
        <div className="lg:col-span-2 bg-white border border-zinc-200 p-4 rounded-sm shadow-2xs">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-2 mb-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-800 font-mono">
              Biểu đồ doanh thu 30 ngày gần nhất
            </h2>
            <span className="text-[11px] font-mono text-zinc-500">Đơn vị: VNĐ</span>
          </div>

          {/* Bar Visual representation with sharp blocks */}
          <div className="h-56 flex items-end gap-1.5 pt-6 pb-2 px-1 overflow-x-auto">
            {data?.chart30Days && data.chart30Days.length > 0 ? (
              (() => {
                const maxVal = Math.max(...data.chart30Days.map((d) => d.revenue), 1000000);
                return data.chart30Days.map((item, idx) => {
                  const heightPct = Math.max(4, Math.round((item.revenue / maxVal) * 100));
                  return (
                    <div
                      key={idx}
                      className="flex-1 min-w-[20px] flex flex-col items-center group relative cursor-pointer"
                    >
                      {/* Tooltip on hover */}
                      <div className="absolute -top-9 opacity-0 group-hover:opacity-100 transition-opacity bg-zinc-900 text-white text-[10px] font-mono px-2 py-1 rounded-none pointer-events-none whitespace-nowrap z-20 shadow-md">
                        {item.date}: {formatMoney(item.revenue)}
                      </div>
                      <div
                        style={{ height: `${heightPct}%` }}
                        className={`w-full transition-all ${
                          item.revenue > 0
                            ? 'bg-brand-600 group-hover:bg-brand-500'
                            : 'bg-zinc-200'
                        }`}
                      ></div>
                      <span className="text-[9px] font-mono text-zinc-400 mt-1 rotate-45 sm:rotate-0 origin-left">
                        {item.date.split('/')[0]}
                      </span>
                    </div>
                  );
                });
              })()
            ) : (
              <div className="w-full h-full flex items-center justify-center text-zinc-400 text-xs">
                Chưa có dữ liệu biểu đồ
              </div>
            )}
          </div>
        </div>

        {/* Right Info: Operational Shortcuts & Alerts */}
        <div className="bg-white border border-zinc-200 p-4 rounded-sm shadow-2xs space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-800 font-mono border-b border-zinc-100 pb-2">
            Trạng thái vận hành kho bãi
          </h2>

          <div className="space-y-2.5 text-xs">
            <div className="p-2.5 bg-zinc-50 border border-zinc-200 flex justify-between items-center">
              <div>
                <span className="font-semibold text-zinc-800 block">Đơn hàng cần xử lý:</span>
                <span className="text-[11px] text-zinc-500">Chờ xuất bãi hoặc giao hàng</span>
              </div>
              <span className="font-mono font-bold text-base text-brand-600">
                {data?.pendingOrdersCount || 0}
              </span>
            </div>

            <div className="p-2.5 bg-zinc-50 border border-zinc-200 flex justify-between items-center">
              <div>
                <span className="font-semibold text-zinc-800 block">Hàng thiếu định mức:</span>
                <span className="text-[11px] text-zinc-500">Cần lập đơn mua NCC</span>
              </div>
              <span className="font-mono font-bold text-base text-red-600">
                {data?.lowStockCount || 0}
              </span>
            </div>
          </div>

          <div className="pt-2">
            <span className="text-[11px] font-semibold uppercase text-zinc-500 font-mono block mb-2">
              Thao tác nhanh
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => navigate('/pos')}
                className="p-2 text-left bg-zinc-100 hover:bg-zinc-200 border border-zinc-200 text-xs font-medium text-zinc-800 transition-colors"
              >
                + Bán nhanh tại quầy
              </button>
              <button
                onClick={() => navigate('/debt')}
                className="p-2 text-left bg-zinc-100 hover:bg-zinc-200 border border-zinc-200 text-xs font-medium text-zinc-800 transition-colors"
              >
                + Lập phiếu thu tiền
              </button>
              <button
                onClick={() => navigate('/inventory')}
                className="p-2 text-left bg-zinc-100 hover:bg-zinc-200 border border-zinc-200 text-xs font-medium text-zinc-800 transition-colors"
              >
                + Kiểm kê điều chỉnh
              </button>
              <button
                onClick={() => navigate('/customers')}
                className="p-2 text-left bg-zinc-100 hover:bg-zinc-200 border border-zinc-200 text-xs font-medium text-zinc-800 transition-colors"
              >
                + Import DS Khách cũ
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Orders Table */}
      <div className="bg-white border border-zinc-200 rounded-sm shadow-2xs overflow-hidden">
        <div className="p-3 border-b border-zinc-200 flex justify-between items-center bg-zinc-50">
          <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-800 font-mono">
            Đơn bán hàng mới nhất
          </h2>
          <button
            onClick={() => navigate('/sales-orders')}
            className="text-xs text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1"
          >
            <span>Xem toàn bộ danh sách đơn</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-zinc-100 text-zinc-700 border-b border-zinc-200 font-mono">
                <th className="p-2.5 font-semibold">Mã đơn</th>
                <th className="p-2.5 font-semibold">Khách hàng</th>
                <th className="p-2.5 font-semibold">Ngày tạo</th>
                <th className="p-2.5 font-semibold text-right">Tổng tiền</th>
                <th className="p-2.5 font-semibold text-right">Đã thu</th>
                <th className="p-2.5 font-semibold text-center">Trạng thái</th>
                <th className="p-2.5 font-semibold text-center">Thanh toán</th>
                <th className="p-2.5 font-semibold text-center w-16">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {data?.latestOrders && data.latestOrders.length > 0 ? (
                data.latestOrders.map((ord) => {
                  return (
                    <tr key={ord.id} className="hover:bg-zinc-50 transition-colors">
                      <td className="p-2.5 font-mono font-bold text-zinc-900">{ord.code}</td>
                      <td className="p-2.5 font-medium text-zinc-800">{ord.customer?.name}</td>
                      <td className="p-2.5 text-zinc-500 font-mono">
                        {new Date(ord.orderDate).toLocaleDateString('vi-VN')}
                      </td>
                      <td className="p-2.5 text-right font-mono font-bold text-zinc-900">
                        {formatMoney(ord.total)}
                      </td>
                      <td className="p-2.5 text-right font-mono text-zinc-700">
                        {formatMoney(ord.paidAmount)}
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
                            ? 'Đã thanh toán'
                            : ord.paymentStatus === 'PARTIAL'
                            ? 'Trả một phần'
                            : 'Ghi nợ'}
                        </span>
                      </td>
                      <td className="p-2.5 text-center">
                        <button
                          onClick={() => setSelectedOrderForPrint(ord)}
                          className="p-1 text-zinc-600 hover:text-zinc-950 hover:bg-zinc-200 rounded-sm"
                          title="In phiếu bán A4"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="p-6 text-center text-zinc-400">
                    Chưa có đơn hàng nào
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


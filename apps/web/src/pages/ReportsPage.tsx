import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, DollarSign, Award, Calendar, Download } from 'lucide-react';
import { api, formatMoney, formatNumber } from '../api/client';

export const ReportsPage: React.FC = () => {
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [dashboard, setDashboard] = useState<any>(null);
  const [salesOrders, setSalesOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [topRes, dashRes, sRes] = await Promise.all([
        api.get('/reports/top-products'),
        api.get('/reports/dashboard'),
        api.get('/reports/sales'),
      ]);
      setTopProducts(topRes.data || []);
      setDashboard(dashRes.data || null);
      setSalesOrders(sRes.data || []);
    } catch (err) {
      console.error('Error fetching reports', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-200 pb-3">
        <div>
          <h1 className="text-lg font-bold tracking-tight text-zinc-950 font-mono">
            BÁO CÁO DOANH THU & LỢI NHUẬN GỘP KINH DOANH
          </h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            Phân tích lãi gộp theo giá vốn bình quân · Top sản phẩm bán chạy nhất theo doanh số
          </p>
        </div>
      </div>

      {/* KPI Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white border border-zinc-200 p-4 rounded-sm shadow-2xs">
          <span className="text-[11px] font-mono uppercase text-zinc-500 font-semibold block">
            Doanh thu lũy kế tháng
          </span>
          <div className="text-xl font-bold font-mono text-zinc-950 mt-1">
            {formatMoney(dashboard?.monthRevenue || 0)}
          </div>
          <p className="text-[11px] text-zinc-500 mt-1">Tổng giá trị đơn hàng đã xác nhận</p>
        </div>

        <div className="bg-white border border-zinc-200 p-4 rounded-sm shadow-2xs">
          <span className="text-[11px] font-mono uppercase text-zinc-500 font-semibold block">
            Lợi nhuận gộp ước tính
          </span>
          <div className="text-xl font-bold font-mono text-emerald-700 mt-1">
            {formatMoney(dashboard?.monthGrossProfit || 0)}
          </div>
          <p className="text-[11px] text-zinc-500 mt-1">
            Biên lợi nhuận gộp:{' '}
            <strong className="text-emerald-800">
              {dashboard?.monthRevenue > 0
                ? ((dashboard.monthGrossProfit / dashboard.monthRevenue) * 100).toFixed(1)
                : 0}%
            </strong>
          </p>
        </div>

        <div className="bg-white border border-zinc-200 p-4 rounded-sm shadow-2xs">
          <span className="text-[11px] font-mono uppercase text-zinc-500 font-semibold block">
            Tổng giá trị tồn kho hiện có
          </span>
          <div className="text-xl font-bold font-mono text-brand-600 mt-1">
            {formatMoney(dashboard?.totalInventoryValue || 0)}
          </div>
          <p className="text-[11px] text-zinc-500 mt-1">Tính theo giá vốn bình quân các kho</p>
        </div>
      </div>

      {/* Top Selling Products */}
      <div className="bg-white border border-zinc-200 rounded-sm shadow-2xs overflow-hidden">
        <div className="p-3 border-b border-zinc-200 bg-zinc-50 flex justify-between items-center">
          <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-800 font-mono flex items-center gap-1.5">
            <Award className="w-4 h-4 text-amber-500" />
            <span>Top sản phẩm vật liệu bán chạy nhất</span>
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-zinc-100 text-zinc-700 border-b border-zinc-300 font-mono">
                <th className="p-2.5 text-center w-12">Hạng</th>
                <th className="p-2.5">Mã SKU</th>
                <th className="p-2.5">Tên vật liệu</th>
                <th className="p-2.5 text-center">ĐVT</th>
                <th className="p-2.5 text-right">Tổng sản lượng bán</th>
                <th className="p-2.5 text-right">Doanh số đóng góp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 font-mono">
              {topProducts.length > 0 ? (
                topProducts.map((p, idx) => (
                  <tr key={idx} className="hover:bg-zinc-50">
                    <td className="p-2.5 text-center font-bold">
                      <span className={`inline-block w-5 h-5 rounded-none text-center leading-5 text-[11px] ${
                        idx === 0 ? 'bg-amber-400 text-amber-950 font-bold' : idx === 1 ? 'bg-zinc-300 text-zinc-800' : idx === 2 ? 'bg-amber-700 text-white' : 'text-zinc-600'
                      }`}>
                        {idx + 1}
                      </span>
                    </td>
                    <td className="p-2.5 font-bold text-zinc-950">{p.sku}</td>
                    <td className="p-2.5 font-sans font-semibold text-zinc-900">{p.name}</td>
                    <td className="p-2.5 text-center text-zinc-600">{p.baseUnit}</td>
                    <td className="p-2.5 text-right font-bold text-zinc-900">
                      {formatNumber(p.totalQuantity)}
                    </td>
                    <td className="p-2.5 text-right font-bold text-brand-700">
                      {formatMoney(p.totalRevenue)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-zinc-400 font-sans">
                    Chưa có dữ liệu giao dịch bán hàng
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};


import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  AlertCircle,
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  Search,
  Calendar,
  X,
  CheckCircle,
} from 'lucide-react';
import { api, formatMoney } from '../api/client';
import { Customer, Supplier, AgingReport } from '../types';

export const DebtPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'aging' | 'customers' | 'suppliers' | 'payments'>('aging');
  const [agingData, setAgingData] = useState<AgingReport | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal lập phiếu thu/chi
  const [showPayModal, setShowPayModal] = useState(false);
  const [payType, setPayType] = useState<'RECEIPT' | 'PAYMENT'>('RECEIPT');
  const [payPartnerType, setPayPartnerType] = useState<'CUSTOMER' | 'SUPPLIER'>('CUSTOMER');
  const [payPartnerId, setPayPartnerId] = useState('');
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payMethod, setPayMethod] = useState<'CASH' | 'TRANSFER'>('CASH');
  const [payNote, setPayNote] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [agingRes, cRes, sRes, pRes] = await Promise.all([
        api.get('/debts/aging'),
        api.get('/debts/customers'),
        api.get('/debts/suppliers'),
        api.get('/payments'),
      ]);
      setAgingData(agingRes.data);
      setCustomers(cRes.data || []);
      setSuppliers(sRes.data || []);
      setPayments(pRes.data || []);

      if (cRes.data?.length > 0) setPayPartnerId(cRes.data[0].id);
    } catch (err) {
      console.error('Error fetching debt data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openPaymentModal = (type: 'RECEIPT' | 'PAYMENT', partnerType: 'CUSTOMER' | 'SUPPLIER', partnerId?: string) => {
    setPayType(type);
    setPayPartnerType(partnerType);
    if (partnerId) {
      setPayPartnerId(partnerId);
    } else {
      setPayPartnerId(partnerType === 'CUSTOMER' ? customers[0]?.id || '' : suppliers[0]?.id || '');
    }
    setPayAmount(0);
    setPayNote('');
    setShowPayModal(true);
  };

  const handleCreatePayment = async () => {
    if (!payPartnerId || payAmount <= 0) {
      alert('Vui lòng chọn đối tác và nhập số tiền lớn hơn 0');
      return;
    }

    try {
      await api.post('/payments', {
        type: payType,
        partnerType: payPartnerType,
        partnerId: payPartnerId,
        amount: payAmount,
        method: payMethod,
        note: payNote,
      });
      alert(
        payType === 'RECEIPT'
          ? 'Đã lập phiếu thu thành công và phân bổ công nợ FIFO!'
          : 'Đã lập phiếu chi thành công!',
      );
      setShowPayModal(false);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Lỗi khi lập phiếu');
    }
  };

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-200 pb-3">
        <div>
          <h1 className="text-lg font-bold tracking-tight text-zinc-950 font-mono">
            QUẢN LÝ CÔNG NỢ & PHIẾU THU CHI (FIFO)
          </h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            Báo cáo tuổi nợ 4 cấp độ · Đối trừ tự động đơn cũ trước (FIFO) · Sổ quỹ tiền mặt & chuyển khoản
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => openPaymentModal('RECEIPT', 'CUSTOMER')}
            className="bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-semibold px-3 py-1.5 rounded-sm flex items-center gap-1.5 shadow-2xs"
          >
            <ArrowDownLeft className="w-3.5 h-3.5" />
            <span>LẬP PHIẾU THU TIỀN KHÁCH</span>
          </button>
          <button
            onClick={() => openPaymentModal('PAYMENT', 'SUPPLIER')}
            className="bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold px-3 py-1.5 rounded-sm flex items-center gap-1.5 border border-zinc-700 shadow-2xs"
          >
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>LẬP PHIẾU CHI TRẢ NCC</span>
          </button>
        </div>
      </div>

      {/* Aging 4-bucket Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white border border-zinc-200 p-3 rounded-sm shadow-2xs border-l-4 border-l-emerald-500">
          <span className="text-[11px] font-mono uppercase text-zinc-500 font-semibold block">
            Trong hạn (0 — 30 ngày)
          </span>
          <div className="text-lg font-bold font-mono text-zinc-900 mt-1">
            {formatMoney(agingData?.summary.under30 || 0)}
          </div>
          <p className="text-[10px] text-zinc-400 mt-1">Các khoản nợ mới phát sinh</p>
        </div>

        <div className="bg-white border border-zinc-200 p-3 rounded-sm shadow-2xs border-l-4 border-l-blue-500">
          <span className="text-[11px] font-mono uppercase text-zinc-500 font-semibold block">
            Từ 31 — 60 ngày
          </span>
          <div className="text-lg font-bold font-mono text-zinc-900 mt-1">
            {formatMoney(agingData?.summary.days31to60 || 0)}
          </div>
          <p className="text-[10px] text-zinc-400 mt-1">Cần nhắc nhở công trình</p>
        </div>

        <div className="bg-white border border-zinc-200 p-3 rounded-sm shadow-2xs border-l-4 border-l-amber-500">
          <span className="text-[11px] font-mono uppercase text-zinc-500 font-semibold block">
            Từ 61 — 90 ngày
          </span>
          <div className="text-lg font-bold font-mono text-amber-700 mt-1">
            {formatMoney(agingData?.summary.days61to90 || 0)}
          </div>
          <p className="text-[10px] text-amber-600 mt-1">Nguy cơ chậm luân chuyển vốn</p>
        </div>

        <div className="bg-white border border-zinc-200 p-3 rounded-sm shadow-2xs border-l-4 border-l-red-600">
          <span className="text-[11px] font-mono uppercase text-red-600 font-bold block">
            Quá hạn nghiêm trọng (&gt; 90 ngày)
          </span>
          <div className="text-lg font-bold font-mono text-red-700 mt-1">
            {formatMoney(agingData?.summary.over90 || 0)}
          </div>
          <p className="text-[10px] text-red-600 mt-1 font-semibold">Tạm dừng xuất chịu công trình mới</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-zinc-200 gap-2">
        <button
          onClick={() => setActiveTab('aging')}
          className={`pb-2 px-3 text-xs font-bold font-mono transition-colors border-b-2 -mb-[1px] ${
            activeTab === 'aging'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-zinc-500 hover:text-zinc-800'
          }`}
        >
          Phân tích tuổi nợ khách hàng ({agingData?.customers.length || 0})
        </button>
        <button
          onClick={() => setActiveTab('customers')}
          className={`pb-2 px-3 text-xs font-bold font-mono transition-colors border-b-2 -mb-[1px] ${
            activeTab === 'customers'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-zinc-500 hover:text-zinc-800'
          }`}
        >
          Công nợ phải thu (KH) ({customers.length})
        </button>
        <button
          onClick={() => setActiveTab('suppliers')}
          className={`pb-2 px-3 text-xs font-bold font-mono transition-colors border-b-2 -mb-[1px] ${
            activeTab === 'suppliers'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-zinc-500 hover:text-zinc-800'
          }`}
        >
          Công nợ phải trả (NCC) ({suppliers.length})
        </button>
        <button
          onClick={() => setActiveTab('payments')}
          className={`pb-2 px-3 text-xs font-bold font-mono transition-colors border-b-2 -mb-[1px] ${
            activeTab === 'payments'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-zinc-500 hover:text-zinc-800'
          }`}
        >
          Lịch sử thu / chi ({payments.length})
        </button>
      </div>

      {/* Content depending on tab */}
      <div className="bg-white border border-zinc-200 rounded-sm shadow-2xs overflow-hidden">
        {activeTab === 'aging' && (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-zinc-100 text-zinc-700 border-b border-zinc-300 font-mono">
                  <th className="p-2.5">Mã KH</th>
                  <th className="p-2.5">Tên khách hàng / Nhà thầu</th>
                  <th className="p-2.5 text-right">Tổng dư nợ</th>
                  <th className="p-2.5 text-right">Hạn mức</th>
                  <th className="p-2.5 text-right font-medium text-emerald-800">0 - 30 ngày</th>
                  <th className="p-2.5 text-right font-medium text-blue-800">31 - 60 ngày</th>
                  <th className="p-2.5 text-right font-medium text-amber-800">61 - 90 ngày</th>
                  <th className="p-2.5 text-right font-bold text-red-700">&gt; 90 ngày</th>
                  <th className="p-2.5 text-center w-24">Thu tiền</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 font-mono">
                {agingData?.customers && agingData.customers.length > 0 ? (
                  agingData.customers.map((c) => (
                    <tr key={c.customerId} className="hover:bg-zinc-50">
                      <td className="p-2.5 font-bold text-zinc-950">{c.customerCode}</td>
                      <td className="p-2.5 font-sans font-semibold text-zinc-900">{c.customerName}</td>
                      <td className="p-2.5 text-right font-bold text-zinc-950">{formatMoney(c.totalDebt)}</td>
                      <td className="p-2.5 text-right text-zinc-500">{formatMoney(c.creditLimit)}</td>
                      <td className="p-2.5 text-right text-emerald-700">{formatMoney(c.under30)}</td>
                      <td className="p-2.5 text-right text-blue-700">{formatMoney(c.days31to60)}</td>
                      <td className="p-2.5 text-right text-amber-700">{formatMoney(c.days61to90)}</td>
                      <td className="p-2.5 text-right font-bold text-red-600 bg-red-50/50">
                        {formatMoney(c.over90)}
                      </td>
                      <td className="p-2.5 text-center">
                        <button
                          onClick={() => openPaymentModal('RECEIPT', 'CUSTOMER', c.customerId)}
                          className="px-2 py-0.5 bg-emerald-700 hover:bg-emerald-600 text-white text-[11px] font-sans font-semibold rounded-sm"
                        >
                          Thu tiền
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-zinc-400">
                      Không có công nợ quá hạn
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'customers' && (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-zinc-100 text-zinc-700 border-b border-zinc-300 font-mono">
                  <th className="p-2.5">Mã KH</th>
                  <th className="p-2.5">Tên khách hàng</th>
                  <th className="p-2.5">Số điện thoại</th>
                  <th className="p-2.5">Nhóm</th>
                  <th className="p-2.5 text-right">Dư nợ hiện tại</th>
                  <th className="p-2.5 text-right">Hạn mức nợ</th>
                  <th className="p-2.5 text-center w-24">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                {customers.map((c) => (
                  <tr key={c.id} className="hover:bg-zinc-50">
                    <td className="p-2.5 font-mono font-bold text-zinc-950">{c.code}</td>
                    <td className="p-2.5 font-semibold text-zinc-900">{c.name}</td>
                    <td className="p-2.5 font-mono text-zinc-600">{c.phone || '—'}</td>
                    <td className="p-2.5 text-zinc-600">{c.group?.name || 'Khách lẻ'}</td>
                    <td className="p-2.5 text-right font-mono font-bold text-red-700">
                      {formatMoney(c.currentDebt)}
                    </td>
                    <td className="p-2.5 text-right font-mono text-zinc-500">
                      {formatMoney(c.creditLimit)}
                    </td>
                    <td className="p-2.5 text-center">
                      <button
                        onClick={() => openPaymentModal('RECEIPT', 'CUSTOMER', c.id)}
                        className="px-2 py-0.5 bg-emerald-700 hover:bg-emerald-600 text-white text-[11px] font-semibold rounded-sm"
                      >
                        Thu nợ
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'suppliers' && (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-zinc-100 text-zinc-700 border-b border-zinc-300 font-mono">
                  <th className="p-2.5">Mã NCC</th>
                  <th className="p-2.5">Nhà cung cấp</th>
                  <th className="p-2.5">Số điện thoại</th>
                  <th className="p-2.5">Số ngày được nợ</th>
                  <th className="p-2.5 text-right">Dư nợ phải trả NCC</th>
                  <th className="p-2.5 text-center w-24">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                {suppliers.map((s) => (
                  <tr key={s.id} className="hover:bg-zinc-50">
                    <td className="p-2.5 font-mono font-bold text-zinc-950">{s.code}</td>
                    <td className="p-2.5 font-semibold text-zinc-900">{s.name}</td>
                    <td className="p-2.5 font-mono text-zinc-600">{s.phone || '—'}</td>
                    <td className="p-2.5 font-mono text-zinc-600">{s.paymentTermDays} ngày</td>
                    <td className="p-2.5 text-right font-mono font-bold text-zinc-950">
                      {formatMoney(s.currentDebt)}
                    </td>
                    <td className="p-2.5 text-center">
                      <button
                        onClick={() => openPaymentModal('PAYMENT', 'SUPPLIER', s.id)}
                        className="px-2 py-0.5 bg-zinc-800 hover:bg-zinc-700 text-white text-[11px] font-semibold rounded-sm"
                      >
                        Trả tiền
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'payments' && (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-zinc-100 text-zinc-700 border-b border-zinc-300 font-mono">
                  <th className="p-2.5">Mã chứng từ</th>
                  <th className="p-2.5">Loại</th>
                  <th className="p-2.5">Đối tác</th>
                  <th className="p-2.5 text-right">Số tiền</th>
                  <th className="p-2.5 text-center">Hình thức</th>
                  <th className="p-2.5">Ngày nộp</th>
                  <th className="p-2.5">Nội dung / Ghi chú</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-zinc-50">
                    <td className="p-2.5 font-mono font-bold text-zinc-950">{p.code}</td>
                    <td className="p-2.5">
                      <span
                        className={`px-1.5 py-0.5 text-[10px] font-mono uppercase font-bold border ${
                          p.type === 'RECEIPT'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-zinc-100 text-zinc-800 border-zinc-300'
                        }`}
                      >
                        {p.type === 'RECEIPT' ? 'Phiếu thu' : 'Phiếu chi'}
                      </span>
                    </td>
                    <td className="p-2.5 font-mono text-zinc-600">{p.partnerType}</td>
                    <td className="p-2.5 text-right font-mono font-bold text-zinc-950">
                      {formatMoney(p.amount)}
                    </td>
                    <td className="p-2.5 text-center font-mono text-[11px]">
                      {p.method === 'CASH' ? 'Tiền mặt' : 'Chuyển khoản'}
                    </td>
                    <td className="p-2.5 font-mono text-zinc-600">
                      {new Date(p.paidAt).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="p-2.5 text-zinc-600">{p.note || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Lập Phiếu Thu / Chi */}
      {showPayModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white border border-zinc-300 w-full max-w-md p-5 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-zinc-200 pb-2">
              <h3 className="text-sm font-bold uppercase font-mono text-zinc-900">
                {payType === 'RECEIPT' ? 'LẬP PHIẾU THU TIỀN KHÁCH HÀNG' : 'LẬP PHIẾU CHI TRẢ NHÀ CUNG CẤP'}
              </h3>
              <button onClick={() => setShowPayModal(false)}>
                <X className="w-4 h-4 text-zinc-500" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold block mb-1">
                  {payPartnerType === 'CUSTOMER' ? 'Khách hàng *' : 'Nhà cung cấp *'}
                </label>
                <select
                  value={payPartnerId}
                  onChange={(e) => setPayPartnerId(e.target.value)}
                  className="w-full border border-zinc-300 p-2 text-xs bg-zinc-50 outline-none"
                >
                  {payPartnerType === 'CUSTOMER'
                    ? customers.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.code} - {c.name} (Nợ: {formatMoney(c.currentDebt)})
                        </option>
                      ))
                    : suppliers.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.code} - {s.name} (Nợ: {formatMoney(s.currentDebt)})
                        </option>
                      ))}
                </select>
              </div>

              <div>
                <label className="font-semibold block mb-1">Số tiền thanh toán (VNĐ) *</label>
                <input
                  type="number"
                  min="1000"
                  value={payAmount}
                  onChange={(e) => setPayAmount(parseFloat(e.target.value) || 0)}
                  className="w-full border border-zinc-300 p-2 text-xs font-mono font-bold text-emerald-700 outline-none"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">Hình thức thanh toán</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="mMethod"
                      checked={payMethod === 'CASH'}
                      onChange={() => setPayMethod('CASH')}
                    />
                    <span>Tiền mặt tại quầy</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="mMethod"
                      checked={payMethod === 'TRANSFER'}
                      onChange={() => setPayMethod('TRANSFER')}
                    />
                    <span>Chuyển khoản (VietQR / Ngân hàng)</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="font-semibold block mb-1">Nội dung thu / chi</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Khách thanh toán nợ đợt 1 công trình Louis City..."
                  value={payNote}
                  onChange={(e) => setPayNote(e.target.value)}
                  className="w-full border border-zinc-300 p-2 text-xs outline-none"
                />
              </div>

              <div className="p-2.5 bg-blue-50 border border-blue-200 text-[11px] text-blue-900">
                <strong>Ghi chú nghiệp vụ FIFO:</strong> Số tiền thu sẽ được hệ thống tự động cấn trừ vào các đơn bán hàng hoặc hóa đơn cũ nhất của khách hàng trước.
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t border-zinc-200">
              <button
                onClick={() => setShowPayModal(false)}
                className="px-3 py-1.5 text-xs border border-zinc-300"
              >
                Hủy
              </button>
              <button
                onClick={handleCreatePayment}
                className="px-4 py-1.5 text-xs bg-emerald-700 hover:bg-emerald-600 text-white font-semibold"
              >
                XÁC NHẬN THU TIỀN
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

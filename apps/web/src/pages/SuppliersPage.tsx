import React, { useState, useEffect } from 'react';
import { Building2, Plus, Search, Phone, MapPin, X } from 'lucide-react';
import { api, formatMoney } from '../api/client';
import { Supplier } from '../types';
import { useToast } from '../context/ToastContext';

export const SuppliersPage: React.FC = () => {
  const { toast } = useToast();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [taxCode, setTaxCode] = useState('');
  const [paymentTermDays, setPaymentTermDays] = useState(30);

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/suppliers', { params: { q: search } });
      setSuppliers(res.data || []);
    } catch (err) {
      console.error('Error fetching suppliers', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const handleCreateSupplier = async () => {
    if (!name) {
      toast.warning('Vui lòng nhập tên nhà cung cấp');
      return;
    }
    try {
      await api.post('/suppliers', {
        name,
        phone,
        address,
        taxCode,
        paymentTermDays,
      });
      toast.success('Thêm nhà cung cấp thành công!');
      setShowModal(false);
      setName('');
      setPhone('');
      setAddress('');
      setTaxCode('');
      fetchSuppliers();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Lỗi khi thêm NCC');
    }
  };

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-200 pb-3">
        <div>
          <h1 className="text-lg font-bold tracking-tight text-zinc-950 font-mono">
            HỒ SƠ NHÀ CUNG CẤP & ĐIỀU KHOẢN THANH TOÁN
          </h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            Nhà máy sản xuất xi măng, tập đoàn thép, bến bãi cát sỏi và phụ kiện
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold px-3.5 py-1.5 rounded-sm flex items-center gap-1.5 border border-brand-500 shadow-2xs self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>THÊM NHÀ CUNG CẤP MỚI</span>
        </button>
      </div>

      {/* Filter */}
      <div className="bg-white border border-zinc-200 p-3 rounded-sm shadow-2xs flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-zinc-400" />
          <input
            type="text"
            placeholder="Tìm theo tên NCC, SĐT, mã..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchSuppliers()}
            className="w-full bg-zinc-50 border border-zinc-300 pl-8 pr-3 py-1.5 rounded-sm text-xs outline-none"
          />
        </div>
        <button
          onClick={fetchSuppliers}
          className="bg-zinc-100 hover:bg-zinc-200 border border-zinc-300 px-3 py-1.5 rounded-sm text-xs font-medium"
        >
          Tìm kiếm
        </button>
      </div>

      {/* Table */}
      <div className="bg-white border border-zinc-200 rounded-sm shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-zinc-100 text-zinc-700 border-b border-zinc-300 font-mono">
                <th className="p-2.5">Mã NCC</th>
                <th className="p-2.5">Tên nhà cung cấp / Nhà máy</th>
                <th className="p-2.5">Điện thoại</th>
                <th className="p-2.5">Mã số thuế</th>
                <th className="p-2.5">Địa chỉ</th>
                <th className="p-2.5 text-center">Hạn nợ (Ngày)</th>
                <th className="p-2.5 text-right">Dư nợ phải trả NCC</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {suppliers.map((s) => (
                <tr key={s.id} className="hover:bg-zinc-50">
                  <td className="p-2.5 font-mono font-bold text-zinc-950">{s.code}</td>
                  <td className="p-2.5 font-semibold text-zinc-900">{s.name}</td>
                  <td className="p-2.5 font-mono text-zinc-600">{s.phone || '—'}</td>
                  <td className="p-2.5 font-mono text-zinc-600">{s.taxCode || '—'}</td>
                  <td className="p-2.5 text-zinc-600">{s.address || '—'}</td>
                  <td className="p-2.5 text-center font-mono">{s.paymentTermDays}</td>
                  <td className="p-2.5 text-right font-mono font-bold text-zinc-950">
                    {formatMoney(s.currentDebt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Thêm NCC */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white border border-zinc-300 w-full max-w-md p-5 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-zinc-200 pb-2">
              <h3 className="text-sm font-bold uppercase font-mono">THÊM NHÀ CUNG CẤP MỚI</h3>
              <button onClick={() => setShowModal(false)}><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold block mb-1">Tên nhà cung cấp / Nhà máy *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border border-zinc-300 p-2 text-xs"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1">Điện thoại</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full border border-zinc-300 p-2 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1">Mã số thuế</label>
                  <input
                    type="text"
                    value={taxCode}
                    onChange={(e) => setTaxCode(e.target.value)}
                    className="w-full border border-zinc-300 p-2 text-xs font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="font-semibold block mb-1">Địa chỉ</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full border border-zinc-300 p-2 text-xs"
                />
              </div>
              <div>
                <label className="font-semibold block mb-1">Số ngày được nợ (Hạn thanh toán)</label>
                <input
                  type="number"
                  value={paymentTermDays}
                  onChange={(e) => setPaymentTermDays(parseInt(e.target.value, 10) || 30)}
                  className="w-full border border-zinc-300 p-2 text-xs font-mono"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2 pt-2 border-t border-zinc-200">
              <button onClick={() => setShowModal(false)} className="px-3 py-1.5 text-xs border border-zinc-300">Hủy</button>
              <button onClick={handleCreateSupplier} className="px-4 py-1.5 text-xs bg-brand-600 text-white font-semibold">LƯU NHÀ CUNG CẤP</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


import React, { useState, useEffect } from 'react';
import { Users, Plus, Upload, Search, Building, Phone, MapPin, X, CheckCircle } from 'lucide-react';
import { api, formatMoney } from '../api/client';
import { Customer } from '../types';

export const CustomersPage: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);

  // Create form
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [groupId, setGroupId] = useState('');
  const [creditLimit, setCreditLimit] = useState(50000000);
  const [siteName, setSiteName] = useState('');
  const [siteAddress, setSiteAddress] = useState('');

  // Import preview data
  const [importRows, setImportRows] = useState<any[]>([
    { name: 'Công ty XD Phương Đông', phone: '0981234567', address: 'KĐT Văn Quán, Hà Đông', creditLimit: 100000000, initialDebt: 25000000, note: 'Khách nhà thầu cũ chuyển qua' },
    { name: 'Đội Thợ Anh Thắng', phone: '0977889911', address: 'Quốc Oai, Hà Nội', creditLimit: 40000000, initialDebt: 8500000, note: 'Dư nợ đợt xây nhà dân' },
    { name: 'Anh Đoàn Văn Hùng', phone: '0912001122', address: 'Thạch Thất, Hà Nội', creditLimit: 20000000, initialDebt: 0, note: 'Khách xây nhà phố' },
  ]);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const [cRes, gRes] = await Promise.all([
        api.get('/customers', { params: { q: search } }),
        api.get('/customer-groups'),
      ]);
      setCustomers(cRes.data || []);
      setGroups(gRes.data || []);
      if (gRes.data?.length > 0) setGroupId(gRes.data[0].id);
    } catch (err) {
      console.error('Error fetching customers', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleCreateCustomer = async () => {
    if (!name) {
      alert('Vui lòng nhập tên khách hàng');
      return;
    }
    try {
      const payload: any = {
        name,
        phone,
        address,
        groupId,
        creditLimit,
      };
      if (siteName) {
        payload.sites = [{ name: siteName, address: siteAddress || address }];
      }
      await api.post('/customers', payload);
      alert('Thêm khách hàng thành công!');
      setShowCreateModal(false);
      setName('');
      setPhone('');
      setAddress('');
      setSiteName('');
      setSiteAddress('');
      fetchCustomers();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Lỗi khi thêm khách hàng');
    }
  };

  const handleExecuteImport = async () => {
    try {
      await api.post('/customers/import', { items: importRows });
      alert(`Đã import thành công ${importRows.length} khách hàng kèm số dư nợ đầu kỳ!`);
      setShowImportModal(false);
      fetchCustomers();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Lỗi khi import Excel');
    }
  };

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-200 pb-3">
        <div>
          <h1 className="text-lg font-bold tracking-tight text-zinc-950 font-mono">
            HỒ SƠ KHÁCH HÀNG & CÔNG TRÌNH THI CÔNG
          </h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            Quản lý nhà thầu, thợ xây, đại lý và chủ nhà dân · Hạn mức công nợ · Nhập Excel hàng loạt
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowImportModal(true)}
            className="bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold px-3 py-1.5 rounded-sm flex items-center gap-1.5 border border-zinc-700 shadow-2xs"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>NHẬP TỪ EXCEL (KÈM NỢ ĐẦU KỲ)</span>
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold px-3 py-1.5 rounded-sm flex items-center gap-1.5 border border-brand-500 shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>THÊM KHÁCH HÀNG MỚI</span>
          </button>
        </div>
      </div>

      {/* Filter */}
      <div className="bg-white border border-zinc-200 p-3 rounded-sm shadow-2xs flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-zinc-400" />
          <input
            type="text"
            placeholder="Tìm theo tên khách, SĐT, mã KH..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchCustomers()}
            className="w-full bg-zinc-50 border border-zinc-300 pl-8 pr-3 py-1.5 rounded-sm text-xs outline-none"
          />
        </div>
        <button
          onClick={fetchCustomers}
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
                <th className="p-2.5">Mã KH</th>
                <th className="p-2.5">Tên khách hàng / Nhà thầu</th>
                <th className="p-2.5">Số điện thoại</th>
                <th className="p-2.5">Địa chỉ giao dịch</th>
                <th className="p-2.5">Nhóm & Bảng giá</th>
                <th className="p-2.5 text-right">Dư nợ hiện tại</th>
                <th className="p-2.5 text-right">Hạn mức nợ</th>
                <th className="p-2.5">Công trình thi công</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {customers.map((c) => (
                <tr key={c.id} className="hover:bg-zinc-50">
                  <td className="p-2.5 font-mono font-bold text-zinc-950">{c.code}</td>
                  <td className="p-2.5 font-semibold text-zinc-900">{c.name}</td>
                  <td className="p-2.5 font-mono text-zinc-600">{c.phone || '—'}</td>
                  <td className="p-2.5 text-zinc-600">{c.address || '—'}</td>
                  <td className="p-2.5">
                    <span className="font-mono text-[11px] bg-zinc-100 border border-zinc-200 px-1 py-0.5">
                      {c.group?.name || 'Khách lẻ'}
                    </span>
                  </td>
                  <td className="p-2.5 text-right font-mono font-bold text-red-700">
                    {formatMoney(c.currentDebt)}
                  </td>
                  <td className="p-2.5 text-right font-mono text-zinc-600">
                    {formatMoney(c.creditLimit)}
                  </td>
                  <td className="p-2.5">
                    {c.sites && c.sites.length > 0 ? (
                      <div className="space-y-0.5">
                        {c.sites.map((s) => (
                          <div key={s.id} className="text-[11px] text-zinc-700 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-brand-500"></span>
                            <span>{s.name} ({s.address})</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-zinc-400 text-[11px]">Chưa đăng ký công trình</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Thêm KH mới */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white border border-zinc-300 w-full max-w-lg p-5 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-zinc-200 pb-2">
              <h3 className="text-sm font-bold uppercase font-mono">THÊM KHÁCH HÀNG MỚI</h3>
              <button onClick={() => setShowCreateModal(false)}><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold block mb-1">Tên khách hàng / Nhà thầu / Công ty *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border border-zinc-300 p-2 text-xs"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1">Số điện thoại</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full border border-zinc-300 p-2 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1">Nhóm khách hàng (Bảng giá)</label>
                  <select
                    value={groupId}
                    onChange={(e) => setGroupId(e.target.value)}
                    className="w-full border border-zinc-300 p-2 text-xs"
                  >
                    {groups.map((g) => (
                      <option key={g.id} value={g.id}>{g.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="font-semibold block mb-1">Địa chỉ giao dịch</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full border border-zinc-300 p-2 text-xs"
                />
              </div>
              <div>
                <label className="font-semibold block mb-1">Hạn mức nợ cho phép (VNĐ)</label>
                <input
                  type="number"
                  value={creditLimit}
                  onChange={(e) => setCreditLimit(parseFloat(e.target.value) || 0)}
                  className="w-full border border-zinc-300 p-2 text-xs font-mono font-bold"
                />
              </div>
              <div className="p-3 bg-zinc-50 border border-zinc-200 space-y-2">
                <span className="font-bold uppercase text-[11px] text-zinc-700 block font-mono">
                  Công trình đang thi công (Nếu có)
                </span>
                <input
                  type="text"
                  placeholder="Tên công trình (VD: Biệt thự Louis City B4-12)"
                  value={siteName}
                  onChange={(e) => setSiteName(e.target.value)}
                  className="w-full border border-zinc-300 p-1.5 text-xs bg-white"
                />
                <input
                  type="text"
                  placeholder="Địa chỉ giao vật tư công trình"
                  value={siteAddress}
                  onChange={(e) => setSiteAddress(e.target.value)}
                  className="w-full border border-zinc-300 p-1.5 text-xs bg-white"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2 pt-2 border-t border-zinc-200">
              <button onClick={() => setShowCreateModal(false)} className="px-3 py-1.5 text-xs border border-zinc-300">Hủy</button>
              <button onClick={handleCreateCustomer} className="px-4 py-1.5 text-xs bg-brand-600 text-white font-semibold">LƯU HỒ SƠ</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Import Excel */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white border border-zinc-300 w-full max-w-2xl p-5 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-zinc-200 pb-2">
              <h3 className="text-sm font-bold uppercase font-mono text-zinc-900">
                XEM TRƯỚC DỮ LIỆU IMPORT KHÁCH CŨ & CÔNG NỢ ĐẦU KỲ
              </h3>
              <button onClick={() => setShowImportModal(false)}><X className="w-4 h-4 text-zinc-500" /></button>
            </div>

            <div className="text-xs text-zinc-600 space-y-1">
              <p>Mẫu dữ liệu chuẩn hóa từ file Excel khách hàng cũ (gồm thông tin liên hệ và số dư nợ tồn đọng đầu kỳ):</p>
            </div>

            <div className="border border-zinc-300 overflow-x-auto max-h-60">
              <table className="w-full text-xs text-left">
                <thead className="bg-zinc-100 text-zinc-700 font-mono">
                  <tr>
                    <th className="p-2">Tên khách hàng</th>
                    <th className="p-2">Số điện thoại</th>
                    <th className="p-2">Địa chỉ</th>
                    <th className="p-2 text-right">Dư nợ đầu kỳ</th>
                    <th className="p-2 text-right">Hạn mức nợ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 font-mono">
                  {importRows.map((row, idx) => (
                    <tr key={idx} className="hover:bg-zinc-50">
                      <td className="p-2 font-sans font-semibold text-zinc-900">{row.name}</td>
                      <td className="p-2 text-zinc-600">{row.phone}</td>
                      <td className="p-2 font-sans text-zinc-600">{row.address}</td>
                      <td className="p-2 text-right font-bold text-red-600">{formatMoney(row.initialDebt)}</td>
                      <td className="p-2 text-right text-zinc-700">{formatMoney(row.creditLimit)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-zinc-200 text-xs">
              <span className="text-emerald-700 font-semibold flex items-center gap-1">
                <CheckCircle className="w-4 h-4" /> Dữ liệu hợp lệ, sẵn sàng ghi nhận sổ nợ đầu kỳ
              </span>
              <div className="space-x-2">
                <button onClick={() => setShowImportModal(false)} className="px-3 py-1.5 border border-zinc-300 text-xs">Hủy</button>
                <button onClick={handleExecuteImport} className="px-4 py-1.5 bg-brand-600 text-white font-semibold text-xs">XÁC NHẬN NẠP DỮ LIỆU</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

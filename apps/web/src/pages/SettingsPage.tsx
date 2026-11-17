import React, { useState, useEffect } from 'react';
import { Settings, Save, Shield, Store, CreditCard, Users, History } from 'lucide-react';
import { api } from '../api/client';

export const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'store' | 'bank' | 'users' | 'audit'>('store');
  const [settings, setSettings] = useState<Record<string, string>>({
    storeName: 'constructOS — Vật Liệu Xây Dựng & Sắt Thép',
    storePhone: '0908 123 456',
    storeAddress: '124 Đại Lộ Xây Dựng, Cụm Công Nghiệp Hòa Lạc, Hà Nội',
    storeTaxCode: '0109988776',
    bankName: 'MBBank',
    bankAccountNo: '999988886666',
    bankAccountName: 'CONSTRUCTOS STORE',
    allowNegativeStock: 'true',
  });

  const [users, setUsers] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const [sRes, uRes, aRes] = await Promise.all([
          api.get('/settings'),
          api.get('/users'),
          api.get('/audit-logs'),
        ]);
        setSettings((prev) => ({ ...prev, ...(sRes.data || {}) }));
        setUsers(uRes.data || []);
        setAuditLogs(aRes.data || []);
      } catch (err) {
        console.error('Error fetching settings', err);
      }
    };
    fetchSettings();
  }, []);

  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      await api.put('/settings', settings);
      alert('Đã cập nhật cấu hình hệ thống thành công!');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Lỗi khi lưu cấu hình');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4 space-y-4 max-w-5xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-200 pb-3">
        <div>
          <h1 className="text-lg font-bold tracking-tight text-zinc-950 font-mono">
            CÀI ĐẶT CỬA HÀNG & HỆ THỐNG CONSTRUCTOS
          </h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            Thông tin in hóa đơn A4 · Tài khoản ngân hàng VietQR / SePay · Phân quyền & Nhật ký
          </p>
        </div>

        <button
          onClick={handleSaveSettings}
          disabled={saving}
          className="bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold px-4 py-1.5 rounded-sm flex items-center gap-1.5 border border-brand-500 shadow-2xs"
        >
          <Save className="w-3.5 h-3.5" />
          <span>LƯU CẤU HÌNH</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-zinc-200 gap-2">
        <button
          onClick={() => setActiveTab('store')}
          className={`pb-2 px-3 text-xs font-bold font-mono transition-colors border-b-2 -mb-[1px] ${
            activeTab === 'store'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-zinc-500 hover:text-zinc-800'
          }`}
        >
          Thông tin Cửa hàng / Bãi
        </button>
        <button
          onClick={() => setActiveTab('bank')}
          className={`pb-2 px-3 text-xs font-bold font-mono transition-colors border-b-2 -mb-[1px] ${
            activeTab === 'bank'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-zinc-500 hover:text-zinc-800'
          }`}
        >
          Tài khoản VietQR & Ngân hàng
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`pb-2 px-3 text-xs font-bold font-mono transition-colors border-b-2 -mb-[1px] ${
            activeTab === 'users'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-zinc-500 hover:text-zinc-800'
          }`}
        >
          Người dùng & Phân quyền ({users.length})
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`pb-2 px-3 text-xs font-bold font-mono transition-colors border-b-2 -mb-[1px] ${
            activeTab === 'audit'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-zinc-500 hover:text-zinc-800'
          }`}
        >
          Nhật ký thao tác (Audit Logs)
        </button>
      </div>

      {/* Content */}
      <div className="bg-white border border-zinc-200 p-4 rounded-sm shadow-2xs">
        {activeTab === 'store' && (
          <div className="space-y-4 max-w-xl text-xs">
            <div>
              <label className="font-semibold text-zinc-700 block mb-1">
                Tên cửa hàng / Doanh nghiệp VLXD (In trên đầu hóa đơn A4)
              </label>
              <input
                type="text"
                value={settings.storeName}
                onChange={(e) => setSettings({ ...settings, storeName: e.target.value })}
                className="w-full border border-zinc-300 p-2 rounded-sm text-xs font-bold"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-zinc-700 block mb-1">Hotline / Số điện thoại</label>
                <input
                  type="text"
                  value={settings.storePhone}
                  onChange={(e) => setSettings({ ...settings, storePhone: e.target.value })}
                  className="w-full border border-zinc-300 p-2 rounded-sm text-xs font-mono"
                />
              </div>
              <div>
                <label className="font-semibold text-zinc-700 block mb-1">Mã số thuế (MST)</label>
                <input
                  type="text"
                  value={settings.storeTaxCode}
                  onChange={(e) => setSettings({ ...settings, storeTaxCode: e.target.value })}
                  className="w-full border border-zinc-300 p-2 rounded-sm text-xs font-mono"
                />
              </div>
            </div>

            <div>
              <label className="font-semibold text-zinc-700 block mb-1">Địa chỉ trụ sở / Kho bãi chính</label>
              <input
                type="text"
                value={settings.storeAddress}
                onChange={(e) => setSettings({ ...settings, storeAddress: e.target.value })}
                className="w-full border border-zinc-300 p-2 rounded-sm text-xs"
              />
            </div>

            <div className="pt-3 border-t border-zinc-200">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={settings.allowNegativeStock === 'true'}
                  onChange={(e) =>
                    setSettings({ ...settings, allowNegativeStock: e.target.checked ? 'true' : 'false' })
                  }
                  className="w-4 h-4"
                />
                <div>
                  <span className="font-bold text-zinc-900 block">Cho phép bán âm tồn kho (Có cảnh báo)</span>
                  <span className="text-zinc-500 text-[11px]">
                    Thực tế ngành VLXD cho phép xuất bán trước khi hàng về bãi, hệ thống cảnh báo và gắn cờ đối soát.
                  </span>
                </div>
              </label>
            </div>
          </div>
        )}

        {activeTab === 'bank' && (
          <div className="space-y-4 max-w-xl text-xs">
            <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 text-xs">
              <strong>Mã VietQR động:</strong> Thông tin tài khoản này được dùng để sinh mã QR in tự động trên hóa đơn bán hàng A4 và màn hình thu ngân kèm đúng số tiền và cú pháp mã đơn.
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-zinc-700 block mb-1">Ngân hàng thụ hưởng</label>
                <input
                  type="text"
                  placeholder="VD: MBBank, VCB, Techcombank..."
                  value={settings.bankName}
                  onChange={(e) => setSettings({ ...settings, bankName: e.target.value })}
                  className="w-full border border-zinc-300 p-2 rounded-sm text-xs font-bold font-mono"
                />
              </div>
              <div>
                <label className="font-semibold text-zinc-700 block mb-1">Số tài khoản ngân hàng</label>
                <input
                  type="text"
                  value={settings.bankAccountNo}
                  onChange={(e) => setSettings({ ...settings, bankAccountNo: e.target.value })}
                  className="w-full border border-zinc-300 p-2 rounded-sm text-xs font-mono font-bold"
                />
              </div>
            </div>

            <div>
              <label className="font-semibold text-zinc-700 block mb-1">Tên chủ tài khoản (In hoa không dấu)</label>
              <input
                type="text"
                value={settings.bankAccountName}
                onChange={(e) => setSettings({ ...settings, bankAccountName: e.target.value })}
                className="w-full border border-zinc-300 p-2 rounded-sm text-xs font-mono font-bold uppercase"
              />
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="space-y-3">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-zinc-100 text-zinc-700 border-b border-zinc-300 font-mono">
                  <th className="p-2.5">Tên đăng nhập</th>
                  <th className="p-2.5">Họ và tên</th>
                  <th className="p-2.5">Email</th>
                  <th className="p-2.5">Số điện thoại</th>
                  <th className="p-2.5">Vai trò (Role)</th>
                  <th className="p-2.5 text-center">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-zinc-50">
                    <td className="p-2.5 font-mono font-bold text-zinc-950">{u.username}</td>
                    <td className="p-2.5 font-semibold text-zinc-900">{u.fullName}</td>
                    <td className="p-2.5 font-mono text-zinc-600">{u.email}</td>
                    <td className="p-2.5 font-mono text-zinc-600">{u.phone || '—'}</td>
                    <td className="p-2.5">
                      <span className="font-mono text-[10px] bg-zinc-800 text-zinc-200 px-1.5 py-0.5">
                        {u.roles?.[0]?.role?.code || 'USER'}
                      </span>
                    </td>
                    <td className="p-2.5 text-center font-mono">
                      <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 text-[10px]">
                        Hoạt động
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'audit' && (
          <div className="space-y-3 font-mono text-xs">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-zinc-100 text-zinc-700 border-b border-zinc-300">
                  <th className="p-2">Thời gian</th>
                  <th className="p-2">Hành động</th>
                  <th className="p-2">Đối tượng</th>
                  <th className="p-2">Người thực hiện</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                {auditLogs.length > 0 ? (
                  auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-zinc-50">
                      <td className="p-2 text-zinc-500">{new Date(log.createdAt).toLocaleString('vi-VN')}</td>
                      <td className="p-2 font-bold text-brand-700">{log.action}</td>
                      <td className="p-2 text-zinc-800">{log.entity}</td>
                      <td className="p-2 text-zinc-900 font-sans font-medium">{log.user?.fullName || 'Hệ thống'}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="p-6 text-center text-zinc-400 font-sans">
                      Chưa có nhật ký ghi nhận
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};


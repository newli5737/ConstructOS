import React, { useState, useEffect } from 'react';
import { Settings, Save, Shield, Store, CreditCard, Users, History, Cloud, CheckCircle2, AlertCircle } from 'lucide-react';
import { api } from '../api/client';
import { useToast } from '../context/ToastContext';

export const SettingsPage: React.FC = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'store' | 'bank' | 'r2' | 'users' | 'audit'>('store');
  const [settings, setSettings] = useState<Record<string, string>>({
    storeName: 'constructOS — Vật Liệu Xây Dựng & Sắt Thép',
    storePhone: '0908 123 456',
    storeAddress: '124 Đại Lộ Xây Dựng, Cụm Công Nghiệp Hòa Lạc, Hà Nội',
    storeTaxCode: '0109988776',
    bankName: 'MBBank',
    bankAccountNo: '999988886666',
    bankAccountName: 'CONSTRUCTOS STORE',
    allowNegativeStock: 'true',
    r2_account_id: '',
    r2_access_key_id: '',
    r2_secret_access_key: '',
    r2_bucket_name: 'constructos-storage',
    r2_public_domain: '',
  });

  const [users, setUsers] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [testingR2, setTestingR2] = useState(false);
  const [r2Status, setR2Status] = useState<any>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const [sRes, uRes, aRes, r2Res] = await Promise.all([
          api.get('/settings'),
          api.get('/users'),
          api.get('/audit-logs'),
          api.get('/storage/status').catch(() => ({ data: null })),
        ]);
        setSettings((prev) => ({ ...prev, ...(sRes.data || {}) }));
        setUsers(uRes.data || []);
        setAuditLogs(aRes.data || []);
        if (r2Res?.data) {
          setR2Status(r2Res.data);
        }
      } catch (err) {
        console.error('Error fetching settings', err);
      }
    };
    fetchSettings();
  }, []);

  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      await Promise.all([
        api.put('/settings', settings),
        api.post('/storage/config', {
          accountId: settings.r2_account_id,
          accessKeyId: settings.r2_access_key_id,
          secretAccessKey: settings.r2_secret_access_key,
          bucketName: settings.r2_bucket_name,
          publicDomain: settings.r2_public_domain,
        }),
      ]);
      toast.success('Đã lưu và đồng bộ cấu hình hệ thống & Cloudflare R2 thành công!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Lỗi khi lưu cấu hình');
    } finally {
      setSaving(false);
    }
  };

  const handleTestR2 = async () => {
    try {
      setTestingR2(true);
      const res = await api.post('/storage/test', {
        accountId: settings.r2_account_id,
        accessKeyId: settings.r2_access_key_id,
        secretAccessKey: settings.r2_secret_access_key,
        bucketName: settings.r2_bucket_name,
        publicDomain: settings.r2_public_domain,
      });
      if (res.data.success) {
        toast.success(res.data.message || 'Kết nối Cloudflare R2 thành công!');
      } else {
        toast.error(res.data.message || 'Kết nối Cloudflare R2 thất bại');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Không thể kết nối Cloudflare R2');
    } finally {
      setTestingR2(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-5 max-w-5xl mx-auto w-full text-slate-900">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Settings className="w-5 h-5 text-brand-600" />
            <span>CÀI ĐẶT CỬA HÀNG & HỆ THỐNG</span>
          </h1>
          <p className="text-xs text-slate-600 mt-0.5">
            Thông tin in hóa đơn A4 · Tài khoản VietQR · Cloudflare R2 Storage · Phân quyền
          </p>
        </div>

        <button
          onClick={handleSaveSettings}
          disabled={saving}
          className="bg-brand-600 hover:bg-brand-700 active:bg-brand-800 text-white text-xs font-bold px-4 py-2 rounded-sm flex items-center gap-2 border border-brand-700 shadow-xs cursor-pointer tracking-wide"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'ĐANG LƯU...' : 'LƯU CẤU HÌNH'}</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-1 overflow-x-auto">
        <button
          onClick={() => setActiveTab('store')}
          className={`pb-2.5 px-4 text-xs font-bold transition-all border-b-2 -mb-[1px] whitespace-nowrap ${
            activeTab === 'store'
              ? 'border-brand-600 text-brand-700 bg-brand-50/50'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          Thông tin Cửa hàng / Bãi
        </button>
        <button
          onClick={() => setActiveTab('bank')}
          className={`pb-2.5 px-4 text-xs font-bold transition-all border-b-2 -mb-[1px] whitespace-nowrap ${
            activeTab === 'bank'
              ? 'border-brand-600 text-brand-700 bg-brand-50/50'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          Tài khoản VietQR & Ngân hàng
        </button>
        <button
          onClick={() => setActiveTab('r2')}
          className={`pb-2.5 px-4 text-xs font-bold transition-all border-b-2 -mb-[1px] whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'r2'
              ? 'border-brand-600 text-brand-700 bg-brand-50/50'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Cloud className="w-3.5 h-3.5 text-orange-500" />
          <span>Lưu trữ Cloudflare R2</span>
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`pb-2.5 px-4 text-xs font-bold transition-all border-b-2 -mb-[1px] whitespace-nowrap ${
            activeTab === 'users'
              ? 'border-brand-600 text-brand-700 bg-brand-50/50'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          Người dùng ({users.length})
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`pb-2.5 px-4 text-xs font-bold transition-all border-b-2 -mb-[1px] whitespace-nowrap ${
            activeTab === 'audit'
              ? 'border-brand-600 text-brand-700 bg-brand-50/50'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          Nhật ký thao tác (Audit Logs)
        </button>
      </div>

      {/* Content */}
      <div className="bg-white border border-slate-300 p-5 rounded-sm shadow-xs">
        {activeTab === 'store' && (
          <div className="space-y-4 max-w-2xl text-xs">
            <div>
              <label className="font-bold text-slate-800 block mb-1">
                Tên cửa hàng / Doanh nghiệp VLXD (In trên đầu hóa đơn A4)
              </label>
              <input
                type="text"
                value={settings.storeName}
                onChange={(e) => setSettings({ ...settings, storeName: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 p-2.5 rounded-sm text-sm font-bold text-slate-900 focus:bg-white focus:border-brand-500 outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-slate-800 block mb-1">Hotline / Số điện thoại</label>
                <input
                  type="text"
                  value={settings.storePhone}
                  onChange={(e) => setSettings({ ...settings, storePhone: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 p-2.5 rounded-sm text-sm font-mono text-slate-900 focus:bg-white focus:border-brand-500 outline-none"
                />
              </div>
              <div>
                <label className="font-bold text-slate-800 block mb-1">Mã số thuế (MST)</label>
                <input
                  type="text"
                  value={settings.storeTaxCode}
                  onChange={(e) => setSettings({ ...settings, storeTaxCode: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 p-2.5 rounded-sm text-sm font-mono text-slate-900 focus:bg-white focus:border-brand-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-800 block mb-1">Địa chỉ trụ sở / Kho bãi chính</label>
              <input
                type="text"
                value={settings.storeAddress}
                onChange={(e) => setSettings({ ...settings, storeAddress: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 p-2.5 rounded-sm text-sm text-slate-900 focus:bg-white focus:border-brand-500 outline-none"
              />
            </div>

            <div className="pt-4 border-t border-slate-200">
              <label className="flex items-start gap-3 cursor-pointer select-none bg-slate-50 p-3 border border-slate-200 rounded-sm">
                <input
                  type="checkbox"
                  checked={settings.allowNegativeStock === 'true'}
                  onChange={(e) =>
                    setSettings({ ...settings, allowNegativeStock: e.target.checked ? 'true' : 'false' })
                  }
                  className="w-4 h-4 mt-0.5"
                />
                <div>
                  <span className="font-bold text-slate-900 block text-xs">Cho phép bán âm tồn kho (Có cảnh báo)</span>
                  <span className="text-slate-600 text-[11px] leading-relaxed">
                    Đặc thù ngành VLXD thường xuyên giao hàng trực tiếp từ xe hoặc mỏ về công trình trước khi nhập kho. Hệ thống vẫn lưu log và gắn cờ đối soát tồn.
                  </span>
                </div>
              </label>
            </div>
          </div>
        )}

        {activeTab === 'bank' && (
          <div className="space-y-4 max-w-2xl text-xs">
            <div className="p-3 bg-amber-50 border-l-4 border-amber-500 text-amber-900 text-xs">
              <strong>Mã VietQR động:</strong> Thông tin tài khoản này được dùng để sinh mã QR in tự động trên hóa đơn bán hàng A4 và màn hình thu ngân POS kèm đúng số tiền và cú pháp mã đơn.
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-slate-800 block mb-1">Ngân hàng thụ hưởng</label>
                <input
                  type="text"
                  placeholder="VD: MBBank, VCB, Techcombank..."
                  value={settings.bankName}
                  onChange={(e) => setSettings({ ...settings, bankName: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 p-2.5 rounded-sm text-sm font-bold font-mono text-slate-900 focus:bg-white focus:border-brand-500 outline-none"
                />
              </div>
              <div>
                <label className="font-bold text-slate-800 block mb-1">Số tài khoản ngân hàng</label>
                <input
                  type="text"
                  value={settings.bankAccountNo}
                  onChange={(e) => setSettings({ ...settings, bankAccountNo: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 p-2.5 rounded-sm text-sm font-mono font-bold text-slate-900 focus:bg-white focus:border-brand-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-800 block mb-1">Tên chủ tài khoản (In hoa không dấu)</label>
              <input
                type="text"
                value={settings.bankAccountName}
                onChange={(e) => setSettings({ ...settings, bankAccountName: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 p-2.5 rounded-sm text-sm font-mono font-bold uppercase text-slate-900 focus:bg-white focus:border-brand-500 outline-none"
              />
            </div>
          </div>
        )}

        {/* Cloudflare R2 Storage Tab */}
        {activeTab === 'r2' && (
          <div className="space-y-4 max-w-2xl text-xs">
            <div className="p-3 bg-orange-50 border-l-4 border-orange-500 text-orange-950 text-xs">
              <strong>Lưu trữ Cloudflare R2 (S3 Compatible):</strong> Hệ thống sử dụng Cloudflare R2 để lưu trữ hình ảnh sản phẩm, ảnh chụp công trình, chứng từ nghiệm thu và phiếu cân điện tử không giới hạn băng thông (Zero Egress Fee).
            </div>

            <div className="space-y-3">
              <div>
                <label className="font-bold text-slate-800 block mb-1 font-mono uppercase text-xs">
                  Cloudflare Account ID <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. 8f23abc1234567890abcdef..."
                  value={settings.r2_account_id || ''}
                  onChange={(e) => setSettings({ ...settings, r2_account_id: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 p-2.5 rounded-sm text-xs font-mono text-slate-900 focus:bg-white focus:border-brand-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-800 block mb-1 font-mono uppercase text-xs">
                    R2 Access Key ID <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. a87c9f8723..."
                    value={settings.r2_access_key_id || ''}
                    onChange={(e) => setSettings({ ...settings, r2_access_key_id: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 p-2.5 rounded-sm text-xs font-mono text-slate-900 focus:bg-white focus:border-brand-500 outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-800 block mb-1 font-mono uppercase text-xs">
                    R2 Secret Access Key <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    placeholder="••••••••••••••••••••••••"
                    value={settings.r2_secret_access_key || ''}
                    onChange={(e) => setSettings({ ...settings, r2_secret_access_key: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 p-2.5 rounded-sm text-xs font-mono text-slate-900 focus:bg-white focus:border-brand-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-800 block mb-1 font-mono uppercase text-xs">
                    R2 Bucket Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="constructos-storage"
                    value={settings.r2_bucket_name || ''}
                    onChange={(e) => setSettings({ ...settings, r2_bucket_name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 p-2.5 rounded-sm text-xs font-mono text-slate-900 focus:bg-white focus:border-brand-500 outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-800 block mb-1 font-mono uppercase text-xs">
                    Public Domain / CDN R2 URL
                  </label>
                  <input
                    type="text"
                    placeholder="https://pub-xxxx.r2.dev hoặc https://cdn.domain.com"
                    value={settings.r2_public_domain || ''}
                    onChange={(e) => setSettings({ ...settings, r2_public_domain: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 p-2.5 rounded-sm text-xs font-mono text-slate-900 focus:bg-white focus:border-brand-500 outline-none"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleTestR2}
                  disabled={testingR2}
                  className="px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-sm flex items-center gap-1.5 cursor-pointer"
                >
                  <Cloud className="w-4 h-4 text-orange-600" />
                  <span>{testingR2 ? 'Đang kiểm tra...' : 'Kiểm tra kết nối Cloudflare R2'}</span>
                </button>

                <div className="text-[11px] font-mono text-slate-500">
                  Endpoint tự động: <span className="text-slate-800">https://[account-id].r2.cloudflarestorage.com</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="space-y-3">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-800 border-b border-slate-300 font-bold">
                  <th className="p-3">Tên đăng nhập</th>
                  <th className="p-3">Họ và tên</th>
                  <th className="p-3">Email</th>
                  <th className="p-3">Số điện thoại</th>
                  <th className="p-3">Vai trò (Role)</th>
                  <th className="p-3 text-center">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50">
                    <td className="p-3 font-mono font-bold text-slate-900">{u.username}</td>
                    <td className="p-3 font-bold text-slate-900">{u.fullName}</td>
                    <td className="p-3 font-mono text-slate-600">{u.email}</td>
                    <td className="p-3 font-mono text-slate-600">{u.phone || '—'}</td>
                    <td className="p-3">
                      <span className="font-mono text-xs font-bold bg-slate-200 text-slate-800 px-2 py-0.5 border border-slate-300">
                        {u.roles?.[0]?.role?.code || 'USER'}
                      </span>
                    </td>
                    <td className="p-3 text-center font-mono">
                      <span className="text-emerald-800 bg-emerald-50 border border-emerald-300 px-2 py-0.5 text-xs font-semibold">
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
                <tr className="bg-slate-100 text-slate-800 border-b border-slate-300 font-bold">
                  <th className="p-2.5">Thời gian</th>
                  <th className="p-2.5">Hành động</th>
                  <th className="p-2.5">Đối tượng</th>
                  <th className="p-2.5">Người thực hiện</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {auditLogs.length > 0 ? (
                  auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50">
                      <td className="p-2.5 text-slate-600">{new Date(log.createdAt).toLocaleString('vi-VN')}</td>
                      <td className="p-2.5 font-bold text-brand-700">{log.action}</td>
                      <td className="p-2.5 text-slate-800">{log.entity}</td>
                      <td className="p-2.5 text-slate-900 font-sans font-semibold">{log.user?.fullName || 'Hệ thống'}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="p-6 text-center text-slate-400 font-sans">
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

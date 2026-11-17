import React from 'react';
import { X, Printer, Download } from 'lucide-react';
import { SalesOrder } from '../types';
import { formatMoney, formatNumber } from '../api/client';

interface InvoicePrintModalProps {
  order: SalesOrder | null;
  onClose: () => void;
  storeInfo?: {
    storeName?: string;
    storePhone?: string;
    storeAddress?: string;
    storeTaxCode?: string;
    bankName?: string;
    bankAccountNo?: string;
    bankAccountName?: string;
  };
}

export const InvoicePrintModal: React.FC<InvoicePrintModalProps> = ({
  order,
  onClose,
  storeInfo,
}) => {
  if (!order) return null;

  const handlePrint = () => {
    window.print();
  };

  const store = {
    name: storeInfo?.storeName || 'ĐẠI LÝ VẬT LIỆU XÂY DỰNG & SẮT THÉP CONSTRUCTOS',
    phone: storeInfo?.storePhone || '0908 123 456 - 0912 334 455',
    address: storeInfo?.storeAddress || '124 Đại Lộ Xây Dựng, Cụm Công Nghiệp Hòa Lạc, Hà Nội',
    taxCode: storeInfo?.storeTaxCode || '0109988776',
    bankName: storeInfo?.bankName || 'MBBank',
    bankAccountNo: storeInfo?.bankAccountNo || '999988886666',
    bankAccountName: storeInfo?.bankAccountName || 'CONSTRUCTOS STORE',
  };

  // VietQR quick URL
  const qrUrl = `https://img.vietqr.io/image/${store.bankName}-${store.bankAccountNo}-compact2.png?amount=${
    Number(order.total) - Number(order.paidAmount)
  }&addInfo=${encodeURIComponent(order.code)}&accountName=${encodeURIComponent(store.bankAccountName)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      {/* Controls Bar */}
      <div className="fixed top-4 right-4 flex items-center space-x-2 z-50 print:hidden">
        <button
          onClick={handlePrint}
          className="bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold px-4 py-2 rounded-sm shadow-md flex items-center gap-2 border border-brand-500"
        >
          <Printer className="w-4 h-4" />
          <span>IN PHIẾU A4 (PRINT)</span>
        </button>
        <button
          onClick={onClose}
          className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 p-2 rounded-sm border border-zinc-700"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* A4 Printable Document Container */}
      <div className="bg-white text-zinc-900 w-[210mm] min-h-[297mm] p-[15mm] shadow-2xl rounded-none font-sans border border-zinc-300 my-auto print:border-none print:shadow-none print:m-0 print:p-[10mm]">
        {/* Header Store Info */}
        <div className="flex justify-between items-start border-b-2 border-zinc-900 pb-3 mb-4">
          <div className="max-w-[65%]">
            <h1 className="text-base font-bold uppercase tracking-tight text-zinc-950 font-mono">
              {store.name}
            </h1>
            <p className="text-xs text-zinc-700 mt-1">
              <span className="font-semibold">Địa chỉ:</span> {store.address}
            </p>
            <p className="text-xs text-zinc-700">
              <span className="font-semibold">Hotline:</span> {store.phone} · <span className="font-semibold">MST:</span> {store.taxCode}
            </p>
          </div>
          <div className="text-right">
            <div className="inline-block border border-zinc-900 px-2 py-1 font-mono font-bold text-sm bg-zinc-100">
              {order.code}
            </div>
            <p className="text-[11px] text-zinc-500 mt-1">
              Ngày: {new Date(order.orderDate).toLocaleDateString('vi-VN')}
            </p>
          </div>
        </div>

        {/* Invoice Title */}
        <div className="text-center my-4">
          <h2 className="text-xl font-bold uppercase tracking-wide text-zinc-900 font-mono">
            HÓA ĐƠN BÁN HÀNG & PHIẾU XUẤT KHO
          </h2>
          <p className="text-xs text-zinc-500 italic mt-0.5">
            (Kiêm biên bản bàn giao vật tư tại chân công trình)
          </p>
        </div>

        {/* Customer & Project Info */}
        <div className="grid grid-cols-2 gap-4 text-xs bg-zinc-50 border border-zinc-200 p-3 mb-4">
          <div>
            <p className="mb-1">
              <span className="font-semibold text-zinc-600">Khách hàng:</span>{' '}
              <span className="font-bold text-zinc-900">{order.customer?.name}</span>
            </p>
            <p className="mb-1">
              <span className="font-semibold text-zinc-600">Điện thoại:</span>{' '}
              <span className="font-mono">{order.customer?.phone || '—'}</span>
            </p>
            <p>
              <span className="font-semibold text-zinc-600">Địa chỉ:</span> {order.customer?.address || '—'}
            </p>
          </div>
          <div>
            <p className="mb-1">
              <span className="font-semibold text-zinc-600">Công trình giao:</span>{' '}
              <span className="font-bold text-zinc-900">{order.site?.name || 'Giao tại kho / Địa chỉ khách'}</span>
            </p>
            <p className="mb-1">
              <span className="font-semibold text-zinc-600">Địa chỉ công trình:</span> {order.site?.address || order.customer?.address || '—'}
            </p>
            <p>
              <span className="font-semibold text-zinc-600">Hạn thanh toán:</span>{' '}
              <span className="font-mono font-bold text-brand-700">
                {order.dueDate ? new Date(order.dueDate).toLocaleDateString('vi-VN') : 'Thanh toán ngay'}
              </span>
            </p>
          </div>
        </div>

        {/* Items Table */}
        <table className="w-full text-xs border-collapse border border-zinc-300 mb-4">
          <thead>
            <tr className="bg-zinc-100 border-b border-zinc-300 text-zinc-800 font-semibold font-mono">
              <th className="border border-zinc-300 p-2 text-center w-8">#</th>
              <th className="border border-zinc-300 p-2 text-left">Tên vật liệu / Quy cách</th>
              <th className="border border-zinc-300 p-2 text-center w-14">ĐVT</th>
              <th className="border border-zinc-300 p-2 text-right w-16">Số lượng</th>
              <th className="border border-zinc-300 p-2 text-right w-24">Đơn giá</th>
              <th className="border border-zinc-300 p-2 text-right w-28">Thành tiền</th>
            </tr>
          </thead>
          <tbody>
            {order.items?.map((item, idx) => (
              <tr key={idx} className="border-b border-zinc-200">
                <td className="border border-zinc-300 p-2 text-center font-mono">{idx + 1}</td>
                <td className="border border-zinc-300 p-2 font-medium">
                  {item.product?.name || 'Vật tư xây dựng'}
                  {item.product?.sku && (
                    <span className="text-[10px] text-zinc-500 font-mono block">[{item.product.sku}]</span>
                  )}
                </td>
                <td className="border border-zinc-300 p-2 text-center">{item.unitName}</td>
                <td className="border border-zinc-300 p-2 text-right font-mono font-bold">
                  {formatNumber(item.quantity)}
                </td>
                <td className="border border-zinc-300 p-2 text-right font-mono">
                  {formatMoney(item.unitPrice).replace('₫', '')}
                </td>
                <td className="border border-zinc-300 p-2 text-right font-mono font-bold">
                  {formatMoney(item.lineTotal).replace('₫', '')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals & QR Code */}
        <div className="flex justify-between items-start text-xs border border-zinc-300 p-3 mb-6 bg-zinc-50">
          {/* Bank Payment QR */}
          <div className="flex items-center space-x-3">
            <img
              src={qrUrl}
              alt="Mã QR thanh toán ngân hàng"
              className="w-24 h-24 border border-zinc-300 bg-white p-1"
            />
            <div className="text-[11px] leading-relaxed">
              <p className="font-bold uppercase text-zinc-800">Quét mã VietQR chuyển khoản:</p>
              <p>Ngân hàng: <span className="font-mono font-semibold">{store.bankName}</span></p>
              <p>Số tài khoản: <span className="font-mono font-bold">{store.bankAccountNo}</span></p>
              <p>Chủ TK: <span className="font-semibold">{store.bankAccountName}</span></p>
              <p>Nội dung: <span className="font-mono font-bold text-brand-600">{order.code}</span></p>
            </div>
          </div>

          {/* Amount Summary */}
          <div className="w-64 space-y-1.5 text-right font-mono">
            <div className="flex justify-between text-zinc-600">
              <span>Tạm tính:</span>
              <span>{formatMoney(order.subtotal)}</span>
            </div>
            {Number(order.discountAmount) > 0 && (
              <div className="flex justify-between text-emerald-700">
                <span>Chiết khấu:</span>
                <span>-{formatMoney(order.discountAmount)}</span>
              </div>
            )}
            {Number(order.shippingFee) > 0 && (
              <div className="flex justify-between text-zinc-600">
                <span>Cước vận chuyển/bốc xếp:</span>
                <span>+{formatMoney(order.shippingFee)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm font-bold border-t border-zinc-300 pt-1 text-zinc-950">
              <span>TỔNG CỘNG:</span>
              <span className="text-brand-600">{formatMoney(order.total)}</span>
            </div>
            <div className="flex justify-between text-zinc-700 pt-1">
              <span>Đã thanh toán:</span>
              <span className="font-semibold">{formatMoney(order.paidAmount)}</span>
            </div>
            <div className="flex justify-between text-sm font-bold text-red-600 border-t border-zinc-300 pt-1">
              <span>CÒN NỢ:</span>
              <span>{formatMoney(Number(order.total) - Number(order.paidAmount))}</span>
            </div>
          </div>
        </div>

        {/* Note & Terms */}
        <div className="text-[11px] text-zinc-600 mb-8 border-l-2 border-zinc-400 pl-2">
          <p><span className="font-semibold">Ghi chú:</span> {order.note || 'Hàng đã kiểm tra đủ số lượng và quy cách trước khi nhận.'}</p>
          <p className="italic mt-0.5">Quý khách vui lòng kiểm tra kỹ số lượng, chủng loại và chất lượng vật tư khi giao nhận.</p>
        </div>

        {/* Signatures */}
        <div className="grid grid-cols-4 gap-2 text-center text-xs mt-6 pt-4">
          <div>
            <p className="font-bold text-zinc-900">Người lập phiếu</p>
            <p className="text-[10px] text-zinc-400 italic">(Ký, họ tên)</p>
            <div className="h-16"></div>
            <p className="font-medium text-zinc-800">{order.salesperson?.fullName || 'Nhân viên bán hàng'}</p>
          </div>
          <div>
            <p className="font-bold text-zinc-900">Thủ kho / Bãi</p>
            <p className="text-[10px] text-zinc-400 italic">(Ký, họ tên)</p>
            <div className="h-16"></div>
            <p className="font-medium text-zinc-800">Thủ kho</p>
          </div>
          <div>
            <p className="font-bold text-zinc-900">Tài xế giao hàng</p>
            <p className="text-[10px] text-zinc-400 italic">(Ký, họ tên, biển số)</p>
            <div className="h-16"></div>
            <p className="font-medium text-zinc-800">Đội xe vận tải</p>
          </div>
          <div>
            <p className="font-bold text-zinc-900">Người nhận vật tư</p>
            <p className="text-[10px] text-zinc-400 italic">(Ký, ghi rõ họ tên)</p>
            <div className="h-16"></div>
            <p className="font-medium text-zinc-800">{order.customer?.name}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

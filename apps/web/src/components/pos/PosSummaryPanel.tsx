import React from 'react';
import { formatMoney } from '../../api/client';
import { Save, Printer, CheckCircle, CreditCard, Banknote } from 'lucide-react';

interface PosSummaryPanelProps {
  orderDate: string;
  onOrderDateChange: (val: string) => void;
  dueDate: string;
  onDueDateChange: (val: string) => void;
  note: string;
  onNoteChange: (val: string) => void;
  subtotal: number;
  discountAmount: number;
  onDiscountChange: (val: number) => void;
  shippingFee: number;
  onShippingFeeChange: (val: number) => void;
  totalAmount: number;
  paidAmount: number;
  onPaidAmountChange: (val: number) => void;
  remainingDebt: number;
  paymentMethod: 'CASH' | 'TRANSFER';
  onPaymentMethodChange: (val: 'CASH' | 'TRANSFER') => void;
  submitting: boolean;
  onSubmitDraft: () => void;
  onSubmitAndPrint: () => void;
  onSubmitAndConfirm: () => void;
}

export const PosSummaryPanel: React.FC<PosSummaryPanelProps> = ({
  orderDate,
  onOrderDateChange,
  dueDate,
  onDueDateChange,
  note,
  onNoteChange,
  subtotal,
  discountAmount,
  onDiscountChange,
  shippingFee,
  onShippingFeeChange,
  totalAmount,
  paidAmount,
  onPaidAmountChange,
  remainingDebt,
  paymentMethod,
  onPaymentMethodChange,
  submitting,
  onSubmitDraft,
  onSubmitAndPrint,
  onSubmitAndConfirm,
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-slate-900">
      {/* Left: Notes & Delivery details */}
      <div className="bg-white border border-slate-300 p-4 rounded-sm shadow-xs space-y-3">
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <label className="font-bold text-slate-800 block mb-1 font-mono uppercase text-xs">
              Ngày lập đơn
            </label>
            <input
              type="date"
              value={orderDate}
              onChange={(e) => onOrderDateChange(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 p-2 rounded-sm text-xs font-mono font-medium focus:bg-white outline-none"
            />
          </div>
          <div>
            <label className="font-bold text-slate-800 block mb-1 font-mono uppercase text-xs">
              Hạn thanh toán công nợ
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => onDueDateChange(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 p-2 rounded-sm text-xs font-mono font-medium focus:bg-white outline-none"
            />
          </div>
        </div>

        <div>
          <label className="font-bold text-slate-800 block mb-1 text-xs">
            Ghi chú giao hàng / Xe vận chuyển & bốc dỡ
          </label>
          <textarea
            rows={3}
            placeholder="Ví dụ: Giao đợt 1 lúc 8h sáng, xe 5 tấn biển 29C-123.45 bốc xếp tại chân công trình..."
            value={note}
            onChange={(e) => onNoteChange(e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 p-2 rounded-sm text-xs text-slate-900 focus:bg-white outline-none"
          />
        </div>
      </div>

      {/* Right: Payment Calculation & Action Buttons */}
      <div className="bg-white border border-slate-300 p-4 rounded-sm shadow-xs space-y-3.5">
        <div className="space-y-2 text-xs">
          <div className="flex justify-between items-center text-slate-600 font-medium">
            <span>Tạm tính tiền hàng:</span>
            <span className="font-mono font-bold text-slate-900 text-sm">{formatMoney(subtotal)} đ</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-slate-600 font-medium">Chiết khấu tổng đơn:</span>
            <div className="w-40">
              <input
                type="number"
                min="0"
                value={discountAmount}
                onChange={(e) => onDiscountChange(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-300 p-1.5 rounded-sm text-right text-xs font-mono font-bold focus:bg-white outline-none"
              />
            </div>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-slate-600 font-medium">Cước vận chuyển / bốc xếp:</span>
            <div className="w-40">
              <input
                type="number"
                min="0"
                value={shippingFee}
                onChange={(e) => onShippingFeeChange(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-300 p-1.5 rounded-sm text-right text-xs font-mono font-bold focus:bg-white outline-none"
              />
            </div>
          </div>

          <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
            <span className="font-bold text-slate-900 text-sm uppercase">Tổng tiền đơn hàng:</span>
            <span className="font-mono font-black text-brand-700 text-lg">
              {formatMoney(totalAmount)} đ
            </span>
          </div>

          <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
            <span className="font-bold text-slate-800">Khách thanh toán ngay:</span>
            <div className="w-40">
              <input
                type="number"
                min="0"
                value={paidAmount}
                onChange={(e) => onPaidAmountChange(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-300 p-1.5 rounded-sm text-right text-xs font-mono font-bold text-emerald-700 focus:bg-white outline-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-600 font-medium">Hình thức thanh toán:</span>
            <div className="flex items-center space-x-3">
              <label className="flex items-center gap-1 cursor-pointer">
                <input
                  type="radio"
                  name="paymentMethod"
                  checked={paymentMethod === 'CASH'}
                  onChange={() => onPaymentMethodChange('CASH')}
                />
                <span className="font-semibold text-slate-800">Tiền mặt</span>
              </label>
              <label className="flex items-center gap-1 cursor-pointer">
                <input
                  type="radio"
                  name="paymentMethod"
                  checked={paymentMethod === 'TRANSFER'}
                  onChange={() => onPaymentMethodChange('TRANSFER')}
                />
                <span className="font-semibold text-brand-700">Chuyển khoản (VietQR)</span>
              </label>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-xs font-bold">
            <span className="text-slate-700">CÒN GHI NỢ CÔNG TRÌNH:</span>
            <span className="font-mono text-red-600 text-base">
              {formatMoney(remainingDebt)} đ
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-3 border-t border-slate-200 flex flex-wrap gap-2">
          <button
            onClick={onSubmitDraft}
            disabled={submitting}
            className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 px-3 rounded-none border border-slate-300 text-xs flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Save className="w-4 h-4 text-slate-500" />
            <span>LƯU NHÁP</span>
          </button>

          <button
            onClick={onSubmitAndPrint}
            disabled={submitting}
            className="flex-1 bg-brand-600 hover:bg-brand-700 active:bg-brand-800 text-white font-bold py-2.5 px-3 rounded-none text-xs flex items-center justify-center gap-1.5 shadow-xs cursor-pointer tracking-wide"
          >
            <Printer className="w-4 h-4" />
            <span>DUYỆT & IN A4</span>
          </button>

          <button
            onClick={onSubmitAndConfirm}
            disabled={submitting}
            className="flex-1 bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-2.5 px-3 rounded-none text-xs flex items-center justify-center gap-1.5 shadow-xs cursor-pointer tracking-wide"
          >
            <CheckCircle className="w-4 h-4" />
            <span>XÁC NHẬN & XUẤT</span>
          </button>
        </div>
      </div>
    </div>
  );
};

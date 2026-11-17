import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
  title?: string;
  duration?: number;
}

export interface ConfirmDialogOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  onConfirm: () => void;
}

interface ToastContextValue {
  toast: {
    success: (message: string, title?: string) => void;
    error: (message: string, title?: string) => void;
    warning: (message: string, title?: string) => void;
    info: (message: string, title?: string) => void;
  };
  confirmDialog: (options: ConfirmDialogOptions) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [dialogState, setDialogState] = useState<ConfirmDialogOptions | null>(null);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((type: ToastType, message: string, title?: string, duration = 3500) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: ToastItem = { id, type, message, title, duration };
    setToasts((prev) => [...prev, newToast]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, [removeToast]);

  const toast = {
    success: (msg: string, title?: string) => addToast('success', msg, title || 'Thành công'),
    error: (msg: string, title?: string) => addToast('error', msg, title || 'Thông báo lỗi'),
    warning: (msg: string, title?: string) => addToast('warning', msg, title || 'Cảnh báo'),
    info: (msg: string, title?: string) => addToast('info', msg, title || 'Thông tin'),
  };

  const confirmDialog = (options: ConfirmDialogOptions) => {
    setDialogState(options);
  };

  const handleConfirm = () => {
    if (dialogState?.onConfirm) {
      dialogState.onConfirm();
    }
    setDialogState(null);
  };

  const handleCancel = () => {
    setDialogState(null);
  };

  return (
    <ToastContext.Provider value={{ toast, confirmDialog }}>
      {children}

      {/* Toast Notification Container (Top Right) */}
      <div className="fixed top-4 right-4 z-50 flex flex-col space-y-2 pointer-events-none max-w-sm w-full">
        {toasts.map((t) => {
          const borderColors = {
            success: 'border-emerald-600 bg-white text-emerald-950',
            error: 'border-red-600 bg-white text-red-950',
            warning: 'border-amber-600 bg-white text-amber-950',
            info: 'border-blue-600 bg-white text-blue-950',
          };

          const iconColor = {
            success: 'text-emerald-600',
            error: 'text-red-600',
            warning: 'text-amber-600',
            info: 'text-blue-600',
          };

          const IconComponent = {
            success: CheckCircle2,
            error: AlertCircle,
            warning: AlertTriangle,
            info: Info,
          }[t.type];

          return (
            <div
              key={t.id}
              className={`pointer-events-auto flex items-start p-3 border-l-4 shadow-lg border-y border-r border-slate-200 rounded-sm transition-all animate-in fade-in slide-in-from-top-2 duration-200 ${borderColors[t.type]}`}
            >
              <IconComponent className={`w-5 h-5 shrink-0 mt-0.5 mr-2.5 ${iconColor[t.type]}`} />
              <div className="flex-1 text-xs">
                {t.title && <div className="font-bold text-slate-900 tracking-tight">{t.title}</div>}
                <div className="text-slate-700 leading-snug mt-0.5">{t.message}</div>
              </div>
              <button
                onClick={() => removeToast(t.id)}
                className="text-slate-400 hover:text-slate-700 ml-2 p-0.5 rounded-none"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Custom Confirmation Modal (No native confirm()) */}
      {dialogState && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white border border-slate-300 shadow-2xl max-w-md w-full p-5 rounded-sm animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <AlertTriangle className={`w-5 h-5 ${dialogState.isDestructive ? 'text-red-600' : 'text-brand-600'}`} />
              <span>{dialogState.title}</span>
            </h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              {dialogState.message}
            </p>

            <div className="mt-5 flex justify-end space-x-2">
              <button
                onClick={handleCancel}
                className="px-3.5 py-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-sm"
              >
                {dialogState.cancelText || 'Hủy bỏ'}
              </button>
              <button
                onClick={handleConfirm}
                className={`px-3.5 py-1.5 text-xs font-semibold text-white rounded-sm shadow-xs ${
                  dialogState.isDestructive
                    ? 'bg-red-600 hover:bg-red-700 border border-red-700'
                    : 'bg-brand-600 hover:bg-brand-700 border border-brand-700'
                }`}
              >
                {dialogState.confirmText || 'Xác nhận'}
              </button>
            </div>
          </div>
        </div>
      )}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};


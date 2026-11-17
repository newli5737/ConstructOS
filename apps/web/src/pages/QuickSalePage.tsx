import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, LayoutGrid, RotateCcw } from 'lucide-react';
import { usePOS } from '../hooks/usePOS';
import { PosCustomerHeader } from '../components/pos/PosCustomerHeader';
import { PosProductCatalogGrid } from '../components/pos/PosProductCatalogGrid';
import { PosOrderItemsTable } from '../components/pos/PosOrderItemsTable';
import { PosSummaryPanel } from '../components/pos/PosSummaryPanel';
import { InvoicePrintModal } from '../components/InvoicePrintModal';
import { useToast } from '../context/ToastContext';

export const QuickSalePage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showGridPicker, setShowGridPicker] = useState(true);

  const {
    customers,
    products,
    warehouses,
    loading,
    selectedCustomerId,
    setSelectedCustomerId,
    selectedSiteId,
    setSelectedSiteId,
    selectedWarehouseId,
    setSelectedWarehouseId,
    selectedCustomer,
    orderDate,
    setOrderDate,
    dueDate,
    setDueDate,
    note,
    setNote,
    items,
    discountAmount,
    setDiscountAmount,
    shippingFee,
    setShippingFee,
    paidAmount,
    setPaidAmount,
    paymentMethod,
    setPaymentMethod,
    subtotal,
    totalAmount,
    remainingDebt,
    currentCustomerDebt,
    creditLimit,
    willExceedCredit,
    submitting,
    printOrder,
    setPrintOrder,
    addProductToOrder,
    addEmptyRow,
    removeRow,
    updateRowProduct,
    updateRowUnit,
    updateRowQty,
    updateRowPrice,
    updateRowDiscount,
    submitOrder,
    resetForm,
  } = usePOS();

  const handleProcessSubmit = async (confirmNow: boolean, openPrint = false) => {
    if (!selectedCustomerId) {
      toast.warning('Vui lòng chọn khách hàng');
      return;
    }
    if (items.length === 0) {
      toast.warning('Đơn hàng cần có ít nhất 1 dòng sản phẩm');
      return;
    }

    try {
      const order = await submitOrder(confirmNow);
      if (openPrint) {
        setPrintOrder(order);
      } else {
        toast.success(
          confirmNow
            ? `Đã duyệt đơn & trừ tồn kho đơn hàng ${order.code}!`
            : `Đã lưu nháp đơn hàng ${order.code}!`,
        );
        navigate('/sales-orders');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra khi lưu đơn hàng');
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-600 font-semibold text-sm">
        Đang khởi tạo giao diện bán hàng POS...
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-4 max-w-7xl mx-auto w-full text-slate-900">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-brand-600" />
            <span>BÁN NHANH TẠI QUẦY (QUICK POS)</span>
            <span className="text-[11px] font-mono uppercase bg-brand-50 text-brand-700 border border-brand-200 px-2 py-0.5 font-bold">
              Giao hàng & Thu tiền
            </span>
          </h1>
          <p className="text-xs text-slate-600 mt-0.5 font-medium">
            Tự động áp giá theo nhóm khách · Kiểm tra tồn kho & trần công nợ tức thì
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {/* Toggle Product Grid Picker */}
          <button
            onClick={() => setShowGridPicker(!showGridPicker)}
            className={`px-3 py-1.5 text-xs font-bold rounded-sm border flex items-center gap-1.5 cursor-pointer transition-colors ${
              showGridPicker
                ? 'bg-brand-50 text-brand-800 border-brand-300'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5 text-brand-600" />
            <span>{showGridPicker ? 'Ẩn bảng lưới vật tư' : 'Mở bảng lưới vật tư'}</span>
          </button>

          <button
            onClick={resetForm}
            className="px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 border border-slate-300 bg-white rounded-sm flex items-center gap-1 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Làm mới form</span>
          </button>
        </div>
      </div>

      {/* Customer Header Info & Credit Status */}
      <PosCustomerHeader
        customers={customers}
        selectedCustomerId={selectedCustomerId}
        onCustomerChange={setSelectedCustomerId}
        selectedCustomer={selectedCustomer}
        selectedSiteId={selectedSiteId}
        onSiteChange={setSelectedSiteId}
        warehouses={warehouses}
        selectedWarehouseId={selectedWarehouseId}
        onWarehouseChange={setSelectedWarehouseId}
        currentCustomerDebt={currentCustomerDebt}
        creditLimit={creditLimit}
        willExceedCredit={willExceedCredit}
      />

      {/* Optional Interactive Visual Grid Picker */}
      {showGridPicker && (
        <div className="animate-in fade-in slide-in-from-top-1 duration-150">
          <PosProductCatalogGrid
            products={products}
            onSelectProduct={addProductToOrder}
            selectedPriceListId={selectedCustomer?.group?.priceListId}
            selectedWarehouseId={selectedWarehouseId}
          />
        </div>
      )}

      {/* Line Items Table */}
      <PosOrderItemsTable
        items={items}
        products={products}
        onAddEmptyRow={addEmptyRow}
        onRemoveRow={removeRow}
        onProductChange={updateRowProduct}
        onUnitChange={updateRowUnit}
        onQtyChange={updateRowQty}
        onPriceChange={updateRowPrice}
        onDiscountChange={updateRowDiscount}
      />

      {/* Summary, Shipping, VietQR Payment & Actions */}
      <PosSummaryPanel
        orderDate={orderDate}
        onOrderDateChange={setOrderDate}
        dueDate={dueDate}
        onDueDateChange={setDueDate}
        note={note}
        onNoteChange={setNote}
        subtotal={subtotal}
        discountAmount={discountAmount}
        onDiscountChange={setDiscountAmount}
        shippingFee={shippingFee}
        onShippingFeeChange={setShippingFee}
        totalAmount={totalAmount}
        paidAmount={paidAmount}
        onPaidAmountChange={setPaidAmount}
        remainingDebt={remainingDebt}
        paymentMethod={paymentMethod}
        onPaymentMethodChange={setPaymentMethod}
        submitting={submitting}
        onSubmitDraft={() => handleProcessSubmit(false, false)}
        onSubmitAndPrint={() => handleProcessSubmit(true, true)}
        onSubmitAndConfirm={() => handleProcessSubmit(true, false)}
      />

      {/* A4 Print Modal */}
      {printOrder && (
        <InvoicePrintModal
          order={printOrder}
          onClose={() => {
            setPrintOrder(null);
            navigate('/sales-orders');
          }}
        />
      )}
    </div>
  );
};

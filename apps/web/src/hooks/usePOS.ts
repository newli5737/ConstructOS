import { useState, useEffect, useCallback, useMemo } from 'react';
import { catalogService } from '../services/catalog.service';
import { partnersService } from '../services/partners.service';
import { inventoryService } from '../services/inventory.service';
import { salesService, CreateOrderDto } from '../services/sales.service';
import { Customer, Product, Warehouse, SalesOrder } from '../types';

export interface OrderItemRow {
  productId: string;
  productName: string;
  sku: string;
  unitName: string;
  baseUnit: string;
  factor: number;
  quantity: number;
  unitPrice: number;
  discountPct: number;
  lineTotal: number;
  availableStock: number;
  units: { unitName: string; factor: number }[];
}

export const usePOS = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [selectedSiteId, setSelectedSiteId] = useState<string>('');
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>('');
  const [orderDate, setOrderDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState<string>('');
  const [note, setNote] = useState<string>('');

  const [items, setItems] = useState<OrderItemRow[]>([]);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [shippingFee, setShippingFee] = useState<number>(0);
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'TRANSFER'>('CASH');

  const [submitting, setSubmitting] = useState(false);
  const [printOrder, setPrintOrder] = useState<SalesOrder | null>(null);

  // Fetch initial master data
  useEffect(() => {
    let isMounted = true;
    Promise.all([
      partnersService.getCustomers(),
      catalogService.getProducts(),
      inventoryService.getWarehouses(),
    ])
      .then(([cRes, pRes, wRes]) => {
        if (!isMounted) return;
        setCustomers(cRes);
        setProducts(pRes);
        setWarehouses(wRes);

        if (cRes.length > 0 && !selectedCustomerId) {
          setSelectedCustomerId(cRes[0].id);
        }
        if (wRes.length > 0 && !selectedWarehouseId) {
          setSelectedWarehouseId(wRes[0].id);
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const selectedCustomer = useMemo(
    () => customers.find((c) => c.id === selectedCustomerId),
    [customers, selectedCustomerId],
  );

  // Helper to create order item row from product
  const createRowFromProduct = useCallback(
    (product: Product): OrderItemRow => {
      const priceListId = selectedCustomer?.group?.priceListId;
      let unitPrice = 0;

      const matchPrice = product.prices?.find(
        (p) => p.priceListId === priceListId && p.unitName === product.baseUnit,
      );
      if (matchPrice) {
        unitPrice = Number(matchPrice.price);
      } else if (product.prices?.length > 0) {
        unitPrice = Number(product.prices[0].price);
      }

      const whBal = product.stockBalances?.find((b) => b.warehouseId === selectedWarehouseId);
      const availableStock = whBal ? Number(whBal.quantity) : 0;

      const units = [
        { unitName: product.baseUnit, factor: 1 },
        ...(product.units || []).map((u) => ({ unitName: u.unitName, factor: Number(u.factor) })),
      ];

      return {
        productId: product.id,
        productName: product.name,
        sku: product.sku,
        unitName: product.baseUnit,
        baseUnit: product.baseUnit,
        factor: 1,
        quantity: 1,
        unitPrice,
        discountPct: 0,
        lineTotal: unitPrice,
        availableStock,
        units,
      };
    },
    [selectedCustomer, selectedWarehouseId],
  );

  // Add product from Grid Picker or dropdown
  const addProductToOrder = useCallback(
    (product: Product) => {
      setItems((prev) => {
        const existingIndex = prev.findIndex((i) => i.productId === product.id);
        if (existingIndex >= 0) {
          const updated = [...prev];
          const row = { ...updated[existingIndex] };
          row.quantity += 1;
          row.lineTotal = row.quantity * row.unitPrice * (1 - row.discountPct / 100);
          updated[existingIndex] = row;
          return updated;
        } else {
          return [...prev, createRowFromProduct(product)];
        }
      });
    },
    [createRowFromProduct],
  );

  const addEmptyRow = useCallback(() => {
    if (products.length > 0) {
      setItems((prev) => [...prev, createRowFromProduct(products[0])]);
    }
  }, [products, createRowFromProduct]);

  const removeRow = useCallback((index: number) => {
    setItems((prev) => prev.filter((_, idx) => idx !== index));
  }, []);

  const updateRowProduct = useCallback(
    (index: number, productId: string) => {
      const product = products.find((p) => p.id === productId);
      if (!product) return;
      setItems((prev) => {
        const updated = [...prev];
        updated[index] = createRowFromProduct(product);
        return updated;
      });
    },
    [products, createRowFromProduct],
  );

  const updateRowUnit = useCallback(
    (index: number, unitName: string) => {
      setItems((prev) => {
        const updated = [...prev];
        const row = { ...updated[index] };
        const product = products.find((p) => p.id === row.productId);
        const chosenUnit = row.units.find((u) => u.unitName === unitName);
        row.unitName = unitName;
        row.factor = chosenUnit ? chosenUnit.factor : 1;

        const priceListId = selectedCustomer?.group?.priceListId;
        const matchPrice = product?.prices?.find((p) => p.priceListId === priceListId && p.unitName === unitName);
        if (matchPrice) {
          row.unitPrice = Number(matchPrice.price);
        } else if (product) {
          const baseMatch = product.prices?.find((p) => p.unitName === product.baseUnit);
          if (baseMatch) {
            row.unitPrice = Number(baseMatch.price) * row.factor;
          }
        }

        row.lineTotal = row.quantity * row.unitPrice * (1 - row.discountPct / 100);
        updated[index] = row;
        return updated;
      });
    },
    [products, selectedCustomer],
  );

  const updateRowQty = useCallback((index: number, qty: number) => {
    setItems((prev) => {
      const updated = [...prev];
      const row = { ...updated[index] };
      row.quantity = Math.max(0, qty);
      row.lineTotal = row.quantity * row.unitPrice * (1 - row.discountPct / 100);
      updated[index] = row;
      return updated;
    });
  }, []);

  const updateRowPrice = useCallback((index: number, price: number) => {
    setItems((prev) => {
      const updated = [...prev];
      const row = { ...updated[index] };
      row.unitPrice = Math.max(0, price);
      row.lineTotal = row.quantity * row.unitPrice * (1 - row.discountPct / 100);
      updated[index] = row;
      return updated;
    });
  }, []);

  const updateRowDiscount = useCallback((index: number, pct: number) => {
    setItems((prev) => {
      const updated = [...prev];
      const row = { ...updated[index] };
      row.discountPct = Math.min(100, Math.max(0, pct));
      row.lineTotal = row.quantity * row.unitPrice * (1 - row.discountPct / 100);
      updated[index] = row;
      return updated;
    });
  }, []);

  // Totals calculations
  const subtotal = useMemo(() => items.reduce((sum, item) => sum + item.lineTotal, 0), [items]);
  const totalAmount = useMemo(() => Math.max(0, subtotal - discountAmount + shippingFee), [subtotal, discountAmount, shippingFee]);
  const remainingDebt = useMemo(() => Math.max(0, totalAmount - paidAmount), [totalAmount, paidAmount]);

  // Credit limit calculations
  const currentCustomerDebt = useMemo(() => Number(selectedCustomer?.currentDebt || 0), [selectedCustomer]);
  const creditLimit = useMemo(() => Number(selectedCustomer?.creditLimit || 0), [selectedCustomer]);
  const willExceedCredit = useMemo(() => currentCustomerDebt + remainingDebt > creditLimit, [currentCustomerDebt, remainingDebt, creditLimit]);

  const submitOrder = useCallback(
    async (confirmNow: boolean) => {
      setSubmitting(true);
      try {
        const payload: CreateOrderDto = {
          customerId: selectedCustomerId,
          siteId: selectedSiteId || null,
          warehouseId: selectedWarehouseId,
          orderDate,
          dueDate: dueDate || null,
          discountAmount,
          shippingFee,
          paidAmount,
          paymentMethod,
          note,
          confirmNow,
          allowNegativeStock: true,
          items: items.map((i) => ({
            productId: i.productId,
            unitName: i.unitName,
            quantity: i.quantity,
            factor: i.factor,
            unitPrice: i.unitPrice,
            discountPct: i.discountPct,
          })),
        };

        const createdOrder = await salesService.createOrder(payload);
        return createdOrder;
      } finally {
        setSubmitting(false);
      }
    },
    [
      selectedCustomerId,
      selectedSiteId,
      selectedWarehouseId,
      orderDate,
      dueDate,
      discountAmount,
      shippingFee,
      paidAmount,
      paymentMethod,
      note,
      items,
    ],
  );

  const resetForm = useCallback(() => {
    setItems([]);
    setDiscountAmount(0);
    setShippingFee(0);
    setPaidAmount(0);
    setNote('');
  }, []);

  return {
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
  };
};


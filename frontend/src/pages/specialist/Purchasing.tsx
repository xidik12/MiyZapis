import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useCurrency } from '../../contexts/CurrencyContext';
import {
  purchasingService,
  Supplier,
  PurchaseOrder,
  PurchaseOrderItem,
  PurchasingSummary,
  SupplierData,
  POItemInput,
  POStatus,
  PO_STATUSES,
} from '../../services/purchasing.service';
import { inventoryService, Product } from '../../services/inventory.service';
import { PageLoader } from '@/components/ui';
import { toast } from 'react-toastify';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  XIcon as XMarkIcon,
  EyeIcon,
  InboxIcon as InboxArrowDownIcon,
  ClipboardDocumentListIcon,
  CurrencyDollarIcon,
  ArrowPathIcon,
  BuildingStorefrontIcon,
  BuildingStorefrontIcon as ShoppingCartIcon,
  NoSymbolIcon,
} from '@/components/icons';

type Currency = 'USD' | 'EUR' | 'UAH';
type Tab = 'orders' | 'suppliers';

const asCurrency = (c?: string | null): Currency =>
  c === 'USD' || c === 'EUR' || c === 'UAH' ? c : 'UAH';

const num = (v: number | string | null | undefined): number => {
  if (v === null || v === undefined) return 0;
  const n = typeof v === 'number' ? v : parseFloat(v);
  return Number.isFinite(n) ? n : 0;
};

// ---------- Status badge styling ----------
const STATUS_BADGE: Record<POStatus, string> = {
  DRAFT: 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300',
  ORDERED: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
  PARTIAL: 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400',
  RECEIVED: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
  CANCELLED: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
};

// ---------- Forms ----------
interface SupplierFormData {
  name: string;
  email: string;
  phone: string;
  address: string;
  taxId: string;
  notes: string;
}

const emptySupplierForm: SupplierFormData = {
  name: '',
  email: '',
  phone: '',
  address: '',
  taxId: '',
  notes: '',
};

interface LineRow {
  productId: string;
  description: string;
  quantity: string;
  unitCost: string;
}

const emptyLine: LineRow = { productId: '', description: '', quantity: '1', unitCost: '0' };

const SpecialistPurchasing: React.FC = () => {
  const { t, language } = useLanguage();
  const { formatPrice } = useCurrency();

  const [tab, setTab] = useState<Tab>('orders');
  const [loading, setLoading] = useState(true);

  // Data
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [summary, setSummary] = useState<PurchasingSummary | null>(null);

  // Filters
  const [filterStatus, setFilterStatus] = useState<POStatus | ''>('');

  // Supplier modal
  const [supplierModalOpen, setSupplierModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [supplierForm, setSupplierForm] = useState<SupplierFormData>(emptySupplierForm);
  const [savingSupplier, setSavingSupplier] = useState(false);
  const [deletingSupplier, setDeletingSupplier] = useState<string | null>(null);

  // PO modal
  const [poModalOpen, setPoModalOpen] = useState(false);
  const [poSupplierId, setPoSupplierId] = useState('');
  const [poCurrency, setPoCurrency] = useState('UAH');
  const [poNotes, setPoNotes] = useState('');
  const [poTax, setPoTax] = useState('0');
  const [poLines, setPoLines] = useState<LineRow[]>([{ ...emptyLine }]);
  const [savingPO, setSavingPO] = useState(false);

  // PO detail / view modal
  const [viewPO, setViewPO] = useState<PurchaseOrder | null>(null);
  const [loadingView, setLoadingView] = useState(false);

  // Receive modal
  const [receivePO, setReceivePO] = useState<PurchaseOrder | null>(null);
  const [receiveQtys, setReceiveQtys] = useState<Record<string, string>>({});
  const [receiving, setReceiving] = useState(false);

  // Row action busy state
  const [busyOrder, setBusyOrder] = useState<string | null>(null);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterStatus]);

  const loadData = async () => {
    try {
      setLoading(true);
      const filters = filterStatus ? { status: filterStatus } : {};
      const [ordersRes, suppliersRes, summaryRes, productsRes] = await Promise.all([
        purchasingService.getOrders(filters),
        purchasingService.getSuppliers(),
        purchasingService.getSummary(),
        inventoryService.getProducts().catch(() => [] as Product[]),
      ]);
      setOrders(ordersRes || []);
      setSuppliers(suppliersRes || []);
      setSummary(summaryRes);
      setProducts(productsRes || []);
    } catch (error: unknown) {
      console.error('Error loading purchasing data:', error);
      toast.error(t('purchasing.loadError') || 'Failed to load purchasing data');
    } finally {
      setLoading(false);
    }
  };

  // ---------- Status label ----------
  const getStatusLabel = (status: POStatus): string => {
    const labels: Record<POStatus, Record<string, string>> = {
      DRAFT: { en: 'Draft', uk: 'Чернетка', ru: 'Черновик' },
      ORDERED: { en: 'Ordered', uk: 'Замовлено', ru: 'Заказано' },
      PARTIAL: { en: 'Partial', uk: 'Частково', ru: 'Частично' },
      RECEIVED: { en: 'Received', uk: 'Отримано', ru: 'Получено' },
      CANCELLED: { en: 'Cancelled', uk: 'Скасовано', ru: 'Отменено' },
    };
    return labels[status]?.[language] || labels[status]?.en || status;
  };

  const supplierName = (po: PurchaseOrder): string => {
    if (po.supplierName) return po.supplierName;
    if (po.supplier?.name) return po.supplier.name;
    const s = suppliers.find((x) => x.id === po.supplierId);
    return s?.name || (t('purchasing.noSupplier') || '—');
  };

  // ---------- Supplier handlers ----------
  const openNewSupplier = () => {
    setEditingSupplier(null);
    setSupplierForm(emptySupplierForm);
    setSupplierModalOpen(true);
  };

  const openEditSupplier = (s: Supplier) => {
    setEditingSupplier(s);
    setSupplierForm({
      name: s.name,
      email: s.email || '',
      phone: s.phone || '',
      address: s.address || '',
      taxId: s.taxId || '',
      notes: s.notes || '',
    });
    setSupplierModalOpen(true);
  };

  const handleSupplierSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierForm.name.trim()) {
      toast.error(t('purchasing.supplierNameRequired') || 'Supplier name is required');
      return;
    }
    try {
      setSavingSupplier(true);
      const data: SupplierData = {
        name: supplierForm.name.trim(),
        email: supplierForm.email.trim() || null,
        phone: supplierForm.phone.trim() || null,
        address: supplierForm.address.trim() || null,
        taxId: supplierForm.taxId.trim() || null,
        notes: supplierForm.notes.trim() || null,
      };
      if (editingSupplier) {
        await purchasingService.updateSupplier(editingSupplier.id, data);
        toast.success(t('purchasing.supplierUpdated') || 'Supplier updated');
      } else {
        await purchasingService.createSupplier(data);
        toast.success(t('purchasing.supplierCreated') || 'Supplier created');
      }
      setSupplierModalOpen(false);
      loadData();
    } catch (error: unknown) {
      toast.error((error as Error).message || t('purchasing.saveError') || 'Failed to save');
    } finally {
      setSavingSupplier(false);
    }
  };

  const handleDeleteSupplier = async (id: string) => {
    if (!confirm(t('purchasing.confirmDeleteSupplier') || 'Deactivate this supplier?')) return;
    try {
      setDeletingSupplier(id);
      await purchasingService.deleteSupplier(id);
      toast.success(t('purchasing.supplierDeleted') || 'Supplier deactivated');
      loadData();
    } catch (error: unknown) {
      toast.error((error as Error).message || t('purchasing.deleteError') || 'Failed to delete');
    } finally {
      setDeletingSupplier(null);
    }
  };

  // ---------- PO create handlers ----------
  const openNewPO = () => {
    setPoSupplierId('');
    setPoCurrency('UAH');
    setPoNotes('');
    setPoTax('0');
    setPoLines([{ ...emptyLine }]);
    setPoModalOpen(true);
  };

  const updateLine = (idx: number, patch: Partial<LineRow>) => {
    setPoLines((prev) => prev.map((l, i) => (i === idx ? { ...l, ...patch } : l)));
  };

  const onPickProduct = (idx: number, productId: string) => {
    const product = products.find((p) => p.id === productId);
    if (product) {
      updateLine(idx, {
        productId,
        description: product.name,
        unitCost: String(num(product.costPrice)),
      });
    } else {
      updateLine(idx, { productId: '' });
    }
  };

  const addLine = () => setPoLines((prev) => [...prev, { ...emptyLine }]);
  const removeLine = (idx: number) =>
    setPoLines((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev));

  const poSubtotal = poLines.reduce((sum, l) => sum + num(l.quantity) * num(l.unitCost), 0);
  const poTotal = poSubtotal + num(poTax);

  const handlePOSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validLines = poLines.filter((l) => l.description.trim() && num(l.quantity) > 0);
    if (validLines.length === 0) {
      toast.error(t('purchasing.lineItemsRequired') || 'Add at least one line item');
      return;
    }
    try {
      setSavingPO(true);
      const items: POItemInput[] = validLines.map((l) => ({
        productId: l.productId || null,
        description: l.description.trim(),
        quantity: num(l.quantity),
        unitCost: num(l.unitCost),
      }));
      await purchasingService.createOrder({
        supplierId: poSupplierId || null,
        currency: poCurrency,
        notes: poNotes.trim() || null,
        taxAmount: num(poTax),
        items,
      });
      toast.success(t('purchasing.poCreated') || 'Purchase order created');
      setPoModalOpen(false);
      loadData();
    } catch (error: unknown) {
      toast.error((error as Error).message || t('purchasing.saveError') || 'Failed to save');
    } finally {
      setSavingPO(false);
    }
  };

  // ---------- PO row actions ----------
  const openView = async (po: PurchaseOrder) => {
    setViewPO(po);
    setLoadingView(true);
    try {
      const full = await purchasingService.getOrderById(po.id);
      setViewPO(full);
    } catch {
      // keep the summary version
    } finally {
      setLoadingView(false);
    }
  };

  const openReceive = async (po: PurchaseOrder) => {
    try {
      setBusyOrder(po.id);
      const full = await purchasingService.getOrderById(po.id);
      const qtys: Record<string, string> = {};
      (full.items || []).forEach((it) => {
        // Default each line to its remaining quantity.
        const remaining = num(it.quantity) - num(it.receivedQty);
        qtys[it.id] = String(remaining > 0 ? remaining : 0);
      });
      setReceiveQtys(qtys);
      setReceivePO(full);
    } catch (error: unknown) {
      toast.error((error as Error).message || t('purchasing.loadError') || 'Failed to load');
    } finally {
      setBusyOrder(null);
    }
  };

  const handleReceiveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!receivePO) return;
    try {
      setReceiving(true);
      // Build cumulative targets: already-received + newly-entered amount.
      const receipts = (receivePO.items || []).map((it) => ({
        itemId: it.id,
        receivedQty: num(it.receivedQty) + num(receiveQtys[it.id] || '0'),
      }));
      await purchasingService.receiveOrder(receivePO.id, receipts);
      toast.success(t('purchasing.poReceived') || 'Purchase order received');
      setReceivePO(null);
      loadData();
    } catch (error: unknown) {
      toast.error((error as Error).message || t('purchasing.receiveError') || 'Failed to receive');
    } finally {
      setReceiving(false);
    }
  };

  const handleCancel = async (po: PurchaseOrder) => {
    if (!confirm(t('purchasing.confirmCancel') || 'Cancel this purchase order?')) return;
    try {
      setBusyOrder(po.id);
      await purchasingService.setStatus(po.id, 'CANCELLED');
      toast.success(t('purchasing.poCancelled') || 'Purchase order cancelled');
      loadData();
    } catch (error: unknown) {
      toast.error((error as Error).message || t('purchasing.saveError') || 'Failed to update');
    } finally {
      setBusyOrder(null);
    }
  };

  const handleDeletePO = async (po: PurchaseOrder) => {
    if (!confirm(t('purchasing.confirmDeletePO') || 'Delete this draft purchase order?')) return;
    try {
      setBusyOrder(po.id);
      await purchasingService.deleteOrder(po.id);
      toast.success(t('purchasing.poDeleted') || 'Purchase order deleted');
      loadData();
    } catch (error: unknown) {
      toast.error((error as Error).message || t('purchasing.deleteError') || 'Failed to delete');
    } finally {
      setBusyOrder(null);
    }
  };

  const handleMarkOrdered = async (po: PurchaseOrder) => {
    try {
      setBusyOrder(po.id);
      await purchasingService.setStatus(po.id, 'ORDERED');
      toast.success(t('purchasing.poOrdered') || 'Marked as ordered');
      loadData();
    } catch (error: unknown) {
      toast.error((error as Error).message || t('purchasing.saveError') || 'Failed to update');
    } finally {
      setBusyOrder(null);
    }
  };

  if (loading && orders.length === 0 && suppliers.length === 0) {
    return <PageLoader text={t('purchasing.loading') || 'Loading purchasing...'} />;
  }

  const summaryCurrency = asCurrency(summary?.currency);
  const counts = summary?.countsByStatus || {};
  const activeCount = (counts.DRAFT || 0) + (counts.ORDERED || 0) + (counts.PARTIAL || 0);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              {t('purchasing.title') || 'Purchasing'}
            </h1>
            <p className="mt-1 text-gray-600 dark:text-gray-400">
              {t('purchasing.subtitle') || 'Manage suppliers and purchase orders'}
            </p>
          </div>
          <button
            onClick={tab === 'orders' ? openNewPO : openNewSupplier}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-medium transition-colors"
          >
            <PlusIcon className="h-5 w-5" />
            {tab === 'orders'
              ? (t('purchasing.newPO') || 'New PO')
              : (t('purchasing.addSupplier') || 'Add Supplier')}
          </button>
        </div>

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover-lift">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-xl">
                  <CurrencyDollarIcon className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {t('purchasing.outstandingValue') || 'Outstanding Value'}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {formatPrice(summary.totalOutstanding || 0, summaryCurrency)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover-lift">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
                  <InboxArrowDownIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {t('purchasing.spentThisMonth') || 'Spent This Month'}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {formatPrice(summary.totalSpentThisMonth || 0, summaryCurrency)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover-lift">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary-100 dark:bg-primary-900/30 rounded-xl">
                  <ClipboardDocumentListIcon className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {t('purchasing.openOrders') || 'Open Orders'}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {activeCount}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setTab('orders')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              tab === 'orders'
                ? 'border-primary-600 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <ShoppingCartIcon className="h-5 w-5" />
            {t('purchasing.purchaseOrders') || 'Purchase Orders'}
          </button>
          <button
            onClick={() => setTab('suppliers')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              tab === 'suppliers'
                ? 'border-primary-600 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <BuildingStorefrontIcon className="h-5 w-5" />
            {t('purchasing.suppliers') || 'Suppliers'}
          </button>
        </div>

        {/* ===================== ORDERS TAB ===================== */}
        {tab === 'orders' && (
          <>
            {/* Status filter */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6">
              <div className="flex flex-col sm:flex-row gap-4 items-end">
                <div className="flex-1 max-w-xs">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('purchasing.status') || 'Status'}
                  </label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value as POStatus | '')}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">{t('purchasing.allStatuses') || 'All Statuses'}</option>
                    {PO_STATUSES.map((s) => (
                      <option key={s} value={s}>{getStatusLabel(s)}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Orders table */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {t('purchasing.purchaseOrders') || 'Purchase Orders'}
                </h2>
              </div>

              {orders.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="mx-auto w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
                    <ShoppingCartIcon className="h-8 w-8 text-gray-500 dark:text-gray-400" />
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    {t('purchasing.noOrders') || 'No purchase orders yet'}
                  </p>
                  <button
                    onClick={openNewPO}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors"
                  >
                    <PlusIcon className="h-5 w-5" />
                    {t('purchasing.createFirstPO') || 'Create your first PO'}
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                        <th scope="col" className="px-6 py-3 font-medium">{t('purchasing.poNumber') || 'PO #'}</th>
                        <th scope="col" className="px-6 py-3 font-medium">{t('purchasing.supplier') || 'Supplier'}</th>
                        <th scope="col" className="px-6 py-3 font-medium">{t('purchasing.status') || 'Status'}</th>
                        <th scope="col" className="px-6 py-3 font-medium text-right">{t('purchasing.total') || 'Total'}</th>
                        <th scope="col" className="px-6 py-3 font-medium">{t('purchasing.date') || 'Date'}</th>
                        <th scope="col" className="px-6 py-3 font-medium text-right"><span className="sr-only">{t('common.actions') || 'Actions'}</span></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {orders.map((po) => {
                        const poCur = asCurrency(po.currency);
                        const canReceive = po.status === 'ORDERED' || po.status === 'PARTIAL' || po.status === 'DRAFT';
                        const canCancel = po.status !== 'RECEIVED' && po.status !== 'CANCELLED';
                        const isBusy = busyOrder === po.id;
                        return (
                          <tr key={po.id} className="hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors align-top">
                            <td className="px-6 py-4">
                              <p className="font-medium text-gray-900 dark:text-white whitespace-nowrap">{po.poNumber}</p>
                              {po.itemCount != null && (
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {po.itemCount} {t('purchasing.items') || 'items'}
                                </p>
                              )}
                            </td>
                            <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{supplierName(po)}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_BADGE[po.status]}`}>
                                {getStatusLabel(po.status)}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right font-medium text-gray-900 dark:text-white">
                              {formatPrice(num(po.total), poCur)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-gray-600 dark:text-gray-300">
                              {new Date(po.createdAt).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right">
                              <div className="inline-flex items-center gap-1">
                                <button
                                  onClick={() => openView(po)}
                                  aria-label={t('purchasing.view') || 'View'}
                                  className="p-2 text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                                >
                                  <EyeIcon className="h-4 w-4" />
                                </button>
                                {po.status === 'DRAFT' && (
                                  <button
                                    onClick={() => handleMarkOrdered(po)}
                                    disabled={isBusy}
                                    aria-label={t('purchasing.markOrdered') || 'Mark ordered'}
                                    className="p-2 text-gray-500 dark:text-gray-400 hover:text-amber-600 dark:hover:text-amber-400 transition-colors disabled:opacity-50"
                                  >
                                    <ClipboardDocumentListIcon className="h-4 w-4" />
                                  </button>
                                )}
                                {canReceive && (
                                  <button
                                    onClick={() => openReceive(po)}
                                    disabled={isBusy}
                                    aria-label={t('purchasing.receive') || 'Receive'}
                                    className="p-2 text-gray-500 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors disabled:opacity-50"
                                  >
                                    <InboxArrowDownIcon className="h-4 w-4" />
                                  </button>
                                )}
                                {canCancel && (
                                  <button
                                    onClick={() => handleCancel(po)}
                                    disabled={isBusy}
                                    aria-label={t('purchasing.cancel') || 'Cancel'}
                                    className="p-2 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors disabled:opacity-50"
                                  >
                                    <NoSymbolIcon className="h-4 w-4" />
                                  </button>
                                )}
                                {po.status === 'DRAFT' && (
                                  <button
                                    onClick={() => handleDeletePO(po)}
                                    disabled={isBusy}
                                    aria-label={t('common.delete') || 'Delete'}
                                    className="p-2 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors disabled:opacity-50"
                                  >
                                    {isBusy ? <ArrowPathIcon className="h-4 w-4 animate-spin" /> : <TrashIcon className="h-4 w-4" />}
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

        {/* ===================== SUPPLIERS TAB ===================== */}
        {tab === 'suppliers' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {t('purchasing.suppliers') || 'Suppliers'}
              </h2>
            </div>

            {suppliers.length === 0 ? (
              <div className="p-8 text-center">
                <div className="mx-auto w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
                  <BuildingStorefrontIcon className="h-8 w-8 text-gray-500 dark:text-gray-400" />
                </div>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {t('purchasing.noSuppliers') || 'No suppliers yet'}
                </p>
                <button
                  onClick={openNewSupplier}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors"
                >
                  <PlusIcon className="h-5 w-5" />
                  {t('purchasing.addFirstSupplier') || 'Add your first supplier'}
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      <th scope="col" className="px-6 py-3 font-medium">{t('purchasing.name') || 'Name'}</th>
                      <th scope="col" className="px-6 py-3 font-medium">{t('purchasing.email') || 'Email'}</th>
                      <th scope="col" className="px-6 py-3 font-medium">{t('purchasing.phone') || 'Phone'}</th>
                      <th scope="col" className="px-6 py-3 font-medium">{t('purchasing.taxId') || 'Tax ID'}</th>
                      <th scope="col" className="px-6 py-3 font-medium text-right"><span className="sr-only">{t('common.actions') || 'Actions'}</span></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {suppliers.map((s) => (
                      <tr key={s.id} className={`hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors align-top ${!s.isActive ? 'opacity-50' : ''}`}>
                        <td className="px-6 py-4">
                          <p className="font-medium text-gray-900 dark:text-white">{s.name}</p>
                          {s.address && <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-xs">{s.address}</p>}
                          {!s.isActive && (
                            <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 mt-1">
                              {t('purchasing.inactive') || 'Inactive'}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                          {s.email || <span className="text-gray-400 dark:text-gray-600">—</span>}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-600 dark:text-gray-300">
                          {s.phone || <span className="text-gray-400 dark:text-gray-600">—</span>}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-600 dark:text-gray-300">
                          {s.taxId || <span className="text-gray-400 dark:text-gray-600">—</span>}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="inline-flex items-center gap-1">
                            <button
                              onClick={() => openEditSupplier(s)}
                              aria-label={t('purchasing.editSupplier') || 'Edit supplier'}
                              className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                            >
                              <PencilIcon className="h-4 w-4" />
                            </button>
                            {s.isActive && (
                              <button
                                onClick={() => handleDeleteSupplier(s.id)}
                                disabled={deletingSupplier === s.id}
                                aria-label={t('common.delete') || 'Delete'}
                                className="p-2 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors disabled:opacity-50"
                              >
                                {deletingSupplier === s.id ? <ArrowPathIcon className="h-4 w-4 animate-spin" /> : <TrashIcon className="h-4 w-4" />}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ===================== Supplier Modal ===================== */}
        {supplierModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {editingSupplier
                    ? (t('purchasing.editSupplier') || 'Edit Supplier')
                    : (t('purchasing.addSupplier') || 'Add Supplier')}
                </h2>
                <button
                  onClick={() => setSupplierModalOpen(false)}
                  className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handleSupplierSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('purchasing.name') || 'Name'} *
                  </label>
                  <input
                    type="text"
                    value={supplierForm.name}
                    onChange={(e) => setSupplierForm({ ...supplierForm, name: e.target.value })}
                    placeholder={t('purchasing.supplierNamePlaceholder') || 'e.g., MedSupply Ltd'}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                    required
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t('purchasing.email') || 'Email'}
                    </label>
                    <input
                      type="email"
                      value={supplierForm.email}
                      onChange={(e) => setSupplierForm({ ...supplierForm, email: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t('purchasing.phone') || 'Phone'}
                    </label>
                    <input
                      type="text"
                      value={supplierForm.phone}
                      onChange={(e) => setSupplierForm({ ...supplierForm, phone: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('purchasing.address') || 'Address'}
                  </label>
                  <input
                    type="text"
                    value={supplierForm.address}
                    onChange={(e) => setSupplierForm({ ...supplierForm, address: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('purchasing.taxId') || 'Tax ID'}
                  </label>
                  <input
                    type="text"
                    value={supplierForm.taxId}
                    onChange={(e) => setSupplierForm({ ...supplierForm, taxId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('purchasing.notes') || 'Notes'}
                  </label>
                  <textarea
                    value={supplierForm.notes}
                    onChange={(e) => setSupplierForm({ ...supplierForm, notes: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 resize-none"
                  />
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setSupplierModalOpen(false)}
                    className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    {t('common.cancel') || 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    disabled={savingSupplier}
                    className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    {savingSupplier && <ArrowPathIcon className="h-4 w-4 animate-spin" />}
                    {editingSupplier ? (t('common.save') || 'Save') : (t('purchasing.create') || 'Create')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ===================== New PO Modal ===================== */}
        {poModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {t('purchasing.newPO') || 'New Purchase Order'}
                </h2>
                <button
                  onClick={() => setPoModalOpen(false)}
                  className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handlePOSubmit} className="p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t('purchasing.supplier') || 'Supplier'}
                    </label>
                    <select
                      value={poSupplierId}
                      onChange={(e) => setPoSupplierId(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="">{t('purchasing.noSupplier') || 'No supplier'}</option>
                      {suppliers.filter((s) => s.isActive).map((s) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t('purchasing.currency') || 'Currency'}
                    </label>
                    <select
                      value={poCurrency}
                      onChange={(e) => setPoCurrency(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="UAH">UAH</option>
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                    </select>
                  </div>
                </div>

                {/* Line items */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      {t('purchasing.lineItems') || 'Line Items'}
                    </label>
                    <button
                      type="button"
                      onClick={addLine}
                      className="inline-flex items-center gap-1 text-sm text-primary-600 dark:text-primary-400 hover:underline"
                    >
                      <PlusIcon className="h-4 w-4" />
                      {t('purchasing.addLine') || 'Add line'}
                    </button>
                  </div>
                  <div className="space-y-2">
                    {poLines.map((line, idx) => (
                      <div key={idx} className="grid grid-cols-12 gap-2 items-start">
                        <div className="col-span-12 sm:col-span-5">
                          <select
                            value={line.productId}
                            onChange={(e) => onPickProduct(idx, e.target.value)}
                            className="w-full px-2 py-2 mb-1 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                          >
                            <option value="">{t('purchasing.freeText') || 'Free text item'}</option>
                            {products.map((p) => (
                              <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                          </select>
                          <input
                            type="text"
                            value={line.description}
                            onChange={(e) => updateLine(idx, { description: e.target.value })}
                            placeholder={t('purchasing.description') || 'Description'}
                            className="w-full px-2 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                          />
                        </div>
                        <div className="col-span-4 sm:col-span-2">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={line.quantity}
                            onChange={(e) => updateLine(idx, { quantity: e.target.value })}
                            placeholder={t('purchasing.qty') || 'Qty'}
                            className="w-full px-2 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                          />
                        </div>
                        <div className="col-span-4 sm:col-span-2">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={line.unitCost}
                            onChange={(e) => updateLine(idx, { unitCost: e.target.value })}
                            placeholder={t('purchasing.unitCost') || 'Cost'}
                            className="w-full px-2 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                          />
                        </div>
                        <div className="col-span-3 sm:col-span-2 text-right text-sm text-gray-700 dark:text-gray-300 py-2 whitespace-nowrap">
                          {formatPrice(num(line.quantity) * num(line.unitCost), asCurrency(poCurrency))}
                        </div>
                        <div className="col-span-1 flex justify-end">
                          <button
                            type="button"
                            onClick={() => removeLine(idx)}
                            disabled={poLines.length === 1}
                            aria-label={t('common.delete') || 'Delete'}
                            className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors disabled:opacity-30"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tax + totals */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t('purchasing.taxAmount') || 'Tax Amount'}
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={poTax}
                      onChange={(e) => setPoTax(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div className="text-right space-y-1">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {t('purchasing.subtotal') || 'Subtotal'}: <span className="font-medium text-gray-900 dark:text-white">{formatPrice(poSubtotal, asCurrency(poCurrency))}</span>
                    </p>
                    <p className="text-base font-semibold text-gray-900 dark:text-white">
                      {t('purchasing.total') || 'Total'}: {formatPrice(poTotal, asCurrency(poCurrency))}
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('purchasing.notes') || 'Notes'}
                  </label>
                  <textarea
                    value={poNotes}
                    onChange={(e) => setPoNotes(e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 resize-none"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setPoModalOpen(false)}
                    className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    {t('common.cancel') || 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    disabled={savingPO}
                    className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    {savingPO && <ArrowPathIcon className="h-4 w-4 animate-spin" />}
                    {t('purchasing.createPO') || 'Create PO'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ===================== View PO Modal ===================== */}
        {viewPO && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{viewPO.poNumber}</h2>
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium mt-1 ${STATUS_BADGE[viewPO.status]}`}>
                    {getStatusLabel(viewPO.status)}
                  </span>
                </div>
                <button
                  onClick={() => setViewPO(null)}
                  className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500 dark:text-gray-400">{t('purchasing.supplier') || 'Supplier'}</p>
                    <p className="font-medium text-gray-900 dark:text-white">{supplierName(viewPO)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 dark:text-gray-400">{t('purchasing.date') || 'Date'}</p>
                    <p className="font-medium text-gray-900 dark:text-white">{new Date(viewPO.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>

                {loadingView ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t('purchasing.loading') || 'Loading...'}</p>
                ) : (
                  <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200 dark:border-gray-700 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                          <th className="px-4 py-2">{t('purchasing.description') || 'Description'}</th>
                          <th className="px-4 py-2 text-right">{t('purchasing.qty') || 'Qty'}</th>
                          <th className="px-4 py-2 text-right">{t('purchasing.received') || 'Recv'}</th>
                          <th className="px-4 py-2 text-right">{t('purchasing.unitCost') || 'Cost'}</th>
                          <th className="px-4 py-2 text-right">{t('purchasing.lineTotal') || 'Total'}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {(viewPO.items || []).map((it: PurchaseOrderItem) => (
                          <tr key={it.id}>
                            <td className="px-4 py-2 text-gray-900 dark:text-white">{it.description}</td>
                            <td className="px-4 py-2 text-right text-gray-600 dark:text-gray-300">{num(it.quantity)}</td>
                            <td className="px-4 py-2 text-right text-gray-600 dark:text-gray-300">{num(it.receivedQty)}</td>
                            <td className="px-4 py-2 text-right text-gray-600 dark:text-gray-300">{formatPrice(num(it.unitCost), asCurrency(viewPO.currency))}</td>
                            <td className="px-4 py-2 text-right text-gray-900 dark:text-white">{formatPrice(num(it.quantity) * num(it.unitCost), asCurrency(viewPO.currency))}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <div className="text-right space-y-1 text-sm">
                  <p className="text-gray-600 dark:text-gray-400">
                    {t('purchasing.subtotal') || 'Subtotal'}: <span className="text-gray-900 dark:text-white">{formatPrice(num(viewPO.subtotal), asCurrency(viewPO.currency))}</span>
                  </p>
                  <p className="text-gray-600 dark:text-gray-400">
                    {t('purchasing.taxAmount') || 'Tax'}: <span className="text-gray-900 dark:text-white">{formatPrice(num(viewPO.taxAmount), asCurrency(viewPO.currency))}</span>
                  </p>
                  <p className="text-base font-semibold text-gray-900 dark:text-white">
                    {t('purchasing.total') || 'Total'}: {formatPrice(num(viewPO.total), asCurrency(viewPO.currency))}
                  </p>
                </div>

                {viewPO.notes && (
                  <div className="text-sm">
                    <p className="text-gray-500 dark:text-gray-400">{t('purchasing.notes') || 'Notes'}</p>
                    <p className="text-gray-900 dark:text-white">{viewPO.notes}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ===================== Receive Modal ===================== */}
        {receivePO && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {t('purchasing.receivePO') || 'Receive Purchase Order'}
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{receivePO.poNumber}</p>
                </div>
                <button
                  onClick={() => setReceivePO(null)}
                  className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handleReceiveSubmit} className="p-6 space-y-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {t('purchasing.receiveHint') || 'Enter the quantity received now for each line. Linked products will have their stock incremented.'}
                </p>
                <div className="space-y-3">
                  {(receivePO.items || []).map((it) => {
                    const ordered = num(it.quantity);
                    const already = num(it.receivedQty);
                    const remaining = ordered - already;
                    return (
                      <div key={it.id} className="flex items-center gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{it.description}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {t('purchasing.ordered') || 'Ordered'}: {ordered} · {t('purchasing.received') || 'Received'}: {already}
                            {it.productId && <span className="ml-1 text-primary-600 dark:text-primary-400">· {t('purchasing.linked') || 'linked'}</span>}
                          </p>
                        </div>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          max={remaining > 0 ? remaining : undefined}
                          value={receiveQtys[it.id] ?? ''}
                          onChange={(e) => setReceiveQtys({ ...receiveQtys, [it.id]: e.target.value })}
                          className="w-28 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                        />
                      </div>
                    );
                  })}
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setReceivePO(null)}
                    className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    {t('common.cancel') || 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    disabled={receiving}
                    className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    {receiving && <ArrowPathIcon className="h-4 w-4 animate-spin" />}
                    {t('purchasing.confirmReceive') || 'Confirm Receipt'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SpecialistPurchasing;

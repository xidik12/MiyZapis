import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useCurrency } from '../../contexts/CurrencyContext';
import {
  inventoryService,
  Product,
  InventorySummary,
  ProductType,
  StockReason,
  PRODUCT_TYPES,
  STOCK_REASONS,
  CreateProductData,
  UpdateProductData,
} from '../../services/inventory.service';
import { PageLoader } from '@/components/ui';
import { toast } from 'react-toastify';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon,
  CubeIcon,
  ArchiveBoxIcon,
  ExclamationTriangleIcon,
  CurrencyDollarIcon,
  ArrowPathIcon,
  ArrowsUpDownIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';

type Currency = 'USD' | 'EUR' | 'UAH';

const asCurrency = (c?: string | null): Currency =>
  c === 'USD' || c === 'EUR' || c === 'UAH' ? c : 'UAH';

const num = (v: number | string | null | undefined): number => {
  if (v === null || v === undefined) return 0;
  const n = typeof v === 'number' ? v : parseFloat(v);
  return Number.isFinite(n) ? n : 0;
};

interface ProductFormData {
  sku: string;
  name: string;
  description: string;
  type: ProductType;
  unit: string;
  costPrice: string;
  salePrice: string;
  stockQty: string;
  reorderLevel: string;
  currency: string;
}

const initialFormData: ProductFormData = {
  sku: '',
  name: '',
  description: '',
  type: 'CONSUMABLE',
  unit: 'unit',
  costPrice: '',
  salePrice: '',
  stockQty: '0',
  reorderLevel: '0',
  currency: 'UAH',
};

interface AdjustFormData {
  delta: string;
  reason: StockReason;
  reference: string;
}

const initialAdjustData: AdjustFormData = {
  delta: '',
  reason: 'PURCHASE',
  reference: '',
};

const SpecialistInventory: React.FC = () => {
  const { t, language } = useLanguage();
  const { formatPrice } = useCurrency();

  // State
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [summary, setSummary] = useState<InventorySummary | null>(null);

  // Add/Edit modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<ProductFormData>(initialFormData);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Adjust modal
  const [adjustProduct, setAdjustProduct] = useState<Product | null>(null);
  const [adjustData, setAdjustData] = useState<AdjustFormData>(initialAdjustData);
  const [adjusting, setAdjusting] = useState(false);

  // Filters
  const [filterType, setFilterType] = useState<ProductType | ''>('');
  const [filterLowStock, setFilterLowStock] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterType, filterLowStock, search]);

  const loadData = async () => {
    try {
      setLoading(true);
      const filters: Record<string, unknown> = {};
      if (filterType) filters.type = filterType;
      if (filterLowStock) filters.lowStock = true;
      if (search.trim()) filters.search = search.trim();

      const [productsResponse, summaryResponse] = await Promise.all([
        inventoryService.getProducts(filters),
        inventoryService.getSummary(),
      ]);

      setProducts(productsResponse || []);
      setSummary(summaryResponse);
    } catch (error: unknown) {
      console.error('Error loading inventory:', error);
      toast.error(t('inventory.loadError') || 'Failed to load inventory');
    } finally {
      setLoading(false);
    }
  };

  const isLowStock = (p: Product): boolean => {
    const reorder = num(p.reorderLevel);
    return reorder > 0 && num(p.stockQty) <= reorder;
  };

  // Open modal for new product
  const handleAddProduct = () => {
    setEditingProduct(null);
    setFormData(initialFormData);
    setIsModalOpen(true);
  };

  // Open modal for editing
  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      sku: product.sku || '',
      name: product.name,
      description: product.description || '',
      type: product.type,
      unit: product.unit || 'unit',
      costPrice: String(num(product.costPrice)),
      salePrice: product.salePrice != null ? String(num(product.salePrice)) : '',
      stockQty: String(num(product.stockQty)),
      reorderLevel: String(num(product.reorderLevel)),
      currency: product.currency || 'UAH',
    });
    setIsModalOpen(true);
  };

  // Submit add/edit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error(t('inventory.nameRequired') || 'Name is required');
      return;
    }

    const costPrice = parseFloat(formData.costPrice || '0');
    if (isNaN(costPrice) || costPrice < 0) {
      toast.error(t('inventory.invalidCostPrice') || 'Please enter a valid cost price');
      return;
    }

    try {
      setSubmitting(true);

      const salePrice = formData.salePrice.trim() ? parseFloat(formData.salePrice) : null;

      if (editingProduct) {
        const data: UpdateProductData = {
          sku: formData.sku.trim() || undefined,
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
          type: formData.type,
          unit: formData.unit.trim() || 'unit',
          costPrice,
          salePrice,
          reorderLevel: parseFloat(formData.reorderLevel || '0'),
          currency: formData.currency,
        };
        await inventoryService.updateProduct(editingProduct.id, data);
        toast.success(t('inventory.productUpdated') || 'Product updated');
      } else {
        const data: CreateProductData = {
          sku: formData.sku.trim() || undefined,
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
          type: formData.type,
          unit: formData.unit.trim() || 'unit',
          costPrice,
          salePrice,
          stockQty: parseFloat(formData.stockQty || '0'),
          reorderLevel: parseFloat(formData.reorderLevel || '0'),
          currency: formData.currency,
        };
        await inventoryService.createProduct(data);
        toast.success(t('inventory.productCreated') || 'Product created');
      }

      setIsModalOpen(false);
      loadData();
    } catch (error: unknown) {
      console.error('Error saving product:', error);
      toast.error((error as Error).message || t('inventory.saveError') || 'Failed to save product');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete product
  const handleDelete = async (id: string) => {
    if (!confirm(t('inventory.confirmDelete') || 'Are you sure you want to delete this product?')) {
      return;
    }

    try {
      setDeleting(id);
      await inventoryService.deleteProduct(id);
      toast.success(t('inventory.productDeleted') || 'Product deleted');
      loadData();
    } catch (error: unknown) {
      console.error('Error deleting product:', error);
      toast.error((error as Error).message || t('inventory.deleteError') || 'Failed to delete product');
    } finally {
      setDeleting(null);
    }
  };

  // Open adjust stock modal
  const handleOpenAdjust = (product: Product) => {
    setAdjustProduct(product);
    setAdjustData(initialAdjustData);
  };

  // Submit stock adjustment
  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustProduct) return;

    const delta = parseFloat(adjustData.delta);
    if (isNaN(delta) || delta === 0) {
      toast.error(t('inventory.invalidDelta') || 'Please enter a non-zero amount');
      return;
    }

    try {
      setAdjusting(true);
      await inventoryService.adjustStock(adjustProduct.id, {
        delta,
        reason: adjustData.reason,
        reference: adjustData.reference.trim() || undefined,
      });
      toast.success(t('inventory.stockAdjusted') || 'Stock adjusted');
      setAdjustProduct(null);
      loadData();
    } catch (error: unknown) {
      console.error('Error adjusting stock:', error);
      toast.error((error as Error).message || t('inventory.adjustError') || 'Failed to adjust stock');
    } finally {
      setAdjusting(false);
    }
  };

  // Translated type label
  const getTypeLabel = (type: ProductType): string => {
    const labels: Record<ProductType, Record<string, string>> = {
      CONSUMABLE: { en: 'Consumable', uk: 'Витратний', ru: 'Расходный' },
      RETAIL: { en: 'Retail', uk: 'Роздрібний', ru: 'Розничный' },
    };
    return labels[type]?.[language] || labels[type]?.en || type;
  };

  // Translated reason label
  const getReasonLabel = (reason: StockReason): string => {
    const labels: Record<StockReason, Record<string, string>> = {
      PURCHASE: { en: 'Purchase', uk: 'Закупівля', ru: 'Закупка' },
      USAGE: { en: 'Usage', uk: 'Використання', ru: 'Использование' },
      SALE: { en: 'Sale', uk: 'Продаж', ru: 'Продажа' },
      ADJUSTMENT: { en: 'Adjustment', uk: 'Коригування', ru: 'Корректировка' },
      RETURN: { en: 'Return', uk: 'Повернення', ru: 'Возврат' },
    };
    return labels[reason]?.[language] || labels[reason]?.en || reason;
  };

  const clearFilters = () => {
    setFilterType('');
    setFilterLowStock(false);
    setSearch('');
  };

  if (loading && products.length === 0) {
    return <PageLoader text={t('inventory.loading') || 'Loading inventory...'} />;
  }

  const summaryCurrency = asCurrency(summary?.currency);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              {t('inventory.title') || 'Inventory'}
            </h1>
            <p className="mt-1 text-gray-600 dark:text-gray-400">
              {t('inventory.subtitle') || 'Track stock levels and product costs'}
            </p>
          </div>
          <button
            onClick={handleAddProduct}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-medium transition-colors"
          >
            <PlusIcon className="h-5 w-5" />
            {t('inventory.addProduct') || 'Add Product'}
          </button>
        </div>

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {/* Total products */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover-lift">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                  <ArchiveBoxIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {t('inventory.totalProducts') || 'Total Products'}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {summary.totalProducts}
                  </p>
                </div>
              </div>
            </div>

            {/* Stock value */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover-lift">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-xl">
                  <CurrencyDollarIcon className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {t('inventory.stockValue') || 'Stock Value'}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {formatPrice(summary.totalStockValue || 0, summaryCurrency)}
                  </p>
                </div>
              </div>
            </div>

            {/* Low-stock alerts */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover-lift">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl ${summary.lowStockCount > 0 ? 'bg-red-100 dark:bg-red-900/30' : 'bg-green-100 dark:bg-green-900/30'}`}>
                  <ExclamationTriangleIcon className={`h-6 w-6 ${summary.lowStockCount > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`} />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {t('inventory.lowStockAlerts') || 'Low-stock Alerts'}
                  </p>
                  <p className={`text-2xl font-bold ${summary.lowStockCount > 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>
                    {summary.lowStockCount}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('inventory.search') || 'Search'}
              </label>
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t('inventory.searchPlaceholder') || 'Search by name or SKU...'}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('inventory.type') || 'Type'}
              </label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as ProductType | '')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
              >
                <option value="">{t('inventory.allTypes') || 'All Types'}</option>
                {PRODUCT_TYPES.map((type) => (
                  <option key={type} value={type}>{getTypeLabel(type)}</option>
                ))}
              </select>
            </div>
            <label className="flex items-center gap-2 cursor-pointer py-2">
              <input
                type="checkbox"
                checked={filterLowStock}
                onChange={(e) => setFilterLowStock(e.target.checked)}
                className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
                {t('inventory.lowStockOnly') || 'Low stock only'}
              </span>
            </label>
            <button
              onClick={clearFilters}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors flex items-center gap-2"
            >
              <ArrowPathIcon className="h-5 w-5" />
              {t('inventory.clearFilters') || 'Clear'}
            </button>
          </div>
        </div>

        {/* Product List */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {t('inventory.products') || 'Products'}
            </h2>
          </div>

          {products.length === 0 ? (
            <div className="p-8 text-center">
              <div className="mx-auto w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
                <CubeIcon className="h-8 w-8 text-gray-500 dark:text-gray-400" />
              </div>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {t('inventory.noProducts') || 'No products in your inventory yet'}
              </p>
              <button
                onClick={handleAddProduct}
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors"
              >
                <PlusIcon className="h-5 w-5" />
                {t('inventory.addFirstProduct') || 'Add your first product'}
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    <th scope="col" className="px-6 py-3 font-medium">{t('inventory.name') || 'Name'}</th>
                    <th scope="col" className="px-6 py-3 font-medium">{t('inventory.type') || 'Type'}</th>
                    <th scope="col" className="px-6 py-3 font-medium">{t('inventory.unit') || 'Unit'}</th>
                    <th scope="col" className="px-6 py-3 font-medium text-right">{t('inventory.stockQty') || 'Stock'}</th>
                    <th scope="col" className="px-6 py-3 font-medium text-right">{t('inventory.costPrice') || 'Cost'}</th>
                    <th scope="col" className="px-6 py-3 font-medium text-right">{t('inventory.salePrice') || 'Sale'}</th>
                    <th scope="col" className="px-6 py-3 font-medium text-right"><span className="sr-only">{t('common.actions') || 'Actions'}</span></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {products.map((product) => {
                    const low = isLowStock(product);
                    const productCurrency = asCurrency(product.currency);
                    return (
                      <tr
                        key={product.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors align-top"
                      >
                        <td className="px-6 py-4">
                          <div className="min-w-0">
                            <p className="font-medium text-gray-900 dark:text-white truncate">
                              {product.name}
                            </p>
                            {product.sku && (
                              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                {t('inventory.sku') || 'SKU'}: {product.sku}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                            {getTypeLabel(product.type)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-600 dark:text-gray-300">
                          {product.unit}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <span className="font-medium text-gray-900 dark:text-white">
                            {num(product.stockQty)}
                          </span>
                          {low && (
                            <span className="ml-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400">
                              <ExclamationTriangleIcon className="h-3 w-3" />
                              {t('inventory.lowStock') || 'Low'}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-gray-600 dark:text-gray-300">
                          {formatPrice(num(product.costPrice), productCurrency)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-gray-600 dark:text-gray-300">
                          {product.salePrice != null
                            ? formatPrice(num(product.salePrice), productCurrency)
                            : <span className="text-gray-400 dark:text-gray-600">—</span>}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="inline-flex items-center gap-1">
                            <button
                              onClick={() => handleOpenAdjust(product)}
                              aria-label={t('inventory.adjustStock') || 'Adjust stock'}
                              className="p-2 text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                            >
                              <ArrowsUpDownIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleEditProduct(product)}
                              aria-label={t('inventory.editProduct') || 'Edit product'}
                              className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                            >
                              <PencilIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(product.id)}
                              disabled={deleting === product.id}
                              aria-label={t('common.delete') || 'Delete'}
                              className="p-2 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors disabled:opacity-50"
                            >
                              {deleting === product.id ? (
                                <ArrowPathIcon className="h-4 w-4 animate-spin" />
                              ) : (
                                <TrashIcon className="h-4 w-4" />
                              )}
                            </button>
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

        {/* Add/Edit Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {editingProduct
                    ? (t('inventory.editProduct') || 'Edit Product')
                    : (t('inventory.addProduct') || 'Add Product')}
                </h2>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('inventory.name') || 'Name'} *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder={t('inventory.namePlaceholder') || 'e.g., Nitrile gloves'}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                    required
                  />
                </div>

                {/* SKU + Type */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t('inventory.sku') || 'SKU'}
                    </label>
                    <input
                      type="text"
                      value={formData.sku}
                      onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                      placeholder={t('inventory.skuPlaceholder') || 'Optional'}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t('inventory.type') || 'Type'}
                    </label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value as ProductType })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                    >
                      {PRODUCT_TYPES.map((type) => (
                        <option key={type} value={type}>{getTypeLabel(type)}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Unit + Currency */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t('inventory.unit') || 'Unit'}
                    </label>
                    <input
                      type="text"
                      value={formData.unit}
                      onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                      placeholder="unit"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t('inventory.currency') || 'Currency'}
                    </label>
                    <select
                      value={formData.currency}
                      onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="UAH">UAH</option>
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                    </select>
                  </div>
                </div>

                {/* Cost + Sale price */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t('inventory.costPrice') || 'Cost Price'} *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.costPrice}
                      onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                      placeholder="0.00"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t('inventory.salePrice') || 'Sale Price'}
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.salePrice}
                      onChange={(e) => setFormData({ ...formData, salePrice: e.target.value })}
                      placeholder={t('inventory.salePricePlaceholder') || 'Optional'}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>

                {/* Stock qty (create only) + Reorder level */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {!editingProduct && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {t('inventory.stockQty') || 'Stock Quantity'}
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.stockQty}
                        onChange={(e) => setFormData({ ...formData, stockQty: e.target.value })}
                        placeholder="0"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t('inventory.reorderLevel') || 'Reorder Level'}
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.reorderLevel}
                      onChange={(e) => setFormData({ ...formData, reorderLevel: e.target.value })}
                      placeholder="0"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>

                {editingProduct && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {t('inventory.editStockHint') || 'Use "Adjust stock" to change the quantity on hand.'}
                  </p>
                )}

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('inventory.description') || 'Description'}
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={2}
                    placeholder={t('inventory.descriptionPlaceholder') || 'Optional notes...'}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 resize-none"
                  />
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    {t('common.cancel') || 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    {submitting && <ArrowPathIcon className="h-4 w-4 animate-spin" />}
                    {editingProduct
                      ? (t('common.save') || 'Save')
                      : (t('inventory.create') || 'Create')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Adjust Stock Modal */}
        {adjustProduct && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full">
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {t('inventory.adjustStock') || 'Adjust Stock'}
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-[18rem]">
                    {adjustProduct.name} · {t('inventory.currentStock') || 'Current'}: {num(adjustProduct.stockQty)} {adjustProduct.unit}
                  </p>
                </div>
                <button
                  onClick={() => setAdjustProduct(null)}
                  className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handleAdjustSubmit} className="p-6 space-y-4">
                {/* Delta */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('inventory.delta') || 'Quantity change'} *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={adjustData.delta}
                    onChange={(e) => setAdjustData({ ...adjustData, delta: e.target.value })}
                    placeholder={t('inventory.deltaPlaceholder') || 'e.g., 10 to add, -5 to remove'}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                    required
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {t('inventory.deltaHint') || 'Positive adds stock, negative removes it.'}
                  </p>
                </div>

                {/* Reason */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('inventory.reason') || 'Reason'} *
                  </label>
                  <select
                    value={adjustData.reason}
                    onChange={(e) => setAdjustData({ ...adjustData, reason: e.target.value as StockReason })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                  >
                    {STOCK_REASONS.map((reason) => (
                      <option key={reason} value={reason}>{getReasonLabel(reason)}</option>
                    ))}
                  </select>
                </div>

                {/* Reference */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('inventory.reference') || 'Reference'}
                  </label>
                  <input
                    type="text"
                    value={adjustData.reference}
                    onChange={(e) => setAdjustData({ ...adjustData, reference: e.target.value })}
                    placeholder={t('inventory.referencePlaceholder') || 'PO number, note... (optional)'}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setAdjustProduct(null)}
                    className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    {t('common.cancel') || 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    disabled={adjusting}
                    className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    {adjusting && <ArrowPathIcon className="h-4 w-4 animate-spin" />}
                    {t('inventory.applyAdjustment') || 'Apply'}
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

export default SpecialistInventory;

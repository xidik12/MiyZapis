import React, { useState, useEffect } from 'react';
import { useDebounce } from '../../hooks/useDebounce';
import { motion } from 'framer-motion';
import { confirm } from '@/components/ui/Confirm';
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
import BarcodeScanner from '@/components/common/BarcodeScanner';
import LabelPrintModal from '@/components/common/LabelPrintModal';
import { generateEan13 } from '@/utils/barcode';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  XIcon as XMarkIcon,
  ArchiveBoxIcon as CubeIcon,
  ArchiveBoxIcon,
  WarningIcon as ExclamationTriangleIcon,
  CurrencyDollarIcon,
  ArrowPathIcon,
  SlidersIcon as ArrowsUpDownIcon,
  MagnifyingGlassIcon,
} from '@/components/icons';
import { HelpTip } from '@/components/common/HelpTip';

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
  barcode: string;
  name: string;
  description: string;
  imageUrl: string;
  type: ProductType;
  unit: string;
  costPrice: string;
  salePrice: string;
  stockQty: string;
  reorderLevel: string;
  expiryDate: string;
  currency: string;
}

const initialFormData: ProductFormData = {
  sku: '',
  barcode: '',
  name: '',
  description: '',
  imageUrl: '',
  type: 'CONSUMABLE',
  unit: 'unit',
  costPrice: '',
  salePrice: '',
  stockQty: '0',
  reorderLevel: '0',
  expiryDate: '',
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

const INV_HELP = {
  en: {
    overview: 'Inventory — manage every product you stock, sell, or use in your work.\n\n• Stock quantity: units physically on your shelf right now. Automatically decreases when you complete a sale in POS.\n• Reorder level: the low-stock threshold. When stock reaches or falls below this number, the product shows a red "Low" badge and counts in the Low-stock alert card. Set it to 0 to disable the alert.\n• Expiry date: optional. A red "Expired" badge appears once the date has passed; an amber "Exp. Nd" badge appears within 30 days of expiry. Use the "Expiring soon" filter to act fast.\n• Cost price: what you paid per unit (required). Used to calculate your stock value.\n• Sale price: what the customer pays. Optional — if blank, the cost price is shown on POS.\n• Product type:\n  — Consumable: used internally (gloves, colour, etc.) — not sold directly.\n  — Retail: sold to customers from the POS screen.\n• Barcode: scan the manufacturer\'s EAN/UPC barcode on the packaging, or type it. If the code is in the platform catalog, name and photo are auto-filled. No barcode on the product? Tap Generate — the system mints a unique in-store EAN-13 code. Then use Print labels to print sticker labels to attach to items.\n• Adjust stock (the arrows icon): use this to add or remove stock outside a sale. Enter a positive number to add, a negative number to remove. Pick the reason (Purchase / Usage / Sale / Adjustment / Return) and an optional reference number for your records.',
    reorderLevel: 'Low-stock threshold. When stock quantity reaches or falls below this number, the product is flagged "Low" and appears in the Low-stock alert summary.\nSet to 0 to disable the alert for this product.',
    barcode: 'Scan or type the manufacturer\'s EAN/UPC barcode.\nIf found in the platform catalog, the product name and photo are auto-filled.\n\nNo barcode on the product?\nTap Generate — a unique in-store EAN-13 code is created.\nThen use Print labels to print sticker labels to attach to items.',
    expiry: 'Optional expiry date for this product.\n• Within 30 days: amber "Exp. Nd" badge appears on the product.\n• Past the date: red "Expired" badge.\nUse the Expiring soon filter to see all at-risk products at once.',
    costVsSale: 'Cost price: what you paid per unit (required). Used to calculate total stock value.\nSale price: what the customer pays at checkout. If left blank, cost price is used on the POS screen.',
    adjustStock: 'Adjust the quantity on hand without creating a sale.\n• Enter a positive number to ADD stock (e.g. new delivery: +50).\n• Enter a negative number to REMOVE stock (e.g. breakage or waste: -3).\nAlways pick a reason so you have a clean audit trail:\n• Purchase — new stock received.\n• Usage — consumed internally (not sold).\n• Sale — manual correction for an in-person sale made outside POS.\n• Adjustment — stock count correction.\n• Return — supplier or customer return.',
  },
  uk: {
    overview: 'Склад — керування всіма товарами, які ви зберігаєте, продаєте або використовуєте у роботі.\n\n• Кількість на складі: одиниці, які фізично є на вашій полиці прямо зараз. Зменшується автоматично після завершення продажу в Касі.\n• Рівень дозамовлення: поріг малого залишку. Коли залишок досягає або падає нижче цього числа, товар отримує червону мітку «Мало» і враховується в карточці сповіщень. Встановіть 0, щоб вимкнути сповіщення.\n• Термін придатності: необов\'язковий. Червона мітка «Прострочено» з\'являється після закінчення дати; жовтогаряча мітка «Закін. Nд» — за 30 днів до закінчення. Використовуйте фільтр «Скоро закінчується» для швидкої реакції.\n• Ціна закупівлі: ціна, яку ви заплатили за одиницю (обов\'язкова). Використовується для розрахунку вартості складу.\n• Ціна продажу: ціна для покупця. Необов\'язкова — якщо не вказана, на касі відображається ціна закупівлі.\n• Тип товару:\n  — Витратний: використовується всередині (рукавички, фарба тощо) — не продається напряму.\n  — Роздрібний: продається покупцям через Касу.\n• Штрихкод: скануйте або введіть EAN/UPC з упаковки. Якщо код є в каталозі платформи, назва та фото заповнюються автоматично. Немає штрихкоду? Натисніть «Згенерувати» — система створить унікальний внутрішній EAN-13. Потім скористайтеся «Друком етикеток».\n• Коригування залишку (іконка стрілок): додайте або зніміть залишок поза межами продажу. Введіть позитивне число, щоб додати, або від\'ємне, щоб зняти. Оберіть причину та необов\'язковий номер для довідки.',
    reorderLevel: 'Поріг малого залишку. Коли кількість товару досягає або падає нижче цього числа, товар позначається міткою «Мало» і відображається в карточці сповіщень.\nВстановіть 0, щоб вимкнути сповіщення для цього товару.',
    barcode: 'Скануйте або введіть EAN/UPC з упаковки виробника.\nЯкщо код знайдено в каталозі платформи, назва та фото заповнюються автоматично.\n\nНемає штрихкоду на товарі?\nНатисніть «Згенерувати» — система створить унікальний внутрішній EAN-13.\nПотім скористайтеся «Друком етикеток» для наклейок.',
    expiry: 'Необов\'язковий термін придатності для цього товару.\n• За 30 днів до закінчення: жовтогаряча мітка «Закін. Nд».\n• Після закінчення: червона мітка «Прострочено».\nВикористовуйте фільтр «Скоро закінчується», щоб побачити всі такі товари одразу.',
    costVsSale: 'Ціна закупівлі: ціна за одиницю, яку ви заплатили (обов\'язкова). Використовується для розрахунку загальної вартості складу.\nЦіна продажу: ціна для покупця на касі. Якщо залишити порожнім, на Касі буде відображатися ціна закупівлі.',
    adjustStock: 'Скоригуйте залишок без створення продажу.\n• Позитивне число — ДОДАТИ залишок (напр., нова поставка: +50).\n• Від\'ємне число — ЗНЯТИ залишок (напр., бій або відходи: -3).\nЗавжди обирайте причину для чистого обліку:\n• Закупівля — отримано нові товари.\n• Використання — витрачено всередині (не продано).\n• Продаж — ручне коригування для продажу поза Касою.\n• Коригування — виправлення при інвентаризації.\n• Повернення — повернення від постачальника або покупця.',
  },
  ru: {
    overview: 'Склад — управление всеми товарами, которые вы храните, продаёте или используете в работе.\n\n• Количество на складе: единицы, физически находящиеся на вашей полке прямо сейчас. Уменьшается автоматически после завершения продажи в Кассе.\n• Уровень дозаказа: порог малого остатка. Когда остаток достигает или падает ниже этого числа, товар получает красную метку «Мало» и учитывается в карточке оповещений. Установите 0, чтобы отключить оповещение.\n• Срок годности: необязательный. Красная метка «Просрочено» появляется после истечения даты; оранжевая метка «Ист. Nд» — за 30 дней до истечения. Используйте фильтр «Скоро истекает» для быстрой реакции.\n• Цена закупки: цена, которую вы заплатили за единицу (обязательная). Используется для расчёта стоимости склада.\n• Цена продажи: цена для покупателя. Необязательная — если не указана, на кассе отображается цена закупки.\n• Тип товара:\n  — Расходный: используется внутренне (перчатки, краска и т.д.) — не продаётся напрямую.\n  — Розничный: продаётся покупателям через Кассу.\n• Штрихкод: сканируйте или введите EAN/UPC с упаковки. Если код есть в каталоге платформы, название и фото заполняются автоматически. Нет штрихкода? Нажмите «Сгенерировать» — система создаст уникальный внутренний EAN-13. Затем используйте «Печать этикеток».\n• Корректировка остатка (иконка стрелок): добавьте или снимите остаток вне продажи. Введите положительное число для добавления или отрицательное для снятия. Выберите причину и необязательный номер для справки.',
    reorderLevel: 'Порог малого остатка. Когда количество товара достигает или падает ниже этого числа, товар помечается меткой «Мало» и отображается в карточке оповещений.\nУстановите 0, чтобы отключить оповещение для этого товара.',
    barcode: 'Сканируйте или введите EAN/UPC с упаковки производителя.\nЕсли код найден в каталоге платформы, название и фото заполняются автоматически.\n\nНет штрихкода на товаре?\nНажмите «Сгенерировать» — система создаст уникальный внутренний EAN-13.\nЗатем используйте «Печать этикеток» для наклеек.',
    expiry: 'Необязательный срок годности для этого товара.\n• За 30 дней до истечения: оранжевая метка «Ист. Nд».\n• После истечения: красная метка «Просрочено».\nИспользуйте фильтр «Скоро истекает», чтобы увидеть все такие товары сразу.',
    costVsSale: 'Цена закупки: цена за единицу, которую вы заплатили (обязательная). Используется для расчёта общей стоимости склада.\nЦена продажи: цена для покупателя на кассе. Если оставить пустым, на Кассе будет отображаться цена закупки.',
    adjustStock: 'Скорректируйте остаток без создания продажи.\n• Положительное число — ДОБАВИТЬ остаток (напр., новая поставка: +50).\n• Отрицательное число — СНЯТЬ остаток (напр., бой или отходы: -3).\nВсегда выбирайте причину для чистого учёта:\n• Закупка — получены новые товары.\n• Использование — потрачено внутренне (не продано).\n• Продажа — ручная корректировка для продажи вне Кассы.\n• Корректировка — исправление при инвентаризации.\n• Возврат — возврат от поставщика или покупателя.',
  },
};

const SpecialistInventory: React.FC = () => {
  const { t, language } = useLanguage();
  const h = (INV_HELP as any)[language] || INV_HELP.en;
  const { formatPrice } = useCurrency();

  // State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [summary, setSummary] = useState<InventorySummary | null>(null);

  // Add/Edit modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<ProductFormData>(initialFormData);
  const [submitting, setSubmitting] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [barcodeLooking, setBarcodeLooking] = useState(false);
  const [scanOpen, setScanOpen] = useState(false);
  const [labelsOpen, setLabelsOpen] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Upload a product photo and store its URL on the form.
  const handleImageUpload = async (file: File) => {
    setImageUploading(true);
    try {
      const url = await inventoryService.uploadImage(file);
      setFormData((prev) => ({ ...prev, imageUrl: url }));
    } catch (err) {
      toast.error((err as Error).message || t('inventory.imageUploadFailed') || 'Image upload failed');
    } finally {
      setImageUploading(false);
    }
  };

  // When a barcode is entered, auto-fill name/image from the platform catalog
  // if this owner doesn't already stock it.
  const handleBarcodeLookup = async (code: string) => {
    if (!code.trim()) return;
    setBarcodeLooking(true);
    try {
      const { own, catalog } = await inventoryService.lookupBarcode(code.trim());
      if (own) {
        toast.info(t('inventory.barcodeExists') || 'You already stock this product');
      } else if (catalog) {
        setFormData((prev) => ({
          ...prev,
          name: prev.name || catalog.name || '',
          description: prev.description || catalog.description || '',
          imageUrl: prev.imageUrl || catalog.imageUrl || '',
          unit: prev.unit && prev.unit !== 'unit' ? prev.unit : (catalog.unit || 'unit'),
        }));
        toast.success(t('inventory.barcodeAutofill') || 'Auto-filled from catalog');
      }
    } catch { /* non-fatal */ } finally {
      setBarcodeLooking(false);
    }
  };

  // Adjust modal
  const [adjustProduct, setAdjustProduct] = useState<Product | null>(null);
  const [adjustData, setAdjustData] = useState<AdjustFormData>(initialAdjustData);
  const [adjusting, setAdjusting] = useState(false);

  // Filters
  const [filterType, setFilterType] = useState<ProductType | ''>('');
  const [filterLowStock, setFilterLowStock] = useState(false);
  const [filterExpiring, setFilterExpiring] = useState(false);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterType, filterLowStock, filterExpiring, debouncedSearch]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const filters: Record<string, unknown> = {};
      if (filterType) filters.type = filterType;
      if (filterLowStock) filters.lowStock = true;
      if (filterExpiring) filters.expiringSoon = true;
      if (debouncedSearch.trim()) filters.search = debouncedSearch.trim();

      const [productsResponse, summaryResponse] = await Promise.all([
        inventoryService.getProducts(filters),
        inventoryService.getSummary(),
      ]);

      setProducts(productsResponse || []);
      setSummary(summaryResponse);
    } catch (error: unknown) {
      console.error('Error loading inventory:', error);
      toast.error(t('inventory.loadError') || 'Failed to load inventory');
      setError(t('inventory.loadError') || 'Failed to load inventory');
    } finally {
      setLoading(false);
    }
  };

  const isLowStock = (p: Product): boolean => {
    const reorder = num(p.reorderLevel);
    return reorder > 0 && num(p.stockQty) <= reorder;
  };

  // Expiry badge info: null if no/far-off expiry, else expired (red) or soon (amber).
  const expiryInfo = (p: Product): { label: string; cls: string } | null => {
    const raw = (p as any).expiryDate;
    if (!raw) return null;
    const days = Math.ceil((new Date(raw).getTime() - Date.now()) / 86400000);
    if (days < 0) return { label: t('inventory.expired') || 'Expired', cls: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' };
    if (days <= 30) return { label: (t('inventory.expiringDays') || 'Exp. {{d}}d').replace('{{d}}', String(days)), cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' };
    return null;
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
      barcode: (product as any).barcode || '',
      name: product.name,
      description: product.description || '',
      imageUrl: (product as any).imageUrl || '',
      type: product.type,
      unit: product.unit || 'unit',
      costPrice: String(num(product.costPrice)),
      salePrice: product.salePrice != null ? String(num(product.salePrice)) : '',
      stockQty: String(num(product.stockQty)),
      reorderLevel: String(num(product.reorderLevel)),
      expiryDate: (product as any).expiryDate ? String((product as any).expiryDate).slice(0, 10) : '',
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
          barcode: formData.barcode.trim() || null,
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
          imageUrl: formData.imageUrl.trim() || null,
          type: formData.type,
          unit: formData.unit.trim() || 'unit',
          costPrice,
          salePrice,
          reorderLevel: parseFloat(formData.reorderLevel || '0'),
          expiryDate: formData.expiryDate || null,
          currency: formData.currency,
        };
        await inventoryService.updateProduct(editingProduct.id, data);
        toast.success(t('inventory.productUpdated') || 'Product updated');
      } else {
        const data: CreateProductData = {
          sku: formData.sku.trim() || undefined,
          barcode: formData.barcode.trim() || null,
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
          imageUrl: formData.imageUrl.trim() || null,
          type: formData.type,
          unit: formData.unit.trim() || 'unit',
          costPrice,
          salePrice,
          stockQty: parseFloat(formData.stockQty || '0'),
          reorderLevel: parseFloat(formData.reorderLevel || '0'),
          expiryDate: formData.expiryDate || null,
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
    if (!await confirm(t('inventory.confirmDelete') || 'Are you sure you want to delete this product?')) {
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
    setFilterExpiring(false);
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
        <div className="flex flex-col sm:flex-row sm:justify-between items-stretch sm:items-center gap-3 mb-6">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white break-words">
                {t('inventory.title') || 'Inventory'}
              </h1>
              <HelpTip title={t('help.inventory.title') || 'Inventory'} content={h.overview} />
            </div>
            <p className="mt-1 text-gray-600 dark:text-gray-400">
              {t('inventory.subtitle') || 'Track stock levels and product costs'}
            </p>
          </div>
          <div className="w-full sm:w-auto flex gap-2">
            <button
              onClick={() => setLabelsOpen(true)}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl font-medium transition hover:bg-gray-200 dark:hover:bg-gray-600 active:scale-[0.96]"
            >
              {t('labels.printLabels') || 'Print labels'}
            </button>
            <button
              onClick={handleAddProduct}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-medium transition active:scale-[0.96]"
            >
              <PlusIcon className="h-5 w-5" />
              {t('inventory.addProduct') || 'Add Product'}
            </button>
          </div>
        </div>

        <BarcodeScanner
          isOpen={scanOpen}
          onClose={() => setScanOpen(false)}
          onDetected={(code) => { setFormData((prev) => ({ ...prev, barcode: code })); handleBarcodeLookup(code); }}
        />
        <LabelPrintModal isOpen={labelsOpen} onClose={() => setLabelsOpen(false)} products={products} />

        {/* Error state */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl">
            <div className="flex items-center justify-between gap-3">
              <p className="text-red-700 dark:text-red-400 text-sm">{error}</p>
              <button
                onClick={() => loadData()}
                className="text-sm font-medium text-red-600 dark:text-red-400 hover:underline flex-shrink-0"
              >
                {t('common.retry') || 'Retry'}
              </button>
            </div>
          </div>
        )}

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {/* Total products */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover-lift">
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0 p-3 bg-primary-100 dark:bg-primary-900/30 rounded-xl">
                  <ArchiveBoxIcon className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {t('inventory.totalProducts') || 'Total Products'}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white truncate tabular-nums">
                    {summary.totalProducts}
                  </p>
                </div>
              </div>
            </div>

            {/* Stock value */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover-lift">
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0 p-3 bg-amber-100 dark:bg-amber-900/30 rounded-xl">
                  <CurrencyDollarIcon className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {t('inventory.stockValue') || 'Stock Value'}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white truncate tabular-nums">
                    {formatPrice(summary.totalStockValue || 0, summaryCurrency)}
                  </p>
                </div>
              </div>
            </div>

            {/* Low-stock alerts */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover-lift">
              <div className="flex items-center gap-4">
                <div className={`flex-shrink-0 p-3 rounded-xl ${summary.lowStockCount > 0 ? 'bg-red-100 dark:bg-red-900/30' : 'bg-green-100 dark:bg-green-900/30'}`}>
                  <ExclamationTriangleIcon className={`h-6 w-6 ${summary.lowStockCount > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {t('inventory.lowStockAlerts') || 'Low-stock Alerts'}
                  </p>
                  <p className={`text-2xl font-bold truncate tabular-nums ${summary.lowStockCount > 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>
                    {summary.lowStockCount}
                  </p>
                </div>
              </div>
            </div>

            {/* Expiring soon */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover-lift">
              <div className="flex items-center gap-4">
                <div className={`flex-shrink-0 p-3 rounded-xl ${(summary.expiringSoonCount ?? 0) > 0 ? 'bg-amber-100 dark:bg-amber-900/30' : 'bg-green-100 dark:bg-green-900/30'}`}>
                  <ExclamationTriangleIcon className={`h-6 w-6 ${(summary.expiringSoonCount ?? 0) > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-green-600 dark:text-green-400'}`} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {t('inventory.expiringSoon') || 'Expiring soon'}
                  </p>
                  <p className={`text-2xl font-bold truncate tabular-nums ${(summary.expiringSoonCount ?? 0) > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-gray-900 dark:text-white'}`}>
                    {summary.expiringSoonCount ?? 0}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
            <div className="flex-1 min-w-0">
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
                  className="w-full min-w-0 pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('inventory.type') || 'Type'}
              </label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as ProductType | '')}
                className="w-full min-w-0 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
              >
                <option value="">{t('inventory.allTypes') || 'All Types'}</option>
                {PRODUCT_TYPES.map((type) => (
                  <option key={type} value={type}>{getTypeLabel(type)}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-row sm:flex-col items-center sm:items-start gap-3 sm:gap-2">
              <label className="flex items-center gap-2 cursor-pointer py-2 sm:py-0">
                <input
                  type="checkbox"
                  checked={filterLowStock}
                  onChange={(e) => setFilterLowStock(e.target.checked)}
                  className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500 flex-shrink-0"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
                  {t('inventory.lowStockOnly') || 'Low stock only'}
                </span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer py-2 sm:py-0">
                <input
                  type="checkbox"
                  checked={filterExpiring}
                  onChange={(e) => setFilterExpiring(e.target.checked)}
                  className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500 flex-shrink-0"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
                  {t('inventory.expiringOnly') || 'Expiring soon'}
                </span>
              </label>
              <button
                onClick={clearFilters}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
              >
                <ArrowPathIcon className="h-5 w-5 flex-shrink-0" />
                {t('inventory.clearFilters') || 'Clear'}
              </button>
            </div>
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
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition active:scale-[0.96]"
              >
                <PlusIcon className="h-5 w-5" />
                {t('inventory.addFirstProduct') || 'Add your first product'}
              </button>
            </div>
          ) : (
            <>
              {/* Desktop table — hidden on mobile */}
              <div className="hidden lg:block overflow-x-auto">
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
                            <span className="font-medium text-gray-900 dark:text-white tabular-nums">
                              {num(product.stockQty)}
                            </span>
                            {low && (
                              <span className="ml-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400">
                                <ExclamationTriangleIcon className="h-3 w-3" />
                                {t('inventory.lowStock') || 'Low'}
                              </span>
                            )}
                            {(() => { const e = expiryInfo(product); return e ? (<span className={`ml-2 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${e.cls}`}>{e.label}</span>) : null; })()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-gray-600 dark:text-gray-300 tabular-nums">
                            {formatPrice(num(product.costPrice), productCurrency)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-gray-600 dark:text-gray-300 tabular-nums">
                            {product.salePrice != null
                              ? formatPrice(num(product.salePrice), productCurrency)
                              : <span className="text-gray-400 dark:text-gray-600">—</span>}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <div className="inline-flex items-center gap-1">
                              <button
                                onClick={() => handleOpenAdjust(product)}
                                aria-label={t('inventory.adjustStock') || 'Adjust stock'}
                                className="p-2.5 text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition active:scale-[0.96]"
                              >
                                <ArrowsUpDownIcon className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleEditProduct(product)}
                                aria-label={t('inventory.editProduct') || 'Edit product'}
                                className="p-2.5 text-gray-500 dark:text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition active:scale-[0.96]"
                              >
                                <PencilIcon className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(product.id)}
                                disabled={deleting === product.id}
                                aria-label={t('common.delete') || 'Delete'}
                                className="p-2.5 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition disabled:opacity-50 active:scale-[0.96] disabled:active:scale-100"
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

              {/* Mobile card list — hidden on lg and up */}
              <div className="lg:hidden space-y-3 p-4">
                {products.map((product) => {
                  const low = isLowStock(product);
                  const productCurrency = asCurrency(product.currency);
                  return (
                    <div
                      key={product.id}
                      className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 shadow-sm"
                    >
                      {/* Name + type badge */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-gray-900 dark:text-white break-words">
                            {product.name}
                          </p>
                          {product.sku && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 break-words mt-0.5">
                              {t('inventory.sku') || 'SKU'}: {product.sku}
                            </p>
                          )}
                        </div>
                        <span className="flex-shrink-0 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                          {getTypeLabel(product.type)}
                        </span>
                      </div>

                      {/* Detail rows */}
                      <dl className="mt-3 space-y-2 text-sm">
                        <div className="flex items-start justify-between gap-3">
                          <dt className="flex-shrink-0 text-gray-500 dark:text-gray-400">
                            {t('inventory.unit') || 'Unit'}
                          </dt>
                          <dd className="min-w-0 text-right text-gray-900 dark:text-white break-words">
                            {product.unit}
                          </dd>
                        </div>
                        <div className="flex items-start justify-between gap-3">
                          <dt className="flex-shrink-0 text-gray-500 dark:text-gray-400">
                            {t('inventory.stockQty') || 'Stock'}
                          </dt>
                          <dd className="min-w-0 text-right text-gray-900 dark:text-white tabular-nums flex items-center gap-2 flex-wrap justify-end">
                            <span className="font-medium">{num(product.stockQty)}</span>
                            {low && (
                              <span className="flex-shrink-0 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400">
                                <ExclamationTriangleIcon className="h-3 w-3" />
                                {t('inventory.lowStock') || 'Low'}
                              </span>
                            )}
                            {(() => { const e = expiryInfo(product); return e ? (<span className={`flex-shrink-0 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${e.cls}`}>{e.label}</span>) : null; })()}
                          </dd>
                        </div>
                        <div className="flex items-start justify-between gap-3">
                          <dt className="flex-shrink-0 text-gray-500 dark:text-gray-400">
                            {t('inventory.costPrice') || 'Cost'}
                          </dt>
                          <dd className="min-w-0 text-right text-gray-900 dark:text-white tabular-nums break-words">
                            {formatPrice(num(product.costPrice), productCurrency)}
                          </dd>
                        </div>
                        <div className="flex items-start justify-between gap-3">
                          <dt className="flex-shrink-0 text-gray-500 dark:text-gray-400">
                            {t('inventory.salePrice') || 'Sale'}
                          </dt>
                          <dd className="min-w-0 text-right text-gray-900 dark:text-white tabular-nums break-words">
                            {product.salePrice != null
                              ? formatPrice(num(product.salePrice), productCurrency)
                              : <span className="text-gray-400 dark:text-gray-600">—</span>}
                          </dd>
                        </div>
                      </dl>

                      {/* Action buttons */}
                      <div className="mt-3 flex flex-wrap items-center justify-end gap-2 border-t border-gray-100 dark:border-gray-700 pt-3">
                        <button
                          onClick={() => handleOpenAdjust(product)}
                          aria-label={t('inventory.adjustStock') || 'Adjust stock'}
                          className="p-2.5 text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition active:scale-[0.96]"
                        >
                          <ArrowsUpDownIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleEditProduct(product)}
                          aria-label={t('inventory.editProduct') || 'Edit product'}
                          className="p-2.5 text-gray-500 dark:text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition active:scale-[0.96]"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(product.id)}
                          disabled={deleting === product.id}
                          aria-label={t('common.delete') || 'Delete'}
                          className="p-2.5 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition disabled:opacity-50 active:scale-[0.96] disabled:active:scale-100"
                        >
                          {deleting === product.id ? (
                            <ArrowPathIcon className="h-4 w-4 animate-spin" />
                          ) : (
                            <TrashIcon className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Add/Edit Modal */}
        {isModalOpen && (
          <motion.div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.15 }}>
            <motion.div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto" initial={{ opacity: 0, scale: 0.97, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ type: 'spring', duration: 0.3, bounce: 0 }}>
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {editingProduct
                    ? (t('inventory.editProduct') || 'Edit Product')
                    : (t('inventory.addProduct') || 'Add Product')}
                </h2>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2.5 text-gray-500 dark:text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition active:scale-[0.96]"
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

                {/* Barcode + Expiry */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <div className="flex items-center gap-1 mb-1">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {t('inventory.barcode') || 'Barcode'}
                      </label>
                      <HelpTip title={t('inventory.barcode') || 'Barcode'} content={h.barcode} />
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        inputMode="numeric"
                        value={formData.barcode}
                        onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                        onBlur={(e) => handleBarcodeLookup(e.target.value)}
                        placeholder={t('inventory.barcodePlaceholder') || 'Scan or type — EAN/UPC'}
                        className="flex-1 min-w-0 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                      />
                      <button type="button" onClick={() => setScanOpen(true)} className="flex-shrink-0 px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 text-sm hover:bg-gray-200 dark:hover:bg-gray-600">
                        {t('pos.scan') || 'Scan'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData((prev) => ({ ...prev, barcode: generateEan13(products.map((p) => p.barcode || '')) }))}
                        className="flex-shrink-0 px-3 py-2 rounded-lg bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-sm hover:bg-primary-100 dark:hover:bg-primary-900/50"
                      >
                        {t('inventory.generateBarcode') || 'Generate'}
                      </button>
                    </div>
                    <p className="mt-1 text-xs text-gray-400">
                      {barcodeLooking
                        ? (t('common.loading') || 'Looking up…')
                        : (t('inventory.barcodeHint') || 'No barcode on the product? Tap Generate, then print a label to stick on.')}
                    </p>
                  </div>
                  <div>
                    <div className="flex items-center gap-1 mb-1">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {t('inventory.expiryDate') || 'Expiry date'}
                      </label>
                      <HelpTip title={t('inventory.expiryDate') || 'Expiry date'} content={h.expiry} />
                    </div>
                    <input
                      type="date"
                      value={formData.expiryDate}
                      onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>

                {/* Product photo */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('inventory.photo') || 'Product photo'}
                  </label>
                  <div className="flex items-center gap-3">
                    {formData.imageUrl ? (
                      <img src={formData.imageUrl} alt="" className="w-16 h-16 rounded-lg object-cover border border-gray-200 dark:border-gray-600 ring-1 ring-inset ring-black/10 dark:ring-white/10" />
                    ) : (
                      <div className="w-16 h-16 rounded-lg border border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center text-gray-400 text-xs">
                        {t('inventory.noPhoto') || 'No photo'}
                      </div>
                    )}
                    <div className="flex flex-col gap-1">
                      <label className="inline-flex items-center px-3 py-1.5 text-sm rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 cursor-pointer transition-colors">
                        {imageUploading ? (t('inventory.uploading') || 'Uploading…') : (t('inventory.choosePhoto') || 'Choose photo')}
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          disabled={imageUploading}
                          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageUpload(f); }}
                        />
                      </label>
                      {formData.imageUrl && (
                        <button type="button" onClick={() => setFormData({ ...formData, imageUrl: '' })} className="text-xs text-red-600 dark:text-red-400 hover:underline text-left">
                          {t('common.remove') || 'Remove'}
                        </button>
                      )}
                    </div>
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
                    <div className="flex items-center gap-1 mb-1">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {t('inventory.costPrice') || 'Cost Price'} *
                      </label>
                      <HelpTip title={t('inventory.costPrice') || 'Cost & Sale Price'} content={h.costVsSale} />
                    </div>
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
                    <div className="flex items-center gap-1 mb-1">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {t('inventory.reorderLevel') || 'Reorder Level'}
                      </label>
                      <HelpTip title={t('inventory.reorderLevel') || 'Reorder Level'} content={h.reorderLevel} />
                    </div>
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
                    className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition active:scale-[0.96]"
                  >
                    {t('common.cancel') || 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition disabled:opacity-50 flex items-center gap-2 active:scale-[0.96] disabled:active:scale-100"
                  >
                    {submitting && <ArrowPathIcon className="h-4 w-4 animate-spin" />}
                    {editingProduct
                      ? (t('common.save') || 'Save')
                      : (t('inventory.create') || 'Create')}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}

        {/* Adjust Stock Modal */}
        {adjustProduct && (
          <motion.div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.15 }}>
            <motion.div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full" initial={{ opacity: 0, scale: 0.97, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ type: 'spring', duration: 0.3, bounce: 0 }}>
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                      {t('inventory.adjustStock') || 'Adjust Stock'}
                    </h2>
                    <HelpTip title={t('inventory.adjustStock') || 'Adjust Stock'} content={h.adjustStock} />
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-[18rem]">
                    {adjustProduct.name} · {t('inventory.currentStock') || 'Current'}: {num(adjustProduct.stockQty)} {adjustProduct.unit}
                  </p>
                </div>
                <button
                  onClick={() => setAdjustProduct(null)}
                  className="p-2.5 text-gray-500 dark:text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition active:scale-[0.96]"
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
                    className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition active:scale-[0.96]"
                  >
                    {t('common.cancel') || 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    disabled={adjusting}
                    className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition disabled:opacity-50 flex items-center gap-2 active:scale-[0.96] disabled:active:scale-100"
                  >
                    {adjusting && <ArrowPathIcon className="h-4 w-4 animate-spin" />}
                    {t('inventory.applyAdjustment') || 'Apply'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default SpecialistInventory;

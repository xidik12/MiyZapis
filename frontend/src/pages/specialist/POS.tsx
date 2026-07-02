import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { getAbsoluteImageUrl } from '@/utils/imageUrl';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { HelpTip } from '@/components/common/HelpTip';
import { inventoryService, Product } from '@/services/inventory.service';
import { storeService, TodaySummary, GiftCardLookup, ProductOrder } from '@/services/store.service';
import { crmService, CrmClient } from '@/services/crm.service';
import BarcodeScanner from '@/components/common/BarcodeScanner';

type PayMethod = 'CASH' | 'CARD' | 'OTHER';
interface CartLine { product: Product; qty: number }

const num = (v: number | string | null | undefined): number =>
  v == null ? 0 : typeof v === 'number' ? v : Number(v) || 0;
const round2 = (v: number): number => Math.round(v * 100) / 100;
const priceOf = (p: Product): number => num(p.salePrice ?? p.costPrice);

const POS_HELP = {
  en: {
    overview: 'Point of Sale — ring up products and record the payment method.\n\n• Tap a product card to add it to the cart. Tap again to add more. Out-of-stock items are greyed out.\n• Use the search box to filter by name or SKU.\n• Barcode scanner: type a code and press Enter, or tap Scan to use the rear camera. The product is added instantly.\n• Checkout: review the cart, adjust quantities with the − / + buttons, choose how the customer paid, then tap Complete sale.\n\nPayment methods:\n• Cash — customer paid with physical money.\n• Card — customer paid with a bank card (tap, chip, or online). MiyZapis does NOT process the payment; you collect it yourself at the terminal.\n• Other — any other method (bank transfer, app, etc.). Recorded for your bookkeeping only.\n\nWhen you complete a sale:\n• Stock is deducted automatically for each item sold.\n• The sale is counted toward your revenue reports.\n• A receipt appears — tap Print to send it to the printer.',
    barcode: 'Type a barcode and press Enter, or tap Scan to use the rear camera.\nThe product is added to the cart instantly if found.\nIf not found, the code is searched on the server.\nTo link barcodes to products, use Inventory.',
    payMethod: 'Choose how the customer paid — Cash, Card, or Other.\nThis is recorded for your bookkeeping only.\nMiyZapis does NOT process any payment. You collect it in person.',
  },
  uk: {
    overview: 'Каса — оформлення продажів та запис способу оплати.\n\n• Натисніть на картку товару, щоб додати його до кошика. Натисніть ще раз, щоб збільшити кількість. Товари без залишку неактивні.\n• Використовуйте пошук для фільтрації за назвою або артикулом.\n• Сканер штрихкодів: введіть код і натисніть Enter, або натисніть «Сканувати», щоб скористатися задньою камерою. Товар додається миттєво.\n• Оформлення: перевірте кошик, відкоригуйте кількість кнопками − / +, оберіть спосіб оплати, потім натисніть «Завершити продаж».\n\nСпособи оплати:\n• Готівка — покупець розрахувався готівкою.\n• Картка — покупець оплатив банківською карткою (tap, чіп або онлайн). MiyZapis НЕ обробляє платіж; ви приймаєте кошти самостійно на своєму терміналі.\n• Інше — будь-який інший спосіб (переказ, додаток тощо). Записується лише для вашого обліку.\n\nПісля завершення продажу:\n• Залишок товарів списується автоматично.\n• Продаж зараховується до вашої виручки.\n• З\'являється чек — натисніть «Друк», щоб роздрукувати.',
    barcode: 'Введіть штрихкод і натисніть Enter, або натисніть «Сканувати», щоб скористатися камерою.\nТовар миттєво додається до кошика, якщо знайдений.\nЯкщо не знайдено — код шукається на сервері.\nЩоб прив\'язати штрихкоди до товарів, перейдіть до Складу.',
    payMethod: 'Оберіть спосіб, яким розрахувався покупець: Готівка, Картка або Інше.\nЦе записується лише для вашого обліку.\nMiyZapis НЕ обробляє жодних платежів. Ви приймаєте кошти особисто.',
  },
  ru: {
    overview: 'Касса — оформление продаж и запись способа оплаты.\n\n• Нажмите на карточку товара, чтобы добавить его в корзину. Нажмите ещё раз, чтобы увеличить количество. Товары без остатка неактивны.\n• Используйте поиск для фильтрации по названию или артикулу.\n• Сканер штрихкодов: введите код и нажмите Enter, или нажмите «Сканировать», чтобы использовать заднюю камеру. Товар добавляется мгновенно.\n• Оформление: проверьте корзину, скорректируйте количество кнопками − / +, выберите способ оплаты, затем нажмите «Завершить продажу».\n\nСпособы оплаты:\n• Наличные — покупатель рассчитался наличными.\n• Карта — покупатель оплатил банковской картой (tap, чип или онлайн). MiyZapis НЕ обрабатывает платёж; вы принимаете оплату самостоятельно на своём терминале.\n• Другое — любой другой способ (перевод, приложение и т.д.). Записывается только для вашего учёта.\n\nПосле завершения продажи:\n• Остаток товаров списывается автоматически.\n• Продажа засчитывается в вашу выручку.\n• Появляется чек — нажмите «Печать», чтобы его распечатать.',
    barcode: 'Введите штрихкод и нажмите Enter, или нажмите «Сканировать», чтобы использовать камеру.\nТовар мгновенно добавляется в корзину, если найден.\nЕсли не найден — код ищется на сервере.\nЧтобы привязать штрихкоды к товарам, перейдите в Склад.',
    payMethod: 'Выберите способ оплаты: Наличные, Карта или Другое.\nЭто записывается только для вашего учёта.\nMiyZapis НЕ обрабатывает платежи. Вы принимаете оплату лично.',
  },
};

const POS: React.FC = () => {
  const { t, language } = useLanguage();
  const h = (POS_HELP as any)[language] || POS_HELP.en;
  const { formatPrice } = useCurrency();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [barcode, setBarcode] = useState('');
  const [cart, setCart] = useState<CartLine[]>([]);
  const [scanOpen, setScanOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [payMethod, setPayMethod] = useState<PayMethod>('CASH');
  const [discountInput, setDiscountInput] = useState('');
  const [gcInput, setGcInput] = useState('');
  const [gcLookupLoading, setGcLookupLoading] = useState(false);
  const [appliedGiftCard, setAppliedGiftCard] = useState<GiftCardLookup | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [receipt, setReceipt] = useState<ProductOrder | null>(null);
  const [refunding, setRefunding] = useState(false);
  const [todayOpen, setTodayOpen] = useState(false);
  const [todaySummary, setTodaySummary] = useState<TodaySummary | null>(null);
  const [todayLoading, setTodayLoading] = useState(false);
  // Customer link (optional) — enables the member's plan discount to apply at POS.
  const [selectedCustomer, setSelectedCustomer] = useState<CrmClient | null>(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerResults, setCustomerResults] = useState<CrmClient[]>([]);
  const [memberDiscountPct, setMemberDiscountPct] = useState(0);

  useEffect(() => {
    const q = customerSearch.trim();
    if (q.length < 2) { setCustomerResults([]); return; }
    const timer = setTimeout(async () => {
      try {
        const res = await crmService.getClients({ search: q });
        setCustomerResults((res || []).slice(0, 8));
      } catch { setCustomerResults([]); }
    }, 300);
    return () => clearTimeout(timer);
  }, [customerSearch]);

  const load = async () => {
    try {
      const list = await inventoryService.getProducts({});
      setProducts(list.filter((p) => p.isActive));
    } catch {
      toast.error(t('pos.loadError') || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return products;
    return products.filter(
      (p) => p.name.toLowerCase().includes(term)
        || (p.sku || '').toLowerCase().includes(term)
        || (p.barcode || '').toLowerCase().includes(term),
    );
  }, [products, search]);

  const currency = cart[0]?.product.currency || products[0]?.currency || 'UAH';
  const subtotal = round2(cart.reduce((s, l) => s + priceOf(l.product) * l.qty, 0));
  const discountAmt = round2(Math.max(0, Math.min(num(discountInput), subtotal)));
  const amountAfterDiscount = round2(subtotal - discountAmt);
  // Membership discount: % of the amount after the manual discount (mirrors the
  // server-side posSale math) — only when a member customer is linked.
  const memberDiscountAmt = round2(Math.max(0, Math.min(amountAfterDiscount * memberDiscountPct / 100, amountAfterDiscount)));
  const afterAllDiscounts = round2(amountAfterDiscount - memberDiscountAmt);
  const gcAppliedAmt = appliedGiftCard
    ? round2(Math.max(0, Math.min(num(appliedGiftCard.balance), afterAllDiscounts)))
    : 0;
  const total = round2(afterAllDiscounts - gcAppliedAmt);
  const itemCount = cart.reduce((s, l) => s + l.qty, 0);

  const addToCart = (product: Product, qty = 1) => {
    setCart((prev) => {
      const i = prev.findIndex((l) => l.product.id === product.id);
      const inStock = num(product.stockQty);
      if (i >= 0) {
        const next = [...prev];
        const newQty = Math.min(next[i].qty + qty, inStock);
        next[i] = { ...next[i], qty: newQty };
        return next;
      }
      if (inStock <= 0) { toast.info(t('pos.outOfStock') || 'Out of stock'); return prev; }
      return [...prev, { product, qty: Math.min(qty, inStock) }];
    });
  };

  const setQty = (id: string, qty: number) => {
    setCart((prev) => prev.flatMap((l) => {
      if (l.product.id !== id) return [l];
      const capped = Math.max(0, Math.min(qty, num(l.product.stockQty)));
      return capped === 0 ? [] : [{ ...l, qty: capped }];
    }));
  };

  const handleBarcode = async (code: string) => {
    const c = code.trim();
    if (!c) return;
    setBarcode('');
    // Try local list first (instant), else server lookup.
    const local = products.find((p) => p.barcode === c);
    if (local) { addToCart(local); return; }
    try {
      const { own } = await inventoryService.lookupBarcode(c);
      if (own) { addToCart(own as Product); await load(); }
      else toast.info(t('pos.unknownBarcode') || 'No product with that barcode');
    } catch { toast.error(t('pos.lookupFailed') || 'Lookup failed'); }
  };

  const handleLookupGiftCard = async () => {
    const code = gcInput.trim();
    if (!code) return;
    setGcLookupLoading(true);
    try {
      const card = await storeService.lookupGiftCard(code);
      // Currency guard (client-side warning; server enforces too).
      if (card.currency && currency && card.currency !== currency) {
        toast.error(
          (t('pos.gc.currencyMismatch') || 'Gift card currency does not match order currency') +
          ` (${card.currency} ≠ ${currency})`
        );
        return;
      }
      if (num(card.balance) <= 0) {
        toast.info(t('pos.gc.noBalance') || 'Gift card has no remaining balance');
        return;
      }
      setAppliedGiftCard(card);
      setGcInput('');
      toast.success(t('pos.gc.applied') || 'Gift card applied');
    } catch (err) {
      toast.error((err as Error).message || t('pos.gc.notFound') || 'Gift card not found');
    } finally {
      setGcLookupLoading(false);
    }
  };

  const completeSale = async () => {
    if (cart.length === 0) return;
    setSubmitting(true);
    try {
      const order = await storeService.posSale({
        items: cart.map((l) => ({ productId: l.product.id, quantity: l.qty })),
        paymentMethod: payMethod,
        customerUserId: selectedCustomer?.customerId,
        customerName: selectedCustomer?.name,
        discount: discountAmt > 0 ? discountAmt : undefined,
        giftCardCode: appliedGiftCard ? appliedGiftCard.code : undefined,
      });
      setReceipt(order);
      setCart([]);
      setDiscountInput('');
      setGcInput('');
      setAppliedGiftCard(null);
      setSelectedCustomer(null);
      setCustomerSearch('');
      setCustomerResults([]);
      setMemberDiscountPct(0);
      setCheckoutOpen(false);
      await load(); // refresh stock
    } catch (err) {
      toast.error((err as Error).message || t('pos.saleFailed') || 'Sale failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRefund = async () => {
    if (!receipt) return;
    setRefunding(true);
    try {
      await storeService.refundOrder(receipt.id);
      toast.success(t('pos.refundSuccess') || 'Sale refunded — stock restored');
      setReceipt(null);
      await load();
    } catch (err) {
      toast.error((err as Error).message || t('pos.refundFailed') || 'Refund failed');
    } finally {
      setRefunding(false);
    }
  };

  const openTodaySummary = async () => {
    setTodayOpen(true);
    // Always refresh — stale figures after a completed sale/refund would be misleading.
    setTodayLoading(true);
    try {
      const s = await storeService.todaySummary();
      setTodaySummary(s);
    } catch (err) {
      toast.error((err as Error).message || t('pos.summaryFailed') || 'Could not load today\'s summary');
    } finally {
      setTodayLoading(false);
    }
  };

  const refreshTodaySummary = async () => {
    setTodayLoading(true);
    try {
      const s = await storeService.todaySummary();
      setTodaySummary(s);
    } catch (err) {
      toast.error((err as Error).message || 'Refresh failed');
    } finally {
      setTodayLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 pb-48 lg:pb-28">
      <div className="flex items-center gap-2 mb-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white min-w-0 truncate">{t('pos.title') || 'Point of Sale'}</h1>
        <HelpTip title={t('pos.title') || 'Point of Sale'} content={h.overview} />
        <div className="ml-auto">
          <button
            onClick={openTodaySummary}
            className="px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition active:scale-[0.96]"
          >
            {t('pos.todaySales') || "Today's sales"}
          </button>
        </div>
      </div>

      {/* Search + barcode */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('pos.search') || 'Search products…'}
          className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
        />
        <div className="flex gap-2">
          <input
            type="text"
            inputMode="numeric"
            value={barcode}
            onChange={(e) => setBarcode(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleBarcode(barcode); }}
            placeholder={t('pos.scanBarcode') || 'Scan barcode (Enter)…'}
            className="flex-1 min-w-0 px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
          />
          <HelpTip title={t('pos.scanBarcode') || 'Barcode'} content={h.barcode} />
          <button
            type="button"
            onClick={() => setScanOpen(true)}
            className="flex-shrink-0 px-4 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-medium text-sm transition active:scale-[0.96]"
          >
            {t('pos.scan') || 'Scan'}
          </button>
        </div>
      </div>

      <BarcodeScanner isOpen={scanOpen} onClose={() => setScanOpen(false)} onDetected={(code) => handleBarcode(code)} />

      {/* Product grid */}
      {loading ? (
        <p className="text-gray-500 dark:text-gray-400">{t('common.loading') || 'Loading…'}</p>
      ) : filtered.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400">{t('pos.noProducts') || 'No products. Add them in Inventory first.'}</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {filtered.map((p) => {
            const stock = num(p.stockQty);
            return (
              <button
                key={p.id}
                onClick={() => addToCart(p)}
                disabled={stock <= 0}
                className="text-left rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 hover:border-primary-400 hover:shadow-md transition active:scale-[0.96] disabled:active:scale-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {p.imageUrl ? (
                  <img src={getAbsoluteImageUrl(p.imageUrl)} alt="" className="w-full h-20 object-cover rounded-xl mb-2 ring-1 ring-inset ring-black/10 dark:ring-white/10" />
                ) : (
                  <div className="w-full h-20 rounded-xl mb-2 bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-400 text-xs">{t('inventory.noPhoto') || 'No photo'}</div>
                )}
                <div className="font-medium text-sm text-gray-900 dark:text-white truncate">{p.name}</div>
                <div className="flex items-center justify-between mt-0.5">
                  <span className="text-sm font-semibold text-primary-600 dark:text-primary-400 tabular-nums">{formatPrice(priceOf(p), p.currency as any)}</span>
                  <span className={`text-[11px] tabular-nums ${stock <= 0 ? 'text-red-500' : 'text-gray-400'}`}>{stock} {t('pos.inStock') || 'in stock'}</span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Sticky cart bar */}
      {itemCount > 0 && createPortal(
        <motion.div
          initial={{ y: 24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: 'spring', duration: 0.3, bounce: 0 }}
          className="fixed left-0 right-0 z-40 bg-white/95 dark:bg-gray-900/95 backdrop-blur border-t border-gray-200 dark:border-gray-700 p-3 sm:p-4 bottom-[calc(5rem_+_env(safe-area-inset-bottom))] lg:bottom-0"
        >
          <div className="max-w-3xl mx-auto flex items-center gap-3">
            <button onClick={() => { setCart([]); setAppliedGiftCard(null); setGcInput(''); setDiscountInput(''); }} className="text-sm text-gray-500 dark:text-gray-400 hover:text-red-500 px-2 transition active:scale-[0.96]">{t('pos.clear') || 'Clear'}</button>
            <div className="flex-1 text-right">
              <span className="text-xs text-gray-500 dark:text-gray-400 tabular-nums">{itemCount} {t('pos.items') || 'items'}</span>
              <div className="text-lg font-bold text-gray-900 dark:text-white tabular-nums">{formatPrice(subtotal, currency as any)}</div>
            </div>
            <button onClick={() => { setCheckoutOpen(true); }} className="px-5 py-3 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-semibold transition active:scale-[0.96]">
              {t('pos.checkout') || 'Checkout'}
            </button>
          </div>
        </motion.div>
      , document.body)}

      {/* Checkout modal */}
      {checkoutOpen && createPortal(
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4"
        >
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: 'spring', duration: 0.3, bounce: 0 }}
            className="w-full sm:max-w-md bg-white dark:bg-gray-800 rounded-t-2xl sm:rounded-2xl max-h-[90vh] overflow-y-auto pb-[env(safe-area-inset-bottom)] sm:pb-0"
          >
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('pos.reviewSale') || 'Review sale'}</h3>
              <button onClick={() => { setCheckoutOpen(false); setGcInput(''); setAppliedGiftCard(null); }} aria-label={t('common.close') || 'Close'} className="w-10 h-10 -mr-2 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xl transition active:scale-[0.96]">×</button>
            </div>
            <div className="p-4 space-y-2">
              {cart.map((l) => (
                <div key={l.product.id} className="flex items-center gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 dark:text-white truncate">{l.product.name}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 tabular-nums">{formatPrice(priceOf(l.product), l.product.currency as any)}</div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => setQty(l.product.id, l.qty - 1)} aria-label="−" className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 transition active:scale-[0.96]">−</button>
                    <span className="w-8 text-center text-sm font-medium text-gray-900 dark:text-white tabular-nums">{l.qty}</span>
                    <button onClick={() => setQty(l.product.id, l.qty + 1)} aria-label="+" className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 transition active:scale-[0.96]">+</button>
                  </div>
                  <div className="w-20 text-right text-sm font-semibold text-gray-900 dark:text-white tabular-nums">{formatPrice(priceOf(l.product) * l.qty, l.product.currency as any)}</div>
                </div>
              ))}
            </div>
            {/* Customer (optional) — links the sale to a client so their membership discount applies */}
            <div className="px-4 pt-1 pb-1">
              {selectedCustomer ? (
                <div className="flex items-center justify-between gap-2 rounded-xl bg-primary-50 dark:bg-primary-900/20 px-3 py-2">
                  <span className="text-sm font-medium text-primary-700 dark:text-primary-300 truncate">👤 {selectedCustomer.name}</span>
                  <button type="button" onClick={() => { setSelectedCustomer(null); setMemberDiscountPct(0); }} className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 active:scale-[0.96]">{t('common.clear') || 'Clear'}</button>
                </div>
              ) : (
                <div className="relative">
                  <input
                    type="text"
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                    placeholder={t('pos.linkClient') || 'Link a client (optional) — search by name'}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                  {customerResults.length > 0 && (
                    <div className="absolute z-10 left-0 right-0 mt-1 max-h-44 overflow-y-auto rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 shadow-lg">
                      {customerResults.map((c) => (
                        <button type="button" key={c.customerId} onClick={() => { setSelectedCustomer(c); setCustomerSearch(''); setCustomerResults([]); storeService.getMemberDiscount(c.customerId).then(setMemberDiscountPct).catch(() => setMemberDiscountPct(0)); }}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white">
                          {c.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="px-4 pb-2 border-t border-gray-100 dark:border-gray-700 pt-3 space-y-1.5">
              <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                <span>{t('pos.subtotal') || 'Subtotal'}</span>
                <span className="tabular-nums">{formatPrice(subtotal, currency as any)}</span>
              </div>
              {/* Discount row */}
              <div className="flex items-center justify-between gap-2">
                <label className="text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">{t('pos.discount') || 'Discount'}</label>
                <div className="flex items-center gap-1">
                  <span className="text-sm text-gray-500 dark:text-gray-400">{currency === 'UAH' ? '₴' : currency}</span>
                  <input
                    type="number"
                    min="0"
                    max={subtotal}
                    step="any"
                    value={discountInput}
                    onChange={(e) => setDiscountInput(e.target.value)}
                    placeholder="0"
                    className="w-24 px-2 py-1 text-sm text-right tabular-nums border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>
              {discountAmt > 0 && (
                <div className="flex items-center justify-between text-sm text-green-600 dark:text-green-400">
                  <span>{t('pos.discountApplied') || 'Discount applied'}</span>
                  <span className="tabular-nums">−{formatPrice(discountAmt, currency as any)}</span>
                </div>
              )}
              {memberDiscountAmt > 0 && (
                <div className="flex items-center justify-between text-sm text-green-600 dark:text-green-400">
                  <span>{t('pos.memberDiscount') || 'Member discount'} ({memberDiscountPct}%)</span>
                  <span className="tabular-nums">−{formatPrice(memberDiscountAmt, currency as any)}</span>
                </div>
              )}
              {/* Gift card row */}
              <div className="flex items-center justify-between gap-2 pt-0.5 min-w-0">
                <label className="flex-shrink-0 text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">{t('pos.gc.label') || 'Gift card'}</label>
                {appliedGiftCard ? (
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-sm font-mono text-green-700 dark:text-green-400 tabular-nums truncate min-w-0">{appliedGiftCard.code}</span>
                    <button
                      type="button"
                      onClick={() => { setAppliedGiftCard(null); setGcInput(''); }}
                      className="flex-shrink-0 text-xs text-red-500 hover:underline transition active:scale-[0.96] py-1 px-1"
                    >
                      {t('pos.gc.remove') || 'Remove'}
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 min-w-0">
                    <input
                      type="text"
                      value={gcInput}
                      onChange={(e) => setGcInput(e.target.value.toUpperCase())}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleLookupGiftCard(); }}
                      placeholder={t('pos.gc.placeholder') || 'GC-XXXX-XXXX'}
                      className="w-24 sm:w-32 min-w-0 px-2 py-2 text-sm font-mono text-right border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                    />
                    <button
                      type="button"
                      onClick={handleLookupGiftCard}
                      disabled={gcLookupLoading || !gcInput.trim()}
                      className="px-3 py-2 rounded-lg bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium transition active:scale-[0.96] disabled:opacity-50 disabled:active:scale-100"
                    >
                      {gcLookupLoading ? '…' : (t('pos.gc.apply') || 'Apply')}
                    </button>
                  </div>
                )}
              </div>
              {appliedGiftCard && gcAppliedAmt > 0 && (
                <div className="flex items-center justify-between text-sm text-green-600 dark:text-green-400">
                  <span>{t('pos.gc.appliedLine') || 'Gift card applied'}</span>
                  <span className="tabular-nums">−{formatPrice(gcAppliedAmt, currency as any)}</span>
                </div>
              )}
              <div className="flex items-center justify-between font-semibold text-gray-900 dark:text-white border-t border-gray-100 dark:border-gray-700 pt-1.5">
                <span>{t('pos.total') || 'Total'}</span>
                <span className="text-xl tabular-nums">{formatPrice(total, currency as any)}</span>
              </div>
            </div>
            <div className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <p className="text-sm text-gray-600 dark:text-gray-400">{t('pos.paidWith') || 'Paid with'}</p>
                <HelpTip title={t('pos.paidWith') || 'Payment method'} content={h.payMethod} />
              </div>
              <div className="grid grid-cols-3 gap-2 mb-4">
                {(['CASH', 'CARD', 'OTHER'] as PayMethod[]).map((m) => (
                  <button key={m} onClick={() => setPayMethod(m)}
                    className={`py-2.5 rounded-xl text-sm font-medium border transition active:scale-[0.96] ${payMethod === m ? 'bg-primary-600 text-white border-primary-600' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600'}`}>
                    {t(`pos.pay.${m.toLowerCase()}`) || m}
                  </button>
                ))}
              </div>
              <button onClick={completeSale} disabled={submitting}
                className="w-full py-3 rounded-xl bg-green-600 hover:bg-green-700 text-white font-semibold tabular-nums transition active:scale-[0.96] disabled:active:scale-100 disabled:opacity-60">
                {submitting ? (t('pos.processing') || 'Processing…') : `${t('pos.completeSale') || 'Complete sale'} · ${formatPrice(total, currency as any)}`}
              </button>
            </div>
          </motion.div>
        </motion.div>
      , document.body)}

      {/* Today's sales summary modal */}
      {todayOpen && createPortal(
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: 'spring', duration: 0.3, bounce: 0 }}
            className="w-full max-w-sm bg-white dark:bg-gray-800 rounded-2xl p-5"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {t('pos.todaySales') || "Today's sales"}
                {todaySummary && <span className="ml-2 text-sm font-normal text-gray-400">({todaySummary.date})</span>}
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={refreshTodaySummary}
                  disabled={todayLoading}
                  className="text-sm text-primary-600 dark:text-primary-400 hover:underline disabled:opacity-50"
                >
                  {t('common.refresh') || 'Refresh'}
                </button>
                <button onClick={() => setTodayOpen(false)} aria-label={t('common.close') || 'Close'} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xl transition active:scale-[0.96]">×</button>
              </div>
            </div>
            {todayLoading && !todaySummary ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">{t('common.loading') || 'Loading…'}</p>
            ) : todaySummary ? (
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">{t('pos.sales') || 'Sales'}</span>
                  <span className="font-semibold tabular-nums text-gray-900 dark:text-white">{todaySummary.count}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">{t('pos.gross') || 'Gross total'}</span>
                  <span className="font-semibold tabular-nums text-gray-900 dark:text-white">{formatPrice(todaySummary.gross, todaySummary.currency as any)}</span>
                </div>
                {Object.keys(todaySummary.byMethod).length > 0 && (
                  <div className="border-t border-gray-100 dark:border-gray-700 pt-2 space-y-1.5">
                    {Object.entries(todaySummary.byMethod).map(([method, amount]) => (
                      <div key={method} className="flex justify-between text-sm">
                        <span className="text-gray-500 dark:text-gray-400">{t(`pos.pay.${method.toLowerCase()}`) || method}</span>
                        <span className="tabular-nums text-gray-900 dark:text-white">{formatPrice(amount, todaySummary.currency as any)}</span>
                      </div>
                    ))}
                  </div>
                )}
                {todaySummary.refundedTotal > 0 && (
                  <div className="flex justify-between text-sm border-t border-gray-100 dark:border-gray-700 pt-2">
                    <span className="text-red-500 dark:text-red-400">{t('pos.refunded') || 'Refunded'}</span>
                    <span className="tabular-nums text-red-500 dark:text-red-400">−{formatPrice(todaySummary.refundedTotal, todaySummary.currency as any)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-gray-900 dark:text-white border-t border-gray-200 dark:border-gray-600 pt-2">
                  <span>{t('pos.net') || 'Net'}</span>
                  <span className="tabular-nums">{formatPrice(todaySummary.gross - todaySummary.refundedTotal, todaySummary.currency as any)}</span>
                </div>
              </div>
            ) : null}
          </motion.div>
        </motion.div>
      , document.body)}

      {/* Receipt */}
      {receipt && createPortal(
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 print:bg-white"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: 'spring', duration: 0.3, bounce: 0 }}
            className="print-area w-full max-w-xs bg-white dark:bg-gray-800 rounded-2xl p-5 print:shadow-none print:max-w-none" id="pos-receipt">
            <div className="text-center mb-3">
              <div className="text-lg font-bold text-gray-900 dark:text-white">MiyZapis</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">{t('pos.receipt') || 'Receipt'} · {receipt.orderNumber}</div>
            </div>
            <div className="space-y-1 border-t border-dashed border-gray-300 dark:border-gray-600 pt-2">
              {(receipt.items || []).map((it: any) => (
                <div key={it.id} className="flex justify-between text-sm text-gray-800 dark:text-gray-200">
                  <span className="truncate">{it.name} × <span className="tabular-nums">{num(it.quantity)}</span></span>
                  <span className="tabular-nums">{formatPrice(num(it.unitPrice) * num(it.quantity), receipt.currency)}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-dashed border-gray-300 dark:border-gray-600 mt-2 pt-2 space-y-1">
              {num(receipt.discount) > 0 && (
                <div className="flex justify-between text-sm text-green-600 dark:text-green-400">
                  <span>{t('pos.discount') || 'Discount'}</span>
                  <span className="tabular-nums">−{formatPrice(num(receipt.discount), receipt.currency)}</span>
                </div>
              )}
              {num(receipt.giftCardAmount) > 0 && (
                <div className="flex justify-between text-sm text-green-600 dark:text-green-400">
                  <span>{t('pos.gc.receiptLine') || 'Gift card'}</span>
                  <span className="tabular-nums">−{formatPrice(num(receipt.giftCardAmount), receipt.currency)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-gray-900 dark:text-white">
                <span>{t('pos.total') || 'Total'}</span>
                <span className="tabular-nums">{formatPrice(num(receipt.total), receipt.currency)}</span>
              </div>
              {receipt.paymentMethod && (
                <div className="text-xs text-center text-gray-400 dark:text-gray-500 tabular-nums">
                  {t(`pos.pay.${receipt.paymentMethod.toLowerCase()}`) || receipt.paymentMethod}
                </div>
              )}
            </div>
            <div className="flex gap-2 mt-4 print:hidden">
              <button onClick={() => window.print()} className="flex-1 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 text-sm font-medium transition active:scale-[0.96]">{t('pos.print') || 'Print'}</button>
              <button onClick={() => setReceipt(null)} className="flex-1 py-2.5 rounded-xl bg-primary-600 text-white text-sm font-medium transition active:scale-[0.96]">{t('pos.newSale') || 'New sale'}</button>
            </div>
            {receipt.status !== 'REFUNDED' && (
              <div className="mt-2 print:hidden">
                <button
                  onClick={handleRefund}
                  disabled={refunding}
                  className="w-full py-2 rounded-xl border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 text-sm font-medium hover:bg-red-50 dark:hover:bg-red-900/20 transition active:scale-[0.96] disabled:opacity-60 disabled:active:scale-100"
                >
                  {refunding ? (t('pos.refunding') || 'Refunding…') : (t('pos.refundSale') || 'Refund this sale')}
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      , document.body)}
    </div>
  );
};

export default POS;

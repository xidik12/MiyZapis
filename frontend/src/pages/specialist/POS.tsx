import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { HelpTip } from '@/components/common/HelpTip';
import { inventoryService, Product } from '@/services/inventory.service';
import { storeService } from '@/services/store.service';
import BarcodeScanner from '@/components/common/BarcodeScanner';

type PayMethod = 'CASH' | 'CARD' | 'OTHER';
interface CartLine { product: Product; qty: number }

const num = (v: number | string | null | undefined): number =>
  v == null ? 0 : typeof v === 'number' ? v : Number(v) || 0;
const priceOf = (p: Product): number => num(p.salePrice ?? p.costPrice);

const POS: React.FC = () => {
  const { t } = useLanguage();
  const { formatPrice } = useCurrency();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [barcode, setBarcode] = useState('');
  const [cart, setCart] = useState<CartLine[]>([]);
  const [scanOpen, setScanOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [payMethod, setPayMethod] = useState<PayMethod>('CASH');
  const [submitting, setSubmitting] = useState(false);
  const [receipt, setReceipt] = useState<any | null>(null);

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
  const total = cart.reduce((s, l) => s + priceOf(l.product) * l.qty, 0);
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

  const completeSale = async () => {
    if (cart.length === 0) return;
    setSubmitting(true);
    try {
      const order = await storeService.posSale({
        items: cart.map((l) => ({ productId: l.product.id, quantity: l.qty })),
        paymentMethod: payMethod,
      });
      setReceipt(order);
      setCart([]);
      setCheckoutOpen(false);
      await load(); // refresh stock
    } catch (err) {
      toast.error((err as Error).message || t('pos.saleFailed') || 'Sale failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 pb-28">
      <div className="flex items-center gap-2 mb-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('pos.title') || 'Point of Sale'}</h1>
        <HelpTip title={t('pos.title') || 'Point of Sale'} content={t('pos.help') || 'Scan or tap products to build a sale, choose how the customer paid (cash/card), and complete it. Stock is deducted automatically and the sale counts toward your revenue. Payment is taken in person — the platform does not process it.'} />
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
                  <img src={p.imageUrl} alt="" className="w-full h-20 object-cover rounded-xl mb-2 ring-1 ring-inset ring-black/10 dark:ring-white/10" />
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
      {itemCount > 0 && (
        <motion.div
          initial={{ y: 24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: 'spring', duration: 0.3, bounce: 0 }}
          className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-gray-900/95 backdrop-blur border-t border-gray-200 dark:border-gray-700 p-3 sm:p-4"
        >
          <div className="max-w-3xl mx-auto flex items-center gap-3">
            <button onClick={() => setCart([])} className="text-sm text-gray-500 dark:text-gray-400 hover:text-red-500 px-2 transition active:scale-[0.96]">{t('pos.clear') || 'Clear'}</button>
            <div className="flex-1 text-right">
              <span className="text-xs text-gray-500 dark:text-gray-400 tabular-nums">{itemCount} {t('pos.items') || 'items'}</span>
              <div className="text-lg font-bold text-gray-900 dark:text-white tabular-nums">{formatPrice(total, currency as any)}</div>
            </div>
            <button onClick={() => { setCheckoutOpen(true); }} className="px-5 py-3 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-semibold transition active:scale-[0.96]">
              {t('pos.checkout') || 'Checkout'}
            </button>
          </div>
        </motion.div>
      )}

      {/* Checkout modal */}
      {checkoutOpen && (
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
            className="w-full sm:max-w-md bg-white dark:bg-gray-800 rounded-t-2xl sm:rounded-2xl max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('pos.reviewSale') || 'Review sale'}</h3>
              <button onClick={() => setCheckoutOpen(false)} aria-label={t('common.close') || 'Close'} className="w-10 h-10 -mr-2 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xl transition active:scale-[0.96]">×</button>
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
            <div className="px-4 pb-2 flex items-center justify-between border-t border-gray-100 dark:border-gray-700 pt-3">
              <span className="font-semibold text-gray-900 dark:text-white">{t('pos.total') || 'Total'}</span>
              <span className="text-xl font-bold text-gray-900 dark:text-white tabular-nums">{formatPrice(total, currency as any)}</span>
            </div>
            <div className="p-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{t('pos.paidWith') || 'Paid with'}</p>
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
      )}

      {/* Receipt */}
      {receipt && (
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
            className="w-full max-w-xs bg-white dark:bg-gray-800 rounded-2xl p-5 print:shadow-none" id="pos-receipt">
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
            <div className="flex justify-between font-bold text-gray-900 dark:text-white border-t border-dashed border-gray-300 dark:border-gray-600 mt-2 pt-2">
              <span>{t('pos.total') || 'Total'}</span>
              <span className="tabular-nums">{formatPrice(num(receipt.total), receipt.currency)}</span>
            </div>
            <div className="flex gap-2 mt-4 print:hidden">
              <button onClick={() => window.print()} className="flex-1 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 text-sm font-medium transition active:scale-[0.96]">{t('pos.print') || 'Print'}</button>
              <button onClick={() => setReceipt(null)} className="flex-1 py-2.5 rounded-xl bg-primary-600 text-white text-sm font-medium transition active:scale-[0.96]">{t('pos.newSale') || 'New sale'}</button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default POS;

import React, { useMemo, useState } from 'react';
import Barcode from './Barcode';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { Product } from '@/services/inventory.service';

interface LabelPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
}

const num = (v: number | string | null | undefined): number =>
  v == null ? 0 : typeof v === 'number' ? v : Number(v) || 0;
const priceOf = (p: Product): number => num(p.salePrice ?? p.costPrice);

// Generate printable barcode labels (name + barcode + price) to stick on
// products. Pick how many copies of each, then print on label paper.
const LabelPrintModal: React.FC<LabelPrintModalProps> = ({ isOpen, onClose, products }) => {
  const { t } = useLanguage();
  const { formatPrice } = useCurrency();
  const printable = useMemo(() => products.filter((p) => p.barcode), [products]);
  const [copies, setCopies] = useState<Record<string, number>>({});

  if (!isOpen) return null;

  const labels: Product[] = [];
  printable.forEach((p) => {
    const n = copies[p.id] ?? 1;
    for (let i = 0; i < n; i++) labels.push(p);
  });

  return (
    <div className="fixed inset-0 z-[65] bg-black/50 flex items-center justify-center p-4 print:bg-white print:p-0">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-800 rounded-2xl print:rounded-none">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between print:hidden">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('labels.title') || 'Print barcode labels'}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xl">×</button>
        </div>

        <div className="p-4 print:hidden">
          {printable.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">{t('labels.none') || 'No products have a barcode yet. Add barcodes in Inventory.'}</p>
          ) : (
            <>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{t('labels.copiesHint') || 'Copies per product:'}</p>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {printable.map((p) => (
                  <div key={p.id} className="flex items-center justify-between gap-2">
                    <span className="text-sm text-gray-800 dark:text-gray-200 truncate">{p.name}</span>
                    <input
                      type="number"
                      min={0}
                      value={copies[p.id] ?? 1}
                      onChange={(e) => setCopies({ ...copies, [p.id]: Math.max(0, parseInt(e.target.value) || 0) })}
                      className="w-16 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-right bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                ))}
              </div>
              <button
                onClick={() => window.print()}
                disabled={labels.length === 0}
                className="mt-4 w-full py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-semibold disabled:opacity-50"
              >
                {(t('labels.print') || 'Print')} ({labels.length})
              </button>
            </>
          )}
        </div>

        {/* Printable sheet — isolated via the global .print-area rule. */}
        <div className="print-area p-4 grid grid-cols-3 gap-2">
          {labels.map((p, i) => (
            <div key={i} className="border border-gray-300 rounded p-2 text-center" style={{ breakInside: 'avoid' }}>
              <div className="text-[11px] font-medium text-gray-900 truncate">{p.name}</div>
              <Barcode value={p.barcode!} height={34} />
              <div className="text-[11px] font-semibold text-gray-900">{formatPrice(priceOf(p), p.currency as any)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LabelPrintModal;

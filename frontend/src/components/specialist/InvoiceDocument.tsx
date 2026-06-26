import React from 'react';
import { createPortal } from 'react-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAppSelector } from '../../hooks/redux';
import { selectUser } from '../../store/slices/authSlice';
import type { Invoice, InvoiceLineItem } from '../../services/accounting.service';

/**
 * Printable / downloadable invoice document. Renders a clean A4-style invoice in a
 * modal overlay; "Print / Save as PDF" opens the browser print dialog (the user can
 * pick a printer or "Save as PDF"). Print CSS hides everything but the document.
 */
const InvoiceDocument: React.FC<{ invoice: Invoice; onClose: () => void }> = ({ invoice, onClose }) => {
  const { t } = useLanguage();
  const user = useAppSelector(selectUser) as any;
  const businessName =
    user?.businessName || user?.specialist?.businessName ||
    [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'MiyZapis';

  let lineItems: InvoiceLineItem[] = [];
  try { lineItems = JSON.parse(invoice.lineItems || '[]'); } catch { lineItems = []; }

  const money = (n: number) =>
    `${invoice.currency} ${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const balanceDue = Number(invoice.total || 0) - Number(invoice.amountPaid || 0);

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-start sm:items-center justify-center p-0 sm:p-4 bg-black/50 print:bg-white print:p-0 print:block overflow-y-auto">
      <div className="print-area w-full sm:max-w-2xl bg-white text-gray-900 rounded-none sm:rounded-xl shadow-xl my-0 sm:my-8 print:shadow-none print:my-0" id="invoice-document">
        {/* Action bar (hidden in print) */}
        <div className="flex items-center justify-between gap-2 px-5 py-3 border-b border-gray-200 print:hidden">
          <span className="text-sm font-medium text-gray-500">{t('invoice.preview') || 'Invoice preview'}</span>
          <div className="flex gap-2">
            <button onClick={() => window.print()} className="px-3 py-1.5 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 transition active:scale-[0.96]">
              {t('invoice.printDownload') || 'Print / Save as PDF'}
            </button>
            <button onClick={onClose} className="px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700 text-sm font-medium hover:bg-gray-200 transition active:scale-[0.96]">
              {t('common.close') || 'Close'}
            </button>
          </div>
        </div>

        {/* The document */}
        <div className="p-6 sm:p-8 print:p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-xl font-bold">{businessName}</div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold tracking-tight">{t('invoice.title') || 'INVOICE'}</div>
              <div className="text-sm text-gray-600 font-mono mt-1">{invoice.invoiceNumber}</div>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-xs uppercase tracking-wide text-gray-400">{t('invoice.billTo') || 'Bill to'}</div>
              <div className="font-medium">{invoice.clientName}</div>
              {invoice.clientEmail && <div className="text-gray-600">{invoice.clientEmail}</div>}
              {invoice.clientAddress && <div className="text-gray-600 whitespace-pre-line">{invoice.clientAddress}</div>}
              {invoice.clientTaxId && <div className="text-gray-600">{t('invoice.taxId') || 'Tax ID'}: {invoice.clientTaxId}</div>}
            </div>
            <div className="text-right">
              <div><span className="text-gray-400">{t('invoice.issued') || 'Issued'}: </span>{invoice.issueDate?.slice(0, 10)}</div>
              {invoice.dueDate && <div><span className="text-gray-400">{t('invoice.due') || 'Due'}: </span>{invoice.dueDate.slice(0, 10)}</div>}
              <div className="mt-1 inline-block px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-700">{invoice.status}</div>
            </div>
          </div>

          {/* Line items */}
          <table className="w-full mt-6 text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-gray-400 border-b border-gray-200">
                <th className="py-2">{t('invoice.description') || 'Description'}</th>
                <th className="py-2 text-right">{t('invoice.qty') || 'Qty'}</th>
                <th className="py-2 text-right">{t('invoice.unitPrice') || 'Unit price'}</th>
                <th className="py-2 text-right">{t('invoice.amount') || 'Amount'}</th>
              </tr>
            </thead>
            <tbody>
              {lineItems.map((li, i) => (
                <tr key={i} className="border-b border-gray-100">
                  <td className="py-2 pr-2">{li.description}</td>
                  <td className="py-2 text-right tabular-nums">{li.quantity}</td>
                  <td className="py-2 text-right tabular-nums">{money(li.unitPrice)}</td>
                  <td className="py-2 text-right tabular-nums">{money(li.total ?? li.quantity * li.unitPrice)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div className="mt-4 flex justify-end">
            <div className="w-full sm:w-64 text-sm space-y-1">
              <div className="flex justify-between"><span className="text-gray-500">{t('invoice.subtotal') || 'Subtotal'}</span><span className="tabular-nums">{money(invoice.subtotal)}</span></div>
              {Number(invoice.taxAmount) > 0 && (
                <div className="flex justify-between"><span className="text-gray-500">{t('invoice.tax') || 'Tax'} ({invoice.taxRate}%)</span><span className="tabular-nums">{money(invoice.taxAmount)}</span></div>
              )}
              <div className="flex justify-between font-bold text-base border-t border-gray-200 pt-1"><span>{t('invoice.total') || 'Total'}</span><span className="tabular-nums">{money(invoice.total)}</span></div>
              {Number(invoice.amountPaid) > 0 && (
                <>
                  <div className="flex justify-between text-green-700"><span>{t('invoice.paid') || 'Paid'}</span><span className="tabular-nums">−{money(invoice.amountPaid)}</span></div>
                  <div className="flex justify-between font-semibold"><span>{t('invoice.balanceDue') || 'Balance due'}</span><span className="tabular-nums">{money(balanceDue)}</span></div>
                </>
              )}
            </div>
          </div>

          {invoice.notes && (
            <div className="mt-6 text-sm text-gray-600">
              <div className="text-xs uppercase tracking-wide text-gray-400">{t('invoice.notes') || 'Notes'}</div>
              <div className="whitespace-pre-line">{invoice.notes}</div>
            </div>
          )}

          <div className="mt-8 text-center text-xs text-gray-400">{t('invoice.footer') || 'Generated with MiyZapis'}</div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default InvoiceDocument;

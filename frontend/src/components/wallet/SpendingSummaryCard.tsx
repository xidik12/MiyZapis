import React, { useEffect, useState } from 'react';
import { bookingService } from '@/services/booking.service';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { getBookingCurrency } from '@/utils/bookingUtils';

// Read-only "spending history" summary for the customer wallet: how much the
// customer has actually spent on completed visits. Payments happen directly
// with the master (no platform balance to debit), so this is informational.
// Currency-aware: each booking is converted from its own service currency into
// the display currency BEFORE summing — never sum mixed currencies raw.
const SpendingSummaryCard: React.FC = () => {
  const { t } = useLanguage();
  const { formatPrice, convertPrice, currency } = useCurrency();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res: any = await bookingService.getBookings(
          { limit: 500, status: 'COMPLETED' as any },
          'customer',
        );
        const list: any[] = Array.isArray(res?.bookings) ? res.bookings : [];
        if (!cancelled) setBookings(list);
      } catch {
        /* non-fatal — leave at 0 */
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Recompute on currency change (convertPrice targets the display currency).
  const total = bookings.reduce(
    (sum, b) => sum + convertPrice(Number(b.totalAmount || 0), getBookingCurrency(b)),
    0,
  );

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-gradient-to-br from-primary-50 to-white dark:from-primary-900/15 dark:to-gray-900 p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
            {t('wallet.spending.title') || 'Total spent on completed visits'}
          </p>
          <p className="mt-1 text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tabular-nums">
            {loading ? '…' : formatPrice(total, currency)}
          </p>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {loading
              ? ''
              : <><span className="tabular-nums">{bookings.length}</span> {t('wallet.spending.completedVisits') || 'completed visits'}</>}
          </p>
        </div>
        <span
          aria-hidden="true"
          className="flex-shrink-0 w-11 h-11 rounded-xl bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center"
        >
          <svg className="w-6 h-6 text-primary-600 dark:text-primary-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 7h18M3 12h18M3 17h10" />
          </svg>
        </span>
      </div>
      <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
        {t('wallet.spending.note') || 'You pay the specialist directly at the visit.'}
      </p>
    </div>
  );
};

export default SpendingSummaryCard;

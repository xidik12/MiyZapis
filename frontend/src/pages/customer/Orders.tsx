import React, { useState, useEffect, useMemo } from 'react';
import { toast } from 'react-toastify';
import { useLanguage } from '../../contexts/LanguageContext';
import { useCurrency } from '../../contexts/CurrencyContext';
import { storeService, ProductOrder, ORDER_STATUSES, OrderStatus } from '../../services/store.service';
import { BuildingStorefrontIcon, ClockIcon } from '@/components/icons';
import { FullScreenHandshakeLoader } from '@/components/ui/FullScreenHandshakeLoader';

// ---- Types ----------------------------------------------------------------

type EnrichedOrder = ProductOrder & { sellerName?: string | null };

// ---- Status badge helpers (mirrored from Sales.tsx) -----------------------

const orderStatusBadgeClass = (status: OrderStatus): string => {
  switch (status) {
    case 'PENDING':   return 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300';
    case 'PAID':      return 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400';
    case 'FULFILLED': return 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400';
    case 'CANCELLED': return 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400';
    case 'REFUNDED':  return 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400';
    default:          return 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300';
  }
};

// ---- Component ------------------------------------------------------------

const CustomerOrders: React.FC = () => {
  const { t } = useLanguage();
  const { formatPrice } = useCurrency();

  const [orders, setOrders] = useState<EnrichedOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const itemsPerPage = 10;

  const load = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await storeService.getMyOrders();
      setOrders(data);
    } catch (err: unknown) {
      const msg = (err as Error).message || t('errors.loadingFailed');
      setError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // Filter + paginate
  const filtered = useMemo(() => {
    if (statusFilter === 'all') return orders;
    return orders.filter((o) => o.status === statusFilter);
  }, [orders, statusFilter]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated = useMemo(
    () => filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage),
    [filtered, currentPage]
  );

  // Reset to page 1 when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter]);

  const orderStatusLabel = (status: OrderStatus): string => {
    const map: Record<OrderStatus, string> = {
      PENDING:   t('store.status.pending')   || 'Pending',
      PAID:      t('store.status.paid')      || 'Paid',
      FULFILLED: t('store.status.fulfilled') || 'Fulfilled',
      CANCELLED: t('store.status.cancelled') || 'Cancelled',
      REFUNDED:  t('store.statusRefunded')   || 'Refunded',
    };
    return map[status] ?? status;
  };

  const getStatusBadge = (status: OrderStatus) => (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${orderStatusBadgeClass(status)}`}
    >
      {orderStatusLabel(status)}
    </span>
  );

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });

  const toNum = (v: number | string): number =>
    typeof v === 'number' ? v : parseFloat(v as string) || 0;

  if (isLoading) return <FullScreenHandshakeLoader />;

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-yellow-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 sm:p-6">
            <div className="flex items-center">
              <svg className="h-5 w-5 text-red-400 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800 dark:text-red-300">{t('errors.loadingFailed')}</h3>
                <p className="mt-1 text-sm text-red-700 dark:text-red-400">{error}</p>
              </div>
            </div>
            <div className="mt-4">
              <button
                onClick={load}
                className="bg-red-100 hover:bg-red-200 dark:bg-red-800 dark:hover:bg-red-700 text-red-800 dark:text-red-200 font-medium py-2 px-4 rounded-xl transition active:scale-[0.96]"
              >
                {t('actions.retry')}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-yellow-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-4 sm:py-8">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">

        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-1 sm:mb-2">
            {t('customer.orders.title')}
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
            {t('customer.orders.subtitle')}
          </p>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
          {(
            [
              { label: t('store.orders') || 'Total orders', value: orders.length, color: 'text-gray-900 dark:text-white' },
              { label: t('store.status.pending') || 'Pending',   value: orders.filter((o) => o.status === 'PENDING').length,   color: 'text-gray-600 dark:text-gray-300' },
              { label: t('store.status.paid') || 'Paid',         value: orders.filter((o) => o.status === 'PAID').length,       color: 'text-amber-600 dark:text-amber-400' },
              { label: t('store.status.fulfilled') || 'Fulfilled', value: orders.filter((o) => o.status === 'FULFILLED').length, color: 'text-green-600 dark:text-green-400' },
            ] as { label: string; value: number; color: string }[]
          ).map((stat) => (
            <div key={stat.label} className="bg-white dark:bg-gray-800 rounded-xl p-3 sm:p-4 shadow-sm border border-gray-100 dark:border-gray-700">
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 truncate">{stat.label}</p>
              <p className={`text-xl sm:text-2xl font-bold tabular-nums ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Status filter */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-3 sm:p-4 mb-4 sm:mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t('bookings.status')}
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition active:scale-[0.96] ${
                statusFilter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {t('filters.all')}
            </button>
            {ORDER_STATUSES.map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition active:scale-[0.96] ${
                  statusFilter === s
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {orderStatusLabel(s)}
              </button>
            ))}
          </div>
        </div>

        {/* Empty state */}
        {filtered.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 p-8 sm:p-12 text-center">
            <BuildingStorefrontIcon className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500 mb-3" />
            <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white">
              {t('customer.orders.empty')}
            </h3>
            <p className="mt-1 text-sm sm:text-base text-gray-500 dark:text-gray-400">
              {t('customer.orders.emptyHint')}
            </p>
          </div>
        ) : (
          <>
            {/* Mobile card view */}
            <div className="lg:hidden space-y-4">
              {paginated.map((order) => {
                const isExpanded = expandedId === order.id;
                return (
                  <div
                    key={order.id}
                    className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4"
                  >
                    {/* Row 1: order number + badge */}
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono text-sm font-semibold text-gray-900 dark:text-white">
                        {t('store.orderNumber')}{order.orderNumber}
                      </span>
                      {getStatusBadge(order.status)}
                    </div>

                    {/* Row 2: seller + date */}
                    <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-3">
                      <span>{order.sellerName || t('store.guest') || 'Seller'}</span>
                      <span className="flex items-center gap-1 tabular-nums">
                        <ClockIcon className="w-3.5 h-3.5" />
                        {formatDate(order.createdAt)}
                      </span>
                    </div>

                    {/* Row 3: total */}
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {order._count?.items ?? order.items?.length ?? 0} {t('store.items')}
                      </span>
                      <span className="text-base font-bold text-gray-900 dark:text-white tabular-nums">
                        {formatPrice(toNum(order.total), order.currency)}
                      </span>
                    </div>

                    {/* Expand toggle */}
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : order.id)}
                      className="w-full text-xs text-blue-600 dark:text-blue-400 font-medium py-1 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition"
                    >
                      {isExpanded ? (t('actions.hide') || 'Hide items') : (t('actions.viewDetails') || 'View items')}
                    </button>

                    {/* Line items */}
                    {isExpanded && order.items && order.items.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 space-y-1.5">
                        {order.items.map((item) => (
                          <div key={item.id} className="flex justify-between text-xs text-gray-700 dark:text-gray-300">
                            <span>{item.name} &times; {toNum(item.quantity)}</span>
                            <span className="tabular-nums">{formatPrice(toNum(item.unitPrice) * toNum(item.quantity), order.currency)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Desktop table view */}
            <div className="hidden lg:block bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        {t('store.orderNumber')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        {t('customer.orders.seller')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        {t('store.items')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        {t('bookings.status')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        {t('bookings.amount')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        {t('customer.orders.date')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {paginated.map((order) => {
                      const isExpanded = expandedId === order.id;
                      return (
                        <React.Fragment key={order.id}>
                          <tr
                            className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer"
                            onClick={() => setExpandedId(isExpanded ? null : order.id)}
                          >
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="font-mono text-sm font-medium text-gray-900 dark:text-white">
                                {order.orderNumber}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                              {order.sellerName || '—'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 tabular-nums">
                              {order._count?.items ?? order.items?.length ?? 0}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {getStatusBadge(order.status)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 dark:text-white tabular-nums">
                              {formatPrice(toNum(order.total), order.currency)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 tabular-nums">
                              {formatDate(order.createdAt)}
                            </td>
                          </tr>
                          {/* Expanded line items */}
                          {isExpanded && order.items && order.items.length > 0 && (
                            <tr>
                              <td colSpan={6} className="px-6 py-3 bg-gray-50 dark:bg-gray-700/40">
                                <div className="space-y-1">
                                  {order.items.map((item) => (
                                    <div key={item.id} className="flex justify-between text-xs text-gray-700 dark:text-gray-300">
                                      <span>{item.name} &times; {toNum(item.quantity)}</span>
                                      <span className="tabular-nums">{formatPrice(toNum(item.unitPrice) * toNum(item.quantity), order.currency)}</span>
                                    </div>
                                  ))}
                                  {toNum(order.discount) > 0 && (
                                    <div className="flex justify-between text-xs text-green-600 dark:text-green-400 pt-1 border-t border-gray-200 dark:border-gray-600">
                                      <span>{t('store.discount') || 'Discount'}</span>
                                      <span className="tabular-nums">-{formatPrice(toNum(order.discount), order.currency)}</span>
                                    </div>
                                  )}
                                  <div className="flex justify-between text-xs font-semibold text-gray-900 dark:text-white pt-1 border-t border-gray-200 dark:border-gray-600">
                                    <span>{t('store.total') || 'Total'}</span>
                                    <span className="tabular-nums">{formatPrice(toNum(order.total), order.currency)}</span>
                                  </div>
                                  {order.note && (
                                    <p className="text-xs text-gray-500 dark:text-gray-400 pt-1">
                                      {t('store.notePlaceholder')}: {order.note}
                                    </p>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-6">
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 px-3 py-2 sm:px-4 sm:py-3 md:px-6">
                  <div className="flex flex-wrap items-center justify-between">
                    <div className="flex justify-between flex-1 sm:hidden">
                      <button
                        onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50"
                      >
                        {t('pagination.previous')}
                      </button>
                      <button
                        onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="ml-3 relative inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50"
                      >
                        {t('pagination.next')}
                      </button>
                    </div>
                    <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        {t('pagination.showing')} <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> {t('pagination.to')}{' '}
                        <span className="font-medium">{Math.min(currentPage * itemsPerPage, filtered.length)}</span> {t('pagination.of')}{' '}
                        <span className="font-medium">{filtered.length}</span> {t('pagination.results')}
                      </p>
                      <nav className="relative z-0 inline-flex rounded-xl shadow-sm -space-x-px">
                        <button
                          onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                          disabled={currentPage === 1}
                          className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50"
                        >
                          ←
                        </button>
                        {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                          let page: number;
                          if (totalPages <= 5) page = i + 1;
                          else if (currentPage <= 3) page = i + 1;
                          else if (currentPage >= totalPages - 2) page = totalPages - 4 + i;
                          else page = currentPage - 2 + i;
                          return (
                            <button
                              key={page}
                              onClick={() => setCurrentPage(page)}
                              className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                currentPage === page
                                  ? 'z-10 bg-blue-50 dark:bg-blue-900/20 border-blue-500 text-blue-600 dark:text-blue-400'
                                  : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600'
                              }`}
                            >
                              {page}
                            </button>
                          );
                        })}
                        <button
                          onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                          disabled={currentPage === totalPages}
                          className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50"
                        >
                          →
                        </button>
                      </nav>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Status lifecycle legend */}
        <div className="mt-6 sm:mt-8 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">
            {t('customer.orders.lifecycle') || 'Order lifecycle'}
          </p>
          <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
            {getStatusBadge('PENDING')}
            <span className="text-gray-400">→</span>
            {getStatusBadge('PAID')}
            <span className="text-gray-400">→</span>
            {getStatusBadge('FULFILLED')}
            <span className="text-gray-300 dark:text-gray-600 mx-1">|</span>
            {getStatusBadge('CANCELLED')}
            <span className="text-gray-300 dark:text-gray-600 mx-1">|</span>
            {getStatusBadge('REFUNDED')}
          </div>
        </div>

      </div>
    </div>
  );
};

export default CustomerOrders;

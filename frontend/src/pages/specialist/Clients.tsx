import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { bookingService } from '@/services/booking.service';
import { Booking } from '@/types';
import {
  MagnifyingGlassIcon,
  UserGroupIcon,
  CalendarIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ChatBubbleLeftRightIcon,
  EyeIcon,
  XIcon,
  ArrowPathIcon,
  UserIcon,
} from '@/components/icons';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ClientBooking {
  id: string;
  serviceName: string;
  scheduledAt: string;
  date: string;
  status: string;
  totalAmount: number;
  duration: number;
}

interface Client {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  email?: string;
  phone?: string;
  bookingsCount: number;
  totalSpent: number;
  lastVisitDate: string;
  isActive: boolean;
  bookings: ClientBooking[];
}

type SortField = 'name' | 'bookingsCount' | 'lastVisitDate' | 'totalSpent';
type SortOrder = 'asc' | 'desc';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const getInitials = (firstName: string, lastName: string): string => {
  return `${(firstName || '').charAt(0)}${(lastName || '').charAt(0)}`.toUpperCase() || '?';
};

const isActiveClient = (lastVisitDate: string): boolean => {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  return new Date(lastVisitDate) >= thirtyDaysAgo;
};

const deriveClientsFromBookings = (bookings: Booking[]): Client[] => {
  const clientMap = new Map<string, Client>();

  for (const booking of bookings) {
    const customerId = booking.customerId;
    if (!customerId) continue;

    const firstName = booking.customer?.firstName || booking.customerName?.split(' ')[0] || 'Unknown';
    const lastName = booking.customer?.lastName || booking.customerName?.split(' ').slice(1).join(' ') || '';
    const avatar = booking.customer?.avatar;
    const email = booking.customerEmail || booking.customer?.email;
    const phone = booking.customerPhone || booking.customer?.phoneNumber;

    const clientBooking: ClientBooking = {
      id: booking.id,
      serviceName: booking.serviceName || booking.service?.name || 'Service',
      scheduledAt: booking.scheduledAt,
      date: booking.date,
      status: booking.status,
      totalAmount: booking.totalAmount || booking.amount || 0,
      duration: booking.duration || 0,
    };

    if (clientMap.has(customerId)) {
      const existing = clientMap.get(customerId)!;
      existing.bookingsCount += 1;
      existing.totalSpent += clientBooking.totalAmount;
      existing.bookings.push(clientBooking);
      if (new Date(clientBooking.scheduledAt) > new Date(existing.lastVisitDate)) {
        existing.lastVisitDate = clientBooking.scheduledAt;
      }
      // Prefer richer data if available
      if (!existing.avatar && avatar) existing.avatar = avatar;
      if (!existing.email && email) existing.email = email;
      if (!existing.phone && phone) existing.phone = phone;
    } else {
      clientMap.set(customerId, {
        id: customerId,
        name: `${firstName} ${lastName}`.trim(),
        firstName,
        lastName,
        avatar,
        email,
        phone,
        bookingsCount: 1,
        totalSpent: clientBooking.totalAmount,
        lastVisitDate: clientBooking.scheduledAt,
        isActive: false, // will be computed after
        bookings: [clientBooking],
      });
    }
  }

  // Finalize: sort each client's bookings by date descending, set active flag
  const clients = Array.from(clientMap.values());
  for (const client of clients) {
    client.bookings.sort(
      (a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime()
    );
    client.isActive = isActiveClient(client.lastVisitDate);
  }

  return clients;
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/** Skeleton loader card */
const SkeletonCard: React.FC = () => (
  <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-200 dark:border-gray-700 animate-pulse">
    <div className="flex items-center space-x-4">
      <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
      </div>
    </div>
    <div className="mt-4 grid grid-cols-3 gap-3">
      <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-lg" />
      <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-lg" />
      <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-lg" />
    </div>
  </div>
);

/** Stats bar */
const StatsBar: React.FC<{
  totalClients: number;
  activeClients: number;
  averageBookings: number;
  repeatRate: number;
}> = ({ totalClients, activeClients, averageBookings, repeatRate }) => {
  const { t } = useLanguage();

  const stats = [
    {
      label: t('clients.stats.total') || 'Total Clients',
      value: totalClients,
      icon: UserGroupIcon,
      color: 'text-primary-600 dark:text-primary-400',
      bg: 'bg-primary-50 dark:bg-primary-900/30',
    },
    {
      label: t('clients.stats.active') || 'Active Clients',
      value: activeClients,
      icon: UserIcon,
      color: 'text-green-600 dark:text-green-400',
      bg: 'bg-green-50 dark:bg-green-900/30',
    },
    {
      label: t('clients.stats.avgBookings') || 'Avg. Bookings',
      value: averageBookings.toFixed(1),
      icon: CalendarIcon,
      color: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-50 dark:bg-blue-900/30',
    },
    {
      label: t('clients.stats.repeatRate') || 'Repeat Rate',
      value: `${repeatRate}%`,
      icon: ArrowPathIcon,
      color: 'text-purple-600 dark:text-purple-400',
      bg: 'bg-purple-50 dark:bg-purple-900/30',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className={`${stat.bg} rounded-2xl p-4 border border-gray-200/50 dark:border-gray-700/50`}
          >
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-xl ${stat.bg}`}>
                <Icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{stat.label}</p>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

/** Booking history row inside the expanded detail */
const BookingHistoryRow: React.FC<{ booking: ClientBooking; formatPrice: (p: number) => string }> = ({
  booking,
  formatPrice,
}) => {
  const statusClasses: Record<string, string> = {
    COMPLETED: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
    CONFIRMED: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
    PENDING: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
    CANCELLED: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
    IN_PROGRESS: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
    NO_SHOW: 'bg-gray-100 text-gray-700 dark:bg-gray-900/40 dark:text-gray-300',
  };

  const statusLabel = booking.status.replace(/_/g, ' ');

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between py-3 px-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/50">
      <div className="flex-1 min-w-0 mb-2 sm:mb-0">
        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
          {booking.serviceName}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {new Date(booking.scheduledAt).toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })}
          {' - '}
          {booking.duration} min
        </p>
      </div>
      <div className="flex items-center space-x-3">
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
            statusClasses[booking.status] || statusClasses['PENDING']
          }`}
        >
          {statusLabel}
        </span>
        <span className="text-sm font-semibold text-gray-900 dark:text-white whitespace-nowrap">
          {formatPrice(booking.totalAmount)}
        </span>
      </div>
    </div>
  );
};

/** Client card */
const ClientCard: React.FC<{
  client: Client;
  isExpanded: boolean;
  onToggle: () => void;
  onViewBookings: () => void;
  onSendMessage: () => void;
  formatPrice: (p: number) => string;
  index: number;
}> = ({ client, isExpanded, onToggle, onViewBookings, onSendMessage, formatPrice, index }) => {
  const { t } = useLanguage();

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ delay: index * 0.03, duration: 0.25 }}
      className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200"
    >
      {/* Main card content */}
      <div className="p-5">
        <div className="flex items-start justify-between">
          {/* Left: avatar + info */}
          <div className="flex items-center space-x-4 min-w-0 flex-1">
            {/* Avatar */}
            {client.avatar ? (
              <img
                src={client.avatar}
                alt={client.name}
                className="w-12 h-12 rounded-full object-cover flex-shrink-0 border-2 border-gray-200 dark:border-gray-600"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-base">
                  {getInitials(client.firstName, client.lastName)}
                </span>
              </div>
            )}

            {/* Name + meta */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-semibold text-gray-900 dark:text-white truncate">
                  {client.name}
                </h3>
                {/* Status badge */}
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${
                    client.isActive
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
                      : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                  }`}
                >
                  {client.isActive
                    ? t('clients.status.active') || 'Active'
                    : t('clients.status.inactive') || 'Inactive'}
                </span>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                {t('clients.lastVisit') || 'Last visit'}:{' '}
                {new Date(client.lastVisitDate).toLocaleDateString(undefined, {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </p>
            </div>
          </div>

          {/* Right: expand toggle (mobile / desktop) */}
          <button
            onClick={onToggle}
            className="p-2 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ml-2"
            aria-label="Toggle details"
          >
            {isExpanded ? (
              <ChevronUpIcon className="w-5 h-5" />
            ) : (
              <ChevronDownIcon className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Quick stats row */}
        <div className="mt-4 grid grid-cols-3 gap-3">
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl px-3 py-2 text-center">
            <p className="text-lg font-bold text-gray-900 dark:text-white">{client.bookingsCount}</p>
            <p className="text-[11px] text-gray-500 dark:text-gray-400">
              {t('clients.bookings') || 'Bookings'}
            </p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl px-3 py-2 text-center">
            <p className="text-lg font-bold text-gray-900 dark:text-white">
              {formatPrice(client.totalSpent)}
            </p>
            <p className="text-[11px] text-gray-500 dark:text-gray-400">
              {t('clients.totalSpent') || 'Total Spent'}
            </p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl px-3 py-2 text-center">
            <p className="text-lg font-bold text-gray-900 dark:text-white">
              {formatPrice(client.totalSpent / (client.bookingsCount || 1))}
            </p>
            <p className="text-[11px] text-gray-500 dark:text-gray-400">
              {t('clients.avgSpent') || 'Avg / Visit'}
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="mt-4 flex items-center space-x-2">
          <button
            onClick={onViewBookings}
            className="flex-1 inline-flex items-center justify-center space-x-1.5 px-3 py-2 text-sm font-medium rounded-xl bg-primary-50 text-primary-700 hover:bg-primary-100 dark:bg-primary-900/30 dark:text-primary-300 dark:hover:bg-primary-900/50 transition-colors"
          >
            <EyeIcon className="w-4 h-4" />
            <span>{t('clients.viewBookings') || 'View Bookings'}</span>
          </button>
          <button
            onClick={onSendMessage}
            className="flex-1 inline-flex items-center justify-center space-x-1.5 px-3 py-2 text-sm font-medium rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            <ChatBubbleLeftRightIcon className="w-4 h-4" />
            <span>{t('clients.sendMessage') || 'Message'}</span>
          </button>
        </div>
      </div>

      {/* Expandable booking history */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="border-t border-gray-200 dark:border-gray-700 px-5 py-4 bg-gray-50/50 dark:bg-gray-900/30">
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                {t('clients.bookingHistory') || 'Booking History'}
              </h4>
              {client.bookings.length === 0 ? (
                <p className="text-sm text-gray-400 dark:text-gray-500">
                  {t('clients.noBookings') || 'No bookings found.'}
                </p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {client.bookings.map((booking) => (
                    <BookingHistoryRow
                      key={booking.id}
                      booking={booking}
                      formatPrice={formatPrice}
                    />
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

/** Empty state */
const EmptyState: React.FC = () => {
  const { t } = useLanguage();
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center py-20 px-6"
    >
      <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-5">
        <UserGroupIcon className="w-10 h-10 text-gray-400 dark:text-gray-500" />
      </div>
      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
        {t('clients.empty.title') || 'No clients yet'}
      </h3>
      <p className="text-gray-500 dark:text-gray-400 text-center max-w-md">
        {t('clients.empty.description') ||
          'When customers book your services, they will appear here. Start by sharing your profile or listing services.'}
      </p>
    </motion.div>
  );
};

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

const SpecialistClients: React.FC = () => {
  const { t } = useLanguage();
  const { formatPrice } = useCurrency();
  const navigate = useNavigate();

  // State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [allClients, setAllClients] = useState<Client[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('lastVisitDate');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [expandedClientId, setExpandedClientId] = useState<string | null>(null);

  // ---------------------------------------------------------------------------
  // Data Fetching
  // ---------------------------------------------------------------------------

  const loadClients = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all specialist bookings (with a high limit to capture all)
      const result = await bookingService.getBookings({ limit: 1000 }, 'specialist');
      const bookings = result.bookings || [];
      const clients = deriveClientsFromBookings(bookings);
      setAllClients(clients);
    } catch (err: unknown) {
      const err = err instanceof Error ? err : new Error(String(err));
      console.error('[Clients] Error loading client data:', err);
      setError(err.message || 'Failed to load clients');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadClients();
  }, [loadClients]);

  // ---------------------------------------------------------------------------
  // Filtering + Sorting
  // ---------------------------------------------------------------------------

  const filteredAndSortedClients = useMemo(() => {
    let result = [...allClients];

    // Filter by search
    if (searchTerm.trim()) {
      const lower = searchTerm.toLowerCase();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(lower) ||
          c.email?.toLowerCase().includes(lower) ||
          c.phone?.includes(lower)
      );
    }

    // Sort
    result.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case 'name':
          cmp = a.name.localeCompare(b.name);
          break;
        case 'bookingsCount':
          cmp = a.bookingsCount - b.bookingsCount;
          break;
        case 'lastVisitDate':
          cmp = new Date(a.lastVisitDate).getTime() - new Date(b.lastVisitDate).getTime();
          break;
        case 'totalSpent':
          cmp = a.totalSpent - b.totalSpent;
          break;
      }
      return sortOrder === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [allClients, searchTerm, sortField, sortOrder]);

  // ---------------------------------------------------------------------------
  // Stats
  // ---------------------------------------------------------------------------

  const stats = useMemo(() => {
    const total = allClients.length;
    const active = allClients.filter((c) => c.isActive).length;
    const avg =
      total > 0
        ? allClients.reduce((sum, c) => sum + c.bookingsCount, 0) / total
        : 0;
    const repeat = total > 0 ? Math.round((allClients.filter((c) => c.bookingsCount > 1).length / total) * 100) : 0;
    return { totalClients: total, activeClients: active, averageBookings: avg, repeatRate: repeat };
  }, [allClients]);

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  const handleToggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const handleToggleExpand = (clientId: string) => {
    setExpandedClientId((prev) => (prev === clientId ? null : clientId));
  };

  const handleViewBookings = (client: Client) => {
    // Expand the card inline to show booking history
    setExpandedClientId(client.id);
  };

  const handleSendMessage = (client: Client) => {
    navigate(`/specialist/messages?recipientId=${client.id}&recipientName=${encodeURIComponent(client.name)}`);
  };

  // ---------------------------------------------------------------------------
  // Sort options config
  // ---------------------------------------------------------------------------

  const sortOptions: { field: SortField; label: string }[] = [
    { field: 'name', label: t('clients.sort.name') || 'Name' },
    { field: 'bookingsCount', label: t('clients.sort.bookings') || 'Bookings' },
    { field: 'lastVisitDate', label: t('clients.sort.lastVisit') || 'Last Visit' },
    { field: 'totalSpent', label: t('clients.sort.totalSpent') || 'Total Spent' },
  ];

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="py-6">
        {/* Page header */}
        <div className="max-w-5xl mx-auto px-4 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                {t('clients.title') || 'My Clients'}
              </h1>
              <p className="text-gray-500 dark:text-gray-400 mt-1">
                {t('clients.subtitle') || 'Manage and view your client relationships'}
                {!loading && allClients.length > 0 && (
                  <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800 dark:bg-primary-900/40 dark:text-primary-300">
                    {allClients.length} {allClients.length === 1 ? (t('clients.client') || 'client') : (t('clients.clientsPlural') || 'clients')}
                  </span>
                )}
              </p>
            </div>

            {/* Refresh button */}
            {!loading && (
              <button
                onClick={loadClients}
                className="inline-flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <ArrowPathIcon className="w-4 h-4" />
                <span>{t('common.refresh') || 'Refresh'}</span>
              </button>
            )}
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4">
          {/* Error state */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl">
              <div className="flex items-center justify-between">
                <p className="text-red-700 dark:text-red-400 text-sm">{error}</p>
                <button
                  onClick={loadClients}
                  className="text-sm font-medium text-red-600 dark:text-red-400 hover:underline"
                >
                  {t('common.retry') || 'Retry'}
                </button>
              </div>
            </div>
          )}

          {/* Loading skeletons */}
          {loading && (
            <>
              {/* Stats skeleton */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-200 dark:border-gray-700 animate-pulse"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-xl bg-gray-200 dark:bg-gray-700" />
                      <div className="space-y-2 flex-1">
                        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {/* Search bar skeleton */}
              <div className="h-12 bg-white dark:bg-gray-800 rounded-2xl mb-6 animate-pulse border border-gray-200 dark:border-gray-700" />
              {/* Cards skeleton */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            </>
          )}

          {/* Loaded content */}
          {!loading && (
            <>
              {/* Stats bar */}
              {allClients.length > 0 && (
                <StatsBar
                  totalClients={stats.totalClients}
                  activeClients={stats.activeClients}
                  averageBookings={stats.averageBookings}
                  repeatRate={stats.repeatRate}
                />
              )}

              {/* Search + Sort controls */}
              {allClients.length > 0 && (
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-6">
                  {/* Search */}
                  <div className="relative flex-1">
                    <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder={t('clients.searchPlaceholder') || 'Search clients by name, email, or phone...'}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-11 pr-10 py-3 rounded-2xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-sm"
                    />
                    {searchTerm && (
                      <button
                        onClick={() => setSearchTerm('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      >
                        <XIcon className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Sort buttons */}
                  <div className="flex items-center space-x-1 bg-white dark:bg-gray-800 rounded-2xl border border-gray-300 dark:border-gray-600 p-1">
                    {sortOptions.map((opt) => {
                      const isActive = sortField === opt.field;
                      return (
                        <button
                          key={opt.field}
                          onClick={() => handleToggleSort(opt.field)}
                          className={`px-3 py-2 text-xs font-medium rounded-xl transition-colors whitespace-nowrap ${
                            isActive
                              ? 'bg-primary-500 text-white shadow-sm'
                              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                          }`}
                        >
                          {opt.label}
                          {isActive && (
                            <span className="ml-1">{sortOrder === 'asc' ? '\u2191' : '\u2193'}</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Client list */}
              {filteredAndSortedClients.length > 0 ? (
                <>
                  {/* Results count when searching */}
                  {searchTerm && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                      {filteredAndSortedClients.length}{' '}
                      {filteredAndSortedClients.length === 1
                        ? t('clients.resultSingular') || 'result'
                        : t('clients.resultPlural') || 'results'}{' '}
                      {t('clients.foundFor') || 'found for'} &ldquo;{searchTerm}&rdquo;
                    </p>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <AnimatePresence mode="popLayout">
                      {filteredAndSortedClients.map((client, idx) => (
                        <ClientCard
                          key={client.id}
                          client={client}
                          isExpanded={expandedClientId === client.id}
                          onToggle={() => handleToggleExpand(client.id)}
                          onViewBookings={() => handleViewBookings(client)}
                          onSendMessage={() => handleSendMessage(client)}
                          formatPrice={formatPrice}
                          index={idx}
                        />
                      ))}
                    </AnimatePresence>
                  </div>
                </>
              ) : searchTerm ? (
                // No search results
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center py-16"
                >
                  <MagnifyingGlassIcon className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                    {t('clients.noResults.title') || 'No clients found'}
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 text-sm text-center max-w-sm">
                    {t('clients.noResults.description') || 'Try adjusting your search term.'}
                  </p>
                  <button
                    onClick={() => setSearchTerm('')}
                    className="mt-4 px-4 py-2 text-sm font-medium text-primary-600 dark:text-primary-400 hover:underline"
                  >
                    {t('clients.clearSearch') || 'Clear search'}
                  </button>
                </motion.div>
              ) : (
                // True empty state
                <EmptyState />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SpecialistClients;

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Search,
  User,
  Calendar,
  DollarSign,
  Users,
  Clock,
  TrendingUp,
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Sheet } from '@/components/ui/Sheet';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useTelegram } from '@/components/telegram/TelegramProvider';
import apiService from '@/services/api.service';
import { useLocale, t, formatCurrency } from '@/hooks/useLocale';
import { clientsStrings, commonStrings } from '@/utils/translations';
import { format, parseISO, differenceInDays } from 'date-fns';

interface DerivedClient {
  id: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  bookingsCount: number;
  totalSpent: number;
  lastVisitDate: string;
  isActive: boolean;
  bookings: any[];
}

export const ClientsPage: React.FC = () => {
  const { hapticFeedback } = useTelegram();
  const locale = useLocale();

  const [clients, setClients] = useState<DerivedClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClient, setSelectedClient] = useState<DerivedClient | null>(null);

  const s = (key: string) => t(clientsStrings, key, locale);
  const c = (key: string) => t(commonStrings, key, locale);

  const fetchClients = useCallback(async () => {
    try {
      setLoading(true);
      const data = (await apiService.getBookings({ userType: 'specialist', limit: 1000 })) as any;
      const bookings = data?.bookings || data?.items || (Array.isArray(data) ? data : []);

      // Group bookings by customerId to derive unique clients
      const clientMap = new Map<string, DerivedClient>();

      bookings.forEach((booking: any) => {
        const customerId = booking.customerId || booking.customer?.id;
        if (!customerId) return;

        if (!clientMap.has(customerId)) {
          clientMap.set(customerId, {
            id: customerId,
            firstName: booking.customer?.firstName || booking.customerName?.split(' ')[0] || '',
            lastName: booking.customer?.lastName || booking.customerName?.split(' ').slice(1).join(' ') || '',
            avatar: booking.customer?.avatar,
            bookingsCount: 0,
            totalSpent: 0,
            lastVisitDate: booking.scheduledAt || booking.createdAt,
            isActive: false,
            bookings: [],
          });
        }

        const client = clientMap.get(customerId)!;
        client.bookingsCount++;
        client.totalSpent += Number(booking.totalAmount) || 0;
        client.bookings.push(booking);

        const bookingDate = booking.scheduledAt || booking.createdAt;
        if (bookingDate > client.lastVisitDate) {
          client.lastVisitDate = bookingDate;
        }
      });

      // Calculate isActive (last visit within 30 days)
      const now = new Date();
      clientMap.forEach((client) => {
        client.isActive = differenceInDays(now, parseISO(client.lastVisitDate)) <= 30;
        // Sort bookings by date desc
        client.bookings.sort((a: any, b: any) =>
          new Date(b.scheduledAt || b.createdAt).getTime() - new Date(a.scheduledAt || a.createdAt).getTime()
        );
      });

      // Sort clients by bookings count desc
      const sorted = Array.from(clientMap.values()).sort((a, b) => b.bookingsCount - a.bookingsCount);
      setClients(sorted);
    } catch {
      setClients([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const filteredClients = useMemo(() => {
    if (!searchQuery.trim()) return clients;
    const query = searchQuery.toLowerCase();
    return clients.filter(
      (client) =>
        client.firstName.toLowerCase().includes(query) ||
        client.lastName.toLowerCase().includes(query)
    );
  }, [clients, searchQuery]);

  const stats = useMemo(() => {
    const total = clients.length;
    const active = clients.filter((c) => c.isActive).length;
    const avgBookings = total > 0 ? Math.round(clients.reduce((sum, c) => sum + c.bookingsCount, 0) / total * 10) / 10 : 0;
    const repeat = clients.filter((c) => c.bookingsCount > 1).length;
    const repeatRate = total > 0 ? Math.round((repeat / total) * 100) : 0;
    return { total, active, avgBookings, repeatRate };
  }, [clients]);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '---';
    try {
      return format(parseISO(dateStr), 'MMM d, yyyy');
    } catch {
      return '---';
    }
  };

  const handleSelectClient = (client: DerivedClient) => {
    hapticFeedback.impactLight();
    setSelectedClient(client);
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed': return 'bg-blue-500/15 text-blue-400';
      case 'confirmed': return 'bg-accent-green/15 text-accent-green';
      case 'pending': return 'bg-accent-yellow/15 text-accent-yellow';
      case 'cancelled': return 'bg-accent-red/15 text-accent-red';
      default: return 'bg-bg-hover text-text-secondary';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-bg-primary">
      <Header title={s('title')} showBackButton />

      <div className="flex-1 overflow-y-auto pb-20 page-stagger">
        <div className="px-4 pt-4 space-y-4">
          {/* Stats Bar */}
          {clients.length > 0 && (
            <div className="grid grid-cols-4 gap-2">
              <div className="text-center p-2 bg-bg-card/80 rounded-xl border border-white/5">
                <div className="text-lg font-bold text-text-primary">{stats.total}</div>
                <div className="text-[10px] text-text-secondary">{s('totalClients')}</div>
              </div>
              <div className="text-center p-2 bg-bg-card/80 rounded-xl border border-white/5">
                <div className="text-lg font-bold text-accent-green">{stats.active}</div>
                <div className="text-[10px] text-text-secondary">
                  {locale === 'uk' ? 'Активні' : locale === 'ru' ? 'Активные' : 'Active'}
                </div>
              </div>
              <div className="text-center p-2 bg-bg-card/80 rounded-xl border border-white/5">
                <div className="text-lg font-bold text-accent-primary">{stats.avgBookings}</div>
                <div className="text-[10px] text-text-secondary">
                  {locale === 'uk' ? 'Сер. записів' : locale === 'ru' ? 'Ср. записей' : 'Avg Book'}
                </div>
              </div>
              <div className="text-center p-2 bg-bg-card/80 rounded-xl border border-white/5">
                <div className="text-lg font-bold text-accent-yellow">{stats.repeatRate}%</div>
                <div className="text-[10px] text-text-secondary">
                  {locale === 'uk' ? 'Повторні' : locale === 'ru' ? 'Повторные' : 'Repeat'}
                </div>
              </div>
            </div>
          )}

          {/* Search Bar */}
          <div className="relative">
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={s('searchClients')}
              icon={<Search size={16} />}
            />
          </div>

          {/* Client List */}
          {filteredClients.length === 0 ? (
            <Card className="text-center py-12">
              <Users size={48} className="text-text-secondary mx-auto mb-3" />
              <p className="text-text-primary font-medium">
                {searchQuery.trim() ? c('noResults') : s('noClients')}
              </p>
              <p className="text-text-secondary text-sm mt-1">
                {searchQuery.trim() ? '' : s('noClientsDesc')}
              </p>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredClients.map((client) => (
                <Card
                  key={client.id}
                  className="bg-bg-card/80 backdrop-blur-xl rounded-2xl border border-white/5 shadow-card hover:bg-bg-card/90 transition-all cursor-pointer"
                  onClick={() => handleSelectClient(client)}
                >
                  <div className="flex items-center gap-3">
                    {/* Avatar */}
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-bg-secondary flex-shrink-0">
                      {client.avatar ? (
                        <img src={client.avatar} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-accent-primary/10">
                          <User size={20} className="text-accent-primary" />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-semibold text-text-primary truncate">
                          {client.firstName} {client.lastName}
                        </h4>
                        {client.isActive && (
                          <span className="px-1.5 py-0.5 bg-accent-green/15 text-accent-green text-[10px] rounded-full font-medium flex-shrink-0">
                            {locale === 'uk' ? 'Активний' : locale === 'ru' ? 'Активный' : 'Active'}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <div className="flex items-center gap-1">
                          <Calendar size={12} className="text-text-muted" />
                          <span className="text-xs text-text-secondary">
                            {client.bookingsCount} {s('bookings')}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <DollarSign size={12} className="text-text-muted" />
                          <span className="text-xs text-accent-green font-medium">
                            {formatCurrency(client.totalSpent, undefined, locale)}
                          </span>
                        </div>
                      </div>
                      <div className="text-xs text-text-muted mt-0.5">
                        {s('lastVisit')}: {formatDate(client.lastVisitDate)}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Client Details Sheet */}
      <Sheet
        isOpen={!!selectedClient}
        onClose={() => setSelectedClient(null)}
        title={s('clientDetails')}
      >
        {selectedClient && (
          <div className="space-y-4">
            {/* Client Header */}
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full overflow-hidden bg-bg-secondary flex-shrink-0">
                {selectedClient.avatar ? (
                  <img src={selectedClient.avatar} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-accent-primary/10">
                    <User size={28} className="text-accent-primary" />
                  </div>
                )}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-text-primary">
                  {selectedClient.firstName} {selectedClient.lastName}
                </h3>
                {selectedClient.isActive && (
                  <span className="px-2 py-0.5 bg-accent-green/15 text-accent-green text-xs rounded-full font-medium">
                    {locale === 'uk' ? 'Активний клієнт' : locale === 'ru' ? 'Активный клиент' : 'Active client'}
                  </span>
                )}
              </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-3 bg-bg-secondary/50 rounded-xl">
                <div className="text-lg font-bold text-text-primary">{selectedClient.bookingsCount}</div>
                <div className="text-xs text-text-secondary">{s('totalVisits')}</div>
              </div>
              <div className="text-center p-3 bg-bg-secondary/50 rounded-xl">
                <div className="text-lg font-bold text-accent-green">
                  {selectedClient.totalSpent.toLocaleString()}
                </div>
                <div className="text-xs text-text-secondary">{s('totalSpent')}</div>
              </div>
              <div className="text-center p-3 bg-bg-secondary/50 rounded-xl">
                <div className="text-sm font-bold text-text-primary leading-tight">
                  {formatDate(selectedClient.lastVisitDate)}
                </div>
                <div className="text-xs text-text-secondary">{s('lastVisit')}</div>
              </div>
            </div>

            {/* Booking History */}
            <div>
              <h4 className="text-sm font-semibold text-text-primary flex items-center gap-1.5 mb-2">
                <Clock size={14} className="text-text-muted" />
                {locale === 'uk' ? 'Історія записів' : locale === 'ru' ? 'История записей' : 'Booking History'}
              </h4>

              {selectedClient.bookings.length > 0 ? (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {selectedClient.bookings.map((booking: any) => (
                    <div
                      key={booking.id}
                      className="p-3 bg-bg-secondary/50 rounded-xl border border-white/5"
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-text-primary truncate">
                          {booking.service?.name || booking.serviceName || 'Service'}
                        </p>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${getStatusColor(booking.status)}`}>
                          {(booking.status || '').toLowerCase()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs text-text-muted">
                          {formatDate(booking.scheduledAt || booking.createdAt)}
                        </span>
                        <span className="text-xs font-medium text-accent-primary">
                          {formatCurrency(Number(booking.totalAmount || 0), undefined, locale)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm text-text-muted">
                    {locale === 'uk' ? 'Записів немає' : locale === 'ru' ? 'Записей нет' : 'No bookings'}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </Sheet>
    </div>
  );
};

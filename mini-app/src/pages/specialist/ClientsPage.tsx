import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Search,
  User,
  Calendar,
  DollarSign,
  FileText,
  Send,
  Users,
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Sheet } from '@/components/ui/Sheet';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useTelegram } from '@/components/telegram/TelegramProvider';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '@/store';
import { addToast } from '@/store/slices/uiSlice';
import apiService from '@/services/api.service';
import { useLocale, t } from '@/hooks/useLocale';
import { clientsStrings, commonStrings } from '@/utils/translations';

interface ClientNote {
  id: string;
  note: string;
  createdAt: string;
}

interface Client {
  id: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  bookingsCount: number;
  lastVisit?: string;
  totalSpent: number;
  notes?: ClientNote[];
}

export const ClientsPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { hapticFeedback } = useTelegram();
  const locale = useLocale();

  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [showNoteSheet, setShowNoteSheet] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [submittingNote, setSubmittingNote] = useState(false);

  const s = (key: string) => t(clientsStrings, key, locale);
  const c = (key: string) => t(commonStrings, key, locale);

  const fetchClients = useCallback(async () => {
    try {
      setLoading(true);
      const data = (await apiService.getSpecialistClients({ limit: 200 })) as any;
      const items = data?.items || data || [];
      setClients(items);
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

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '---';
    const date = new Date(dateStr);
    return date.toLocaleDateString(
      locale === 'uk' ? 'uk-UA' : locale === 'ru' ? 'ru-RU' : 'en-US',
      { month: 'short', day: 'numeric', year: 'numeric' }
    );
  };

  const handleSelectClient = (client: Client) => {
    hapticFeedback.impactLight();
    setSelectedClient(client);
  };

  const handleOpenNoteSheet = () => {
    hapticFeedback.impactLight();
    setNoteText('');
    setShowNoteSheet(true);
  };

  const handleSaveNote = async () => {
    if (!selectedClient || !noteText.trim()) return;

    try {
      setSubmittingNote(true);
      await apiService.addClientNote(selectedClient.id, noteText.trim());
      hapticFeedback.notificationSuccess();
      dispatch(
        addToast({
          type: 'success',
          title: c('success'),
          message: s('noteSaved'),
        })
      );

      // Update local state
      const newNote: ClientNote = {
        id: Date.now().toString(),
        note: noteText.trim(),
        createdAt: new Date().toISOString(),
      };

      setClients((prev) =>
        prev.map((client) =>
          client.id === selectedClient.id
            ? {
                ...client,
                notes: [...(client.notes || []), newNote],
              }
            : client
        )
      );

      setSelectedClient((prev) =>
        prev
          ? {
              ...prev,
              notes: [...(prev.notes || []), newNote],
            }
          : null
      );

      setShowNoteSheet(false);
      setNoteText('');
    } catch {
      hapticFeedback.notificationError();
      dispatch(
        addToast({
          type: 'error',
          title: c('error'),
          message: c('error'),
        })
      );
    } finally {
      setSubmittingNote(false);
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
          {/* Total Clients Badge */}
          {clients.length > 0 && (
            <div className="flex items-center justify-center gap-2">
              <div className="px-4 py-1.5 bg-accent-primary/10 rounded-full">
                <span className="text-sm font-medium text-accent-primary">
                  {s('totalClients')}: {clients.length}
                </span>
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
                        <img
                          src={client.avatar}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-accent-primary/10">
                          <User size={20} className="text-accent-primary" />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-semibold text-text-primary truncate">
                        {client.firstName} {client.lastName}
                      </h4>
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
                            {client.totalSpent.toLocaleString()} UAH
                          </span>
                        </div>
                      </div>
                      {client.lastVisit && (
                        <div className="text-xs text-text-muted mt-0.5">
                          {s('lastVisit')}: {formatDate(client.lastVisit)}
                        </div>
                      )}
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
        isOpen={!!selectedClient && !showNoteSheet}
        onClose={() => setSelectedClient(null)}
        title={s('clientDetails')}
      >
        {selectedClient && (
          <div className="space-y-4">
            {/* Client Header */}
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full overflow-hidden bg-bg-secondary flex-shrink-0">
                {selectedClient.avatar ? (
                  <img
                    src={selectedClient.avatar}
                    alt=""
                    className="w-full h-full object-cover"
                  />
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
              </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-3 bg-bg-secondary/50 rounded-xl">
                <div className="text-lg font-bold text-text-primary">
                  {selectedClient.bookingsCount}
                </div>
                <div className="text-xs text-text-secondary">
                  {s('totalVisits')}
                </div>
              </div>
              <div className="text-center p-3 bg-bg-secondary/50 rounded-xl">
                <div className="text-lg font-bold text-accent-green">
                  {selectedClient.totalSpent.toLocaleString()}
                </div>
                <div className="text-xs text-text-secondary">
                  {s('totalSpent')}
                </div>
              </div>
              <div className="text-center p-3 bg-bg-secondary/50 rounded-xl">
                <div className="text-sm font-bold text-text-primary leading-tight">
                  {formatDate(selectedClient.lastVisit)}
                </div>
                <div className="text-xs text-text-secondary">
                  {s('lastVisit')}
                </div>
              </div>
            </div>

            {/* Notes */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-semibold text-text-primary flex items-center gap-1.5">
                  <FileText size={14} className="text-text-muted" />
                  {s('notes')}
                </h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleOpenNoteSheet}
                >
                  {s('addNote')}
                </Button>
              </div>

              {selectedClient.notes && selectedClient.notes.length > 0 ? (
                <div className="space-y-2">
                  {selectedClient.notes.map((note) => (
                    <div
                      key={note.id}
                      className="p-3 bg-bg-secondary/50 rounded-xl border border-white/5"
                    >
                      <p className="text-sm text-text-primary">{note.note}</p>
                      <div className="text-xs text-text-muted mt-1.5">
                        {formatDate(note.createdAt)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm text-text-muted">
                    {locale === 'uk'
                      ? 'Нотаток поки немає'
                      : locale === 'ru'
                      ? 'Заметок пока нет'
                      : 'No notes yet'}
                  </p>
                </div>
              )}
            </div>

            {/* Add Note Button (bottom) */}
            <Button
              onClick={handleOpenNoteSheet}
              fullWidth
              className="mt-2"
            >
              <FileText size={16} className="mr-2" />
              {s('addNote')}
            </Button>
          </div>
        )}
      </Sheet>

      {/* Add Note Sheet */}
      <Sheet
        isOpen={showNoteSheet}
        onClose={() => setShowNoteSheet(false)}
        title={s('addNote')}
      >
        <div className="space-y-4">
          {/* Note Textarea */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">
              {s('notes')}
            </label>
            <textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              rows={4}
              className="input-telegram w-full rounded-xl text-sm resize-none"
              placeholder={s('notePlaceholder')}
              autoFocus
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={() => setShowNoteSheet(false)}
              className="flex-1"
            >
              {c('cancel')}
            </Button>
            <Button
              onClick={handleSaveNote}
              className="flex-1"
              disabled={submittingNote || !noteText.trim()}
              loading={submittingNote}
            >
              <Send size={16} className="mr-1.5" />
              {s('saveNote')}
            </Button>
          </div>
        </div>
      </Sheet>
    </div>
  );
};

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Heart,
  Star,
  MapPin,
  Clock,
  Search,
  Trash2,
  User,
  Briefcase,
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useTelegram } from '@/components/telegram/TelegramProvider';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '@/store';
import { addToast } from '@/store/slices/uiSlice';
import apiService from '@/services/api.service';
import { useLocale, t } from '@/hooks/useLocale';
import { favoritesStrings, commonStrings } from '@/utils/translations';

interface FavoriteItem {
  id: string;
  targetId: string;
  type: 'specialist' | 'service';
  specialist?: {
    id: string;
    businessName: string;
    user: { firstName: string; lastName: string; avatar?: string };
    rating: number;
    totalReviews: number;
    specialties: string[];
    location?: { city: string };
  };
  service?: {
    id: string;
    name: string;
    description: string;
    price: number;
    currency: string;
    duration: number;
    images: string[];
    specialist?: { businessName: string };
  };
  createdAt: string;
}

export const FavoritesPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { hapticFeedback, showConfirm } = useTelegram();
  const locale = useLocale();

  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'specialist' | 'service'>('specialist');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const fetchFavorites = useCallback(async (pageNum: number, append = false) => {
    try {
      if (!append) setLoading(true);
      const data = await apiService.getFavorites({ page: pageNum, limit: 12, type: activeTab }) as any;
      const items = data.items || data || [];
      if (append) {
        setFavorites(prev => [...prev, ...items]);
      } else {
        setFavorites(items);
      }
      setHasMore(pageNum < (data.pagination?.totalPages || 1));
    } catch {
      if (!append) setFavorites([]);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    setPage(1);
    fetchFavorites(1);
  }, [activeTab, fetchFavorites]);

  const handleRemove = async (fav: FavoriteItem) => {
    const confirmed = await showConfirm(t(favoritesStrings, 'confirmRemove', locale));
    if (!confirmed) return;

    hapticFeedback.impactMedium();
    setFavorites(prev => prev.filter(f => f.id !== fav.id));

    try {
      await apiService.removeFavorite(fav.id);
      const successMsg = locale === 'uk' ? 'Видалено' : locale === 'ru' ? 'Удалено' : 'Removed';
      const msg = locale === 'uk' ? 'Видалено з обраного' : locale === 'ru' ? 'Удалено из избранного' : 'Removed from favorites';
      dispatch(addToast({ type: 'success', title: successMsg, message: msg }));
    } catch {
      setFavorites(prev => [...prev, fav]);
      const errorMsg = locale === 'uk' ? 'Не вдалося видалити' : locale === 'ru' ? 'Не удалось удалить' : 'Failed to remove favorite';
      dispatch(addToast({ type: 'error', title: t(commonStrings, 'error', locale), message: errorMsg }));
      hapticFeedback.notificationError();
    }
  };

  const handleNavigate = (fav: FavoriteItem) => {
    hapticFeedback.selectionChanged();
    if (fav.type === 'specialist' && fav.specialist) {
      navigate(`/specialist/${fav.specialist.id}`);
    } else if (fav.service) {
      navigate(`/service/${fav.service.id}`);
    }
  };

  const filtered = favorites.filter(fav => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    if (fav.type === 'specialist' && fav.specialist) {
      return (
        fav.specialist.businessName.toLowerCase().includes(q) ||
        fav.specialist.user.firstName.toLowerCase().includes(q) ||
        fav.specialist.specialties.some(s => s.toLowerCase().includes(q))
      );
    }
    if (fav.service) {
      return fav.service.name.toLowerCase().includes(q) || fav.service.description.toLowerCase().includes(q);
    }
    return false;
  });

  return (
    <div className="flex flex-col min-h-screen bg-bg-primary">
      <Header title={t(favoritesStrings, 'title', locale)} />

      <div className="flex-1 overflow-y-auto pb-20 page-stagger">
        {/* Tabs */}
        <div className="px-4 pt-4 pb-2">
          <div className="flex bg-bg-secondary rounded-xl p-1">
            {(['specialist', 'service'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => { setActiveTab(tab); hapticFeedback.selectionChanged(); }}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab
                    ? 'bg-tg-button text-tg-button-text shadow-card'
                    : 'text-text-secondary'
                }`}
              >
                {tab === 'specialist' ? t(favoritesStrings, 'specialists', locale) : t(favoritesStrings, 'services', locale)}
              </button>
            ))}
          </div>
        </div>

        {/* Search */}
        <div className="px-4 pb-3">
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={activeTab === 'specialist' ? t(favoritesStrings, 'searchSpecialists', locale) : t(favoritesStrings, 'searchServices', locale)}
              className="input-telegram w-full pl-10 pr-4 py-2.5 rounded-xl text-sm"
            />
          </div>
        </div>

        {/* Content */}
        <div className="px-4 space-y-3">
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <LoadingSpinner />
            </div>
          ) : filtered.length === 0 ? (
            <Card className="text-center py-12">
              <Heart size={40} className="text-text-secondary mx-auto mb-3" />
              <p className="text-text-primary font-medium">{t(favoritesStrings, 'noFavorites', locale)}</p>
              <p className="text-text-secondary text-sm mt-1">
                {activeTab === 'specialist'
                  ? t(favoritesStrings, 'saveSpecialists', locale)
                  : t(favoritesStrings, 'saveServices', locale)}
              </p>
              <Button size="sm" onClick={() => navigate('/search')} className="mt-4">
                {activeTab === 'specialist' ? t(favoritesStrings, 'exploreSpecialists', locale) : t(favoritesStrings, 'exploreServices', locale)}
              </Button>
            </Card>
          ) : (
            <>
              {filtered.map(fav => (
                <Card key={fav.id} hover>
                  <div className="flex items-start gap-3" onClick={() => handleNavigate(fav)}>
                    {/* Avatar/Image */}
                    <div className="w-14 h-14 rounded-xl overflow-hidden bg-bg-secondary flex-shrink-0">
                      {fav.type === 'specialist' && fav.specialist ? (
                        fav.specialist.user.avatar ? (
                          <img src={fav.specialist.user.avatar} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <User size={24} className="text-text-secondary" />
                          </div>
                        )
                      ) : fav.service?.images?.[0] ? (
                        <img src={fav.service.images[0]} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Briefcase size={24} className="text-text-secondary" />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-text-primary truncate">
                        {fav.type === 'specialist'
                          ? fav.specialist?.businessName || `${fav.specialist?.user.firstName} ${fav.specialist?.user.lastName}`
                          : fav.service?.name}
                      </h3>
                      {fav.type === 'specialist' && fav.specialist && (
                        <>
                          <div className="flex items-center gap-2 mt-0.5">
                            <Star size={12} className="text-accent-yellow fill-yellow-500" />
                            <span className="text-xs text-text-secondary">
                              {fav.specialist.rating.toFixed(1)} ({fav.specialist.totalReviews})
                            </span>
                          </div>
                          {fav.specialist.location?.city && (
                            <div className="flex items-center gap-1 mt-0.5">
                              <MapPin size={12} className="text-text-secondary" />
                              <span className="text-xs text-text-secondary">{fav.specialist.location.city}</span>
                            </div>
                          )}
                        </>
                      )}
                      {fav.type === 'service' && fav.service && (
                        <>
                          <div className="flex items-center gap-2 mt-0.5">
                            <Clock size={12} className="text-text-secondary" />
                            <span className="text-xs text-text-secondary">{fav.service.duration} min</span>
                            <span className="text-xs font-medium text-accent-primary">
                              ₴{fav.service.price}
                            </span>
                          </div>
                          {fav.service.specialist && (
                            <p className="text-xs text-text-secondary mt-0.5 truncate">
                              by {fav.service.specialist.businessName}
                            </p>
                          )}
                        </>
                      )}
                    </div>

                    {/* Remove */}
                    <button
                      onClick={e => { e.stopPropagation(); handleRemove(fav); }}
                      className="p-2 rounded-lg hover:bg-bg-hover"
                    >
                      <Trash2 size={16} className="text-accent-red" />
                    </button>
                  </div>
                </Card>
              ))}

              {hasMore && (
                <Button
                  variant="secondary"
                  onClick={() => { const n = page + 1; setPage(n); fetchFavorites(n, true); }}
                  className="w-full"
                >
                  {locale === 'uk' ? 'Завантажити ще' : locale === 'ru' ? 'Загрузить ещё' : 'Load More'}
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

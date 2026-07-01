import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '@/services/api';
import { useLanguage } from '@/contexts/LanguageContext';
import { SearchAiToggle } from '@/components/common/SearchAiToggle';

interface Option {
  serviceId: string;
  serviceName: string;
  price: number;
  currency: string;
  durationMinutes: number;
  businessName: string;
  address: string | null;
  city: string | null;
  distanceKm?: number;
  etaMinutes?: number;
  navUrl?: string;
  bookUrl: string;
}
interface Product {
  productId: string;
  productName: string;
  imageUrl?: string | null;
  price: number;
  currency: string;
  inStock: number;
  shopName: string;
  address: string | null;
  city: string | null;
  distanceKm?: number;
  etaMinutes?: number;
  navUrl?: string;
  shopUrl: string;
}
interface Turn { role: 'user' | 'model'; text: string; options?: Option[]; products?: Product[] }

const money = (n: number, c: string) =>
  new Intl.NumberFormat(undefined, { style: 'currency', currency: c === 'UAH' ? 'UAH' : c }).format(n);

const ConciergePage: React.FC = () => {
  const { language } = useLanguage();
  const tr = (uk: string, ru: string, en: string) => (language === 'uk' ? uk : language === 'ru' ? ru : en);

  const [turns, setTurns] = useState<Turn[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      (p) => setCoords({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => { /* no location — concierge still works, just no distances */ },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 },
    );
  }, []);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [turns, busy]);

  const send = async () => {
    const msg = input.trim();
    if (!msg || busy) return;
    setInput('');
    const history = turns.map((t) => ({ role: t.role, text: t.text }));
    setTurns((prev) => [...prev, { role: 'user', text: msg }]);
    setBusy(true);
    try {
      const res: any = await apiClient.post('/ai/concierge', { message: msg, history, lat: coords?.lat, lng: coords?.lng });
      const data = res?.data ?? res;
      setTurns((prev) => [...prev, { role: 'model', text: data.reply || '…', options: data.options || [], products: data.products || [] }]);
    } catch (e: any) {
      const m = e?.response?.status === 503
        ? tr('Асистент ще недоступний.', 'Ассистент пока недоступен.', 'The concierge isn’t available yet.')
        : tr('Вибачте, сталася помилка. Спробуйте ще раз.', 'Извините, произошла ошибка. Попробуйте ещё раз.', 'Sorry — something went wrong. Please try again.');
      setTurns((prev) => [...prev, { role: 'model', text: m }]);
    } finally {
      setBusy(false);
    }
  };

  const suggestions = [
    tr('Хочу стрижку поруч сьогодні', 'Хочу стрижку рядом сегодня', 'I want a haircut near me today'),
    tr('Манікюр до 300 грн', 'Маникюр до 300 грн', 'Manicure under 300'),
  ];

  return (
    <div className="p-3 sm:p-6">
      <div className="max-w-3xl mx-auto">
        {/* Title row + Search/Ask AI toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5">
            <span className="grid place-items-center h-9 w-9 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 text-white text-base shadow-sm">✦</span>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white leading-tight">{tr('AI Консьєрж', 'AI Консьерж', 'AI Concierge')}</h1>
              <p className="text-xs text-gray-400 dark:text-gray-500 leading-tight">
                {coords ? tr('Місце визначено', 'Местоположение определено', 'Location on') : tr('Місце вимкнено', 'Местоположение выключено', 'Location off')}
              </p>
            </div>
          </div>
          <SearchAiToggle active="ai" className="self-start sm:self-auto" />
        </div>

        {/* Chat card — sits inside the app chrome (sidebar/menu stays visible) */}
        <div className="flex flex-col rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm overflow-hidden h-[calc(100vh-15rem)] min-h-[400px]">
          <div className="flex-1 overflow-y-auto px-3 sm:px-4 py-4 space-y-4 bg-gray-50/60 dark:bg-gray-900/30">
        {turns.length === 0 && (
          <div className="mt-8 text-center">
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              {tr('Опишіть, що вам потрібно — я знайду майстра поруч, час і маршрут.',
                  'Опишите, что вам нужно — я найду мастера рядом, время и маршрут.',
                  'Tell me what you need — I’ll find a specialist near you, a time, and the route.')}
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {suggestions.map((s) => (
                <button key={s} onClick={() => setInput(s)} className="px-3 py-1.5 text-sm rounded-full border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800">
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {turns.map((t, i) => (
          <div key={i} className={t.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
            <div className={`max-w-[85%] ${t.role === 'user' ? 'bg-primary-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700'} rounded-2xl px-4 py-2.5`}>
              <p className="whitespace-pre-wrap text-sm">{t.text}</p>
              {t.options && t.options.length > 0 && (
                <div className="mt-3 space-y-2">
                  {t.options.slice(0, 5).map((o) => (
                    <div key={o.serviceId} className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40 p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900 dark:text-white truncate">{o.serviceName}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{o.businessName}{o.city ? ` · ${o.city}` : ''}</p>
                          {o.address && <p className="text-xs text-gray-400 truncate">{o.address}</p>}
                        </div>
                        <div className="text-right shrink-0">
                          <p className="font-semibold text-primary-600 dark:text-primary-400 tabular-nums">{money(o.price, o.currency)}</p>
                          {typeof o.distanceKm === 'number' && (
                            <p className="text-[11px] text-gray-400 tabular-nums">{o.distanceKm} km · ~{o.etaMinutes} min</p>
                          )}
                        </div>
                      </div>
                      <div className="mt-2 flex gap-2">
                        {o.navUrl && (
                          <a href={o.navUrl} target="_blank" rel="noopener noreferrer" className="flex-1 text-center text-xs font-medium px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800">
                            {tr('Маршрут', 'Маршрут', 'Navigate')}
                          </a>
                        )}
                        <Link to={o.bookUrl} className="flex-1 text-center text-xs font-medium px-3 py-1.5 rounded-lg bg-primary-600 text-white hover:bg-primary-700">
                          {tr('Забронювати', 'Забронировать', 'Book')}
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {t.products && t.products.length > 0 && (
                <div className="mt-3 space-y-2">
                  {t.products.slice(0, 5).map((p) => (
                    <div key={p.productId} className="rounded-xl border border-amber-200 dark:border-amber-800/60 bg-amber-50/60 dark:bg-amber-900/10 p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex items-start gap-2.5">
                          {p.imageUrl && (
                            <img src={p.imageUrl} alt="" className="h-11 w-11 rounded-lg object-cover shrink-0 ring-1 ring-inset ring-black/5 dark:ring-white/10" />
                          )}
                          <div className="min-w-0">
                          <p className="font-semibold text-gray-900 dark:text-white truncate">{p.imageUrl ? '' : '🛍 '}{p.productName}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{p.shopName}{p.city ? ` · ${p.city}` : ''}</p>
                          {p.address && <p className="text-xs text-gray-400 truncate">{p.address}</p>}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="font-semibold text-amber-700 dark:text-amber-400 tabular-nums">{money(p.price, p.currency)}</p>
                          <p className="text-[11px] text-gray-400">{tr('в наявності', 'в наличии', 'in stock')}: {p.inStock}</p>
                          {typeof p.distanceKm === 'number' && (
                            <p className="text-[11px] text-gray-400 tabular-nums">{p.distanceKm} km · ~{p.etaMinutes} min</p>
                          )}
                        </div>
                      </div>
                      <div className="mt-2 flex gap-2">
                        {p.navUrl && (
                          <a href={p.navUrl} target="_blank" rel="noopener noreferrer" className="flex-1 text-center text-xs font-medium px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800">
                            {tr('Маршрут', 'Маршрут', 'Navigate')}
                          </a>
                        )}
                        <Link to={p.shopUrl} className="flex-1 text-center text-xs font-medium px-3 py-1.5 rounded-lg bg-amber-600 text-white hover:bg-amber-700">
                          {tr('Магазин', 'Магазин', 'View shop')}
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {busy && (
          <div className="flex justify-start">
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl px-4 py-2.5 text-sm text-gray-400">…</div>
          </div>
        )}
            <div ref={endRef} />
          </div>

          {/* Input bar (inside the card) */}
          <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3">
            <div className="flex items-end gap-2">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
                rows={1}
                placeholder={tr('Напишіть повідомлення…', 'Напишите сообщение…', 'Type a message…')}
                className="flex-1 resize-none rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 max-h-32"
              />
              <button onClick={send} disabled={busy || !input.trim()} className="shrink-0 h-11 px-4 rounded-xl bg-primary-600 text-white font-medium hover:bg-primary-700 disabled:opacity-50 transition active:scale-[0.98]">
                {tr('Надіслати', 'Отправить', 'Send')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConciergePage;

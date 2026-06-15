import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useAppDispatch } from '@/hooks/redux';
import { logout } from '@/store/slices/authSlice';
import { SunIcon, MoonIcon, ArrowRightOnRectangleIcon, ChevronDownIcon } from '@/components/icons';

type IconType = React.ComponentType<{ className?: string; active?: boolean }>;
export interface TabItem { nameKey: string; fallback: string; href: string; icon: IconType; }
export interface TabSection { title: string; items: TabItem[]; }

interface Props {
  /** Exactly four primary destinations — two render left of the centre menu, two right. */
  primary: TabItem[];
  /** Secondary destinations, grouped into labelled sections for the menu sheet. */
  sections: TabSection[];
}

const isActivePath = (pathname: string, href: string) =>
  pathname === href || pathname.startsWith(href + '/');

/**
 * Redesigned mobile navigation: a floating, frosted pill with a raised centre
 * "menu" button. Tapping the centre opens a spring sheet whose items reveal in
 * a stagger, grouped into sections (not a wall of icons). Active destination is
 * tracked by a shared layout pill that glides between tabs.
 */
export const MobileTabBar: React.FC<Props> = ({ primary, sections }) => {
  const location = useLocation();
  const { t } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const { currency, setCurrency } = useCurrency();
  const dispatch = useAppDispatch();
  const [open, setOpen] = useState(false);
  // Collapsible menu categories (persisted across opens).
  const [openSections, setOpenSections] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('mobile_nav_open_sections');
      if (saved) return JSON.parse(saved);
    } catch { /* ignore */ }
    return {};
  });
  const toggleSection = (key: string) =>
    setOpenSections((prev) => {
      const next = { ...prev, [key]: prev[key] === false ? true : false };
      try { localStorage.setItem('mobile_nav_open_sections', JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });

  const currencies: { value: string; label: string }[] = [
    { value: 'UAH', label: '₴ UAH' },
    { value: 'USD', label: '$ USD' },
    { value: 'EUR', label: '€ EUR' },
  ];

  const left = primary.slice(0, 2);
  const right = primary.slice(2, 4);

  const Tab = ({ item }: { item: TabItem }) => {
    const active = isActivePath(location.pathname, item.href);
    const Icon = item.icon;
    return (
      <Link
        to={item.href}
        className="flex flex-1 min-w-0 flex-col items-center justify-center gap-1 h-full cursor-pointer select-none"
      >
        {/* Fixed-size icon box. The glyph never swaps (regular variant always) so
            it cannot shift on activation — active is shown by colour + the bubble. */}
        <span className={`grid place-items-center h-6 w-6 transition-colors duration-200 ${active ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400 dark:text-gray-500'}`}>
          <Icon className="w-[22px] h-[22px]" />
        </span>
        {/* Plain label under the icon — no pill, so long UA/RU words don't look
            like cut-off boxes. Active state is shown by colour. */}
        <span className={`max-w-full truncate text-[10px] font-medium leading-none transition-colors duration-200 ${
          active
            ? 'text-primary-600 dark:text-primary-300'
            : 'text-gray-500 dark:text-gray-400'
        }`}>
          {t(item.nameKey) || item.fallback}
        </span>
      </Link>
    );
  };

  return (
    <>
      {/* Floating pill bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 lg:hidden pointer-events-none pb-[max(env(safe-area-inset-bottom),0.5rem)]">
        <div className="pointer-events-auto mx-3 relative">
          <nav className="relative flex items-center h-16 rounded-[22px] border border-gray-200/70 dark:border-white/10 bg-white/85 dark:bg-gray-900/85 backdrop-blur-xl shadow-[0_10px_30px_-8px_rgba(15,23,42,0.25)] dark:shadow-[0_10px_30px_-8px_rgba(0,0,0,0.6)] px-2">
            <div className="flex flex-1 items-center">{left.map((i) => <Tab key={i.href} item={i} />)}</div>
            <div className="w-16 shrink-0" aria-hidden />
            <div className="flex flex-1 items-center">{right.map((i) => <Tab key={i.href} item={i} />)}</div>
          </nav>

          {/* Raised centre menu button. Centring lives on this WRAPPER (CSS
              -translate-x-1/2). The button itself only does a whileTap scale —
              keeping framer's transform off the element that's centred, so the
              press no longer shifts it right / overlaps the tabs. */}
          <div className="absolute left-1/2 -translate-x-1/2 -top-4">
            <motion.button
              onClick={() => setOpen(true)}
              whileTap={{ scale: 0.9 }}
              aria-label={t('dashboard.nav.more') || 'Menu'}
              className="relative h-14 w-14 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 text-white shadow-[0_8px_20px_-4px_rgba(37,99,235,0.55)] ring-4 ring-white dark:ring-gray-950 flex items-center justify-center cursor-pointer"
            >
              <span className="absolute inset-0 rounded-full bg-secondary-400/30 blur-md -z-10" aria-hidden />
              <GridGlyph open={open} />
            </motion.button>
          </div>
        </div>
      </div>

      {/* Menu sheet */}
      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="absolute inset-0 bg-gray-950/55 backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 360, damping: 34 }}
              className="absolute bottom-0 inset-x-0 max-h-[82vh] overflow-y-auto rounded-t-3xl border-t border-gray-200 dark:border-white/10 bg-white dark:bg-gray-900 pb-[max(env(safe-area-inset-bottom),1.25rem)] shadow-2xl"
            >
              <div className="sticky top-0 bg-white dark:bg-gray-900 pt-3 pb-2 z-10">
                <div className="w-10 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full mx-auto" />
              </div>
              <div className="px-4 space-y-5">
                {sections.map((section, si) => {
                  const sectionOpen = openSections[section.title] !== false;
                  return (
                  <div key={section.title}>
                    <button
                      type="button"
                      onClick={() => toggleSection(section.title)}
                      aria-expanded={sectionOpen}
                      className="w-full flex items-center justify-between px-1 mb-2 cursor-pointer"
                    >
                      <h3 className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                        {t(section.title) || section.title}
                      </h3>
                      <ChevronDownIcon className={`w-4 h-4 text-gray-400 dark:text-gray-500 transition-transform duration-200 ${sectionOpen ? '' : '-rotate-90'}`} />
                    </button>
                    <AnimatePresence initial={false}>
                    {sectionOpen && (
                    <motion.div
                      key="body"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2, ease: 'easeInOut' }}
                      className="overflow-hidden"
                    >
                    <motion.div
                      className="grid grid-cols-2 gap-2 pb-1"
                      variants={{ show: { transition: { staggerChildren: 0.025, delayChildren: si * 0.04 } } }}
                      initial="hide" animate="show"
                    >
                      {section.items.map((item) => {
                        const active = isActivePath(location.pathname, item.href);
                        const Icon = item.icon;
                        return (
                          <motion.div
                            key={item.href}
                            variants={{ hide: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}
                            transition={{ type: 'spring', stiffness: 420, damping: 30 }}
                          >
                            <Link
                              to={item.href}
                              onClick={() => setOpen(false)}
                              className={`flex items-center gap-3 p-3 rounded-2xl border transition-colors cursor-pointer ${
                                active
                                  ? 'border-primary-200 dark:border-primary-500/40 bg-primary-50 dark:bg-primary-500/10'
                                  : 'border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-gray-800/60 hover:bg-gray-100 dark:hover:bg-gray-800 active:scale-[0.98]'
                              }`}
                            >
                              <span className={`shrink-0 grid place-items-center h-9 w-9 rounded-xl ${
                                active ? 'bg-primary-100 dark:bg-primary-500/20 text-primary-600 dark:text-primary-300'
                                       : 'bg-white dark:bg-gray-700/60 text-gray-500 dark:text-gray-300'
                              }`}>
                                <Icon className="w-[18px] h-[18px]" active={active} />
                              </span>
                              <span className={`text-[13px] font-medium leading-tight ${active ? 'text-primary-700 dark:text-primary-200' : 'text-gray-700 dark:text-gray-200'}`}>
                                {t(item.nameKey) || item.fallback}
                              </span>
                            </Link>
                          </motion.div>
                        );
                      })}
                    </motion.div>
                    </motion.div>
                    )}
                    </AnimatePresence>
                  </div>
                  );
                })}

                {/* Account controls — on mobile these live in the sheet since there's no sidebar. */}
                <div className="pt-4 border-t border-gray-100 dark:border-white/5">
                  <div className="space-y-2">
                    {/* Theme toggle */}
                    <button
                      onClick={toggleTheme}
                      className="w-full flex items-center gap-3 p-3 rounded-2xl border border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-gray-800/60 hover:bg-gray-100 dark:hover:bg-gray-800 active:scale-[0.98] transition-colors"
                    >
                      <span className="shrink-0 grid place-items-center h-9 w-9 rounded-xl bg-white dark:bg-gray-700/60 text-gray-500 dark:text-gray-300">
                        {theme === 'dark'
                          ? <SunIcon className="w-[18px] h-[18px]" />
                          : <MoonIcon className="w-[18px] h-[18px]" />}
                      </span>
                      <span className="text-[13px] font-medium text-gray-700 dark:text-gray-200">
                        {theme === 'dark'
                          ? (t('customer.settings.lightTheme') || 'Light')
                          : (t('customer.settings.darkTheme') || 'Dark')}
                      </span>
                    </button>

                    {/* Currency */}
                    <div className="flex items-center gap-2 p-3 rounded-2xl border border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-gray-800/60">
                      {currencies.map((c) => (
                        <button
                          key={c.value}
                          onClick={() => setCurrency(c.value as 'UAH' | 'USD' | 'EUR')}
                          className={`flex-1 px-2 py-1.5 rounded-lg text-[12px] font-semibold transition-colors ${
                            currency === c.value
                              ? 'bg-primary-100 text-primary-700 dark:bg-primary-500/20 dark:text-primary-300'
                              : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/60'
                          }`}
                        >
                          {c.label}
                        </button>
                      ))}
                    </div>

                    {/* Logout */}
                    <button
                      onClick={() => { setOpen(false); dispatch(logout()); }}
                      className="w-full flex items-center gap-3 p-3 rounded-2xl border border-error-100 dark:border-error-500/20 bg-error-50 dark:bg-error-500/10 hover:bg-error-100 dark:hover:bg-error-500/15 active:scale-[0.98] transition-colors"
                    >
                      <span className="shrink-0 grid place-items-center h-9 w-9 rounded-xl bg-white dark:bg-error-500/20 text-error-600 dark:text-error-400">
                        <ArrowRightOnRectangleIcon className="w-[18px] h-[18px]" />
                      </span>
                      <span className="text-[13px] font-medium text-error-600 dark:text-error-400">
                        {t('auth.logout') || 'Log out'}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

/** Centre-button glyph: a 2x2 dot grid that morphs to an X when the sheet is open. */
const GridGlyph: React.FC<{ open: boolean }> = ({ open }) => (
  <div className="relative w-5 h-5">
    <AnimatePresence mode="wait" initial={false}>
      {open ? (
        <motion.svg key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}
          viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" className="w-5 h-5">
          <path d="M6 6l12 12M18 6L6 18" />
        </motion.svg>
      ) : (
        <motion.svg key="grid" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }}
          viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
          <circle cx="7" cy="7" r="2.2" /><circle cx="17" cy="7" r="2.2" />
          <circle cx="7" cy="17" r="2.2" /><circle cx="17" cy="17" r="2.2" />
        </motion.svg>
      )}
    </AnimatePresence>
  </div>
);

export default MobileTabBar;

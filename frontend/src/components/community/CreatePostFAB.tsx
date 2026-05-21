// Floating action button for "create post". Hides itself when the
// user scrolls down (so it doesn't cover content while reading) and
// reappears on scroll-up. Hidden entirely when not logged in.

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PlusIcon } from '@heroicons/react/24/outline';
import { useAppSelector } from '@/hooks/redux';
import { selectIsAuthenticated } from '@/store/slices/authSlice';
import { useLanguage } from '@/contexts/LanguageContext';

export const CreatePostFAB: React.FC = () => {
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const { t } = useLanguage();
  const [visible, setVisible] = useState(true);

  // Hide on scroll-down, show on scroll-up — same pattern as Twitter / Material guidelines.
  useEffect(() => {
    let lastY = window.scrollY;
    let rafId = 0;
    const onScroll = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        const y = window.scrollY;
        if (y < 80) {
          setVisible(true);                 // always visible near the top
        } else if (y > lastY + 8) {
          setVisible(false);                // scrolling down
        } else if (y < lastY - 8) {
          setVisible(true);                 // scrolling up
        }
        lastY = y;
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(rafId);
    };
  }, []);

  if (!isAuthenticated) return null;

  return (
    <Link
      to="/community/create"
      aria-label={t('community.createPost') || 'Create Post'}
      className={[
        'fixed z-40',
        // Position above the mobile bottom-nav (lg:hidden) — sits in front of footer on desktop too.
        'right-4 bottom-20 sm:right-6 sm:bottom-8',
        'flex items-center justify-center',
        'w-14 h-14 sm:w-16 sm:h-16 rounded-full',
        'bg-gradient-to-br from-primary-500 to-primary-700 text-white',
        'shadow-xl hover:shadow-2xl',
        'transition-all duration-300',
        visible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-8 scale-90 pointer-events-none',
        // Press-down feedback and a gentle rotation on hover for personality.
        'active:scale-95 hover:rotate-90',
      ].join(' ')}
      style={{ willChange: 'transform, opacity' }}
    >
      <PlusIcon className="w-7 h-7 sm:w-8 sm:h-8" />
    </Link>
  );
};

export default CreatePostFAB;

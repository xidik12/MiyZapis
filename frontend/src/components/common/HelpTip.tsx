import React, { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QuestionMarkCircleIcon, XIcon } from '@/components/icons';

interface HelpTipProps {
  /** Bold heading inside the popover (optional). */
  title?: string;
  /** Explanation body — string or rich content. */
  content: React.ReactNode;
  /** Accessible label for the trigger button. */
  label?: string;
  /** Trigger icon size in px (default 18). */
  size?: number;
  className?: string;
}

/**
 * Inline contextual help: a small "?" trigger that opens a closable popover with
 * an explanation. Dismisses on outside-click, Esc, or the × button. The popover
 * is anchored under the trigger and clamped to stay within the viewport, so it
 * never overflows on mobile.
 */
export const HelpTip: React.FC<HelpTipProps> = ({
  title,
  content,
  label = 'Help',
  size = 18,
  className = '',
}) => {
  const [open, setOpen] = useState(false);
  const [shift, setShift] = useState(0);
  const wrapRef = useRef<HTMLSpanElement>(null);
  const popRef = useRef<HTMLDivElement>(null);
  const id = useId();

  // Close on outside-click / Esc.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent | TouchEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('touchstart', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('touchstart', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  // Keep the popover inside the viewport.
  useLayoutEffect(() => {
    if (!open || !popRef.current) {
      setShift(0);
      return;
    }
    const pad = 12;
    const r = popRef.current.getBoundingClientRect();
    let s = 0;
    if (r.right > window.innerWidth - pad) s = window.innerWidth - pad - r.right;
    if (r.left + s < pad) s = pad - r.left;
    setShift(s);
  }, [open]);

  return (
    <span ref={wrapRef} className={`relative inline-flex align-middle ${className}`}>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen((o) => !o);
        }}
        aria-label={label}
        aria-expanded={open}
        aria-controls={open ? id : undefined}
        className="inline-flex items-center justify-center rounded-full text-gray-400 hover:text-primary-600 dark:text-gray-500 dark:hover:text-primary-400 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-500/40"
      >
        <span className="inline-block" style={{ width: size, height: size }}>
          <QuestionMarkCircleIcon className="w-full h-full" />
        </span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            ref={popRef}
            id={id}
            role="dialog"
            aria-label={title || label}
            initial={{ opacity: 0, y: -4, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.97 }}
            transition={{ duration: 0.14, ease: 'easeOut' }}
            style={{ marginLeft: shift }}
            className="absolute left-0 top-full mt-2 z-50 w-72 max-w-[calc(100vw-1.5rem)] origin-top rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-xl p-3.5 text-left normal-case"
          >
            <div className="flex items-start gap-2">
              {title && (
                <p className="flex-1 text-sm font-semibold text-gray-900 dark:text-white tracking-normal">
                  {title}
                </p>
              )}
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="ml-auto -mr-1 -mt-0.5 flex-shrink-0 p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
              >
                <XIcon className="w-4 h-4" />
              </button>
            </div>
            <div className={`text-[13px] leading-relaxed text-gray-600 dark:text-gray-300 tracking-normal ${title ? 'mt-1.5' : ''}`}>
              {content}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </span>
  );
};

export default HelpTip;

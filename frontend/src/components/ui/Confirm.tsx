import React, { useEffect, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import { useLanguage } from '@/contexts/LanguageContext';

type ConfirmOptions = {
  title?: string;
  message?: string | React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: 'primary' | 'destructive';
};

const ConfirmDialog: React.FC<ConfirmOptions & { onResolve: (ok: boolean) => void }> = ({
  title,
  message,
  confirmText,
  cancelText,
  variant = 'primary',
  onResolve,
}) => {
  const { t } = useLanguage();
  const resolvedTitle = title ?? t('confirm.title.default');
  const resolvedMessage = message ?? t('confirm.message.default');
  const resolvedConfirmText = confirmText ?? t('confirm.confirm');
  const resolvedCancelText = cancelText ?? t('confirm.cancel');
  const panelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onResolve(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onResolve]);

  // Focus trap
  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;
    const focusables = () => Array.from(panel.querySelectorAll<HTMLElement>(
      'a,button,input,select,textarea,[tabindex]:not([tabindex="-1"])'
    )).filter(el => !el.hasAttribute('disabled'));
    const first = () => focusables()[0];
    const last = () => focusables()[focusables().length - 1];
    const handleKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      const f = first(); const l = last();
      if (!f || !l) return;
      if (e.shiftKey) {
        if (document.activeElement === f) { e.preventDefault(); l.focus(); }
      } else {
        if (document.activeElement === l) { e.preventDefault(); f.focus(); }
      }
    };
    panel.addEventListener('keydown', handleKey as any);
    // Focus first element on open
    setTimeout(() => (first() || panel).focus(), 0);
    return () => panel.removeEventListener('keydown', handleKey as any);
  }, []);

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
      <div ref={panelRef} className="modal-content" style={{ width: '100%', maxWidth: 420 }} tabIndex={-1}>
        <div className="modal-header">
          <h2 id="confirm-title" className="modal-title">{resolvedTitle}</h2>
          <button aria-label={t('confirm.closeAria')} className="btn btn-ghost" onClick={() => onResolve(false)}>
            <span aria-hidden>✕</span>
          </button>
        </div>
        <div className="modal-body text-secondary-content text-sm">
          {resolvedMessage}
          <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">{t('confirm.escHint')}</div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={() => onResolve(false)}>{resolvedCancelText}</button>
          <button
            className={
              variant === 'destructive'
                ? 'btn btn-error text-white'
                : 'btn btn-primary text-white'
            }
            onClick={() => onResolve(true)}
          >
            {resolvedConfirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export function confirm(options: ConfirmOptions = {}): Promise<boolean> {
  const host = document.createElement('div');
  document.body.appendChild(host);
  const root = ReactDOM.createRoot(host);

  return new Promise((resolve) => {
    const onResolve = (ok: boolean) => {
      resolve(ok);
      setTimeout(() => {
        root.unmount();
        if (host.parentNode) host.parentNode.removeChild(host);
      }, 0);
    };

    root.render(<ConfirmDialog {...options} onResolve={onResolve} />);
  });
}

export default confirm;

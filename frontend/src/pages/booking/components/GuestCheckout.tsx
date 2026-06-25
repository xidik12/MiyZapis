/**
 * GuestCheckout — inline guest flow for BookingFlow.
 *
 * Step 1: name + phone + email → POST /guest/request-code
 * Step 2: 6-digit OTP input   → POST /guest/verify-code → session stored → onSuccess()
 *
 * On success, the caller receives the same session a normal login would produce
 * (tokens in localStorage, Redux state set). The existing booking flow proceeds
 * as if the user had logged in normally.
 *
 * accountExists case: tells the user to sign in instead (no account takeover possible).
 * Phone channel: collected, displayed, but OTP delivered via email only today.
 *                When SMS provider is wired server-side, delivery lights up with no
 *                frontend changes required.
 */

import React, { useState, useRef, useCallback } from 'react';
import { useAppDispatch } from '../../../hooks/redux';
import { setUser, setTokens } from '../../../store/slices/authSlice';
import { setAuthTokens } from '../../../services';
import { apiClient } from '../../../services/api';
import { useLanguage } from '../../../contexts/LanguageContext';
import { toast } from 'react-toastify';

interface GuestCheckoutProps {
  /** Called after successful OTP verification + session creation. */
  onSuccess: () => void;
  /** Called when the user wants to go back to login/register instead. */
  onSignIn: () => void;
}

type Step = 'form' | 'otp';

// ─── API types ────────────────────────────────────────────────────────────────

interface RequestCodeResponse {
  sent: boolean;
  accountExists: boolean;
  maskedEmail?: string;
}

interface VerifyCodeResponse {
  user: Record<string, unknown>;
  tokens: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  };
}

// ─── Component ────────────────────────────────────────────────────────────────

const GuestCheckout: React.FC<GuestCheckoutProps> = ({ onSuccess, onSignIn }) => {
  const dispatch = useAppDispatch();
  const { t } = useLanguage();

  // Form state
  const [step, setStep] = useState<Step>('form');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [maskedEmail, setMaskedEmail] = useState('');

  // OTP state
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const otpRefs = useRef<Array<HTMLInputElement | null>>([]);

  // Loading / error
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // ── Step 1: request code ────────────────────────────────────────────────────

  const handleRequestCode = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    setLoading(true);
    try {
      const res = await apiClient.post<RequestCodeResponse>('/guest/request-code', {
        name: name.trim(),
        phone: phone.trim() || undefined,
        email: email.trim().toLowerCase(),
      });

      if (!res.success || !res.data) {
        throw new Error(res.error?.message || t('guest.errorSending') || 'Failed to send code');
      }

      if (res.data.accountExists) {
        toast.info(
          t('guest.accountExistsInfo') ||
          'An account with this email already exists. Please sign in.'
        );
        onSignIn();
        return;
      }

      setMaskedEmail(res.data.maskedEmail || email.replace(/(.{1,3}).*(@.*)/, '$1***$2'));
      setStep('otp');
      startResendCooldown();
      toast.success(
        (t('guest.codeSent') || 'Code sent to {{email}}').replace('{{email}}', res.data.maskedEmail || email)
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(msg || (t('guest.errorSending') || 'Failed to send verification code'));
    } finally {
      setLoading(false);
    }
  }, [name, phone, email, t, onSignIn]);

  // ── OTP input helpers ───────────────────────────────────────────────────────

  const handleOtpChange = (index: number, value: string) => {
    // Accept only digits; handle paste
    const digits = value.replace(/\D/g, '');
    if (digits.length > 1) {
      // Paste: distribute across cells
      const next = [...otp];
      for (let i = 0; i < 6 && i < digits.length; i++) {
        next[index + i] = digits[i];
        if (index + i >= 5) break;
      }
      setOtp(next.slice(0, 6));
      const focusIdx = Math.min(index + digits.length, 5);
      otpRefs.current[focusIdx]?.focus();
      return;
    }
    const next = [...otp];
    next[index] = digits;
    setOtp(next);
    if (digits && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  // ── Resend cooldown ─────────────────────────────────────────────────────────

  const startResendCooldown = () => {
    setResendCooldown(60);
    const interval = setInterval(() => {
      setResendCooldown(prev => {
        if (prev <= 1) { clearInterval(interval); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || loading) return;
    setOtp(['', '', '', '', '', '']);
    setLoading(true);
    try {
      const res = await apiClient.post<RequestCodeResponse>('/guest/request-code', {
        name: name.trim(),
        phone: phone.trim() || undefined,
        email: email.trim().toLowerCase(),
      });
      if (!res.success || !res.data) throw new Error(res.error?.message || 'Failed');
      startResendCooldown();
      toast.success(t('guest.codeResent') || 'A new code has been sent.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(msg || (t('guest.errorSending') || 'Failed to resend code'));
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2: verify code ─────────────────────────────────────────────────────

  const handleVerify = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault();
    const code = otp.join('');
    if (code.length !== 6) return;

    setLoading(true);
    try {
      const res = await apiClient.post<VerifyCodeResponse>('/guest/verify-code', {
        email: email.trim().toLowerCase(),
        code,
      });

      if (!res.success || !res.data) {
        throw new Error(res.error?.message || t('guest.errorInvalidCode') || 'Invalid code');
      }

      const { user, tokens } = res.data;

      // Store tokens (same as normal login)
      setAuthTokens({ accessToken: tokens.accessToken, refreshToken: tokens.refreshToken });

      // Update Redux (same as normal login)
      dispatch(setTokens({ accessToken: tokens.accessToken, refreshToken: tokens.refreshToken, expiresIn: tokens.expiresIn }));
      dispatch(setUser(user as any));

      toast.success(t('guest.sessionCreated') || 'You\'re in! Continuing your booking...');
      onSuccess();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(msg || (t('guest.errorInvalidCode') || 'Invalid or expired code. Try again.'));
      // Clear OTP so user can re-type
      setOtp(['', '', '', '', '', '']);
      otpRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  }, [otp, email, dispatch, t, onSuccess]);

  // Auto-submit when all 6 digits filled
  React.useEffect(() => {
    if (step === 'otp' && otp.join('').length === 6) {
      handleVerify();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otp, step]);

  // ── Render ──────────────────────────────────────────────────────────────────

  const inputBase =
    'w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 ' +
    // py-3 = 12px top+bottom → 48px total height (≥44px touch target)
    // text-base = 16px — prevents iOS auto-zoom on focus
    'px-4 py-3 text-base text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 ' +
    'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition';

  if (step === 'form') {
    return (
      <div className="rounded-2xl border border-primary-200 dark:border-primary-800 bg-primary-50 dark:bg-primary-900/20 p-5">
        <h3 className="font-semibold text-primary-900 dark:text-primary-100 text-base leading-snug mb-1">
          {t('guest.checkoutTitle') || 'Continue as guest'}
        </h3>
        <p className="text-sm text-primary-700 dark:text-primary-300 mb-4">
          {t('guest.checkoutDesc') || 'Enter your details and we\'ll send a code to verify your email.'}
        </p>

        <form onSubmit={handleRequestCode} className="space-y-3">
          <input
            type="text"
            placeholder={t('guest.namePlaceholder') || 'Your name'}
            value={name}
            onChange={e => setName(e.target.value)}
            required
            maxLength={120}
            autoComplete="name"
            className={inputBase}
          />
          <input
            type="email"
            placeholder={t('guest.emailPlaceholder') || 'Email address'}
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            autoComplete="email"
            className={inputBase}
          />
          <input
            type="tel"
            placeholder={t('guest.phonePlaceholder') || 'Phone number (optional)'}
            value={phone}
            onChange={e => setPhone(e.target.value)}
            autoComplete="tel"
            className={inputBase}
          />

          <div className="flex flex-col sm:flex-row gap-2 pt-1">
            <button
              type="submit"
              disabled={loading || !name.trim() || !email.trim()}
              className="flex-1 inline-flex items-center justify-center rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition active:scale-[0.97]"
            >
              {loading
                ? (t('guest.sending') || 'Sending…')
                : (t('guest.sendCode') || 'Send verification code')}
            </button>
            <button
              type="button"
              onClick={onSignIn}
              className="flex-1 inline-flex items-center justify-center rounded-xl border border-gray-300 dark:border-gray-600 px-5 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition active:scale-[0.97]"
            >
              {t('auth.signIn') || 'Sign in'}
            </button>
          </div>
        </form>
      </div>
    );
  }

  // step === 'otp'
  return (
    <div className="rounded-2xl border border-primary-200 dark:border-primary-800 bg-primary-50 dark:bg-primary-900/20 p-5">
      <button
        type="button"
        onClick={() => { setStep('form'); setOtp(['', '', '', '', '', '']); }}
        className="text-sm text-primary-600 dark:text-primary-400 font-medium mb-3 flex items-center gap-1 hover:underline"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        {t('common.back') || 'Back'}
      </button>

      <h3 className="font-semibold text-primary-900 dark:text-primary-100 text-base leading-snug mb-1">
        {t('guest.otpTitle') || 'Enter your verification code'}
      </h3>
      <p className="text-sm text-primary-700 dark:text-primary-300 mb-4 break-all">
        {(t('guest.otpDesc') || 'We sent a 6-digit code to {{email}}. It expires in 10 minutes.').replace('{{email}}', maskedEmail)}
      </p>

      <form onSubmit={handleVerify}>
        {/* OTP cells
            Layout math at 320px viewport:
              p-5 container padding = 20px each side → 280px available
              6 cells × 40px + 5 gaps × 6px = 240 + 30 = 270px  ✓ fits
            At sm (640px+): cells grow to w-11 (44px), gaps to 8px = 6×44+5×8 = 304px ✓ */}
        <div className="flex gap-1.5 sm:gap-2 justify-center mb-4" role="group" aria-label="Verification code">
          {otp.map((digit, i) => (
            <input
              key={i}
              ref={el => { otpRefs.current[i] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={6} /* allow paste of full code */
              value={digit}
              onChange={e => handleOtpChange(i, e.target.value)}
              onKeyDown={e => handleOtpKeyDown(i, e)}
              aria-label={`Digit ${i + 1}`}
              className={
                // w-10 h-12 on mobile (40×48px), w-11 h-14 on sm+ — both ≥44px touch targets
                // text-xl on mobile, text-2xl on sm — 16px+ avoids iOS zoom
                'w-10 h-12 sm:w-11 sm:h-14 text-center text-xl sm:text-2xl font-bold tabular-nums rounded-xl border ' +
                'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 ' +
                'text-gray-900 dark:text-white focus:outline-none focus:ring-2 ' +
                'focus:ring-primary-500 focus:border-transparent transition'
              }
              disabled={loading}
            />
          ))}
        </div>

        <button
          type="submit"
          disabled={loading || otp.join('').length !== 6}
          className="w-full inline-flex items-center justify-center rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition active:scale-[0.97]"
        >
          {loading
            ? (t('guest.verifying') || 'Verifying…')
            : (t('guest.verify') || 'Verify & continue')}
        </button>
      </form>

      {/* Resend */}
      <p className="text-sm text-center text-primary-600 dark:text-primary-400 mt-3">
        {resendCooldown > 0
          ? (t('guest.resendIn') || 'Resend in {{s}}s').replace('{{s}}', String(resendCooldown))
          : (
            <button
              type="button"
              onClick={handleResend}
              disabled={loading}
              className="font-medium underline underline-offset-2 hover:no-underline disabled:opacity-50"
            >
              {t('guest.resend') || 'Resend code'}
            </button>
          )}
      </p>
    </div>
  );
};

export default GuestCheckout;

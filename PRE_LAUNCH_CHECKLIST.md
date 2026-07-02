# MiyZapis — Pre-Launch Checklist
_Last updated: 2026-07-02 • Launch shape: **free marketplace, Telegram-Stars-only subscriptions**_

**Access model (live & verified):** Guests → search only. Registered (free) → everything except AI. Premium (Stars) → + AI concierge. Profiles/services are public (clickable from search); book / favorite / Ask-AI require login.

---

## 🔴 BLOCKERS — clear before marketing (owner: **you**)

- [ ] **Rotate the Coinbase webhook secret** — it's in git history (`backend/verify-coinbase-signature.js`). Rotate in Coinbase Commerce, update the live env var.
- [ ] **Rotate the admin password** (`Admin123!@#`) — in git history (`verify-admin.js`, `create-admin.ts`); `verify-admin.js` *resets prod admin pw to it on run*. Change the live admin password.
- [ ] **After rotating → tell me** so I scrub both from git history (the scripts are already scrubbed at HEAD + gitignored, but history still exposes them).
- [ ] **Real-device E2E QA** (can't be done headless):
  - [ ] Web: register (customer + specialist) → search → view profile → book → chat → cancel → review
  - [ ] Specialist: onboard/complete profile → add service → add inventory → POS sale → payroll
  - [ ] Telegram Mini-App: auto-login → search → book → pay a Stars subscription → link/verify phone
  - [ ] Capacitor app (iOS + Android): login, safe-area/notch, push permission, deep links
  - [ ] Premium: buy AI Premium via Stars → Ask AI returns a real plan

## 🟠 LAUNCH CONFIG — verify on live before opening (owner: **you / ops**)

- [ ] **Live backend env vars present:** `JWT_SECRET`, `DATABASE_URL`, `TELEGRAM_BOT_TOKEN` ✓, `GEMINI_API_KEY` ✓, SMTP (host/user/pass/from), `TELEGRAM_STARS_MONTHLY/SIXMONTH/ANNUAL/AI`
- [ ] **Live frontend build env:** `VITE_PAYMENTS_ENABLED=false` ✓ (Stars-only), `VITE_VAPID_PUBLIC_KEY`, `VITE_API_URL`, `VITE_TELEGRAM_BOT` , `TELEGRAM_MINI_APP_URL`
- [ ] **BotFather:** Telegram Stars/payments enabled for the bot; Mini App URL points at the current frontend (not the stale `mini-app/`)
- [ ] **Push (optional):** set `FIREBASE_SERVICE_ACCOUNT` on live BE — otherwise native push is a silent no-op (email + Telegram notifications still work)
- [ ] **Real ETAs (optional):** server `GOOGLE_MAPS_API_KEY` with **Routes API** enabled + allowed on the key (else concierge uses straight-line distance)
- [ ] **Prod hygiene:** confirm dev seed/test accounts are NOT on the prod DB (`miyzapis`); confirm DB backups are on; confirm error monitoring (Sentry/logs) is wired
- [ ] **Legal:** Terms & Privacy content final; Stars-subscription terms; business entity for taking Stars payouts

## 🟡 FAST-FOLLOW — fixable, non-blocking (owner: **me, on request**)

- [ ] Customer **email-change** save is a no-op → make read-only or add a verify flow
- [ ] Customer **notification-toggle** hydration on mount (currently resets on reload)
- [ ] **S3 bucket policy** scope to `avatar/portfolio/service` (currently public on `document/certificate`) — deploy-time config
- [ ] `requireOwnership('reviewId')` param mismatch (fails-closed today — over-restrictive, not exploitable)
- [ ] Search **"Near Me"** + saved-filter presets are built but trapped in a hidden block → surface them
- [ ] Specialist dashboard: **empty state** for Recent Bookings + surface fetch failures (silent today)
- [ ] Bottom-sheet modals (POS checkout, booking detail, reschedule, review) safe-area padding on notched phones
- [ ] Typing indicators (dead code), conversation "More options" button (no handler), community **bookmarks** hydration
- [ ] Crash screen: dark-mode + localized; native push **re-register on login** (currently only at cold start)

## 🟢 POST-LAUNCH / WHEN SCALING (owner: **later**)

- [ ] **Card/PayPal/crypto payments** are gated OFF. Before enabling: rebuild provider verification (PayPal real webhook sig, real Stripe SDK + server-side amount, Coinbase amount-check, WayForPay fail-closed) — all flagged in `project_miyzapis_security_audit`
- [ ] Global rate-limit tuning review; SMS provider (dropped) if ever needed
- [ ] SEO: profiles are login-free (good); add sitemap/meta if organic search matters

---

## ✅ DONE THIS AUDIT (for reference)

**Access & AI**
- Access model implemented + live (guest/registered/premium)
- AI concierge + AI-Premium (Stars) purchase + admin logs **promoted to live**; prod migration applied; Gemini key set; endpoint gated (401 guest / 402 free / works premium)

**Security (all fixed + live)**
- Admin self-registration (privilege escalation) • unauth file-read & path-traversal file-write • booking mass-assignment • wallet/group-roster/referral/CRM/HR IDORs • calendar-OAuth state signing • messaging read-IDOR • **Telegram-link + phone-verify bypass** (signed initData) • payment provider/webhook routes gated behind `PAYMENTS_ENABLED` (kills forgery class) • payroll/purchasing owner-gated • email-bomb rate-limiter • committed secrets scrubbed at HEAD + gitignored

**Broken flows (fixed + live)**
- Realtime chat + in-app notifications (socket names/emit) • Notification.data & Message.attachments JSON-parse • conversation list unread badge + last-message • cancellation notifications localized • booking "Mark Completed" 500 • marketplace search + city filter • no-show/reject validator • group-full 409 • favorites pagination • referral `?ref` attribution • Pay-at-Venue persist • working-hours dual-schema • invited-staff stranding

**UI/UX (fixed + live)**
- priceAsc sort • chat avatars + double-submit + a11y • missing i18n keys (status/google-fail) • safe-area (nav buttons, toasts) • verified-badge dark • slot-date UTC+7

**Verified booking flows solid:** guest OTP removed (login required), reschedule/cancel/waitlist, review-after-completion, Stars subscription invoice/dedup/renewal, POS/inventory/sales atomic money handling.

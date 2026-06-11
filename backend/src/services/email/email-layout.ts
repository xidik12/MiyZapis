// Shared branded layout for all MiyZapis transactional emails.
// One place to change brand colors, logo, header/footer.
//
// Brand palette mirrors the frontend Tailwind config exactly so emails read as
// an extension of the website (azure accent + warm neutrals):
//   primary   #2563eb (azure 600, the CTA color) / #1d4ed8 (700)
//   secondary #ffc41f (Bright Yellow 500)
//   page bg   #f7f6f3 (warm neutral, like the site's light background)
//   card      #ffffff with 1px warm border #e9e6e2
//   heading   #1a1714 (warm near-black, == site --text-primary)

export type EmailLanguage = 'en' | 'uk' | 'ru';

const BRAND = {
  primary: '#2563eb',
  primaryDark: '#1d4ed8',
  secondary: '#ffc41f',
  pageBg: '#f7f6f3',
  card: '#ffffff',
  cardBorder: '#e9e6e2',
  heading: '#1a1714',
  body: '#44423e',
  muted: '#747270',
  faint: '#a3a19d',
  infoBg: '#eff5ff',
  successBg: '#ecfdf5',
  successBorder: '#10b981',
  warnBg: '#fffaeb',
  warnBorder: '#ffc41f',
  dangerBg: '#fef2f2',
  dangerBorder: '#ef4444',
  logoUrl: 'https://miyzapis.com/email-logo.png',
  siteUrl: 'https://miyzapis.com',
  siteLabel: 'miyzapis.com',
} as const;

const FOOTER_STRINGS: Record<EmailLanguage, { tagline: string; legal: string; reason: string }> = {
  en: {
    tagline: 'MiyZapis — Book specialists, manage appointments.',
    legal: '© MiyZapis. All rights reserved.',
    reason: 'You are receiving this email because you have an account on MiyZapis.',
  },
  uk: {
    tagline: 'МійЗапис — бронюйте спеціалістів і керуйте записами.',
    legal: '© МійЗапис. Всі права захищено.',
    reason: 'Ви отримали цей лист, тому що маєте акаунт на МійЗапис.',
  },
  ru: {
    tagline: 'МойЗапись — бронируйте специалистов и управляйте записями.',
    legal: '© МойЗапись. Все права защищены.',
    reason: 'Вы получили это письмо, потому что у вас есть аккаунт на МойЗапись.',
  },
};

export function normalizeLang(input: string | undefined | null): EmailLanguage {
  if (!input) return 'en';
  const code = input.toLowerCase().split(/[-_]/)[0];
  if (code === 'uk' || code === 'ru') return code;
  return 'en';
}

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

interface LayoutOptions {
  lang: EmailLanguage;
  subject: string;
  preheader: string;
  bodyHtml: string;
}

export function renderBrandedHtml(opts: LayoutOptions): string {
  const { lang, subject, preheader, bodyHtml } = opts;
  const footer = FOOTER_STRINGS[lang];
  const langAttr = lang === 'uk' ? 'uk' : lang === 'ru' ? 'ru' : 'en';

  return `<!DOCTYPE html>
<html lang="${langAttr}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="x-apple-disable-message-reformatting">
<meta name="color-scheme" content="light only">
<meta name="supported-color-schemes" content="light only">
<title>${escapeHtml(subject)}</title>
</head>
<body style="margin:0; padding:0; background-color:${BRAND.pageBg}; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','Inter',Roboto,sans-serif; -webkit-font-smoothing:antialiased; color:${BRAND.body};">
<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;visibility:hidden;opacity:0;color:transparent;height:0;width:0;font-size:1px;line-height:1px;">${escapeHtml(preheader)}</div>
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color:${BRAND.pageBg};">
  <tr><td align="center" style="padding:32px 12px 0;">
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width:600px;">
      <tr><td align="center" style="padding:0 0 24px;">
        <a href="${BRAND.siteUrl}" style="text-decoration:none; display:inline-block;">
          <img src="${BRAND.logoUrl}" width="56" height="56" alt="MiyZapis" style="display:block;border:0;outline:none;text-decoration:none;width:56px;height:56px;border-radius:12px;">
        </a>
      </td></tr>
      <tr><td style="background-color:${BRAND.card}; border:1px solid ${BRAND.cardBorder}; border-radius:14px; padding:40px 36px;">
        ${bodyHtml}
      </td></tr>
      <tr><td align="center" style="padding:24px 16px 40px; color:${BRAND.faint}; font-size:12px; line-height:1.7;">
        <div style="margin:0 0 6px; color:${BRAND.muted}; font-size:13px;">${escapeHtml(footer.tagline)}</div>
        <div style="margin:0 0 6px;"><a href="${BRAND.siteUrl}" style="color:${BRAND.primary}; text-decoration:none;">${BRAND.siteLabel}</a></div>
        <div style="margin:0 0 4px;">${escapeHtml(footer.legal)}</div>
        <div style="margin:0; color:${BRAND.faint};">${escapeHtml(footer.reason)}</div>
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;
}

// Reusable inline-style snippets so each template stays terse.
export const STYLES = {
  h1: `color:${BRAND.heading};font-size:24px;font-weight:700;line-height:1.3;margin:0 0 16px;`,
  h2: `color:${BRAND.heading};font-size:20px;font-weight:700;line-height:1.35;margin:0 0 14px;`,
  h3: `color:${BRAND.heading};font-size:16px;font-weight:700;line-height:1.4;margin:0 0 12px;`,
  p: `color:${BRAND.body};font-size:16px;line-height:1.6;margin:0 0 16px;`,
  small: `color:${BRAND.muted};font-size:14px;line-height:1.6;margin:0 0 12px;`,
  faint: `color:${BRAND.faint};font-size:13px;line-height:1.5;margin:16px 0 0;`,
  primaryButton: `display:inline-block;background:${BRAND.primary};color:#ffffff !important;padding:14px 30px;border-radius:8px;text-decoration:none;font-weight:600;font-size:16px;line-height:1;mso-padding-alt:0;`,
  secondaryButton: `display:inline-block;background:#ffffff;color:${BRAND.primary} !important;padding:13px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;line-height:1;border:1px solid ${BRAND.primary};`,
  buttonRow: `text-align:center;margin:28px 0 8px;`,
  infoBox: `background:${BRAND.infoBg};border-left:4px solid ${BRAND.primary};padding:18px 20px;border-radius:8px;margin:0 0 20px;`,
  successBox: `background:${BRAND.successBg};border-left:4px solid ${BRAND.successBorder};padding:18px 20px;border-radius:8px;margin:0 0 20px;`,
  warnBox: `background:${BRAND.warnBg};border-left:4px solid ${BRAND.warnBorder};padding:18px 20px;border-radius:8px;margin:0 0 20px;`,
  detailRow: `color:${BRAND.body};font-size:15px;line-height:1.6;margin:4px 0;`,
  link: `color:${BRAND.primary};text-decoration:none;`,
  hr: `border:none;border-top:1px solid ${BRAND.cardBorder};margin:24px 0;`,
} as const;

export { BRAND };

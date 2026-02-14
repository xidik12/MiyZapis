/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        // Semantic background tokens (BTC Oracle pattern)
        bg: {
          primary: 'var(--mz-bg-primary, #0c0f16)',
          secondary: 'var(--mz-bg-secondary, #141820)',
          card: 'var(--mz-bg-card, rgba(22, 28, 38, 0.65))',
          hover: 'var(--mz-bg-hover, #1e2530)',
          input: 'var(--mz-bg-input, #1a2030)',
        },
        // MiyZapis accent palette (sky blue primary, bright yellow secondary)
        accent: {
          primary: 'var(--mz-accent-primary, #3b97f2)',    // sky blue
          secondary: 'var(--mz-accent-secondary, #ffc41f)', // bright yellow
          green: '#00d68f',
          red: '#ff4d6a',
          yellow: '#ffc41f',
          orange: '#ff8c42',
          purple: '#a78bfa',
        },
        // Text tokens
        text: {
          primary: 'var(--mz-text-primary, #f0f2f5)',
          secondary: 'var(--mz-text-secondary, #94a3b8)',
          muted: 'var(--mz-text-muted, #64748b)',
        },
        // Telegram-specific colors (preserved)
        'tg-bg': 'var(--tg-color-bg)',
        'tg-text': 'var(--tg-color-text)',
        'tg-hint': 'var(--tg-color-hint)',
        'tg-link': 'var(--tg-color-link)',
        'tg-button': 'var(--tg-color-button)',
        'tg-button-text': 'var(--tg-color-button-text)',
        'tg-secondary-bg': 'var(--tg-color-secondary-bg)',
        'tg-header-bg': 'var(--tg-color-header-bg)',
        'tg-accent': 'var(--tg-color-accent-text)',
        'tg-destructive': 'var(--tg-color-destructive-text)',
        'tg-section-bg': 'var(--tg-color-section-bg)',
        'tg-section-header': 'var(--tg-color-section-header-text)',
        'tg-subtitle': 'var(--tg-color-subtitle-text)',
      },
      boxShadow: {
        'card': '0 4px 24px rgba(0, 0, 0, 0.4), 0 1px 8px rgba(0, 0, 0, 0.3), 0 0 1px rgba(0, 0, 0, 0.2)',
        'card-hover': '0 8px 32px rgba(0, 0, 0, 0.5), 0 2px 12px rgba(0, 0, 0, 0.35), 0 0 1px rgba(0, 0, 0, 0.2)',
        'glow-blue': '0 0 20px rgba(59, 151, 242, 0.15), 0 0 6px rgba(59, 151, 242, 0.1)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) both',
        'scale-in': 'scaleIn 0.2s ease-out',
        'bounce-subtle': 'bounceSubtle 0.4s ease-out',
        'shimmer': 'shimmerSweep 1.8s ease-in-out infinite',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(16px)', opacity: '0', filter: 'blur(2px)' },
          '100%': { transform: 'translateY(0)', opacity: '1', filter: 'blur(0)' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.9)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        bounceSubtle: {
          '0%, 20%, 53%, 80%, 100%': { transform: 'translate3d(0,0,0)' },
          '40%, 43%': { transform: 'translate3d(0,-5px,0)' },
          '70%': { transform: 'translate3d(0,-2px,0)' },
          '90%': { transform: 'translate3d(0,-1px,0)' },
        },
        shimmerSweep: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: '1', textShadow: '0 0 6px rgba(59, 151, 242, 0.3)' },
          '50%': { opacity: '0.7', textShadow: '0 0 10px rgba(59, 151, 242, 0.5)' },
        },
      },
      spacing: {
        'safe-top': 'env(safe-area-inset-top)',
        'safe-bottom': 'env(safe-area-inset-bottom)',
        'safe-left': 'env(safe-area-inset-left)',
        'safe-right': 'env(safe-area-inset-right)',
      },
      height: {
        'screen-safe': 'calc(100vh - env(safe-area-inset-top) - env(safe-area-inset-bottom))',
        'telegram-viewport': 'var(--tg-viewport-height, 100vh)',
      },
      backdropBlur: {
        'card': '12px',
        'nav': '20px',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
    require('@tailwindcss/aspect-ratio'),
  ],
}

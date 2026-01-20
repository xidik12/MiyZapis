/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Panhaha - Red-led modern palette + cool blue secondary
        // Bright Red for action, Deep Blue for structure, Gold for outlines

        // PRIMARY - Bright Crimson Red (Energy, Bold, Action)
        primary: {
          50: '#FEF2F2',
          100: '#FEE2E2',
          200: '#FECACA',
          300: '#FCA5A5',
          400: '#F87171',
          500: '#DC2626', // Bright Crimson - Main primary
          600: '#B91C1C',
          700: '#991B1B',
          800: '#7F1D1D',
          900: '#450A0A',
          950: '#2D0A0A', // Very dark for dark mode
        },

        // SECONDARY - Deep Sea Blue (Ocean depths, Professional, Trust)
        secondary: {
          50: '#E6F1F5',
          100: '#CCE3EB',
          200: '#99C7D7',
          300: '#66ABC3',
          400: '#338FAF',
          500: '#00739B', // Deep Sea Blue - Main secondary
          600: '#005C7C',
          700: '#00455D',
          800: '#002E3E',
          900: '#00171F',
          950: '#000B0F', // Very dark for dark mode
        },

        // ACCENT - Rich Gold (OUTLINES/BORDERS ONLY)
        accent: {
          50: '#FEFCE8',
          100: '#FEF9C3',
          200: '#FEF08A',
          300: '#FDE047',
          400: '#FACC15',
          500: '#EAB308', // Gold - For borders/outlines only
          600: '#CA8A04',
          700: '#A16207',
          800: '#854D0E',
          900: '#713F12',
          950: '#422006',
        },

        // Neutral grays for backgrounds and text
        neutral: {
          50: '#FAFAFA',
          100: '#F4F4F5',
          200: '#E4E4E7',
          300: '#D4D4D8',
          400: '#A1A1AA',
          500: '#71717A',
          600: '#52525B',
          700: '#3F3F46',
          800: '#27272A',
          900: '#18181B',
          950: '#09090B',
        },

        // Semantic mappings
        success: {
          50: '#ECFDF5',
          100: '#D1FAE5',
          200: '#A7F3D0',
          300: '#6EE7B7',
          400: '#34D399',
          500: '#10B981',
          600: '#059669',
          700: '#047857',
          800: '#065F46',
          900: '#064E3B',
        },
        warning: {
          50: '#FFFBEB',
          100: '#FEF3C7',
          200: '#FDE68A',
          300: '#FCD34D',
          400: '#FBBF24',
          500: '#F59E0B',
          600: '#D97706',
          700: '#B45309',
          800: '#92400E',
          900: '#78350F',
        },
        error: {
          50: '#FEF2F2',
          100: '#FEE2E2',
          200: '#FECACA',
          300: '#FCA5A5',
          400: '#F87171',
          500: '#DC2626',
          600: '#B91C1C',
          700: '#991B1B',
          800: '#7F1D1D',
          900: '#450A0A',
        },
        info: {
          50: '#E6F1F5',
          100: '#CCE3EB',
          200: '#99C7D7',
          300: '#66ABC3',
          400: '#338FAF',
          500: '#00739B', // Deep Sea Blue for info (matches primary)
          600: '#005C7C',
          700: '#00455D',
          800: '#002E3E',
          900: '#00171F',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        display: ['Space Grotesk', 'Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'SF Mono', 'Monaco', 'Inconsolata', 'monospace'],
      },
      fontSize: {
        'display-lg': ['4.5rem', { lineHeight: '1.1', fontWeight: '700' }],
        'display-md': ['3.75rem', { lineHeight: '1.1', fontWeight: '700' }],
        'display-sm': ['3rem', { lineHeight: '1.2', fontWeight: '700' }],
        'h1': ['2.25rem', { lineHeight: '1.25', fontWeight: '600' }],
        'h2': ['1.875rem', { lineHeight: '1.3', fontWeight: '600' }],
        'h3': ['1.5rem', { lineHeight: '1.35', fontWeight: '600' }],
        'h4': ['1.25rem', { lineHeight: '1.4', fontWeight: '600' }],
        'h5': ['1.125rem', { lineHeight: '1.45', fontWeight: '600' }],
        'h6': ['1rem', { lineHeight: '1.5', fontWeight: '600' }],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      borderRadius: {
        'sm': '6px',
        'md': '10px',
        'lg': '14px',
        'xl': '18px',
        '2xl': '24px',
        'full': '9999px',
      },
      boxShadow: {
        'sm': '0 1px 2px 0 rgba(0, 0, 0, 0.04)',
        'md': '0 2px 8px 0 rgba(0, 0, 0, 0.08)',
        'lg': '0 4px 16px 0 rgba(0, 0, 0, 0.12)',
        'xl': '0 8px 24px 0 rgba(0, 0, 0, 0.16)',
        '2xl': '0 12px 32px 0 rgba(0, 0, 0, 0.20)',
        'primary': '0 2px 8px 0 rgba(0, 0, 0, 0.08)',
        'secondary': '0 2px 8px 0 rgba(0, 0, 0, 0.08)',
        'accent': '0 0 0 1px rgba(234, 179, 8, 0.5)',
        'success': '0 2px 8px 0 rgba(0, 0, 0, 0.08)',
        'warning': '0 2px 8px 0 rgba(0, 0, 0, 0.08)',
        'error': '0 2px 8px 0 rgba(0, 0, 0, 0.08)',
        'info': '0 2px 8px 0 rgba(0, 0, 0, 0.08)',
        'soft': '0 1px 4px 0 rgba(0, 0, 0, 0.04)',
        'elevated': '0 4px 12px 0 rgba(0, 0, 0, 0.12)',
      },
      animation: {
        'spin-slow': 'spin 3s linear infinite',
        'pulse-fast': 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'slide-in': 'slide-in 0.2s ease-out',
        'slide-out': 'slide-out 0.2s ease-in',
        'scale-in': 'scale-in 0.15s ease-out',
        'fade-in': 'fade-in 0.2s ease-out',
        'shimmer': 'shimmer 2s infinite',
      },
      keyframes: {
        'slide-in': {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        'slide-out': {
          '0%': { transform: 'translateX(0)', opacity: '1' },
          '100%': { transform: 'translateX(100%)', opacity: '0' },
        },
        'scale-in': {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'shimmer': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
      },
      screens: {
        'xs': '375px',
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1536px',
      },
      maxWidth: {
        'screen-xs': '375px',
        'screen-sm': '640px',
        'screen-md': '768px',
        'screen-lg': '1024px',
        'screen-xl': '1280px',
        'screen-2xl': '1536px',
      },
      backgroundImage: {
        // Clean design - no gradients
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
    require('@tailwindcss/aspect-ratio'),
  ],
}

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
        // Panhaha - 2 Color System + Gold Outlines
        // Dark Blue & Bright Red with Gold accents only for borders/outlines

        // PRIMARY - Dark Navy Blue (Trust, Professional, Deep)
        primary: {
          50: '#EFF6FF',
          100: '#DBEAFE',
          200: '#BFDBFE',
          300: '#93C5FD',
          400: '#60A5FA',
          500: '#1E40AF', // Dark Navy Blue - Main primary
          600: '#1E3A8A',
          700: '#1D4ED8',
          800: '#1E40AF',
          900: '#172554',
          950: '#0F1729', // Very dark for dark mode
        },

        // SECONDARY - Bright Crimson Red (Energy, Bold, Action)
        secondary: {
          50: '#FEF2F2',
          100: '#FEE2E2',
          200: '#FECACA',
          300: '#FCA5A5',
          400: '#F87171',
          500: '#DC2626', // Bright Crimson - Main secondary
          600: '#B91C1C',
          700: '#991B1B',
          800: '#7F1D1D',
          900: '#450A0A',
          950: '#2D0A0A', // Very dark for dark mode
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
          50: '#EFF6FF',
          100: '#DBEAFE',
          200: '#BFDBFE',
          300: '#93C5FD',
          400: '#60A5FA',
          500: '#1E40AF', // Dark Blue for success
          600: '#1E3A8A',
          700: '#1D4ED8',
          800: '#1E40AF',
          900: '#172554',
        },
        warning: {
          50: '#FEF2F2',
          100: '#FEE2E2',
          200: '#FECACA',
          300: '#FCA5A5',
          400: '#F87171',
          500: '#DC2626', // Red for warning
          600: '#B91C1C',
          700: '#991B1B',
          800: '#7F1D1D',
          900: '#450A0A',
        },
        error: {
          50: '#FEF2F2',
          100: '#FEE2E2',
          200: '#FECACA',
          300: '#FCA5A5',
          400: '#F87171',
          500: '#DC2626', // Bright Red for error
          600: '#B91C1C',
          700: '#991B1B',
          800: '#7F1D1D',
          900: '#450A0A',
        },
        info: {
          50: '#EFF6FF',
          100: '#DBEAFE',
          200: '#BFDBFE',
          300: '#93C5FD',
          400: '#60A5FA',
          500: '#1E40AF', // Dark Blue for info
          600: '#1E3A8A',
          700: '#1D4ED8',
          800: '#1E40AF',
          900: '#172554',
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
        'sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'md': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.06)',
        'lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.05)',
        'xl': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.04)',
        '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        'primary': '0 4px 20px 0 rgba(30, 64, 175, 0.35)', // Dark Blue
        'secondary': '0 4px 20px 0 rgba(220, 38, 38, 0.35)', // Bright Red
        'accent': '0 0 0 1px rgba(234, 179, 8, 0.5)', // Gold outline only
        'success': '0 4px 20px 0 rgba(30, 64, 175, 0.35)', // Dark Blue
        'warning': '0 4px 20px 0 rgba(220, 38, 38, 0.35)', // Red
        'error': '0 4px 20px 0 rgba(220, 38, 38, 0.35)', // Bright Red
        'info': '0 4px 20px 0 rgba(30, 64, 175, 0.35)', // Dark Blue
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.08)',
        'glow-primary': '0 0 28px rgba(30, 64, 175, 0.6)', // Dark Blue glow
        'glow-secondary': '0 0 28px rgba(220, 38, 38, 0.6)', // Red glow
        'glow-accent': '0 0 0 2px rgba(234, 179, 8, 0.8)', // Gold outline glow
        'soft': '0 2px 8px 0 rgba(0, 0, 0, 0.04)',
        'elevated': '0 12px 24px -8px rgba(0, 0, 0, 0.12)',
      },
      animation: {
        'spin-slow': 'spin 3s linear infinite',
        'pulse-fast': 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-x': 'bounce-x 1s infinite',
        'slide-in': 'slide-in 0.3s ease-out',
        'slide-out': 'slide-out 0.3s ease-in',
        'scale-in': 'scale-in 0.2s ease-out',
        'fade-in': 'fade-in 0.3s ease-out',
        'float': 'float 6s ease-in-out infinite',
        'shimmer': 'shimmer 2s infinite',
        'glow-pulse': 'glow-pulse 2s ease-in-out infinite alternate',
        'cambodia-wave': 'cambodia-wave 3s ease-in-out infinite',
        'temple-glow': 'temple-glow 3s ease-in-out infinite',
        'morph': 'morph 4s ease-in-out infinite',
        'gradient-x': 'gradient-x 15s ease infinite',
        'gradient-y': 'gradient-y 15s ease infinite',
        'tilt': 'tilt 10s infinite linear',
      },
      keyframes: {
        'bounce-x': {
          '0%, 100%': {
            transform: 'translateX(-25%)',
            'animation-timing-function': 'cubic-bezier(0.8, 0, 1, 1)',
          },
          '50%': {
            transform: 'translateX(0)',
            'animation-timing-function': 'cubic-bezier(0, 0, 0.2, 1)',
          },
        },
        'slide-in': {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        'slide-out': {
          '0%': { transform: 'translateX(0)', opacity: '1' },
          '100%': { transform: 'translateX(100%)', opacity: '0' },
        },
        'scale-in': {
          '0%': { transform: 'scale(0.9)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        'shimmer': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        'glow-pulse': {
          '0%': { boxShadow: '0 0 5px rgb(59 151 242 / 0.5)' },
          '100%': { boxShadow: '0 0 20px rgb(59 151 242 / 0.8), 0 0 30px rgb(59 151 242 / 0.4)' },
        },
        'cambodia-wave': {
          '0%, 100%': {
            background: 'linear-gradient(45deg, #C8102E 0%, #FFD700 100%)',
            transform: 'rotate(0deg)',
          },
          '50%': {
            background: 'linear-gradient(225deg, #C8102E 0%, #FFD700 100%)',
            transform: 'rotate(5deg)',
          },
        },
        'temple-glow': {
          '0%, 100%': {
            boxShadow: '0 0 20px #FFD700, 0 0 40px #FFD700, 0 0 60px #C8102E',
          },
          '50%': {
            boxShadow: '0 0 40px #FFD700, 0 0 80px #FFD700, 0 0 100px #C8102E',
          },
        },
        'morph': {
          '0%, 100%': { borderRadius: '60% 40% 30% 70% / 60% 30% 70% 40%' },
          '50%': { borderRadius: '30% 60% 70% 40% / 50% 60% 30% 60%' },
        },
        'gradient-x': {
          '0%, 100%': { transform: 'translateX(0%)', backgroundPosition: '0% 50%' },
          '50%': { transform: 'translateX(0%)', backgroundPosition: '100% 50%' },
        },
        'gradient-y': {
          '0%, 100%': { transform: 'translateY(0%)', backgroundPosition: '50% 0%' },
          '50%': { transform: 'translateY(0%)', backgroundPosition: '50% 100%' },
        },
        'tilt': {
          '0%, 50%, 100%': { transform: 'rotate(0deg)' },
          '25%': { transform: 'rotate(1deg)' },
          '75%': { transform: 'rotate(-1deg)' },
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
        'panhaha-gradient': 'linear-gradient(135deg, #1E40AF 0%, #DC2626 100%)', // Dark Blue → Red
        'panhaha-gradient-soft': 'linear-gradient(135deg, rgba(30, 64, 175, 0.08) 0%, rgba(220, 38, 38, 0.08) 100%)',
        'primary-gradient': 'linear-gradient(135deg, #1E40AF 0%, #1E3A8A 100%)', // Dark Blue gradient
        'secondary-gradient': 'linear-gradient(135deg, #DC2626 0%, #B91C1C 100%)', // Red gradient
        'accent-gradient': 'linear-gradient(135deg, #EAB308 0%, #CA8A04 100%)', // Gold (outlines only)
        'success-gradient': 'linear-gradient(135deg, #1E40AF 0%, #1E3A8A 100%)', // Dark Blue
        'warning-gradient': 'linear-gradient(135deg, #DC2626 0%, #B91C1C 100%)', // Red
        'error-gradient': 'linear-gradient(135deg, #DC2626 0%, #B91C1C 100%)', // Red
        'info-gradient': 'linear-gradient(135deg, #1E40AF 0%, #1E3A8A 100%)', // Dark Blue
        'glass-gradient': 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)',
        'hero-gradient': 'linear-gradient(135deg, #1E40AF 0%, #DC2626 100%)', // Dark Blue → Red
        'duotone-gradient': 'linear-gradient(to right, #1E40AF 0%, #DC2626 100%)', // Horizontal blue-red
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
    require('@tailwindcss/aspect-ratio'),
  ],
}

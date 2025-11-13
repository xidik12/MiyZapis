import React from 'react';
import { Link } from 'react-router-dom';

interface LogoProps {
  /**
   * Size variant for the logo
   * - 'sm': Small (32px) - for mobile headers
   * - 'md': Medium (48px) - default size
   * - 'lg': Large (64px) - for auth pages
   * - 'xl': Extra Large (96px) - for splash/landing pages
   */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /**
   * Show text alongside logo
   */
  showText?: boolean;
  /**
   * Show tagline below text
   */
  showTagline?: boolean;
  /**
   * Link destination (default: '/')
   */
  to?: string;
  /**
   * Custom className
   */
  className?: string;
  /**
   * Click handler (if not using Link)
   */
  onClick?: () => void;
}

const sizeMap = {
  sm: { logo: 32, text: 'text-base', tagline: 'text-[10px]' },
  md: { logo: 48, text: 'text-lg', tagline: 'text-xs' },
  lg: { logo: 64, text: 'text-xl', tagline: 'text-sm' },
  xl: { logo: 96, text: 'text-2xl', tagline: 'text-base' },
};

export const Logo: React.FC<LogoProps> = ({
  size = 'md',
  showText = true,
  showTagline = false,
  to = '/',
  className = '',
  onClick,
}) => {
  const sizes = sizeMap[size];
  const logoSize = sizes.logo;
  
  // Logo image path - uses logo.png from public directory
  const logoImage = '/logo.png'; // Primary logo file (PNG format)
  
  const logoContent = (
    <div
      className={`flex items-center gap-3 group ${className}`}
      onClick={onClick}
    >
      {/* Logo Image */}
      <div
        className="flex-shrink-0 transition-all duration-300 group-hover:scale-105 group-hover:-translate-y-1 group-hover:rotate-3"
        style={{ width: logoSize, height: logoSize }}
      >
        <img
          src={logoImage}
          alt="Panhaha Logo"
          className="w-full h-full object-contain"
          onError={(e) => {
            // Fallback to SVG if PNG fails
            const target = e.target as HTMLImageElement;
            target.src = '/logo.svg';
            target.onerror = () => {
              // Final fallback: show letter "P" in styled box
              target.style.display = 'none';
              const parent = target.parentElement;
              if (parent && !parent.querySelector('.logo-fallback')) {
                const fallback = document.createElement('div');
                fallback.className = 'logo-fallback w-full h-full rounded-2xl flex items-center justify-center text-white font-bold bg-gradient-to-br from-blue-600 to-blue-800 shadow-lg';
                fallback.style.fontSize = `${logoSize * 0.6}px`;
                fallback.textContent = 'P';
                parent.appendChild(fallback);
              }
            };
          }}
        />
      </div>

      {/* Text and Tagline */}
      {showText && (
        <div className="flex flex-col leading-tight">
          <span className={`font-display font-bold bg-gradient-to-r from-primary-500 to-secondary-500 bg-clip-text text-transparent ${sizes.text} group-hover:scale-[1.02] transition-transform duration-300`}>
            Panhaha
          </span>
          {showTagline && (
            <span className={`font-medium text-secondary-500 dark:text-secondary-400 tracking-wide ${sizes.tagline}`}>
              Connect & Book
            </span>
          )}
        </div>
      )}
    </div>
  );

  if (onClick) {
    return <div className="cursor-pointer">{logoContent}</div>;
  }

  return (
    <Link
      to={to}
      onClick={() => {
        // Scroll to top when navigating
        window.scrollTo(0, 0);
      }}
      className="hover:opacity-95 transition-all duration-300"
    >
      {logoContent}
    </Link>
  );
};

// Export icon-only version for compact spaces
export const LogoIcon: React.FC<{ size?: number; className?: string }> = ({
  size = 48,
  className = '',
}) => {
  const logoImage = '/logo.png';
  
  return (
    <div
      className={`flex-shrink-0 transition-all duration-300 hover:scale-105 hover:-translate-y-1 hover:rotate-3 ${className}`}
      style={{ width: size, height: size }}
    >
      <img
        src={logoImage}
        alt="Panhaha"
        className="w-full h-full object-contain"
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          target.src = '/logo.svg';
          target.onerror = () => {
            target.style.display = 'none';
            const parent = target.parentElement;
            if (parent && !parent.querySelector('.logo-fallback')) {
              const fallback = document.createElement('div');
              fallback.className = 'logo-fallback w-full h-full rounded-2xl flex items-center justify-center text-white font-bold bg-gradient-to-br from-blue-600 to-blue-800 shadow-lg';
              fallback.style.fontSize = `${size * 0.6}px`;
              fallback.textContent = 'P';
              parent.appendChild(fallback);
            }
          };
        }}
      />
    </div>
  );
};


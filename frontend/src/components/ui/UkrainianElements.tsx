import React from 'react';

export const UkrainianFlag: React.FC<{ className?: string; animated?: boolean }> = ({ 
  className = '', 
  animated = false 
}) => {
  return (
    <div className={`inline-flex rounded-md overflow-hidden shadow-md ${animated ? 'animate-ukraine-wave' : ''} ${className}`}>
      <div className="w-8 h-5 bg-primary-500"></div>
      <div className="w-8 h-5 bg-secondary-500"></div>
    </div>
  );
};

export const UkrainianTriezub: React.FC<{ className?: string; size?: number }> = ({ 
  className = '', 
  size = 24 
}) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      className={`ukraine-text-gradient ${className}`}
      fill="currentColor"
    >
      <path d="M12 2L8 6h2v4h4V6h2l-4-4zm-2 8v8l2-2 2 2v-8h-4z"/>
    </svg>
  );
};

export const SunflowerIcon: React.FC<{ className?: string; animated?: boolean }> = ({ 
  className = '', 
  animated = false 
}) => {
  return (
    <div className={`inline-block ${animated ? 'animate-spin-slow' : ''} ${className}`}>
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-secondary-500">
        <path d="M12 4a1 1 0 011 1v6a1 1 0 01-2 0V5a1 1 0 011-1zm0 12a2 2 0 100 4 2 2 0 000-4zm8-4a8 8 0 11-16 0 8 8 0 0116 0zm-2 0a6 6 0 10-12 0 6 6 0 0012 0z"/>
      </svg>
    </div>
  );
};

export const UkrainianOrnament: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <svg viewBox="0 0 100 20" className="w-32 h-4 ukraine-text-gradient">
        <pattern id="ukrainian-pattern" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
          <rect width="20" height="20" fill="#3b97f2" opacity="0.1"/>
          <path d="M10 5 L15 10 L10 15 L5 10 Z" fill="#ffc41f" opacity="0.3"/>
        </pattern>
        <rect width="100" height="20" fill="url(#ukrainian-pattern)"/>
        <path d="M10 5 L15 10 L10 15 L5 10 Z M30 5 L35 10 L30 15 L25 10 Z M50 5 L55 10 L50 15 L45 10 Z M70 5 L75 10 L70 15 L65 10 Z M90 5 L95 10 L90 15 L85 10 Z" 
              fill="currentColor" opacity="0.6"/>
      </svg>
    </div>
  );
};

// Floating elements for background decoration
export const FloatingElements: React.FC = () => {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {/* Subtle geometric shapes only - removed sunflowers that might appear as exclamation marks */}
      <div className="absolute top-60 right-1/3 w-12 h-12 ukraine-gradient rounded-full opacity-5 animate-float" 
           style={{ animationDelay: '1s' }}></div>
      <div className="absolute bottom-20 right-10 w-8 h-8 bg-primary-400 rounded-full opacity-8 animate-bounce" 
           style={{ animationDelay: '3s' }}></div>
      <div className="absolute top-96 left-1/3 w-16 h-16 border-2 border-secondary-400 rounded-full opacity-10"></div>
      <div className="absolute bottom-40 left-20 w-6 h-6 bg-secondary-300 rounded-full opacity-6"></div>
    </div>
  );
};
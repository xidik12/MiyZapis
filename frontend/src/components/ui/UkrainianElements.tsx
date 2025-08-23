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
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/>
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
      {/* Floating sunflowers - removed spinning animation to avoid confusion with loading */}
      <div className="absolute top-20 left-10 animate-float">
        <SunflowerIcon className="text-secondary-400 opacity-20" />
      </div>
      <div className="absolute top-40 right-20 animate-float" style={{ animationDelay: '2s' }}>
        <SunflowerIcon className="text-secondary-300 opacity-15" />
      </div>
      <div className="absolute bottom-32 left-1/4 animate-float" style={{ animationDelay: '4s' }}>
        <SunflowerIcon className="text-secondary-500 opacity-10" />
      </div>
      
      {/* Floating geometric shapes - removed pulse animation to avoid confusion with loading */}
      <div className="absolute top-60 right-1/3 w-12 h-12 ukraine-gradient rounded-full opacity-10 animate-float" 
           style={{ animationDelay: '1s' }}></div>
      <div className="absolute bottom-20 right-10 w-8 h-8 bg-primary-400 rounded-full opacity-15 animate-bounce" 
           style={{ animationDelay: '3s' }}></div>
      <div className="absolute top-96 left-1/3 w-16 h-16 border-2 border-secondary-400 rounded-full opacity-20"></div>
    </div>
  );
};
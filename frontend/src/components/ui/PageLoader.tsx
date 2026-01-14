import React from 'react';
import { LoadingAnimation, LoadingAnimationType } from './LoadingAnimation';

interface PageLoaderProps {
  /**
   * Type of loading animation to display
   * @default 'pulse'
   */
  type?: LoadingAnimationType;

  /**
   * Optional loading text to display below animation
   */
  text?: string;

  /**
   * Size of the loader
   * @default 'xl'
   */
  size?: 'sm' | 'md' | 'lg' | 'xl';

  /**
   * Minimum height of the container
   * @default 'min-h-screen'
   */
  minHeight?: string;

  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * PageLoader - Standard loading state for full pages
 * Always centered in the middle of the screen with consistent styling
 *
 * @example
 * ```tsx
 * if (loading) {
 *   return <PageLoader text="Loading dashboard..." />;
 * }
 * ```
 */
export const PageLoader: React.FC<PageLoaderProps> = ({
  type = 'pulse',
  text,
  size = 'xl',
  minHeight = 'min-h-screen',
  className = '',
}) => {
  return (
    <div className={`${minHeight} flex items-center justify-center bg-gray-50 dark:bg-gray-900 ${className}`}>
      <div className="flex flex-col items-center gap-4">
        <LoadingAnimation
          type={type}
          size={size}
          color="primary"
        />
        {text && (
          <p className="text-sm text-gray-600 dark:text-gray-400 font-medium animate-pulse">
            {text}
          </p>
        )}
      </div>
    </div>
  );
};

export default PageLoader;

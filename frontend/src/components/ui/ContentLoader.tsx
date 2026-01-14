import React from 'react';
import { LoadingAnimation, LoadingAnimationType } from './LoadingAnimation';

interface ContentLoaderProps {
  /**
   * Type of loading animation to display
   * @default 'dots'
   */
  type?: LoadingAnimationType;

  /**
   * Optional loading text to display
   */
  text?: string;

  /**
   * Size of the loader
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg' | 'xl';

  /**
   * Minimum height of the container
   * @default '200px'
   */
  minHeight?: string;

  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * ContentLoader - Standard loading state for modals, cards, and content sections
 * Always centered with consistent styling
 *
 * @example
 * ```tsx
 * // In a modal
 * {loading ? (
 *   <ContentLoader text="Loading data..." />
 * ) : (
 *   <YourContent />
 * )}
 *
 * // In a card
 * <div className="card">
 *   {loading ? (
 *     <ContentLoader type="dots" size="lg" />
 *   ) : (
 *     <CardContent />
 *   )}
 * </div>
 * ```
 */
export const ContentLoader: React.FC<ContentLoaderProps> = ({
  type = 'dots',
  text,
  size = 'md',
  minHeight = '200px',
  className = '',
}) => {
  return (
    <div
      className={`flex items-center justify-center ${className}`}
      style={{ minHeight }}
    >
      <LoadingAnimation
        type={type}
        size={size}
        color="primary"
        text={text}
      />
    </div>
  );
};

export default ContentLoader;

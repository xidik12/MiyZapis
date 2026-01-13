import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { LoadingAnimation, LoadingAnimationType } from './LoadingAnimation';
import { InlineLoader } from './InlineLoader';
import { FullScreenLoader } from './FullScreenLoader';

/**
 * LoadingShowcase - Demo component showing all loading animations
 * Use this for development and choosing the right loader for your context
 */
export const LoadingShowcase: React.FC = () => {
  const [showFullScreen, setShowFullScreen] = useState(false);
  const [fullScreenType, setFullScreenType] = useState<LoadingAnimationType>('spinner');
  const [showProgress, setShowProgress] = useState(false);
  const [progress, setProgress] = useState(0);

  const animationTypes: LoadingAnimationType[] = [
    'spinner',
    'sandwatch',
    'magnifying-glass',
    'dots',
    'pulse',
  ];

  const sizes = ['sm', 'md', 'lg', 'xl'] as const;
  const colors = ['primary', 'secondary', 'gray'] as const;

  const handleShowFullScreen = (type: LoadingAnimationType, withProgress: boolean = false) => {
    setFullScreenType(type);
    setShowProgress(withProgress);
    setProgress(0);
    setShowFullScreen(true);

    if (withProgress) {
      // Simulate progress
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            setTimeout(() => setShowFullScreen(false), 500);
            return 100;
          }
          return prev + 10;
        });
      }, 300);
    } else {
      // Auto close after 3 seconds
      setTimeout(() => setShowFullScreen(false), 3000);
    }
  };

  return (
    <div className="p-8 space-y-12 bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          Loading Animations Showcase
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          Explore all available loading animations for the MiyZapis platform
        </p>
      </div>

      {/* Animation Types Grid */}
      <section>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          Animation Types
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {animationTypes.map((type) => (
            <motion.div
              key={type}
              whileHover={{ scale: 1.02 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8"
            >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 capitalize">
                {type.replace('-', ' ')}
              </h3>
              <div className="flex justify-center py-8">
                <LoadingAnimation type={type} size="xl" color="primary" />
              </div>
              <button
                onClick={() => handleShowFullScreen(type)}
                className="w-full mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                Show Full Screen
              </button>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Sizes */}
      <section>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          Sizes (Spinner)
        </h2>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {sizes.map((size) => (
              <div key={size} className="flex flex-col items-center gap-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 uppercase">
                  {size}
                </p>
                <LoadingAnimation type="spinner" size={size} color="primary" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Colors */}
      <section>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          Colors (Pulse)
        </h2>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {colors.map((color) => (
              <div key={color} className="flex flex-col items-center gap-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 capitalize">
                  {color}
                </p>
                <LoadingAnimation type="pulse" size="lg" color={color} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* With Text */}
      <section>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          With Text
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 flex justify-center">
            <LoadingAnimation
              type="magnifying-glass"
              size="lg"
              color="primary"
              text="Searching for specialists..."
            />
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 flex justify-center">
            <LoadingAnimation
              type="sandwatch"
              size="lg"
              color="primary"
              text="Processing your request..."
            />
          </div>
        </div>
      </section>

      {/* Inline Loaders */}
      <section>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          Inline Loaders (For Buttons)
        </h2>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 space-y-4">
          <div className="flex flex-wrap gap-4">
            <button className="px-6 py-3 bg-primary-600 text-white rounded-lg font-medium flex items-center gap-2">
              <InlineLoader size="sm" color="white" />
              Processing...
            </button>
            <button className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg font-medium flex items-center gap-2">
              <InlineLoader size="sm" color="gray" />
              Loading...
            </button>
            <button className="px-6 py-3 border-2 border-primary-600 text-primary-600 dark:text-primary-400 rounded-lg font-medium flex items-center gap-2">
              <InlineLoader size="sm" color="primary" />
              Submitting...
            </button>
          </div>
        </div>
      </section>

      {/* Full Screen Examples */}
      <section>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          Full Screen Loaders
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <button
            onClick={() => handleShowFullScreen('spinner')}
            className="px-6 py-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Show Spinner
          </button>
          <button
            onClick={() => handleShowFullScreen('pulse')}
            className="px-6 py-4 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors"
          >
            Show Pulse
          </button>
          <button
            onClick={() => handleShowFullScreen('magnifying-glass')}
            className="px-6 py-4 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
          >
            Show Search
          </button>
          <button
            onClick={() => handleShowFullScreen('sandwatch', true)}
            className="px-6 py-4 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 transition-colors"
          >
            Show Sandwatch (Progress)
          </button>
          <button
            onClick={() => handleShowFullScreen('dots')}
            className="px-6 py-4 bg-pink-600 text-white rounded-lg font-medium hover:bg-pink-700 transition-colors"
          >
            Show Dots
          </button>
        </div>
      </section>

      {/* Use Case Examples */}
      <section>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          Use Case Examples
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
              🔍 Search Results
            </h3>
            <div className="h-40 flex items-center justify-center">
              <LoadingAnimation
                type="magnifying-glass"
                size="lg"
                color="primary"
                text="Searching..."
              />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
              ⏳ File Upload
            </h3>
            <div className="h-40 flex items-center justify-center">
              <LoadingAnimation
                type="sandwatch"
                size="lg"
                color="primary"
                text="Uploading..."
              />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
              💫 Background Sync
            </h3>
            <div className="h-40 flex items-center justify-center">
              <LoadingAnimation
                type="pulse"
                size="md"
                color="secondary"
                text="Syncing..."
              />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
              📋 Loading List
            </h3>
            <div className="h-40 flex items-center justify-center">
              <LoadingAnimation
                type="dots"
                size="md"
                color="primary"
                text="Loading data..."
              />
            </div>
          </div>
        </div>
      </section>

      {/* Code Examples */}
      <section>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          Quick Code Examples
        </h2>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 space-y-4">
          <div>
            <p className="text-sm font-mono text-gray-600 dark:text-gray-400 mb-2">
              {`<LoadingAnimation type="spinner" size="lg" color="primary" />`}
            </p>
          </div>
          <div>
            <p className="text-sm font-mono text-gray-600 dark:text-gray-400 mb-2">
              {`<LoadingAnimation type="magnifying-glass" size="xl" text="Searching..." />`}
            </p>
          </div>
          <div>
            <p className="text-sm font-mono text-gray-600 dark:text-gray-400 mb-2">
              {`<InlineLoader size="sm" color="white" />`}
            </p>
          </div>
          <div>
            <p className="text-sm font-mono text-gray-600 dark:text-gray-400 mb-2">
              {`<FullScreenLoader isOpen={true} title="Loading" animationType="pulse" />`}
            </p>
          </div>
        </div>
      </section>

      {/* Full Screen Loader */}
      <FullScreenLoader
        isOpen={showFullScreen}
        title="Example Loading Screen"
        subtitle="This is how it looks in production"
        animationType={fullScreenType}
        showProgress={showProgress}
        progress={progress}
      />
    </div>
  );
};

export default LoadingShowcase;

import React from 'react';
import { useAppSelector } from '@/hooks/redux';
import { messagingStrings, commonStrings } from '@/utils/translations';

export const MessagingPage: React.FC = () => {
  const { language } = useAppSelector((state) => state.settings);

  return (
    <div className="flex h-screen bg-bg-primary items-center justify-center">
      <div className="max-w-md w-full p-8 text-center">
        {/* Icon */}
        <div className="mb-6">
          <svg
            className="w-24 h-24 mx-auto text-accent-primary/50"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-text-primary mb-4">
          {messagingStrings.title[language]}
        </h2>

        {/* Subtitle */}
        <p className="text-text-secondary mb-2">
          {commonStrings.comingSoon[language]}
        </p>

        {/* Description */}
        <p className="text-sm text-text-secondary/70">
          {messagingStrings.startMessaging[language]}
        </p>

        {/* Decorative elements */}
        <div className="mt-8 flex justify-center space-x-2">
          <div className="w-2 h-2 bg-accent-primary/30 rounded-full animate-pulse"></div>
          <div className="w-2 h-2 bg-accent-primary/30 rounded-full animate-pulse delay-75"></div>
          <div className="w-2 h-2 bg-accent-primary/30 rounded-full animate-pulse delay-150"></div>
        </div>
      </div>
    </div>
  );
};

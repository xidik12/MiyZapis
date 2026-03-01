import React, { useState } from 'react';
import { userService } from '@/services/user.service';
import { useLanguage } from '@/contexts/LanguageContext';

interface TelegramLinkWidgetProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

const TelegramLinkWidget: React.FC<TelegramLinkWidgetProps> = ({ onSuccess, onError }) => {
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);
  const [linkData, setLinkData] = useState<{ code: string; deepLink: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleGenerateLink = async () => {
    setIsLoading(true);
    setError(null);
    setLinkData(null);

    try {
      const result = await userService.generateTelegramLinkCode();
      setLinkData({ code: result.code, deepLink: result.deepLink });
    } catch (err: unknown) {
      const err = err instanceof Error ? err : new Error(String(err));
      const msg = err.message || 'Failed to generate link code';
      // If already linked, treat as success — refresh profile to show connected status
      if (msg.includes('already linked')) {
        onSuccess?.();
        return;
      }
      setError(msg);
      onError?.(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!linkData) return;
    try {
      await navigator.clipboard.writeText(linkData.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const input = document.createElement('input');
      input.value = linkData.code;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (linkData) {
    return (
      <div className="w-full space-y-4">
        {/* Step 1: Open bot */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('telegram.link.instructions')}</p>
          <a
            href={linkData.deepLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 py-2.5 px-5 bg-[#54a9eb] hover:bg-[#4a96d2] text-white text-sm font-medium rounded-xl transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
            </svg>
            Open @MiyZapis_Bot
          </a>
        </div>

        {/* Step 2: Send the code */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('telegram.link.benefits')}</p>
          <div className="flex items-center gap-2">
            <code className="px-4 py-2.5 bg-gray-100 dark:bg-gray-700 text-lg font-mono font-bold tracking-wider rounded-xl text-gray-900 dark:text-white select-all">
              {linkData.code}
            </code>
            <button
              onClick={handleCopy}
              className="px-3 py-2.5 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 rounded-xl text-sm transition-colors"
            >
              {copied ? t('telegram.link.success') : t('telegram.link.connect')}
            </button>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Paste this code in the bot chat. Expires in 5 minutes.
          </p>
        </div>

        {/* Done / Retry */}
        <div className="flex items-center gap-4 pt-1">
          <button
            onClick={() => {
              setLinkData(null);
              onSuccess?.();
            }}
            className="text-sm text-primary-600 dark:text-primary-400 hover:underline font-medium"
          >
            {t('telegram.link.connected')}
          </button>
          <button
            onClick={handleGenerateLink}
            className="text-sm text-gray-500 dark:text-gray-400 hover:underline"
          >
            {t('telegram.link.disconnect')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {error && (
        <p className="text-xs text-red-500 mb-2">{error}</p>
      )}
      <button
        onClick={handleGenerateLink}
        disabled={isLoading}
        className="inline-flex items-center gap-2 py-2 px-4 bg-[#54a9eb] hover:bg-[#4a96d2] disabled:opacity-50 text-white text-sm font-medium rounded-xl transition-colors"
      >
        {isLoading ? (
          <>
            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            {t('telegram.link.subtitle')}
          </>
        ) : (
          <>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
            </svg>
            {t('telegram.link.title')}
          </>
        )}
      </button>
    </div>
  );
};

export default TelegramLinkWidget;

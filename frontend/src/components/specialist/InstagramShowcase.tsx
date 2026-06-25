import React, { useEffect, useRef } from 'react';

declare global {
  interface Window {
    instgrm?: {
      Embeds: {
        process: () => void;
      };
    };
  }
}

interface InstagramShowcaseProps {
  handle: string;
  profileUrl: string | null;
  posts: string[];
}

const InstagramIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
  </svg>
);

const InstagramShowcase: React.FC<InstagramShowcaseProps> = ({ handle, profileUrl, posts }) => {
  const scriptLoadedRef = useRef(false);

  useEffect(() => {
    if (posts.length === 0) return;

    const processEmbeds = () => {
      if (window.instgrm?.Embeds?.process) {
        window.instgrm.Embeds.process();
      }
    };

    // If the script is already on the page, just reprocess
    if (document.querySelector('script[src*="instagram.com/embed.js"]')) {
      processEmbeds();
      return;
    }

    if (scriptLoadedRef.current) return;
    scriptLoadedRef.current = true;

    const script = document.createElement('script');
    script.src = 'https://www.instagram.com/embed.js';
    script.async = true;
    script.defer = true;
    script.onload = processEmbeds;
    document.body.appendChild(script);

    return () => {
      // Don't remove the script — it's global and may be used elsewhere
    };
  }, [posts]);

  // Re-process whenever the post list changes
  useEffect(() => {
    if (posts.length === 0) return;
    const timer = setTimeout(() => {
      if (window.instgrm?.Embeds?.process) {
        window.instgrm.Embeds.process();
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [posts.join(',')]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 sm:mb-6">
        <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <InstagramIcon className="h-5 w-5 sm:h-6 sm:w-6 text-pink-500 flex-shrink-0" />
          Instagram
          {handle && (
            <span className="text-base font-normal text-gray-500 dark:text-gray-400">
              @{handle}
            </span>
          )}
        </h2>

        {profileUrl && (
          <a
            href={profileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-500 via-pink-500 to-orange-400 text-white text-sm font-semibold hover:opacity-90 active:scale-[0.97] transition-all duration-150 self-start sm:self-auto flex-shrink-0"
          >
            <InstagramIcon className="h-4 w-4" />
            {'Follow on Instagram'}
          </a>
        )}
      </div>

      {/* Embeds grid */}
      {posts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 overflow-hidden">{/* overflow-hidden guards against Instagram iframe width leaking */}
          {posts.map((url, idx) => (
            <div key={idx} className="flex justify-center overflow-hidden min-w-0">
              <blockquote
                className="instagram-media"
                data-instgrm-permalink={url}
                data-instgrm-version="14"
                style={{
                  background: '#FFF',
                  border: '0',
                  borderRadius: '3px',
                  boxShadow: '0 0 1px 0 rgba(0,0,0,0.5),0 1px 10px 0 rgba(0,0,0,0.15)',
                  margin: '0',
                  maxWidth: '100%', // was '540px' — keeps embed within column width
                  minWidth: '0',    // was '326px' — that literal value causes horizontal scroll on 320px screens
                  padding: '0',
                  width: '100%',
                }}
              >
                {/* Graceful fallback when embed.js is blocked */}
                <div style={{ padding: '16px' }}>
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-pink-500 text-sm hover:underline break-all"
                  >
                    {url}
                  </a>
                </div>
              </blockquote>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
};

export default InstagramShowcase;

import React, { useState, useRef, useEffect } from 'react';
import { MagnifyingGlassIcon } from '@/components/icons';
import { APP_CONSTANTS } from '@/config/environment';

interface SearchBarProps {
  placeholder?: string;
  defaultValue?: string;
  onSearch: (query: string) => void;
  className?: string;
  autoFocus?: boolean;
  /**
   * Enable auto-search with debouncing (default: false)
   * When true, searches automatically as user types (debounced)
   * When false, only searches on form submit
   */
  enableAutoSearch?: boolean;
  /**
   * Custom debounce delay in milliseconds
   * Only applies when enableAutoSearch is true
   */
  debounceMs?: number;
}

export const SearchBar: React.FC<SearchBarProps> = React.memo(({
  placeholder = "Search...",
  defaultValue = "",
  onSearch,
  className = "",
  autoFocus = false,
  enableAutoSearch = false,
  debounceMs = APP_CONSTANTS.SEARCH_DEBOUNCE_MS,
}) => {
  const [query, setQuery] = useState(defaultValue);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim());
    }
  };

  // Auto-search with debouncing (only if enabled)
  useEffect(() => {
    if (!enableAutoSearch) return;

    const timer = setTimeout(() => {
      if (query.trim()) {
        onSearch(query.trim());
      }
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [query, enableAutoSearch, debounceMs, onSearch]);

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  return (
    <form onSubmit={handleSubmit} className={`relative ${className}`}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-10 pr-4 py-3 sm:py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-base sm:text-sm transition-all duration-200"
        />
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
      </div>
    </form>
  );
});

SearchBar.displayName = 'SearchBar';
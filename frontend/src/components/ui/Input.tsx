import React from 'react';
import { clsx } from 'clsx';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  rightSlot?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({ label, error, hint, rightSlot, className, ...props }) => {
  return (
    <label className="block">
      {label && (
        <span className="mb-1 block text-sm font-semibold text-gray-700 dark:text-gray-300">{label}</span>
      )}
      <div className="relative">
        <input
          className={clsx(
            'input w-full rounded-xl border bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500',
            'border-gray-200 dark:border-gray-800 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/30 focus:ring-offset-0',
            'transition-colors duration-150',
            error && 'border-error-500 focus:ring-error-500/30 focus:border-error-500',
            className
          )}
          style={{ height: 'var(--control-h-md)', padding: 'var(--control-py) var(--control-px)' }}
          {...props}
        />
        {rightSlot && <div className="absolute inset-y-0 right-2 flex items-center text-gray-500">{rightSlot}</div>}
      </div>
      {error ? (
        <p className="mt-1 text-xs text-red-600">{error}</p>
      ) : hint ? (
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{hint}</p>
      ) : null}
    </label>
  );
};

export default Input;

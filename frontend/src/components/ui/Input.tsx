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
        <span className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>
      )}
      <div className="relative">
        <input
          className={clsx(
            'input w-full rounded-lg border bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400',
            'border-gray-300 dark:border-gray-600 focus:border-primary-500 focus:ring-2 focus:ring-primary-500 focus:ring-offset-0',
            error && 'border-red-500 focus:ring-red-500 focus:border-red-500',
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

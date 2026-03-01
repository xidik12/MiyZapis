import { useState, useCallback, ChangeEvent } from 'react';
import {
  sanitizeText,
  sanitizeHTML,
  sanitizeEmail,
  sanitizePhone,
  sanitizeURL,
  sanitizeSearchQuery,
  sanitizeNumber,
  containsDangerousContent,
} from '@/utils/sanitization';

/**
 * Hook for safely handling user input with automatic sanitization
 * Prevents XSS attacks by sanitizing input on change
 */

export type SanitizationType = 'text' | 'html' | 'email' | 'phone' | 'url' | 'search' | 'number';

interface UseSafeInputOptions {
  type?: SanitizationType;
  maxLength?: number;
  onDangerousContent?: (value: string) => void;
  transform?: (value: string) => string;
}

/**
 * Hook for safe text input with automatic sanitization
 */
export const useSafeInput = (initialValue: string = '', options: UseSafeInputOptions = {}) => {
  const { type = 'text', maxLength, onDangerousContent, transform } = options;
  const [value, setValue] = useState(initialValue);
  const [isDangerous, setIsDangerous] = useState(false);

  const sanitize = useCallback((rawValue: string): string => {
    let sanitized = rawValue;

    // Apply type-specific sanitization
    switch (type) {
      case 'html':
        sanitized = sanitizeHTML(rawValue);
        break;
      case 'email':
        sanitized = sanitizeEmail(rawValue);
        break;
      case 'phone':
        sanitized = sanitizePhone(rawValue);
        break;
      case 'url':
        sanitized = sanitizeURL(rawValue);
        break;
      case 'search':
        sanitized = sanitizeSearchQuery(rawValue);
        break;
      case 'number':
        sanitized = rawValue.replace(/[^\d.-]/g, '');
        break;
      case 'text':
      default:
        sanitized = sanitizeText(rawValue);
        break;
    }

    // Apply custom transform if provided
    if (transform) {
      sanitized = transform(sanitized);
    }

    // Apply max length
    if (maxLength && sanitized.length > maxLength) {
      sanitized = sanitized.substring(0, maxLength);
    }

    return sanitized;
  }, [type, maxLength, transform]);

  const handleChange = useCallback((
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const rawValue = e.target.value;

    // Check for dangerous content
    const dangerous = containsDangerousContent(rawValue);
    setIsDangerous(dangerous);

    if (dangerous && onDangerousContent) {
      onDangerousContent(rawValue);
    }

    // Sanitize and update
    const sanitized = sanitize(rawValue);
    setValue(sanitized);
  }, [sanitize, onDangerousContent]);

  const reset = useCallback(() => {
    setValue(initialValue);
    setIsDangerous(false);
  }, [initialValue]);

  return {
    value,
    onChange: handleChange,
    isDangerous,
    reset,
    setValue: (newValue: string) => setValue(sanitize(newValue)),
  };
};

/**
 * Hook for safe number input
 */
export const useSafeNumber = (
  initialValue: number = 0,
  options: { min?: number; max?: number; decimals?: number } = {}
) => {
  const { min, max, decimals = 0 } = options;
  const [value, setValue] = useState(initialValue);

  const handleChange = useCallback((
    e: ChangeEvent<HTMLInputElement>
  ) => {
    const rawValue = e.target.value;
    const num = sanitizeNumber(rawValue, initialValue);

    let sanitized = num;

    // Apply min/max constraints
    if (min !== undefined && sanitized < min) {
      sanitized = min;
    }
    if (max !== undefined && sanitized > max) {
      sanitized = max;
    }

    // Apply decimal places
    if (decimals === 0) {
      sanitized = Math.round(sanitized);
    } else {
      sanitized = parseFloat(sanitized.toFixed(decimals));
    }

    setValue(sanitized);
  }, [min, max, decimals, initialValue]);

  return {
    value,
    onChange: handleChange,
    setValue: (newValue: number) => {
      let sanitized = newValue;
      if (min !== undefined && sanitized < min) sanitized = min;
      if (max !== undefined && sanitized > max) sanitized = max;
      if (decimals === 0) {
        sanitized = Math.round(sanitized);
      } else {
        sanitized = parseFloat(sanitized.toFixed(decimals));
      }
      setValue(sanitized);
    },
  };
};

/**
 * Hook for safe form with multiple sanitized inputs
 */
export const useSafeForm = <T extends Record<string, any>>(
  initialValues: T,
  sanitizers: Partial<Record<keyof T, (value: unknown) => any>> = {}
) => {
  const [values, setValues] = useState<T>(initialValues);
  const [dangerousFields, setDangerousFields] = useState<Set<keyof T>>(new Set());

  const handleChange = useCallback((field: keyof T) => (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const rawValue = e.target.value;

    // Check for dangerous content in string fields
    if (typeof rawValue === 'string' && containsDangerousContent(rawValue)) {
      setDangerousFields(prev => new Set(prev).add(field));
    } else {
      setDangerousFields(prev => {
        const next = new Set(prev);
        next.delete(field);
        return next;
      });
    }

    // Apply field-specific sanitizer or default to text sanitization
    const sanitizer = sanitizers[field] || sanitizeText;
    const sanitized = sanitizer(rawValue);

    setValues(prev => ({
      ...prev,
      [field]: sanitized,
    }));
  }, [sanitizers]);

  const setValue = useCallback((field: keyof T, value: unknown) => {
    const sanitizer = sanitizers[field] || ((v: unknown) => v);
    const sanitized = sanitizer(value);

    setValues(prev => ({
      ...prev,
      [field]: sanitized,
    }));
  }, [sanitizers]);

  const reset = useCallback(() => {
    setValues(initialValues);
    setDangerousFields(new Set());
  }, [initialValues]);

  return {
    values,
    handleChange,
    setValue,
    dangerousFields,
    isDangerous: (field: keyof T) => dangerousFields.has(field),
    reset,
  };
};

/**
 * Hook for safe file input
 */
export const useSafeFileInput = (
  options: {
    maxSize?: number; // in bytes
    allowedTypes?: string[];
    onError?: (error: string) => void;
  } = {}
) => {
  const { maxSize = 5 * 1024 * 1024, allowedTypes = [], onError } = options;
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];

    if (!selectedFile) {
      setFile(null);
      setError(null);
      return;
    }

    // Validate file size
    if (selectedFile.size > maxSize) {
      const errorMsg = `File size (${(selectedFile.size / 1024 / 1024).toFixed(2)}MB) exceeds maximum (${(maxSize / 1024 / 1024).toFixed(2)}MB)`;
      setError(errorMsg);
      if (onError) onError(errorMsg);
      setFile(null);
      return;
    }

    // Validate file type
    if (allowedTypes.length > 0 && !allowedTypes.includes(selectedFile.type)) {
      const errorMsg = `File type ${selectedFile.type} not allowed. Allowed: ${allowedTypes.join(', ')}`;
      setError(errorMsg);
      if (onError) onError(errorMsg);
      setFile(null);
      return;
    }

    // Check filename for dangerous patterns
    const dangerousPatterns = [/\.\./, /\.exe$/, /\.bat$/, /\.sh$/, /\.php$/];
    if (dangerousPatterns.some(pattern => pattern.test(selectedFile.name))) {
      const errorMsg = 'Filename contains dangerous patterns';
      setError(errorMsg);
      if (onError) onError(errorMsg);
      setFile(null);
      return;
    }

    setFile(selectedFile);
    setError(null);
  }, [maxSize, allowedTypes, onError]);

  const reset = useCallback(() => {
    setFile(null);
    setError(null);
  }, []);

  return {
    file,
    error,
    onChange: handleChange,
    reset,
  };
};

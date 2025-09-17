import React, { useState, useMemo } from 'react';
import { SERVICE_CATEGORIES, getCategoryName, getAllCategories } from '../../data/serviceCategories';
import { useLanguage } from '../../contexts/LanguageContext';

interface CategoryDropdownProps {
  value: string;
  onChange: (value: string) => void;
  onCustomCategory: (customValue: string) => void;
  placeholder?: string;
  error?: string;
  className?: string;
  allowCustom?: boolean;
}

export const CategoryDropdown: React.FC<CategoryDropdownProps> = ({
  value,
  onChange,
  onCustomCategory,
  placeholder = 'Select a category',
  error,
  className = '',
  allowCustom = true
}) => {
  const { language, t } = useLanguage();
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customValue, setCustomValue] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const allCategories = useMemo(() => getAllCategories(), []);
  
  const filteredCategories = useMemo(() => {
    if (!searchTerm) return allCategories;
    
    return allCategories.filter(category => {
      const name = getCategoryName(category.id, language as 'en' | 'uk' | 'ru').toLowerCase();
      return name.includes(searchTerm.toLowerCase());
    });
  }, [allCategories, searchTerm, language]);

  const handleSelectCategory = (categoryId: string) => {
    if (categoryId === 'custom') {
      setShowCustomInput(true);
      setCustomValue('');
    } else {
      setShowCustomInput(false);
      setCustomValue('');
      onChange(categoryId);
    }
  };

  const handleCustomSubmit = () => {
    if (customValue.trim()) {
      console.log('🏷️ Submitting custom category:', customValue.trim());
      onCustomCategory(customValue.trim());
      setShowCustomInput(false);
      setCustomValue('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && customValue.trim()) {
      e.preventDefault();
      handleCustomSubmit();
    }
  };

  // Check if the value is a known category ID or a custom category string
  const isKnownCategory = allCategories.some(cat => cat.id === value);
  const selectedCategoryName = isKnownCategory
    ? getCategoryName(value, language as 'en' | 'uk' | 'ru')
    : value; // For custom categories, show the value directly
  const placeholderLabel = t('serviceForm.selectCategory') || placeholder || 'Select a category';

  return (
    <div className="relative">
      {!showCustomInput ? (
        <div className="relative">
          <select
            value={isKnownCategory ? value : ''}
            onChange={(e) => handleSelectCategory(e.target.value)}
            className={`w-full px-4 py-3 rounded-xl border ${
              error ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
            } focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 dark:bg-gray-700 dark:text-white appearance-none ${className}`}
          >
            <option value="">
              {value && !isKnownCategory ? `✨ ${value} (Custom)` : placeholderLabel}
            </option>
            
            {/* Main Categories */}
            {SERVICE_CATEGORIES.map((category) => (
              <optgroup key={category.id} label={getCategoryName(category.id, language as 'en' | 'uk' | 'ru')}>
                <option value={category.id}>
                  {getCategoryName(category.id, language as 'en' | 'uk' | 'ru')}
                </option>
                {category.subcategories?.map((subcategory) => (
                  <option key={subcategory.id} value={subcategory.id}>
                    ↳ {getCategoryName(subcategory.id, language as 'en' | 'uk' | 'ru')}
                  </option>
                ))}
              </optgroup>
            ))}
            
            {allowCustom && (
              <option value="custom" className="font-semibold text-primary-600">
                + {t('serviceForm.addCustomCategory') || '+ Add Custom Category'}
              </option>
            )}
          </select>
          
          {/* Custom dropdown arrow or edit button for custom categories */}
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            {value && !isKnownCategory ? (
              <button
                type="button"
                onClick={() => {
                  setShowCustomInput(true);
                  setCustomValue(value);
                }}
                className="text-primary-600 hover:text-primary-700 transition-colors duration-200"
                title={t('common.edit') || 'Edit custom category'}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
            ) : (
              <svg className="w-5 h-5 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={customValue}
              onChange={(e) => setCustomValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={t('serviceForm.enterCustomCategory') || 'Enter custom category name'}
              className="flex-1 px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 dark:bg-gray-700 dark:text-white"
              autoFocus
            />
            <button
              type="button"
              onClick={handleCustomSubmit}
              disabled={!customValue.trim()}
              className="px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              {t('common.add') || 'Add'}
            </button>
          </div>
          <button
            type="button"
            onClick={() => {
              setShowCustomInput(false);
              setCustomValue('');
            }}
            className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            ← {t('common.back') || 'Back to categories'}
          </button>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t('serviceForm.customCategoryHint') || 'This will create a new category for your service'}
          </p>
        </div>
      )}
      
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
      
      {/* Category suggestions when typing */}
      {searchTerm && filteredCategories.length > 0 && !showCustomInput && (
        <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl shadow-lg max-h-48 overflow-y-auto">
          {filteredCategories.slice(0, 10).map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() => onChange(category.id)}
              className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-white"
            >
              {getCategoryName(category.id, language as 'en' | 'uk' | 'ru')}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

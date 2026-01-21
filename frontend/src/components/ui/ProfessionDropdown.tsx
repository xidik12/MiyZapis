import React, { useState, useMemo } from 'react';
import { PROFESSIONS, getProfessionName, getProfessionsByCategory, searchProfessions } from '../../data/professions';
import { useLanguage } from '../../contexts/LanguageContext';

interface ProfessionDropdownProps {
  value: string;
  onChange: (value: string) => void;
  onCustomProfession: (customValue: string) => void;
  placeholder?: string;
  error?: string;
  className?: string;
  allowCustom?: boolean;
  category?: string;
}

export const ProfessionDropdown: React.FC<ProfessionDropdownProps> = ({
  value,
  onChange,
  onCustomProfession,
  placeholder = 'Select a profession',
  error,
  className = '',
  allowCustom = true,
  category
}) => {
  const { language, t } = useLanguage();
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customValue, setCustomValue] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  const availableProfessions = useMemo(() => {
    if (category) {
      return getProfessionsByCategory(category);
    }
    return PROFESSIONS;
  }, [category]);

  // Check if current value is a custom profession (not in predefined list)
  const isCustomProfession = useMemo(() => {
    if (!value) return false;
    return !availableProfessions.find(prof => prof.id === value);
  }, [value, availableProfessions]);

  const filteredProfessions = useMemo(() => {
    if (!searchTerm) return availableProfessions;
    return searchProfessions(searchTerm, language as 'en' | 'kh' | 'uk' | 'ru');
  }, [availableProfessions, searchTerm, language]);

  // Group professions by category for better organization
  const groupedProfessions = useMemo(() => {
    const groups: { [key: string]: typeof PROFESSIONS } = {};
    filteredProfessions.forEach(profession => {
      if (!groups[profession.category]) {
        groups[profession.category] = [];
      }
      groups[profession.category].push(profession);
    });
    return groups;
  }, [filteredProfessions]);

  const handleSelectProfession = (professionId: string) => {
    if (professionId === 'custom') {
      setShowCustomInput(true);
      setCustomValue('');
    } else if (professionId === 'search') {
      setShowSearch(true);
    } else {
      setShowCustomInput(false);
      setShowSearch(false);
      setCustomValue('');
      onChange(professionId);
    }
  };

  const handleCustomSubmit = () => {
    if (customValue.trim()) {
      onCustomProfession(customValue.trim());
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

  const selectedProfessionName = value ? getProfessionName(value, language as 'en' | 'kh' | 'uk' | 'ru') : '';
  const placeholderLabel = t('professionForm.selectProfession') || placeholder || 'Select a profession';

  const getCategoryDisplayName = (categoryId: string) => {
    const categoryNames = {
      'beauty-wellness': { en: 'Beauty & Wellness', kh: 'សម្រស់ និងសុខភាព', uk: 'Краса та Здоров\'я', ru: 'Красота и Здоровье' },
      'health-medical': { en: 'Health & Medical', kh: 'សុខភាព និងវេជ្ជសាស្ត្រ', uk: 'Здоров\'я та Медицина', ru: 'Здоровье и Медицина' },
      'fitness-sports': { en: 'Fitness & Sports', kh: 'ហាត់ប្រាណ និងកីឡា', uk: 'Фітнес та Спорт', ru: 'Фитнес и Спорт' },
      'education-tutoring': { en: 'Education & Tutoring', kh: 'អប់រំ និងបង្រៀន', uk: 'Освіта та Репетиторство', ru: 'Образование и Репетиторство' },
      'home-services': { en: 'Home Services', kh: 'សេវាកម្មតាមផ្ទះ', uk: 'Домашні послуги', ru: 'Домашние услуги' },
      'automotive': { en: 'Automotive', kh: 'សេវាកម្មយានយន្ត', uk: 'Автомобільні послуги', ru: 'Автомобильные услуги' },
      'technology-it': { en: 'Technology & IT', kh: 'បច្ចេកវិទ្យា និងអាយធី', uk: 'Технології та IT', ru: 'Технологии и IT' },
      'creative-arts': { en: 'Creative Arts', kh: 'សិល្បៈច្នៃប្រឌិត', uk: 'Творчі мистецтва', ru: 'Творческие искусства' },
      'business-professional': { en: 'Business & Professional', kh: 'អាជីវកម្ម និងវិជ្ជាជីវៈ', uk: 'Бізнес та Професійні послуги', ru: 'Бизнес и Профессиональные услуги' },
      'events-entertainment': { en: 'Events & Entertainment', kh: 'ព្រឹត្តិការណ៍ និងកម្សាន្ត', uk: 'Події та Розваги', ru: 'События и Развлечения' },
      'pet-services': { en: 'Pet Services', kh: 'សេវាកម្មសត្វចិញ្ចឹម', uk: 'Послуги для тварин', ru: 'Услуги для животных' }
    };
    
    const categoryName = categoryNames[categoryId as keyof typeof categoryNames];
    if (!categoryName) return categoryId;
    
    switch (language) {
      case 'kh': return categoryName.kh;
      case 'uk': return categoryName.uk;
      case 'ru': return categoryName.ru;
      default: return categoryName.en;
    }
  };

  if (showSearch) {
    return (
      <div className="space-y-3">
        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t('professionForm.searchProfessions') || 'Search professions...'}
            className="w-full px-4 py-3 pl-10 rounded-xl border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 dark:bg-gray-700 dark:text-white"
            autoFocus
          />
          <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        
        {searchTerm && filteredProfessions.length > 0 && (
          <div className="max-h-64 overflow-y-auto border border-gray-200 dark:border-gray-600 rounded-xl">
            {filteredProfessions.map((profession) => (
              <button
                key={profession.id}
                type="button"
                onClick={() => handleSelectProfession(profession.id)}
                className="w-full text-left px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-700 last:border-b-0"
              >
                <div className="font-medium">
                  {getProfessionName(profession.id, language as 'en' | 'kh' | 'uk' | 'ru')}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {getCategoryDisplayName(profession.category)}
                </div>
              </button>
            ))}
          </div>
        )}
        
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              setShowSearch(false);
              setSearchTerm('');
            }}
            className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            ← {t('common.back') || 'Back to selection'}
          </button>
          {allowCustom && (
            <button
              type="button"
              onClick={() => {
                setShowSearch(false);
                setShowCustomInput(true);
              }}
              className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400"
            >
              {t('professionForm.addCustomProfession') || '+ Add custom profession'}
            </button>
          )}
        </div>
      </div>
    );
  }

  if (showCustomInput) {
    return (
      <div className="space-y-3">
        <div className="flex gap-2">
          <input
            type="text"
            value={customValue}
            onChange={(e) => setCustomValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={t('professionForm.enterCustomProfession') || 'Enter custom profession'}
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
          ← {t('common.back') || 'Back to professions'}
        </button>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {t('professionForm.customProfessionHint') || 'This will be saved as your custom profession'}
        </p>
      </div>
    );
  }

  return (
    <div className="relative">
          <select
            value={value}
            onChange={(e) => handleSelectProfession(e.target.value)}
            className={`w-full px-4 py-3 rounded-xl border ${
              error ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
            } focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 dark:bg-gray-700 dark:text-white appearance-none ${className}`}
          >
            <option value="">
              {placeholderLabel}
            </option>
        
        {/* Show current custom profession if it exists */}
        {isCustomProfession && (
          <option value={value} selected>
            {value} (Custom)
          </option>
        )}

        <option value="search" className="font-semibold text-primary-600">
          🔍 {t('professionForm.searchProfessions') || '🔍 Search professions...'}
        </option>

        {/* Group professions by category */}
        {Object.entries(groupedProfessions).map(([categoryId, professions]) => (
          <optgroup key={categoryId} label={getCategoryDisplayName(categoryId)}>
            {professions.map((profession) => (
              <option key={profession.id} value={profession.id}>
                {getProfessionName(profession.id, language as 'en' | 'kh' | 'uk' | 'ru')}
              </option>
            ))}
          </optgroup>
        ))}

        {allowCustom && (
          <option value="custom" className="font-semibold text-primary-600">
            + {t('professionForm.addCustomProfession') || '+ Add Custom Profession'}
          </option>
        )}
      </select>
      
      {/* Custom dropdown arrow */}
      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
      
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  );
};

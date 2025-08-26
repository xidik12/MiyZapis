import React, { useState, useMemo } from 'react';
import { SPECIALTIES, getSpecialtyName, getSpecialtiesByCategory, getSpecialtiesByProfession, searchSpecialties } from '../../data/specialties';
import { useLanguage } from '../../contexts/LanguageContext';

interface SpecialtyDropdownProps {
  value: string[];
  onChange: (values: string[]) => void;
  onCustomSpecialty: (customValue: string) => void;
  placeholder?: string;
  error?: string;
  className?: string;
  allowCustom?: boolean;
  category?: string;
  profession?: string;
  maxSelections?: number;
}

export const SpecialtyDropdown: React.FC<SpecialtyDropdownProps> = ({
  value = [],
  onChange,
  onCustomSpecialty,
  placeholder = 'Select specialties',
  error,
  className = '',
  allowCustom = true,
  category,
  profession,
  maxSelections = 10
}) => {
  const { language, t } = useLanguage();
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customValue, setCustomValue] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const availableSpecialties = useMemo(() => {
    if (profession) {
      return getSpecialtiesByProfession(profession);
    }
    if (category) {
      return getSpecialtiesByCategory(category);
    }
    return SPECIALTIES;
  }, [category, profession]);

  const filteredSpecialties = useMemo(() => {
    if (!searchTerm) return availableSpecialties;
    return searchSpecialties(searchTerm, language as 'en' | 'uk' | 'ru');
  }, [availableSpecialties, searchTerm, language]);

  // Group specialties by category for better organization
  const groupedSpecialties = useMemo(() => {
    const groups: { [key: string]: typeof SPECIALTIES } = {};
    filteredSpecialties.forEach(specialty => {
      if (!groups[specialty.category]) {
        groups[specialty.category] = [];
      }
      groups[specialty.category].push(specialty);
    });
    return groups;
  }, [filteredSpecialties]);

  const toggleSpecialty = (specialtyId: string) => {
    if (specialtyId === 'custom') {
      setShowCustomInput(true);
      setCustomValue('');
      setIsOpen(false);
      return;
    }

    if (specialtyId === 'search') {
      setShowSearch(true);
      setIsOpen(false);
      return;
    }

    const newValue = value.includes(specialtyId)
      ? value.filter(id => id !== specialtyId)
      : value.length < maxSelections
        ? [...value, specialtyId]
        : value;
    
    onChange(newValue);
  };

  const removeSpecialty = (specialtyId: string) => {
    onChange(value.filter(id => id !== specialtyId));
  };

  const handleCustomSubmit = () => {
    if (customValue.trim() && !value.includes(customValue.trim()) && value.length < maxSelections) {
      onCustomSpecialty(customValue.trim());
      onChange([...value, customValue.trim()]);
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

  const getCategoryDisplayName = (categoryId: string) => {
    const categoryNames = {
      'beauty-wellness': { en: 'Beauty & Wellness', uk: 'Краса та Здоров\'я', ru: 'Красота и Здоровье' },
      'health-medical': { en: 'Health & Medical', uk: 'Здоров\'я та Медицина', ru: 'Здоровье и Медицина' },
      'fitness-sports': { en: 'Fitness & Sports', uk: 'Фітнес та Спорт', ru: 'Фитнес и Спорт' },
      'education-tutoring': { en: 'Education & Tutoring', uk: 'Освіта та Репетиторство', ru: 'Образование и Репетиторство' },
      'home-services': { en: 'Home Services', uk: 'Домашні послуги', ru: 'Домашние услуги' },
      'automotive': { en: 'Automotive', uk: 'Автомобільні послуги', ru: 'Автомобильные услуги' },
      'technology-it': { en: 'Technology & IT', uk: 'Технології та IT', ru: 'Технологии и IT' },
      'creative-arts': { en: 'Creative Arts', uk: 'Творчі мистецтва', ru: 'Творческие искусства' },
      'business-professional': { en: 'Business & Professional', uk: 'Бізнес та Професійні послуги', ru: 'Бизнес и Профессиональные услуги' },
      'events-entertainment': { en: 'Events & Entertainment', uk: 'Події та Розваги', ru: 'События и Развлечения' },
      'pet-services': { en: 'Pet Services', uk: 'Послуги для тварин', ru: 'Услуги для животных' }
    };
    
    const categoryName = categoryNames[categoryId as keyof typeof categoryNames];
    if (!categoryName) return categoryId;
    
    switch (language) {
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
            placeholder={t('specialtyForm.searchSpecialties') || 'Search specialties...'}
            className="w-full px-4 py-3 pl-10 rounded-xl border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 dark:bg-gray-700 dark:text-white"
            autoFocus
          />
          <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        
        {searchTerm && filteredSpecialties.length > 0 && (
          <div className="max-h-64 overflow-y-auto border border-gray-200 dark:border-gray-600 rounded-xl">
            {filteredSpecialties.map((specialty) => (
              <button
                key={specialty.id}
                type="button"
                onClick={() => toggleSpecialty(specialty.id)}
                disabled={!value.includes(specialty.id) && value.length >= maxSelections}
                className={`w-full text-left px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700 last:border-b-0 transition-colors duration-200 ${
                  value.includes(specialty.id) ? 'bg-primary-50 dark:bg-primary-900/20' : ''
                } ${
                  !value.includes(specialty.id) && value.length >= maxSelections ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {getSpecialtyName(specialty.id, language as 'en' | 'uk' | 'ru')}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {getCategoryDisplayName(specialty.category)}
                    </div>
                  </div>
                  {value.includes(specialty.id) && (
                    <svg className="w-5 h-5 text-primary-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
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
          {allowCustom && value.length < maxSelections && (
            <button
              type="button"
              onClick={() => {
                setShowSearch(false);
                setShowCustomInput(true);
              }}
              className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400"
            >
              {t('specialtyForm.addCustomSpecialty') || '+ Add custom specialty'}
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
            placeholder={t('specialtyForm.enterCustomSpecialty') || 'Enter custom specialty'}
            className="flex-1 px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 dark:bg-gray-700 dark:text-white"
            autoFocus
          />
          <button
            type="button"
            onClick={handleCustomSubmit}
            disabled={!customValue.trim() || value.includes(customValue.trim()) || value.length >= maxSelections}
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
          ← {t('common.back') || 'Back to specialties'}
        </button>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {t('specialtyForm.customSpecialtyHint') || 'This will be added to your specialty list'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Selected specialties */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((specialtyId) => {
            const specialtyName = SPECIALTIES.find(s => s.id === specialtyId)
              ? getSpecialtyName(specialtyId, language as 'en' | 'uk' | 'ru')
              : specialtyId; // Handle custom specialties
            
            return (
              <span
                key={specialtyId}
                className="inline-flex items-center gap-1 px-3 py-1 bg-primary-100 text-primary-800 rounded-full text-sm font-medium dark:bg-primary-900/20 dark:text-primary-300"
              >
                {specialtyName}
                <button
                  type="button"
                  onClick={() => removeSpecialty(specialtyId)}
                  className="ml-1 hover:bg-primary-200 dark:hover:bg-primary-800 rounded-full p-0.5"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </span>
            );
          })}
        </div>
      )}

      {/* Selection interface */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full px-4 py-3 rounded-xl border ${
            error ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
          } focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 dark:bg-gray-700 dark:text-white text-left ${className}`}
        >
          <span className={value.length === 0 ? 'text-gray-500' : 'text-gray-900 dark:text-white'}>
            {value.length === 0 
              ? placeholder
              : `${value.length} ${value.length === 1 ? 'specialty' : 'specialties'} selected ${value.length >= maxSelections ? '(max)' : ''}`
            }
          </span>
          <svg className={`absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Dropdown menu */}
        {isOpen && (
          <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl shadow-lg max-h-64 overflow-y-auto">
            {/* Search option */}
            <button
              type="button"
              onClick={() => toggleSpecialty('search')}
              className="w-full text-left px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 text-primary-600 dark:text-primary-400 font-medium border-b border-gray-100 dark:border-gray-700"
            >
              🔍 {t('specialtyForm.searchSpecialties') || '🔍 Search specialties...'}
            </button>

            {/* Group specialties by category */}
            {Object.entries(groupedSpecialties).slice(0, 20).map(([categoryId, specialties]) => (
              <div key={categoryId}>
                <div className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-750">
                  {getCategoryDisplayName(categoryId)}
                </div>
                {specialties.slice(0, 5).map((specialty) => (
                  <button
                    key={specialty.id}
                    type="button"
                    onClick={() => toggleSpecialty(specialty.id)}
                    disabled={!value.includes(specialty.id) && value.length >= maxSelections}
                    className={`w-full text-left px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 ${
                      value.includes(specialty.id) ? 'bg-primary-50 dark:bg-primary-900/20' : ''
                    } ${
                      !value.includes(specialty.id) && value.length >= maxSelections ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-gray-900 dark:text-white">
                        {getSpecialtyName(specialty.id, language as 'en' | 'uk' | 'ru')}
                      </span>
                      {value.includes(specialty.id) && (
                        <svg className="w-4 h-4 text-primary-600" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            ))}

            {/* Custom option */}
            {allowCustom && value.length < maxSelections && (
              <button
                type="button"
                onClick={() => toggleSpecialty('custom')}
                className="w-full text-left px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 text-primary-600 dark:text-primary-400 font-medium border-t border-gray-100 dark:border-gray-700"
              >
                + {t('specialtyForm.addCustomSpecialty') || '+ Add Custom Specialty'}
              </button>
            )}
          </div>
        )}
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}
      
      {value.length >= maxSelections && (
        <p className="text-amber-600 text-sm">
          {t('specialtyForm.maxSelectionsReached') || `Maximum ${maxSelections} specialties allowed`}
        </p>
      )}
    </div>
  );
};
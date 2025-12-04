import React from 'react';
import {
  checkPasswordRequirements,
  getPasswordStrengthColor,
  getPasswordStrengthProgress,
  type PasswordRequirements,
  type PasswordValidationResult
} from '@/utils/passwordValidation';
import { CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useLanguage } from '@/contexts/LanguageContext';

interface PasswordStrengthIndicatorProps {
  password: string;
  showRequirements?: boolean;
  className?: string;
}

const PasswordStrengthIndicator: React.FC<PasswordStrengthIndicatorProps> = ({
  password,
  showRequirements = true,
  className = ''
}) => {
  const { t } = useLanguage();
  const requirements = checkPasswordRequirements(password);
  const progress = getPasswordStrengthProgress(password);
  const strengthLevel: PasswordValidationResult['strength'] =
    progress < 50 ? 'weak' : progress < 83 ? 'medium' : 'strong';

  const strengthText = t(`auth.passwordStrength.${strengthLevel}`);
  const strengthColor = getPasswordStrengthColor(strengthLevel);

  const progressBarColor = progress < 50 ? 'bg-red-500' :
                          progress < 83 ? 'bg-yellow-500' :
                          'bg-green-500';

  const requirementsList = [
    { key: 'minLength', label: t('auth.passwordStrength.requirement.minLength'), met: requirements.minLength },
    { key: 'hasUppercase', label: t('auth.passwordStrength.requirement.uppercase'), met: requirements.hasUppercase },
    { key: 'hasLowercase', label: t('auth.passwordStrength.requirement.lowercase'), met: requirements.hasLowercase },
    { key: 'hasNumber', label: t('auth.passwordStrength.requirement.number'), met: requirements.hasNumber },
    { key: 'hasSymbol', label: t('auth.passwordStrength.requirement.symbol'), met: requirements.hasSymbol },
    { key: 'isEnglishOnly', label: t('auth.passwordStrength.requirement.englishOnly'), met: requirements.isEnglishOnly },
  ];

  if (!password) return null;

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Strength indicator */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {t('auth.passwordStrength.title')}
          </span>
          <span className={`text-sm font-medium ${strengthColor}`}>
            {strengthText}
          </span>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${progressBarColor}`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Requirements checklist */}
      {showRequirements && (
        <div className="space-y-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {t('auth.passwordStrength.requirementsTitle')}
          </span>
          <div className="space-y-1">
            {requirementsList.map((req) => (
              <div key={req.key} className="flex items-center space-x-2">
                {req.met ? (
                  <CheckIcon className="h-4 w-4 text-green-500" />
                ) : (
                  <XMarkIcon className="h-4 w-4 text-gray-400" />
                )}
                <span
                  className={`text-xs ${
                    req.met
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-gray-600 dark:text-gray-400'
                  }`}
                >
                  {req.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PasswordStrengthIndicator;

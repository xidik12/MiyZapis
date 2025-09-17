/**
 * Enhanced password validation utility with strict requirements
 */

export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
  strength: 'weak' | 'medium' | 'strong';
}

export interface PasswordRequirements {
  minLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
  hasSymbol: boolean;
  isEnglishOnly: boolean;
}

/**
 * Validates password against all requirements
 */
export const validatePassword = (password: string): PasswordValidationResult => {
  const errors: string[] = [];
  const requirements = checkPasswordRequirements(password);

  // Check minimum length
  if (!requirements.minLength) {
    errors.push('Password must be at least 8 characters long');
  }

  // Check for uppercase letter
  if (!requirements.hasUppercase) {
    errors.push('Password must contain at least one uppercase letter (A-Z)');
  }

  // Check for lowercase letter
  if (!requirements.hasLowercase) {
    errors.push('Password must contain at least one lowercase letter (a-z)');
  }

  // Check for number
  if (!requirements.hasNumber) {
    errors.push('Password must contain at least one number (0-9)');
  }

  // Check for symbol
  if (!requirements.hasSymbol) {
    errors.push('Password must contain at least one symbol (!@#$%^&*()_+-=[]{}|;:,.<>?)');
  }

  // Check for English characters only
  if (!requirements.isEnglishOnly) {
    errors.push('Password must contain only English letters, numbers, and symbols');
  }

  // Determine password strength
  let strength: 'weak' | 'medium' | 'strong' = 'weak';
  const metRequirements = Object.values(requirements).filter(Boolean).length;

  if (metRequirements >= 6 && password.length >= 12) {
    strength = 'strong';
  } else if (metRequirements >= 4 && password.length >= 8) {
    strength = 'medium';
  }

  return {
    isValid: errors.length === 0,
    errors,
    strength
  };
};

/**
 * Checks individual password requirements
 */
export const checkPasswordRequirements = (password: string): PasswordRequirements => {
  return {
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /\d/.test(password),
    hasSymbol: /[!@#$%^&*()_+\-=[\]{}|;:,.<>?]/.test(password),
    isEnglishOnly: /^[a-zA-Z0-9!@#$%^&*()_+\-=[\]{}|;:,.<>?]*$/.test(password)
  };
};

/**
 * Generates password strength indicator
 */
export const getPasswordStrengthColor = (strength: 'weak' | 'medium' | 'strong'): string => {
  switch (strength) {
    case 'weak':
      return 'text-red-600 dark:text-red-400';
    case 'medium':
      return 'text-yellow-600 dark:text-yellow-400';
    case 'strong':
      return 'text-green-600 dark:text-green-400';
    default:
      return 'text-gray-600 dark:text-gray-400';
  }
};

/**
 * Gets password strength progress percentage
 */
export const getPasswordStrengthProgress = (password: string): number => {
  const requirements = checkPasswordRequirements(password);
  const metRequirements = Object.values(requirements).filter(Boolean).length;
  return Math.round((metRequirements / 6) * 100);
};

/**
 * Generates a secure password suggestion
 */
export const generateSecurePassword = (length: number = 12): string => {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';

  // Ensure at least one character from each required category
  let password = '';
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += symbols[Math.floor(Math.random() * symbols.length)];

  // Fill the rest randomly
  const allChars = uppercase + lowercase + numbers + symbols;
  for (let i = password.length; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }

  // Shuffle the password
  return password.split('').sort(() => 0.5 - Math.random()).join('');
};

/**
 * React hook form validation functions
 */
export const getPasswordValidationRules = (t: (key: string) => string) => ({
  required: t('auth.error.passwordRequired') || 'Password is required',
  validate: (value: string) => {
    const validation = validatePassword(value);
    if (!validation.isValid) {
      return validation.errors[0]; // Return first error
    }
    return true;
  }
});

/**
 * Confirm password validation rules
 */
export const getConfirmPasswordValidationRules = (password: string, t: (key: string) => string) => ({
  required: t('auth.error.confirmPasswordRequired') || 'Please confirm your password',
  validate: (value: string) => {
    if (value !== password) {
      return t('auth.error.passwordsNotMatch') || 'Passwords do not match';
    }
    return true;
  }
});
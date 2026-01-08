/**
 * Enhanced password validation utility with strict requirements
 * Adapted for React Native
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
 * Gets password strength progress percentage
 */
export const getPasswordStrengthProgress = (password: string): number => {
  const requirements = checkPasswordRequirements(password);
  const metRequirements = Object.values(requirements).filter(Boolean).length;
  return Math.round((metRequirements / 6) * 100);
};

/**
 * Gets password strength color (for React Native)
 */
export const getPasswordStrengthColor = (progress: number): string => {
  if (progress < 50) return '#DC2626'; // Red
  if (progress < 83) return '#EAB308'; // Yellow
  return '#16A34A'; // Green
};


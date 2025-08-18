import React from 'react';
import { useTelegram } from '@/components/telegram/TelegramProvider';
import { useTelegramTheme } from '@/components/telegram/TelegramThemeProvider';

// Telegram-optimized List Item
interface TelegramListItemProps {
  children: React.ReactNode;
  onClick?: () => void;
  subtitle?: string;
  rightContent?: React.ReactNode;
  leftIcon?: React.ReactNode;
  showChevron?: boolean;
  disabled?: boolean;
}

export const TelegramListItem: React.FC<TelegramListItemProps> = ({
  children,
  onClick,
  subtitle,
  rightContent,
  leftIcon,
  showChevron = true,
  disabled = false
}) => {
  const { hapticFeedback } = useTelegram();

  const handleClick = () => {
    if (!disabled && onClick) {
      hapticFeedback.selectionChanged();
      onClick();
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`
        list-item
        ${onClick && !disabled ? 'cursor-pointer hover:bg-secondary' : ''}
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
      `}
    >
      {leftIcon && (
        <div className="mr-3 flex-shrink-0">
          {leftIcon}
        </div>
      )}
      
      <div className="flex-1 min-w-0">
        <div className="text-primary font-medium">{children}</div>
        {subtitle && (
          <div className="text-secondary text-sm mt-1">{subtitle}</div>
        )}
      </div>
      
      {rightContent && (
        <div className="ml-3 flex-shrink-0">
          {rightContent}
        </div>
      )}
      
      {showChevron && onClick && !disabled && (
        <div className="ml-2">
          <svg className="w-5 h-5 text-hint" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      )}
    </div>
  );
};

// Telegram-styled Switch
interface TelegramSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const TelegramSwitch: React.FC<TelegramSwitchProps> = ({
  checked,
  onChange,
  disabled = false,
  size = 'md'
}) => {
  const { hapticFeedback } = useTelegram();

  const sizeClasses = {
    sm: 'w-8 h-5',
    md: 'w-10 h-6',
    lg: 'w-12 h-7'
  };

  const thumbClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  const handleToggle = () => {
    if (!disabled) {
      hapticFeedback.impactLight();
      onChange(!checked);
    }
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={disabled}
      className={`
        ${sizeClasses[size]}
        relative inline-flex rounded-full transition-colors duration-200 focus:outline-none touch-manipulation
        ${checked ? 'bg-accent' : 'bg-gray-300'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
    >
      <span
        className={`
          ${thumbClasses[size]}
          inline-block bg-white rounded-full shadow transform transition-transform duration-200
          ${checked ? 'translate-x-full' : 'translate-x-0'}
        `}
      />
    </button>
  );
};

// Telegram-styled Segment Control
interface TelegramSegmentControlProps {
  options: { label: string; value: string }[];
  value: string;
  onChange: (value: string) => void;
  fullWidth?: boolean;
}

export const TelegramSegmentControl: React.FC<TelegramSegmentControlProps> = ({
  options,
  value,
  onChange,
  fullWidth = true
}) => {
  const { hapticFeedback } = useTelegram();

  const handleChange = (newValue: string) => {
    if (newValue !== value) {
      hapticFeedback.selectionChanged();
      onChange(newValue);
    }
  };

  return (
    <div className={`flex bg-secondary rounded-lg p-1 ${fullWidth ? 'w-full' : ''}`}>
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => handleChange(option.value)}
          className={`
            flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all duration-200 touch-manipulation
            ${value === option.value
              ? 'bg-white text-primary shadow-sm'
              : 'text-secondary hover:text-primary'
            }
          `}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
};

// Telegram-styled Action Sheet
interface TelegramActionSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  actions: {
    label: string;
    onPress: () => void;
    destructive?: boolean;
    disabled?: boolean;
    icon?: React.ReactNode;
  }[];
  cancelLabel?: string;
}

export const TelegramActionSheet: React.FC<TelegramActionSheetProps> = ({
  isOpen,
  onClose,
  title,
  actions,
  cancelLabel = 'Cancel'
}) => {
  const { hapticFeedback } = useTelegram();

  const handleActionPress = (action: any) => {
    hapticFeedback.impactLight();
    action.onPress();
    onClose();
  };

  const handleCancel = () => {
    hapticFeedback.impactLight();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div 
        className="absolute inset-0 bg-black bg-opacity-30"
        onClick={handleCancel}
      />
      
      <div className="absolute bottom-0 left-0 right-0 bg-section rounded-t-3xl safe-bottom animate-slide-up">
        <div className="p-4">
          {/* Handle */}
          <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mb-4" />
          
          {/* Title */}
          {title && (
            <div className="text-center mb-4">
              <h3 className="text-lg font-semibold text-primary">{title}</h3>
            </div>
          )}
          
          {/* Actions */}
          <div className="space-y-2">
            {actions.map((action, index) => (
              <button
                key={index}
                onClick={() => handleActionPress(action)}
                disabled={action.disabled}
                className={`
                  w-full flex items-center gap-3 p-4 rounded-xl transition-colors touch-manipulation
                  ${action.destructive 
                    ? 'text-destructive hover:bg-red-50' 
                    : 'text-primary hover:bg-secondary'
                  }
                  ${action.disabled ? 'opacity-50 cursor-not-allowed' : 'active:bg-gray-100'}
                `}
              >
                {action.icon && (
                  <div className="flex-shrink-0">
                    {action.icon}
                  </div>
                )}
                <span className="font-medium">{action.label}</span>
              </button>
            ))}
          </div>
          
          {/* Cancel */}
          <button
            onClick={handleCancel}
            className="w-full mt-4 p-4 bg-secondary text-primary font-semibold rounded-xl touch-manipulation active:bg-gray-200"
          >
            {cancelLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

// Telegram-styled Tab Bar
interface TelegramTabBarProps {
  tabs: { id: string; label: string; icon?: React.ReactNode; badge?: number }[];
  activeTab: string;
  onChange: (tabId: string) => void;
}

export const TelegramTabBar: React.FC<TelegramTabBarProps> = ({
  tabs,
  activeTab,
  onChange
}) => {
  const { hapticFeedback } = useTelegram();

  const handleTabPress = (tabId: string) => {
    if (tabId !== activeTab) {
      hapticFeedback.selectionChanged();
      onChange(tabId);
    }
  };

  return (
    <div className="flex bg-header border-t border-gray-200 safe-bottom">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => handleTabPress(tab.id)}
          className={`
            flex-1 flex flex-col items-center justify-center py-2 px-1 transition-colors touch-manipulation
            ${activeTab === tab.id ? 'text-accent' : 'text-hint'}
          `}
        >
          {tab.icon && (
            <div className="relative mb-1">
              {tab.icon}
              {tab.badge && tab.badge > 0 && (
                <div className="absolute -top-2 -right-2 bg-destructive text-white text-xs rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
                  {tab.badge > 99 ? '99+' : tab.badge}
                </div>
              )}
            </div>
          )}
          <span className="text-xs font-medium">{tab.label}</span>
        </button>
      ))}
    </div>
  );
};

// Telegram-styled Progress Bar
interface TelegramProgressBarProps {
  progress: number; // 0-100
  showPercentage?: boolean;
  height?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'success' | 'warning' | 'error';
}

export const TelegramProgressBar: React.FC<TelegramProgressBarProps> = ({
  progress,
  showPercentage = false,
  height = 'md',
  color = 'primary'
}) => {
  const heightClasses = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3'
  };

  const colorClasses = {
    primary: 'bg-accent',
    success: 'bg-green-500',
    warning: 'bg-yellow-500',
    error: 'bg-destructive'
  };

  const clampedProgress = Math.max(0, Math.min(100, progress));

  return (
    <div>
      <div className={`w-full bg-secondary rounded-full overflow-hidden ${heightClasses[height]}`}>
        <div
          className={`${heightClasses[height]} ${colorClasses[color]} transition-all duration-300 ease-out`}
          style={{ width: `${clampedProgress}%` }}
        />
      </div>
      {showPercentage && (
        <div className="text-xs text-secondary mt-1 text-right">
          {Math.round(clampedProgress)}%
        </div>
      )}
    </div>
  );
};

// Export all components
export {
  TelegramListItem,
  TelegramSwitch,
  TelegramSegmentControl,
  TelegramActionSheet,
  TelegramTabBar,
  TelegramProgressBar
};
import React from 'react';
import IconRegular from '../../assets/icons/phosphor-icons/SVGs/regular/calendar-blank.svg?react';
import IconFill from '../../assets/icons/phosphor-icons/SVGs/fill/calendar-blank-fill.svg?react';

interface IconProps {
  className?: string;
  active?: boolean;
}

export const CalendarDaysIcon: React.FC<IconProps> = ({ className = '', active = false }) => {
  const Icon = active ? IconFill : IconRegular;
  return <Icon className={className} />;
};

import React from 'react';
import CalendarRegular from '../../assets/icons/phosphor-icons/SVGs/regular/calendar.svg?react';
import CalendarFill from '../../assets/icons/phosphor-icons/SVGs/fill/calendar-fill.svg?react';

interface IconProps {
  className?: string;
  active?: boolean;
}

export const CalendarIcon: React.FC<IconProps> = ({ className = '', active = false }) => {
  const Icon = active ? CalendarFill : CalendarRegular;
  return <Icon className={className} />;
};

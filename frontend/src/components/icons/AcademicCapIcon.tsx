import React from 'react';
import IconRegular from '../../assets/icons/phosphor-icons/SVGs/regular/graduation-cap.svg?react';
import IconFill from '../../assets/icons/phosphor-icons/SVGs/fill/graduation-cap-fill.svg?react';

interface IconProps {
  className?: string;
  active?: boolean;
}

export const AcademicCapIcon: React.FC<IconProps> = ({ className = '', active = false }) => {
  const Icon = active ? IconFill : IconRegular;
  return <Icon className={className} />;
};

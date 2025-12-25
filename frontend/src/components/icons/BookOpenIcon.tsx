import React from 'react';
import IconRegular from '../../assets/icons/phosphor-icons/SVGs/regular/book-open.svg?react';
import IconFill from '../../assets/icons/phosphor-icons/SVGs/fill/book-open-fill.svg?react';

interface IconProps {
  className?: string;
  active?: boolean;
}

export const BookOpenIcon: React.FC<IconProps> = ({ className = '', active = false }) => {
  const Icon = active ? IconFill : IconRegular;
  return <Icon className={className} />;
};

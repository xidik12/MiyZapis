import React from 'react';
import IconRegular from '../../assets/icons/phosphor-icons/SVGs/regular/file-arrow-down.svg?react';
import IconFill from '../../assets/icons/phosphor-icons/SVGs/fill/file-arrow-down-fill.svg?react';

interface IconProps {
  className?: string;
  active?: boolean;
}

export const DocumentArrowDownIcon: React.FC<IconProps> = ({ className = '', active = false }) => {
  const Icon = active ? IconFill : IconRegular;
  return <Icon className={className} />;
};

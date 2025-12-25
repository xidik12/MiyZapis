import React from 'react';
import IconRegular from '../../assets/icons/phosphor-icons/SVGs/regular/info.svg?react';
import IconFill from '../../assets/icons/phosphor-icons/SVGs/fill/info-fill.svg?react';

interface IconProps {
  className?: string;
  active?: boolean;
}

export const InformationCircleIcon: React.FC<IconProps> = ({ className = '', active = false }) => {
  const Icon = active ? IconFill : IconRegular;
  return <Icon className={className} />;
};

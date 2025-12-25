import React from 'react';
import IconRegular from '../../assets/icons/phosphor-icons/SVGs/regular/phone.svg?react';
import IconFill from '../../assets/icons/phosphor-icons/SVGs/fill/phone-fill.svg?react';

interface IconProps {
  className?: string;
  active?: boolean;
}

export const PhoneIcon: React.FC<IconProps> = ({ className = '', active = false }) => {
  const Icon = active ? IconFill : IconRegular;
  return <Icon className={className} />;
};

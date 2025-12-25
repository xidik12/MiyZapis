import React from 'react';
import IconRegular from '../../assets/icons/phosphor-icons/SVGs/regular/paper-plane-tilt.svg?react';
import IconFill from '../../assets/icons/phosphor-icons/SVGs/fill/paper-plane-tilt-fill.svg?react';

interface IconProps {
  className?: string;
  active?: boolean;
}

export const PaperAirplaneIcon: React.FC<IconProps> = ({ className = '', active = false }) => {
  const Icon = active ? IconFill : IconRegular;
  return <Icon className={className} />;
};

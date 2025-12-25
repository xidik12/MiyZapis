import React from 'react';
import XCircleRegular from '../../assets/icons/phosphor-icons/SVGs/regular/x-circle.svg?react';
import XCircleFill from '../../assets/icons/phosphor-icons/SVGs/fill/x-circle-fill.svg?react';

interface IconProps {
  className?: string;
  active?: boolean;
}

export const XCircleIcon: React.FC<IconProps> = ({ className = '', active = false }) => {
  const Icon = active ? XCircleFill : XCircleRegular;
  return <Icon className={className} />;
};

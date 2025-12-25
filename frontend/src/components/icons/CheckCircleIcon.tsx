import React from 'react';
import CheckCircleRegular from '../../assets/icons/phosphor-icons/SVGs/regular/check-circle.svg?react';
import CheckCircleFill from '../../assets/icons/phosphor-icons/SVGs/fill/check-circle-fill.svg?react';

interface IconProps {
  className?: string;
  active?: boolean;
}

export const CheckCircleIcon: React.FC<IconProps> = ({ className = '', active = false }) => {
  const Icon = active ? CheckCircleFill : CheckCircleRegular;
  return <Icon className={className} />;
};

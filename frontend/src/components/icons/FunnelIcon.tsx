import React from 'react';
import FunnelRegular from '../../assets/icons/phosphor-icons/SVGs/regular/funnel.svg?react';
import FunnelFill from '../../assets/icons/phosphor-icons/SVGs/fill/funnel-fill.svg?react';

interface IconProps {
  className?: string;
  active?: boolean;
}

export const FunnelIcon: React.FC<IconProps> = ({ className = '', active = false }) => {
  const Icon = active ? FunnelFill : FunnelRegular;
  return <Icon className={className} />;
};

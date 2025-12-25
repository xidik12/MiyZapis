import React from 'react';
import IconRegular from '../../assets/icons/phosphor-icons/SVGs/regular/share-network.svg?react';
import IconFill from '../../assets/icons/phosphor-icons/SVGs/fill/share-network-fill.svg?react';

interface IconProps {
  className?: string;
  active?: boolean;
}

export const ShareIcon: React.FC<IconProps> = ({ className = '', active = false }) => {
  const Icon = active ? IconFill : IconRegular;
  return <Icon className={className} />;
};

import React from 'react';
import GlobeRegular from '../../assets/icons/phosphor-icons/SVGs/regular/globe.svg?react';
import GlobeFill from '../../assets/icons/phosphor-icons/SVGs/fill/globe-fill.svg?react';

interface IconProps {
  className?: string;
  active?: boolean;
}

export const GlobeIcon: React.FC<IconProps> = ({ className = '', active = false }) => {
  const Icon = active ? GlobeFill : GlobeRegular;
  return <Icon className={className} />;
};

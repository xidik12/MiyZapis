import React from 'react';
import EnvelopeRegular from '../../assets/icons/phosphor-icons/SVGs/regular/envelope.svg?react';
import EnvelopeFill from '../../assets/icons/phosphor-icons/SVGs/fill/envelope-fill.svg?react';

interface IconProps {
  className?: string;
  active?: boolean;
}

export const EnvelopeIcon: React.FC<IconProps> = ({ className = '', active = false }) => {
  const Icon = active ? EnvelopeFill : EnvelopeRegular;
  return <Icon className={className} />;
};

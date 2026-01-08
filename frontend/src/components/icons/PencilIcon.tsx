import React from 'react';
import { PencilSimple } from 'phosphor-react';

interface IconProps {
  className?: string;
  active?: boolean;
  weight?: 'thin' | 'light' | 'regular' | 'bold' | 'fill' | 'duotone';
}

export const PencilIcon: React.FC<IconProps> = ({
  className = '',
  active = false,
  weight
}) => {
  const iconWeight = weight || (active ? 'fill' : 'regular');

  return <PencilSimple className={className} weight={iconWeight} />;
};

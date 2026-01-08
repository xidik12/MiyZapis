import React from 'react';
import { Plus } from 'phosphor-react';

interface IconProps {
  className?: string;
  weight?: 'thin' | 'light' | 'regular' | 'bold' | 'fill' | 'duotone';
}

export const PlusIcon: React.FC<IconProps> = ({
  className = '',
  weight = 'regular'
}) => {
  return <Plus className={className} weight={weight} />;
};

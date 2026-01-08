import React from 'react';
import { MagnifyingGlass } from 'phosphor-react';

interface IconProps {
  className?: string;
  weight?: 'thin' | 'light' | 'regular' | 'bold' | 'fill' | 'duotone';
}

export const MagnifyingGlassIcon: React.FC<IconProps> = ({
  className = '',
  weight = 'regular'
}) => {
  return <MagnifyingGlass className={className} weight={weight} />;
};

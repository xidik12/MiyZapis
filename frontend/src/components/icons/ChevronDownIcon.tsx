import React from 'react';
import { CaretDown } from 'phosphor-react';

interface IconProps {
  className?: string;
  weight?: 'thin' | 'light' | 'regular' | 'bold' | 'fill' | 'duotone';
}

export const ChevronDownIcon: React.FC<IconProps> = ({
  className = '',
  weight = 'bold'
}) => {
  return <CaretDown className={className} weight={weight} />;
};

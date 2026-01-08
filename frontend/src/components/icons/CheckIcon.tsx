import React from 'react';
import { Check } from 'phosphor-react';

interface IconProps {
  className?: string;
  weight?: 'thin' | 'light' | 'regular' | 'bold' | 'fill' | 'duotone';
}

export const CheckIcon: React.FC<IconProps> = ({
  className = '',
  weight = 'bold'
}) => {
  return <Check className={className} weight={weight} />;
};

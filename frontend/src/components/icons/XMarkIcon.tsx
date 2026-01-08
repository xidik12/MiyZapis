import React from 'react';
import { X } from 'phosphor-react';

interface IconProps {
  className?: string;
  weight?: 'thin' | 'light' | 'regular' | 'bold' | 'fill' | 'duotone';
}

export const XMarkIcon: React.FC<IconProps> = ({
  className = '',
  weight = 'regular'
}) => {
  return <X className={className} weight={weight} />;
};

import React from 'react';
import { CaretLeft } from 'phosphor-react';

interface IconProps {
  className?: string;
  weight?: 'thin' | 'light' | 'regular' | 'bold' | 'fill' | 'duotone';
}

export const ChevronLeftIcon: React.FC<IconProps> = ({
  className = '',
  weight = 'bold'
}) => {
  return <CaretLeft className={className} weight={weight} />;
};

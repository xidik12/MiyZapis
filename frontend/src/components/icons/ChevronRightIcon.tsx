import React from 'react';
import { CaretRight } from 'phosphor-react';

interface IconProps {
  className?: string;
  weight?: 'thin' | 'light' | 'regular' | 'bold' | 'fill' | 'duotone';
}

export const ChevronRightIcon: React.FC<IconProps> = ({
  className = '',
  weight = 'bold'
}) => {
  return <CaretRight className={className} weight={weight} />;
};

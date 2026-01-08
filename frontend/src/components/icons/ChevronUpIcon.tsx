import React from 'react';
import { CaretUp } from 'phosphor-react';

interface IconProps {
  className?: string;
  weight?: 'thin' | 'light' | 'regular' | 'bold' | 'fill' | 'duotone';
}

export const ChevronUpIcon: React.FC<IconProps> = ({
  className = '',
  weight = 'bold'
}) => {
  return <CaretUp className={className} weight={weight} />;
};

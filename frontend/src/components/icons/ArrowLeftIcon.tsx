import React from 'react';
import { ArrowLeft } from 'phosphor-react';

interface IconProps {
  className?: string;
  weight?: 'thin' | 'light' | 'regular' | 'bold' | 'fill' | 'duotone';
}

export const ArrowLeftIcon: React.FC<IconProps> = ({
  className = '',
  weight = 'regular'
}) => {
  return <ArrowLeft className={className} weight={weight} />;
};

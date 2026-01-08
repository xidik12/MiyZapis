import React from 'react';
import { SignOut } from 'phosphor-react';

interface IconProps {
  className?: string;
  weight?: 'thin' | 'light' | 'regular' | 'bold' | 'fill' | 'duotone';
}

export const ArrowRightOnRectangleIcon: React.FC<IconProps> = ({
  className = '',
  weight = 'regular'
}) => {
  return <SignOut className={className} weight={weight} />;
};

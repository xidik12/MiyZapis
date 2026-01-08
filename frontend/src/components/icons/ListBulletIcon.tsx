import React from 'react';
import { ListBullets } from 'phosphor-react';

interface IconProps {
  className?: string;
  weight?: 'thin' | 'light' | 'regular' | 'bold' | 'fill' | 'duotone';
}

export const ListBulletIcon: React.FC<IconProps> = ({
  className = '',
  weight = 'regular'
}) => {
  return <ListBullets className={className} weight={weight} />;
};

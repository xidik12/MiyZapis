import React from 'react';
import { Buildings } from 'phosphor-react';

interface IconProps {
  className?: string;
  active?: boolean;
  weight?: 'thin' | 'light' | 'regular' | 'bold' | 'fill' | 'duotone';
}

export const BuildingOfficeIcon: React.FC<IconProps> = ({
  className = '',
  active = false,
  weight
}) => {
  const iconWeight = weight || (active ? 'fill' : 'regular');
  return <Buildings className={className} weight={iconWeight} />;
};

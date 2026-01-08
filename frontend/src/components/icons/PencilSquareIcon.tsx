import React from 'react';
import { NotePencil } from 'phosphor-react';

interface IconProps {
  className?: string;
  active?: boolean;
  weight?: 'thin' | 'light' | 'regular' | 'bold' | 'fill' | 'duotone';
}

export const PencilSquareIcon: React.FC<IconProps> = ({
  className = '',
  active = false,
  weight
}) => {
  const iconWeight = weight || (active ? 'fill' : 'regular');
  return <NotePencil className={className} weight={iconWeight} />;
};

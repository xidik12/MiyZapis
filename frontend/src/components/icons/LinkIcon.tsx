import React from 'react';
import { Link } from 'phosphor-react';

interface IconProps {
  className?: string;
  weight?: 'thin' | 'light' | 'regular' | 'bold' | 'fill' | 'duotone';
}

export const LinkIcon: React.FC<IconProps> = ({
  className = '',
  weight = 'regular'
}) => {
  return <Link className={className} weight={weight} />;
};

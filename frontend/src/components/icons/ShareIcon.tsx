import React from 'react';
import { ShareNetwork } from 'phosphor-react';

interface IconProps {
  className?: string;
  weight?: 'thin' | 'light' | 'regular' | 'bold' | 'fill' | 'duotone';
}

export const ShareIcon: React.FC<IconProps> = ({
  className = '',
  weight = 'regular'
}) => {
  return <ShareNetwork className={className} weight={weight} />;
};

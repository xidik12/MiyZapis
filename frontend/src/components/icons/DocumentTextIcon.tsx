import React from 'react';
import { FileText } from 'phosphor-react';

interface IconProps {
  className?: string;
  weight?: 'thin' | 'light' | 'regular' | 'bold' | 'fill' | 'duotone';
}

export const DocumentTextIcon: React.FC<IconProps> = ({
  className = '',
  weight = 'regular'
}) => {
  return <FileText className={className} weight={weight} />;
};

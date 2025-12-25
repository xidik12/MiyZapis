import React from 'react';
import SquaresFourRegular from '../../assets/icons/phosphor-icons/SVGs/regular/squares-four.svg?react';
import SquaresFourFill from '../../assets/icons/phosphor-icons/SVGs/fill/squares-four-fill.svg?react';

interface IconProps {
  className?: string;
  active?: boolean;
}

export const SquaresFourIcon: React.FC<IconProps> = ({ className = '', active = false }) => {
  const Icon = active ? SquaresFourFill : SquaresFourRegular;
  return <Icon className={className} />;
};

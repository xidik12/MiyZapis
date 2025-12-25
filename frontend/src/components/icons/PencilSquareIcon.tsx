import React from 'react';
import IconRegular from '../../assets/icons/phosphor-icons/SVGs/regular/note-pencil.svg?react';
import IconFill from '../../assets/icons/phosphor-icons/SVGs/fill/note-pencil-fill.svg?react';

interface IconProps {
  className?: string;
  active?: boolean;
}

export const PencilSquareIcon: React.FC<IconProps> = ({ className = '', active = false }) => {
  const Icon = active ? IconFill : IconRegular;
  return <Icon className={className} />;
};

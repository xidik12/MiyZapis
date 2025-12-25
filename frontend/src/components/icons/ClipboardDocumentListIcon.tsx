import React from 'react';
import IconRegular from '../../assets/icons/phosphor-icons/SVGs/regular/clipboard-text.svg?react';
import IconFill from '../../assets/icons/phosphor-icons/SVGs/fill/clipboard-text-fill.svg?react';

interface IconProps {
  className?: string;
  active?: boolean;
}

export const ClipboardDocumentListIcon: React.FC<IconProps> = ({ className = '', active = false }) => {
  const Icon = active ? IconFill : IconRegular;
  return <Icon className={className} />;
};

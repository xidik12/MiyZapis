import React from 'react';
import IconRegular from '../../assets/icons/phosphor-icons/SVGs/regular/paperclip.svg?react';
import IconFill from '../../assets/icons/phosphor-icons/SVGs/fill/paperclip-fill.svg?react';

interface IconProps {
  className?: string;
  active?: boolean;
}

export const PaperClipIcon: React.FC<IconProps> = ({ className = '', active = false }) => {
  const Icon = active ? IconFill : IconRegular;
  return <Icon className={className} />;
};

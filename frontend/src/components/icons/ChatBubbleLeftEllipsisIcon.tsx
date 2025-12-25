import React from 'react';
import IconRegular from '../../assets/icons/phosphor-icons/SVGs/regular/chat-dots.svg?react';
import IconFill from '../../assets/icons/phosphor-icons/SVGs/fill/chat-dots-fill.svg?react';

interface IconProps {
  className?: string;
  active?: boolean;
}

export const ChatBubbleLeftEllipsisIcon: React.FC<IconProps> = ({ className = '', active = false }) => {
  const Icon = active ? IconFill : IconRegular;
  return <Icon className={className} />;
};

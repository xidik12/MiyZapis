import React from 'react';
import ChatCircleRegular from '../../assets/icons/phosphor-icons/SVGs/regular/chat-circle.svg?react';
import ChatCircleFill from '../../assets/icons/phosphor-icons/SVGs/fill/chat-circle-fill.svg?react';

interface IconProps {
  className?: string;
  active?: boolean;
}

export const ChatCircleIcon: React.FC<IconProps> = ({ className = '', active = false }) => {
  const Icon = active ? ChatCircleFill : ChatCircleRegular;
  return <Icon className={className} />;
};

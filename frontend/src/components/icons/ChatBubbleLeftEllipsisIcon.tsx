import React from 'react';
import { ChatText } from 'phosphor-react';

interface IconProps {
  className?: string;
  active?: boolean;
  weight?: 'thin' | 'light' | 'regular' | 'bold' | 'fill' | 'duotone';
}

export const ChatBubbleLeftEllipsisIcon: React.FC<IconProps> = ({
  className = '',
  active = false,
  weight
}) => {
  const iconWeight = weight || (active ? 'fill' : 'regular');
  return <ChatText className={className} weight={iconWeight} />;
};

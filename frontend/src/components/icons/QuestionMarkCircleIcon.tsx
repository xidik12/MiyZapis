import React from 'react';
import IconRegular from '../../assets/icons/phosphor-icons/SVGs/regular/question.svg?react';
import IconFill from '../../assets/icons/phosphor-icons/SVGs/fill/question-fill.svg?react';

interface IconProps {
  className?: string;
  active?: boolean;
}

export const QuestionMarkCircleIcon: React.FC<IconProps> = ({ className = '', active = false }) => {
  const Icon = active ? IconFill : IconRegular;
  return <Icon className={className} />;
};

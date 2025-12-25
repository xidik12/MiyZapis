import React from 'react';
import IconRegular from '../../assets/icons/phosphor-icons/SVGs/regular/robot.svg?react';
import IconFill from '../../assets/icons/phosphor-icons/SVGs/fill/robot-fill.svg?react';

interface IconProps {
  className?: string;
  active?: boolean;
}

export const RobotIcon: React.FC<IconProps> = ({ className = '', active = false }) => {
  const Icon = active ? IconFill : IconRegular;
  return <Icon className={className} />;
};

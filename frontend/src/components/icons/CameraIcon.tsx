import React from 'react';
import CameraRegular from '../../assets/icons/phosphor-icons/SVGs/regular/camera.svg?react';
import CameraFill from '../../assets/icons/phosphor-icons/SVGs/fill/camera-fill.svg?react';

interface IconProps {
  className?: string;
  active?: boolean;
}

export const CameraIcon: React.FC<IconProps> = ({ className = '', active = false }) => {
  const Icon = active ? CameraFill : CameraRegular;
  return <Icon className={className} />;
};

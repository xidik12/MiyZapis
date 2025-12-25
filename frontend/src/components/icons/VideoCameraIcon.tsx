import React from 'react';
import IconRegular from '../../assets/icons/phosphor-icons/SVGs/regular/video-camera.svg?react';
import IconFill from '../../assets/icons/phosphor-icons/SVGs/fill/video-camera-fill.svg?react';

interface IconProps {
  className?: string;
  active?: boolean;
}

export const VideoCameraIcon: React.FC<IconProps> = ({ className = '', active = false }) => {
  const Icon = active ? IconFill : IconRegular;
  return <Icon className={className} />;
};

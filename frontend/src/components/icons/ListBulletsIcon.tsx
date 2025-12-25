import React from 'react';
import ListBulletsRegular from '../../assets/icons/phosphor-icons/SVGs/regular/list-bullets.svg?react';
import ListBulletsFill from '../../assets/icons/phosphor-icons/SVGs/fill/list-bullets-fill.svg?react';

interface IconProps {
  className?: string;
  active?: boolean;
}

export const ListBulletsIcon: React.FC<IconProps> = ({ className = '', active = false }) => {
  const Icon = active ? ListBulletsFill : ListBulletsRegular;
  return <Icon className={className} />;
};

import React from 'react';
import IconRegular from '../../assets/icons/phosphor-icons/SVGs/regular/wallet.svg?react';
import IconFill from '../../assets/icons/phosphor-icons/SVGs/fill/wallet-fill.svg?react';

interface IconProps {
  className?: string;
  active?: boolean;
}

export const WalletIcon: React.FC<IconProps> = ({ className = '', active = false }) => {
  const Icon = active ? IconFill : IconRegular;
  return <Icon className={className} />;
};

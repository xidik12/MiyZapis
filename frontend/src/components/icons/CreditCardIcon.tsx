import React from 'react';
import CreditCardRegular from '../../assets/icons/phosphor-icons/SVGs/regular/credit-card.svg?react';
import CreditCardFill from '../../assets/icons/phosphor-icons/SVGs/fill/credit-card-fill.svg?react';

interface IconProps {
  className?: string;
  active?: boolean;
}

export const CreditCardIcon: React.FC<IconProps> = ({ className = '', active = false }) => {
  const Icon = active ? CreditCardFill : CreditCardRegular;
  return <Icon className={className} />;
};

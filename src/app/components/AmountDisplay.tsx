import React from 'react';

interface AmountDisplayProps {
  amount: number;
  type?: 'income' | 'expense' | 'neutral';
  currency?: string;
  showSign?: boolean;
  className?: string;
}

export function AmountDisplay({ 
  amount, 
  type = 'neutral', 
  currency = '₫',
  showSign = false,
  className = '' 
}: AmountDisplayProps) {
  const formattedAmount = new Intl.NumberFormat('vi-VN').format(Math.abs(amount));
  
  const colors = {
    income: 'text-[var(--success)]',
    expense: 'text-[var(--danger)]',
    neutral: 'text-[var(--text-primary)]',
  };

  const sign = showSign ? (type === 'income' ? '+' : type === 'expense' ? '-' : '') : '';

  return (
    <span className={`font-medium tabular-nums ${colors[type]} ${className}`}>
      {sign}{formattedAmount}{currency}
    </span>
  );
}

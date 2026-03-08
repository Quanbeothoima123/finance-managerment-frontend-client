import React from 'react';
import { ArrowUpRight, ArrowDownRight, DollarSign } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './Card';

interface StatCardProps {
  title: string;
  amount: number;
  type?: 'income' | 'expense' | 'neutral';
  trend?: {
    value: number;
    isPositive: boolean;
  };
  icon?: React.ReactNode;
}

export function StatCard({ title, amount, type = 'neutral', trend, icon }: StatCardProps) {
  const formattedAmount = new Intl.NumberFormat('vi-VN').format(amount);

  const typeColors = {
    income: 'text-[var(--success)]',
    expense: 'text-[var(--danger)]',
    neutral: 'text-[var(--text-primary)]',
  };

  const typeIcons = {
    income: <ArrowUpRight className="w-5 h-5" />,
    expense: <ArrowDownRight className="w-5 h-5" />,
    neutral: <DollarSign className="w-5 h-5" />,
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-[var(--text-secondary)]">
            {title}
          </CardTitle>
          <div className={`p-2 rounded-[var(--radius-md)] ${
            type === 'income' ? 'bg-[var(--success-light)]' : 
            type === 'expense' ? 'bg-[var(--danger-light)]' : 
            'bg-[var(--surface-elevated)]'
          }`}>
            <div className={typeColors[type]}>
              {icon || typeIcons[type]}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <p className={`text-2xl font-semibold tabular-nums ${typeColors[type]}`}>
            {formattedAmount}₫
          </p>
          {trend && (
            <div className="flex items-center gap-1">
              <span className={`text-xs font-medium ${
                trend.isPositive ? 'text-[var(--success)]' : 'text-[var(--danger)]'
              }`}>
                {trend.isPositive ? '+' : ''}{trend.value}%
              </span>
              <span className="text-xs text-[var(--text-secondary)]">
                so với tháng trước
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

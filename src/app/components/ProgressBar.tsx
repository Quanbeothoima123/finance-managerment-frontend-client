import React from 'react';

interface ProgressBarProps {
  value: number;
  max?: number;
  variant?: 'primary' | 'success' | 'danger' | 'warning';
  className?: string;
  showLabel?: boolean;
}

export function ProgressBar({ 
  value, 
  max = 100, 
  variant = 'primary', 
  className = '',
  showLabel = false 
}: ProgressBarProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  
  const variants = {
    primary: 'bg-[var(--primary)]',
    success: 'bg-[var(--success)]',
    danger: 'bg-[var(--danger)]',
    warning: 'bg-[var(--warning)]',
  };

  return (
    <div className={`w-full ${className}`}>
      <div className="w-full h-2 bg-[var(--surface)] rounded-[var(--radius-full)] overflow-hidden">
        <div
          className={`h-full transition-all duration-300 ${variants[variant]}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-xs text-[var(--text-secondary)] mt-1 block">
          {Math.round(percentage)}%
        </span>
      )}
    </div>
  );
}

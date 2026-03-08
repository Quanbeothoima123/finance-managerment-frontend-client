import React from 'react';
import { X } from 'lucide-react';

interface ChipProps {
  label: string;
  variant?: 'default' | 'success' | 'danger' | 'warning' | 'info';
  onRemove?: () => void;
  className?: string;
}

export function Chip({ label, variant = 'default', onRemove, className = '' }: ChipProps) {
  const variants = {
    default: 'bg-[var(--surface)] text-[var(--text-primary)] border-[var(--border)]',
    success: 'bg-[var(--success-light)] text-[var(--success)] border-[var(--success)]',
    danger: 'bg-[var(--danger-light)] text-[var(--danger)] border-[var(--danger)]',
    warning: 'bg-[var(--warning-light)] text-[var(--warning)] border-[var(--warning)]',
    info: 'bg-[var(--info-light)] text-[var(--info)] border-[var(--info)]',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-[var(--radius-full)] border text-sm font-medium ${variants[variant]} ${className}`}
    >
      {label}
      {onRemove && (
        <button
          onClick={onRemove}
          className="hover:bg-black/10 dark:hover:bg-white/10 rounded-full p-0.5 transition-colors"
          aria-label="Xóa"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </span>
  );
}

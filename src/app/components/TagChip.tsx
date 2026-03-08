import React from 'react';
import { X } from 'lucide-react';

interface TagChipProps {
  name: string;
  color: string;
  onRemove?: () => void;
  size?: 'sm' | 'md';
  className?: string;
}

export function TagChip({ name, color, onRemove, size = 'sm', className = '' }: TagChipProps) {
  const sizeClasses = size === 'sm'
    ? 'px-2 py-0.5 text-xs'
    : 'px-2.5 py-1 text-sm';

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-[var(--radius-full)] font-medium ${sizeClasses} ${className}`}
      style={{
        backgroundColor: `${color}18`,
        color: color,
        border: `1px solid ${color}30`,
      }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
        style={{ backgroundColor: color }}
      />
      {name}
      {onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="hover:opacity-70 transition-opacity -mr-0.5"
          aria-label={`Xoá nhãn ${name}`}
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </span>
  );
}

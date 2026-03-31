import React from 'react';

interface TopicChipProps {
  label: string;
  isActive?: boolean;
  onClick?: () => void;
  size?: 'sm' | 'md';
  color?: string;
}

export function TopicChip({ label, isActive, onClick, size = 'md', color }: TopicChipProps) {
  const isSmall = size === 'sm';

  return (
    <button
      onClick={onClick}
      className={`rounded-full font-medium whitespace-nowrap transition-colors ${
        isSmall ? 'px-3 py-1 text-xs' : 'px-3.5 py-1.5 text-sm'
      } ${
        isActive
          ? 'bg-[var(--primary)] text-white'
          : color
            ? 'bg-[var(--surface)] hover:bg-[var(--primary-light)] hover:text-[var(--primary)]'
            : 'bg-[var(--surface)] text-[var(--text-secondary)] hover:bg-[var(--primary-light)] hover:text-[var(--primary)]'
      }`}
      style={!isActive && color ? { color, backgroundColor: `${color}15` } : undefined}
    >
      #{label}
    </button>
  );
}

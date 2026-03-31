import React from 'react';

interface SocialEmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: { label: string; onClick: () => void };
}

export function SocialEmptyState({ icon, title, description, action }: SocialEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-[var(--surface)] flex items-center justify-center text-[var(--text-tertiary)] mb-4">
        {icon}
      </div>
      <h3 className="font-semibold text-[var(--text-primary)] mb-2">{title}</h3>
      <p className="text-sm text-[var(--text-secondary)] max-w-xs mb-6">{description}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="px-5 py-2.5 bg-[var(--primary)] text-white rounded-xl font-medium hover:bg-[var(--primary-hover)] transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

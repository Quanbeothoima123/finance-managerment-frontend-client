import React, { forwardRef } from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  elevated?: boolean;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  function Card({ children, className = '', elevated = false, ...props }, ref) {
    return (
      <div
        ref={ref}
        className={`bg-[var(--${elevated ? 'surface-elevated' : 'surface'})] border border-[var(--border)] rounded-[var(--radius-lg)] p-6 shadow-[var(--shadow-md)] ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);

export function CardHeader({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`mb-4 ${className}`}>{children}</div>;
}

export function CardTitle({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <h3 className={`font-semibold text-[var(--text-primary)] ${className}`}>{children}</h3>;
}

export function CardContent({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={className}>{children}</div>;
}
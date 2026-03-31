import React from 'react';

export function PostSkeleton() {
  return (
    <div className="bg-[var(--card)] rounded-[20px] border border-[var(--border)] p-4 animate-pulse">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-full bg-[var(--surface)]" />
        <div className="flex-1">
          <div className="h-3.5 w-28 bg-[var(--surface)] rounded mb-1.5" />
          <div className="h-3 w-20 bg-[var(--surface)] rounded" />
        </div>
      </div>
      <div className="space-y-2 mb-3">
        <div className="h-3.5 w-full bg-[var(--surface)] rounded" />
        <div className="h-3.5 w-4/5 bg-[var(--surface)] rounded" />
        <div className="h-3.5 w-3/5 bg-[var(--surface)] rounded" />
      </div>
      <div className="h-32 w-full bg-[var(--surface)] rounded-xl mb-3" />
      <div className="flex gap-6">
        <div className="h-4 w-12 bg-[var(--surface)] rounded" />
        <div className="h-4 w-12 bg-[var(--surface)] rounded" />
        <div className="h-4 w-12 bg-[var(--surface)] rounded" />
      </div>
    </div>
  );
}

import React from 'react';

export interface BottomSheetAction {
  icon: React.ReactNode;
  label: string;
  description?: string;
  color?: string;
  destructive?: boolean;
  onClick: () => void;
}

interface BottomSheetActionsProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  actions: BottomSheetAction[];
}

export function BottomSheetActions({ open, onClose, title, subtitle, actions }: BottomSheetActionsProps) {
  if (!open) return null;

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/50 z-50 animate-in fade-in duration-200" onClick={onClose} />
      {/* Sheet */}
      <div className="fixed bottom-0 left-0 right-0 bg-[var(--card)] rounded-t-3xl z-50 safe-area-inset-bottom animate-in slide-in-from-bottom duration-300">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-[var(--border)]" />
        </div>

        <div className="px-6 pb-2">
          <h3 className="font-semibold text-[var(--text-primary)]">{title}</h3>
          {subtitle && <p className="text-xs text-[var(--text-tertiary)] mt-0.5">{subtitle}</p>}
        </div>

        <div className="px-3 pb-4">
          {actions.map((action, i) => (
            <button
              key={i}
              onClick={() => { action.onClick(); onClose(); }}
              className="w-full flex items-center gap-3.5 px-4 py-3.5 rounded-2xl hover:bg-[var(--surface)] transition-colors text-left"
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                action.destructive
                  ? 'bg-[var(--danger-light)] text-[var(--danger)]'
                  : action.color || 'bg-[var(--surface)] text-[var(--text-secondary)]'
              }`}>
                {action.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${action.destructive ? 'text-[var(--danger)]' : 'text-[var(--text-primary)]'}`}>
                  {action.label}
                </p>
                {action.description && (
                  <p className="text-xs text-[var(--text-tertiary)] mt-0.5">{action.description}</p>
                )}
              </div>
            </button>
          ))}
        </div>

        <div className="px-6 pb-6">
          <button
            onClick={onClose}
            className="w-full py-3 text-sm font-medium text-[var(--text-secondary)] bg-[var(--surface)] rounded-2xl hover:bg-[var(--border)] transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </>
  );
}

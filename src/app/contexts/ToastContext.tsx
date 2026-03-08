import React, { createContext, useContext, useState, useCallback, useRef, ReactNode } from 'react';
import { CheckCircle, XCircle, Info, AlertTriangle, X, Undo2 } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastAction {
  label: string;
  onClick: () => void;
}

interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
  action?: ToastAction;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType, duration?: number, action?: ToastAction) => string;
  success: (message: string, duration?: number) => string;
  error: (message: string, duration?: number) => string;
  info: (message: string, duration?: number) => string;
  warning: (message: string, duration?: number) => string;
  dismissToast: (id: string) => void;
  /** Show a warning toast with an action button; returns toast id */
  showUndoToast: (message: string, onUndo: () => void, duration?: number) => string;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
  }, []);

  const showToast = useCallback((
    message: string,
    type: ToastType = 'info',
    duration: number = 3000,
    action?: ToastAction,
  ): string => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    const toast: Toast = { id, type, message, duration, action };
    
    setToasts(prev => [...prev, toast]);

    if (duration > 0) {
      const timer = setTimeout(() => {
        removeToast(id);
      }, duration);
      timersRef.current.set(id, timer);
    }

    return id;
  }, [removeToast]);

  const success = useCallback((message: string, duration?: number): string => {
    return showToast(message, 'success', duration);
  }, [showToast]);

  const error = useCallback((message: string, duration?: number): string => {
    return showToast(message, 'error', duration);
  }, [showToast]);

  const info = useCallback((message: string, duration?: number): string => {
    return showToast(message, 'info', duration);
  }, [showToast]);

  const warning = useCallback((message: string, duration?: number): string => {
    return showToast(message, 'warning', duration);
  }, [showToast]);

  const dismissToast = useCallback((id: string) => {
    removeToast(id);
  }, [removeToast]);

  const showUndoToast = useCallback((
    message: string,
    onUndo: () => void,
    duration: number = 6000,
  ): string => {
    return showToast(message, 'warning', duration, {
      label: 'Hoàn tác',
      onClick: onUndo,
    });
  }, [showToast]);

  return (
    <ToastContext.Provider value={{ showToast, success, error, info, warning, dismissToast, showUndoToast }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}

// Toast Container Component
function ToastContainer({ toasts, onRemove }: { toasts: Toast[]; onRemove: (id: string) => void }) {
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  );
}

// Toast Item Component
function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  const icons = {
    success: CheckCircle,
    error: XCircle,
    info: Info,
    warning: AlertTriangle,
  };

  const colors = {
    success: {
      bg: 'bg-[var(--success-light)]',
      border: 'border-[var(--success)]',
      icon: 'text-[var(--success)]',
    },
    error: {
      bg: 'bg-[var(--danger-light)]',
      border: 'border-[var(--danger)]',
      icon: 'text-[var(--danger)]',
    },
    info: {
      bg: 'bg-[var(--info-light)]',
      border: 'border-[var(--info)]',
      icon: 'text-[var(--info)]',
    },
    warning: {
      bg: 'bg-[var(--warning-light)]',
      border: 'border-[var(--warning)]',
      icon: 'text-[var(--warning)]',
    },
  };

  const Icon = icons[toast.type];
  const color = colors[toast.type];

  return (
    <div
      className={`pointer-events-auto flex items-start gap-3 p-4 rounded-[var(--radius-lg)] border ${color.bg} ${color.border} shadow-[var(--shadow-lg)] animate-slide-in-right`}
      role="alert"
    >
      <Icon className={`w-5 h-5 flex-shrink-0 ${color.icon}`} />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-[var(--text-primary)] leading-relaxed">
          {toast.message}
        </p>
        {toast.action && (
          <button
            onClick={() => {
              toast.action!.onClick();
              onRemove(toast.id);
            }}
            className="mt-1.5 inline-flex items-center gap-1 text-sm font-medium text-[var(--primary)] hover:text-[var(--primary-hover)] transition-colors"
          >
            <Undo2 className="w-3.5 h-3.5" />
            {toast.action.label}
          </button>
        )}
      </div>
      <button
        onClick={() => onRemove(toast.id)}
        className="p-1 rounded-[var(--radius-sm)] hover:bg-[var(--surface)] transition-colors flex-shrink-0"
      >
        <X className="w-4 h-4 text-[var(--text-secondary)]" />
      </button>
    </div>
  );
}

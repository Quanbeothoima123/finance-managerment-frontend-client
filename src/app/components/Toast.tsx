import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle, XCircle, Info, AlertCircle, X, RotateCcw } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: string;
  type: ToastType;
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  duration?: number;
}

interface ToastContextType {
  showToast: (
    message: string,
    type?: ToastType,
    action?: { label: string; onClick: () => void },
    duration?: number
  ) => void;
  showSuccessToast: (message: string, action?: { label: string; onClick: () => void }) => void;
  showErrorToast: (message: string, action?: { label: string; onClick: () => void }) => void;
  showInfoToast: (message: string, action?: { label: string; onClick: () => void }) => void;
  showWarningToast: (message: string, action?: { label: string; onClick: () => void }) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    (
      message: string,
      type: ToastType = 'info',
      action?: { label: string; onClick: () => void },
      duration: number = 5000
    ) => {
      const id = Math.random().toString(36).substr(2, 9);
      const toast: Toast = { id, type, message, action, duration };

      setToasts((prev) => [...prev, toast]);

      if (duration > 0) {
        setTimeout(() => removeToast(id), duration);
      }
    },
    [removeToast]
  );

  const showSuccessToast = useCallback(
    (message: string, action?: { label: string; onClick: () => void }) => {
      showToast(message, 'success', action);
    },
    [showToast]
  );

  const showErrorToast = useCallback(
    (message: string, action?: { label: string; onClick: () => void }) => {
      showToast(message, 'error', action);
    },
    [showToast]
  );

  const showInfoToast = useCallback(
    (message: string, action?: { label: string; onClick: () => void }) => {
      showToast(message, 'info', action);
    },
    [showToast]
  );

  const showWarningToast = useCallback(
    (message: string, action?: { label: string; onClick: () => void }) => {
      showToast(message, 'warning', action);
    },
    [showToast]
  );

  return (
    <ToastContext.Provider
      value={{
        showToast,
        showSuccessToast,
        showErrorToast,
        showInfoToast,
        showWarningToast,
      }}
    >
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
}

interface ToastContainerProps {
  toasts: Toast[];
  onRemove: (id: string) => void;
}

function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  return (
    <div className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-50 space-y-3 max-w-sm w-full">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  );
}

interface ToastItemProps {
  toast: Toast;
  onRemove: (id: string) => void;
}

function ToastItem({ toast, onRemove }: ToastItemProps) {
  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-[var(--success)]" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-[var(--danger)]" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-[var(--warning)]" />;
      case 'info':
      default:
        return <Info className="w-5 h-5 text-[var(--info)]" />;
    }
  };

  const getBgColor = () => {
    switch (toast.type) {
      case 'success':
        return 'bg-[var(--success-light)] border-[var(--success)]';
      case 'error':
        return 'bg-[var(--danger-light)] border-[var(--danger)]';
      case 'warning':
        return 'bg-[var(--warning-light)] border-[var(--warning)]';
      case 'info':
      default:
        return 'bg-[var(--info-light)] border-[var(--info)]';
    }
  };

  return (
    <div
      className={`flex items-center gap-3 p-4 rounded-[var(--radius-lg)] border shadow-lg backdrop-blur-sm ${getBgColor()} animate-in slide-in-from-right duration-300`}
    >
      <div className="flex-shrink-0">{getIcon()}</div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[var(--text-primary)]">{toast.message}</p>
      </div>

      {toast.action && (
        <button
          onClick={() => {
            toast.action!.onClick();
            onRemove(toast.id);
          }}
          className="flex-shrink-0 text-sm font-semibold text-[var(--primary)] hover:text-[var(--primary-hover)] transition-colors"
        >
          {toast.action.label}
        </button>
      )}

      <button
        onClick={() => onRemove(toast.id)}
        className="flex-shrink-0 p-1 hover:bg-black/10 dark:hover:bg-white/10 rounded-[var(--radius-md)] transition-colors"
      >
        <X className="w-4 h-4 text-[var(--text-secondary)]" />
      </button>
    </div>
  );
}

// Standalone Toast Components (for showcase/demo)
export function SuccessToast({ message, onUndo }: { message: string; onUndo?: () => void }) {
  return (
    <div className="flex items-center gap-3 p-4 rounded-[var(--radius-lg)] border border-[var(--success)] bg-[var(--success-light)] shadow-lg max-w-sm">
      <CheckCircle className="w-5 h-5 text-[var(--success)] flex-shrink-0" />
      <p className="text-sm font-medium text-[var(--text-primary)] flex-1">{message}</p>
      {onUndo && (
        <button
          onClick={onUndo}
          className="flex-shrink-0 text-sm font-semibold text-[var(--primary)] hover:text-[var(--primary-hover)] transition-colors"
        >
          Hoàn tác
        </button>
      )}
      <button className="flex-shrink-0 p-1 hover:bg-black/10 dark:hover:bg-white/10 rounded-[var(--radius-md)] transition-colors">
        <X className="w-4 h-4 text-[var(--text-secondary)]" />
      </button>
    </div>
  );
}

export function ErrorToast({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex items-center gap-3 p-4 rounded-[var(--radius-lg)] border border-[var(--danger)] bg-[var(--danger-light)] shadow-lg max-w-sm">
      <XCircle className="w-5 h-5 text-[var(--danger)] flex-shrink-0" />
      <p className="text-sm font-medium text-[var(--text-primary)] flex-1">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex-shrink-0 text-sm font-semibold text-[var(--primary)] hover:text-[var(--primary-hover)] transition-colors"
        >
          Thử lại
        </button>
      )}
      <button className="flex-shrink-0 p-1 hover:bg-black/10 dark:hover:bg-white/10 rounded-[var(--radius-md)] transition-colors">
        <X className="w-4 h-4 text-[var(--text-secondary)]" />
      </button>
    </div>
  );
}

export function InfoToast({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-3 p-4 rounded-[var(--radius-lg)] border border-[var(--info)] bg-[var(--info-light)] shadow-lg max-w-sm">
      <Info className="w-5 h-5 text-[var(--info)] flex-shrink-0" />
      <p className="text-sm font-medium text-[var(--text-primary)] flex-1">{message}</p>
      <button className="flex-shrink-0 p-1 hover:bg-black/10 dark:hover:bg-white/10 rounded-[var(--radius-md)] transition-colors">
        <X className="w-4 h-4 text-[var(--text-secondary)]" />
      </button>
    </div>
  );
}

export function WarningToast({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-3 p-4 rounded-[var(--radius-lg)] border border-[var(--warning)] bg-[var(--warning-light)] shadow-lg max-w-sm">
      <AlertCircle className="w-5 h-5 text-[var(--warning)] flex-shrink-0" />
      <p className="text-sm font-medium text-[var(--text-primary)] flex-1">{message}</p>
      <button className="flex-shrink-0 p-1 hover:bg-black/10 dark:hover:bg-white/10 rounded-[var(--radius-md)] transition-colors">
        <X className="w-4 h-4 text-[var(--text-secondary)]" />
      </button>
    </div>
  );
}

// Example with Undo Action (for deleted transaction)
export function DeletedTransactionToast({ onUndo }: { onUndo: () => void }) {
  return (
    <div className="flex items-center gap-3 p-4 rounded-[var(--radius-lg)] border border-[var(--success)] bg-[var(--success-light)] shadow-lg max-w-sm">
      <CheckCircle className="w-5 h-5 text-[var(--success)] flex-shrink-0" />
      <p className="text-sm font-medium text-[var(--text-primary)] flex-1">
        Đã xoá giao dịch
      </p>
      <button
        onClick={onUndo}
        className="flex items-center gap-1 px-3 py-1.5 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white rounded-[var(--radius-md)] text-sm font-medium transition-colors"
      >
        <RotateCcw className="w-3.5 h-3.5" />
        Hoàn tác
      </button>
      <button className="flex-shrink-0 p-1 hover:bg-black/10 dark:hover:bg-white/10 rounded-[var(--radius-md)] transition-colors">
        <X className="w-4 h-4 text-[var(--text-secondary)]" />
      </button>
    </div>
  );
}

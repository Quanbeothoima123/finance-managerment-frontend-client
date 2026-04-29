import React from "react";
import {
  AlertTriangle,
  XCircle,
  Database,
  Shield,
  WifiOff,
  RefreshCw,
  Mail,
} from "lucide-react";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { useTranslation } from "react-i18next";

interface ErrorStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  errorCode?: string;
  onRetry?: () => void;
  onContactSupport?: () => void;
  showRetry?: boolean;
  showSupport?: boolean;
}

export function ErrorState({
  icon,
  title,
  description,
  errorCode,
  onRetry,
  onContactSupport,
  showRetry = true,
  showSupport = true,
}: ErrorStateProps) {
  const { t } = useTranslation("common");
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      {icon && (
        <div className="w-24 h-24 bg-[var(--danger-light)] rounded-full flex items-center justify-center mb-6">
          {icon}
        </div>
      )}

      <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-2">
        {title}
      </h3>
      <p className="text-sm text-[var(--text-secondary)] max-w-md mb-6">
        {description}
      </p>

      {errorCode && (
        <p className="text-xs text-[var(--text-tertiary)] font-mono mb-6">
          {t("error_states.error_code_label")} {errorCode}
        </p>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        {showRetry && onRetry && (
          <Button onClick={onRetry}>
            <RefreshCw className="w-5 h-5" />
            {t("actions.retry")}
          </Button>
        )}

        {showSupport && onContactSupport && (
          <Button onClick={onContactSupport} variant="secondary">
            <Mail className="w-5 h-5" />
            {t("error_states.contact_support")}
          </Button>
        )}
      </div>
    </div>
  );
}

// Error State: Database Connection Error
export function ErrorStateDatabase() {
  const { t } = useTranslation("common");
  return (
    <ErrorState
      icon={<Database className="w-12 h-12 text-[var(--danger)]" />}
      title={t("error_states.database.title")}
      description={t("error_states.database.description")}
      errorCode="DB_CONNECTION_FAILED"
      onRetry={() => console.log("Retry database connection")}
      onContactSupport={() => console.log("Contact support")}
    />
  );
}

// Error State: Permission Denied
export function ErrorStatePermission() {
  const { t } = useTranslation("common");
  return (
    <ErrorState
      icon={<Shield className="w-12 h-12 text-[var(--danger)]" />}
      title={t("error_states.permission.title")}
      description={t("error_states.permission.description")}
      errorCode="PERMISSION_DENIED"
      onRetry={() => console.log("Retry permission")}
      onContactSupport={() => console.log("Contact support")}
      showRetry={false}
    />
  );
}

// Error State: Unexpected Error
export function ErrorStateUnexpected() {
  const { t } = useTranslation("common");
  return (
    <ErrorState
      icon={<XCircle className="w-12 h-12 text-[var(--danger)]" />}
      title={t("error_states.unexpected.title")}
      description={t("error_states.unexpected.description")}
      errorCode="UNEXPECTED_ERROR_500"
      onRetry={() => console.log("Retry operation")}
      onContactSupport={() => console.log("Contact support")}
    />
  );
}

// Error State: Network Error
export function ErrorStateNetwork() {
  const { t } = useTranslation("common");
  return (
    <ErrorState
      icon={<WifiOff className="w-12 h-12 text-[var(--danger)]" />}
      title={t("error_states.network.title")}
      description={t("error_states.network.description")}
      errorCode="NETWORK_ERROR"
      onRetry={() => console.log("Retry network")}
      onContactSupport={() => console.log("Contact support")}
    />
  );
}

// Error State: Not Found
export function ErrorStateNotFound() {
  const { t } = useTranslation("common");
  return (
    <ErrorState
      icon={<AlertTriangle className="w-12 h-12 text-[var(--warning)]" />}
      title={t("error_states.not_found.title")}
      description={t("error_states.not_found.description")}
      errorCode="404_NOT_FOUND"
      onRetry={() => console.log("Go back")}
      onContactSupport={() => console.log("Contact support")}
      showRetry={false}
      showSupport={false}
    />
  );
}

// Error Modal Component
interface ErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  type?: "database" | "permission" | "unexpected" | "network";
}

export function ErrorModal({
  isOpen,
  onClose,
  type = "unexpected",
}: ErrorModalProps) {
  const { t } = useTranslation("common");
  if (!isOpen) return null;

  const errorStates = {
    database: {
      icon: <Database className="w-12 h-12 text-[var(--danger)]" />,
      title: t("error_states.database.title"),
      description: t("error_states.database.description"),
      errorCode: "DB_CONNECTION_FAILED",
    },
    permission: {
      icon: <Shield className="w-12 h-12 text-[var(--danger)]" />,
      title: t("error_states.permission.title"),
      description: t("error_states.permission.description"),
      errorCode: "PERMISSION_DENIED",
    },
    unexpected: {
      icon: <XCircle className="w-12 h-12 text-[var(--danger)]" />,
      title: t("error_states.unexpected.title"),
      description: t("error_states.unexpected.description"),
      errorCode: "UNEXPECTED_ERROR_500",
    },
    network: {
      icon: <WifiOff className="w-12 h-12 text-[var(--danger)]" />,
      title: t("error_states.network.title"),
      description: t("error_states.network.description"),
      errorCode: "NETWORK_ERROR",
    },
  };

  const error = errorStates[type];

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        {/* Modal */}
        <div
          className="bg-[var(--card)] rounded-[var(--radius-xl)] shadow-2xl max-w-md w-full"
          onClick={(e) => e.stopPropagation()}
        >
          <Card>
            <div className="text-center">
              <div className="w-20 h-20 bg-[var(--danger-light)] rounded-full flex items-center justify-center mx-auto mb-4">
                {error.icon}
              </div>

              <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-2">
                {error.title}
              </h3>
              <p className="text-sm text-[var(--text-secondary)] mb-4">
                {error.description}
              </p>

              {error.errorCode && (
                <p className="text-xs text-[var(--text-tertiary)] font-mono mb-6">
                  {t("error_states.error_code_label")} {error.errorCode}
                </p>
              )}

              <div className="flex flex-col-reverse sm:flex-row gap-3">
                <Button
                  onClick={onClose}
                  variant="secondary"
                  className="flex-1"
                >
                  {t("actions.close")}
                </Button>
                <Button
                  onClick={() => {
                    console.log("Retry operation");
                    onClose();
                  }}
                  className="flex-1"
                >
                  <RefreshCw className="w-5 h-5" />
                  {t("actions.retry")}
                </Button>
              </div>

              <button
                onClick={() => console.log("Contact support")}
                className="mt-4 text-sm text-[var(--primary)] hover:text-[var(--primary-hover)] font-medium transition-colors"
              >
                {t("error_states.contact_support")}
              </button>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}

// Inline Error Component (for forms, etc.)
interface InlineErrorProps {
  message: string;
  onRetry?: () => void;
}

export function InlineError({ message, onRetry }: InlineErrorProps) {
  const { t } = useTranslation("common");
  return (
    <div className="flex items-start gap-3 p-4 bg-[var(--danger-light)] border border-[var(--danger)] rounded-[var(--radius-lg)]">
      <AlertTriangle className="w-5 h-5 text-[var(--danger)] flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        <p className="text-sm text-[var(--text-primary)]">{message}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="mt-2 text-sm text-[var(--danger)] hover:text-[var(--danger)]/80 font-medium transition-colors"
          >
            {t("actions.retry")}
          </button>
        )}
      </div>
    </div>
  );
}

// Banner Error Component (top of page)
interface BannerErrorProps {
  message: string;
  onDismiss?: () => void;
  onAction?: {
    label: string;
    onClick: () => void;
  };
}

export function BannerError({
  message,
  onDismiss,
  onAction,
}: BannerErrorProps) {
  return (
    <div className="bg-[var(--danger)] text-white">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm font-medium">{message}</p>
          </div>

          <div className="flex items-center gap-2">
            {onAction && (
              <button
                onClick={onAction.onClick}
                className="px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-[var(--radius-md)] text-sm font-medium transition-colors"
              >
                {onAction.label}
              </button>
            )}

            {onDismiss && (
              <button
                onClick={onDismiss}
                className="p-1 hover:bg-white/20 rounded-[var(--radius-md)] transition-colors"
              >
                <XCircle className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

import React, {
  useState,
  useRef,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import {
  RefreshCw,
  BarChart3,
  Target,
  MoreVertical,
  Check,
  CheckCheck,
  PartyPopper,
  ArrowLeft,
  Trash2,
  Settings,
  XCircle,
  SquareCheck,
  Square,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "../components/Button";
import { SwipeableRow } from "../components/SwipeableRow";
import { ConfirmationModal } from "../components/ConfirmationModals";
import {
  useNotifications,
  AppNotification,
} from "../contexts/NotificationContext";
import { useToast } from "../contexts/ToastContext";
import { recurringService } from "../services/recurringService";
import { useAppNavigation } from "../hooks/useAppNavigation";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";

// ── Helpers ───────────────────────────────────────────────────────────────────

function timeAgo(dateStr: string, t: TFunction): string {
  const now = Date.now();
  const diff = now - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return t("notifications_inbox.time_ago.just_now");
  if (mins < 60) return t("notifications_inbox.time_ago.minutes", { n: mins });
  const hours = Math.floor(mins / 60);
  if (hours < 24) return t("notifications_inbox.time_ago.hours", { n: hours });
  const days = Math.floor(hours / 24);
  if (days < 7) return t("notifications_inbox.time_ago.days", { n: days });
  return new Date(dateStr).toLocaleDateString();
}

function getDateGroup(dateStr: string): "today" | "yesterday" | "earlier" {
  const now = new Date();
  const d = new Date(dateStr);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const target = new Date(d.getFullYear(), d.getMonth(), d.getDate());

  if (target.getTime() === today.getTime()) return "today";
  if (target.getTime() === yesterday.getTime()) return "yesterday";
  return "earlier";
}

const GROUP_LABELS: Record<string, string> = {
  today: "notifications_inbox.group_labels.today",
  yesterday: "notifications_inbox.group_labels.yesterday",
  earlier: "notifications_inbox.group_labels.earlier",
};

function getNotifIcon(type: AppNotification["type"]) {
  switch (type) {
    case "recurring-due":
      return <RefreshCw className="w-5 h-5" />;
    case "budget-alert":
      return <BarChart3 className="w-5 h-5" />;
    case "goal-reminder":
      return <Target className="w-5 h-5" />;
    case "goal-withdrawal-alert":
      return <Target className="w-5 h-5" />;
  }
}

function getNotifColor(type: AppNotification["type"]) {
  switch (type) {
    case "recurring-due":
      return "bg-[var(--primary-light)] text-[var(--primary)]";
    case "budget-alert":
      return "bg-[var(--warning-light)] text-[var(--warning)]";
    case "goal-reminder":
      return "bg-[var(--success-light)] text-[var(--success)]";
    case "goal-withdrawal-alert":
      return "bg-[var(--danger-light)] text-[var(--danger)]";
  }
}

// ── Header Action Menu ────────────────────────────────────────────────────────

function HeaderMenu({
  onMarkAllRead,
  onClearAllRead,
  onGoSettings,
  onToggleBulkSelect,
  hasRead,
  hasNotifications,
  bulkMode,
}: {
  onMarkAllRead: () => void;
  onClearAllRead: () => void;
  onGoSettings: () => void;
  onToggleBulkSelect: () => void;
  hasRead: boolean;
  hasNotifications: boolean;
  bulkMode: boolean;
}) {
  const { t } = useTranslation("community");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="p-2 rounded-[var(--radius-md)] hover:bg-[var(--surface)] transition-colors"
      >
        <MoreVertical className="w-5 h-5 text-[var(--text-secondary)]" />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 w-56 bg-[var(--card)] border border-[var(--border)] rounded-[var(--radius-lg)] shadow-lg z-50 py-1">
          {hasNotifications && (
            <button
              onClick={() => {
                onToggleBulkSelect();
                setOpen(false);
              }}
              className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-[var(--text-primary)] hover:bg-[var(--surface)] transition-colors"
            >
              <SquareCheck className="w-4 h-4 text-[var(--text-secondary)]" />
              {bulkMode
                ? t("notifications_inbox.header_menu.bulk_cancel")
                : t("notifications_inbox.header_menu.bulk_select")}
            </button>
          )}
          <button
            onClick={() => {
              onMarkAllRead();
              setOpen(false);
            }}
            className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-[var(--text-primary)] hover:bg-[var(--surface)] transition-colors"
          >
            <CheckCheck className="w-4 h-4 text-[var(--text-secondary)]" />
            {t("notifications_inbox.header_menu.mark_all_read")}
          </button>
          {hasRead && (
            <button
              onClick={() => {
                onClearAllRead();
                setOpen(false);
              }}
              className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-[var(--danger)] hover:bg-[var(--danger-light)] transition-colors"
            >
              <XCircle className="w-4 h-4" />
              {t("notifications_inbox.header_menu.clear_read")}
            </button>
          )}
          <div className="border-t border-[var(--border)] my-1" />
          <button
            onClick={() => {
              onGoSettings();
              setOpen(false);
            }}
            className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-[var(--text-primary)] hover:bg-[var(--surface)] transition-colors"
          >
            <Settings className="w-4 h-4 text-[var(--text-secondary)]" />
            {t("notifications_inbox.header_menu.settings")}
          </button>
        </div>
      )}
    </div>
  );
}

// ── Notification Card ─────────────────────────────────────────────────────────

interface NotificationCardProps {
  notification: AppNotification;
  onMarkRead: () => void;
  onDelete: () => void;
  onPrimaryAction: () => void;
  onSecondaryAction?: () => void;
  primaryLabel: string;
  secondaryLabel?: string;
  bulkMode: boolean;
  selected: boolean;
  onToggleSelect: () => void;
}

function NotificationCard({
  notification,
  onMarkRead,
  onDelete,
  onPrimaryAction,
  onSecondaryAction,
  primaryLabel,
  secondaryLabel,
  bulkMode,
  selected,
  onToggleSelect,
}: NotificationCardProps) {
  const { t } = useTranslation("community");
  const swipeActions = bulkMode
    ? []
    : [
        ...(!notification.read
          ? [
              {
                icon: <Check className="w-5 h-5" />,
                label: t("notifications_inbox.swipe_actions.mark_read"),
                color: "#FFFFFF",
                bgColor: "var(--primary)",
                onClick: onMarkRead,
              },
            ]
          : []),
        {
          icon: <Trash2 className="w-5 h-5" />,
          label: t("notifications_inbox.swipe_actions.delete"),
          color: "#FFFFFF",
          bgColor: "var(--danger)",
          onClick: onDelete,
        },
      ];

  const cardContent = (
    <div
      onClick={bulkMode ? onToggleSelect : undefined}
      className={`relative p-4 border transition-colors rounded-[var(--radius-lg)] ${
        bulkMode ? "cursor-pointer" : ""
      } ${
        selected
          ? "bg-[var(--primary-light)] border-[var(--primary)] ring-1 ring-[var(--primary)]"
          : notification.read
            ? "bg-[var(--surface)] border-[var(--border)] opacity-70"
            : "bg-[var(--card)] border-[var(--border)] shadow-sm"
      }`}
    >
      {/* Unread dot */}
      {!notification.read && !bulkMode && (
        <span className="absolute top-4 right-4 w-2.5 h-2.5 rounded-full bg-[var(--primary)]" />
      )}

      <div className="flex items-start gap-3">
        {/* Bulk checkbox */}
        {bulkMode && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleSelect();
            }}
            className="flex-shrink-0 mt-0.5"
          >
            {selected ? (
              <SquareCheck className="w-5 h-5 text-[var(--primary)]" />
            ) : (
              <Square className="w-5 h-5 text-[var(--text-tertiary)]" />
            )}
          </button>
        )}

        {/* Icon */}
        <div
          className={`flex-shrink-0 w-10 h-10 rounded-[var(--radius-lg)] flex items-center justify-center ${getNotifColor(notification.type)}`}
        >
          {getNotifIcon(notification.type)}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <h4 className="font-semibold text-[var(--text-primary)] text-sm truncate pr-4">
              {notification.title}
            </h4>
          </div>
          <p className="text-xs text-[var(--text-secondary)] mb-3">
            {notification.subtitle}
          </p>

          {!bulkMode && (
            <div className="flex items-center gap-2 flex-wrap">
              <Button onClick={onPrimaryAction} className="text-xs px-3 py-1.5">
                {primaryLabel}
              </Button>
              {secondaryLabel && onSecondaryAction && (
                <Button
                  variant="secondary"
                  onClick={onSecondaryAction}
                  className="text-xs px-3 py-1.5"
                >
                  {secondaryLabel}
                </Button>
              )}

              {/* Desktop actions */}
              <div className="hidden md:flex items-center gap-2 ml-auto">
                {!notification.read && (
                  <button
                    onClick={onMarkRead}
                    className="text-xs text-[var(--text-tertiary)] hover:text-[var(--primary)] flex items-center gap-1 transition-colors"
                  >
                    <Check className="w-3.5 h-3.5" />
                    {t("notifications_inbox.card.mark_read")}
                  </button>
                )}
                <button
                  onClick={onDelete}
                  className="text-xs text-[var(--text-tertiary)] hover:text-[var(--danger)] flex items-center gap-1 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  {t("notifications_inbox.card.delete")}
                </button>
              </div>

              {/* Mobile mark-read */}
              {!notification.read && (
                <button
                  onClick={onMarkRead}
                  className="ml-auto text-xs text-[var(--text-tertiary)] hover:text-[var(--primary)] flex items-center gap-1 transition-colors md:hidden"
                >
                  <Check className="w-3.5 h-3.5" />
                  {t("notifications_inbox.card.mark_read")}
                </button>
              )}
            </div>
          )}

          <p className="text-[10px] text-[var(--text-tertiary)] mt-2">
            {timeAgo(notification.createdAt, t)}
          </p>
        </div>
      </div>
    </div>
  );

  if (bulkMode) {
    return cardContent;
  }

  return (
    <SwipeableRow
      actions={swipeActions}
      className="rounded-[var(--radius-lg)] overflow-hidden"
    >
      {cardContent}
    </SwipeableRow>
  );
}

// ── Bulk Action Toolbar ───────────────────────────────────────────────────────

function BulkToolbar({
  selectedCount,
  totalCount,
  onSelectAll,
  onDeselectAll,
  onMarkRead,
  onDelete,
  onCancel,
}: {
  selectedCount: number;
  totalCount: number;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onMarkRead: () => void;
  onDelete: () => void;
  onCancel: () => void;
}) {
  const { t } = useTranslation("community");
  const allSelected = selectedCount === totalCount && totalCount > 0;

  return (
    <motion.div
      initial={{ y: 80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 80, opacity: 0 }}
      transition={{ type: "spring", damping: 25, stiffness: 300 }}
      className="fixed bottom-0 left-0 right-0 z-50 md:bottom-4 md:left-1/2 md:-translate-x-1/2 md:max-w-lg md:rounded-[var(--radius-xl)]"
    >
      <div className="bg-[var(--card)] border-t md:border border-[var(--border)] shadow-[var(--shadow-lg)] px-4 py-3 md:rounded-[var(--radius-xl)]">
        <div className="flex items-center gap-3">
          {/* Select info */}
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <button
              onClick={allSelected ? onDeselectAll : onSelectAll}
              className="flex-shrink-0 p-1"
            >
              {allSelected ? (
                <SquareCheck className="w-5 h-5 text-[var(--primary)]" />
              ) : (
                <Square className="w-5 h-5 text-[var(--text-tertiary)]" />
              )}
            </button>
            <span className="text-sm font-medium text-[var(--text-primary)] truncate">
              {t("notifications_inbox.bulk_toolbar.selected_count", {
                count: selectedCount,
              })}
            </span>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={onMarkRead}
              disabled={selectedCount === 0}
              className="flex items-center gap-1.5 px-3 py-2 rounded-[var(--radius-md)] text-sm font-medium text-[var(--primary)] bg-[var(--primary-light)] hover:opacity-80 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <CheckCheck className="w-4 h-4" />
              <span className="hidden sm:inline">
                {t("notifications_inbox.bulk_toolbar.mark_read")}
              </span>
            </button>
            <button
              onClick={onDelete}
              disabled={selectedCount === 0}
              className="flex items-center gap-1.5 px-3 py-2 rounded-[var(--radius-md)] text-sm font-medium text-[var(--danger)] bg-[var(--danger-light)] hover:opacity-80 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Trash2 className="w-4 h-4" />
              <span className="hidden sm:inline">
                {t("notifications_inbox.bulk_toolbar.delete")}
              </span>
            </button>
            <button
              onClick={onCancel}
              className="p-2 rounded-[var(--radius-md)] text-[var(--text-secondary)] hover:bg-[var(--surface)] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function NotificationsInbox() {
  const nav = useAppNavigation();
  const { t } = useTranslation("community");
  const toast = useToast();
  const {
    notifications,
    markAsRead,
    markAsReadMultiple,
    markAllAsRead,
    removeNotification,
    removeNotifications,
    clearAllRead,
  } = useNotifications();
  const [tab, setTab] = useState<"unread" | "all">("unread");
  const [showClearModal, setShowClearModal] = useState(false);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);

  // ── Bulk select state ────────────────────────────────────────────
  const [bulkMode, setBulkMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const toggleBulkMode = useCallback(() => {
    setBulkMode((prev) => {
      if (prev) setSelectedIds(new Set());
      return !prev;
    });
  }, []);

  const exitBulkMode = useCallback(() => {
    setBulkMode(false);
    setSelectedIds(new Set());
  }, []);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  // ── Derived data ─────────────────────────────────────────────────
  const filtered =
    tab === "unread" ? notifications.filter((n) => !n.read) : notifications;

  const unreadCount = notifications.filter((n) => !n.read).length;
  const readCount = notifications.filter((n) => n.read).length;

  const selectAll = useCallback(() => {
    setSelectedIds(new Set(filtered.map((n) => n.id)));
  }, [filtered]);

  const deselectAll = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  // Group notifications by date
  const grouped = useMemo(() => {
    const sorted = [...filtered].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    const groupOrder = ["today", "yesterday", "earlier"] as const;
    const buckets: Record<string, AppNotification[]> = {
      today: [],
      yesterday: [],
      earlier: [],
    };

    for (const n of sorted) {
      buckets[getDateGroup(n.createdAt)].push(n);
    }

    const groups: { key: string; label: string; items: AppNotification[] }[] =
      [];
    for (const key of groupOrder) {
      if (buckets[key].length > 0) {
        groups.push({ key, label: t(GROUP_LABELS[key]), items: buckets[key] });
      }
    }
    return groups;
  }, [filtered]);

  // ── Handlers ─────────────────────────────────────────────────────
  const handleMarkAllRead = () => {
    markAllAsRead();
    toast.success(t("notifications_inbox.toasts.mark_all_read"));
  };

  const handleClearAllRead = () => {
    setShowClearModal(true);
  };

  const confirmClearAllRead = () => {
    clearAllRead();
    toast.success(t("notifications_inbox.toasts.clear_all_read"));
    setShowClearModal(false);
  };

  const handleDelete = (notif: AppNotification) => {
    removeNotification(notif.id);
    toast.success(t("notifications_inbox.toasts.delete_single"));
  };

  // ── Bulk action handlers ─────────────────────────────────────────
  const handleBulkMarkRead = () => {
    if (selectedIds.size === 0) return;
    markAsReadMultiple(Array.from(selectedIds));
    toast.success(
      t("notifications_inbox.toasts.bulk_mark_read", {
        count: selectedIds.size,
      }),
    );
    exitBulkMode();
  };

  const handleBulkDeleteRequest = () => {
    if (selectedIds.size === 0) return;
    setShowBulkDeleteModal(true);
  };

  const confirmBulkDelete = () => {
    const count = selectedIds.size;
    removeNotifications(Array.from(selectedIds));
    toast.success(t("notifications_inbox.toasts.bulk_delete", { count }));
    setShowBulkDeleteModal(false);
    exitBulkMode();
  };

  // ── Per-type CTA handlers ────────────────────────────────────────

  const handleRecurringConfirm = async (notif: AppNotification) => {
    if (!notif.recurringRuleId) {
      toast.info(t("notifications_inbox.toasts.recurring_no_rule"));
      markAsRead(notif.id);
      return;
    }
    try {
      await recurringService.runRecurringRuleNow(notif.recurringRuleId);
      toast.success(t("notifications_inbox.toasts.recurring_created"));
      markAsRead(notif.id);
    } catch {
      toast.error(t("notifications_inbox.toasts.recurring_confirm_error"));
    }
  };

  const handleRecurringSkip = async (notif: AppNotification) => {
    if (!notif.recurringRuleId) {
      markAsRead(notif.id);
      return;
    }
    try {
      await recurringService.skipNextOccurrence(notif.recurringRuleId);
      toast.success(t("notifications_inbox.toasts.recurring_skip_success"));
      markAsRead(notif.id);
    } catch {
      toast.error(t("notifications_inbox.toasts.recurring_skip_error"));
    }
  };

  const handleBudgetView = (notif: AppNotification) => {
    markAsRead(notif.id);
    if (notif.budgetId) {
      nav.goBudgetDetail(notif.budgetId);
    } else {
      nav.goBudgets();
    }
  };

  const handleGoalContribute = (notif: AppNotification) => {
    markAsRead(notif.id);
    if (notif.goalId) {
      nav.goAddGoalContribution(notif.goalId);
    } else {
      nav.goGoals();
    }
  };

  const renderCard = (notif: AppNotification) => {
    const commonProps = {
      notification: notif,
      onMarkRead: () => markAsRead(notif.id),
      onDelete: () => handleDelete(notif),
      bulkMode,
      selected: selectedIds.has(notif.id),
      onToggleSelect: () => toggleSelect(notif.id),
    };

    switch (notif.type) {
      case "recurring-due":
        return (
          <NotificationCard
            key={notif.id}
            {...commonProps}
            primaryLabel={t("notifications_inbox.actions.recurring_confirm")}
            secondaryLabel={t("notifications_inbox.actions.recurring_skip")}
            onPrimaryAction={() => handleRecurringConfirm(notif)}
            onSecondaryAction={() => handleRecurringSkip(notif)}
          />
        );
      case "budget-alert":
        return (
          <NotificationCard
            key={notif.id}
            {...commonProps}
            primaryLabel={t("notifications_inbox.actions.budget_view")}
            onPrimaryAction={() => handleBudgetView(notif)}
          />
        );
      case "goal-reminder":
        return (
          <NotificationCard
            key={notif.id}
            {...commonProps}
            primaryLabel={t("notifications_inbox.actions.goal_contribute")}
            onPrimaryAction={() => handleGoalContribute(notif)}
          />
        );
      case "goal-withdrawal-alert":
        return (
          <NotificationCard
            key={notif.id}
            {...commonProps}
            primaryLabel={t("notifications_inbox.actions.goal_view")}
            onPrimaryAction={() => {
              markAsRead(notif.id);
              if (notif.goalId) nav.goGoalDetail(notif.goalId);
              else nav.goGoals();
            }}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div
        className={`max-w-3xl mx-auto p-4 md:p-6 ${bulkMode ? "pb-28" : "pb-20"} md:pb-6 space-y-6`}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => nav.goBack()}
              className="p-2 rounded-[var(--radius-md)] hover:bg-[var(--surface)] transition-colors md:hidden"
            >
              <ArrowLeft className="w-5 h-5 text-[var(--text-secondary)]" />
            </button>
            <div>
              <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
                {t("notifications_inbox.title")}
              </h1>
              <p className="text-sm text-[var(--text-secondary)] mt-0.5">
                {bulkMode
                  ? t("notifications_inbox.subtitle.selected", {
                      count: selectedIds.size,
                    })
                  : unreadCount > 0
                    ? t("notifications_inbox.subtitle.unread", {
                        count: unreadCount,
                      })
                    : t("notifications_inbox.subtitle.all_read")}
              </p>
            </div>
          </div>
          <HeaderMenu
            onMarkAllRead={handleMarkAllRead}
            onClearAllRead={handleClearAllRead}
            onGoSettings={() => nav.goNotificationSettings()}
            onToggleBulkSelect={toggleBulkMode}
            hasRead={readCount > 0}
            hasNotifications={notifications.length > 0}
            bulkMode={bulkMode}
          />
        </div>

        {/* Swipe hint (mobile only, not in bulk mode) */}
        {!bulkMode && (
          <p className="text-[10px] text-[var(--text-tertiary)] text-center md:hidden">
            {t("notifications_inbox.swipe_hint")}
          </p>
        )}

        {/* Bulk mode hint */}
        {bulkMode && (
          <div className="flex items-center gap-3 px-4 py-3 bg-[var(--primary-light)] border border-[var(--primary)] rounded-[var(--radius-lg)]">
            <SquareCheck className="w-5 h-5 text-[var(--primary)] flex-shrink-0" />
            <p className="text-sm text-[var(--primary)]">
              {t("notifications_inbox.bulk_mode_hint")}
            </p>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-[var(--surface)] rounded-[var(--radius-lg)]">
          <button
            onClick={() => {
              setTab("unread");
              if (bulkMode) exitBulkMode();
            }}
            className={`flex-1 py-2.5 rounded-[var(--radius-md)] text-sm font-medium transition-all ${
              tab === "unread"
                ? "bg-[var(--card)] text-[var(--text-primary)] shadow-sm"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            {t("notifications_inbox.tabs.unread")}
            {unreadCount > 0 && (
              <span className="ml-1.5 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-[var(--danger)] text-white text-[10px] font-bold">
                {unreadCount}
              </span>
            )}
          </button>
          <button
            onClick={() => {
              setTab("all");
              if (bulkMode) exitBulkMode();
            }}
            className={`flex-1 py-2.5 rounded-[var(--radius-md)] text-sm font-medium transition-all ${
              tab === "all"
                ? "bg-[var(--card)] text-[var(--text-primary)] shadow-sm"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            {t("notifications_inbox.tabs.all")}
          </button>
        </div>

        {/* List — grouped by date with AnimatePresence */}
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--success-light)] flex items-center justify-center">
              <PartyPopper className="w-8 h-8 text-[var(--success)]" />
            </div>
            <h3 className="font-semibold text-[var(--text-primary)] mb-1">
              {tab === "unread"
                ? t("notifications_inbox.empty.unread_title")
                : t("notifications_inbox.empty.all_title")}
            </h3>
            <p className="text-sm text-[var(--text-secondary)]">
              {t("notifications_inbox.empty.subtitle")}
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {grouped.map((group) => (
              <div key={group.key}>
                {/* Date group header */}
                <div className="flex items-center gap-3 mb-3">
                  <h3 className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">
                    {group.label}
                  </h3>
                  <div className="flex-1 h-px bg-[var(--border)]" />
                  <span className="text-[10px] text-[var(--text-tertiary)] tabular-nums">
                    {group.items.length}
                  </span>
                </div>
                <AnimatePresence mode="popLayout">
                  {group.items.map((notif) => (
                    <motion.div
                      key={notif.id}
                      layout
                      initial={{ opacity: 1, scale: 1 }}
                      exit={{
                        opacity: 0,
                        scale: 0.95,
                        height: 0,
                        marginBottom: 0,
                      }}
                      transition={{ duration: 0.25, ease: "easeOut" }}
                      className="mb-3 last:mb-0"
                    >
                      {renderCard(notif)}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            ))}
          </div>
        )}

        {/* Clear all read — inline banner when on "all" tab */}
        {tab === "all" && readCount > 0 && !bulkMode && (
          <div className="flex items-center justify-center gap-3 py-4">
            <button
              onClick={handleClearAllRead}
              className="flex items-center gap-2 px-4 py-2 rounded-[var(--radius-lg)] border border-[var(--border)] text-sm text-[var(--text-secondary)] hover:text-[var(--danger)] hover:border-[var(--danger)] transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              {t("notifications_inbox.clear_read_button", { count: readCount })}
            </button>
          </div>
        )}

        {/* Clear confirmation modal */}
        <ConfirmationModal
          isOpen={showClearModal}
          onClose={() => setShowClearModal(false)}
          onConfirm={confirmClearAllRead}
          title={t("notifications_inbox.clear_modal.title")}
          description={t("notifications_inbox.clear_modal.description", {
            count: readCount,
          })}
          confirmLabel={t("notifications_inbox.clear_modal.confirm")}
          cancelLabel={t("notifications_inbox.clear_modal.cancel")}
          isDangerous
        />

        {/* Bulk delete confirmation modal */}
        <ConfirmationModal
          isOpen={showBulkDeleteModal}
          onClose={() => setShowBulkDeleteModal(false)}
          onConfirm={confirmBulkDelete}
          title={t("notifications_inbox.bulk_delete_modal.title", {
            count: selectedIds.size,
          })}
          description={t("notifications_inbox.bulk_delete_modal.description", {
            count: selectedIds.size,
          })}
          confirmLabel={t("notifications_inbox.bulk_delete_modal.confirm")}
          cancelLabel={t("notifications_inbox.bulk_delete_modal.cancel")}
          isDangerous
        />
      </div>

      {/* Bulk select floating toolbar */}
      <AnimatePresence>
        {bulkMode && (
          <BulkToolbar
            selectedCount={selectedIds.size}
            totalCount={filtered.length}
            onSelectAll={selectAll}
            onDeselectAll={deselectAll}
            onMarkRead={handleBulkMarkRead}
            onDelete={handleBulkDeleteRequest}
            onCancel={exitBulkMode}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

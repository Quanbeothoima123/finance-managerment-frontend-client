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

// ── Helpers ───────────────────────────────────────────────────────────────────

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const diff = now - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Vừa xong";
  if (mins < 60) return `${mins} phút trước`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} ngày trước`;
  return new Date(dateStr).toLocaleDateString("vi-VN");
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
  today: "Hôm nay",
  yesterday: "Hôm qua",
  earlier: "Trước đó",
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
              {bulkMode ? "Huỷ chọn nhiều" : "Chọn nhiều"}
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
            Đánh dấu đã đọc tất cả
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
              Xoá tất cả đã đọc
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
            Cài đặt thông báo
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
  const swipeActions = bulkMode
    ? []
    : [
        ...(!notification.read
          ? [
              {
                icon: <Check className="w-5 h-5" />,
                label: "Đã đọc",
                color: "#FFFFFF",
                bgColor: "var(--primary)",
                onClick: onMarkRead,
              },
            ]
          : []),
        {
          icon: <Trash2 className="w-5 h-5" />,
          label: "Xoá",
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
                    Đã đọc
                  </button>
                )}
                <button
                  onClick={onDelete}
                  className="text-xs text-[var(--text-tertiary)] hover:text-[var(--danger)] flex items-center gap-1 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Xoá
                </button>
              </div>

              {/* Mobile mark-read */}
              {!notification.read && (
                <button
                  onClick={onMarkRead}
                  className="ml-auto text-xs text-[var(--text-tertiary)] hover:text-[var(--primary)] flex items-center gap-1 transition-colors md:hidden"
                >
                  <Check className="w-3.5 h-3.5" />
                  Đã đọc
                </button>
              )}
            </div>
          )}

          <p className="text-[10px] text-[var(--text-tertiary)] mt-2">
            {timeAgo(notification.createdAt)}
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
              {selectedCount} đã chọn
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
              <span className="hidden sm:inline">Đã đọc</span>
            </button>
            <button
              onClick={onDelete}
              disabled={selectedCount === 0}
              className="flex items-center gap-1.5 px-3 py-2 rounded-[var(--radius-md)] text-sm font-medium text-[var(--danger)] bg-[var(--danger-light)] hover:opacity-80 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Trash2 className="w-4 h-4" />
              <span className="hidden sm:inline">Xoá</span>
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
        groups.push({ key, label: GROUP_LABELS[key], items: buckets[key] });
      }
    }
    return groups;
  }, [filtered]);

  // ── Handlers ─────────────────────────────────────────────────────
  const handleMarkAllRead = () => {
    markAllAsRead();
    toast.success("Đánh dấu đã đọc tất cả");
  };

  const handleClearAllRead = () => {
    setShowClearModal(true);
  };

  const confirmClearAllRead = () => {
    clearAllRead();
    toast.success("Đã xoá tất cả thông báo đã đọc");
    setShowClearModal(false);
  };

  const handleDelete = (notif: AppNotification) => {
    removeNotification(notif.id);
    toast.success("Đã xoá thông báo");
  };

  // ── Bulk action handlers ─────────────────────────────────────────
  const handleBulkMarkRead = () => {
    if (selectedIds.size === 0) return;
    markAsReadMultiple(Array.from(selectedIds));
    toast.success(`Đánh dấu đã đọc ${selectedIds.size} thông báo`);
    exitBulkMode();
  };

  const handleBulkDeleteRequest = () => {
    if (selectedIds.size === 0) return;
    setShowBulkDeleteModal(true);
  };

  const confirmBulkDelete = () => {
    const count = selectedIds.size;
    removeNotifications(Array.from(selectedIds));
    toast.success(`Đã xoá ${count} thông báo`);
    setShowBulkDeleteModal(false);
    exitBulkMode();
  };

  // ── Per-type CTA handlers ────────────────────────────────────────

  const handleRecurringConfirm = async (notif: AppNotification) => {
    if (!notif.recurringRuleId) {
      toast.info("Quy tắc không tồn tại");
      markAsRead(notif.id);
      return;
    }
    try {
      await recurringService.runRecurringRuleNow(notif.recurringRuleId);
      toast.success("Đã tạo giao dịch");
      markAsRead(notif.id);
    } catch {
      toast.error("Không thể tạo giao dịch");
    }
  };

  const handleRecurringSkip = async (notif: AppNotification) => {
    if (!notif.recurringRuleId) {
      markAsRead(notif.id);
      return;
    }
    try {
      await recurringService.skipNextOccurrence(notif.recurringRuleId);
      toast.success("Đã bỏ qua lần chạy");
      markAsRead(notif.id);
    } catch {
      toast.error("Không thể bỏ qua lần chạy");
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
            primaryLabel="Xác nhận"
            secondaryLabel="Bỏ qua"
            onPrimaryAction={() => handleRecurringConfirm(notif)}
            onSecondaryAction={() => handleRecurringSkip(notif)}
          />
        );
      case "budget-alert":
        return (
          <NotificationCard
            key={notif.id}
            {...commonProps}
            primaryLabel="Xem ngân sách"
            onPrimaryAction={() => handleBudgetView(notif)}
          />
        );
      case "goal-reminder":
        return (
          <NotificationCard
            key={notif.id}
            {...commonProps}
            primaryLabel="Thêm đóng góp"
            onPrimaryAction={() => handleGoalContribute(notif)}
          />
        );
      case "goal-withdrawal-alert":
        return (
          <NotificationCard
            key={notif.id}
            {...commonProps}
            primaryLabel="Xem mục tiêu"
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
                Thông báo
              </h1>
              <p className="text-sm text-[var(--text-secondary)] mt-0.5">
                {bulkMode
                  ? `${selectedIds.size} đã chọn`
                  : unreadCount > 0
                    ? `${unreadCount} chưa đọc`
                    : "Không có thông báo mới"}
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
            Vuốt sang trái để đánh dấu đã đọc hoặc xoá
          </p>
        )}

        {/* Bulk mode hint */}
        {bulkMode && (
          <div className="flex items-center gap-3 px-4 py-3 bg-[var(--primary-light)] border border-[var(--primary)] rounded-[var(--radius-lg)]">
            <SquareCheck className="w-5 h-5 text-[var(--primary)] flex-shrink-0" />
            <p className="text-sm text-[var(--primary)]">
              Chạm vào thông báo để chọn. Dùng thanh công cụ bên dưới để thực
              hiện hành động.
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
            Chưa đọc
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
            Tất cả
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
                ? "Không có thông báo mới"
                : "Chưa có thông báo nào"}
            </h3>
            <p className="text-sm text-[var(--text-secondary)]">
              Bạn đã cập nhật xong rồi!
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
              Xoá {readCount} thông báo đã đọc
            </button>
          </div>
        )}

        {/* Clear confirmation modal */}
        <ConfirmationModal
          isOpen={showClearModal}
          onClose={() => setShowClearModal(false)}
          onConfirm={confirmClearAllRead}
          title="Xoá tất cả thông báo đã đọc?"
          description={`${readCount} thông báo đã đọc sẽ bị xoá vĩnh viễn. Thao tác này không thể hoàn tác.`}
          confirmLabel="Xoá tất cả"
          cancelLabel="Huỷ"
          isDangerous
        />

        {/* Bulk delete confirmation modal */}
        <ConfirmationModal
          isOpen={showBulkDeleteModal}
          onClose={() => setShowBulkDeleteModal(false)}
          onConfirm={confirmBulkDelete}
          title={`Xoá ${selectedIds.size} thông báo?`}
          description={`${selectedIds.size} thông báo đã chọn sẽ bị xoá vĩnh viễn. Thao tác này không thể hoàn tác.`}
          confirmLabel="Xoá"
          cancelLabel="Huỷ"
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

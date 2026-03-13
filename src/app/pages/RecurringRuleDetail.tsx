import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router";
import {
  ArrowLeft,
  ArrowRightLeft,
  Bell,
  BellOff,
  Calendar,
  CheckCircle2,
  Clock,
  Edit,
  Eye,
  Folder,
  MoreVertical,
  Play,
  SkipForward,
  Trash2,
  TrendingDown,
  TrendingUp,
  Wallet,
  XCircle,
  Zap,
} from "lucide-react";
import { Card } from "../components/Card";
import { Button } from "../components/Button";
import { ConfirmationModal } from "../components/ConfirmationModals";
import { useAppNavigation } from "../hooks/useAppNavigation";
import { useToast } from "../contexts/ToastContext";
import { useRecurringDetail } from "../hooks/useRecurringDetail";
import { recurringService } from "../services/recurringService";
import type {
  RecurringOccurrenceItem,
  RecurringRuleItem,
} from "../types/recurring";

function getFrequencyLabel(rule: RecurringRuleItem): string {
  switch (rule.frequency) {
    case "daily":
      return rule.dailyInterval && rule.dailyInterval > 1
        ? `Mỗi ${rule.dailyInterval} ngày`
        : "Hàng ngày";
    case "weekly": {
      const dayNames = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
      const days = (rule.weeklyDays || [])
        .map((day) => dayNames[day])
        .join(", ");
      return days ? `Hàng tuần (${days})` : "Hàng tuần";
    }
    case "monthly":
      return rule.monthlyMode === "last"
        ? "Hàng tháng (ngày cuối)"
        : `Hàng tháng (ngày ${rule.monthlyDay || 1})`;
    case "yearly": {
      const months = [
        "Th1",
        "Th2",
        "Th3",
        "Th4",
        "Th5",
        "Th6",
        "Th7",
        "Th8",
        "Th9",
        "Th10",
        "Th11",
        "Th12",
      ];
      return `Hàng năm (${months[rule.yearlyMonth || 0]} ngày ${rule.yearlyDay || 1})`;
    }
    default:
      return rule.frequency;
  }
}

function getEndConditionLabel(rule: RecurringRuleItem): string {
  switch (rule.endCondition) {
    case "on-date":
      return rule.endDate
        ? `Đến ${formatDateShort(rule.endDate)}`
        : "Có ngày kết thúc";
    case "after-n":
      return `Sau ${rule.endAfterOccurrences || 0} lần (đã chạy ${rule.completedOccurrences || 0})`;
    default:
      return "Không kết thúc";
  }
}

function formatDateShort(dateStr?: string | null): string {
  if (!dateStr) return "--";
  const d = new Date(dateStr);
  return d.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatDateTime(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getDaysUntil(dateStr?: string | null): number {
  if (!dateStr) return Number.POSITIVE_INFINITY;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - today.getTime()) / 86400000);
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("vi-VN").format(Math.abs(amount || 0));
}

function getRuleTypeIcon(ruleType: string) {
  switch (ruleType) {
    case "income":
      return <TrendingUp className="w-7 h-7" />;
    case "transfer":
      return <ArrowRightLeft className="w-7 h-7" />;
    default:
      return <TrendingDown className="w-7 h-7" />;
  }
}

function getRuleTypeClasses(ruleType: string) {
  switch (ruleType) {
    case "income":
      return "bg-[var(--success-light)] text-[var(--success)]";
    case "transfer":
      return "bg-[var(--info-light)] text-[var(--info)]";
    default:
      return "bg-[var(--danger-light)] text-[var(--danger)]";
  }
}

function getStatusBadge(log: RecurringOccurrenceItem) {
  if (log.status === "created" || log.status === "confirmed") {
    return "bg-[var(--success-light)] text-[var(--success)]";
  }
  if (log.status === "skipped" || log.status === "cancelled") {
    return "bg-[var(--warning-light)] text-[var(--warning)]";
  }
  return "bg-[var(--danger-light)] text-[var(--danger)]";
}

function getStatusLabel(status: string) {
  switch (status) {
    case "created":
    case "confirmed":
      return "Đã tạo";
    case "skipped":
    case "cancelled":
      return "Bỏ qua";
    case "pending":
      return "Đang xử lý";
    default:
      return "Lỗi";
  }
}

export default function RecurringRuleDetail() {
  const { id } = useParams<{ id: string }>();
  const nav = useAppNavigation();
  const toast = useToast();
  const { data, loading, error, reload } = useRecurringDetail(id, Boolean(id));
  const rule = data?.rule;

  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showSkipModal, setShowSkipModal] = useState(false);
  const [showRunNowModal, setShowRunNowModal] = useState(false);
  const [showPauseModal, setShowPauseModal] = useState(false);
  const [processing, setProcessing] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    if (showMenu) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showMenu]);

  const history = useMemo(
    () =>
      [...(data?.executionHistory || [])].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      ),
    [data?.executionHistory],
  );
  const daysUntil = getDaysUntil(rule?.nextDate);
  const currencySymbol =
    rule?.currencyCode === "VND" ? "₫" : rule?.currencyCode || "";

  const runAction = async (
    action: () => Promise<unknown>,
    successMessage: string,
  ) => {
    try {
      setProcessing(true);
      await action();
      toast.success(successMessage);
      await reload();
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Không thể xử lý giao dịch định kỳ",
      );
    } finally {
      setProcessing(false);
      setShowPauseModal(false);
      setShowSkipModal(false);
      setShowRunNowModal(false);
      setShowDeleteModal(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--background)] p-4 md:p-6">
        <Card>
          <p className="text-[var(--text-secondary)]">
            Đang tải chi tiết giao dịch định kỳ...
          </p>
        </Card>
      </div>
    );
  }

  if (error || !rule) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-2">
            Không tìm thấy quy tắc
          </h2>
          <p className="text-[var(--text-secondary)] mb-6">
            {error || "Quy tắc này có thể đã bị xoá hoặc không tồn tại."}
          </p>
          <Button onClick={() => nav.goRecurringRules()} variant="secondary">
            <ArrowLeft className="w-5 h-5 mr-2" />
            Quay lại
          </Button>
        </div>
      </div>
    );
  }

  const handleToggle = async () => {
    if (rule.enabled) {
      setShowPauseModal(true);
      return;
    }

    await runAction(
      () => recurringService.resumeRecurringRule(rule.id),
      "Đã kích hoạt lại quy tắc định kỳ",
    );
  };

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="max-w-3xl mx-auto p-4 md:p-6 pb-20 md:pb-6 space-y-6">
        <div className="flex items-center justify-between">
          <button
            onClick={() => nav.goBack()}
            className="flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Quay lại</span>
          </button>

          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 rounded-[var(--radius-md)] hover:bg-[var(--surface)] transition-colors"
            >
              <MoreVertical className="w-5 h-5 text-[var(--text-secondary)]" />
            </button>

            {showMenu && (
              <div className="absolute right-0 top-10 w-48 bg-[var(--card)] border border-[var(--border)] rounded-[var(--radius-lg)] shadow-[var(--shadow-lg)] overflow-hidden z-50">
                <button
                  onClick={() => {
                    setShowMenu(false);
                    nav.goEditRecurringRule(rule.id);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-[var(--text-primary)] hover:bg-[var(--surface)] transition-colors"
                >
                  <Edit className="w-4 h-4" />
                  Chỉnh sửa
                </button>
                <button
                  onClick={() => {
                    setShowMenu(false);
                    setShowDeleteModal(true);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-[var(--danger)] hover:bg-[var(--danger-light)] transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Xoá quy tắc
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-start gap-4">
          <div
            className={`flex-shrink-0 w-14 h-14 rounded-[var(--radius-xl)] flex items-center justify-center ${getRuleTypeClasses(rule.type)}`}
          >
            {getRuleTypeIcon(rule.type)}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-semibold text-[var(--text-primary)]">
              {rule.name}
            </h1>
            <p className="text-sm text-[var(--text-secondary)] mt-0.5">
              {rule.description}
            </p>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                  rule.executionMode === "auto"
                    ? "bg-[var(--warning-light)] text-[var(--warning)]"
                    : "bg-[var(--info-light)] text-[var(--info)]"
                }`}
              >
                {rule.executionMode === "auto" ? (
                  <Zap className="w-3 h-3" />
                ) : (
                  <Bell className="w-3 h-3" />
                )}
                {rule.executionMode === "auto" ? "Tự tạo" : "Chỉ nhắc"}
              </span>
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                  rule.enabled
                    ? "bg-[var(--success-light)] text-[var(--success)]"
                    : "bg-[var(--border)] text-[var(--text-tertiary)]"
                }`}
              >
                {rule.enabled ? "Đang hoạt động" : "Tạm dừng"}
              </span>
            </div>
          </div>

          <button
            onClick={() => {
              void handleToggle();
            }}
            className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${
              rule.enabled ? "bg-[var(--success)]" : "bg-[var(--border)]"
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform shadow-sm ${
                rule.enabled ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        <Card>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-[var(--text-secondary)]">Số tiền</p>
            <p
              className={`text-2xl font-bold ${
                rule.type === "income"
                  ? "text-[var(--success)]"
                  : rule.type === "transfer"
                    ? "text-[var(--info)]"
                    : "text-[var(--danger)]"
              }`}
            >
              {rule.type === "income" ? "+" : "-"}
              {formatCurrency(rule.amount)}
              {currencySymbol}
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--text-secondary)] flex items-center gap-1.5">
                <Wallet className="w-3.5 h-3.5" /> Tài khoản
              </span>
              <span className="text-sm font-medium text-[var(--text-primary)]">
                {rule.account || "--"}
              </span>
            </div>

            {rule.category && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-[var(--text-secondary)] flex items-center gap-1.5">
                  <Folder className="w-3.5 h-3.5" /> Danh mục
                </span>
                <span className="text-sm font-medium text-[var(--text-primary)]">
                  {rule.category}
                </span>
              </div>
            )}

            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--text-secondary)]">
                Tần suất
              </span>
              <span className="text-sm font-medium text-[var(--text-primary)]">
                {getFrequencyLabel(rule)}
              </span>
            </div>

            {rule.startDate && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-[var(--text-secondary)]">
                  Bắt đầu từ
                </span>
                <span className="text-sm text-[var(--text-primary)]">
                  {formatDateShort(rule.startDate)}
                </span>
              </div>
            )}

            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--text-secondary)]">
                Kết thúc
              </span>
              <span className="text-sm text-[var(--text-primary)]">
                {getEndConditionLabel(rule)}
              </span>
            </div>

            <div className="border-t border-[var(--border)] my-2" />

            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--text-secondary)] flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" /> Lần chạy tiếp theo
              </span>
              <span className="text-sm font-medium text-[var(--text-primary)]">
                {rule.enabled ? (
                  <>
                    {formatDateShort(rule.nextDate)}
                    {daysUntil >= 0 && daysUntil <= 7 && (
                      <span className="ml-1 text-[var(--primary)]">
                        ({daysUntil === 0 ? "Hôm nay" : `${daysUntil} ngày nữa`}
                        )
                      </span>
                    )}
                  </>
                ) : (
                  <span className="text-[var(--text-tertiary)]">
                    -- (Tạm dừng)
                  </span>
                )}
              </span>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-3 gap-3">
          <Button
            variant="secondary"
            onClick={() => setShowSkipModal(true)}
            disabled={!rule.enabled || processing}
            className="text-sm"
          >
            <SkipForward className="w-4 h-4" />
            Bỏ qua
          </Button>
          <Button
            variant="secondary"
            onClick={() => setShowRunNowModal(true)}
            disabled={!rule.enabled || processing}
            className="text-sm"
          >
            <Play className="w-4 h-4" />
            Chạy ngay
          </Button>
          <Button
            variant="secondary"
            onClick={() => nav.goEditRecurringRule(rule.id)}
            className="text-sm"
          >
            <Edit className="w-4 h-4" />
            Chỉnh sửa
          </Button>
        </div>

        <Card>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-[var(--radius-lg)] flex items-center justify-center ${
                  rule.notifyEnabled !== false
                    ? "bg-[var(--primary-light)] text-[var(--primary)]"
                    : "bg-[var(--surface)] text-[var(--text-tertiary)]"
                }`}
              >
                {rule.notifyEnabled !== false ? (
                  <Bell className="w-5 h-5" />
                ) : (
                  <BellOff className="w-5 h-5" />
                )}
              </div>
              <div>
                <h4 className="font-medium text-[var(--text-primary)] text-sm">
                  Thông báo cho quy tắc này
                </h4>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                  {rule.notifyEnabled !== false
                    ? "Nhận nhắc nhở khi quy tắc đến hạn."
                    : "Không nhận thông báo cho quy tắc này."}
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                const newValue = rule.notifyEnabled === false;
                void runAction(
                  () =>
                    recurringService.updateRecurringRule(rule.id, {
                      notifyEnabled: newValue,
                    }),
                  newValue
                    ? "Đã bật thông báo cho quy tắc này"
                    : "Đã tắt thông báo cho quy tắc này",
                );
              }}
              className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${
                rule.notifyEnabled !== false
                  ? "bg-[var(--success)]"
                  : "bg-[var(--border)]"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform shadow-sm ${
                  rule.notifyEnabled !== false
                    ? "translate-x-5"
                    : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </Card>

        <Card>
          <h3 className="font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-[var(--primary)]" />
            Lịch sử thực thi
          </h3>

          {history.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 mx-auto bg-[var(--surface)] rounded-full flex items-center justify-center mb-3">
                <Clock className="w-6 h-6 text-[var(--text-tertiary)]" />
              </div>
              <p className="text-sm text-[var(--text-tertiary)]">
                Chưa có lần thực thi nào.
              </p>
            </div>
          ) : (
            <div className="space-y-0">
              {history.map((log, idx) => (
                <div
                  key={log.id}
                  className={`flex items-center gap-3 py-3 ${idx < history.length - 1 ? "border-b border-[var(--border)]" : ""}`}
                >
                  <div
                    className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${getStatusBadge(log)}`}
                  >
                    {(log.status === "created" ||
                      log.status === "confirmed") && (
                      <CheckCircle2 className="w-4 h-4" />
                    )}
                    {(log.status === "skipped" ||
                      log.status === "cancelled") && (
                      <SkipForward className="w-4 h-4" />
                    )}
                    {(log.status === "failed" || log.status === "pending") && (
                      <XCircle className="w-4 h-4" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-1.5 py-0.5 rounded text-xs font-medium ${getStatusBadge(log)}`}
                      >
                        {getStatusLabel(log.status)}
                      </span>
                      <span className="text-xs text-[var(--text-tertiary)]">
                        {formatDateTime(log.date)}
                      </span>
                    </div>
                    {log.note && (
                      <p className="text-xs text-[var(--text-secondary)] mt-0.5 truncate">
                        {log.note}
                      </p>
                    )}
                  </div>

                  {log.transactionId && (
                    <button
                      onClick={() => nav.goTransactionDetail(log.transactionId)}
                      className="flex items-center gap-1 text-xs text-[var(--primary)] hover:text-[var(--primary-hover)] font-medium transition-colors flex-shrink-0"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Xem
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>

        <ConfirmationModal
          isOpen={showPauseModal}
          onClose={() => setShowPauseModal(false)}
          onConfirm={() => {
            void runAction(
              () => recurringService.pauseRecurringRule(rule.id),
              "Đã tạm dừng quy tắc định kỳ",
            );
          }}
          title="Tạm dừng quy tắc định kỳ?"
          description="Ứng dụng sẽ ngừng tất cả thông báo và tự động tạo giao dịch cho quy tắc này."
          confirmLabel="Tạm dừng"
          cancelLabel="Huỷ"
        />

        <ConfirmationModal
          isOpen={showSkipModal}
          onClose={() => setShowSkipModal(false)}
          onConfirm={() => {
            void runAction(
              () => recurringService.skipNextOccurrence(rule.id),
              "Đã bỏ qua lần chạy tiếp theo",
            );
          }}
          title="Bỏ qua lần chạy tiếp theo?"
          description="Giao dịch sắp tới sẽ không được tạo. Các kỳ tiếp theo vẫn chạy bình thường."
          confirmLabel="Bỏ qua"
          cancelLabel="Huỷ"
        />

        <ConfirmationModal
          isOpen={showRunNowModal}
          onClose={() => setShowRunNowModal(false)}
          onConfirm={() => {
            void runAction(
              () => recurringService.runNow(rule.id),
              "Đã tạo giao dịch thành công",
            );
          }}
          title="Tạo giao dịch ngay?"
          description="Giao dịch sẽ được tạo ngay lập tức thay vì chờ đến ngày đã lên lịch."
          confirmLabel="Tạo ngay"
          cancelLabel="Huỷ"
        />

        <ConfirmationModal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={() => {
            void (async () => {
              try {
                setProcessing(true);
                await recurringService.deleteRecurringRule(rule.id);
                toast.success(`Đã xoá "${rule.name}"`);
                nav.goRecurringRules();
              } catch (err) {
                toast.error(
                  err instanceof Error
                    ? err.message
                    : "Không thể xoá giao dịch định kỳ",
                );
              } finally {
                setProcessing(false);
                setShowDeleteModal(false);
              }
            })();
          }}
          title="Xoá quy tắc định kỳ?"
          description={`Bạn có chắc muốn xoá "${rule.name}"? Giao dịch đã tạo trước đó sẽ không bị ảnh hưởng.`}
          confirmLabel="Xoá"
          cancelLabel="Huỷ"
          isDangerous
        />
      </div>
    </div>
  );
}

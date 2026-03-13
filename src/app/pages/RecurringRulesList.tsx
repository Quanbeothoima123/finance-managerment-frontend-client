import React, { useMemo, useState } from "react";
import {
  ArrowUpDown,
  Bell,
  BellOff,
  Calendar,
  Copy,
  Edit2,
  Eye,
  MoreVertical,
  Play,
  Plus,
  Search,
  SkipForward,
  Trash2,
  TrendingDown,
  TrendingUp,
  X,
  Zap,
} from "lucide-react";
import { Card } from "../components/Card";
import { Button } from "../components/Button";
import { ConfirmationModal } from "../components/ConfirmationModals";
import { RecurringCalendar } from "../components/RecurringCalendar";
import { useAppNavigation } from "../hooks/useAppNavigation";
import { useToast } from "../contexts/ToastContext";
import { useRecurringList } from "../hooks/useRecurringList";
import { recurringService } from "../services/recurringService";
import type { RecurringListQuery, RecurringRuleItem } from "../types/recurring";

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("vi-VN").format(Math.abs(amount || 0));
}

function formatDate(dateString?: string | null) {
  if (!dateString) return "--";
  const date = new Date(dateString);
  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function getDaysUntil(dateString?: string | null) {
  if (!dateString) return Number.POSITIVE_INFINITY;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const nextDate = new Date(dateString);
  nextDate.setHours(0, 0, 0, 0);
  return Math.ceil((nextDate.getTime() - today.getTime()) / 86400000);
}

function getFrequencyLabel(freq: string) {
  switch (freq) {
    case "daily":
      return "Hàng ngày";
    case "weekly":
      return "Hàng tuần";
    case "monthly":
      return "Hàng tháng";
    case "yearly":
      return "Hàng năm";
    default:
      return freq;
  }
}

function getTypeIcon(type: string) {
  return type === "income" ? (
    <TrendingUp className="w-5 h-5" />
  ) : (
    <TrendingDown className="w-5 h-5" />
  );
}

function getTypeClasses(type: string) {
  return type === "income"
    ? "bg-[var(--success-light)] text-[var(--success)]"
    : "bg-[var(--danger-light)] text-[var(--danger)]";
}

function ActionMenu({
  rule,
  onViewDetail,
  onSkipNext,
  onRunNow,
  onDuplicate,
  onEdit,
  onDelete,
}: {
  rule: RecurringRuleItem;
  onViewDetail: () => void;
  onSkipNext: () => void;
  onRunNow: () => void;
  onDuplicate: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={(e) => {
          e.stopPropagation();
          setOpen((value) => !value);
        }}
        className="p-1.5 rounded-[var(--radius-md)] hover:bg-[var(--surface)] transition-colors"
      >
        <MoreVertical className="w-4 h-4 text-[var(--text-tertiary)]" />
      </button>

      {open && (
        <div className="absolute right-0 top-8 w-52 bg-[var(--card)] border border-[var(--border)] rounded-[var(--radius-lg)] shadow-[var(--shadow-lg)] overflow-hidden z-50">
          <button
            onClick={() => {
              setOpen(false);
              onViewDetail();
            }}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--text-primary)] hover:bg-[var(--surface)]"
          >
            <Eye className="w-4 h-4 text-[var(--text-secondary)]" /> Xem chi
            tiết
          </button>
          <button
            onClick={() => {
              setOpen(false);
              onEdit();
            }}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--text-primary)] hover:bg-[var(--surface)]"
          >
            <Edit2 className="w-4 h-4 text-[var(--text-secondary)]" /> Chỉnh sửa
          </button>
          <div className="border-t border-[var(--border)]" />
          <button
            onClick={() => {
              setOpen(false);
              onSkipNext();
            }}
            disabled={!rule.enabled}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--text-primary)] hover:bg-[var(--surface)] disabled:opacity-40"
          >
            <SkipForward className="w-4 h-4 text-[var(--warning)]" /> Bỏ qua lần
            tiếp
          </button>
          <button
            onClick={() => {
              setOpen(false);
              onRunNow();
            }}
            disabled={!rule.enabled}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--text-primary)] hover:bg-[var(--surface)] disabled:opacity-40"
          >
            <Play className="w-4 h-4 text-[var(--success)]" /> Chạy ngay
          </button>
          <button
            onClick={() => {
              setOpen(false);
              onDuplicate();
            }}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--text-primary)] hover:bg-[var(--surface)]"
          >
            <Copy className="w-4 h-4 text-[var(--text-secondary)]" /> Nhân bản
          </button>
          <div className="border-t border-[var(--border)]" />
          <button
            onClick={() => {
              setOpen(false);
              onDelete();
            }}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--danger)] hover:bg-[var(--danger-light)]"
          >
            <Trash2 className="w-4 h-4" /> Xoá
          </button>
        </div>
      )}
    </div>
  );
}

function RuleCard({
  rule,
  onToggle,
  onViewDetail,
  onEdit,
  onSkipNext,
  onRunNow,
  onDuplicate,
  onDelete,
}: {
  rule: RecurringRuleItem;
  onToggle: () => void;
  onViewDetail: () => void;
  onEdit: () => void;
  onSkipNext: () => void;
  onRunNow: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  const daysUntil = getDaysUntil(rule.nextDate);
  const isPaused = !rule.enabled;

  return (
    <Card className={isPaused ? "opacity-70" : ""}>
      <div className="flex items-start gap-4">
        <button
          onClick={onViewDetail}
          className={`flex-shrink-0 w-12 h-12 rounded-[var(--radius-lg)] flex items-center justify-center ${getTypeClasses(rule.type)}`}
        >
          {getTypeIcon(rule.type)}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="min-w-0 flex-1">
              <button
                onClick={onViewDetail}
                className="font-semibold text-[var(--text-primary)] hover:text-[var(--primary)] text-left"
              >
                {rule.name}
              </button>
              <div className="flex flex-wrap items-center gap-1.5 text-sm text-[var(--text-secondary)] mt-0.5">
                <span
                  className={`tabular-nums font-medium ${rule.type === "income" ? "text-[var(--success)]" : "text-[var(--danger)]"}`}
                >
                  {formatCurrency(rule.amount)}
                  {rule.currencyCode === "VND" ? "₫" : ` ${rule.currencyCode}`}
                </span>
                <span>•</span>
                <span>{getFrequencyLabel(rule.frequency)}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={onToggle}
                className={`relative w-10 h-5 rounded-full transition-colors ${rule.enabled ? "bg-[var(--success)]" : "bg-[var(--border)]"}`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${rule.enabled ? "translate-x-5" : "translate-x-0"}`}
                />
              </button>
              <ActionMenu
                rule={rule}
                onViewDetail={onViewDetail}
                onSkipNext={onSkipNext}
                onRunNow={onRunNow}
                onDuplicate={onDuplicate}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5 mb-3">
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${rule.executionMode === "auto" ? "bg-[var(--warning-light)] text-[var(--warning)]" : "bg-[var(--info-light)] text-[var(--info)]"}`}
            >
              {rule.executionMode === "auto" ? (
                <Zap className="w-3 h-3" />
              ) : (
                <Bell className="w-3 h-3" />
              )}
              {rule.executionMode === "auto" ? "Tự tạo" : "Chỉ nhắc"}
            </span>
            {rule.notifyEnabled === false && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-[var(--surface)] text-[var(--text-tertiary)]">
                <BellOff className="w-3 h-3" /> Tắt thông báo
              </span>
            )}
            {rule.account && (
              <span className="px-2 py-0.5 bg-[var(--surface)] rounded-full text-xs text-[var(--text-secondary)]">
                {rule.account}
              </span>
            )}
            {rule.category && (
              <span className="px-2 py-0.5 bg-[var(--primary-light)] text-[var(--primary)] rounded-full text-xs font-medium">
                {rule.category}
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="inline-flex items-center gap-1.5 text-[var(--text-secondary)]">
              <Calendar className="w-4 h-4" />
              {rule.enabled
                ? `Lần tới: ${formatDate(rule.nextDate)}`
                : "Đang tạm dừng"}
            </span>
            {Number.isFinite(daysUntil) &&
              rule.enabled &&
              daysUntil >= 0 &&
              daysUntil <= 7 && (
                <span className="px-2 py-0.5 rounded-full bg-[var(--primary-light)] text-[var(--primary)] text-xs font-medium">
                  {daysUntil === 0 ? "Hôm nay" : `${daysUntil} ngày nữa`}
                </span>
              )}
          </div>
        </div>
      </div>
    </Card>
  );
}

export default function RecurringRulesList() {
  const nav = useAppNavigation();
  const toast = useToast();
  const [query, setQuery] = useState<RecurringListQuery>({
    status: "all",
    sortBy: "nextRunAt",
    sortOrder: "asc",
  });
  const [ruleToDelete, setRuleToDelete] = useState<RecurringRuleItem | null>(
    null,
  );
  const [processingId, setProcessingId] = useState<string | null>(null);
  const { data, loading, error, reload } = useRecurringList(query);

  const calendarRules = useMemo(
    () =>
      (data?.items || []).map((rule) => ({
        id: rule.id,
        name: rule.name,
        type: rule.type,
        amount: Math.abs(rule.amount),
        frequency: rule.frequency,
        nextRunDate: rule.nextDate || rule.startDate,
        active: rule.enabled,
      })),
    [data?.items],
  );

  const runAction = async (
    action: () => Promise<unknown>,
    successMessage: string,
  ) => {
    try {
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
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">
            Giao dịch định kỳ
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Quản lý các quy tắc giao dịch lặp lại theo lịch.
          </p>
        </div>
        <Button onClick={() => nav.goCreateRecurringRule()}>
          <Plus className="w-4 h-4" /> Tạo giao dịch định kỳ
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-sm text-[var(--text-secondary)]">Tổng quy tắc</p>
          <p className="text-2xl font-bold text-[var(--text-primary)] mt-1">
            {data?.summary.total || 0}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-[var(--text-secondary)]">Đang hoạt động</p>
          <p className="text-2xl font-bold text-[var(--success)] mt-1">
            {data?.summary.active || 0}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-[var(--text-secondary)]">Chỉ nhắc</p>
          <p className="text-2xl font-bold text-[var(--info)] mt-1">
            {data?.summary.notifyOnly || 0}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-[var(--text-secondary)]">Tự tạo</p>
          <p className="text-2xl font-bold text-[var(--warning)] mt-1">
            {data?.summary.autoPost || 0}
          </p>
        </Card>
      </div>

      <Card>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3">
          <div className="relative xl:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]" />
            <input
              value={query.search || ""}
              onChange={(e) =>
                setQuery((prev) => ({
                  ...prev,
                  search: e.target.value || undefined,
                }))
              }
              placeholder="Tìm giao dịch định kỳ..."
              className="w-full pl-9 pr-10 py-2.5 bg-[var(--input-background)] border border-[var(--border)] rounded-[var(--radius-lg)]"
            />
            {query.search && (
              <button
                onClick={() =>
                  setQuery((prev) => ({ ...prev, search: undefined }))
                }
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <select
            value={query.status || "all"}
            onChange={(e) =>
              setQuery((prev) => ({
                ...prev,
                status: e.target.value as RecurringListQuery["status"],
              }))
            }
            className="px-3 py-2.5 bg-[var(--input-background)] border border-[var(--border)] rounded-[var(--radius-lg)]"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="active">Đang hoạt động</option>
            <option value="paused">Đang tạm dừng</option>
          </select>

          <select
            value={query.executionMode || ""}
            onChange={(e) =>
              setQuery((prev) => ({
                ...prev,
                executionMode: (e.target.value ||
                  undefined) as RecurringListQuery["executionMode"],
              }))
            }
            className="px-3 py-2.5 bg-[var(--input-background)] border border-[var(--border)] rounded-[var(--radius-lg)]"
          >
            <option value="">Mọi chế độ</option>
            <option value="notify">Chỉ nhắc</option>
            <option value="auto">Tự tạo</option>
          </select>

          <button
            onClick={() =>
              setQuery((prev) => ({
                ...prev,
                sortOrder: prev.sortOrder === "asc" ? "desc" : "asc",
              }))
            }
            className="inline-flex items-center justify-center gap-2 px-3 py-2.5 bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-lg)] text-[var(--text-primary)]"
          >
            <ArrowUpDown className="w-4 h-4" />{" "}
            {query.sortOrder === "asc" ? "Tăng dần" : "Giảm dần"}
          </button>
        </div>
      </Card>

      {loading ? (
        <Card>
          <p className="text-[var(--text-secondary)]">
            Đang tải danh sách giao dịch định kỳ...
          </p>
        </Card>
      ) : error ? (
        <Card>
          <p className="text-[var(--danger)]">{error}</p>
          <Button
            variant="secondary"
            className="mt-4"
            onClick={() => void reload()}
          >
            Tải lại
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_380px] gap-6 items-start">
          <div className="space-y-4">
            {(data?.items || []).length === 0 ? (
              <Card className="text-center py-10">
                <p className="text-[var(--text-secondary)] mb-4">
                  Chưa có giao dịch định kỳ nào.
                </p>
                <Button onClick={() => nav.goCreateRecurringRule()}>
                  <Plus className="w-4 h-4" /> Tạo quy tắc đầu tiên
                </Button>
              </Card>
            ) : (
              (data?.items || []).map((rule) => (
                <RuleCard
                  key={rule.id}
                  rule={rule}
                  onToggle={() => {
                    setProcessingId(rule.id);
                    void runAction(
                      () =>
                        rule.enabled
                          ? recurringService.pauseRecurringRule(rule.id)
                          : recurringService.resumeRecurringRule(rule.id),
                      rule.enabled
                        ? "Đã tạm dừng giao dịch định kỳ"
                        : "Đã kích hoạt giao dịch định kỳ",
                    );
                  }}
                  onViewDetail={() => nav.goRecurringRuleDetail(rule.id)}
                  onEdit={() => nav.goEditRecurringRule(rule.id)}
                  onSkipNext={() => {
                    setProcessingId(rule.id);
                    void runAction(
                      () => recurringService.skipNextOccurrence(rule.id),
                      "Đã bỏ qua lần chạy tiếp theo",
                    );
                  }}
                  onRunNow={() => {
                    setProcessingId(rule.id);
                    void runAction(
                      () => recurringService.runRecurringRuleNow(rule.id),
                      "Đã chạy quy tắc ngay",
                    );
                  }}
                  onDuplicate={() => {
                    setProcessingId(rule.id);
                    void runAction(async () => {
                      const result = await recurringService.duplicate(rule.id);
                      if (result?.rule?.id) {
                        nav.goEditRecurringRule(result.rule.id);
                      }
                    }, "Đã nhân bản giao dịch định kỳ");
                  }}
                  onDelete={() => setRuleToDelete(rule)}
                />
              ))
            )}
          </div>

          <RecurringCalendar rules={calendarRules} />
        </div>
      )}

      <ConfirmationModal
        isOpen={Boolean(ruleToDelete)}
        onClose={() => setRuleToDelete(null)}
        onConfirm={() => {
          if (!ruleToDelete) return;
          setProcessingId(ruleToDelete.id);
          void runAction(async () => {
            await recurringService.deleteRecurringRule(ruleToDelete.id);
            setRuleToDelete(null);
          }, "Đã xoá giao dịch định kỳ");
        }}
        title="Xoá giao dịch định kỳ?"
        description={
          ruleToDelete
            ? `Quy tắc \"${ruleToDelete.name}\" sẽ bị xoá vĩnh viễn.`
            : ""
        }
        confirmLabel={processingId ? "Đang xử lý..." : "Xoá"}
        cancelLabel="Huỷ"
      />
    </div>
  );
}

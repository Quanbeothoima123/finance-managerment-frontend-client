import React, { useMemo, useState } from "react";
import {
  ArrowUpDown,
  Calendar,
  Edit2,
  Plus,
  Search,
  Target,
  Trash2,
  TrendingUp,
  X,
} from "lucide-react";
import { Card } from "../components/Card";
import { ConfirmationModal } from "../components/ConfirmationModals";
import { SwipeableRow } from "../components/SwipeableRow";
import { useToast } from "../contexts/ToastContext";
import { useAppNavigation } from "../hooks/useAppNavigation";
import { useGoalsList } from "../hooks/useGoalsList";
import { goalsService } from "../services/goalsService";
import type { GoalListItem, GoalUiStatus } from "../types/goals";
import {
  formatCurrency,
  formatDate,
  getDaysRemaining,
  getGoalIcon,
  getGoalPriorityLabel,
  getGoalStatusMeta,
} from "../utils/goalHelpers";

type UiFilter = "all" | GoalUiStatus;
type UiSort = "deadline" | "progress" | "amount" | "name";

function mapSort(sortBy: UiSort) {
  if (sortBy === "progress") {
    return { sortBy: "progress" as const, sortOrder: "desc" as const };
  }

  if (sortBy === "amount") {
    return { sortBy: "targetAmount" as const, sortOrder: "desc" as const };
  }

  if (sortBy === "name") {
    return { sortBy: "name" as const, sortOrder: "asc" as const };
  }

  return { sortBy: "targetDate" as const, sortOrder: "asc" as const };
}

function GoalCard({
  goal,
  onClick,
  onDelete,
}: {
  goal: GoalListItem;
  onClick: () => void;
  onDelete: () => void;
}) {
  const GoalIcon = getGoalIcon(goal.icon);
  const statusMeta = getGoalStatusMeta(goal.uiStatus);
  const daysRemaining = getDaysRemaining(goal.deadline);
  const remaining = Math.max(goal.remainingAmount, 0);

  return (
    <Card
      className="cursor-pointer hover:shadow-[var(--shadow-md)] transition-all"
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-12 h-12 rounded-[var(--radius-lg)] flex items-center justify-center"
            style={{ backgroundColor: `${goal.color}20` }}
          >
            <GoalIcon className="w-6 h-6" style={{ color: goal.color }} />
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-[var(--text-primary)] truncate">
              {goal.name}
            </h3>
            <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
              {getGoalPriorityLabel(goal.priority)}
            </p>
          </div>
        </div>

        <div
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-[var(--radius-md)] text-xs font-semibold whitespace-nowrap"
          style={{
            backgroundColor: statusMeta.bgColor,
            color: statusMeta.textColor,
          }}
        >
          <statusMeta.Icon className="w-3.5 h-3.5" />
          <span>{statusMeta.label}</span>
        </div>
      </div>

      <div className="mb-4">
        <div className="flex items-center justify-between mb-2 gap-3">
          <span className="text-sm text-[var(--text-secondary)]">
            <span className="font-semibold text-[var(--text-primary)] tabular-nums">
              {formatCurrency(goal.currentAmount)}₫
            </span>{" "}
            / {formatCurrency(goal.targetAmount)}₫
          </span>
          <span
            className="text-sm font-semibold tabular-nums"
            style={{ color: statusMeta.textColor }}
          >
            {goal.progressPercent.toFixed(0)}%
          </span>
        </div>
        <div className="h-3 bg-[var(--surface)] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${Math.min(goal.progressPercent, 100)}%`,
              backgroundColor: statusMeta.textColor,
            }}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[var(--divider)]">
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <Calendar className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
            <span className="text-xs text-[var(--text-secondary)]">
              Mục tiêu
            </span>
          </div>
          <p className="text-sm font-semibold text-[var(--text-primary)] tabular-nums">
            {formatDate(goal.deadline)}
          </p>
        </div>

        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <Target className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
            <span className="text-xs text-[var(--text-secondary)]">
              Còn lại
            </span>
          </div>
          <p className="text-sm font-semibold text-[var(--text-primary)] tabular-nums">
            {goal.uiStatus === "achieved"
              ? "0₫"
              : `${formatCurrency(remaining)}₫`}
          </p>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-[var(--divider)] flex items-center justify-between gap-3">
        <p
          className={`text-xs font-medium ${
            daysRemaining !== null && daysRemaining < 30
              ? "text-[var(--warning)]"
              : "text-[var(--text-secondary)]"
          }`}
        >
          {daysRemaining === null
            ? "Không có hạn chót"
            : daysRemaining > 0
              ? `Còn ${daysRemaining} ngày`
              : "Đã quá hạn"}
        </p>

        <button
          onClick={(event) => {
            event.stopPropagation();
            onDelete();
          }}
          className="hidden md:inline text-xs text-[var(--text-tertiary)] hover:text-[var(--danger)] transition-colors"
        >
          Xoá
        </button>
      </div>
    </Card>
  );
}

export default function GoalsOverview() {
  const [filter, setFilter] = useState<UiFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<UiSort>("deadline");
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [goalToDelete, setGoalToDelete] = useState<GoalListItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const nav = useAppNavigation();
  const toast = useToast();

  const { data, loading, error, reload } = useGoalsList(mapSort(sortBy));

  const filteredGoals = useMemo(() => {
    const source = data?.items || [];
    return source.filter((goal) => {
      const matchesFilter = filter === "all" || goal.uiStatus === filter;
      const keyword = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !keyword ||
        goal.name.toLowerCase().includes(keyword) ||
        (goal.note || "").toLowerCase().includes(keyword);

      return matchesFilter && matchesSearch;
    });
  }, [data?.items, filter, searchQuery]);

  const totals = useMemo(() => {
    const items = data?.items || [];
    const totalTarget = items.reduce((sum, item) => sum + item.targetAmount, 0);
    const totalSaved = items.reduce((sum, item) => sum + item.currentAmount, 0);
    const overallPercentage =
      totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0;

    return {
      totalTarget,
      totalSaved,
      overallPercentage,
      achievedCount: data?.summary.achievedCount || 0,
      behindCount: data?.summary.behindCount || 0,
      onTrackCount: data?.summary.onTrackCount || 0,
    };
  }, [data]);

  const handleDeleteGoal = (goal: GoalListItem) => {
    setGoalToDelete(goal);
    setDeleteModalOpen(true);
  };

  const confirmDeleteGoal = async () => {
    if (!goalToDelete) return;

    try {
      setDeleting(true);
      await goalsService.deleteGoal(goalToDelete.id);
      toast.success(`Đã xoá mục tiêu "${goalToDelete.name}"`);
      setDeleteModalOpen(false);
      setGoalToDelete(null);
      await reload();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Không thể xoá mục tiêu",
      );
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="max-w-6xl mx-auto p-4 md:p-6 pb-20 md:pb-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
              Mục tiêu
            </h1>
            <p className="text-sm text-[var(--text-secondary)] mt-1">
              Theo dõi và quản lý mục tiêu tài chính bằng dữ liệu thật từ
              backend.
            </p>
          </div>

          <button
            onClick={nav.goCreateGoal}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white rounded-[var(--radius-lg)] transition-colors shadow-[var(--shadow-sm)]"
          >
            <Plus className="w-5 h-5" />
            <span className="font-medium">Tạo mục tiêu</span>
          </button>
        </div>

        <Card className="bg-gradient-to-br from-[var(--primary)] to-[var(--primary-hover)] text-white">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <p className="text-sm text-white/80 mb-2">Tổng tiến độ</p>
              <div className="flex items-baseline gap-3 mb-4 flex-wrap">
                <h2 className="text-3xl font-bold tabular-nums">
                  {formatCurrency(totals.totalSaved)}₫
                </h2>
                <span className="text-lg text-white/80">
                  / {formatCurrency(totals.totalTarget)}₫
                </span>
              </div>

              <div className="mb-3">
                <div className="h-4 bg-white/20 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-white rounded-full transition-all"
                    style={{
                      width: `${Math.min(totals.overallPercentage, 100)}%`,
                    }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-sm gap-4 flex-wrap">
                <span className="text-white/90">
                  Còn lại:{" "}
                  <span className="font-semibold tabular-nums">
                    {formatCurrency(
                      Math.max(totals.totalTarget - totals.totalSaved, 0),
                    )}
                    ₫
                  </span>
                </span>
                <span className="text-white/90 font-semibold tabular-nums">
                  {totals.overallPercentage.toFixed(1)}%
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-white" />
                <span className="text-sm text-white/90">
                  <span className="font-semibold tabular-nums">
                    {totals.onTrackCount}
                  </span>{" "}
                  Đúng tiến độ
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-yellow-300" />
                <span className="text-sm text-white/90">
                  <span className="font-semibold tabular-nums">
                    {totals.behindCount}
                  </span>{" "}
                  Cần tăng tốc
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-green-300" />
                <span className="text-sm text-white/90">
                  <span className="font-semibold tabular-nums">
                    {totals.achievedCount}
                  </span>{" "}
                  Hoàn thành
                </span>
              </div>
            </div>
          </div>
        </Card>

        <div className="flex gap-2 overflow-x-auto pb-2">
          {[
            { value: "all", label: "Tất cả", count: data?.items.length || 0 },
            {
              value: "on-track",
              label: "Đúng tiến độ",
              count: totals.onTrackCount,
            },
            {
              value: "behind",
              label: "Cần tăng tốc",
              count: totals.behindCount,
            },
            {
              value: "achieved",
              label: "Hoàn thành",
              count: totals.achievedCount,
            },
          ].map((tab) => {
            const isActive = filter === tab.value;
            return (
              <button
                key={tab.value}
                onClick={() => setFilter(tab.value as UiFilter)}
                className={`px-4 py-2 rounded-[var(--radius-lg)] text-sm font-medium transition-all whitespace-nowrap ${
                  isActive
                    ? "bg-[var(--primary)] text-white shadow-[var(--shadow-sm)]"
                    : "bg-[var(--card)] text-[var(--text-secondary)] hover:bg-[var(--surface)] border border-[var(--border)]"
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            );
          })}
        </div>

        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-tertiary)]" />
            <input
              type="text"
              placeholder="Tìm kiếm mục tiêu..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="w-full pl-12 pr-10 py-2.5 bg-[var(--card)] border border-[var(--border)] rounded-[var(--radius-lg)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-[var(--radius-sm)] hover:bg-[var(--surface)] transition-colors"
              >
                <X className="w-4 h-4 text-[var(--text-tertiary)]" />
              </button>
            )}
          </div>

          <div className="relative flex-shrink-0">
            <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)] pointer-events-none" />
            <select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value as UiSort)}
              className="pl-9 pr-8 py-2.5 bg-[var(--card)] border border-[var(--border)] rounded-[var(--radius-lg)] text-sm text-[var(--text-primary)] appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]"
            >
              <option value="deadline">Hạn chót</option>
              <option value="progress">Tiến độ</option>
              <option value="amount">Mục tiêu</option>
              <option value="name">Tên A-Z</option>
            </select>
          </div>
        </div>

        {loading && (
          <Card>
            <p className="text-sm text-[var(--text-secondary)]">
              Đang tải danh sách mục tiêu...
            </p>
          </Card>
        )}

        {!loading && error && (
          <Card>
            <p className="text-sm text-[var(--danger)] mb-4">{error}</p>
            <button
              onClick={() => void reload()}
              className="px-4 py-2 rounded-[var(--radius-lg)] bg-[var(--primary)] text-white"
            >
              Tải lại
            </button>
          </Card>
        )}

        {!loading && !error && filteredGoals.length === 0 && (
          <Card>
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-[var(--surface)] rounded-full flex items-center justify-center mx-auto mb-4">
                <Target className="w-8 h-8 text-[var(--text-tertiary)]" />
              </div>
              <h3 className="font-semibold text-[var(--text-primary)] mb-2">
                {searchQuery || filter !== "all"
                  ? "Không tìm thấy mục tiêu"
                  : "Chưa có mục tiêu nào"}
              </h3>
              <p className="text-sm text-[var(--text-secondary)] mb-6">
                {searchQuery || filter !== "all"
                  ? "Thử thay đổi bộ lọc hoặc từ khoá tìm kiếm"
                  : "Tạo mục tiêu đầu tiên để bắt đầu hành trình tiết kiệm"}
              </p>
              {!searchQuery && filter === "all" && (
                <button
                  onClick={nav.goCreateGoal}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white rounded-[var(--radius-lg)] transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  <span className="font-medium">Tạo mục tiêu</span>
                </button>
              )}
            </div>
          </Card>
        )}

        {!loading && !error && filteredGoals.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredGoals.map((goal) => (
              <SwipeableRow
                key={goal.id}
                actions={[
                  {
                    icon: <Edit2 className="w-4 h-4" />,
                    label: "Sửa",
                    color: "white",
                    bgColor: "var(--primary)",
                    onClick: () => nav.goEditGoal(goal.id),
                  },
                  {
                    icon: <Trash2 className="w-4 h-4" />,
                    label: "Xoá",
                    color: "white",
                    bgColor: "var(--danger)",
                    onClick: () => handleDeleteGoal(goal),
                  },
                ]}
              >
                <GoalCard
                  goal={goal}
                  onClick={() => nav.goGoalDetail(goal.id)}
                  onDelete={() => handleDeleteGoal(goal)}
                />
              </SwipeableRow>
            ))}
          </div>
        )}
      </div>

      <ConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => {
          if (deleting) return;
          setDeleteModalOpen(false);
          setGoalToDelete(null);
        }}
        onConfirm={() => {
          void confirmDeleteGoal();
        }}
        title="Xoá mục tiêu?"
        description={`Bạn có chắc muốn xoá "${goalToDelete?.name || "mục tiêu này"}"? Hành động này không thể hoàn tác.`}
        confirmLabel={deleting ? "Đang xoá..." : "Xoá mục tiêu"}
        cancelLabel="Huỷ"
        isDangerous={true}
      />
    </div>
  );
}

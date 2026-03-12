import React, { useMemo, useState } from "react";
import { Edit2, Plus, Search, Target, Trash2 } from "lucide-react";
import { Card } from "../components/Card";
import { Button } from "../components/Button";
import { ConfirmationModal } from "../components/ConfirmationModals";
import { useAppNavigation } from "../hooks/useAppNavigation";
import { useGoalsList } from "../hooks/useGoalsList";
import { goalsService } from "../services/goalsService";
import type { GoalItem, GoalsListQuery } from "../types/goals";
import {
  formatCurrency,
  formatDate,
  getGoalIconComponent,
  getPriorityLabel,
  getUiStatus,
  getUiStatusMeta,
} from "../utils/goalHelpers";
import { useToast } from "../contexts/ToastContext";

function GoalCard({
  goal,
  onOpen,
  onEdit,
  onDelete,
}: {
  goal: GoalItem;
  onOpen: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const GoalIcon = getGoalIconComponent(goal.icon);
  const status = getUiStatus(goal);
  const statusMeta = getUiStatusMeta(status);
  const StatusIcon = statusMeta.Icon;

  return (
    <Card
      className="cursor-pointer hover:shadow-[var(--shadow-lg)] transition-all"
      onClick={onOpen}
    >
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-12 h-12 rounded-[var(--radius-lg)] flex items-center justify-center shrink-0"
            style={{ backgroundColor: `${goal.color || "#3b82f6"}20` }}
          >
            <GoalIcon
              className="w-6 h-6"
              style={{ color: goal.color || "#3b82f6" }}
            />
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-[var(--text-primary)] truncate">
              {goal.name}
            </h3>
            <p className="text-xs text-[var(--text-secondary)]">
              {getPriorityLabel(goal.priority)}
            </p>
          </div>
        </div>

        <div
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[var(--radius-md)] text-xs font-semibold shrink-0"
          style={{ backgroundColor: statusMeta.bg, color: statusMeta.color }}
        >
          <StatusIcon className="w-3.5 h-3.5" />
          <span>{statusMeta.label}</span>
        </div>
      </div>

      <div className="mb-4">
        <div className="flex items-center justify-between mb-2 text-sm">
          <span className="text-[var(--text-secondary)]">
            <span className="font-semibold text-[var(--text-primary)]">
              {formatCurrency(goal.currentAmount)}₫
            </span>
            {" / "}
            {formatCurrency(goal.targetAmount)}₫
          </span>
          <span className="font-semibold" style={{ color: statusMeta.color }}>
            {Number(goal.progressPercent || 0).toFixed(1)}%
          </span>
        </div>
        <div className="h-3 bg-[var(--surface)] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${Math.min(Number(goal.progressPercent || 0), 100)}%`,
              backgroundColor: statusMeta.color,
            }}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm pt-4 border-t border-[var(--divider)]">
        <div>
          <p className="text-[var(--text-secondary)] mb-1">Mục tiêu</p>
          <p className="font-semibold text-[var(--text-primary)]">
            {formatDate(goal.targetDate || goal.deadline)}
          </p>
        </div>
        <div>
          <p className="text-[var(--text-secondary)] mb-1">Còn lại</p>
          <p className="font-semibold text-[var(--text-primary)]">
            {formatCurrency(goal.remainingAmount)}₫
          </p>
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 mt-4 pt-4 border-t border-[var(--divider)]">
        <Button
          variant="secondary"
          size="sm"
          onClick={(event) => {
            event.stopPropagation();
            onEdit();
          }}
        >
          <Edit2 className="w-4 h-4" />
          Sửa
        </Button>
        <Button
          variant="danger"
          size="sm"
          onClick={(event) => {
            event.stopPropagation();
            onDelete();
          }}
        >
          <Trash2 className="w-4 h-4" />
          Xoá
        </Button>
      </div>
    </Card>
  );
}

export default function GoalsOverview() {
  const nav = useAppNavigation();
  const toast = useToast();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "on-track" | "behind" | "achieved"
  >("all");
  const [priority, setPriority] = useState<"all" | "low" | "medium" | "high">(
    "all",
  );
  const [sortBy, setSortBy] = useState<GoalsListQuery["sortBy"]>("targetDate");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [goalToDelete, setGoalToDelete] = useState<GoalItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const query: GoalsListQuery = useMemo(
    () => ({
      search,
      priority,
      sortBy,
      sortOrder,
    }),
    [search, priority, sortBy, sortOrder],
  );

  const { data, loading, error, reload } = useGoalsList(query);

  const items = useMemo(() => {
    const source = data?.items || [];
    if (statusFilter === "all") return source;
    return source.filter((goal) => getUiStatus(goal) === statusFilter);
  }, [data?.items, statusFilter]);

  const summary = data?.summary;

  const handleDelete = async () => {
    if (!goalToDelete) return;

    try {
      setDeleting(true);
      await goalsService.deleteGoal(goalToDelete.id);
      toast.success(`Đã xoá mục tiêu "${goalToDelete.name}"`);
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
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
              Mục tiêu
            </h1>
            <p className="text-sm text-[var(--text-secondary)] mt-1">
              Theo dõi tiến độ tiết kiệm và các đóng góp cho từng mục tiêu.
            </p>
          </div>
          <Button onClick={nav.goCreateGoal}>
            <Plus className="w-4 h-4" />
            Tạo mục tiêu
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <Card>
            <p className="text-sm text-[var(--text-secondary)]">
              Tổng mục tiêu
            </p>
            <p className="text-2xl font-semibold text-[var(--text-primary)] mt-2">
              {summary?.total ?? 0}
            </p>
          </Card>
          <Card>
            <p className="text-sm text-[var(--text-secondary)]">Hoàn thành</p>
            <p className="text-2xl font-semibold text-[var(--success)] mt-2">
              {summary?.achievedCount ?? 0}
            </p>
          </Card>
          <Card>
            <p className="text-sm text-[var(--text-secondary)]">Cần tăng tốc</p>
            <p className="text-2xl font-semibold text-[var(--warning)] mt-2">
              {summary?.behindCount ?? 0}
            </p>
          </Card>
          <Card>
            <p className="text-sm text-[var(--text-secondary)]">Đúng tiến độ</p>
            <p className="text-2xl font-semibold text-[var(--primary)] mt-2">
              {summary?.onTrackCount ?? 0}
            </p>
          </Card>
        </div>

        <Card>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                Tìm kiếm
              </label>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Tìm theo tên mục tiêu"
                  className="w-full pl-9 pr-4 py-2.5 bg-[var(--input-background)] border border-[var(--border)] rounded-[var(--radius-lg)] text-[var(--text-primary)]"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                Tiến độ
              </label>
              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(
                    event.target.value as
                      | "all"
                      | "on-track"
                      | "behind"
                      | "achieved",
                  )
                }
                className="w-full px-4 py-2.5 bg-[var(--input-background)] border border-[var(--border)] rounded-[var(--radius-lg)] text-[var(--text-primary)]"
              >
                <option value="all">Tất cả</option>
                <option value="on-track">Đúng tiến độ</option>
                <option value="behind">Cần tăng tốc</option>
                <option value="achieved">Hoàn thành</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                Ưu tiên
              </label>
              <select
                value={priority}
                onChange={(event) =>
                  setPriority(
                    event.target.value as "all" | "low" | "medium" | "high",
                  )
                }
                className="w-full px-4 py-2.5 bg-[var(--input-background)] border border-[var(--border)] rounded-[var(--radius-lg)] text-[var(--text-primary)]"
              >
                <option value="all">Tất cả</option>
                <option value="high">Ưu tiên cao</option>
                <option value="medium">Ưu tiên trung bình</option>
                <option value="low">Ưu tiên thấp</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                Sắp xếp theo
              </label>
              <select
                value={sortBy}
                onChange={(event) =>
                  setSortBy(event.target.value as GoalsListQuery["sortBy"])
                }
                className="w-full px-4 py-2.5 bg-[var(--input-background)] border border-[var(--border)] rounded-[var(--radius-lg)] text-[var(--text-primary)]"
              >
                <option value="targetDate">Ngày mục tiêu</option>
                <option value="progress">Tiến độ</option>
                <option value="targetAmount">Số tiền mục tiêu</option>
                <option value="name">Tên mục tiêu</option>
                <option value="createdAt">Ngày tạo</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                Thứ tự
              </label>
              <select
                value={sortOrder}
                onChange={(event) =>
                  setSortOrder(event.target.value as "asc" | "desc")
                }
                className="w-full px-4 py-2.5 bg-[var(--input-background)] border border-[var(--border)] rounded-[var(--radius-lg)] text-[var(--text-primary)]"
              >
                <option value="asc">Tăng dần</option>
                <option value="desc">Giảm dần</option>
              </select>
            </div>
          </div>
        </Card>

        {loading && (
          <Card>
            <p className="text-[var(--text-secondary)]">
              Đang tải danh sách mục tiêu...
            </p>
          </Card>
        )}
        {error && !loading && (
          <Card>
            <p className="text-[var(--danger)]">{error}</p>
          </Card>
        )}

        {!loading && !error && items.length === 0 && (
          <Card className="text-center py-12">
            <Target className="w-12 h-12 text-[var(--text-tertiary)] mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-[var(--text-primary)]">
              Chưa có mục tiêu phù hợp
            </h3>
            <p className="text-sm text-[var(--text-secondary)] mt-2 mb-6">
              Hãy tạo mục tiêu mới hoặc thay đổi bộ lọc hiện tại.
            </p>
            <Button onClick={nav.goCreateGoal}>Tạo mục tiêu đầu tiên</Button>
          </Card>
        )}

        {!loading && !error && items.length > 0 && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {items.map((goal) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                onOpen={() => nav.goGoalDetail(goal.id)}
                onEdit={() => nav.goEditGoal(goal.id)}
                onDelete={() => setGoalToDelete(goal)}
              />
            ))}
          </div>
        )}
      </div>

      <ConfirmationModal
        isOpen={Boolean(goalToDelete)}
        onClose={() => setGoalToDelete(null)}
        onConfirm={handleDelete}
        title="Xoá mục tiêu?"
        description={
          goalToDelete
            ? `Bạn có chắc muốn xoá mục tiêu "${goalToDelete.name}"?`
            : "Bạn có chắc muốn xoá mục tiêu này?"
        }
        consequences={[
          "Tất cả đóng góp của mục tiêu sẽ bị xoá.",
          "Dữ liệu này không thể khôi phục.",
        ]}
        confirmLabel={deleting ? "Đang xoá..." : "Xoá mục tiêu"}
        cancelLabel="Huỷ"
        isDangerous={true}
      />
    </div>
  );
}

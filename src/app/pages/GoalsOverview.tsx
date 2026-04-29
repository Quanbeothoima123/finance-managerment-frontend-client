import React, { useMemo, useState } from "react";
import { Edit2, Plus, Search, Target, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation("goals");
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
              {t(`priority.${goal.priority || "medium"}`)}
            </p>
          </div>
        </div>

        <div
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[var(--radius-md)] text-xs font-semibold shrink-0"
          style={{ backgroundColor: statusMeta.bg, color: statusMeta.color }}
        >
          <StatusIcon className="w-3.5 h-3.5" />
          <span>{t(`status.${status}`)}</span>
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
          <p className="text-[var(--text-secondary)] mb-1">
            {t("overview.card.target_label")}
          </p>
          <p className="font-semibold text-[var(--text-primary)]">
            {formatDate(goal.targetDate || goal.deadline)}
          </p>
        </div>
        <div>
          <p className="text-[var(--text-secondary)] mb-1">
            {t("overview.card.remaining_label")}
          </p>
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
          {t("overview.card.edit_button")}
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
          {t("overview.card.delete_button")}
        </Button>
      </div>
    </Card>
  );
}

export default function GoalsOverview() {
  const { t } = useTranslation("goals");
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
      toast.success(t("overview.toast.deleted", { name: goalToDelete.name }));
      setGoalToDelete(null);
      await reload();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : t("overview.toast.delete_failed"),
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
              {t("overview.title")}
            </h1>
            <p className="text-sm text-[var(--text-secondary)] mt-1">
              {t("overview.subtitle")}
            </p>
          </div>
          <Button onClick={nav.goCreateGoal}>
            <Plus className="w-4 h-4" />
            {t("overview.create_button")}
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <Card>
            <p className="text-sm text-[var(--text-secondary)]">
              {t("overview.summary.total")}
            </p>
            <p className="text-2xl font-semibold text-[var(--text-primary)] mt-2">
              {summary?.total ?? 0}
            </p>
          </Card>
          <Card>
            <p className="text-sm text-[var(--text-secondary)]">
              {t("overview.summary.achieved")}
            </p>
            <p className="text-2xl font-semibold text-[var(--success)] mt-2">
              {summary?.achievedCount ?? 0}
            </p>
          </Card>
          <Card>
            <p className="text-sm text-[var(--text-secondary)]">
              {t("overview.summary.behind")}
            </p>
            <p className="text-2xl font-semibold text-[var(--warning)] mt-2">
              {summary?.behindCount ?? 0}
            </p>
          </Card>
          <Card>
            <p className="text-sm text-[var(--text-secondary)]">
              {t("overview.summary.on_track")}
            </p>
            <p className="text-2xl font-semibold text-[var(--primary)] mt-2">
              {summary?.onTrackCount ?? 0}
            </p>
          </Card>
        </div>

        <Card>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                {t("overview.filters.search_label")}
              </label>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder={t("overview.filters.search_placeholder")}
                  className="w-full pl-9 pr-4 py-2.5 bg-[var(--input-background)] border border-[var(--border)] rounded-[var(--radius-lg)] text-[var(--text-primary)]"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                {t("overview.filters.status_label")}
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
                <option value="all">{t("overview.filters.status.all")}</option>
                <option value="on-track">
                  {t("overview.filters.status.on_track")}
                </option>
                <option value="behind">
                  {t("overview.filters.status.behind")}
                </option>
                <option value="achieved">
                  {t("overview.filters.status.achieved")}
                </option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                {t("overview.filters.priority_label")}
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
                <option value="all">
                  {t("overview.filters.priority.all")}
                </option>
                <option value="high">
                  {t("overview.filters.priority.high")}
                </option>
                <option value="medium">
                  {t("overview.filters.priority.medium")}
                </option>
                <option value="low">
                  {t("overview.filters.priority.low")}
                </option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                {t("overview.filters.sort_label")}
              </label>
              <select
                value={sortBy}
                onChange={(event) =>
                  setSortBy(event.target.value as GoalsListQuery["sortBy"])
                }
                className="w-full px-4 py-2.5 bg-[var(--input-background)] border border-[var(--border)] rounded-[var(--radius-lg)] text-[var(--text-primary)]"
              >
                <option value="targetDate">
                  {t("overview.filters.sort_by.targetDate")}
                </option>
                <option value="progress">
                  {t("overview.filters.sort_by.progress")}
                </option>
                <option value="targetAmount">
                  {t("overview.filters.sort_by.targetAmount")}
                </option>
                <option value="name">
                  {t("overview.filters.sort_by.name")}
                </option>
                <option value="createdAt">
                  {t("overview.filters.sort_by.createdAt")}
                </option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                {t("overview.filters.order_label")}
              </label>
              <select
                value={sortOrder}
                onChange={(event) =>
                  setSortOrder(event.target.value as "asc" | "desc")
                }
                className="w-full px-4 py-2.5 bg-[var(--input-background)] border border-[var(--border)] rounded-[var(--radius-lg)] text-[var(--text-primary)]"
              >
                <option value="asc">{t("overview.filters.order.asc")}</option>
                <option value="desc">{t("overview.filters.order.desc")}</option>
              </select>
            </div>
          </div>
        </Card>

        {loading && (
          <Card>
            <p className="text-[var(--text-secondary)]">
              {t("overview.loading")}
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
              {t("overview.empty.title")}
            </h3>
            <p className="text-sm text-[var(--text-secondary)] mt-2 mb-6">
              {t("overview.empty.subtitle")}
            </p>
            <Button onClick={nav.goCreateGoal}>
              {t("overview.empty.create_first")}
            </Button>
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
        title={t("overview.delete_modal.title")}
        description={
          goalToDelete
            ? t("overview.delete_modal.description", {
                name: goalToDelete.name,
              })
            : t("overview.delete_modal.description_generic")
        }
        consequences={[
          t("overview.delete_modal.consequences.all_contributions"),
          t("overview.delete_modal.consequences.no_recovery"),
        ]}
        confirmLabel={
          deleting
            ? t("overview.delete_modal.confirm_deleting")
            : t("overview.delete_modal.confirm")
        }
        cancelLabel={t("overview.delete_modal.cancel")}
        isDangerous={true}
      />
    </div>
  );
}

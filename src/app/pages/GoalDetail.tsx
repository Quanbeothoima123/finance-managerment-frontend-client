import React, { useMemo, useState } from "react";
import { useParams } from "react-router";
import {
  ArrowLeft,
  Calendar,
  Edit2,
  Link2,
  Plus,
  Target,
  Trash2,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Card } from "../components/Card";
import { Button } from "../components/Button";
import { ConfirmationModal } from "../components/ConfirmationModals";
import { useAppNavigation } from "../hooks/useAppNavigation";
import { useGoalDetail } from "../hooks/useGoalDetail";
import { goalsService } from "../services/goalsService";
import { useToast } from "../contexts/ToastContext";
import type { GoalContribution, GoalItem } from "../types/goals";
import {
  formatCurrency,
  formatDate,
  formatMinor,
  getGoalIconComponent,
  getUiStatus,
  getUiStatusMeta,
} from "../utils/goalHelpers";

function ContributionRow({
  item,
  onDelete,
}: {
  item: GoalContribution;
  onDelete: () => void;
}) {
  const { t } = useTranslation("goals");
  const isWithdrawal = item.eventType === "withdrawal";

  return (
    <div className="flex items-start justify-between gap-3 py-4 border-b border-[var(--divider)] last:border-b-0">
      <div className="min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={`text-sm font-semibold ${isWithdrawal ? "text-[var(--danger)]" : "text-[var(--success)]"}`}
          >
            {isWithdrawal ? "-" : "+"}
            {formatCurrency(Math.abs(Number(item.amount || 0)))}₫
          </span>
          <span className="px-2 py-0.5 rounded-full bg-[var(--surface)] text-xs text-[var(--text-secondary)]">
            {item.eventType}
          </span>
          {item.transactionId && (
            <span className="inline-flex items-center gap-1 text-xs text-[var(--text-secondary)]">
              <Link2 className="w-3 h-3" />
              {t("detail.contributions.linked_transaction")}
            </span>
          )}
        </div>
        <p className="text-sm text-[var(--text-primary)] mt-1">
          {item.note || item.notes || t("detail.contributions.no_note")}
        </p>
        <p className="text-xs text-[var(--text-secondary)] mt-1">
          {formatDate(item.date || item.eventAt)}
        </p>
      </div>
      <Button variant="danger" size="sm" onClick={onDelete}>
        <Trash2 className="w-4 h-4" />
        {t("overview.card.delete_button")}
      </Button>
    </div>
  );
}

export default function GoalDetail() {
  const { t } = useTranslation("goals");
  const { id } = useParams<{ id: string }>();
  const nav = useAppNavigation();
  const toast = useToast();
  const { data, loading, error, reload } = useGoalDetail(id);
  const [goalToDelete, setGoalToDelete] = useState<GoalItem | null>(null);
  const [contributionToDelete, setContributionToDelete] =
    useState<GoalContribution | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const goal = data?.goal || null;
  const status = getUiStatus(goal);
  const statusMeta = getUiStatusMeta(status);
  const GoalIcon = getGoalIconComponent(goal?.icon);

  const chartPoints = useMemo(() => {
    const events = data?.contributions || [];
    let running = 0;
    return [...events]
      .slice()
      .reverse()
      .map((event) => {
        running += Number(event.amount || 0);
        return {
          id: event.id,
          label: formatDate(event.date || event.eventAt),
          value: running,
        };
      });
  }, [data?.contributions]);

  const handleDeleteGoal = async () => {
    if (!goal) return;

    try {
      setSubmitting(true);
      await goalsService.deleteGoal(goal.id);
      toast.success(t("detail.toast.goal_deleted"));
      nav.goGoals();
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : t("detail.toast.goal_delete_failed"),
      );
    } finally {
      setSubmitting(false);
      setGoalToDelete(null);
    }
  };

  const handleDeleteContribution = async () => {
    if (!goal || !contributionToDelete) return;

    try {
      setSubmitting(true);
      await goalsService.deleteContribution(goal.id, contributionToDelete.id);
      toast.success(t("detail.toast.contribution_deleted"));
      await reload();
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : t("detail.toast.contribution_delete_failed"),
      );
    } finally {
      setSubmitting(false);
      setContributionToDelete(null);
    }
  };

  if (loading) {
    return (
      <div className="p-4 md:p-6">
        <Card>
          <p className="text-[var(--text-secondary)]">{t("detail.loading")}</p>
        </Card>
      </div>
    );
  }

  if (error || !goal) {
    return (
      <div className="p-4 md:p-6">
        <Card>
          <p className="text-[var(--danger)]">
            {error || t("detail.not_found")}
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="max-w-5xl mx-auto p-4 md:p-6 pb-20 md:pb-6 space-y-6">
        <div>
          <button
            onClick={() => nav.goBack()}
            className="inline-flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            {t("detail.back")}
          </button>

          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              <div
                className="w-16 h-16 rounded-[var(--radius-xl)] flex items-center justify-center shrink-0"
                style={{ backgroundColor: `${goal.color || "#3b82f6"}20` }}
              >
                <GoalIcon
                  className="w-8 h-8"
                  style={{ color: goal.color || "#3b82f6" }}
                />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-2">
                  <h1 className="text-2xl font-semibold text-[var(--text-primary)] truncate">
                    {goal.name}
                  </h1>
                  <span
                    className="px-2.5 py-1 rounded-[var(--radius-md)] text-xs font-semibold"
                    style={{
                      backgroundColor: statusMeta.bg,
                      color: statusMeta.color,
                    }}
                  >
                    {t(`status.${status}`)}
                  </span>
                </div>
                <p className="text-sm text-[var(--text-secondary)]">
                  {t(`priority.${goal.priority || "medium"}`)} •{" "}
                  {t("detail.priority_target", {
                    priority: t(`priority.${goal.priority || "medium"}`),
                    date: formatDate(goal.targetDate || goal.deadline),
                  })}
                </p>
                {goal.note && (
                  <p className="text-sm text-[var(--text-secondary)] mt-2">
                    {goal.note}
                  </p>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                onClick={() => nav.goEditGoal(goal.id)}
              >
                <Edit2 className="w-4 h-4" />
                {t("detail.edit_button")}
              </Button>
              <Button onClick={() => nav.goAddGoalContribution(goal.id)}>
                <Plus className="w-4 h-4" />
                {t("detail.add_contribution_button")}
              </Button>
            </div>
          </div>
        </div>

        <Card>
          <div className="flex items-center justify-between mb-3 text-sm">
            <span className="text-[var(--text-secondary)]">
              {formatCurrency(goal.currentAmount)}₫ /{" "}
              {formatCurrency(goal.targetAmount)}₫
            </span>
            <span className="font-semibold" style={{ color: statusMeta.color }}>
              {Number(goal.progressPercent || 0).toFixed(1)}%
            </span>
          </div>
          <div className="h-4 rounded-full bg-[var(--surface)] overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${Math.min(Number(goal.progressPercent || 0), 100)}%`,
                backgroundColor: statusMeta.color,
              }}
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 text-sm">
            <div>
              <p className="text-[var(--text-secondary)]">
                {t("detail.progress.current_label")}
              </p>
              <p className="font-semibold text-[var(--text-primary)] mt-1">
                {formatCurrency(goal.currentAmount)}₫
              </p>
            </div>
            <div>
              <p className="text-[var(--text-secondary)]">
                {t("detail.progress.target_label")}
              </p>
              <p className="font-semibold text-[var(--text-primary)] mt-1">
                {formatCurrency(goal.targetAmount)}₫
              </p>
            </div>
            <div>
              <p className="text-[var(--text-secondary)]">
                {t("detail.progress.remaining_label")}
              </p>
              <p className="font-semibold text-[var(--text-primary)] mt-1">
                {formatCurrency(goal.remainingAmount)}₫
              </p>
            </div>
            <div>
              <p className="text-[var(--text-secondary)]">
                {t("detail.progress.days_remaining_label")}
              </p>
              <p className="font-semibold text-[var(--text-primary)] mt-1">
                {data?.summary.daysRemaining ?? "—"}
              </p>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <h2 className="font-semibold text-[var(--text-primary)] mb-4">
              {t("detail.contributions.title")}
            </h2>
            {(data?.contributions || []).length === 0 && (
              <p className="text-sm text-[var(--text-secondary)]">
                {t("detail.contributions.empty")}
              </p>
            )}
            {(data?.contributions || []).map((item) => (
              <ContributionRow
                key={item.id}
                item={item}
                onDelete={() => setContributionToDelete(item)}
              />
            ))}
          </Card>

          <div className="space-y-6">
            <Card>
              <h2 className="font-semibold text-[var(--text-primary)] mb-4">
                {t("detail.summary_card.title")}
              </h2>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[var(--text-secondary)]">
                    {t("detail.summary_card.total_deposited")}
                  </span>
                  <span className="font-semibold text-[var(--success)]">
                    {formatMinor(data?.summary.totalDepositedMinor)}₫
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[var(--text-secondary)]">
                    {t("detail.summary_card.total_withdrawn")}
                  </span>
                  <span className="font-semibold text-[var(--danger)]">
                    {formatMinor(data?.summary.totalWithdrawnMinor)}₫
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[var(--text-secondary)]">
                    {t("detail.summary_card.event_count")}
                  </span>
                  <span className="font-semibold text-[var(--text-primary)]">
                    {data?.summary.eventCount ?? 0}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[var(--text-secondary)]">
                    {t("detail.summary_card.linked_transactions")}
                  </span>
                  <span className="font-semibold text-[var(--text-primary)]">
                    {data?.summary.linkedTransactionCount ?? 0}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[var(--text-secondary)]">
                    {t("detail.summary_card.last_contribution")}
                  </span>
                  <span className="font-semibold text-[var(--text-primary)]">
                    {formatDate(data?.summary.lastContributionAt)}
                  </span>
                </div>
              </div>
            </Card>

            <Card>
              <h2 className="font-semibold text-[var(--text-primary)] mb-4">
                {t("detail.progress_card.title")}
              </h2>
              {chartPoints.length === 0 ? (
                <p className="text-sm text-[var(--text-secondary)]">
                  {t("detail.progress_card.empty")}
                </p>
              ) : (
                <div className="space-y-2 text-sm">
                  {chartPoints.map((point) => (
                    <div
                      key={point.id}
                      className="flex items-center justify-between gap-3 py-2 border-b border-[var(--divider)] last:border-b-0"
                    >
                      <span className="text-[var(--text-secondary)]">
                        {point.label}
                      </span>
                      <span className="font-semibold text-[var(--text-primary)]">
                        {formatCurrency(point.value)}₫
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <Card>
              <h2 className="font-semibold text-[var(--text-primary)] mb-4">
                {t("detail.actions_card.title")}
              </h2>
              <div className="space-y-3">
                <Button
                  className="w-full"
                  onClick={() => nav.goAddGoalContribution(goal.id)}
                >
                  <Plus className="w-4 h-4" />
                  {t("detail.actions_card.add_contribution")}
                </Button>
                <Button
                  variant="secondary"
                  className="w-full"
                  onClick={() => nav.goEditGoal(goal.id)}
                >
                  <Edit2 className="w-4 h-4" />
                  {t("detail.actions_card.edit_goal")}
                </Button>
                <Button
                  variant="danger"
                  className="w-full"
                  onClick={() => setGoalToDelete(goal)}
                >
                  <Trash2 className="w-4 h-4" />
                  {t("detail.actions_card.delete_goal")}
                </Button>
              </div>
            </Card>
          </div>
        </div>

        {(data?.recentTransactions || []).length > 0 && (
          <Card>
            <h2 className="font-semibold text-[var(--text-primary)] mb-4">
              {t("detail.recent_transactions.title")}
            </h2>
            <div className="space-y-3">
              {data.recentTransactions.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-3 py-3 border-b border-[var(--divider)] last:border-b-0"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-[var(--text-primary)] truncate">
                      {item.description ||
                        t("detail.recent_transactions.fallback_name")}
                    </p>
                    <p className="text-xs text-[var(--text-secondary)] inline-flex items-center gap-1 mt-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {formatDate(item.date || item.occurredAt)}
                    </p>
                  </div>
                  <span className="font-semibold text-[var(--success)]">
                    +{formatMinor(item.signedAmountMinor)}₫
                  </span>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>

      <ConfirmationModal
        isOpen={Boolean(goalToDelete)}
        onClose={() => setGoalToDelete(null)}
        onConfirm={handleDeleteGoal}
        title={t("detail.delete_modal.title")}
        description={
          goalToDelete
            ? t("detail.delete_modal.description", { name: goalToDelete.name })
            : t("detail.delete_modal.description_generic")
        }
        consequences={[
          t("detail.delete_modal.consequences.all_contributions"),
          t("detail.delete_modal.consequences.no_recovery"),
        ]}
        confirmLabel={
          submitting
            ? t("detail.delete_modal.confirm_deleting")
            : t("detail.delete_modal.confirm")
        }
        cancelLabel={t("detail.delete_modal.cancel")}
        isDangerous={true}
      />

      <ConfirmationModal
        isOpen={Boolean(contributionToDelete)}
        onClose={() => setContributionToDelete(null)}
        onConfirm={handleDeleteContribution}
        title={t("detail.contribution_delete_modal.title")}
        description={t("detail.contribution_delete_modal.description")}
        confirmLabel={
          submitting
            ? t("detail.contribution_delete_modal.confirm_deleting")
            : t("detail.contribution_delete_modal.confirm")
        }
        cancelLabel={t("detail.contribution_delete_modal.cancel")}
        isDangerous={true}
      />
    </div>
  );
}

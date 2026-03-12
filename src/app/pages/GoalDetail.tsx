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
  getPriorityLabel,
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
              Đã liên kết giao dịch
            </span>
          )}
        </div>
        <p className="text-sm text-[var(--text-primary)] mt-1">
          {item.note || item.notes || "Không có ghi chú"}
        </p>
        <p className="text-xs text-[var(--text-secondary)] mt-1">
          {formatDate(item.date || item.eventAt)}
        </p>
      </div>
      <Button variant="danger" size="sm" onClick={onDelete}>
        <Trash2 className="w-4 h-4" />
        Xoá
      </Button>
    </div>
  );
}

export default function GoalDetail() {
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
      toast.success("Đã xoá mục tiêu");
      nav.goGoals();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Không thể xoá mục tiêu",
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
      toast.success("Đã xoá đóng góp");
      await reload();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Không thể xoá đóng góp",
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
          <p className="text-[var(--text-secondary)]">
            Đang tải chi tiết mục tiêu...
          </p>
        </Card>
      </div>
    );
  }

  if (error || !goal) {
    return (
      <div className="p-4 md:p-6">
        <Card>
          <p className="text-[var(--danger)]">
            {error || "Không tìm thấy mục tiêu"}
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
            Quay lại
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
                    {statusMeta.label}
                  </span>
                </div>
                <p className="text-sm text-[var(--text-secondary)]">
                  {getPriorityLabel(goal.priority)} • Mục tiêu đến{" "}
                  {formatDate(goal.targetDate || goal.deadline)}
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
                Chỉnh sửa
              </Button>
              <Button onClick={() => nav.goAddGoalContribution(goal.id)}>
                <Plus className="w-4 h-4" />
                Thêm đóng góp
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
              <p className="text-[var(--text-secondary)]">Đã có</p>
              <p className="font-semibold text-[var(--text-primary)] mt-1">
                {formatCurrency(goal.currentAmount)}₫
              </p>
            </div>
            <div>
              <p className="text-[var(--text-secondary)]">Mục tiêu</p>
              <p className="font-semibold text-[var(--text-primary)] mt-1">
                {formatCurrency(goal.targetAmount)}₫
              </p>
            </div>
            <div>
              <p className="text-[var(--text-secondary)]">Còn lại</p>
              <p className="font-semibold text-[var(--text-primary)] mt-1">
                {formatCurrency(goal.remainingAmount)}₫
              </p>
            </div>
            <div>
              <p className="text-[var(--text-secondary)]">Số ngày còn lại</p>
              <p className="font-semibold text-[var(--text-primary)] mt-1">
                {data?.summary.daysRemaining ?? "—"}
              </p>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <h2 className="font-semibold text-[var(--text-primary)] mb-4">
              Lịch sử đóng góp
            </h2>
            {(data?.contributions || []).length === 0 && (
              <p className="text-sm text-[var(--text-secondary)]">
                Chưa có đóng góp nào cho mục tiêu này.
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
                Tổng quan
              </h2>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[var(--text-secondary)]">Tổng nạp</span>
                  <span className="font-semibold text-[var(--success)]">
                    {formatMinor(data?.summary.totalDepositedMinor)}₫
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[var(--text-secondary)]">Tổng rút</span>
                  <span className="font-semibold text-[var(--danger)]">
                    {formatMinor(data?.summary.totalWithdrawnMinor)}₫
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[var(--text-secondary)]">Sự kiện</span>
                  <span className="font-semibold text-[var(--text-primary)]">
                    {data?.summary.eventCount ?? 0}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[var(--text-secondary)]">
                    Liên kết giao dịch
                  </span>
                  <span className="font-semibold text-[var(--text-primary)]">
                    {data?.summary.linkedTransactionCount ?? 0}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[var(--text-secondary)]">
                    Lần đóng góp gần nhất
                  </span>
                  <span className="font-semibold text-[var(--text-primary)]">
                    {formatDate(data?.summary.lastContributionAt)}
                  </span>
                </div>
              </div>
            </Card>

            <Card>
              <h2 className="font-semibold text-[var(--text-primary)] mb-4">
                Tiến độ theo thời gian
              </h2>
              {chartPoints.length === 0 ? (
                <p className="text-sm text-[var(--text-secondary)]">
                  Chưa đủ dữ liệu để hiển thị tiến độ.
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
                Hành động
              </h2>
              <div className="space-y-3">
                <Button
                  className="w-full"
                  onClick={() => nav.goAddGoalContribution(goal.id)}
                >
                  <Plus className="w-4 h-4" />
                  Thêm đóng góp
                </Button>
                <Button
                  variant="secondary"
                  className="w-full"
                  onClick={() => nav.goEditGoal(goal.id)}
                >
                  <Edit2 className="w-4 h-4" />
                  Chỉnh sửa mục tiêu
                </Button>
                <Button
                  variant="danger"
                  className="w-full"
                  onClick={() => setGoalToDelete(goal)}
                >
                  <Trash2 className="w-4 h-4" />
                  Xoá mục tiêu
                </Button>
              </div>
            </Card>
          </div>
        </div>

        {(data?.recentTransactions || []).length > 0 && (
          <Card>
            <h2 className="font-semibold text-[var(--text-primary)] mb-4">
              Giao dịch thu gần đây để liên kết
            </h2>
            <div className="space-y-3">
              {data.recentTransactions.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-3 py-3 border-b border-[var(--divider)] last:border-b-0"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-[var(--text-primary)] truncate">
                      {item.description || "Giao dịch thu nhập"}
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
        title="Xoá mục tiêu?"
        description={
          goalToDelete
            ? `Bạn có chắc muốn xoá mục tiêu "${goalToDelete.name}"?`
            : "Bạn có chắc muốn xoá mục tiêu này?"
        }
        consequences={[
          "Tất cả đóng góp liên quan cũng sẽ bị xoá.",
          "Dữ liệu này không thể khôi phục.",
        ]}
        confirmLabel={submitting ? "Đang xoá..." : "Xoá mục tiêu"}
        cancelLabel="Huỷ"
        isDangerous={true}
      />

      <ConfirmationModal
        isOpen={Boolean(contributionToDelete)}
        onClose={() => setContributionToDelete(null)}
        onConfirm={handleDeleteContribution}
        title="Xoá đóng góp?"
        description="Bạn có chắc muốn xoá đóng góp này? Số dư mục tiêu sẽ được tính lại."
        confirmLabel={submitting ? "Đang xoá..." : "Xoá đóng góp"}
        cancelLabel="Huỷ"
        isDangerous={true}
      />
    </div>
  );
}

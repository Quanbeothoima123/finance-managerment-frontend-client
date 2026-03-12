import React, { useMemo, useState } from "react";
import {
  ArrowDownCircle,
  ArrowLeft,
  Calendar,
  Edit2,
  Link2,
  PiggyBank,
  Plus,
  Trash2,
} from "lucide-react";
import { useParams } from "react-router";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card } from "../components/Card";
import { ConfirmationModal } from "../components/ConfirmationModals";
import { Input } from "../components/Input";
import { AmountInput } from "../components/AmountInput";
import { useToast } from "../contexts/ToastContext";
import { useAppNavigation } from "../hooks/useAppNavigation";
import { useGoalDetail } from "../hooks/useGoalDetail";
import { goalsService } from "../services/goalsService";
import type { GoalContribution } from "../types/goals";
import {
  formatCurrency,
  formatDate,
  getDaysRemaining,
  getGoalIcon,
  getGoalStatusMeta,
} from "../utils/goalHelpers";

type ContributionFilter = "all" | "deposit" | "withdrawal";

function WithdrawModal({
  isOpen,
  onClose,
  onSubmit,
  maxAmount,
  requiresApproval,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: {
    amount: number;
    date: string;
    note: string;
    approvalConfirmed: boolean;
  }) => Promise<void>;
  maxAmount: number;
  requiresApproval: (amount: number) => boolean;
}) {
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState("");
  const [approvalConfirmed, setApprovalConfirmed] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const amountNumber = Number(amount || 0);

  const reset = () => {
    setAmount("");
    setDate(new Date().toISOString().slice(0, 10));
    setNote("");
    setApprovalConfirmed(false);
    setError("");
  };

  const handleClose = () => {
    if (submitting) return;
    reset();
    onClose();
  };

  const handleSubmit = async () => {
    if (!amountNumber || amountNumber <= 0) {
      setError("Vui lòng nhập số tiền hợp lệ");
      return;
    }

    if (amountNumber > maxAmount) {
      setError(`Số tiền rút tối đa hiện tại là ${formatCurrency(maxAmount)}₫`);
      return;
    }

    if (requiresApproval(amountNumber) && !approvalConfirmed) {
      setError("Khoản rút này cần bạn xác nhận thêm trước khi gửi");
      return;
    }

    try {
      setSubmitting(true);
      await onSubmit({
        amount: amountNumber,
        date,
        note,
        approvalConfirmed,
      });
      reset();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
      onClick={handleClose}
    >
      <div
        className="bg-[var(--card)] rounded-[var(--radius-xl)] p-6 max-w-md w-full"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-5">
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">
            Rút tiền từ mục tiêu
          </h3>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Thao tác này sẽ gọi endpoint contribution với eventType=withdrawal.
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
              Số tiền cần rút
            </label>
            <AmountInput value={amount} onChange={setAmount} error={error} />
            <p className="mt-2 text-xs text-[var(--text-secondary)]">
              Tối đa hiện tại: {formatCurrency(maxAmount)}₫
            </p>
          </div>

          <Input
            label="Ngày rút"
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
          />

          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
              Lý do / ghi chú
            </label>
            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              rows={3}
              className="w-full px-4 py-2.5 bg-[var(--input-background)] border border-[var(--border)] rounded-[var(--radius-lg)] text-[var(--text-primary)] resize-none"
              placeholder="Ví dụ: Điều chỉnh kế hoạch, sử dụng cho chi phí cần thiết..."
            />
          </div>

          {requiresApproval(amountNumber) && amountNumber > 0 && (
            <label className="flex items-start gap-3 p-3 rounded-[var(--radius-lg)] bg-[var(--warning-light)] cursor-pointer">
              <input
                type="checkbox"
                checked={approvalConfirmed}
                onChange={(event) => setApprovalConfirmed(event.target.checked)}
                className="mt-1"
              />
              <span className="text-sm text-[var(--warning)] font-medium">
                Khoản rút này chạm ngưỡng xác nhận. Tôi đồng ý tiếp tục.
              </span>
            </label>
          )}
        </div>

        <div className="mt-6 flex flex-col-reverse sm:flex-row gap-3">
          <button
            type="button"
            onClick={handleClose}
            className="flex-1 px-4 py-2.5 border border-[var(--border)] rounded-[var(--radius-lg)] font-medium"
          >
            Huỷ
          </button>
          <button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={submitting}
            className="flex-1 px-4 py-2.5 bg-[var(--danger)] text-white rounded-[var(--radius-lg)] font-medium disabled:opacity-60"
          >
            {submitting ? "Đang xử lý..." : "Xác nhận rút tiền"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ContributionRow({
  item,
  onDelete,
}: {
  item: GoalContribution;
  onDelete: () => void;
}) {
  const isWithdrawal = item.type === "withdrawal";

  return (
    <div className="flex items-center gap-3 py-3 px-3 border-b border-[var(--divider)] last:border-0 bg-[var(--card)]">
      <div
        className={`w-10 h-10 rounded-full flex items-center justify-center ${
          isWithdrawal
            ? "bg-[var(--danger-light)]"
            : "bg-[var(--success-light)]"
        }`}
      >
        {isWithdrawal ? (
          <ArrowDownCircle className="w-5 h-5 text-[var(--danger)]" />
        ) : (
          <PiggyBank className="w-5 h-5 text-[var(--success)]" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p
            className={`text-sm font-semibold tabular-nums ${
              isWithdrawal ? "text-[var(--danger)]" : "text-[var(--success)]"
            }`}
          >
            {isWithdrawal ? "−" : "+"}
            {formatCurrency(Math.abs(item.amount))}₫
          </p>
          {item.transactionId && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[var(--radius-sm)] bg-[var(--primary-light)] text-[var(--primary)] text-[10px] font-medium">
              <Link2 className="w-3 h-3" /> Linked transaction
            </span>
          )}
        </div>
        <p className="text-xs text-[var(--text-secondary)] mt-0.5 truncate">
          {item.note || item.notes || "Không có ghi chú"}
        </p>
      </div>

      <div className="text-right flex-shrink-0">
        <p className="text-xs text-[var(--text-tertiary)] tabular-nums">
          {formatDate(item.date)}
        </p>
        <button
          onClick={onDelete}
          className="mt-1 text-xs text-[var(--danger)] hover:underline"
        >
          Xoá
        </button>
      </div>
    </div>
  );
}

export default function GoalDetail() {
  const { id } = useParams<{ id: string }>();
  const nav = useAppNavigation();
  const toast = useToast();
  const { data, loading, error, reload } = useGoalDetail(id);

  const [deleteGoalOpen, setDeleteGoalOpen] = useState(false);
  const [deletingGoal, setDeletingGoal] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [filter, setFilter] = useState<ContributionFilter>("all");
  const [eventToDelete, setEventToDelete] = useState<GoalContribution | null>(
    null,
  );
  const [deletingContribution, setDeletingContribution] = useState(false);

  const goal = data?.goal;
  const summary = data?.summary;

  const statusMeta = goal ? getGoalStatusMeta(goal.uiStatus) : null;
  const daysRemaining = getDaysRemaining(goal?.deadline);

  const filteredContributions = useMemo(() => {
    const items = data?.contributions || [];
    if (filter === "all") return items;
    return items.filter((item) => item.type === filter);
  }, [data?.contributions, filter]);

  const chartData = useMemo(() => {
    const events = [...(data?.contributions || [])]
      .filter((item) => item.type === "deposit" || item.type === "withdrawal")
      .sort((a, b) => a.date.localeCompare(b.date));

    let running = 0;
    return events.map((item) => {
      running += item.amount;
      return {
        date: formatDate(item.date).slice(0, 5),
        cumulative: Math.max(running, 0),
      };
    });
  }, [data?.contributions]);

  const maxWithdrawAmount = useMemo(() => {
    if (!goal) return 0;
    let maxAmount = goal.currentAmount;

    if (
      goal.withdrawalLimitType === "percentage" &&
      goal.withdrawalLimitValue
    ) {
      maxAmount = Math.min(
        maxAmount,
        Math.floor((goal.currentAmount * goal.withdrawalLimitValue) / 100),
      );
    }

    if (goal.withdrawalLimitType === "amount" && goal.withdrawalLimitValue) {
      maxAmount = Math.min(maxAmount, goal.withdrawalLimitValue);
    }

    return Math.max(maxAmount, 0);
  }, [goal]);

  const requiresApproval = (amount: number) => {
    if (!goal?.withdrawalApprovalEnabled || !goal.withdrawalApprovalThreshold) {
      return false;
    }
    return amount >= goal.withdrawalApprovalThreshold;
  };

  const handleDeleteGoal = async () => {
    if (!id || !goal) return;

    try {
      setDeletingGoal(true);
      await goalsService.deleteGoal(id);
      toast.success(`Đã xoá mục tiêu "${goal.name}"`);
      nav.goGoals();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Không thể xoá mục tiêu",
      );
    } finally {
      setDeletingGoal(false);
    }
  };

  const handleWithdraw = async (payload: {
    amount: number;
    date: string;
    note: string;
    approvalConfirmed: boolean;
  }) => {
    if (!id) return;

    try {
      await goalsService.createContribution(id, {
        eventType: "withdrawal",
        amount: payload.amount,
        date: payload.date,
        note: payload.note || null,
        approvalConfirmed: payload.approvalConfirmed,
      });
      toast.success(`Đã rút ${formatCurrency(payload.amount)}₫ khỏi mục tiêu`);
      setWithdrawOpen(false);
      await reload();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Không thể rút tiền từ mục tiêu",
      );
    }
  };

  const handleDeleteContribution = async () => {
    if (!id || !eventToDelete) return;

    try {
      setDeletingContribution(true);
      await goalsService.deleteContribution(id, eventToDelete.id);
      toast.success("Đã xoá đóng góp mục tiêu");
      setEventToDelete(null);
      await reload();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Không thể xoá đóng góp mục tiêu",
      );
    } finally {
      setDeletingContribution(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--background)] p-4 md:p-6">
        <Card>
          <p className="text-sm text-[var(--text-secondary)]">
            Đang tải chi tiết mục tiêu...
          </p>
        </Card>
      </div>
    );
  }

  if (error || !goal || !summary || !statusMeta) {
    return (
      <div className="min-h-screen bg-[var(--background)] p-4 md:p-6">
        <Card>
          <p className="text-sm text-[var(--danger)] mb-4">
            {error || "Không tìm thấy mục tiêu"}
          </p>
          <button
            onClick={nav.goGoals}
            className="px-4 py-2 rounded-[var(--radius-lg)] bg-[var(--primary)] text-white"
          >
            Về danh sách mục tiêu
          </button>
        </Card>
      </div>
    );
  }

  const GoalIcon = getGoalIcon(goal.icon);

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="max-w-6xl mx-auto p-4 md:p-6 pb-20 md:pb-6 space-y-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <button
              onClick={nav.goBack}
              className="flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] mb-3 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Quay lại</span>
            </button>
            <div className="flex items-center gap-3">
              <div
                className="w-14 h-14 rounded-[var(--radius-lg)] flex items-center justify-center"
                style={{ backgroundColor: `${goal.color}20` }}
              >
                <GoalIcon className="w-7 h-7" style={{ color: goal.color }} />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
                  {goal.name}
                </h1>
                <p className="text-sm text-[var(--text-secondary)] mt-1">
                  {goal.note || "Chi tiết mục tiêu và lịch sử đóng góp"}
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => nav.goAddGoalContribution(goal.id)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-[var(--primary)] text-white rounded-[var(--radius-lg)]"
            >
              <Plus className="w-4 h-4" /> Thêm đóng góp
            </button>
            <button
              onClick={() => setWithdrawOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 border border-[var(--danger)] text-[var(--danger)] rounded-[var(--radius-lg)]"
            >
              <ArrowDownCircle className="w-4 h-4" /> Rút tiền
            </button>
            <button
              onClick={() => nav.goEditGoal(goal.id)}
              className="inline-flex items-center gap-2 px-4 py-2.5 border border-[var(--border)] rounded-[var(--radius-lg)]"
            >
              <Edit2 className="w-4 h-4" /> Chỉnh sửa
            </button>
          </div>
        </div>

        <Card className="bg-gradient-to-br from-[var(--primary)] to-[var(--primary-hover)] text-white">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <p className="text-sm text-white/80 mb-2">Tiến độ mục tiêu</p>
              <div className="flex items-baseline gap-3 flex-wrap mb-4">
                <h2 className="text-3xl font-bold tabular-nums">
                  {formatCurrency(goal.currentAmount)}₫
                </h2>
                <span className="text-lg text-white/80">
                  / {formatCurrency(goal.targetAmount)}₫
                </span>
              </div>
              <div className="h-4 bg-white/20 rounded-full overflow-hidden mb-3">
                <div
                  className="h-full bg-white rounded-full transition-all"
                  style={{ width: `${Math.min(goal.progressPercent, 100)}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-sm gap-4 flex-wrap">
                <span>Còn lại: {formatCurrency(goal.remainingAmount)}₫</span>
                <span className="font-semibold tabular-nums">
                  {goal.progressPercent.toFixed(1)}%
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <div
                className="inline-flex items-center gap-2 px-3 py-2 rounded-[var(--radius-lg)] text-sm font-medium"
                style={{
                  backgroundColor: "rgba(255,255,255,0.18)",
                  color: "white",
                }}
              >
                <statusMeta.Icon className="w-4 h-4" />
                <span>{statusMeta.label}</span>
              </div>
              <p className="text-sm text-white/90">
                Hạn mục tiêu: <strong>{formatDate(goal.deadline)}</strong>
              </p>
              <p className="text-sm text-white/90">
                {daysRemaining === null
                  ? "Không giới hạn thời gian"
                  : daysRemaining > 0
                    ? `Còn ${daysRemaining} ngày`
                    : "Đã quá hạn"}
              </p>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <p className="text-sm text-[var(--text-secondary)] mb-1">
              Tổng nạp
            </p>
            <p className="text-2xl font-bold text-[var(--success)] tabular-nums">
              {formatCurrency(summary.totalDepositedMinor)}₫
            </p>
          </Card>
          <Card>
            <p className="text-sm text-[var(--text-secondary)] mb-1">
              Tổng rút
            </p>
            <p className="text-2xl font-bold text-[var(--danger)] tabular-nums">
              {formatCurrency(summary.totalWithdrawnMinor)}₫
            </p>
          </Card>
          <Card>
            <p className="text-sm text-[var(--text-secondary)] mb-1">
              Số đóng góp
            </p>
            <p className="text-2xl font-bold text-[var(--text-primary)] tabular-nums">
              {summary.contributionCount}
            </p>
          </Card>
          <Card>
            <p className="text-sm text-[var(--text-secondary)] mb-1">
              Giao dịch liên kết
            </p>
            <p className="text-2xl font-bold text-[var(--text-primary)] tabular-nums">
              {summary.linkedTransactionCount}
            </p>
          </Card>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 space-y-6">
            <Card>
              <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                <div>
                  <h3 className="font-semibold text-[var(--text-primary)]">
                    Diễn biến tích luỹ
                  </h3>
                  <p className="text-sm text-[var(--text-secondary)] mt-1">
                    Biểu đồ cộng dồn từ các lần nạp / rút tiền của mục tiêu.
                  </p>
                </div>
              </div>

              {chartData.length > 0 ? (
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={chartData}
                      margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
                    >
                      <defs>
                        <linearGradient
                          id="goalGrad"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor={goal.color}
                            stopOpacity={0.3}
                          />
                          <stop
                            offset="95%"
                            stopColor={goal.color}
                            stopOpacity={0.05}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="var(--divider)"
                      />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 11, fill: "var(--text-tertiary)" }}
                        tickLine={false}
                        axisLine={{ stroke: "var(--divider)" }}
                      />
                      <YAxis
                        tick={{ fontSize: 11, fill: "var(--text-tertiary)" }}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value: number) =>
                          `${Math.round(value / 1000000)}tr`
                        }
                        width={45}
                      />
                      <Tooltip
                        formatter={(value: number) => [
                          `${formatCurrency(value)}₫`,
                          "Tích luỹ",
                        ]}
                      />
                      <Area
                        type="monotone"
                        dataKey="cumulative"
                        stroke={goal.color}
                        strokeWidth={2.5}
                        fill="url(#goalGrad)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="text-center py-12 text-sm text-[var(--text-secondary)]">
                  Chưa có đủ dữ liệu để hiển thị biểu đồ.
                </div>
              )}
            </Card>

            <Card>
              <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                <div>
                  <h3 className="font-semibold text-[var(--text-primary)]">
                    Lịch sử đóng góp
                  </h3>
                  <p className="text-sm text-[var(--text-secondary)] mt-1">
                    Xoá từng event sẽ gọi endpoint delete contribution ở
                    backend.
                  </p>
                </div>

                <div className="flex gap-2">
                  {[
                    { key: "all", label: "Tất cả" },
                    { key: "deposit", label: "Nạp" },
                    { key: "withdrawal", label: "Rút" },
                  ].map((item) => {
                    const active = filter === item.key;
                    return (
                      <button
                        key={item.key}
                        onClick={() =>
                          setFilter(item.key as ContributionFilter)
                        }
                        className={`px-3 py-1.5 rounded-[var(--radius-md)] text-sm border ${
                          active
                            ? "bg-[var(--primary)] border-[var(--primary)] text-white"
                            : "border-[var(--border)] text-[var(--text-secondary)]"
                        }`}
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-[var(--radius-lg)] overflow-hidden border border-[var(--divider)]">
                {filteredContributions.length === 0 ? (
                  <div className="p-6 text-sm text-[var(--text-secondary)] text-center bg-[var(--card)]">
                    Chưa có dữ liệu đóng góp phù hợp.
                  </div>
                ) : (
                  filteredContributions.map((item) => (
                    <ContributionRow
                      key={item.id}
                      item={item}
                      onDelete={() => setEventToDelete(item)}
                    />
                  ))
                )}
              </div>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <h3 className="font-semibold text-[var(--text-primary)] mb-4">
                Thông tin nhanh
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[var(--text-secondary)]">
                    Ngày bắt đầu
                  </span>
                  <span className="font-medium text-[var(--text-primary)]">
                    {formatDate(goal.startDate)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[var(--text-secondary)]">
                    Ngày mục tiêu
                  </span>
                  <span className="font-medium text-[var(--text-primary)]">
                    {formatDate(goal.targetDate)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[var(--text-secondary)]">Ưu tiên</span>
                  <span className="font-medium text-[var(--text-primary)] uppercase">
                    {goal.priority}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[var(--text-secondary)]">
                    Auto contribution
                  </span>
                  <span className="font-medium text-[var(--text-primary)]">
                    {goal.autoContributeEnabled
                      ? `${formatCurrency(goal.autoContributeAmount)}₫ / ngày ${goal.autoContributeDay}`
                      : "Chưa bật"}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[var(--text-secondary)]">
                    Khoá rút tiền
                  </span>
                  <span className="font-medium text-[var(--text-primary)]">
                    {goal.withdrawalLockEnabled
                      ? `Bật${goal.withdrawalLockUntil ? ` đến ${formatDate(goal.withdrawalLockUntil)}` : ""}`
                      : "Tắt"}
                  </span>
                </div>
              </div>
            </Card>

            <Card>
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="w-5 h-5 text-[var(--primary)]" />
                <h3 className="font-semibold text-[var(--text-primary)]">
                  Thu nhập gần đây
                </h3>
              </div>
              <div className="space-y-3">
                {(data?.recentTransactions || []).map((transaction) => (
                  <div
                    key={transaction.id}
                    className="p-3 rounded-[var(--radius-lg)] bg-[var(--surface)]"
                  >
                    <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                      {transaction.description || "Giao dịch thu nhập"}
                    </p>
                    <p className="text-xs text-[var(--text-secondary)] mt-1">
                      {formatDate(transaction.date || transaction.occurredAt)}
                    </p>
                    <p className="text-sm font-semibold text-[var(--success)] mt-2 tabular-nums">
                      +
                      {formatCurrency(
                        Math.abs(Number(transaction.signedAmountMinor || 0)),
                      )}
                      ₫
                    </p>
                  </div>
                ))}
                {(data?.recentTransactions || []).length === 0 && (
                  <p className="text-sm text-[var(--text-secondary)]">
                    Chưa có giao dịch thu nhập gợi ý.
                  </p>
                )}
              </div>
            </Card>

            <Card className="border-[var(--danger)]">
              <h3 className="font-semibold text-[var(--text-primary)] mb-3">
                Vùng nguy hiểm
              </h3>
              <p className="text-sm text-[var(--text-secondary)] mb-4">
                Xoá mục tiêu sẽ loại bỏ toàn bộ dữ liệu của mục tiêu này khỏi
                backend.
              </p>
              <button
                onClick={() => setDeleteGoalOpen(true)}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[var(--danger)] text-white rounded-[var(--radius-lg)]"
              >
                <Trash2 className="w-4 h-4" /> Xoá mục tiêu
              </button>
            </Card>
          </div>
        </div>
      </div>

      <WithdrawModal
        isOpen={withdrawOpen}
        onClose={() => setWithdrawOpen(false)}
        onSubmit={handleWithdraw}
        maxAmount={maxWithdrawAmount}
        requiresApproval={requiresApproval}
      />

      <ConfirmationModal
        isOpen={deleteGoalOpen}
        onClose={() => {
          if (deletingGoal) return;
          setDeleteGoalOpen(false);
        }}
        onConfirm={() => {
          void handleDeleteGoal();
        }}
        title="Xoá mục tiêu?"
        description={`Bạn có chắc muốn xoá "${goal.name}"? Hành động này không thể hoàn tác.`}
        confirmLabel={deletingGoal ? "Đang xoá..." : "Xoá mục tiêu"}
        cancelLabel="Huỷ"
        isDangerous={true}
      />

      <ConfirmationModal
        isOpen={Boolean(eventToDelete)}
        onClose={() => {
          if (deletingContribution) return;
          setEventToDelete(null);
        }}
        onConfirm={() => {
          void handleDeleteContribution();
        }}
        title="Xoá đóng góp?"
        description="Bạn có chắc muốn xoá event đóng góp này? Số dư mục tiêu sẽ được tính lại từ backend."
        confirmLabel={deletingContribution ? "Đang xoá..." : "Xoá đóng góp"}
        cancelLabel="Huỷ"
        isDangerous={true}
      />
    </div>
  );
}

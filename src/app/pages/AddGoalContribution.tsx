import React, { useMemo, useState } from "react";
import { Link2, Save, TrendingUp, X } from "lucide-react";
import { useParams } from "react-router";
import { Card } from "../components/Card";
import { Input } from "../components/Input";
import { AmountInput } from "../components/AmountInput";
import { useToast } from "../contexts/ToastContext";
import { useAppNavigation } from "../hooks/useAppNavigation";
import { useGoalDetail } from "../hooks/useGoalDetail";
import { goalsService } from "../services/goalsService";
import { formatCurrency, formatDate, getGoalIcon } from "../utils/goalHelpers";

interface AddGoalContributionProps {
  isModal?: boolean;
  goalInfo?: {
    name: string;
    icon: string;
    color: string;
    currentAmount: number;
    targetAmount: number;
  };
}

export default function AddGoalContribution({
  isModal = false,
  goalInfo,
}: AddGoalContributionProps) {
  const { id } = useParams<{ id: string }>();
  const nav = useAppNavigation();
  const toast = useToast();
  const { data, loading, error } = useGoalDetail(id);

  const [formData, setFormData] = useState({
    amount: "",
    date: new Date().toISOString().slice(0, 10),
    linkedTransactionId: "",
    note: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const goal = data?.goal;
  const displayGoal = goal || (goalInfo ? { ...goalInfo, note: null } : null);
  const recentTransactions = useMemo(
    () => data?.recentTransactions || [],
    [data],
  );

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const validateForm = () => {
    const nextErrors: Record<string, string> = {};

    if (!Number(formData.amount || 0)) {
      nextErrors.amount = "Vui lòng nhập số tiền";
    }

    if (!formData.date) {
      nextErrors.date = "Vui lòng chọn ngày đóng góp";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleLinkTransaction = (transactionId: string) => {
    const transaction = recentTransactions.find(
      (item) => item.id === transactionId,
    );
    if (!transaction) return;

    handleInputChange("linkedTransactionId", transactionId);
    handleInputChange(
      "amount",
      String(Math.abs(Number(transaction.signedAmountMinor || 0))),
    );
    if (!formData.note) {
      handleInputChange(
        "note",
        transaction.description ||
          transaction.note ||
          "Liên kết từ giao dịch thu nhập",
      );
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validateForm()) return;

    if (!id || !goal) {
      toast.error("Màn hình preview không hỗ trợ gửi dữ liệu thật");
      return;
    }

    try {
      setSubmitting(true);
      await goalsService.createContribution(id, {
        eventType: "deposit",
        amount: Number(formData.amount || 0),
        date: formData.date,
        linkedTransactionId: formData.linkedTransactionId || null,
        note: formData.note.trim() || null,
      });
      toast.success(
        `Đã thêm đóng góp ${formatCurrency(formData.amount)}₫ vào "${displayGoal.name}"`,
      );
      nav.goGoalDetail(id);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Không thể thêm đóng góp",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const content = (() => {
    if (loading) {
      return (
        <Card>
          <p className="text-sm text-[var(--text-secondary)]">
            Đang tải dữ liệu đóng góp...
          </p>
        </Card>
      );
    }

    if (error || !displayGoal) {
      return (
        <Card>
          <p className="text-sm text-[var(--danger)]">
            {error || "Không tìm thấy mục tiêu"}
          </p>
        </Card>
      );
    }

    const GoalIcon = getGoalIcon(displayGoal.icon);
    const contributionAmount = Number(formData.amount || 0);
    const newTotal = displayGoal.currentAmount + contributionAmount;
    const newPercentage =
      displayGoal.targetAmount > 0
        ? (newTotal / displayGoal.targetAmount) * 100
        : 0;
    const remainingAfter = Math.max(displayGoal.targetAmount - newTotal, 0);

    return (
      <div className={isModal ? "" : "min-h-screen bg-[var(--background)]"}>
        <div
          className={
            isModal ? "" : "max-w-2xl mx-auto p-4 md:p-6 pb-20 md:pb-6"
          }
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-[var(--text-primary)]">
                Thêm đóng góp
              </h2>
              <p className="text-sm text-[var(--text-secondary)] mt-1">
                Ghi nhận số tiền tiết kiệm vào mục tiêu qua endpoint backend.
              </p>
            </div>
            {isModal && (
              <button
                onClick={nav.goBack}
                className="p-2 rounded-[var(--radius-lg)] hover:bg-[var(--surface)] transition-colors"
              >
                <X className="w-5 h-5 text-[var(--text-secondary)]" />
              </button>
            )}
          </div>

          <div className="mb-6 p-4 rounded-[var(--radius-lg)] bg-[var(--surface)]">
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-[var(--radius-lg)] flex items-center justify-center"
                style={{ backgroundColor: `${displayGoal.color}20` }}
              >
                <GoalIcon
                  className="w-6 h-6"
                  style={{ color: displayGoal.color }}
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[var(--text-primary)] truncate">
                  {displayGoal.name}
                </p>
                <p className="text-xs text-[var(--text-secondary)]">
                  {formatCurrency(displayGoal.currentAmount)}₫ /{" "}
                  {formatCurrency(displayGoal.targetAmount)}₫
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                Số tiền đóng góp <span className="text-[var(--danger)]">*</span>
              </label>
              <AmountInput
                value={formData.amount}
                onChange={(value) => handleInputChange("amount", value)}
                error={errors.amount}
              />
            </div>

            <Input
              label="Ngày đóng góp"
              type="date"
              value={formData.date}
              onChange={(event) =>
                handleInputChange("date", event.target.value)
              }
              error={errors.date}
            />

            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                Liên kết giao dịch thu nhập (tuỳ chọn)
              </label>
              <div className="space-y-2">
                {recentTransactions.map((transaction) => {
                  const isLinked =
                    formData.linkedTransactionId === transaction.id;
                  return (
                    <button
                      key={transaction.id}
                      type="button"
                      onClick={() => handleLinkTransaction(transaction.id)}
                      className={`w-full flex items-center gap-3 p-3 rounded-[var(--radius-lg)] border-2 transition-all text-left ${
                        isLinked
                          ? "border-[var(--primary)] bg-[var(--primary-light)]"
                          : "border-[var(--border)] hover:border-[var(--text-tertiary)]"
                      }`}
                    >
                      <div
                        className={`p-2 rounded-[var(--radius-md)] ${
                          isLinked
                            ? "bg-[var(--primary)]"
                            : "bg-[var(--surface)]"
                        }`}
                      >
                        <Link2
                          className={`w-4 h-4 ${
                            isLinked
                              ? "text-white"
                              : "text-[var(--text-tertiary)]"
                          }`}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                          {transaction.description || "Giao dịch thu nhập"}
                        </p>
                        <p className="text-xs text-[var(--text-secondary)] truncate">
                          {transaction.id} •{" "}
                          {formatDate(
                            transaction.date || transaction.occurredAt,
                          )}
                        </p>
                      </div>
                      <p className="text-sm font-semibold text-[var(--success)] tabular-nums">
                        +
                        {formatCurrency(
                          Math.abs(Number(transaction.signedAmountMinor || 0)),
                        )}
                        ₫
                      </p>
                    </button>
                  );
                })}
              </div>
              {recentTransactions.length === 0 && (
                <p className="text-xs text-[var(--text-secondary)] mt-2">
                  Chưa có giao dịch thu nhập gần đây để liên kết.
                </p>
              )}
              {formData.linkedTransactionId && (
                <button
                  type="button"
                  onClick={() => handleInputChange("linkedTransactionId", "")}
                  className="mt-2 text-xs text-[var(--danger)] hover:underline"
                >
                  Bỏ liên kết
                </button>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                Ghi chú (tuỳ chọn)
              </label>
              <textarea
                placeholder="Ví dụ: Lương tháng này, thưởng dự án..."
                value={formData.note}
                onChange={(event) =>
                  handleInputChange("note", event.target.value)
                }
                rows={3}
                className="w-full px-4 py-2.5 bg-[var(--input-background)] border border-[var(--border)] rounded-[var(--radius-lg)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] resize-none transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]"
              />
            </div>

            {contributionAmount > 0 && (
              <Card className="bg-[var(--surface)]">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="w-5 h-5 text-[var(--primary)]" />
                  <h4 className="text-sm font-semibold text-[var(--text-primary)]">
                    Sau khi đóng góp
                  </h4>
                </div>

                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-[var(--text-secondary)]">
                      Tiến độ mới
                    </span>
                    <span className="text-sm font-semibold text-[var(--primary)] tabular-nums">
                      {newPercentage.toFixed(1)}%
                    </span>
                  </div>
                  <div className="h-3 bg-[var(--border)] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[var(--primary)] rounded-full transition-all"
                      style={{ width: `${Math.min(newPercentage, 100)}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 pt-4 border-t border-[var(--divider)]">
                  <div>
                    <p className="text-xs text-[var(--text-secondary)] mb-1">
                      Tổng mới
                    </p>
                    <p className="text-sm font-semibold text-[var(--text-primary)] tabular-nums">
                      {formatCurrency(newTotal)}₫
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[var(--text-secondary)] mb-1">
                      Mục tiêu
                    </p>
                    <p className="text-sm font-semibold text-[var(--text-primary)] tabular-nums">
                      {formatCurrency(displayGoal.targetAmount)}₫
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[var(--text-secondary)] mb-1">
                      Còn lại
                    </p>
                    <p className="text-sm font-semibold text-[var(--text-primary)] tabular-nums">
                      {remainingAfter <= 0
                        ? "0₫"
                        : `${formatCurrency(remainingAfter)}₫`}
                    </p>
                  </div>
                </div>

                {newTotal >= displayGoal.targetAmount && (
                  <div className="mt-4 p-3 rounded-[var(--radius-lg)] bg-[var(--success-light)]">
                    <p className="text-sm font-medium text-[var(--success)] text-center">
                      🎉 Chúc mừng! Bạn sẽ hoàn thành mục tiêu này!
                    </p>
                  </div>
                )}
              </Card>
            )}

            <div className="flex flex-col-reverse md:flex-row gap-3">
              <button
                type="button"
                onClick={() => (id ? nav.goGoalDetail(id) : nav.goBack())}
                className="flex-1 md:flex-none px-6 py-2.5 border border-[var(--border)] text-[var(--text-primary)] rounded-[var(--radius-lg)] font-medium hover:bg-[var(--surface)] transition-colors"
              >
                Huỷ
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-[var(--primary)] hover:bg-[var(--primary-hover)] disabled:opacity-60 text-white rounded-[var(--radius-lg)] font-medium transition-colors shadow-[var(--shadow-sm)]"
              >
                <Save className="w-5 h-5" />
                <span>{submitting ? "Đang lưu..." : "Thêm đóng góp"}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  })();

  if (isModal) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <div className="bg-[var(--card)] rounded-[var(--radius-xl)] p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          {content}
        </div>
      </div>
    );
  }

  return content;
}

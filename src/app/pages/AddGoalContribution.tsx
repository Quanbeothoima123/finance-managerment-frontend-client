import React, { useMemo, useState } from "react";
import { useParams } from "react-router";
import { Link2, Save, Target, X } from "lucide-react";
import { Card } from "../components/Card";
import { Input } from "../components/Input";
import { AmountInput } from "../components/AmountInput";
import { Button } from "../components/Button";
import { useGoalDetail } from "../hooks/useGoalDetail";
import { goalsService } from "../services/goalsService";
import { useAppNavigation } from "../hooks/useAppNavigation";
import { useToast } from "../contexts/ToastContext";
import {
  buildGoalPreview,
  formatCurrency,
  formatDate,
  getGoalIconComponent,
} from "../utils/goalHelpers";

interface GoalInfo {
  name: string;
  icon: string;
  color: string;
  currentAmount: number;
  targetAmount: number;
}

interface AddGoalContributionProps {
  onClose?: () => void;
  onSave?: (data: {
    amount: number;
    date: string;
    linkedTransactionId?: string | null;
    note?: string;
  }) => void | Promise<void>;
  isModal?: boolean;
  goalInfo?: GoalInfo;
}

export default function AddGoalContribution({
  onClose,
  onSave,
  isModal = true,
  goalInfo,
}: AddGoalContributionProps) {
  const { id } = useParams<{ id: string }>();
  const nav = useAppNavigation();
  const toast = useToast();
  const { data, loading, error } = useGoalDetail(goalInfo ? undefined : id);
  const [formData, setFormData] = useState({
    amount: "",
    date: new Date().toISOString().slice(0, 10),
    linkedTransactionId: "",
    note: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const resolvedGoal = useMemo(() => {
    if (goalInfo) return goalInfo;
    if (!data?.goal) return null;
    const preview = buildGoalPreview(data.goal);
    return {
      name: preview.name,
      icon: preview.icon,
      color: preview.color,
      currentAmount: preview.currentAmount,
      targetAmount: preview.targetAmount,
    };
  }, [data?.goal, goalInfo]);

  const recentTransactions = data?.recentTransactions || [];
  const GoalIcon = getGoalIconComponent(resolvedGoal?.icon);

  const contributionAmount = Number(formData.amount || 0);
  const nextTotal = (resolvedGoal?.currentAmount || 0) + contributionAmount;
  const nextProgress = resolvedGoal?.targetAmount
    ? (nextTotal / resolvedGoal.targetAmount) * 100
    : 0;
  const remainingAfter = Math.max(
    (resolvedGoal?.targetAmount || 0) - nextTotal,
    0,
  );

  const handleInputChange = (
    field: "amount" | "date" | "linkedTransactionId" | "note",
    value: string,
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleLinkTransaction = (transactionId: string) => {
    const transaction = recentTransactions.find(
      (item) => item.id === transactionId,
    );
    if (!transaction) return;

    handleInputChange("linkedTransactionId", transaction.id);
    handleInputChange(
      "amount",
      String(Math.abs(Number(transaction.signedAmountMinor || 0))),
    );
    if (!formData.note) {
      handleInputChange(
        "note",
        `Từ: ${transaction.description || "Giao dịch thu nhập"}`,
      );
    }
  };

  const validateForm = () => {
    const nextErrors: Record<string, string> = {};

    if (!formData.amount || Number(formData.amount) <= 0) {
      nextErrors.amount = "Nhập số tiền đóng góp hợp lệ";
    }

    if (!formData.date) {
      nextErrors.date = "Vui lòng chọn ngày đóng góp";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const submitViaApi = async () => {
    if (!id) return;
    await goalsService.createContribution(id, {
      amountMinor: formData.amount,
      date: formData.date,
      linkedTransactionId: formData.linkedTransactionId || null,
      note: formData.note.trim() || null,
      eventType: "deposit",
    });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validateForm()) return;

    try {
      setSaving(true);
      if (onSave) {
        await onSave({
          amount: Number(formData.amount),
          date: formData.date,
          linkedTransactionId: formData.linkedTransactionId || null,
          note: formData.note.trim() || "",
        });
      } else {
        await submitViaApi();
        toast.success("Đã thêm đóng góp vào mục tiêu");
      }

      if (isModal) {
        onClose?.();
      } else if (!onSave && id) {
        nav.goGoalDetail(id);
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Không thể thêm đóng góp",
      );
    } finally {
      setSaving(false);
    }
  };

  const content = (
    <div className={isModal ? "" : "min-h-screen bg-[var(--background)]"}>
      <div
        className={isModal ? "" : "max-w-3xl mx-auto p-4 md:p-6 pb-20 md:pb-6"}
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-[var(--text-primary)]">
              Thêm đóng góp
            </h2>
            <p className="text-sm text-[var(--text-secondary)] mt-1">
              Ghi nhận khoản tiền mới cho mục tiêu.
            </p>
          </div>
          {isModal && (
            <button
              onClick={onClose}
              className="p-2 rounded-[var(--radius-lg)] hover:bg-[var(--surface)] transition-colors"
            >
              <X className="w-5 h-5 text-[var(--text-secondary)]" />
            </button>
          )}
        </div>

        {loading && (
          <Card>
            <p className="text-[var(--text-secondary)]">
              Đang tải dữ liệu mục tiêu...
            </p>
          </Card>
        )}
        {error && !loading && (
          <Card>
            <p className="text-[var(--danger)]">{error}</p>
          </Card>
        )}

        {!loading && resolvedGoal && (
          <>
            <div className="mb-6 p-4 rounded-[var(--radius-lg)] bg-[var(--surface)]">
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-[var(--radius-lg)] flex items-center justify-center"
                  style={{ backgroundColor: `${resolvedGoal.color}20` }}
                >
                  <GoalIcon
                    className="w-6 h-6"
                    style={{ color: resolvedGoal.color }}
                  />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-[var(--text-primary)]">
                    {resolvedGoal.name}
                  </p>
                  <p className="text-sm text-[var(--text-secondary)]">
                    {formatCurrency(resolvedGoal.currentAmount)}₫ /{" "}
                    {formatCurrency(resolvedGoal.targetAmount)}₫
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <Card>
                <div className="space-y-4">
                  <AmountInput
                    value={formData.amount}
                    onChange={(value) => handleInputChange("amount", value)}
                    error={errors.amount}
                  />
                  <Input
                    label="Ngày đóng góp"
                    type="date"
                    value={formData.date}
                    onChange={(event) =>
                      handleInputChange("date", event.target.value)
                    }
                    error={errors.date}
                  />

                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-[var(--text-primary)]">
                      Ghi chú
                    </label>
                    <textarea
                      rows={3}
                      value={formData.note}
                      onChange={(event) =>
                        handleInputChange("note", event.target.value)
                      }
                      placeholder="Ví dụ: Trích từ lương tháng này"
                      className="w-full px-4 py-3 bg-[var(--input-background)] border border-[var(--border)] rounded-[var(--radius-lg)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)]"
                    />
                  </div>
                </div>
              </Card>

              {recentTransactions.length > 0 && (
                <Card>
                  <h3 className="font-semibold text-[var(--text-primary)] mb-4">
                    Liên kết giao dịch thu gần đây
                  </h3>
                  <div className="space-y-2">
                    {recentTransactions.map((transaction) => {
                      const isActive =
                        formData.linkedTransactionId === transaction.id;
                      return (
                        <button
                          key={transaction.id}
                          type="button"
                          onClick={() => handleLinkTransaction(transaction.id)}
                          className={`w-full p-3 rounded-[var(--radius-lg)] border text-left transition-colors ${isActive ? "border-[var(--primary)] bg-[var(--primary-light)]" : "border-[var(--border)] hover:border-[var(--text-tertiary)]"}`}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="min-w-0">
                              <p className="font-medium text-[var(--text-primary)] truncate">
                                {transaction.description ||
                                  "Giao dịch thu nhập"}
                              </p>
                              <p className="text-xs text-[var(--text-secondary)] mt-1">
                                {formatDate(
                                  transaction.date || transaction.occurredAt,
                                )}
                              </p>
                            </div>
                            <span className="font-semibold text-[var(--success)] shrink-0">
                              +
                              {formatCurrency(
                                Math.abs(
                                  Number(transaction.signedAmountMinor || 0),
                                ),
                              )}
                              ₫
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  {formData.linkedTransactionId && (
                    <button
                      type="button"
                      onClick={() =>
                        handleInputChange("linkedTransactionId", "")
                      }
                      className="mt-3 text-sm text-[var(--danger)] hover:underline"
                    >
                      Bỏ liên kết giao dịch
                    </button>
                  )}
                </Card>
              )}

              <Card>
                <div className="flex items-center gap-2 mb-3">
                  <Target className="w-5 h-5 text-[var(--primary)]" />
                  <h3 className="font-semibold text-[var(--text-primary)]">
                    Xem trước sau khi đóng góp
                  </h3>
                </div>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--text-secondary)]">
                      Tổng mới
                    </span>
                    <span className="font-semibold text-[var(--text-primary)]">
                      {formatCurrency(nextTotal)}₫
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--text-secondary)]">
                      Tiến độ mới
                    </span>
                    <span className="font-semibold text-[var(--primary)]">
                      {nextProgress.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--text-secondary)]">
                      Còn lại
                    </span>
                    <span className="font-semibold text-[var(--text-primary)]">
                      {formatCurrency(remainingAfter)}₫
                    </span>
                  </div>
                </div>
              </Card>

              {!isModal && (
                <div className="flex flex-col-reverse sm:flex-row gap-3">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => (id ? nav.goGoalDetail(id) : nav.goBack())}
                  >
                    Huỷ
                  </Button>
                  <Button type="submit" disabled={saving}>
                    <Save className="w-4 h-4" />
                    {saving ? "Đang lưu..." : "Lưu đóng góp"}
                  </Button>
                </div>
              )}

              {isModal && (
                <div className="flex flex-col-reverse sm:flex-row gap-3 justify-end">
                  <Button type="button" variant="secondary" onClick={onClose}>
                    Huỷ
                  </Button>
                  <Button type="submit" disabled={saving}>
                    <Save className="w-4 h-4" />
                    {saving ? "Đang lưu..." : "Lưu đóng góp"}
                  </Button>
                </div>
              )}
            </form>
          </>
        )}
      </div>
    </div>
  );

  return content;
}

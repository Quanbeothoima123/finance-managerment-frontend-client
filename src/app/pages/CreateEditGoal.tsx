import React, { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Save, Zap } from "lucide-react";
import { useParams } from "react-router";
import { Card } from "../components/Card";
import { Input } from "../components/Input";
import { AmountInput } from "../components/AmountInput";
import { useToast } from "../contexts/ToastContext";
import { useAppNavigation } from "../hooks/useAppNavigation";
import { useGoalDetail } from "../hooks/useGoalDetail";
import { useGoalsMeta } from "../hooks/useGoalsMeta";
import { goalsService } from "../services/goalsService";
import type { GoalPriority } from "../types/goals";
import { formatCurrency, goalColors, goalIcons } from "../utils/goalHelpers";

interface CreateEditGoalProps {
  mode?: "create" | "edit";
}

function todayString() {
  return new Date().toISOString().slice(0, 10);
}

export default function CreateEditGoal({
  mode = "create",
}: CreateEditGoalProps) {
  const { id } = useParams<{ id: string }>();
  const nav = useAppNavigation();
  const toast = useToast();
  const isEditMode = mode === "edit";

  const {
    data: metaData,
    loading: metaLoading,
    error: metaError,
  } = useGoalsMeta();

  const {
    data: detailData,
    loading: detailLoading,
    error: detailError,
  } = useGoalDetail(isEditMode ? id : undefined);

  const [formData, setFormData] = useState({
    name: "",
    icon: "target",
    color: "#3b82f6",
    targetAmount: "",
    balanceAmount: "",
    startDate: todayString(),
    targetDate: "",
    linkedAccountId: "",
    note: "",
    priority: "medium" as GoalPriority,
    autoContributeEnabled: false,
    autoContributeAmount: "",
    autoContributeDay: "1",
    autoContributeAccountId: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isEditMode || !detailData?.goal) return;

    const goal = detailData.goal;
    setFormData({
      name: goal.name,
      icon: goal.icon || "target",
      color: goal.color || "#3b82f6",
      targetAmount: String(goal.targetAmount || ""),
      balanceAmount: String(goal.currentAmount || ""),
      startDate: goal.startDate || todayString(),
      targetDate: goal.targetDate || "",
      linkedAccountId: goal.linkedAccountId || "",
      note: goal.note || "",
      priority: goal.priority,
      autoContributeEnabled: goal.autoContributeEnabled,
      autoContributeAmount: goal.autoContributeAmount
        ? String(goal.autoContributeAmount)
        : "",
      autoContributeDay: String(goal.autoContributeDay || 1),
      autoContributeAccountId: goal.autoContributeAccountId || "",
    });
  }, [detailData, isEditMode]);

  const filteredAccounts = useMemo(() => {
    const currency = metaData?.defaults.currencyCode;
    return (metaData?.accounts || []).filter((account) => {
      if (!currency) return true;
      return account.currencyCode === currency;
    });
  }, [metaData]);

  const handleInputChange = (
    field: keyof typeof formData,
    value: string | boolean,
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const validateForm = () => {
    const nextErrors: Record<string, string> = {};
    const targetAmount = Number(formData.targetAmount || 0);
    const balanceAmount = Number(formData.balanceAmount || 0);

    if (!formData.name.trim()) {
      nextErrors.name = "Vui lòng nhập tên mục tiêu";
    }

    if (!targetAmount || targetAmount <= 0) {
      nextErrors.targetAmount = "Số tiền mục tiêu phải lớn hơn 0";
    }

    if (balanceAmount < 0) {
      nextErrors.balanceAmount = "Số tiền không hợp lệ";
    }

    if (targetAmount > 0 && balanceAmount > targetAmount) {
      nextErrors.balanceAmount = isEditMode
        ? "Số dư hiện tại không thể lớn hơn mục tiêu"
        : "Số tiền ban đầu không thể lớn hơn mục tiêu";
    }

    if (!formData.startDate) {
      nextErrors.startDate = "Vui lòng chọn ngày bắt đầu";
    }

    if (!formData.targetDate) {
      nextErrors.targetDate = "Vui lòng chọn ngày mục tiêu";
    }

    if (
      formData.startDate &&
      formData.targetDate &&
      formData.startDate >= formData.targetDate
    ) {
      nextErrors.targetDate = "Ngày mục tiêu phải sau ngày bắt đầu";
    }

    if (formData.autoContributeEnabled) {
      if (!Number(formData.autoContributeAmount || 0)) {
        nextErrors.autoContributeAmount =
          "Số tiền đóng góp tự động phải lớn hơn 0";
      }

      if (!Number(formData.autoContributeDay || 0)) {
        nextErrors.autoContributeDay = "Vui lòng chọn ngày đóng góp tự động";
      }

      if (!formData.autoContributeAccountId) {
        nextErrors.autoContributeAccountId = "Vui lòng chọn tài khoản nguồn";
      }
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validateForm()) return;

    try {
      setSubmitting(true);

      const payload = {
        name: formData.name.trim(),
        icon: formData.icon,
        color: formData.color,
        note: formData.note.trim() || null,
        startDate: formData.startDate,
        targetDate: formData.targetDate,
        targetAmount: Number(formData.targetAmount || 0),
        priority: formData.priority,
        linkedAccountId: formData.linkedAccountId || null,
        autoContributeEnabled: formData.autoContributeEnabled,
        autoContributeAmount: formData.autoContributeEnabled
          ? Number(formData.autoContributeAmount || 0)
          : null,
        autoContributeDay: formData.autoContributeEnabled
          ? Number(formData.autoContributeDay || 1)
          : null,
        autoContributeAccountId: formData.autoContributeEnabled
          ? formData.autoContributeAccountId || null
          : null,
        ...(isEditMode
          ? {
              currentAmount: Number(formData.balanceAmount || 0),
            }
          : {
              initialAmount: Number(formData.balanceAmount || 0),
            }),
      };

      if (isEditMode && id) {
        const result = await goalsService.updateGoal(id, payload);
        toast.success("Đã cập nhật mục tiêu");
        nav.goGoalDetail(result.goal.id);
      } else {
        const result = await goalsService.createGoal(payload);
        toast.success("Đã tạo mục tiêu mới");
        nav.goGoalDetail(result.goal.id);
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Không thể lưu mục tiêu",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const targetAmount = Number(formData.targetAmount || 0);
  const balanceAmount = Number(formData.balanceAmount || 0);
  const remaining = Math.max(targetAmount - balanceAmount, 0);
  const percentage =
    targetAmount > 0 ? (balanceAmount / targetAmount) * 100 : 0;

  if (metaLoading || (isEditMode && detailLoading)) {
    return (
      <div className="min-h-screen bg-[var(--background)] p-4 md:p-6">
        <Card>
          <p className="text-sm text-[var(--text-secondary)]">
            Đang tải dữ liệu mục tiêu...
          </p>
        </Card>
      </div>
    );
  }

  if (metaError || (isEditMode && detailError)) {
    return (
      <div className="min-h-screen bg-[var(--background)] p-4 md:p-6">
        <Card>
          <p className="text-sm text-[var(--danger)]">
            {metaError || detailError || "Không thể tải dữ liệu mục tiêu"}
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="max-w-5xl mx-auto p-4 md:p-6 pb-20 md:pb-6">
        <div className="mb-6">
          <button
            onClick={nav.goBack}
            className="flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Quay lại</span>
          </button>
          <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
            {isEditMode ? "Chỉnh sửa mục tiêu" : "Tạo mục tiêu mới"}
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            {isEditMode
              ? "Cập nhật mục tiêu và đồng bộ thẳng với module goals ở backend."
              : "Tạo mục tiêu mới và lưu trực tiếp qua API goals."}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <h3 className="font-semibold text-[var(--text-primary)] mb-4">
              Thông tin cơ bản
            </h3>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                    Biểu tượng
                  </label>
                  <div className="grid grid-cols-5 md:grid-cols-6 gap-2">
                    {goalIcons.map((icon) => {
                      const isSelected = formData.icon === icon.key;
                      return (
                        <button
                          key={icon.key}
                          type="button"
                          onClick={() => handleInputChange("icon", icon.key)}
                          className={`aspect-square rounded-[var(--radius-lg)] text-2xl flex items-center justify-center transition-all ${
                            isSelected
                              ? "bg-[var(--primary-light)] ring-2 ring-[var(--primary)]"
                              : "bg-[var(--surface)] hover:bg-[var(--border)]"
                          }`}
                        >
                          {icon.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                    Màu sắc
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {goalColors.map((color) => {
                      const isSelected = formData.color === color;
                      return (
                        <button
                          key={color}
                          type="button"
                          onClick={() => handleInputChange("color", color)}
                          className={`aspect-square rounded-[var(--radius-lg)] transition-all ${
                            isSelected
                              ? "ring-2 ring-offset-2 ring-[var(--text-primary)]"
                              : ""
                          }`}
                          style={{ backgroundColor: color }}
                        />
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 rounded-[var(--radius-lg)] bg-[var(--surface)]">
                <div
                  className="w-14 h-14 rounded-[var(--radius-lg)] flex items-center justify-center text-3xl"
                  style={{ backgroundColor: `${formData.color}20` }}
                >
                  {goalIcons.find((item) => item.key === formData.icon)
                    ?.label || "🎯"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                    {formData.name || "Tên mục tiêu"}
                  </p>
                  <p className="text-xs text-[var(--text-secondary)]">
                    Xem trước giao diện mục tiêu
                  </p>
                </div>
              </div>

              <Input
                label="Tên mục tiêu"
                placeholder="Ví dụ: Du lịch Nhật Bản, Mua laptop mới..."
                value={formData.name}
                onChange={(event) =>
                  handleInputChange("name", event.target.value)
                }
                error={errors.name}
              />

              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                  Ghi chú
                </label>
                <textarea
                  value={formData.note}
                  onChange={(event) =>
                    handleInputChange("note", event.target.value)
                  }
                  rows={3}
                  placeholder="Mô tả ngắn cho mục tiêu của bạn"
                  className="w-full px-4 py-2.5 bg-[var(--input-background)] border border-[var(--border)] rounded-[var(--radius-lg)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] resize-none transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]"
                />
              </div>
            </div>
          </Card>

          <Card>
            <h3 className="font-semibold text-[var(--text-primary)] mb-4">
              Tài chính & thời gian
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                  Số tiền mục tiêu{" "}
                  <span className="text-[var(--danger)]">*</span>
                </label>
                <AmountInput
                  value={formData.targetAmount}
                  onChange={(value) => handleInputChange("targetAmount", value)}
                  error={errors.targetAmount}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                  {isEditMode ? "Số dư hiện tại" : "Số tiền ban đầu"}
                </label>
                <AmountInput
                  value={formData.balanceAmount}
                  onChange={(value) =>
                    handleInputChange("balanceAmount", value)
                  }
                  error={errors.balanceAmount}
                />
              </div>

              <Input
                label="Ngày bắt đầu"
                type="date"
                value={formData.startDate}
                onChange={(event) =>
                  handleInputChange("startDate", event.target.value)
                }
                error={errors.startDate}
              />

              <Input
                label="Ngày mục tiêu"
                type="date"
                value={formData.targetDate}
                onChange={(event) =>
                  handleInputChange("targetDate", event.target.value)
                }
                error={errors.targetDate}
              />

              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                  Tài khoản liên kết ban đầu
                </label>
                <select
                  value={formData.linkedAccountId}
                  onChange={(event) =>
                    handleInputChange("linkedAccountId", event.target.value)
                  }
                  className="w-full px-4 py-2.5 bg-[var(--input-background)] border border-[var(--border)] rounded-[var(--radius-lg)] text-[var(--text-primary)]"
                >
                  <option value="">Không liên kết</option>
                  {filteredAccounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.name} •{" "}
                      {formatCurrency(account.currentBalanceMinor)}₫
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                  Mức ưu tiên
                </label>
                <select
                  value={formData.priority}
                  onChange={(event) =>
                    handleInputChange(
                      "priority",
                      event.target.value as GoalPriority,
                    )
                  }
                  className="w-full px-4 py-2.5 bg-[var(--input-background)] border border-[var(--border)] rounded-[var(--radius-lg)] text-[var(--text-primary)]"
                >
                  <option value="high">Ưu tiên cao</option>
                  <option value="medium">Ưu tiên trung bình</option>
                  <option value="low">Ưu tiên thấp</option>
                </select>
              </div>
            </div>

            <div className="mt-4 p-4 rounded-[var(--radius-lg)] bg-[var(--surface)]">
              <div className="flex items-center justify-between gap-4 mb-2">
                <p className="text-sm text-[var(--text-secondary)]">
                  Xem trước tiến độ
                </p>
                <p className="text-sm font-semibold text-[var(--primary)] tabular-nums">
                  {percentage.toFixed(1)}%
                </p>
              </div>
              <div className="h-3 bg-[var(--border)] rounded-full overflow-hidden mb-3">
                <div
                  className="h-full bg-[var(--primary)] rounded-full transition-all"
                  style={{ width: `${Math.min(percentage, 100)}%` }}
                />
              </div>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-[var(--text-secondary)] mb-1">Đã có</p>
                  <p className="font-semibold text-[var(--text-primary)] tabular-nums">
                    {formatCurrency(balanceAmount)}₫
                  </p>
                </div>
                <div>
                  <p className="text-[var(--text-secondary)] mb-1">Mục tiêu</p>
                  <p className="font-semibold text-[var(--text-primary)] tabular-nums">
                    {formatCurrency(targetAmount)}₫
                  </p>
                </div>
                <div>
                  <p className="text-[var(--text-secondary)] mb-1">Còn lại</p>
                  <p className="font-semibold text-[var(--text-primary)] tabular-nums">
                    {formatCurrency(remaining)}₫
                  </p>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-[var(--primary-light)] rounded-[var(--radius-lg)] flex items-center justify-center">
                  <Zap className="w-5 h-5 text-[var(--primary)]" />
                </div>
                <div>
                  <h3 className="font-semibold text-[var(--text-primary)]">
                    Đóng góp tự động
                  </h3>
                  <p className="text-sm text-[var(--text-secondary)] mt-1">
                    Nếu bật, backend sẽ lưu cấu hình auto contribution cho mục
                    tiêu.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  handleInputChange(
                    "autoContributeEnabled",
                    !formData.autoContributeEnabled,
                  )
                }
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  formData.autoContributeEnabled
                    ? "bg-[var(--primary)]"
                    : "bg-[var(--border)]"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    formData.autoContributeEnabled
                      ? "translate-x-6"
                      : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            {formData.autoContributeEnabled && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                    Số tiền mỗi kỳ
                  </label>
                  <AmountInput
                    value={formData.autoContributeAmount}
                    onChange={(value) =>
                      handleInputChange("autoContributeAmount", value)
                    }
                    error={errors.autoContributeAmount}
                  />
                </div>

                <Input
                  label="Ngày đóng góp"
                  type="number"
                  min={1}
                  max={28}
                  value={formData.autoContributeDay}
                  onChange={(event) =>
                    handleInputChange("autoContributeDay", event.target.value)
                  }
                  error={errors.autoContributeDay}
                />

                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                    Tài khoản nguồn
                  </label>
                  <select
                    value={formData.autoContributeAccountId}
                    onChange={(event) =>
                      handleInputChange(
                        "autoContributeAccountId",
                        event.target.value,
                      )
                    }
                    className="w-full px-4 py-2.5 bg-[var(--input-background)] border border-[var(--border)] rounded-[var(--radius-lg)] text-[var(--text-primary)]"
                  >
                    <option value="">Chọn tài khoản</option>
                    {filteredAccounts.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.name}
                      </option>
                    ))}
                  </select>
                  {errors.autoContributeAccountId && (
                    <p className="mt-1 text-sm text-[var(--danger)]">
                      {errors.autoContributeAccountId}
                    </p>
                  )}
                </div>
              </div>
            )}
          </Card>

          <div className="flex flex-col-reverse md:flex-row gap-3">
            <button
              type="button"
              onClick={nav.goBack}
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
              <span>
                {submitting
                  ? "Đang lưu..."
                  : isEditMode
                    ? "Lưu thay đổi"
                    : "Tạo mục tiêu"}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

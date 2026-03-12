import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Plus,
  Save,
  Trash2,
  Bell,
  BellOff,
  PiggyBank,
} from "lucide-react";
import { useParams } from "react-router";
import { Card } from "../components/Card";
import { Button } from "../components/Button";
import { Input } from "../components/Input";
import { useAppNavigation } from "../hooks/useAppNavigation";
import { useToast } from "../contexts/ToastContext";
import { useBudgetsMeta } from "../hooks/useBudgetsMeta";
import { useBudgetDetail } from "../hooks/useBudgetDetail";
import { budgetsService } from "../services/budgetsService";
import type { BudgetPeriodType } from "../types/budgets";

interface LocalBudgetItem {
  id: string;
  categoryId: string;
  limitAmountMinor: string;
}

interface CreateEditBudgetProps {
  mode?: "create" | "edit";
}

const THRESHOLDS = [50, 80, 100] as const;

function todayString() {
  return new Date().toISOString().slice(0, 10);
}

function getCurrentMonthRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .slice(0, 10);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    .toISOString()
    .slice(0, 10);
  return { start, end };
}

function getCurrentWeekRange() {
  const now = new Date();
  const day = now.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diffToMonday);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  return {
    start: monday.toISOString().slice(0, 10),
    end: sunday.toISOString().slice(0, 10),
  };
}

function getCurrentYearRange() {
  const now = new Date();
  return {
    start: `${now.getFullYear()}-01-01`,
    end: `${now.getFullYear()}-12-31`,
  };
}

function buildRangeByPeriod(periodType: BudgetPeriodType) {
  if (periodType === "weekly") return getCurrentWeekRange();
  if (periodType === "yearly") return getCurrentYearRange();
  if (periodType === "custom") {
    const today = todayString();
    return { start: today, end: today };
  }
  return getCurrentMonthRange();
}

function formatMoney(value?: string | number | null) {
  return new Intl.NumberFormat("vi-VN").format(Number(value || 0));
}

export default function CreateEditBudget({
  mode = "create",
}: CreateEditBudgetProps) {
  const { id } = useParams<{ id: string }>();
  const nav = useAppNavigation();
  const toast = useToast();
  const isEditMode = mode === "edit";

  const {
    data: metaData,
    loading: metaLoading,
    error: metaError,
  } = useBudgetsMeta();

  const {
    data: detailData,
    loading: detailLoading,
    error: detailError,
  } = useBudgetDetail(isEditMode ? id : undefined);

  const [formData, setFormData] = useState({
    name: "",
    periodType: "monthly" as BudgetPeriodType,
    startDate: getCurrentMonthRange().start,
    endDate: getCurrentMonthRange().end,
    rolloverEnabled: false,
    alertsEnabled: true,
  });

  const [items, setItems] = useState<LocalBudgetItem[]>([]);
  const [alertThresholds, setAlertThresholds] = useState<number[]>([80, 100]);
  const [newItemCategoryId, setNewItemCategoryId] = useState("");
  const [newItemLimit, setNewItemLimit] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isEditMode || !detailData?.budget) return;

    setFormData({
      name: detailData.budget.name,
      periodType:
        (detailData.budget.periodType as BudgetPeriodType) || "monthly",
      startDate: detailData.budget.startDate?.slice(0, 10),
      endDate:
        detailData.budget.endDate?.slice(0, 10) ||
        detailData.budget.startDate?.slice(0, 10),
      rolloverEnabled: detailData.budget.rolloverEnabled,
      alertsEnabled: detailData.budget.alertsEnabled,
    });

    setItems(
      detailData.items.map((item) => ({
        id: item.id,
        categoryId: item.categoryId,
        limitAmountMinor: item.limitAmountMinor,
      })),
    );

    setAlertThresholds(
      detailData.budget.alertThresholds?.length
        ? detailData.budget.alertThresholds
        : [80, 100],
    );
  }, [detailData, isEditMode]);

  const availableCategories = useMemo(() => {
    const selected = new Set(items.map((item) => item.categoryId));
    return (metaData?.categories || []).filter(
      (category) =>
        !category.archivedAt &&
        !selected.has(category.id) &&
        (category.categoryType === "expense" ||
          category.categoryType === "both"),
    );
  }, [metaData?.categories, items]);

  const selectedItemsWithMeta = useMemo(() => {
    const byId = new Map((metaData?.categories || []).map((c) => [c.id, c]));
    return items.map((item) => ({
      ...item,
      category: byId.get(item.categoryId) || null,
    }));
  }, [items, metaData?.categories]);

  const totalLimit = useMemo(() => {
    return items.reduce(
      (sum, item) => sum + Number(item.limitAmountMinor || 0),
      0,
    );
  }, [items]);

  const handlePeriodTypeChange = (periodType: BudgetPeriodType) => {
    const range = buildRangeByPeriod(periodType);
    setFormData((prev) => ({
      ...prev,
      periodType,
      startDate: range.start,
      endDate: range.end,
    }));
  };

  const handleAddItem = () => {
    const nextErrors: Record<string, string> = {};

    if (!newItemCategoryId) {
      nextErrors.newItemCategoryId = "Vui lòng chọn danh mục";
    }

    if (!newItemLimit || Number(newItemLimit) <= 0) {
      nextErrors.newItemLimit = "Giới hạn phải lớn hơn 0";
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors((prev) => ({ ...prev, ...nextErrors }));
      return;
    }

    setItems((prev) => [
      ...prev,
      {
        id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        categoryId: newItemCategoryId,
        limitAmountMinor: newItemLimit,
      },
    ]);

    setNewItemCategoryId("");
    setNewItemLimit("");
    setErrors((prev) => ({
      ...prev,
      newItemCategoryId: "",
      newItemLimit: "",
    }));
  };

  const handleRemoveItem = (itemId: string) => {
    setItems((prev) => prev.filter((item) => item.id !== itemId));
  };

  const handleUpdateItemLimit = (itemId: string, value: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, limitAmountMinor: value } : item,
      ),
    );
  };

  const handleToggleThreshold = (threshold: number) => {
    setAlertThresholds((prev) => {
      if (prev.includes(threshold)) {
        const next = prev.filter((item) => item !== threshold);
        if (formData.alertsEnabled && next.length === 0) return [100];
        return next;
      }
      return [...prev, threshold].sort((a, b) => a - b);
    });
  };

  const validate = () => {
    const nextErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      nextErrors.name = "Vui lòng nhập tên ngân sách";
    }

    if (!formData.startDate) {
      nextErrors.startDate = "Vui lòng chọn ngày bắt đầu";
    }

    if (formData.periodType === "custom" && !formData.endDate) {
      nextErrors.endDate = "Ngân sách custom cần ngày kết thúc";
    }

    if (
      formData.endDate &&
      formData.startDate &&
      new Date(formData.endDate) < new Date(formData.startDate)
    ) {
      nextErrors.endDate = "Ngày kết thúc phải sau hoặc bằng ngày bắt đầu";
    }

    if (items.length === 0) {
      nextErrors.items = "Cần ít nhất 1 hạng mục ngân sách";
    }

    if (items.some((item) => Number(item.limitAmountMinor || 0) <= 0)) {
      nextErrors.items = "Mỗi hạng mục phải có giới hạn lớn hơn 0";
    }

    if (formData.alertsEnabled && alertThresholds.length === 0) {
      nextErrors.alertThresholds = "Chọn ít nhất 1 ngưỡng cảnh báo";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validate()) return;

    try {
      setSubmitting(true);

      const payload = {
        name: formData.name.trim(),
        periodType: formData.periodType,
        startDate: formData.startDate,
        endDate:
          formData.periodType === "custom"
            ? formData.endDate
            : formData.endDate,
        rolloverEnabled: formData.rolloverEnabled,
        alertsEnabled: formData.alertsEnabled,
        alertThresholds,
        items: items.map((item) => ({
          categoryId: item.categoryId,
          limitAmountMinor: Number(item.limitAmountMinor || 0),
        })),
      };

      if (isEditMode && id) {
        const result = await budgetsService.updateBudget(id, payload);
        toast.success("Đã cập nhật ngân sách");
        nav.goBudgetDetail(result.budget.id);
      } else {
        const result = await budgetsService.createBudget(payload);
        toast.success("Đã tạo ngân sách");
        nav.goBudgetDetail(result.budget.id);
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Không thể lưu ngân sách",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (metaLoading || (isEditMode && detailLoading)) {
    return (
      <div className="min-h-screen bg-[var(--background)] p-4 md:p-6">
        <Card>
          <p className="text-sm text-[var(--text-secondary)]">
            Đang tải dữ liệu ngân sách...
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
            {metaError || detailError || "Không thể tải dữ liệu ngân sách"}
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
            {isEditMode ? "Chỉnh sửa ngân sách" : "Tạo ngân sách"}
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Quản lý giới hạn theo danh mục và cảnh báo tiến độ ngân sách.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <h3 className="font-semibold text-[var(--text-primary)] mb-4">
              Thông tin cơ bản
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Tên ngân sách"
                placeholder="Ví dụ: Ngân sách chi tiêu tháng 3"
                value={formData.name}
                onChange={(event) =>
                  setFormData((prev) => ({ ...prev, name: event.target.value }))
                }
                error={errors.name}
              />

              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                  Kỳ ngân sách
                </label>
                <select
                  value={formData.periodType}
                  onChange={(event) =>
                    handlePeriodTypeChange(
                      event.target.value as BudgetPeriodType,
                    )
                  }
                  className="w-full px-4 py-2.5 bg-[var(--input-background)] border border-[var(--border)] rounded-[var(--radius-lg)]"
                >
                  <option value="monthly">Hàng tháng</option>
                  <option value="weekly">Hàng tuần</option>
                  <option value="yearly">Hàng năm</option>
                  <option value="custom">Tùy chỉnh</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                  Ngày bắt đầu
                </label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(event) =>
                    setFormData((prev) => ({
                      ...prev,
                      startDate: event.target.value,
                    }))
                  }
                  className="w-full px-4 py-2.5 bg-[var(--input-background)] border border-[var(--border)] rounded-[var(--radius-lg)]"
                />
                {errors.startDate && (
                  <p className="mt-1 text-sm text-[var(--danger)]">
                    {errors.startDate}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                  Ngày kết thúc
                </label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(event) =>
                    setFormData((prev) => ({
                      ...prev,
                      endDate: event.target.value,
                    }))
                  }
                  className="w-full px-4 py-2.5 bg-[var(--input-background)] border border-[var(--border)] rounded-[var(--radius-lg)]"
                />
                {errors.endDate && (
                  <p className="mt-1 text-sm text-[var(--danger)]">
                    {errors.endDate}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <label className="flex items-center justify-between gap-4 cursor-pointer p-4 rounded-[var(--radius-lg)] bg-[var(--surface)]">
                <div>
                  <p className="font-medium text-[var(--text-primary)]">
                    Chuyển phần dư
                  </p>
                  <p className="text-sm text-[var(--text-secondary)]">
                    Nếu bật, phần dư sẽ được giữ lại sang kỳ tiếp theo.
                  </p>
                </div>

                <input
                  type="checkbox"
                  checked={formData.rolloverEnabled}
                  onChange={(event) =>
                    setFormData((prev) => ({
                      ...prev,
                      rolloverEnabled: event.target.checked,
                    }))
                  }
                  className="w-5 h-5"
                />
              </label>

              <label className="flex items-center justify-between gap-4 cursor-pointer p-4 rounded-[var(--radius-lg)] bg-[var(--surface)]">
                <div className="flex items-start gap-3">
                  {formData.alertsEnabled ? (
                    <Bell className="w-5 h-5 text-[var(--warning)] mt-0.5" />
                  ) : (
                    <BellOff className="w-5 h-5 text-[var(--text-tertiary)] mt-0.5" />
                  )}
                  <div>
                    <p className="font-medium text-[var(--text-primary)]">
                      Bật cảnh báo
                    </p>
                    <p className="text-sm text-[var(--text-secondary)]">
                      Nhắc khi chi tiêu chạm các ngưỡng đã chọn.
                    </p>
                  </div>
                </div>

                <input
                  type="checkbox"
                  checked={formData.alertsEnabled}
                  onChange={(event) =>
                    setFormData((prev) => ({
                      ...prev,
                      alertsEnabled: event.target.checked,
                    }))
                  }
                  className="w-5 h-5"
                />
              </label>
            </div>

            {formData.alertsEnabled && (
              <div className="mt-4">
                <p className="text-sm font-medium text-[var(--text-primary)] mb-2">
                  Ngưỡng cảnh báo
                </p>
                <div className="flex flex-wrap gap-2">
                  {THRESHOLDS.map((threshold) => {
                    const active = alertThresholds.includes(threshold);
                    return (
                      <button
                        key={threshold}
                        type="button"
                        onClick={() => handleToggleThreshold(threshold)}
                        className={`px-3 py-2 rounded-[var(--radius-lg)] text-sm font-medium border transition-colors ${
                          active
                            ? "bg-[var(--warning-light)] text-[var(--warning)] border-[var(--warning)]/20"
                            : "bg-[var(--surface)] text-[var(--text-secondary)] border-[var(--border)]"
                        }`}
                      >
                        {threshold}%
                      </button>
                    );
                  })}
                </div>
                {errors.alertThresholds && (
                  <p className="mt-2 text-sm text-[var(--danger)]">
                    {errors.alertThresholds}
                  </p>
                )}
              </div>
            )}
          </Card>

          <Card>
            <div className="flex items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="font-semibold text-[var(--text-primary)]">
                  Hạng mục ngân sách
                </h3>
                <p className="text-sm text-[var(--text-secondary)] mt-1">
                  Chọn các danh mục chi tiêu cần theo dõi và đặt giới hạn riêng.
                </p>
              </div>

              <div className="text-right">
                <p className="text-xs text-[var(--text-secondary)]">
                  Tổng giới hạn
                </p>
                <p className="font-semibold text-[var(--text-primary)] tabular-nums">
                  {formatMoney(totalLimit)}₫
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-4">
              <div className="md:col-span-7">
                <select
                  value={newItemCategoryId}
                  onChange={(event) => setNewItemCategoryId(event.target.value)}
                  className="w-full px-4 py-2.5 bg-[var(--input-background)] border border-[var(--border)] rounded-[var(--radius-lg)]"
                >
                  <option value="">Chọn danh mục để thêm</option>
                  {availableCategories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                {errors.newItemCategoryId && (
                  <p className="mt-1 text-sm text-[var(--danger)]">
                    {errors.newItemCategoryId}
                  </p>
                )}
              </div>

              <div className="md:col-span-3">
                <input
                  type="number"
                  min="0"
                  value={newItemLimit}
                  onChange={(event) => setNewItemLimit(event.target.value)}
                  placeholder="Giới hạn"
                  className="w-full px-4 py-2.5 bg-[var(--input-background)] border border-[var(--border)] rounded-[var(--radius-lg)]"
                />
                {errors.newItemLimit && (
                  <p className="mt-1 text-sm text-[var(--danger)]">
                    {errors.newItemLimit}
                  </p>
                )}
              </div>

              <div className="md:col-span-2">
                <Button
                  type="button"
                  className="w-full"
                  onClick={handleAddItem}
                >
                  <Plus className="w-4 h-4" />
                  Thêm
                </Button>
              </div>
            </div>

            {errors.items && (
              <p className="mb-3 text-sm text-[var(--danger)]">
                {errors.items}
              </p>
            )}

            <div className="space-y-3">
              {selectedItemsWithMeta.length === 0 ? (
                <div className="rounded-[var(--radius-lg)] border border-dashed border-[var(--border)] p-6 text-center">
                  <PiggyBank className="w-8 h-8 text-[var(--text-tertiary)] mx-auto mb-2" />
                  <p className="text-sm text-[var(--text-secondary)]">
                    Chưa có hạng mục nào trong ngân sách này.
                  </p>
                </div>
              ) : (
                selectedItemsWithMeta.map((item) => (
                  <div
                    key={item.id}
                    className="grid grid-cols-1 md:grid-cols-12 gap-3 p-4 rounded-[var(--radius-lg)] bg-[var(--surface)]"
                  >
                    <div className="md:col-span-7 min-w-0">
                      <p className="font-medium text-[var(--text-primary)] truncate">
                        {item.category?.name || "Danh mục"}
                      </p>
                      <p className="text-xs text-[var(--text-secondary)] mt-1">
                        {item.category?.categoryType === "both"
                          ? "Chi tiêu / Thu nhập"
                          : item.category?.categoryType === "income"
                            ? "Thu nhập"
                            : "Chi tiêu"}
                      </p>
                    </div>

                    <div className="md:col-span-3">
                      <input
                        type="number"
                        min="0"
                        value={item.limitAmountMinor}
                        onChange={(event) =>
                          handleUpdateItemLimit(item.id, event.target.value)
                        }
                        className="w-full px-4 py-2.5 bg-[var(--card)] border border-[var(--border)] rounded-[var(--radius-lg)]"
                      />
                    </div>

                    <div className="md:col-span-2 flex justify-end">
                      <Button
                        type="button"
                        variant="danger"
                        onClick={() => handleRemoveItem(item.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>

          <div className="flex flex-col-reverse md:flex-row gap-3">
            <Button type="button" variant="secondary" onClick={nav.goBack}>
              Huỷ
            </Button>

            <Button type="submit" disabled={submitting}>
              <Save className="w-4 h-4" />
              {submitting
                ? "Đang lưu..."
                : isEditMode
                  ? "Lưu thay đổi"
                  : "Tạo ngân sách"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

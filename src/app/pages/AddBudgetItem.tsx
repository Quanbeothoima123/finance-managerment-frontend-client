import React, { useMemo, useState } from "react";
import { useParams } from "react-router";
import { ArrowLeft, Plus, Save } from "lucide-react";
import { Card } from "../components/Card";
import { Button } from "../components/Button";
import { useAppNavigation } from "../hooks/useAppNavigation";
import { useToast } from "../contexts/ToastContext";
import { useBudgetsMeta } from "../hooks/useBudgetsMeta";
import { useBudgetDetail } from "../hooks/useBudgetDetail";
import { budgetsService } from "../services/budgetsService";

interface AddBudgetItemProps {
  onClose?: () => void;
  onSave?: (data: {
    categoryId: string;
    limitAmountMinor: number;
    alertThresholds: number[];
  }) => void;
  isModal?: boolean;
}

export default function AddBudgetItem({
  onClose,
  onSave,
  isModal = false,
}: AddBudgetItemProps) {
  const { id } = useParams<{ id: string }>();
  const nav = useAppNavigation();
  const toast = useToast();

  const {
    data: metaData,
    loading: metaLoading,
    error: metaError,
  } = useBudgetsMeta();

  const {
    data: detailData,
    loading: detailLoading,
    error: detailError,
  } = useBudgetDetail(id);

  const [categoryId, setCategoryId] = useState("");
  const [limitAmountMinor, setLimitAmountMinor] = useState("");
  const [alertThresholds, setAlertThresholds] = useState<number[]>([80, 100]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const availableCategories = useMemo(() => {
    const existing = new Set(
      (detailData?.items || []).map((item) => item.categoryId),
    );
    return (metaData?.categories || []).filter(
      (category) =>
        !category.archivedAt &&
        !existing.has(category.id) &&
        (category.categoryType === "expense" ||
          category.categoryType === "both"),
    );
  }, [metaData?.categories, detailData?.items]);

  const validate = () => {
    const nextErrors: Record<string, string> = {};

    if (!categoryId) {
      nextErrors.categoryId = "Vui lòng chọn danh mục";
    }

    if (!limitAmountMinor || Number(limitAmountMinor) <= 0) {
      nextErrors.limitAmountMinor = "Giới hạn phải lớn hơn 0";
    }

    if (alertThresholds.length === 0) {
      nextErrors.alertThresholds = "Chọn ít nhất 1 ngưỡng cảnh báo";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validate()) return;

    const payload = {
      categoryId,
      limitAmountMinor: Number(limitAmountMinor),
      alertThresholds,
    };

    if (onSave) {
      onSave(payload);
      onClose?.();
      return;
    }

    if (!id) {
      toast.error("Thiếu budget id");
      return;
    }

    try {
      setSubmitting(true);
      await budgetsService.addBudgetItem(id, payload);
      toast.success("Đã thêm hạng mục ngân sách");
      if (isModal) {
        onClose?.();
      } else {
        nav.goBudgetDetail(id);
      }
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Không thể thêm hạng mục ngân sách",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const content = (
    <div className={isModal ? "" : "min-h-screen bg-[var(--background)]"}>
      <div
        className={isModal ? "" : "max-w-2xl mx-auto p-4 md:p-6 pb-20 md:pb-6"}
      >
        {!isModal && (
          <div className="mb-6">
            <button
              onClick={nav.goBack}
              className="flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] mb-4 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Quay lại</span>
            </button>

            <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
              Thêm hạng mục ngân sách
            </h1>
            <p className="text-sm text-[var(--text-secondary)] mt-1">
              Chọn danh mục chi tiêu và giới hạn cho ngân sách hiện tại.
            </p>
          </div>
        )}

        {(metaLoading || detailLoading) && (
          <Card>
            <p className="text-sm text-[var(--text-secondary)]">
              Đang tải dữ liệu...
            </p>
          </Card>
        )}

        {(metaError || detailError) && (
          <Card>
            <p className="text-sm text-[var(--danger)]">
              {metaError || detailError || "Không thể tải dữ liệu"}
            </p>
          </Card>
        )}

        {!metaLoading && !detailLoading && !metaError && !detailError && (
          <form onSubmit={handleSubmit} className="space-y-6">
            <Card>
              <h3 className="font-semibold text-[var(--text-primary)] mb-4">
                Thông tin hạng mục
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                    Danh mục
                  </label>
                  <select
                    value={categoryId}
                    onChange={(event) => setCategoryId(event.target.value)}
                    className="w-full px-4 py-2.5 bg-[var(--input-background)] border border-[var(--border)] rounded-[var(--radius-lg)]"
                  >
                    <option value="">Chọn danh mục</option>
                    {availableCategories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                  {errors.categoryId && (
                    <p className="mt-1 text-sm text-[var(--danger)]">
                      {errors.categoryId}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                    Giới hạn
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={limitAmountMinor}
                    onChange={(event) =>
                      setLimitAmountMinor(event.target.value)
                    }
                    placeholder="Ví dụ: 2000000"
                    className="w-full px-4 py-2.5 bg-[var(--input-background)] border border-[var(--border)] rounded-[var(--radius-lg)]"
                  />
                  {errors.limitAmountMinor && (
                    <p className="mt-1 text-sm text-[var(--danger)]">
                      {errors.limitAmountMinor}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                    Ngưỡng cảnh báo
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {[50, 80, 100].map((threshold) => {
                      const active = alertThresholds.includes(threshold);
                      return (
                        <button
                          key={threshold}
                          type="button"
                          onClick={() =>
                            setAlertThresholds((prev) => {
                              if (prev.includes(threshold)) {
                                const next = prev.filter(
                                  (item) => item !== threshold,
                                );
                                return next.length ? next : [100];
                              }
                              return [...prev, threshold].sort((a, b) => a - b);
                            })
                          }
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
              </div>
            </Card>

            <div className="flex flex-col-reverse md:flex-row gap-3">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  if (isModal) onClose?.();
                  else nav.goBack();
                }}
              >
                Huỷ
              </Button>

              <Button type="submit" disabled={submitting}>
                {isModal ? (
                  <Save className="w-4 h-4" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                {submitting ? "Đang lưu..." : "Thêm hạng mục"}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );

  if (isModal) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <div
          className="bg-[var(--card)] rounded-[var(--radius-xl)] p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          onClick={(event) => event.stopPropagation()}
        >
          {content}
        </div>
      </div>
    );
  }

  return content;
}

import React, { useMemo, useState } from "react";
import { useParams } from "react-router";
import { ArrowLeft, Plus, Save } from "lucide-react";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation("budgets");

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
      nextErrors.categoryId = t("add_item.errors.category_required");
    }

    if (!limitAmountMinor || Number(limitAmountMinor) <= 0) {
      nextErrors.limitAmountMinor = t("add_item.errors.limit_invalid");
    }

    if (alertThresholds.length === 0) {
      nextErrors.alertThresholds = t(
        "add_item.errors.alert_threshold_required",
      );
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
      toast.error(t("add_item.errors.missing_budget_id"));
      return;
    }

    try {
      setSubmitting(true);
      await budgetsService.addBudgetItem(id, payload);
      toast.success(t("add_item.success"));
      if (isModal) {
        onClose?.();
      } else {
        nav.goBudgetDetail(id);
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : t("add_item.errors.save_failed"),
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
              <span className="font-medium">{t("add_item.back")}</span>
            </button>

            <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
              {t("add_item.title")}
            </h1>
            <p className="text-sm text-[var(--text-secondary)] mt-1">
              {t("add_item.subtitle")}
            </p>
          </div>
        )}

        {(metaLoading || detailLoading) && (
          <Card>
            <p className="text-sm text-[var(--text-secondary)]">
              {t("add_item.loading")}
            </p>
          </Card>
        )}

        {(metaError || detailError) && (
          <Card>
            <p className="text-sm text-[var(--danger)]">
              {metaError || detailError || t("add_item.errors.load_failed")}
            </p>
          </Card>
        )}

        {!metaLoading && !detailLoading && !metaError && !detailError && (
          <form onSubmit={handleSubmit} className="space-y-6">
            <Card>
              <h3 className="font-semibold text-[var(--text-primary)] mb-4">
                {t("add_item.item_info_section")}
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                    {t("add_item.category_label")}
                  </label>
                  <select
                    value={categoryId}
                    onChange={(event) => setCategoryId(event.target.value)}
                    className="w-full px-4 py-2.5 bg-[var(--input-background)] border border-[var(--border)] rounded-[var(--radius-lg)]"
                  >
                    <option value="">
                      {t("add_item.category_placeholder")}
                    </option>
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
                    {t("add_item.limit_label")}
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={limitAmountMinor}
                    onChange={(event) =>
                      setLimitAmountMinor(event.target.value)
                    }
                    placeholder={t("add_item.limit_placeholder")}
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
                    {t("add_item.alert_threshold_label")}
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
                {t("add_item.cancel")}
              </Button>

              <Button type="submit" disabled={submitting}>
                {isModal ? (
                  <Save className="w-4 h-4" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                {submitting ? t("add_item.submitting") : t("add_item.submit")}
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

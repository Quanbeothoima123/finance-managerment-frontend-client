import React, { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Save } from "lucide-react";
import { useParams } from "react-router";
import { useTranslation } from "react-i18next";
import { Card } from "../components/Card";
import { Input } from "../components/Input";
import { AmountInput } from "../components/AmountInput";
import { Button } from "../components/Button";
import { useAppNavigation } from "../hooks/useAppNavigation";
import { useToast } from "../contexts/ToastContext";
import { useGoalsMeta } from "../hooks/useGoalsMeta";
import { useGoalDetail } from "../hooks/useGoalDetail";
import { goalsService } from "../services/goalsService";
import type { CreateGoalPayload, GoalPriority } from "../types/goals";
import {
  buildGoalPreview,
  formatCurrency,
  goalColorOptions,
  goalIconOptions,
  toDateInputValue,
} from "../utils/goalHelpers";

interface CreateEditGoalProps {
  mode?: "create" | "edit";
  initialData?: {
    id?: string;
    name: string;
    icon: string;
    color: string;
    targetAmount: string;
    initialAmount: string;
    startDate: string;
    targetDate: string;
    linkedAccountId: string;
    note: string;
    priority: GoalPriority;
  };
  standalonePreview?: boolean;
}

interface GoalFormState {
  name: string;
  icon: string;
  color: string;
  targetAmount: string;
  initialAmount: string;
  startDate: string;
  targetDate: string;
  linkedAccountId: string;
  note: string;
  priority: GoalPriority;
  autoContributeEnabled: boolean;
  autoContributeAmount: string;
  autoContributeDay: string;
  autoContributeAccountId: string;
}

const defaultState: GoalFormState = {
  name: "",
  icon: "target",
  color: "#3b82f6",
  targetAmount: "",
  initialAmount: "",
  startDate: new Date().toISOString().slice(0, 10),
  targetDate: "",
  linkedAccountId: "",
  note: "",
  priority: "medium",
  autoContributeEnabled: false,
  autoContributeAmount: "",
  autoContributeDay: "",
  autoContributeAccountId: "",
};

function buildFormState(
  initialData?: CreateEditGoalProps["initialData"],
): GoalFormState {
  return {
    ...defaultState,
    name: initialData?.name || "",
    icon: initialData?.icon || "target",
    color: initialData?.color || "#3b82f6",
    targetAmount: initialData?.targetAmount || "",
    initialAmount: initialData?.initialAmount || "",
    startDate: initialData?.startDate || new Date().toISOString().slice(0, 10),
    targetDate: initialData?.targetDate || "",
    linkedAccountId: initialData?.linkedAccountId || "",
    note: initialData?.note || "",
    priority: initialData?.priority || "medium",
  };
}

export default function CreateEditGoal({
  mode = "create",
  initialData,
  standalonePreview = false,
}: CreateEditGoalProps) {
  const { t } = useTranslation("goals");
  const nav = useAppNavigation();
  const toast = useToast();
  const { id } = useParams<{ id: string }>();
  const goalId = mode === "edit" ? initialData?.id || id : undefined;
  const {
    data: metaData,
    loading: metaLoading,
    error: metaError,
  } = useGoalsMeta(!standalonePreview);
  const {
    data: detailData,
    loading: detailLoading,
    error: detailError,
  } = useGoalDetail(goalId, !standalonePreview);
  const [formData, setFormData] = useState<GoalFormState>(() =>
    buildFormState(initialData),
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (standalonePreview || mode !== "edit" || !detailData?.goal) return;
    const goal = detailData.goal;
    setFormData({
      name: goal.name,
      icon: goal.icon || "target",
      color: goal.color || "#3b82f6",
      targetAmount: goal.targetAmountMinor || String(goal.targetAmount || ""),
      initialAmount: goal.currentAmountMinor || String(goal.currentAmount || 0),
      startDate:
        toDateInputValue(goal.startDate) ||
        new Date().toISOString().slice(0, 10),
      targetDate: toDateInputValue(goal.targetDate || goal.deadline),
      linkedAccountId: goal.linkedAccountId || "",
      note: goal.note || "",
      priority: (goal.priority as GoalPriority) || "medium",
      autoContributeEnabled: Boolean(goal.autoContributeEnabled),
      autoContributeAmount: goal.autoContributeAmountMinor || "",
      autoContributeDay: goal.autoContributeDay
        ? String(goal.autoContributeDay)
        : "",
      autoContributeAccountId: goal.autoContributeAccountId || "",
    });
  }, [detailData, mode, standalonePreview]);

  const accounts = metaData?.accounts || [];
  const pageLoading =
    !standalonePreview && (metaLoading || (mode === "edit" && detailLoading));
  const pageError = !standalonePreview ? metaError || detailError : null;

  const preview = useMemo(
    () =>
      buildGoalPreview({
        name: formData.name,
        icon: formData.icon,
        color: formData.color,
        currentAmount: Number(formData.initialAmount || 0),
        targetAmount: Number(formData.targetAmount || 0),
      }),
    [formData],
  );

  const remaining = Math.max(preview.targetAmount - preview.currentAmount, 0);

  const handleInputChange = <K extends keyof GoalFormState>(
    field: K,
    value: GoalFormState[K],
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const validateForm = () => {
    const nextErrors: Record<string, string> = {};

    if (!formData.name.trim()) nextErrors.name = t("form.errors.name_required");
    if (!formData.targetAmount)
      nextErrors.targetAmount = t("form.errors.target_amount_required");
    if (!formData.startDate)
      nextErrors.startDate = t("form.errors.start_date_required");
    if (!formData.targetDate)
      nextErrors.targetDate = t("form.errors.target_date_required");

    const targetAmount = Number(formData.targetAmount || 0);
    const initialAmount = Number(formData.initialAmount || 0);

    if (
      formData.targetAmount &&
      (!Number.isFinite(targetAmount) || targetAmount <= 0)
    ) {
      nextErrors.targetAmount = t("form.errors.target_amount_positive");
    }

    if (
      formData.initialAmount &&
      (!Number.isFinite(initialAmount) || initialAmount < 0)
    ) {
      nextErrors.initialAmount = t("form.errors.initial_amount_invalid");
    }

    if (initialAmount > targetAmount) {
      nextErrors.initialAmount = t("form.errors.initial_exceeds_target");
    }

    if (
      formData.startDate &&
      formData.targetDate &&
      formData.startDate >= formData.targetDate
    ) {
      nextErrors.targetDate = t("form.errors.target_date_before_start");
    }

    if (formData.autoContributeEnabled) {
      if (
        !formData.autoContributeAmount ||
        Number(formData.autoContributeAmount) <= 0
      ) {
        nextErrors.autoContributeAmount = t("form.errors.auto_amount_required");
      }
      const day = Number(formData.autoContributeDay || 0);
      if (!day || day < 1 || day > 28) {
        nextErrors.autoContributeDay = t("form.errors.auto_day_range");
      }
      if (!formData.autoContributeAccountId) {
        nextErrors.autoContributeAccountId = t(
          "form.errors.auto_account_required",
        );
      }
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!validateForm()) return;

    if (standalonePreview) {
      toast.info(t("form.toast.preview_mode"));
      return;
    }

    const payload: CreateGoalPayload = {
      name: formData.name.trim(),
      icon: formData.icon,
      color: formData.color,
      note: formData.note.trim() || null,
      startDate: formData.startDate,
      targetDate: formData.targetDate,
      targetAmountMinor: formData.targetAmount,
      initialAmount: formData.initialAmount || "0",
      priority: formData.priority,
      linkedAccountId: formData.linkedAccountId || null,
      autoContributeEnabled: formData.autoContributeEnabled,
      autoContributeAmountMinor: formData.autoContributeEnabled
        ? formData.autoContributeAmount
        : null,
      autoContributeDay: formData.autoContributeEnabled
        ? Number(formData.autoContributeDay)
        : null,
      autoContributeAccountId: formData.autoContributeEnabled
        ? formData.autoContributeAccountId || null
        : null,
      currencyCode:
        metaData?.defaults.currencyCode ||
        metaData?.ledger.baseCurrencyCode ||
        "VND",
    };

    try {
      setSaving(true);
      const result =
        mode === "edit" && goalId
          ? await goalsService.updateGoal(goalId, payload)
          : await goalsService.createGoal(payload);

      toast.success(
        mode === "edit" ? t("form.toast.updated") : t("form.toast.created"),
      );
      nav.goGoalDetail(result.goal.id);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : t("form.toast.save_failed"),
      );
    } finally {
      setSaving(false);
    }
  };

  if (pageLoading) {
    return (
      <div className="p-4 md:p-6">
        <Card>
          <p className="text-[var(--text-secondary)]">{t("form.loading")}</p>
        </Card>
      </div>
    );
  }

  if (pageError) {
    return (
      <div className="p-4 md:p-6">
        <Card>
          <p className="text-[var(--danger)]">{pageError}</p>
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
            {t("form.back")}
          </button>
          <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
            {mode === "create" ? t("form.create_title") : t("form.edit_title")}
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            {mode === "create"
              ? t("form.create_subtitle")
              : t("form.edit_subtitle")}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <h2 className="font-semibold text-[var(--text-primary)] mb-4">
              {t("form.basic_info.title")}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                  {t("form.basic_info.icon_label")}
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {goalIconOptions.map((item) => (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => handleInputChange("icon", item.key)}
                      className={`aspect-square rounded-[var(--radius-lg)] text-2xl flex items-center justify-center transition-all ${
                        formData.icon === item.key
                          ? "bg-[var(--primary-light)] ring-2 ring-[var(--primary)]"
                          : "bg-[var(--surface)] hover:bg-[var(--surface-elevated)]"
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                  {t("form.basic_info.color_label")}
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {goalColorOptions.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => handleInputChange("color", color)}
                      className={`aspect-square rounded-[var(--radius-lg)] ${formData.color === color ? "ring-2 ring-offset-2 ring-[var(--text-primary)]" : ""}`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label={t("form.basic_info.name_label")}
                value={formData.name}
                onChange={(event) =>
                  handleInputChange("name", event.target.value)
                }
                error={errors.name}
                placeholder={t("form.basic_info.name_placeholder")}
              />
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-[var(--text-primary)]">
                  {t("form.basic_info.priority_label")}
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
                  <option value="high">
                    {t("form.basic_info.priority.high")}
                  </option>
                  <option value="medium">
                    {t("form.basic_info.priority.medium")}
                  </option>
                  <option value="low">
                    {t("form.basic_info.priority.low")}
                  </option>
                </select>
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-1.5">
              <label className="text-sm font-medium text-[var(--text-primary)]">
                {t("form.basic_info.note_label")}
              </label>
              <textarea
                value={formData.note}
                onChange={(event) =>
                  handleInputChange("note", event.target.value)
                }
                rows={4}
                placeholder={t("form.basic_info.note_placeholder")}
                className="w-full px-4 py-3 bg-[var(--input-background)] border border-[var(--border)] rounded-[var(--radius-lg)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)]"
              />
            </div>
          </Card>

          <Card>
            <h2 className="font-semibold text-[var(--text-primary)] mb-4">
              {t("form.finance.title")}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <AmountInput
                  value={formData.targetAmount}
                  onChange={(value) => handleInputChange("targetAmount", value)}
                  error={errors.targetAmount}
                />
              </div>
              <div>
                <AmountInput
                  value={formData.initialAmount}
                  onChange={(value) =>
                    handleInputChange("initialAmount", value)
                  }
                  error={errors.initialAmount}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <Input
                label={t("form.finance.start_date_label")}
                type="date"
                value={formData.startDate}
                onChange={(event) =>
                  handleInputChange("startDate", event.target.value)
                }
                error={errors.startDate}
              />
              <Input
                label={t("form.finance.target_date_label")}
                type="date"
                value={formData.targetDate}
                onChange={(event) =>
                  handleInputChange("targetDate", event.target.value)
                }
                error={errors.targetDate}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-[var(--text-primary)]">
                  {t("form.finance.linked_account_label")}
                </label>
                <select
                  value={formData.linkedAccountId}
                  onChange={(event) =>
                    handleInputChange("linkedAccountId", event.target.value)
                  }
                  className="w-full px-4 py-2.5 bg-[var(--input-background)] border border-[var(--border)] rounded-[var(--radius-lg)] text-[var(--text-primary)]"
                >
                  <option value="">
                    {t("form.finance.no_linked_account")}
                  </option>
                  {accounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.name} •{" "}
                      {formatCurrency(account.currentBalanceMinor)}₫
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-6 p-4 rounded-[var(--radius-lg)] bg-[var(--surface)]">
              <p className="text-sm text-[var(--text-secondary)] mb-3">
                {t("form.finance.preview.label")}
              </p>
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-[var(--text-secondary)]">
                  {formatCurrency(preview.currentAmount)}₫ /{" "}
                  {formatCurrency(preview.targetAmount)}₫
                </span>
                <span className="font-semibold text-[var(--primary)]">
                  {preview.progressPercent.toFixed(1)}%
                </span>
              </div>
              <div className="h-3 rounded-full bg-[var(--border)] overflow-hidden">
                <div
                  className="h-full bg-[var(--primary)] rounded-full"
                  style={{
                    width: `${Math.min(preview.progressPercent, 100)}%`,
                  }}
                />
              </div>
              <div className="grid grid-cols-3 gap-4 mt-4 text-sm">
                <div>
                  <p className="text-[var(--text-secondary)]">
                    {t("form.finance.preview.current")}
                  </p>
                  <p className="font-semibold text-[var(--text-primary)]">
                    {formatCurrency(preview.currentAmount)}₫
                  </p>
                </div>
                <div>
                  <p className="text-[var(--text-secondary)]">
                    {t("form.finance.preview.target")}
                  </p>
                  <p className="font-semibold text-[var(--text-primary)]">
                    {formatCurrency(preview.targetAmount)}₫
                  </p>
                </div>
                <div>
                  <p className="text-[var(--text-secondary)]">
                    {t("form.finance.preview.remaining")}
                  </p>
                  <p className="font-semibold text-[var(--text-primary)]">
                    {formatCurrency(remaining)}₫
                  </p>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="font-semibold text-[var(--text-primary)]">
                  {t("form.auto_contribute.title")}
                </h2>
                <p className="text-sm text-[var(--text-secondary)] mt-1">
                  {t("form.auto_contribute.subtitle")}
                </p>
              </div>
              <label className="inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.autoContributeEnabled}
                  onChange={(event) =>
                    handleInputChange(
                      "autoContributeEnabled",
                      event.target.checked,
                    )
                  }
                  className="sr-only"
                />
                <span
                  className={`w-12 h-7 rounded-full transition-colors ${formData.autoContributeEnabled ? "bg-[var(--primary)]" : "bg-[var(--border)]"} relative`}
                >
                  <span
                    className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white transition-transform ${formData.autoContributeEnabled ? "translate-x-5" : ""}`}
                  />
                </span>
              </label>
            </div>

            {formData.autoContributeEnabled && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                <div>
                  <AmountInput
                    value={formData.autoContributeAmount}
                    onChange={(value) =>
                      handleInputChange("autoContributeAmount", value)
                    }
                    error={errors.autoContributeAmount}
                    compact
                  />
                </div>
                <Input
                  label={t("form.auto_contribute.day_label")}
                  type="number"
                  min={1}
                  max={28}
                  value={formData.autoContributeDay}
                  onChange={(event) =>
                    handleInputChange("autoContributeDay", event.target.value)
                  }
                  error={errors.autoContributeDay}
                />
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-[var(--text-primary)]">
                    {t("form.auto_contribute.account_label")}
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
                    <option value="">
                      {t("form.auto_contribute.account_placeholder")}
                    </option>
                    {accounts.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.name}
                      </option>
                    ))}
                  </select>
                  {errors.autoContributeAccountId && (
                    <span className="text-sm text-[var(--danger)]">
                      {errors.autoContributeAccountId}
                    </span>
                  )}
                </div>
              </div>
            )}
          </Card>

          <div className="flex flex-col-reverse sm:flex-row gap-3 justify-start">
            <Button
              type="button"
              variant="secondary"
              onClick={() => nav.goBack()}
            >
              {t("form.actions.cancel")}
            </Button>
            <Button type="submit" disabled={saving}>
              <Save className="w-4 h-4" />
              {saving
                ? t("form.actions.saving")
                : mode === "create"
                  ? t("form.actions.create")
                  : t("form.actions.save")}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Save,
  ShoppingCart,
  Home,
  Car,
  Utensils,
  Coffee,
  Shirt,
  Heart,
  Briefcase,
  DollarSign,
  Gift,
  TrendingUp,
  Smartphone,
  Plane,
  Book,
  Music,
  Film,
  Dumbbell,
  PawPrint,
  Baby,
  Wrench,
  Lightbulb,
  Newspaper,
  Package,
  Folder,
} from "lucide-react";
import { useParams } from "react-router";
import { useTranslation } from "react-i18next";
import { Card } from "../components/Card";
import { Input } from "../components/Input";
import { Button } from "../components/Button";
import { useAppNavigation } from "../hooks/useAppNavigation";
import { useToast } from "../contexts/ToastContext";
import { categoriesService } from "../services/categoriesService";
import { useCategoriesMeta } from "../hooks/useCategoriesMeta";
import { useCategoryDetail } from "../hooks/useCategoryDetail";
import type { CategoryKind, CategoryItem } from "../types/categories";

const colorPalette = [
  "#ef4444",
  "#f97316",
  "#f59e0b",
  "#eab308",
  "#84cc16",
  "#22c55e",
  "#10b981",
  "#14b8a6",
  "#06b6d4",
  "#0ea5e9",
  "#3b82f6",
  "#6366f1",
  "#8b5cf6",
  "#a855f7",
  "#d946ef",
  "#ec4899",
  "#f43f5e",
  "#64748b",
  "#475569",
  "#1e293b",
];

interface CreateEditCategoryProps {
  mode?: "create" | "edit";
}

function normalizeColor(value: string) {
  if (!value) return "";
  return value.startsWith("#") ? value : `#${value}`;
}

function isTypeCompatible(childType: string, parentType: string) {
  return (
    childType === parentType || childType === "both" || parentType === "both"
  );
}

function getParentOptionsForCreate(
  categories: CategoryItem[],
  kind: CategoryKind,
) {
  return categories.filter(
    (item) =>
      !item.parentId &&
      !item.archivedAt &&
      !item.isHidden &&
      isTypeCompatible(kind, item.categoryType),
  );
}

export default function CreateEditCategory({
  mode = "create",
}: CreateEditCategoryProps) {
  const { t } = useTranslation('categories');
  const { id } = useParams<{ id: string }>();
  const nav = useAppNavigation();
  const toast = useToast();

  const isEditMode = mode === "edit";

  const availableIcons = [
    { value: "shopping", label: t('form.icon_labels.shopping'), Icon: ShoppingCart },
    { value: "home", label: t('form.icon_labels.home'), Icon: Home },
    { value: "car", label: t('form.icon_labels.car'), Icon: Car },
    { value: "food", label: t('form.icon_labels.food'), Icon: Utensils },
    { value: "coffee", label: t('form.icon_labels.coffee'), Icon: Coffee },
    { value: "shirt", label: t('form.icon_labels.shirt'), Icon: Shirt },
    { value: "health", label: t('form.icon_labels.health'), Icon: Heart },
    { value: "work", label: t('form.icon_labels.work'), Icon: Briefcase },
    { value: "salary", label: t('form.icon_labels.salary'), Icon: DollarSign },
    { value: "gift", label: t('form.icon_labels.gift'), Icon: Gift },
    { value: "investment", label: t('form.icon_labels.investment'), Icon: TrendingUp },
    { value: "phone", label: t('form.icon_labels.phone'), Icon: Smartphone },
    { value: "travel", label: t('form.icon_labels.travel'), Icon: Plane },
    { value: "education", label: t('form.icon_labels.education'), Icon: Book },
    { value: "entertainment", label: t('form.icon_labels.entertainment'), Icon: Music },
    { value: "movie", label: t('form.icon_labels.movie'), Icon: Film },
    { value: "fitness", label: t('form.icon_labels.fitness'), Icon: Dumbbell },
    { value: "pet", label: t('form.icon_labels.pet'), Icon: PawPrint },
    { value: "baby", label: t('form.icon_labels.baby'), Icon: Baby },
    { value: "maintenance", label: t('form.icon_labels.maintenance'), Icon: Wrench },
    { value: "utility", label: t('form.icon_labels.utility'), Icon: Lightbulb },
    { value: "subscription", label: t('form.icon_labels.subscription'), Icon: Newspaper },
    { value: "delivery", label: t('form.icon_labels.delivery'), Icon: Package },
  ];

  const {
    data: metaData,
    loading: metaLoading,
    error: metaError,
  } = useCategoriesMeta();

  const {
    data: detailData,
    loading: detailLoading,
    error: detailError,
  } = useCategoryDetail(isEditMode ? id : undefined);

  const [formData, setFormData] = useState<{
    name: string;
    kind: CategoryKind;
    icon: string;
    color: string;
    parentId: string;
    active: boolean;
  }>({
    name: "",
    kind: "expense",
    icon: "shopping",
    color: "#ef4444",
    parentId: "",
    active: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isEditMode || !detailData?.category) return;

    setFormData({
      name: detailData.category.name,
      kind: (detailData.category.categoryType as CategoryKind) || "expense",
      icon: detailData.category.iconKey || "shopping",
      color: detailData.category.colorHex || "#ef4444",
      parentId: detailData.category.parentId || "",
      active: !detailData.category.isHidden,
    });
  }, [detailData, isEditMode]);

  const parentCategoryOptions = useMemo(() => {
    if (isEditMode && detailData) {
      return detailData.eligibleParents.filter((item) =>
        isTypeCompatible(formData.kind, item.categoryType),
      );
    }

    return getParentOptionsForCreate(metaData?.categories || [], formData.kind);
  }, [isEditMode, detailData, metaData?.categories, formData.kind]);

  const handleInputChange = (
    field: keyof typeof formData,
    value: string | boolean,
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value as never }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const validateForm = () => {
    const nextErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      nextErrors.name = t('form.errors.name_required');
    }

    const normalizedColor = normalizeColor(formData.color);
    if (!/^#[0-9A-Fa-f]{6}$/i.test(normalizedColor)) {
      nextErrors.color = t('form.errors.color_invalid');
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
        categoryType: formData.kind,
        iconKey: formData.icon || null,
        colorHex: normalizeColor(formData.color),
        parentId: formData.parentId || null,
        active: formData.active,
      };

      if (isEditMode && id) {
        await categoriesService.updateCategory(id, payload);
        toast.success(t('form.toast.updated'));
      } else {
        await categoriesService.createCategory(payload);
        toast.success(t('form.toast.created'));
      }

      nav.goCategories();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : t('form.toast.save_failed'),
      );
    } finally {
      setSubmitting(false);
    }
  };

  const selectedIconData =
    availableIcons.find((item) => item.value === formData.icon) ||
    availableIcons[0];
  const SelectedIcon = selectedIconData?.Icon || Folder;

  if (metaLoading || (isEditMode && detailLoading)) {
    return (
      <div className="min-h-screen bg-[var(--background)] p-4 md:p-6">
        <Card>
          <p className="text-sm text-[var(--text-secondary)]">
            {t('form.loading')}
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
            {metaError || detailError || t('form.load_error')}
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="max-w-4xl mx-auto p-4 md:p-6 pb-20 md:pb-6">
        <div className="mb-6">
          <button
            onClick={nav.goBack}
            className="flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">{t('form.back')}</span>
          </button>

          <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
            {isEditMode ? t('form.edit_title') : t('form.create_title')}
          </h1>

          <p className="text-sm text-[var(--text-secondary)] mt-1">
            {isEditMode ? t('form.edit_subtitle') : t('form.create_subtitle')}
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-6">
              <Card>
                <h3 className="font-semibold text-[var(--text-primary)] mb-4">
                  {t('form.basic_info_section')}
                </h3>

                <div className="space-y-4">
                  <Input
                    label={t('form.fields.name_label')}
                    placeholder={t('form.fields.name_placeholder')}
                    value={formData.name}
                    onChange={(event) =>
                      handleInputChange("name", event.target.value)
                    }
                    error={errors.name}
                  />

                  <div>
                    <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                      {t('form.fields.type_label')}
                    </label>

                    <div className="grid grid-cols-3 gap-2">
                      {[
                        {
                          value: "expense",
                          label: t('form.type_options.expense'),
                          color: "danger",
                        },
                        {
                          value: "income",
                          label: t('form.type_options.income'),
                          color: "success",
                        },
                        { value: "both", label: t('form.type_options.both'), color: "info" },
                      ].map((kind) => {
                        const isSelected = formData.kind === kind.value;
                        return (
                          <button
                            key={kind.value}
                            type="button"
                            onClick={() =>
                              handleInputChange(
                                "kind",
                                kind.value as CategoryKind,
                              )
                            }
                            className={`px-3 py-2.5 rounded-[var(--radius-lg)] border-2 text-sm font-medium transition-all ${
                              isSelected
                                ? `border-[var(--${kind.color})] bg-[var(--${kind.color}-light)] text-[var(--${kind.color})]`
                                : "border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--text-tertiary)]"
                            }`}
                          >
                            {kind.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                      {t('form.fields.parent_label')}
                    </label>

                    <select
                      value={formData.parentId}
                      onChange={(event) =>
                        handleInputChange("parentId", event.target.value)
                      }
                      className="w-full px-4 py-2 bg-[var(--input-background)] border border-[var(--border)] rounded-[var(--radius-lg)] text-[var(--text-primary)]"
                    >
                      <option value="">{t('form.fields.parent_no_parent')}</option>
                      {parentCategoryOptions.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>

                    <p className="text-xs text-[var(--text-tertiary)] mt-1">
                      {t('form.fields.parent_hint')}
                    </p>
                  </div>

                  <label className="flex items-center justify-between gap-4 cursor-pointer">
                    <div>
                      <p className="font-medium text-[var(--text-primary)]">
                        {t('form.fields.active_label')}
                      </p>
                      <p className="text-sm text-[var(--text-secondary)]">
                        {t('form.fields.active_hint')}
                      </p>
                    </div>

                    <input
                      type="checkbox"
                      checked={formData.active}
                      onChange={(event) =>
                        handleInputChange("active", event.target.checked)
                      }
                      className="w-5 h-5"
                    />
                  </label>
                </div>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <h3 className="font-semibold text-[var(--text-primary)] mb-4">
                  {t('form.appearance_section')}
                </h3>

                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div
                      className="w-20 h-20 rounded-[var(--radius-xl)] flex items-center justify-center border border-[var(--border)]"
                      style={{
                        backgroundColor: `${normalizeColor(formData.color)}20`,
                      }}
                    >
                      <SelectedIcon
                        className="w-8 h-8"
                        style={{ color: normalizeColor(formData.color) }}
                      />
                    </div>

                    <div className="flex-1">
                      <p className="font-medium text-[var(--text-primary)]">
                        {selectedIconData?.label || "Icon"}
                      </p>
                      <div className="flex gap-3 mt-2">
                        <button
                          type="button"
                          onClick={() => setShowIconPicker((prev) => !prev)}
                          className="text-sm text-[var(--primary)] hover:underline"
                        >
                          {showIconPicker ? t('form.icon_picker.hide') : t('form.icon_picker.show')}
                        </button>

                        <button
                          type="button"
                          onClick={() => setShowColorPicker((prev) => !prev)}
                          className="text-sm text-[var(--primary)] hover:underline"
                        >
                          {showColorPicker ? t('form.color_picker.hide') : t('form.color_picker.show')}
                        </button>
                      </div>
                    </div>
                  </div>

                  {showIconPicker && (
                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 p-4 rounded-[var(--radius-lg)] bg-[var(--surface)]">
                      {availableIcons.map((item) => {
                        const Icon = item.Icon;
                        const selected = formData.icon === item.value;

                        return (
                          <button
                            key={item.value}
                            type="button"
                            onClick={() => {
                              handleInputChange("icon", item.value);
                              setShowIconPicker(false);
                            }}
                            className={`p-3 rounded-[var(--radius-lg)] border transition-colors ${
                              selected
                                ? "border-[var(--primary)] bg-[var(--primary-light)]"
                                : "border-[var(--border)] hover:bg-[var(--surface-elevated)]"
                            }`}
                            title={item.label}
                          >
                            <Icon className="w-5 h-5 mx-auto text-[var(--text-primary)]" />
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {showColorPicker && (
                    <div className="grid grid-cols-5 sm:grid-cols-10 gap-2 p-4 rounded-[var(--radius-lg)] bg-[var(--surface)]">
                      {colorPalette.map((color) => {
                        const selected =
                          normalizeColor(formData.color) === color;
                        return (
                          <button
                            key={color}
                            type="button"
                            onClick={() => {
                              handleInputChange("color", color);
                              setShowColorPicker(false);
                            }}
                            className={`w-10 h-10 rounded-[var(--radius-md)] transition-transform hover:scale-105 ${
                              selected
                                ? "ring-2 ring-[var(--primary)] ring-offset-2 ring-offset-[var(--card)]"
                                : ""
                            }`}
                            style={{ backgroundColor: color }}
                            title={color}
                          />
                        );
                      })}
                    </div>
                  )}

                  <Input
                    label={t('form.fields.color_label')}
                    placeholder={t('form.fields.color_placeholder')}
                    value={formData.color}
                    onChange={(event) =>
                      handleInputChange("color", event.target.value)
                    }
                    error={errors.color}
                  />
                </div>
              </Card>

              <Card>
                <h3 className="font-semibold text-[var(--text-primary)] mb-4">
                  {t('form.preview_section')}
                </h3>

                <div
                  className="flex items-center gap-3 p-4 rounded-[var(--radius-lg)]"
                  style={{
                    backgroundColor: `${normalizeColor(formData.color)}15`,
                    borderLeft: `4px solid ${normalizeColor(formData.color)}`,
                  }}
                >
                  <div
                    className="w-12 h-12 rounded-[var(--radius-lg)] flex items-center justify-center"
                    style={{
                      backgroundColor: `${normalizeColor(formData.color)}22`,
                    }}
                  >
                    <SelectedIcon
                      className="w-6 h-6"
                      style={{ color: normalizeColor(formData.color) }}
                    />
                  </div>

                  <div className="min-w-0">
                    <p className="font-medium text-[var(--text-primary)] truncate">
                      {formData.name || t('form.preview.name_placeholder')}
                    </p>
                    <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                      {formData.kind === "expense"
                        ? t('form.type_options.expense')
                        : formData.kind === "income"
                          ? t('form.type_options.income')
                          : t('form.type_options.both')}
                      {formData.parentId
                        ? ` · ${t('form.preview.has_parent')}`
                        : ` · ${t('form.preview.no_parent')}`}
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </div>

          <div className="flex flex-col-reverse md:flex-row gap-3 mt-6">
            <Button type="button" variant="secondary" onClick={nav.goBack}>
              {t('form.actions.cancel')}
            </Button>

            <Button type="submit" disabled={submitting}>
              <Save className="w-4 h-4" />
              {submitting
                ? t('form.actions.saving')
                : isEditMode
                  ? t('form.actions.save')
                  : t('form.actions.create')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

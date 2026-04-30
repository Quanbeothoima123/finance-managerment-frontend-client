import React, { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Save, Store } from "lucide-react";
import { useParams } from "react-router";
import { useTranslation } from "react-i18next";
import { useLocalizedName } from "../utils/localizedName";
import { Card } from "../components/Card";
import { Input } from "../components/Input";
import { Button } from "../components/Button";
import { useAppNavigation } from "../hooks/useAppNavigation";
import { useToast } from "../contexts/ToastContext";
import { useMerchantsMeta } from "../hooks/useMerchantsMeta";
import { useMerchantDetail } from "../hooks/useMerchantDetail";
import { merchantsService } from "../services/merchantsService";

interface CreateEditMerchantProps {
  mode?: "create" | "edit";
}

export default function CreateEditMerchant({
  mode = "create",
}: CreateEditMerchantProps) {
  const { t } = useTranslation('merchants');
  const localName = useLocalizedName();
  const { id } = useParams<{ id: string }>();
  const nav = useAppNavigation();
  const toast = useToast();

  const isEditMode = mode === "edit";
  const {
    data: metaData,
    loading: metaLoading,
    error: metaError,
  } = useMerchantsMeta();
  const {
    data: detailData,
    loading: detailLoading,
    error: detailError,
  } = useMerchantDetail(isEditMode ? id : undefined);

  const [formData, setFormData] = useState({
    name: "",
    defaultCategoryId: "",
    note: "",
    isHidden: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const categoryOptions = useMemo(() => {
    const options = [{ value: "", label: t('form.fields.default_category_no_default') }];

    (metaData?.categories || []).forEach((category) => {
      options.push({
        value: category.id,
        label: localName(category),
      });
    });

    return options;
  }, [metaData?.categories, t, localName]);

  useEffect(() => {
    if (!detailData?.merchant || !isEditMode) return;

    setFormData({
      name: detailData.merchant.name,
      defaultCategoryId: detailData.merchant.defaultCategoryId || "",
      note: detailData.merchant.note || "",
      isHidden: detailData.merchant.isHidden,
    });
  }, [detailData, isEditMode]);

  const handleInputChange = (
    field: "name" | "defaultCategoryId" | "note" | "isHidden",
    value: string | boolean,
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const validate = () => {
    const nextErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      nextErrors.name = t('form.errors.name_required');
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
        defaultCategoryId: formData.defaultCategoryId || null,
        note: formData.note.trim() || null,
        isHidden: formData.isHidden,
      };

      if (isEditMode && id) {
        await merchantsService.updateMerchant(id, payload);
        toast.success(t('form.toast.updated'));
      } else {
        await merchantsService.createMerchant(payload);
        toast.success(t('form.toast.created'));
      }

      nav.goMerchants();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : t('form.toast.save_failed'),
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
                  {t('form.info_section')}
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
                      {t('form.fields.default_category_label')}
                    </label>
                    <select
                      value={formData.defaultCategoryId}
                      onChange={(event) =>
                        handleInputChange(
                          "defaultCategoryId",
                          event.target.value,
                        )
                      }
                      className="w-full px-4 py-2.5 bg-[var(--input-background)] border border-[var(--border)] rounded-[var(--radius-lg)]"
                    >
                      {categoryOptions.map((category) => (
                        <option key={category.value} value={category.value}>
                          {category.label}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-[var(--text-tertiary)] mt-1">
                      {t('form.fields.default_category_hint')}
                    </p>
                  </div>

                  <Input
                    label={t('form.fields.note_label')}
                    placeholder={t('form.fields.note_placeholder')}
                    value={formData.note}
                    onChange={(event) =>
                      handleInputChange("note", event.target.value)
                    }
                  />

                  <label className="flex items-center justify-between gap-4 cursor-pointer">
                    <div>
                      <p className="font-medium text-[var(--text-primary)]">
                        {t('form.fields.hidden_label')}
                      </p>
                      <p className="text-sm text-[var(--text-secondary)]">
                        {t('form.fields.hidden_hint')}
                      </p>
                    </div>

                    <input
                      type="checkbox"
                      checked={formData.isHidden}
                      onChange={(event) =>
                        handleInputChange("isHidden", event.target.checked)
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
                  {t('form.preview_section')}
                </h3>

                <div className="flex items-center gap-4 p-4 rounded-[var(--radius-lg)] bg-[var(--surface)]">
                  <div className="w-12 h-12 bg-[var(--background)] rounded-[var(--radius-lg)] flex items-center justify-center">
                    <Store className="w-6 h-6 text-[var(--text-secondary)]" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-[var(--text-primary)] truncate">
                        {formData.name || t('form.preview.name_placeholder')}
                      </p>
                      {formData.isHidden && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--surface-elevated)] border border-[var(--border)] text-[var(--text-tertiary)]">
                          {t('form.preview.badge_hidden')}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-[var(--text-secondary)] mt-1">
                      {categoryOptions.find(
                        (item) => item.value === formData.defaultCategoryId,
                      )?.label || t('form.fields.default_category_no_default')}
                    </p>

                    {formData.note && (
                      <p className="text-xs text-[var(--text-tertiary)] mt-1 line-clamp-2">
                        {formData.note}
                      </p>
                    )}
                  </div>
                </div>
              </Card>

              {isEditMode && (
                <Card className="bg-[var(--info-light)] border-[var(--info)]">
                  <div className="flex items-start gap-3">
                    <Store className="w-5 h-5 text-[var(--info)] flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-[var(--text-primary)] mb-1">
                        {t('form.edit_note.title')}
                      </h4>
                      <p className="text-sm text-[var(--text-secondary)]">
                        {t('form.edit_note.description')}
                      </p>
                    </div>
                  </div>
                </Card>
              )}
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

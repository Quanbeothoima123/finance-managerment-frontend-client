import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router";
import { ArrowLeft, Hash, Play, Save, Store, Tag, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useLocalizedName } from "../utils/localizedName";
import { Card } from "../components/Card";
import { Button } from "../components/Button";
import { Input } from "../components/Input";
import { useAppNavigation } from "../hooks/useAppNavigation";
import { useToast } from "../contexts/ToastContext";
import { useAutoRulesMeta } from "../hooks/useAutoRulesMeta";
import { useAutoRuleDetail } from "../hooks/useAutoRuleDetail";
import { autoRulesService } from "../services/autoRulesService";
import type {
  AutoRuleMatchField,
  AutoRuleMatchType,
  CreateAutoRulePayload,
} from "../types/autoRules";

interface CreateAutoRuleProps {
  mode?: "create" | "edit";
}

const PRIMARY_FIELDS: AutoRuleMatchField[] = [
  "description",
  "merchant",
  "note",
];
const PRIMARY_OPERATORS: AutoRuleMatchType[] = ["contains", "equals", "regex"];

function normalizeText(value: string) {
  return value.trim().toLowerCase();
}

function resolveLabel(items: Array<{ id: string; name: string }>, id: string) {
  return items.find((item) => item.id === id)?.name || "";
}

export default function CreateAutoRule({
  mode = "create",
}: CreateAutoRuleProps) {
  const { t } = useTranslation("tags-rules");
  const localName = useLocalizedName();
  const nav = useAppNavigation();
  const toast = useToast();
  const { id } = useParams<{ id: string }>();
  const isEdit = mode === "edit";

  const {
    data: meta,
    loading: metaLoading,
    error: metaError,
  } = useAutoRulesMeta();
  const {
    data: detail,
    loading: detailLoading,
    error: detailError,
  } = useAutoRuleDetail(id, isEdit && Boolean(id));

  const [initialized, setInitialized] = useState(false);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [active, setActive] = useState(true);
  const [priority, setPriority] = useState("1");
  const [matchField, setMatchField] =
    useState<AutoRuleMatchField>("description");
  const [matchType, setMatchType] = useState<AutoRuleMatchType>("contains");
  const [pattern, setPattern] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedMerchant, setSelectedMerchant] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [testDescription, setTestDescription] = useState("");
  const [testResult, setTestResult] = useState<{
    matched: boolean;
    message: string;
  } | null>(null);

  useEffect(() => {
    if (!meta) return;
    if (isEdit && !detail?.rule) return;
    if (initialized) return;

    const rule = detail?.rule;
    setName(rule?.name || "");
    setActive(rule?.enabled ?? meta.defaults.enabled ?? true);
    setPriority(String(rule?.priority || meta.defaults.priority || 1));
    setMatchField(
      rule?.matchField || meta.defaults.matchField || "description",
    );
    setMatchType(rule?.matchType || meta.defaults.matchType || "contains");
    setPattern(rule?.pattern || "");
    setSelectedCategory(rule?.selectedCategoryId || "");
    setSelectedMerchant(rule?.selectedMerchantId || "");
    setSelectedTags(rule?.selectedTagIds || []);
    setInitialized(true);
  }, [detail?.rule, initialized, isEdit, meta]);

  const availableFields = useMemo(
    () =>
      (meta?.supportedFields || []).filter((item) =>
        PRIMARY_FIELDS.includes(item.value),
      ),
    [meta?.supportedFields],
  );
  const availableOperators = useMemo(
    () =>
      (meta?.supportedOperators || []).filter((item) =>
        PRIMARY_OPERATORS.includes(item.value),
      ),
    [meta?.supportedOperators],
  );

  const selectedCategoryLabel = useMemo(
    () => resolveLabel(meta?.categories || [], selectedCategory),
    [meta?.categories, selectedCategory],
  );
  const selectedMerchantLabel = useMemo(
    () => resolveLabel(meta?.merchants || [], selectedMerchant),
    [meta?.merchants, selectedMerchant],
  );
  const selectedTagObjects = useMemo(() => {
    const availableTags = meta?.tags || [];
    return selectedTags
      .map((tagId) => availableTags.find((tag) => tag.id === tagId))
      .filter((tag): tag is (typeof availableTags)[number] => Boolean(tag));
  }, [meta?.tags, selectedTags]);
  const selectedTagLabels = useMemo(
    () => selectedTagObjects.map((tag) => tag.name),
    [selectedTagObjects],
  );

  const payload = useMemo<CreateAutoRulePayload>(
    () => ({
      name: name.trim(),
      priority: Number(priority) || 1,
      enabled: active,
      active,
      matchField,
      matchType,
      pattern: pattern.trim(),
      selectedCategoryId: selectedCategory || null,
      selectedMerchantId: selectedMerchant || null,
      selectedTagIds: selectedTags,
    }),
    [
      active,
      matchField,
      matchType,
      name,
      pattern,
      priority,
      selectedCategory,
      selectedMerchant,
      selectedTags,
    ],
  );

  const handleBack = () => {
    nav.goAutoRules();
  };

  const validate = () => {
    if (!name.trim()) {
      toast.error(t("auto_rules.form.errors.name_required"));
      return false;
    }
    if (!pattern.trim()) {
      toast.error(t("auto_rules.form.errors.pattern_required"));
      return false;
    }
    if (!priority || Number(priority) <= 0) {
      toast.error(t("auto_rules.form.errors.priority_invalid"));
      return false;
    }
    if (!selectedCategory && !selectedMerchant && selectedTags.length === 0) {
      toast.error(t("auto_rules.form.errors.no_action"));
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validate()) return;
    try {
      setSaving(true);
      if (isEdit && id) {
        await autoRulesService.updateAutoRule(id, payload);
        toast.success(t("auto_rules.form.toast.updated"));
      } else {
        await autoRulesService.createAutoRule(payload);
        toast.success(t("auto_rules.form.toast.created"));
      }
      nav.goAutoRules();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : t("auto_rules.form.toast.save_failed"),
      );
    } finally {
      setSaving(false);
    }
  };

  const handleTest = () => {
    if (!testDescription || !pattern) {
      setTestResult({
        matched: false,
        message: t("auto_rules.form.test.no_input_message"),
      });
      return;
    }

    const testText = normalizeText(testDescription);
    const patternText = normalizeText(pattern);
    let matched = false;

    try {
      if (matchType === "contains") {
        matched = testText.includes(patternText);
      } else if (matchType === "equals") {
        matched = testText === patternText;
      } else if (matchType === "regex") {
        matched = new RegExp(pattern, "i").test(testDescription);
      }
    } catch {
      setTestResult({ matched: false, message: t("auto_rules.form.test.regex_error") });
      return;
    }

    if (!matched) {
      setTestResult({ matched: false, message: t("auto_rules.form.test.no_match") });
      return;
    }

    const actions: string[] = [];
    if (selectedCategoryLabel)
      actions.push(t("auto_rules.form.test.action_category", { name: selectedCategoryLabel }));
    if (selectedMerchantLabel)
      actions.push(t("auto_rules.form.test.action_merchant", { name: selectedMerchantLabel }));
    if (selectedTagLabels.length > 0)
      actions.push(t("auto_rules.form.test.action_tags", { names: selectedTagLabels.join(", ") }));

    setTestResult({
      matched: true,
      message:
        actions.length > 0
          ? t("auto_rules.form.test.matched_with_actions", { actions: actions.join(" • ") })
          : t("auto_rules.form.test.matched"),
    });
  };

  const handleAddTag = (tagId: string) => {
    if (tagId && !selectedTags.includes(tagId)) {
      setSelectedTags((prev) => [...prev, tagId]);
    }
  };

  const handleRemoveTag = (tagId: string) => {
    setSelectedTags((prev) => prev.filter((item) => item !== tagId));
  };

  if (metaLoading || (isEdit && detailLoading) || !initialized) {
    return (
      <div className="p-4 md:p-6">
        <Card>
          <p className="text-[var(--text-secondary)]">
            {t("auto_rules.form.loading")}
          </p>
        </Card>
      </div>
    );
  }

  if (metaError || detailError || !meta) {
    return (
      <div className="p-4 md:p-6">
        <Card>
          <p className="text-[var(--danger)]">
            {metaError ||
              detailError ||
              t("auto_rules.form.load_error")}
          </p>
          <Button variant="secondary" className="mt-4" onClick={handleBack}>
            <ArrowLeft className="w-4 h-4" /> {t("auto_rules.form.back_to_list")}
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="max-w-3xl mx-auto p-4 md:p-6 pb-20 md:pb-6 space-y-6">
        <div>
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">{t("auto_rules.form.back")}</span>
          </button>

          <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
            {isEdit ? t("auto_rules.form.edit_title") : t("auto_rules.form.create_title")}
          </h1>
        </div>

        <Card>
          <h3 className="font-semibold text-[var(--text-primary)] mb-4">
            {t("auto_rules.form.basic_section")}
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                {t("auto_rules.form.fields.name_label")} <span className="text-[var(--danger)]">*</span>
              </label>
              <Input
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder={t("auto_rules.form.fields.name_placeholder")}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                  {t("auto_rules.form.fields.status_label")}
                </label>
                <button
                  onClick={() => setActive((prev) => !prev)}
                  className={`flex items-center gap-3 w-full px-4 py-3 rounded-[var(--radius-lg)] border transition-all ${
                    active
                      ? "bg-[var(--success-light)] border-[var(--success)]"
                      : "bg-[var(--surface)] border-[var(--border)]"
                  }`}
                >
                  <div
                    className={`relative w-12 h-6 rounded-full transition-colors ${
                      active ? "bg-[var(--success)]" : "bg-[var(--border)]"
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                        active ? "translate-x-6" : "translate-x-0"
                      }`}
                    />
                  </div>
                  <span className="text-sm font-medium text-[var(--text-primary)]">
                    {active ? t("auto_rules.form.fields.status_active") : t("auto_rules.form.fields.status_paused")}
                  </span>
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                  {t("auto_rules.form.fields.priority_label")} <span className="text-[var(--danger)]">*</span>
                </label>
                <Input
                  type="number"
                  value={priority}
                  onChange={(event) => setPriority(event.target.value)}
                  placeholder={String(meta.defaults.priority || 1)}
                  min="1"
                />
                <p className="text-xs text-[var(--text-secondary)] mt-1">
                  {t("auto_rules.form.fields.priority_hint")}
                </p>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <h3 className="font-semibold text-[var(--text-primary)] mb-4">
            {t("auto_rules.form.condition_section")}
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                {t("auto_rules.form.fields.field_label")} <span className="text-[var(--danger)]">*</span>
              </label>
              <select
                value={matchField}
                onChange={(event) =>
                  setMatchField(event.target.value as AutoRuleMatchField)
                }
                className="w-full px-4 py-2.5 bg-[var(--input-background)] border border-[var(--border)] rounded-[var(--radius-lg)] text-[var(--text-primary)] appearance-none cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]"
              >
                {availableFields.map((field) => (
                  <option key={field.value} value={field.value}>
                    {field.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                {t("auto_rules.form.fields.operator_label")} <span className="text-[var(--danger)]">*</span>
              </label>
              <div className="grid grid-cols-3 gap-3">
                {availableOperators.map((operator) => (
                  <button
                    key={operator.value}
                    onClick={() => setMatchType(operator.value)}
                    className={`px-4 py-3 rounded-[var(--radius-lg)] border font-medium transition-all ${
                      matchType === operator.value
                        ? "bg-[var(--primary)] text-white border-[var(--primary)]"
                        : "bg-[var(--surface)] text-[var(--text-secondary)] border-[var(--border)] hover:bg-[var(--border)]"
                    }`}
                  >
                    {operator.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                {t("auto_rules.form.fields.pattern_label")} <span className="text-[var(--danger)]">*</span>
              </label>
              <Input
                type="text"
                value={pattern}
                onChange={(event) => setPattern(event.target.value)}
                placeholder={
                  matchType === "regex"
                    ? t("auto_rules.form.fields.pattern_placeholder_regex")
                    : t("auto_rules.form.fields.pattern_placeholder_default")
                }
              />
              {matchType === "regex" && (
                <p className="text-xs text-[var(--text-secondary)] mt-1">
                  {t("auto_rules.form.fields.pattern_regex_hint")}
                </p>
              )}
            </div>
          </div>
        </Card>

        <Card>
          <h3 className="font-semibold text-[var(--text-primary)] mb-4">
            {t("auto_rules.form.action_section")}
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                <Hash className="w-4 h-4 inline mr-1" />
                {t("auto_rules.form.fields.category_label")}
              </label>
              <select
                value={selectedCategory}
                onChange={(event) => setSelectedCategory(event.target.value)}
                className="w-full px-4 py-2.5 bg-[var(--input-background)] border border-[var(--border)] rounded-[var(--radius-lg)] text-[var(--text-primary)] appearance-none cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]"
              >
                <option value="">{t("auto_rules.form.fields.category_no_change")}</option>
                {meta.categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {localName(category)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                <Store className="w-4 h-4 inline mr-1" />
                {t("auto_rules.form.fields.merchant_label")}
              </label>
              <select
                value={selectedMerchant}
                onChange={(event) => setSelectedMerchant(event.target.value)}
                className="w-full px-4 py-2.5 bg-[var(--input-background)] border border-[var(--border)] rounded-[var(--radius-lg)] text-[var(--text-primary)] appearance-none cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]"
              >
                <option value="">{t("auto_rules.form.fields.merchant_no_change")}</option>
                {meta.merchants.map((merchant) => (
                  <option key={merchant.id} value={merchant.id}>
                    {merchant.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                <Tag className="w-4 h-4 inline mr-1" />
                {t("auto_rules.form.fields.tags_label")}
              </label>
              <select
                value=""
                onChange={(event) => {
                  handleAddTag(event.target.value);
                  event.target.value = "";
                }}
                className="w-full px-4 py-2.5 bg-[var(--input-background)] border border-[var(--border)] rounded-[var(--radius-lg)] text-[var(--text-primary)] appearance-none cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]"
              >
                <option value="">{t("auto_rules.form.fields.tags_placeholder")}</option>
                {meta.tags
                  .filter((tag) => !selectedTags.includes(tag.id))
                  .map((tag) => (
                    <option key={tag.id} value={tag.id}>
                      {localName(tag)}
                    </option>
                  ))}
              </select>

              {selectedTagLabels.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {selectedTagObjects.map((tag) => {
                    return (
                      <span
                        key={tag.id}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[var(--info-light)] text-[var(--info)] rounded-[var(--radius-md)] text-sm"
                      >
                        {localName(tag)}
                        <button
                          onClick={() => handleRemoveTag(tag.id)}
                          className="hover:text-[var(--danger)] transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </Card>

        <Card className="bg-[var(--surface)]">
          <h3 className="font-semibold text-[var(--text-primary)] mb-4">
            {t("auto_rules.form.test_section")}
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                {t("auto_rules.form.fields.test_input_label")}
              </label>
              <div className="flex gap-2">
                <Input
                  type="text"
                  value={testDescription}
                  onChange={(event) => setTestDescription(event.target.value)}
                  placeholder={t("auto_rules.form.fields.test_input_placeholder")}
                  className="flex-1"
                />
                <Button onClick={handleTest} variant="secondary">
                  <Play className="w-5 h-5" />
                  {t("auto_rules.form.test.run_button")}
                </Button>
              </div>
            </div>

            {testResult && (
              <div
                className={`p-4 rounded-[var(--radius-lg)] ${
                  testResult.matched
                    ? "bg-[var(--success-light)] border border-[var(--success)]"
                    : "bg-[var(--danger-light)] border border-[var(--danger)]"
                }`}
              >
                <p
                  className={`text-sm font-medium ${
                    testResult.matched
                      ? "text-[var(--success)]"
                      : "text-[var(--danger)]"
                  }`}
                >
                  {testResult.message}
                </p>
              </div>
            )}
          </div>
        </Card>

        <div className="flex flex-col-reverse md:flex-row gap-3">
          <Button
            onClick={handleBack}
            variant="secondary"
            className="flex-1 md:flex-initial"
          >
            {t("auto_rules.form.actions.cancel")}
          </Button>
          <Button
            onClick={() => void handleSave()}
            disabled={saving}
            className="flex-1 md:flex-initial"
          >
            <Save className="w-4 h-4" />
            {saving ? t("auto_rules.form.actions.saving") : isEdit ? t("auto_rules.form.actions.save") : t("auto_rules.form.actions.create")}
          </Button>
        </div>
      </div>
    </div>
  );
}

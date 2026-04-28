import React, { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams, useSearchParams } from "react-router";
import {
  ArrowLeft,
  Camera,
  Plus,
  Save,
  Sparkles,
  SplitSquareHorizontal,
  Store,
  Tag,
  X,
} from "lucide-react";
import i18n from "../../i18n";
import { AmountInput } from "../components/AmountInput";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { Input } from "../components/Input";
import { TagChip } from "../components/TagChip";
import {
  ChatTransactionParser,
  type QuickTransactionDraft,
} from "../components/ChatTransactionParser";
import { useToast } from "../contexts/ToastContext";
import { useTransactionDetail } from "../hooks/useTransactionDetail";
import { useTransactionsMeta } from "../hooks/useTransactionsMeta";
import { transactionsService } from "../services/transactionsService";
import type {
  CreateTransactionPayload,
  TransactionMerchantOption,
  TransactionTagOption,
} from "../types/transactions";

interface SplitLineForm {
  id: string;
  categoryId: string;
  amount: string;
  note: string;
}

function createSplitLine(): SplitLineForm {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    categoryId: "",
    amount: "",
    note: "",
  };
}

function todayString() {
  return new Date().toISOString().slice(0, 10);
}

function getLocale() {
  return i18n.language === "en" ? "en-US" : "vi-VN";
}

function formatMoney(value?: string | number | null) {
  return new Intl.NumberFormat(getLocale()).format(Number(value || 0));
}

export default function AddEditTransaction() {
  const { t } = useTranslation("transactions");
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const [searchParams] = useSearchParams();

  const duplicateFrom = searchParams.get("duplicateFrom") || undefined;
  const preselectedAccountId = searchParams.get("accountId") || "";
  const sourceTransactionId = id || duplicateFrom;
  const isEditMode = Boolean(id);
  const isDuplicateMode = !id && Boolean(duplicateFrom);

  const {
    data: metaData,
    loading: metaLoading,
    error: metaError,
  } = useTransactionsMeta();
  const {
    data: sourceTransaction,
    loading: sourceLoading,
    error: sourceError,
  } = useTransactionDetail(sourceTransactionId);

  const [transactionType, setTransactionType] = useState<"income" | "expense">(
    "expense",
  );
  const [amount, setAmount] = useState("");
  const [accountId, setAccountId] = useState(preselectedAccountId);
  const [categoryId, setCategoryId] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(todayString());
  const [notes, setNotes] = useState("");

  const [selectedMerchantId, setSelectedMerchantId] = useState("");
  const [customMerchantName, setCustomMerchantName] = useState("");
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);

  const [isSplit, setIsSplit] = useState(false);
  const [splitLines, setSplitLines] = useState<SplitLineForm[]>([
    createSplitLine(),
    createSplitLine(),
  ]);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [showChatParser, setShowChatParser] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const categories = useMemo(() => {
    return (metaData?.categories || []).filter((item) => {
      if (item.archivedAt) return false;
      return (
        item.categoryType === transactionType || item.categoryType === "both"
      );
    });
  }, [metaData?.categories, transactionType]);

  const selectedMerchant = useMemo<TransactionMerchantOption | null>(() => {
    return (
      (metaData?.merchants || []).find(
        (item) => item.id === selectedMerchantId,
      ) || null
    );
  }, [metaData?.merchants, selectedMerchantId]);

  const remaining = useMemo(() => {
    const totalAmount = Number(amount || 0);
    const splitSum = splitLines.reduce(
      (sum, line) => sum + Number(line.amount || 0),
      0,
    );
    return totalAmount - splitSum;
  }, [amount, splitLines]);

  useEffect(() => {
    if (!metaData || initialized) return;
    if (sourceTransactionId && !sourceTransaction) return;

    if (sourceTransaction) {
      if (sourceTransaction.txnType === "transfer") return;

      setTransactionType(
        sourceTransaction.txnType === "income" ? "income" : "expense",
      );
      setAmount(String(Number(sourceTransaction.totalAmountMinor || 0)));
      setAccountId(
        sourceTransaction.account?.id ||
          preselectedAccountId ||
          metaData.defaults.defaultAccountId ||
          "",
      );
      setCategoryId(sourceTransaction.category?.id || "");
      setDescription(sourceTransaction.description || "");
      setDate(
        isDuplicateMode
          ? todayString()
          : sourceTransaction.date || todayString(),
      );
      setNotes(sourceTransaction.note || "");
      setSelectedTagIds(sourceTransaction.tags.map((item) => item.id));
      if (isEditMode && sourceTransaction.imageUrl) {
        setImagePreview(sourceTransaction.imageUrl);
      }

      const merchantFromMeta = (metaData.merchants || []).find(
        (item) => item.id === sourceTransaction.merchant?.id,
      );

      if (merchantFromMeta) {
        setSelectedMerchantId(merchantFromMeta.id);
        setCustomMerchantName("");
      } else if (sourceTransaction.merchant?.name) {
        setSelectedMerchantId("");
        setCustomMerchantName(sourceTransaction.merchant.name);
      }

      if (
        sourceTransaction.isSplit &&
        sourceTransaction.splitItems.length > 0
      ) {
        setIsSplit(true);
        setSplitLines(
          sourceTransaction.splitItems.map((item) => ({
            id: item.id,
            categoryId: item.category?.id || "",
            amount: String(Number(item.amountMinor || 0)),
            note: item.note || "",
          })),
        );
      } else {
        setIsSplit(false);
        setSplitLines([createSplitLine(), createSplitLine()]);
      }

      setInitialized(true);
      return;
    }

    setAccountId(
      preselectedAccountId || metaData.defaults.defaultAccountId || "",
    );
    setCategoryId(
      metaData.defaults.defaultExpenseCategoryId ||
        metaData.defaults.defaultIncomeCategoryId ||
        "",
    );
    setInitialized(true);
  }, [
    metaData,
    sourceTransaction,
    sourceTransactionId,
    isDuplicateMode,
    initialized,
    preselectedAccountId,
  ]);

  useEffect(() => {
    if (!metaData) return;
    if (sourceTransactionId) return;
    if (categoryId) return;

    setCategoryId(
      transactionType === "income"
        ? metaData.defaults.defaultIncomeCategoryId || ""
        : metaData.defaults.defaultExpenseCategoryId || "",
    );
  }, [transactionType, metaData, sourceTransactionId, categoryId]);

  useEffect(() => {
    if (isSplit) return;
    if (!selectedMerchant) return;
    if (!selectedMerchant.defaultCategoryId) return;

    const matchedCategory = (metaData?.categories || []).find(
      (item) =>
        item.id === selectedMerchant.defaultCategoryId &&
        !item.archivedAt &&
        (item.categoryType === transactionType || item.categoryType === "both"),
    );

    if (matchedCategory) {
      setCategoryId(matchedCategory.id);
    }
  }, [selectedMerchantId, transactionType, isSplit, metaData?.categories]);

  const toggleTag = (tagId: string) => {
    setSelectedTagIds((prev) =>
      prev.includes(tagId)
        ? prev.filter((item) => item !== tagId)
        : [...prev, tagId],
    );
  };

  const updateSplitLine = (lineId: string, patch: Partial<SplitLineForm>) => {
    setSplitLines((prev) =>
      prev.map((line) => (line.id === lineId ? { ...line, ...patch } : line)),
    );
  };

  const addSplitLine = () => {
    setSplitLines((prev) => [...prev, createSplitLine()]);
  };

  const removeSplitLine = (lineId: string) => {
    setSplitLines((prev) => {
      const next = prev.filter((line) => line.id !== lineId);
      return next.length > 0 ? next : [createSplitLine()];
    });
  };

  const handleApplyQuickDraft = (draft: QuickTransactionDraft) => {
    setTransactionType(draft.type);
    setAmount(draft.amount);
    setAccountId(draft.accountId || accountId);
    setDescription(draft.description || description);
    setIsSplit(false);
    setSplitLines([createSplitLine(), createSplitLine()]);
    setErrors({});

    if (draft.categoryId) {
      setCategoryId(draft.categoryId);
    }

    if (draft.merchantId) {
      setSelectedMerchantId(draft.merchantId);
      setCustomMerchantName("");
    } else if (draft.merchantName) {
      setSelectedMerchantId("");
      setCustomMerchantName(draft.merchantName);
    }
  };

  const validate = () => {
    const nextErrors: Record<string, string> = {};
    const numericAmount = Number(amount || 0);

    if (!amount || numericAmount <= 0)
      nextErrors.amount = t("form.errors.amount_invalid");
    if (!accountId) nextErrors.accountId = t("form.errors.account_required");
    if (!description.trim())
      nextErrors.description = t("form.errors.description_required");
    if (!date) nextErrors.date = t("form.errors.date_required");

    if (!isSplit && !categoryId) {
      nextErrors.categoryId = t("form.errors.category_required");
    }

    if (isSplit) {
      const hasMissingCategory = splitLines.some((line) => !line.categoryId);
      const hasInvalidAmount = splitLines.some(
        (line) => Number(line.amount || 0) <= 0,
      );

      if (hasMissingCategory)
        nextErrors.splitCategory = t("form.errors.split_category_required");
      if (hasInvalidAmount)
        nextErrors.splitAmount = t("form.errors.split_amount_required");
      if (remaining !== 0)
        nextErrors.splitTotal = t("form.errors.split_total_mismatch");
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validate()) return;

    const payload: CreateTransactionPayload = {
      type: transactionType,
      amount: Number(amount || 0),
      accountId,
      description: description.trim(),
      date,
      notes: notes.trim() || undefined,
      tagIds: selectedTagIds,
      ...(selectedMerchantId
        ? { merchantId: selectedMerchantId }
        : customMerchantName.trim()
          ? { merchantName: customMerchantName.trim() }
          : {}),
      ...(isSplit
        ? {
            splitItems: splitLines.map((line) => ({
              categoryId: line.categoryId,
              amount: Number(line.amount || 0),
              note: line.note.trim() || undefined,
            })),
          }
        : {
            categoryId,
          }),
    };

    try {
      setSubmitting(true);

      const result =
        isEditMode && id
          ? await transactionsService.updateTransaction(id, payload)
          : await transactionsService.createTransaction(payload);

      if (imageFile) {
        try {
          await transactionsService.uploadTransactionImage(
            result.id,
            imageFile,
          );
        } catch {
          toast.error(t("form.image_upload_warning"));
        }
      }

      toast.success(
        isEditMode ? t("form.success_edit") : t("form.success_create"),
      );
      navigate(`/transactions/${result.id}`);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : t("form.errors.save_failed"),
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (metaLoading || (sourceTransactionId && sourceLoading && !initialized)) {
    return (
      <div className="min-h-screen bg-[var(--background)] p-4 md:p-6">
        <Card>
          <p className="text-sm text-[var(--text-secondary)]">
            {t("common:status.loading")}
          </p>
        </Card>
      </div>
    );
  }

  if (metaError || (sourceTransactionId && sourceError && !initialized)) {
    return (
      <div className="min-h-screen bg-[var(--background)] p-4 md:p-6">
        <Card>
          <p className="text-sm text-[var(--danger)]">
            {metaError || sourceError || t("form.errors.load_failed")}
          </p>
        </Card>
      </div>
    );
  }

  if (sourceTransaction && sourceTransaction.txnType === "transfer") {
    return (
      <div className="min-h-screen bg-[var(--background)] p-4 md:p-6">
        <Card>
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">
            {t("form.is_transfer_title")}
          </h2>
          <p className="text-sm text-[var(--text-secondary)] mt-2">
            {t("form.is_transfer_body")}
          </p>
          <div className="mt-4 flex gap-3">
            <Button variant="secondary" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-4 h-4" />
              {t("common:actions.back")}
            </Button>
            <Button
              onClick={() =>
                navigate(
                  `/transfer/create?${isEditMode ? "editId" : "duplicateFrom"}=${sourceTransaction.id}`,
                )
              }
            >
              {t("form.go_transfer_screen")}
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-[var(--radius-lg)] hover:bg-[var(--surface)] transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-[var(--text-primary)]" />
            </button>
            <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
              {isEditMode
                ? t("form.title_edit")
                : isDuplicateMode
                  ? t("form.title_duplicate")
                  : t("form.title_create")}
            </h1>
          </div>

          <Button
            type="button"
            variant="secondary"
            onClick={() => setShowChatParser(true)}
          >
            <Sparkles className="w-4 h-4" />
            {t("chat_parser.tab_label")}
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <div className="flex flex-wrap gap-2 mb-6">
              {(["expense", "income"] as Array<"expense" | "income">).map(
                (item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setTransactionType(item)}
                    className={`px-4 py-2 rounded-full border text-sm font-medium transition-colors ${
                      transactionType === item
                        ? "bg-[var(--primary)] text-white border-[var(--primary)]"
                        : "bg-[var(--surface)] text-[var(--text-secondary)] border-[var(--border)]"
                    }`}
                  >
                    {item === "expense"
                      ? t("form.type_expense")
                      : t("form.type_income")}
                  </button>
                ),
              )}
            </div>

            <AmountInput
              value={amount}
              onChange={setAmount}
              error={errors.amount}
            />
          </Card>

          <Card>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                  {t("form.account_label")}{" "}
                  <span className="text-[var(--danger)]">*</span>
                </label>
                <select
                  value={accountId}
                  onChange={(event) => {
                    setAccountId(event.target.value);
                    setErrors((prev) => ({ ...prev, accountId: "" }));
                  }}
                  className="w-full px-4 py-2.5 bg-[var(--input-background)] border border-[var(--border)] rounded-[var(--radius-lg)]"
                >
                  <option value="">{t("form.account_placeholder")}</option>
                  {(metaData?.accounts || []).map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.name} •{" "}
                      {formatMoney(account.currentBalanceMinor)} ₫
                    </option>
                  ))}
                </select>
                {errors.accountId && (
                  <p className="mt-1 text-sm text-[var(--danger)]">
                    {errors.accountId}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                  {t("form.date_label")}{" "}
                  <span className="text-[var(--danger)]">*</span>
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(event) => {
                    setDate(event.target.value);
                    setErrors((prev) => ({ ...prev, date: "" }));
                  }}
                  className="w-full px-4 py-2.5 bg-[var(--input-background)] border border-[var(--border)] rounded-[var(--radius-lg)]"
                />
                {errors.date && (
                  <p className="mt-1 text-sm text-[var(--danger)]">
                    {errors.date}
                  </p>
                )}
              </div>
            </div>

            <div className="mt-4">
              <Input
                label={t("form.description_label")}
                value={description}
                onChange={(event) => {
                  setDescription(event.target.value);
                  setErrors((prev) => ({ ...prev, description: "" }));
                }}
                placeholder={t("form.description_placeholder")}
                error={errors.description}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                  {!isSplit ? (
                    <>
                      {t("form.category_label")}{" "}
                      <span className="text-[var(--danger)]">*</span>
                    </>
                  ) : (
                    t("form.category_split_hint")
                  )}
                </label>

                <select
                  value={categoryId}
                  onChange={(event) => {
                    setCategoryId(event.target.value);
                    setErrors((prev) => ({ ...prev, categoryId: "" }));
                  }}
                  disabled={isSplit}
                  className="w-full px-4 py-2.5 bg-[var(--input-background)] border border-[var(--border)] rounded-[var(--radius-lg)] disabled:opacity-60"
                >
                  <option value="">{t("form.category_placeholder")}</option>
                  {categories.map((category) => (
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
                  {t("form.merchant_label")}
                </label>

                <div className="relative">
                  <Store className="w-4 h-4 text-[var(--text-tertiary)] absolute left-3 top-1/2 -translate-y-1/2" />
                  <select
                    value={selectedMerchantId}
                    onChange={(event) => {
                      setSelectedMerchantId(event.target.value);
                      if (event.target.value) {
                        setCustomMerchantName("");
                      }
                    }}
                    className="w-full pl-10 pr-4 py-2.5 bg-[var(--input-background)] border border-[var(--border)] rounded-[var(--radius-lg)]"
                  >
                    <option value="">{t("form.merchant_no_list")}</option>
                    {(metaData?.merchants || [])
                      .filter((merchant) => !merchant.isHidden)
                      .map((merchant) => (
                        <option key={merchant.id} value={merchant.id}>
                          {merchant.name}
                        </option>
                      ))}
                  </select>
                </div>

                <div className="mt-2 flex items-center justify-between gap-3">
                  <p className="text-xs text-[var(--text-tertiary)]">
                    {t("form.merchant_custom_hint")}
                  </p>
                  <button
                    type="button"
                    onClick={() => navigate("/merchants/create")}
                    className="text-xs font-medium text-[var(--primary)] hover:underline"
                  >
                    {t("form.merchant_create")}
                  </button>
                </div>

                {!selectedMerchantId && (
                  <div className="mt-2">
                    <Input
                      placeholder={t("form.merchant_placeholder")}
                      value={customMerchantName}
                      onChange={(event) =>
                        setCustomMerchantName(event.target.value)
                      }
                    />
                  </div>
                )}

                {selectedMerchant?.defaultCategoryId && !isSplit && (
                  <p className="mt-2 text-xs text-[var(--text-secondary)]">
                    {t("form.merchant_default_hint")}
                  </p>
                )}
              </div>
            </div>

            <div className="mt-4">
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isSplit}
                  onChange={(event) => setIsSplit(event.target.checked)}
                  className="w-4 h-4"
                />
                <span className="text-sm font-medium text-[var(--text-primary)] inline-flex items-center gap-2">
                  <SplitSquareHorizontal className="w-4 h-4" />
                  {t("split.toggle_label")}
                </span>
              </label>
            </div>
          </Card>

          {isSplit && (
            <Card>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                    {t("split.section_title")}
                  </h2>
                  <p className="text-sm text-[var(--text-secondary)] mt-1">
                    {t("split.total_hint", {
                      amount: `${formatMoney(amount || 0)} ₫`,
                    })}
                  </p>
                </div>

                <Button
                  type="button"
                  variant="secondary"
                  onClick={addSplitLine}
                >
                  <Plus className="w-4 h-4" />
                  {t("split.add_line")}
                </Button>
              </div>

              <div className="space-y-4">
                {splitLines.map((line, index) => (
                  <div
                    key={line.id}
                    className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--background)] p-4"
                  >
                    <div className="flex items-center justify-between gap-3 mb-4">
                      <p className="font-medium text-[var(--text-primary)]">
                        {t("split.line_label", { index: index + 1 })}
                      </p>

                      <button
                        type="button"
                        onClick={() => removeSplitLine(line.id)}
                        className="text-sm text-[var(--danger)] hover:underline"
                      >
                        {t("split.remove_line")}
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                          {t("form.category_label")}
                        </label>
                        <select
                          value={line.categoryId}
                          onChange={(event) =>
                            updateSplitLine(line.id, {
                              categoryId: event.target.value,
                            })
                          }
                          className="w-full px-4 py-2.5 bg-[var(--input-background)] border border-[var(--border)] rounded-[var(--radius-lg)]"
                        >
                          <option value="">
                            {t("split.category_placeholder")}
                          </option>
                          {categories.map((category) => (
                            <option key={category.id} value={category.id}>
                              {category.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                          {t("form.amount_label")}
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={line.amount}
                          onChange={(event) =>
                            updateSplitLine(line.id, {
                              amount: event.target.value,
                            })
                          }
                          className="w-full px-4 py-2.5 bg-[var(--input-background)] border border-[var(--border)] rounded-[var(--radius-lg)]"
                        />
                      </div>
                    </div>

                    <div className="mt-4">
                      <Input
                        label={t("split.note_label")}
                        value={line.note}
                        onChange={(event) =>
                          updateSplitLine(line.id, { note: event.target.value })
                        }
                        placeholder={t("split.note_placeholder")}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {(errors.splitCategory ||
                errors.splitAmount ||
                errors.splitTotal) && (
                <div className="mt-4 rounded-[var(--radius-lg)] border border-[var(--danger)]/30 bg-[var(--danger-light)] p-3 text-sm text-[var(--danger)] space-y-1">
                  {errors.splitCategory && <p>{errors.splitCategory}</p>}
                  {errors.splitAmount && <p>{errors.splitAmount}</p>}
                  {errors.splitTotal && <p>{errors.splitTotal}</p>}
                </div>
              )}

              <div className="mt-4 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-3 text-sm text-[var(--text-secondary)]">
                {t("split.remaining")}:{" "}
                <span
                  className={
                    remaining === 0
                      ? "text-[var(--success)] font-semibold"
                      : "text-[var(--danger)] font-semibold"
                  }
                >
                  {formatMoney(remaining)} ₫
                </span>
              </div>
            </Card>
          )}

          {!!metaData?.tags.length && (
            <Card>
              <div className="flex items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-2">
                  <Tag className="w-5 h-5 text-[var(--text-tertiary)]" />
                  <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                    {t("form.tag_label")}
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={() => navigate("/tags/create")}
                  className="text-sm font-medium text-[var(--primary)] hover:underline"
                >
                  {t("form.tag_create")}
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                {metaData.tags.map((tag: TransactionTagOption) => {
                  const active = selectedTagIds.includes(tag.id);
                  return (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => toggleTag(tag.id)}
                    >
                      <TagChip
                        name={tag.name}
                        color={tag.colorHex || "#64748b"}
                        className={
                          active ? "ring-2 ring-[var(--primary)]/25" : ""
                        }
                      />
                    </button>
                  );
                })}
              </div>
            </Card>
          )}

          <Card>
            <Input
              label={t("form.note_label")}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder={t("form.note_placeholder")}
            />
          </Card>

          <Card>
            <h2 className="text-base font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-2">
              <Camera className="w-4 h-4 text-[var(--text-tertiary)]" />
              {t("form.image_section")}
            </h2>

            {imagePreview ? (
              <div className="relative inline-block">
                <img
                  src={imagePreview}
                  alt={t("form.image_preview_alt")}
                  className="max-h-48 rounded-[var(--radius-lg)] border border-[var(--border)] object-contain"
                />
                <button
                  type="button"
                  onClick={() => {
                    setImageFile(null);
                    setImagePreview(null);
                    if (imageInputRef.current) imageInputRef.current.value = "";
                  }}
                  className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-[var(--danger)] text-white flex items-center justify-center hover:opacity-80 transition-opacity"
                  title={t("form.image_delete")}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => imageInputRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2.5 border border-dashed border-[var(--border)] rounded-[var(--radius-lg)] text-sm text-[var(--text-secondary)] hover:bg-[var(--surface)] transition-colors"
              >
                <Camera className="w-4 h-4" />
                {t("form.image_pick")}
              </button>
            )}

            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setImageFile(file);
                const reader = new FileReader();
                reader.onload = (ev) =>
                  setImagePreview(ev.target?.result as string);
                reader.readAsDataURL(file);
              }}
            />
          </Card>

          <div className="flex flex-col-reverse sm:flex-row gap-3 justify-end">
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate(-1)}
            >
              {t("common:actions.cancel")}
            </Button>

            <Button type="submit" disabled={submitting}>
              {isEditMode ? (
                <Save className="w-4 h-4" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              {submitting
                ? t("form.submitting")
                : isEditMode
                  ? t("form.submit_edit")
                  : t("form.submit_create")}
            </Button>
          </div>
        </form>
      </div>
      <ChatTransactionParser
        isOpen={showChatParser}
        onClose={() => setShowChatParser(false)}
        accounts={(metaData?.accounts || []).map((account) => ({
          id: account.id,
          name: account.name,
          status: account.status,
          providerName: account.providerName,
          accountType: account.accountType,
          currencyCode: account.currencyCode,
        }))}
        categories={(metaData?.categories || []).map((category) => ({
          id: category.id,
          name: category.name,
          categoryType: category.categoryType,
          archivedAt: category.archivedAt,
        }))}
        merchants={(metaData?.merchants || []).map((merchant) => ({
          id: merchant.id,
          name: merchant.name,
          defaultCategoryId: merchant.defaultCategoryId,
          isHidden: merchant.isHidden,
        }))}
        onApply={handleApplyQuickDraft}
      />
    </div>
  );
}

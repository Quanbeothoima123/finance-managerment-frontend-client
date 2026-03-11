import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router";
import {
  ArrowLeft,
  Plus,
  Save,
  SplitSquareHorizontal,
  Store,
  Tag,
  Trash2,
} from "lucide-react";
import { AmountInput } from "../components/AmountInput";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { Input } from "../components/Input";
import { TagChip } from "../components/TagChip";
import { useToast } from "../contexts/ToastContext";
import { useTransactionDetail } from "../hooks/useTransactionDetail";
import { useTransactionsMeta } from "../hooks/useTransactionsMeta";
import { transactionsService } from "../services/transactionsService";
import type { CreateTransactionPayload } from "../types/transactions";

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

function formatMoney(value?: string | number | null) {
  return new Intl.NumberFormat("vi-VN").format(Number(value || 0));
}

export default function AddEditTransaction() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const [searchParams] = useSearchParams();

  const duplicateFrom = searchParams.get("duplicateFrom") || undefined;
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
  const [accountId, setAccountId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [merchantName, setMerchantName] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(todayString());
  const [notes, setNotes] = useState("");
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [isSplit, setIsSplit] = useState(false);
  const [splitLines, setSplitLines] = useState<SplitLineForm[]>([
    createSplitLine(),
    createSplitLine(),
  ]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [initialized, setInitialized] = useState(false);

  const categories = useMemo(() => {
    return (metaData?.categories || []).filter((item) => {
      if (item.archivedAt) return false;
      return (
        item.categoryType === transactionType || item.categoryType === "both"
      );
    });
  }, [metaData?.categories, transactionType]);

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

      const nextType =
        sourceTransaction.txnType === "income" ? "income" : "expense";
      setTransactionType(nextType);
      setAmount(String(Number(sourceTransaction.totalAmountMinor || 0)));
      setAccountId(
        sourceTransaction.account?.id ||
          metaData.defaults.defaultAccountId ||
          "",
      );
      setCategoryId(sourceTransaction.category?.id || "");
      setMerchantName(sourceTransaction.merchant?.name || "");
      setDescription(sourceTransaction.description || "");
      setDate(
        isDuplicateMode
          ? todayString()
          : sourceTransaction.date || todayString(),
      );
      setNotes(sourceTransaction.note || "");
      setSelectedTagIds(sourceTransaction.tags.map((item) => item.id));
      setIsSplit(Boolean(sourceTransaction.isSplit));
      setSplitLines(
        sourceTransaction.isSplit && sourceTransaction.splitItems.length
          ? sourceTransaction.splitItems.map((item) => ({
              id: item.id,
              categoryId: item.category?.id || "",
              amount: String(Number(item.amountMinor || 0)),
              note: item.note || "",
            }))
          : [createSplitLine(), createSplitLine()],
      );
      setInitialized(true);
      return;
    }

    setAccountId(metaData.defaults.defaultAccountId || "");
    setCategoryId(
      transactionType === "income"
        ? metaData.defaults.defaultIncomeCategoryId || ""
        : metaData.defaults.defaultExpenseCategoryId || "",
    );
    setInitialized(true);
  }, [
    metaData,
    sourceTransaction,
    sourceTransactionId,
    isDuplicateMode,
    transactionType,
    initialized,
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

  const merchantMatch = useMemo(() => {
    const normalized = merchantName.trim().toLowerCase();
    return (metaData?.merchants || []).find(
      (item) => item.name.trim().toLowerCase() === normalized,
    );
  }, [merchantName, metaData?.merchants]);

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

  const addSplitLine = () =>
    setSplitLines((prev) => [...prev, createSplitLine()]);

  const removeSplitLine = (lineId: string) => {
    setSplitLines((prev) => {
      const next = prev.filter((line) => line.id !== lineId);
      return next.length > 0 ? next : [createSplitLine()];
    });
  };

  const validate = () => {
    const nextErrors: Record<string, string> = {};
    const numericAmount = Number(amount || 0);

    if (!amount || numericAmount <= 0)
      nextErrors.amount = "Vui lòng nhập số tiền hợp lệ";
    if (!accountId) nextErrors.accountId = "Vui lòng chọn tài khoản";
    if (!description.trim()) nextErrors.description = "Vui lòng nhập mô tả";
    if (!date) nextErrors.date = "Vui lòng chọn ngày";

    if (!isSplit && !categoryId) {
      nextErrors.categoryId = "Vui lòng chọn danh mục";
    }

    if (isSplit) {
      const hasMissingCategory = splitLines.some((line) => !line.categoryId);
      const hasInvalidAmount = splitLines.some(
        (line) => Number(line.amount || 0) <= 0,
      );

      if (hasMissingCategory)
        nextErrors.splitCategory = "Tất cả dòng split phải có danh mục";
      if (hasInvalidAmount)
        nextErrors.splitAmount = "Tất cả dòng split phải có số tiền > 0";
      if (remaining !== 0)
        nextErrors.splitTotal = "Tổng split phải bằng tổng giao dịch";
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
      ...(merchantName.trim()
        ? merchantMatch
          ? { merchantId: merchantMatch.id }
          : { merchantName: merchantName.trim() }
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

      toast.success(isEditMode ? "Đã cập nhật giao dịch" : "Đã tạo giao dịch");
      navigate(`/transactions/${result.id}`);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Không thể lưu giao dịch",
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
            Đang tải dữ liệu giao dịch...
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
            {metaError || sourceError || "Không thể tải dữ liệu giao dịch"}
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
            Giao dịch này là chuyển tiền
          </h2>
          <p className="text-sm text-[var(--text-secondary)] mt-2">
            Vui lòng dùng màn hình Chuyển tiền để chỉnh sửa hoặc nhân bản giao
            dịch transfer.
          </p>
          <div className="mt-4 flex gap-3">
            <Button variant="secondary" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-4 h-4" />
              Quay lại
            </Button>
            <Button
              onClick={() =>
                navigate(
                  `/transfer/create?${isEditMode ? "editId" : "duplicateFrom"}=${sourceTransaction.id}`,
                )
              }
            >
              Mở màn hình chuyển tiền
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-6 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-[var(--radius-lg)] hover:bg-[var(--surface)] transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-[var(--text-primary)]" />
          </button>
          <div>
            <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
              {isEditMode
                ? "Chỉnh sửa giao dịch"
                : isDuplicateMode
                  ? "Nhân bản giao dịch"
                  : "Thêm giao dịch"}
            </h1>
            <p className="text-sm text-[var(--text-secondary)] mt-1">
              Tạo giao dịch thu/chi và đồng bộ trực tiếp với backend.
            </p>
          </div>
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
                    {item === "expense" ? "Chi tiêu" : "Thu nhập"}
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
                  Tài khoản <span className="text-[var(--danger)]">*</span>
                </label>
                <select
                  value={accountId}
                  onChange={(event) => {
                    setAccountId(event.target.value);
                    setErrors((prev) => ({ ...prev, accountId: "" }));
                  }}
                  className="w-full px-4 py-2.5 bg-[var(--input-background)] border border-[var(--border)] rounded-[var(--radius-lg)]"
                >
                  <option value="">Chọn tài khoản</option>
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
                  Ngày giao dịch <span className="text-[var(--danger)]">*</span>
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
                label="Mô tả"
                value={description}
                onChange={(event) => {
                  setDescription(event.target.value);
                  setErrors((prev) => ({ ...prev, description: "" }));
                }}
                placeholder="Ví dụ: Cafe với khách hàng"
                error={errors.description}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                  {!isSplit && (
                    <>
                      Danh mục <span className="text-[var(--danger)]">*</span>
                    </>
                  )}
                  {isSplit && "Danh mục được chọn trong từng dòng split"}
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
                  <option value="">Chọn danh mục</option>
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
                  Merchant
                </label>
                <div className="relative">
                  <Store className="w-4 h-4 text-[var(--text-tertiary)] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    list="merchant-options"
                    value={merchantName}
                    onChange={(event) => setMerchantName(event.target.value)}
                    placeholder="Nhập hoặc chọn merchant"
                    className="w-full pl-10 pr-4 py-2.5 bg-[var(--input-background)] border border-[var(--border)] rounded-[var(--radius-lg)]"
                  />
                  <datalist id="merchant-options">
                    {(metaData?.merchants || []).map((merchant) => (
                      <option key={merchant.id} value={merchant.name} />
                    ))}
                  </datalist>
                </div>
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
                  Bật phân chia nhiều danh mục
                </span>
              </label>
            </div>
          </Card>

          {isSplit && (
            <Card>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                    Split danh mục
                  </h2>
                  <p className="text-sm text-[var(--text-secondary)] mt-1">
                    Tổng split phải bằng {formatMoney(amount || 0)} ₫
                  </p>
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={addSplitLine}
                >
                  <Plus className="w-4 h-4" />
                  Thêm dòng
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
                        Dòng {index + 1}
                      </p>
                      <button
                        type="button"
                        onClick={() => removeSplitLine(line.id)}
                        className="p-2 rounded-[var(--radius-md)] hover:bg-[var(--surface)] text-[var(--danger)]"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                          Danh mục
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
                          <option value="">Chọn danh mục</option>
                          {categories.map((category) => (
                            <option key={category.id} value={category.id}>
                              {category.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                          Số tiền
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
                        label="Ghi chú dòng split"
                        value={line.note}
                        onChange={(event) =>
                          updateSplitLine(line.id, { note: event.target.value })
                        }
                        placeholder="Tuỳ chọn"
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
                Còn lại:{" "}
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
              <div className="flex items-center gap-2 mb-4">
                <Tag className="w-5 h-5 text-[var(--text-tertiary)]" />
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                  Thẻ
                </h2>
              </div>
              <div className="flex flex-wrap gap-2">
                {metaData.tags.map((tag) => {
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
              label="Ghi chú"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Ghi chú thêm cho giao dịch"
            />
          </Card>

          <div className="flex flex-col-reverse sm:flex-row gap-3 justify-end">
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate(-1)}
            >
              Huỷ
            </Button>
            <Button type="submit" disabled={submitting}>
              {isEditMode ? (
                <Save className="w-4 h-4" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              {submitting
                ? "Đang lưu..."
                : isEditMode
                  ? "Lưu thay đổi"
                  : "Tạo giao dịch"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

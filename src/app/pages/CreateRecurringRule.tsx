import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router";
import {
  ArrowLeft,
  Bell,
  Calendar,
  Save,
  Sparkles,
  Tag,
  Zap,
} from "lucide-react";
import { Card } from "../components/Card";
import { Button } from "../components/Button";
import { AmountInput } from "../components/AmountInput";
import { TagChip } from "../components/TagChip";
import { useAppNavigation } from "../hooks/useAppNavigation";
import { useToast } from "../contexts/ToastContext";
import { useRecurringMeta } from "../hooks/useRecurringMeta";
import { useRecurringDetail } from "../hooks/useRecurringDetail";
import { recurringService } from "../services/recurringService";
import type {
  CreateRecurringRulePayload,
  RecurringEndCondition,
  RecurringExecutionMode,
  RecurringFrequency,
  RecurringTxnType,
} from "../types/recurring";

const WEEKDAY_LABELS = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
const MONTH_LABELS = [
  "Tháng 1",
  "Tháng 2",
  "Tháng 3",
  "Tháng 4",
  "Tháng 5",
  "Tháng 6",
  "Tháng 7",
  "Tháng 8",
  "Tháng 9",
  "Tháng 10",
  "Tháng 11",
  "Tháng 12",
];

function formatNextRun(dateStr?: string | null) {
  if (!dateStr) return "--";
  const d = new Date(dateStr);
  return d.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default function CreateRecurringRule() {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const nav = useAppNavigation();
  const toast = useToast();
  const {
    data: meta,
    loading: metaLoading,
    error: metaError,
  } = useRecurringMeta();
  const {
    data: detail,
    loading: detailLoading,
    error: detailError,
  } = useRecurringDetail(id, isEdit);

  const [initialized, setInitialized] = useState(false);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [txnType, setTxnType] = useState<RecurringTxnType>("expense");
  const [executionMode, setExecutionMode] =
    useState<RecurringExecutionMode>("notify");
  const [amount, setAmount] = useState("");
  const [accountId, setAccountId] = useState("");
  const [toAccountId, setToAccountId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [merchantId, setMerchantId] = useState("");
  const [frequency, setFrequency] = useState<RecurringFrequency>("monthly");
  const [dailyInterval, setDailyInterval] = useState(1);
  const [weeklyDays, setWeeklyDays] = useState<number[]>([]);
  const [monthlyMode, setMonthlyMode] = useState<"specific" | "last">(
    "specific",
  );
  const [monthlyDay, setMonthlyDay] = useState(1);
  const [yearlyMonth, setYearlyMonth] = useState(0);
  const [yearlyDay, setYearlyDay] = useState(1);
  const [startDate, setStartDate] = useState("");
  const [endCondition, setEndCondition] =
    useState<RecurringEndCondition>("never");
  const [endDate, setEndDate] = useState("");
  const [endAfterOccurrences, setEndAfterOccurrences] = useState(12);
  const [tagIds, setTagIds] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [notifyEnabled, setNotifyEnabled] = useState(true);
  const [enabled, setEnabled] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialized) return;
    if (!meta) return;
    if (isEdit && !detail?.rule) return;

    const rule = detail?.rule;
    setName(rule?.name || "");
    setDescription(rule?.description || "");
    setTxnType((rule?.txnType as RecurringTxnType) || "expense");
    setExecutionMode(
      (rule?.executionMode as RecurringExecutionMode) ||
        meta.defaults.executionMode ||
        "notify",
    );
    setAmount(rule ? String(Math.abs(rule.amount)) : "");
    setAccountId(rule?.accountId || "");
    setToAccountId(rule?.toAccountId || "");
    setCategoryId(rule?.categoryId || "");
    setMerchantId(rule?.merchantId || "");
    setFrequency(
      (rule?.frequency as RecurringFrequency) ||
        meta.defaults.frequency ||
        "monthly",
    );
    setDailyInterval(rule?.dailyInterval || rule?.intervalValue || 1);
    setWeeklyDays(rule?.weeklyDays || []);
    setMonthlyMode(rule?.monthlyMode || "specific");
    setMonthlyDay(rule?.monthlyDay || new Date().getDate());
    setYearlyMonth(rule?.yearlyMonth ?? new Date().getMonth());
    setYearlyDay(rule?.yearlyDay || new Date().getDate());
    setStartDate(
      rule?.startDate ||
        meta.defaults.startDate ||
        new Date().toISOString().slice(0, 10),
    );
    setEndCondition(rule?.endCondition || "never");
    setEndDate(rule?.endDate || "");
    setEndAfterOccurrences(rule?.endAfterOccurrences || 12);
    setTagIds(rule?.tagIds || []);
    setNotes(rule?.notes || "");
    setNotifyEnabled(rule?.notifyEnabled ?? true);
    setEnabled(rule?.enabled ?? true);
    setInitialized(true);
  }, [detail?.rule, initialized, isEdit, meta]);

  const selectedTagObjects = useMemo(
    () => meta?.tags.filter((item) => tagIds.includes(item.id)) || [],
    [meta?.tags, tagIds],
  );

  const submitPayload = useMemo<CreateRecurringRulePayload>(
    () => ({
      name: name.trim() || description.trim() || undefined,
      description: description.trim() || name.trim() || undefined,
      txnType,
      type: txnType,
      executionMode,
      amountMinor: amount ? Number(amount) : undefined,
      currencyCode: meta?.defaults.currencyCode || "VND",
      accountId: accountId || undefined,
      fromAccountId: accountId || undefined,
      toAccountId:
        txnType === "transfer" ? toAccountId || undefined : undefined,
      categoryId: txnType === "transfer" ? undefined : categoryId || undefined,
      merchantId: merchantId || undefined,
      tagIds,
      frequency,
      intervalValue: frequency === "daily" ? dailyInterval : 1,
      dailyInterval,
      weeklyDays,
      monthlyMode,
      monthlyDay,
      yearlyMonth,
      yearlyDay,
      startDate,
      endCondition,
      endDate: endCondition === "on-date" ? endDate : null,
      endAfterOccurrences:
        endCondition === "after-n" ? endAfterOccurrences : null,
      notes: notes.trim() || null,
      notifyEnabled,
      enabled,
      isPaused: !enabled,
    }),
    [
      accountId,
      amount,
      categoryId,
      dailyInterval,
      description,
      enabled,
      endAfterOccurrences,
      endCondition,
      endDate,
      executionMode,
      frequency,
      merchantId,
      meta?.defaults.currencyCode,
      monthlyDay,
      monthlyMode,
      name,
      notes,
      notifyEnabled,
      startDate,
      tagIds,
      toAccountId,
      txnType,
      weeklyDays,
      yearlyDay,
      yearlyMonth,
    ],
  );

  const previewText = useMemo(() => {
    if (!startDate) return "--";
    if (frequency === "daily")
      return `Mỗi ${dailyInterval} ngày, bắt đầu từ ${formatNextRun(startDate)}`;
    if (frequency === "weekly") {
      const days = weeklyDays.map((day) => WEEKDAY_LABELS[day]).join(", ");
      return days ? `Mỗi tuần vào ${days}` : "Chọn ngày trong tuần";
    }
    if (frequency === "monthly") {
      return monthlyMode === "last"
        ? "Mỗi tháng vào ngày cuối cùng"
        : `Mỗi tháng vào ngày ${monthlyDay}`;
    }
    return `Mỗi năm vào ${MONTH_LABELS[yearlyMonth]} ngày ${yearlyDay}`;
  }, [
    dailyInterval,
    frequency,
    monthlyDay,
    monthlyMode,
    startDate,
    weeklyDays,
    yearlyDay,
    yearlyMonth,
  ]);

  const validate = () => {
    const nextErrors: Record<string, string> = {};
    if (!name.trim() && !description.trim())
      nextErrors.name = "Tên hoặc mô tả là bắt buộc";
    if (!amount || Number(amount) <= 0)
      nextErrors.amount = "Số tiền phải lớn hơn 0";
    if (!accountId)
      nextErrors.accountId =
        txnType === "transfer"
          ? "Tài khoản nguồn là bắt buộc"
          : "Tài khoản là bắt buộc";
    if (txnType === "transfer") {
      if (!toAccountId) nextErrors.toAccountId = "Tài khoản đích là bắt buộc";
      if (accountId && toAccountId && accountId === toAccountId)
        nextErrors.toAccountId = "Tài khoản đích phải khác tài khoản nguồn";
    } else if (!categoryId) {
      nextErrors.categoryId = "Danh mục là bắt buộc";
    }
    if (!startDate) nextErrors.startDate = "Ngày bắt đầu là bắt buộc";
    if (frequency === "weekly" && weeklyDays.length === 0)
      nextErrors.weeklyDays = "Chọn ít nhất 1 ngày";
    if (
      frequency === "monthly" &&
      monthlyMode === "specific" &&
      (monthlyDay < 1 || monthlyDay > 31)
    )
      nextErrors.monthlyDay = "Ngày trong tháng không hợp lệ";
    if (frequency === "yearly" && (yearlyDay < 1 || yearlyDay > 31))
      nextErrors.yearlyDay = "Ngày trong năm không hợp lệ";
    if (endCondition === "on-date" && !endDate)
      nextErrors.endDate = "Ngày kết thúc là bắt buộc";
    if (endCondition === "after-n" && endAfterOccurrences < 1)
      nextErrors.endAfterOccurrences = "Số lần phải lớn hơn 0";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    try {
      setSaving(true);
      if (isEdit && id) {
        await recurringService.updateRecurringRule(id, submitPayload);
        toast.success("Đã cập nhật giao dịch định kỳ");
        nav.goRecurringRuleDetail(id);
      } else {
        const created =
          await recurringService.createRecurringRule(submitPayload);
        toast.success("Đã tạo giao dịch định kỳ");
        nav.goRecurringRuleDetail(created.rule.id);
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Không thể lưu giao dịch định kỳ",
      );
    } finally {
      setSaving(false);
    }
  };

  const toggleWeeklyDay = (day: number) => {
    setWeeklyDays((prev) =>
      prev.includes(day)
        ? prev.filter((item) => item !== day)
        : [...prev, day].sort((a, b) => a - b),
    );
  };

  const toggleTag = (tagId: string) => {
    setTagIds((prev) =>
      prev.includes(tagId)
        ? prev.filter((item) => item !== tagId)
        : [...prev, tagId],
    );
  };

  if (metaLoading || (isEdit && detailLoading) || !initialized) {
    return (
      <div className="p-4 md:p-6">
        <Card>
          <p className="text-[var(--text-secondary)]">
            Đang tải biểu mẫu giao dịch định kỳ...
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
              "Không thể tải dữ liệu giao dịch định kỳ"}
          </p>
          <Button
            variant="secondary"
            className="mt-4"
            onClick={() => nav.goRecurringRules()}
          >
            <ArrowLeft className="w-4 h-4" /> Quay lại danh sách
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <button
            onClick={() => nav.goRecurringRules()}
            className="inline-flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--primary)] mb-2"
          >
            <ArrowLeft className="w-4 h-4" /> Quay lại giao dịch định kỳ
          </button>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">
            {isEdit ? "Chỉnh sửa giao dịch định kỳ" : "Tạo giao dịch định kỳ"}
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Tạo quy tắc để tự nhắc hoặc tự tạo giao dịch theo lịch.
          </p>
        </div>
        <Button onClick={() => void handleSubmit()} disabled={saving}>
          <Save className="w-4 h-4" />{" "}
          {saving
            ? "Đang lưu..."
            : isEdit
              ? "Lưu thay đổi"
              : "Tạo giao dịch định kỳ"}
        </Button>
      </div>

      <Card>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
              Tên quy tắc
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ví dụ: Tiền nhà mỗi tháng"
              className="w-full px-4 py-3 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--input-background)]"
            />
            {errors.name && (
              <p className="text-sm text-[var(--danger)] mt-1">{errors.name}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
              Mô tả hiển thị
            </label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ví dụ: Thanh toán tiền điện"
              className="w-full px-4 py-3 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--input-background)]"
            />
          </div>
        </div>
      </Card>

      <Card>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
              Loại giao dịch
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(["expense", "income", "transfer"] as RecurringTxnType[]).map(
                (value) => (
                  <button
                    key={value}
                    onClick={() => setTxnType(value)}
                    className={`px-4 py-3 rounded-[var(--radius-lg)] border text-sm font-medium ${txnType === value ? "border-[var(--primary)] bg-[var(--primary-light)] text-[var(--primary)]" : "border-[var(--border)] text-[var(--text-primary)] bg-[var(--surface)]"}`}
                  >
                    {value === "expense"
                      ? "Chi tiêu"
                      : value === "income"
                        ? "Thu nhập"
                        : "Chuyển khoản"}
                  </button>
                ),
              )}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
              Cách thực thi
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setExecutionMode("notify")}
                className={`px-4 py-3 rounded-[var(--radius-lg)] border text-sm font-medium inline-flex items-center justify-center gap-2 ${executionMode === "notify" ? "border-[var(--primary)] bg-[var(--primary-light)] text-[var(--primary)]" : "border-[var(--border)] text-[var(--text-primary)] bg-[var(--surface)]"}`}
              >
                <Bell className="w-4 h-4" /> Chỉ nhắc
              </button>
              <button
                onClick={() => setExecutionMode("auto")}
                className={`px-4 py-3 rounded-[var(--radius-lg)] border text-sm font-medium inline-flex items-center justify-center gap-2 ${executionMode === "auto" ? "border-[var(--warning)] bg-[var(--warning-light)] text-[var(--warning)]" : "border-[var(--border)] text-[var(--text-primary)] bg-[var(--surface)]"}`}
              >
                <Zap className="w-4 h-4" /> Tự tạo
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
              Số tiền
            </label>
            <AmountInput
              value={amount}
              onChange={setAmount}
              error={errors.amount}
            />
          </div>
          <div className="flex items-end">
            <div className="w-full rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] px-4 py-4">
              <p className="text-sm text-[var(--text-secondary)]">Trạng thái</p>
              <div className="mt-2 flex items-center justify-between">
                <div>
                  <p className="font-medium text-[var(--text-primary)]">
                    {enabled ? "Đang hoạt động" : "Tạm dừng"}
                  </p>
                  <p className="text-sm text-[var(--text-secondary)]">
                    {notifyEnabled
                      ? "Có gửi thông báo"
                      : "Tắt thông báo riêng cho quy tắc này"}
                  </p>
                </div>
                <button
                  onClick={() => setEnabled((value) => !value)}
                  className={`relative w-11 h-6 rounded-full ${enabled ? "bg-[var(--success)]" : "bg-[var(--border)]"}`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${enabled ? "translate-x-5" : ""}`}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
          Tài khoản, danh mục và thẻ
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
              {txnType === "transfer" ? "Tài khoản nguồn" : "Tài khoản"}
            </label>
            <select
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="w-full px-4 py-3 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--input-background)]"
            >
              <option value="">Chọn tài khoản</option>
              {meta.accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
            </select>
            {errors.accountId && (
              <p className="text-sm text-[var(--danger)] mt-1">
                {errors.accountId}
              </p>
            )}
          </div>

          {txnType === "transfer" ? (
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                Tài khoản đích
              </label>
              <select
                value={toAccountId}
                onChange={(e) => setToAccountId(e.target.value)}
                className="w-full px-4 py-3 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--input-background)]"
              >
                <option value="">Chọn tài khoản đích</option>
                {meta.accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name}
                  </option>
                ))}
              </select>
              {errors.toAccountId && (
                <p className="text-sm text-[var(--danger)] mt-1">
                  {errors.toAccountId}
                </p>
              )}
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                Danh mục
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-4 py-3 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--input-background)]"
              >
                <option value="">Chọn danh mục</option>
                {meta.categories
                  .filter((item) =>
                    txnType === "income"
                      ? item.categoryType === "income" ||
                        item.categoryType === "both"
                      : item.categoryType === "expense" ||
                        item.categoryType === "both",
                  )
                  .map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
              </select>
              {errors.categoryId && (
                <p className="text-sm text-[var(--danger)] mt-1">
                  {errors.categoryId}
                </p>
              )}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
              Merchant
            </label>
            <select
              value={merchantId}
              onChange={(e) => setMerchantId(e.target.value)}
              className="w-full px-4 py-3 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--input-background)]"
            >
              <option value="">Không chọn merchant</option>
              {meta.merchants.map((merchant) => (
                <option key={merchant.id} value={merchant.id}>
                  {merchant.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
              Thông báo riêng cho quy tắc
            </label>
            <div className="flex items-center justify-between rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] px-4 py-3">
              <div>
                <p className="font-medium text-[var(--text-primary)]">
                  {notifyEnabled ? "Đang bật" : "Đang tắt"}
                </p>
                <p className="text-sm text-[var(--text-secondary)]">
                  Nhắc khi quy tắc đến hạn.
                </p>
              </div>
              <button
                onClick={() => setNotifyEnabled((value) => !value)}
                className={`relative w-11 h-6 rounded-full ${notifyEnabled ? "bg-[var(--success)]" : "bg-[var(--border)]"}`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${notifyEnabled ? "translate-x-5" : ""}`}
                />
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
            Nhãn
          </label>
          <div className="flex flex-wrap gap-2">
            {meta.tags.map((tag) => {
              const active = tagIds.includes(tag.id);
              return (
                <button
                  key={tag.id}
                  onClick={() => toggleTag(tag.id)}
                  type="button"
                  className={`px-3 py-1.5 rounded-full border text-sm ${active ? "border-transparent text-white" : "border-[var(--border)] text-[var(--text-primary)] bg-[var(--surface)]"}`}
                  style={
                    active
                      ? { backgroundColor: tag.colorHex || "#3b82f6" }
                      : undefined
                  }
                >
                  <span>{tag.name}</span>
                </button>
              );
            })}
          </div>
          {selectedTagObjects.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {selectedTagObjects.map((tag) => (
                <TagChip
                  key={tag.id}
                  name={tag.name}
                  color={tag.colorHex || "#3b82f6"}
                  onRemove={() => toggleTag(tag.id)}
                />
              ))}
            </div>
          )}
        </div>
      </Card>

      <Card>
        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
          Lịch chạy
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
              Tần suất
            </label>
            <select
              value={frequency}
              onChange={(e) =>
                setFrequency(e.target.value as RecurringFrequency)
              }
              className="w-full px-4 py-3 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--input-background)]"
            >
              <option value="daily">Hàng ngày</option>
              <option value="weekly">Hàng tuần</option>
              <option value="monthly">Hàng tháng</option>
              <option value="yearly">Hàng năm</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
              Ngày bắt đầu
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-4 py-3 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--input-background)]"
            />
            {errors.startDate && (
              <p className="text-sm text-[var(--danger)] mt-1">
                {errors.startDate}
              </p>
            )}
          </div>
        </div>

        {frequency === "daily" && (
          <div className="mt-4">
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
              Mỗi bao nhiêu ngày
            </label>
            <input
              type="number"
              min={1}
              value={dailyInterval}
              onChange={(e) => setDailyInterval(Number(e.target.value) || 1)}
              className="w-full md:w-60 px-4 py-3 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--input-background)]"
            />
          </div>
        )}

        {frequency === "weekly" && (
          <div className="mt-4">
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
              Ngày trong tuần
            </label>
            <div className="flex flex-wrap gap-2">
              {WEEKDAY_LABELS.map((label, index) => (
                <button
                  key={label}
                  onClick={() => toggleWeeklyDay(index)}
                  className={`px-3 py-2 rounded-[var(--radius-lg)] border text-sm font-medium ${weeklyDays.includes(index) ? "border-[var(--primary)] bg-[var(--primary-light)] text-[var(--primary)]" : "border-[var(--border)] text-[var(--text-primary)] bg-[var(--surface)]"}`}
                >
                  {label}
                </button>
              ))}
            </div>
            {errors.weeklyDays && (
              <p className="text-sm text-[var(--danger)] mt-1">
                {errors.weeklyDays}
              </p>
            )}
          </div>
        )}

        {frequency === "monthly" && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                Kiểu lặp hàng tháng
              </label>
              <select
                value={monthlyMode}
                onChange={(e) =>
                  setMonthlyMode(e.target.value as "specific" | "last")
                }
                className="w-full px-4 py-3 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--input-background)]"
              >
                <option value="specific">Ngày cụ thể</option>
                <option value="last">Ngày cuối tháng</option>
              </select>
            </div>
            {monthlyMode === "specific" && (
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                  Ngày trong tháng
                </label>
                <input
                  type="number"
                  min={1}
                  max={31}
                  value={monthlyDay}
                  onChange={(e) => setMonthlyDay(Number(e.target.value) || 1)}
                  className="w-full px-4 py-3 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--input-background)]"
                />
                {errors.monthlyDay && (
                  <p className="text-sm text-[var(--danger)] mt-1">
                    {errors.monthlyDay}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {frequency === "yearly" && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                Tháng
              </label>
              <select
                value={yearlyMonth}
                onChange={(e) => setYearlyMonth(Number(e.target.value))}
                className="w-full px-4 py-3 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--input-background)]"
              >
                {MONTH_LABELS.map((label, index) => (
                  <option key={label} value={index}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                Ngày
              </label>
              <input
                type="number"
                min={1}
                max={31}
                value={yearlyDay}
                onChange={(e) => setYearlyDay(Number(e.target.value) || 1)}
                className="w-full px-4 py-3 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--input-background)]"
              />
              {errors.yearlyDay && (
                <p className="text-sm text-[var(--danger)] mt-1">
                  {errors.yearlyDay}
                </p>
              )}
            </div>
          </div>
        )}

        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
              Điều kiện kết thúc
            </label>
            <select
              value={endCondition}
              onChange={(e) =>
                setEndCondition(e.target.value as RecurringEndCondition)
              }
              className="w-full px-4 py-3 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--input-background)]"
            >
              <option value="never">Không kết thúc</option>
              <option value="on-date">Kết thúc vào ngày</option>
              <option value="after-n">Kết thúc sau số lần</option>
            </select>
          </div>
          {endCondition === "on-date" && (
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                Ngày kết thúc
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-4 py-3 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--input-background)]"
              />
              {errors.endDate && (
                <p className="text-sm text-[var(--danger)] mt-1">
                  {errors.endDate}
                </p>
              )}
            </div>
          )}
          {endCondition === "after-n" && (
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                Số lần thực hiện
              </label>
              <input
                type="number"
                min={1}
                value={endAfterOccurrences}
                onChange={(e) =>
                  setEndAfterOccurrences(Number(e.target.value) || 1)
                }
                className="w-full px-4 py-3 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--input-background)]"
              />
              {errors.endAfterOccurrences && (
                <p className="text-sm text-[var(--danger)] mt-1">
                  {errors.endAfterOccurrences}
                </p>
              )}
            </div>
          )}
        </div>
      </Card>

      <Card>
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-[var(--radius-lg)] bg-[var(--primary-light)] text-[var(--primary)] flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-[var(--text-primary)] mb-1">
              Xem trước quy tắc
            </h3>
            <p className="text-sm text-[var(--text-secondary)]">
              {previewText}
            </p>
            <div className="flex flex-wrap gap-2 mt-3 text-sm">
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-[var(--surface)] text-[var(--text-secondary)]">
                <Calendar className="w-3.5 h-3.5" /> Bắt đầu{" "}
                {formatNextRun(startDate)}
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-[var(--surface)] text-[var(--text-secondary)]">
                {executionMode === "auto" ? (
                  <Zap className="w-3.5 h-3.5" />
                ) : (
                  <Bell className="w-3.5 h-3.5" />
                )}{" "}
                {executionMode === "auto"
                  ? "Tự tạo giao dịch"
                  : "Chỉ gửi nhắc nhở"}
              </span>
              {selectedTagObjects.length > 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-[var(--surface)] text-[var(--text-secondary)]">
                  <Tag className="w-3.5 h-3.5" /> {selectedTagObjects.length}{" "}
                  nhãn
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6">
          <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
            Ghi chú
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            className="w-full px-4 py-3 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--input-background)]"
            placeholder="Ghi chú thêm cho giao dịch định kỳ này..."
          />
        </div>
      </Card>

      <div className="flex justify-end gap-3">
        <Button variant="secondary" onClick={() => nav.goRecurringRules()}>
          Huỷ
        </Button>
        <Button onClick={() => void handleSubmit()} disabled={saving}>
          {saving
            ? "Đang lưu..."
            : isEdit
              ? "Lưu thay đổi"
              : "Tạo giao dịch định kỳ"}
        </Button>
      </div>
    </div>
  );
}

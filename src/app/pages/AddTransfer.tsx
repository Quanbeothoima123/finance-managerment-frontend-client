import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import {
  ArrowDown,
  ArrowLeft,
  ArrowLeftRight,
  Building2,
  CreditCard,
  Save,
  Wallet,
} from "lucide-react";
import { AmountInput } from "../components/AmountInput";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { Input } from "../components/Input";
import { useToast } from "../contexts/ToastContext";
import { useTransactionDetail } from "../hooks/useTransactionDetail";
import { useTransactionsMeta } from "../hooks/useTransactionsMeta";
import { transactionsService } from "../services/transactionsService";
import {
  getAccountTypeLabel,
  maskAccountNumber,
  normalizeFrontendAccountType,
} from "../utils/accountHelpers";

function todayString() {
  return new Date().toISOString().slice(0, 10);
}

function formatMoney(value?: string | number | null) {
  return new Intl.NumberFormat("vi-VN").format(Number(value || 0));
}

function getAccountIcon(type: string) {
  const normalized = normalizeFrontendAccountType(type);
  if (normalized === "bank") return Building2;
  if (normalized === "credit") return CreditCard;
  return Wallet;
}

export default function AddTransfer() {
  const navigate = useNavigate();
  const toast = useToast();
  const [searchParams] = useSearchParams();

  const editId = searchParams.get("editId") || undefined;
  const duplicateFrom = searchParams.get("duplicateFrom") || undefined;
  const prefilledFromAccountId = searchParams.get("fromAccountId") || undefined;
  const sourceTransactionId = editId || duplicateFrom;
  const isEditMode = Boolean(editId);
  const isDuplicateMode = !editId && Boolean(duplicateFrom);

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

  const [amount, setAmount] = useState("");
  const [fromAccountId, setFromAccountId] = useState(
    prefilledFromAccountId || "",
  );
  const [toAccountId, setToAccountId] = useState("");
  const [serviceFee, setServiceFee] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(todayString());
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (!metaData || initialized) return;
    if (sourceTransactionId && !sourceTransaction) return;

    if (sourceTransaction) {
      if (sourceTransaction.txnType !== "transfer") return;

      setAmount(String(Number(sourceTransaction.totalAmountMinor || 0)));
      setFromAccountId(
        sourceTransaction.account?.id ||
          prefilledFromAccountId ||
          metaData.defaults.defaultAccountId ||
          "",
      );
      setToAccountId(sourceTransaction.toAccount?.id || "");
      setServiceFee(
        String(Number(sourceTransaction.serviceFeeMinor || 0) || ""),
      );
      setDescription(sourceTransaction.description || "");
      setDate(
        isDuplicateMode
          ? todayString()
          : sourceTransaction.date || todayString(),
      );
      setNotes(sourceTransaction.note || "");
      setInitialized(true);
      return;
    }

    setFromAccountId(
      prefilledFromAccountId || metaData.defaults.defaultAccountId || "",
    );
    setInitialized(true);
  }, [
    metaData,
    sourceTransaction,
    sourceTransactionId,
    initialized,
    prefilledFromAccountId,
    isDuplicateMode,
  ]);

  const accounts = metaData?.accounts || [];
  const fromAccount =
    accounts.find((item) => item.id === fromAccountId) || null;
  const totalDeduction = Number(amount || 0) + Number(serviceFee || 0);

  const validate = () => {
    const nextErrors: Record<string, string> = {};

    if (!amount || Number(amount || 0) <= 0)
      nextErrors.amount = "Vui lòng nhập số tiền hợp lệ";
    if (!fromAccountId)
      nextErrors.fromAccountId = "Vui lòng chọn tài khoản nguồn";
    if (!toAccountId) nextErrors.toAccountId = "Vui lòng chọn tài khoản đích";
    if (fromAccountId && toAccountId && fromAccountId === toAccountId) {
      nextErrors.toAccountId = "Tài khoản đích phải khác tài khoản nguồn";
    }
    if (!description.trim()) nextErrors.description = "Vui lòng nhập mô tả";
    if (!date) nextErrors.date = "Vui lòng chọn ngày";

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validate()) return;

    try {
      setSubmitting(true);
      const payload = {
        type: "transfer" as const,
        amount: Number(amount || 0),
        fromAccountId,
        toAccountId,
        serviceFee: Number(serviceFee || 0) || undefined,
        description: description.trim(),
        date,
        notes: notes.trim() || undefined,
      };

      const result =
        isEditMode && editId
          ? await transactionsService.updateTransaction(editId, payload)
          : await transactionsService.createTransaction(payload);

      toast.success(
        isEditMode ? "Đã cập nhật chuyển tiền" : "Đã tạo giao dịch chuyển tiền",
      );
      navigate(`/transactions/${result.id}`);
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Không thể lưu giao dịch chuyển tiền",
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
            Đang tải dữ liệu chuyển tiền...
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
            {metaError || sourceError || "Không thể tải dữ liệu chuyển tiền"}
          </p>
        </Card>
      </div>
    );
  }

  if (sourceTransaction && sourceTransaction.txnType !== "transfer") {
    return (
      <div className="min-h-screen bg-[var(--background)] p-4 md:p-6">
        <Card>
          <p className="text-sm text-[var(--danger)]">
            Giao dịch nguồn không phải là transfer, không thể mở bằng màn hình
            chuyển tiền.
          </p>
          <div className="mt-4">
            <Button variant="secondary" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-4 h-4" />
              Quay lại
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const AccountCard = ({
    account,
    selected,
    onClick,
  }: {
    account: (typeof accounts)[number];
    selected: boolean;
    onClick: () => void;
  }) => {
    const Icon = getAccountIcon(account.accountType);
    return (
      <button
        type="button"
        onClick={onClick}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-[var(--radius-lg)] border transition-all text-left ${
          selected
            ? "border-[var(--primary)] bg-[var(--primary-light)] ring-2 ring-[var(--primary)]/20"
            : "border-[var(--border)] bg-[var(--input-background)] hover:border-[var(--text-tertiary)]"
        }`}
      >
        <div
          className="w-10 h-10 rounded-[var(--radius-md)] flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: `${account.colorHex || "#2563eb"}20` }}
        >
          <Icon
            className="w-5 h-5"
            style={{ color: account.colorHex || "#2563eb" }}
          />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-[var(--text-primary)] truncate">
            {account.name}
          </p>
          <p className="text-xs text-[var(--text-tertiary)] truncate mt-1">
            {account.providerName || getAccountTypeLabel(account.accountType)}
            {account.accountNumber
              ? ` • ${maskAccountNumber(account.accountNumber, account.accountType)}`
              : ""}
          </p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-sm font-semibold text-[var(--text-primary)] tabular-nums">
            {formatMoney(account.currentBalanceMinor)} ₫
          </p>
        </div>
      </button>
    );
  };

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
                ? "Chỉnh sửa chuyển tiền"
                : isDuplicateMode
                  ? "Nhân bản chuyển tiền"
                  : "Chuyển tiền"}
            </h1>
            <p className="text-sm text-[var(--text-secondary)] mt-1">
              Tạo transfer giữa 2 tài khoản, có thể kèm phí dịch vụ.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <AmountInput
              value={amount}
              onChange={setAmount}
              error={errors.amount}
            />
          </Card>

          <Card>
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-3">
                Từ tài khoản <span className="text-[var(--danger)]">*</span>
              </label>
              <div className="space-y-2">
                {accounts.map((account) => (
                  <AccountCard
                    key={account.id}
                    account={account}
                    selected={fromAccountId === account.id}
                    onClick={() => {
                      setFromAccountId(account.id);
                      if (toAccountId === account.id) setToAccountId("");
                      setErrors((prev) => ({
                        ...prev,
                        fromAccountId: "",
                        toAccountId: "",
                      }));
                    }}
                  />
                ))}
              </div>
              {errors.fromAccountId && (
                <p className="mt-1 text-sm text-[var(--danger)]">
                  {errors.fromAccountId}
                </p>
              )}
            </div>

            <div className="flex justify-center py-4">
              <div className="w-10 h-10 rounded-full bg-[var(--info-light)] border border-[var(--info)]/30 flex items-center justify-center">
                <ArrowDown className="w-5 h-5 text-[var(--info)]" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-3">
                Đến tài khoản <span className="text-[var(--danger)]">*</span>
              </label>
              <div className="space-y-2">
                {accounts
                  .filter((account) => account.id !== fromAccountId)
                  .map((account) => (
                    <AccountCard
                      key={account.id}
                      account={account}
                      selected={toAccountId === account.id}
                      onClick={() => {
                        setToAccountId(account.id);
                        setErrors((prev) => ({ ...prev, toAccountId: "" }));
                      }}
                    />
                  ))}
              </div>
              {errors.toAccountId && (
                <p className="mt-1 text-sm text-[var(--danger)]">
                  {errors.toAccountId}
                </p>
              )}
            </div>
          </Card>

          <Card>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                  Phí dịch vụ
                </label>
                <input
                  type="number"
                  min="0"
                  value={serviceFee}
                  onChange={(event) => setServiceFee(event.target.value)}
                  placeholder="0"
                  className="w-full px-4 py-2.5 bg-[var(--input-background)] border border-[var(--border)] rounded-[var(--radius-lg)]"
                />
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
                placeholder="Ví dụ: Chuyển sang tài khoản tiết kiệm"
                error={errors.description}
              />
            </div>

            <div className="mt-4">
              <Input
                label="Ghi chú"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Tuỳ chọn"
              />
            </div>

            {fromAccount && (
              <div className="mt-4 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-4 text-sm text-[var(--text-secondary)]">
                Khấu trừ dự kiến từ{" "}
                <span className="font-medium text-[var(--text-primary)]">
                  {fromAccount.name}
                </span>
                :{" "}
                <span className="font-semibold text-[var(--danger)]">
                  {formatMoney(totalDeduction)} ₫
                </span>
              </div>
            )}
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
                <ArrowLeftRight className="w-4 h-4" />
              )}
              {submitting
                ? "Đang lưu..."
                : isEditMode
                  ? "Lưu thay đổi"
                  : "Tạo chuyển tiền"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useSearchParams } from "react-router";
import {
  ArrowDown,
  ArrowLeft,
  ArrowLeftRight,
  Building2,
  CreditCard,
  AlertCircle,
  Save,
  Wallet,
} from "lucide-react";
import i18n from "../../i18n";
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

function getLocale() {
  return i18n.language === "en" ? "en-US" : "vi-VN";
}

function formatMoney(value?: string | number | null) {
  return new Intl.NumberFormat(getLocale()).format(Number(value || 0));
}

function getAccountIcon(type: string) {
  const normalized = normalizeFrontendAccountType(type);
  if (normalized === "bank") return Building2;
  if (normalized === "credit") return CreditCard;
  return Wallet;
}

export default function AddTransfer() {
  const { t } = useTranslation("transactions");
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

  const accounts = useMemo(() => {
    return (metaData?.accounts || []).filter(
      (item) => item.status === "active",
    );
  }, [metaData?.accounts]);

  const fromAccount =
    accounts.find((item) => item.id === fromAccountId) || null;
  const toAccount = accounts.find((item) => item.id === toAccountId) || null;
  const totalDeduction = Number(amount || 0) + Number(serviceFee || 0);

  const hasCrossCurrency =
    Boolean(fromAccount && toAccount) &&
    fromAccount?.currencyCode !== toAccount?.currencyCode;

  const insufficientBalance =
    Boolean(fromAccount) &&
    Number(amount || 0) > 0 &&
    totalDeduction > Number(fromAccount?.currentBalanceMinor || 0);

  const validate = () => {
    const nextErrors: Record<string, string> = {};

    if (!amount || Number(amount || 0) <= 0) {
      nextErrors.amount = t("transfer.errors.amount_invalid");
    }
    if (!fromAccountId) {
      nextErrors.fromAccountId = t("transfer.errors.from_account_required");
    }
    if (!toAccountId) {
      nextErrors.toAccountId = t("transfer.errors.to_account_required");
    }
    if (fromAccountId && toAccountId && fromAccountId === toAccountId) {
      nextErrors.toAccountId = t("transfer.errors.same_account");
    }
    if (!description.trim()) {
      nextErrors.description = t("transfer.errors.description_required");
    }
    if (!date) {
      nextErrors.date = t("transfer.errors.date_required");
    }
    if (hasCrossCurrency) {
      nextErrors.currency = t("transfer.errors.different_currency");
    }
    if (insufficientBalance) {
      nextErrors.balance = t("transfer.errors.insufficient_balance");
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
        isEditMode ? t("transfer.success_edit") : t("transfer.success_create"),
      );
      navigate(`/transactions/${result.id}`);
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : t("transfer.errors.save_failed"),
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
            {metaError || sourceError || t("transfer.errors.load_failed")}
          </p>
        </Card>
      </div>
    );
  }

  if (sourceTransaction && sourceTransaction.txnType !== "transfer") {
    return (
      <div className="min-h-screen bg-[var(--background)] p-4 md:p-6">
        <Card>
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">
            {t("transfer.wrong_type_title")}
          </h2>
          <p className="text-sm text-[var(--danger)] mt-2">
            {t("transfer.wrong_type_body")}
          </p>
          <div className="mt-4">
            <Button variant="secondary" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-4 h-4" />
              {t("common:actions.back")}
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
          <p className="text-[10px] text-[var(--text-tertiary)] mt-0.5">
            {account.currencyCode}
          </p>
        </div>
      </button>
    );
  };

  const isSubmitDisabled =
    submitting ||
    Number(amount || 0) <= 0 ||
    hasCrossCurrency ||
    insufficientBalance;

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
          <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
            {isEditMode
              ? t("transfer.title_edit")
              : isDuplicateMode
                ? t("transfer.title_duplicate")
                : t("transfer.title_create")}
          </h1>
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
                {t("transfer.from_account_label")}{" "}
                <span className="text-[var(--danger)]">*</span>
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
                        currency: "",
                        balance: "",
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
                {t("transfer.to_account_label")}{" "}
                <span className="text-[var(--danger)]">*</span>
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
                        setErrors((prev) => ({
                          ...prev,
                          toAccountId: "",
                          currency: "",
                        }));
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
                  {t("transfer.service_fee_label")}
                </label>
                <input
                  type="number"
                  min="0"
                  value={serviceFee}
                  onChange={(event) => {
                    setServiceFee(event.target.value);
                    if (errors.balance) {
                      setErrors((prev) => ({ ...prev, balance: "" }));
                    }
                  }}
                  placeholder="0"
                  className="w-full px-4 py-2.5 bg-[var(--input-background)] border border-[var(--border)] rounded-[var(--radius-lg)]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                  {t("transfer.date_label")}{" "}
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
                label={t("transfer.description_label")}
                value={description}
                onChange={(event) => {
                  setDescription(event.target.value);
                  setErrors((prev) => ({ ...prev, description: "" }));
                }}
                placeholder={t("transfer.description_placeholder")}
                error={errors.description}
              />
            </div>

            <div className="mt-4">
              <Input
                label={t("transfer.note_label")}
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder={t("transfer.note_placeholder")}
              />
            </div>

            {hasCrossCurrency && (
              <div className="mt-4 p-3 rounded-[var(--radius-lg)] bg-[var(--warning-light)] border border-[var(--warning)]/30">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-[var(--warning)] mt-0.5" />
                  <p className="text-sm text-[var(--text-secondary)]">
                    {t("transfer.errors.different_currency")}
                  </p>
                </div>
              </div>
            )}

            {insufficientBalance && (
              <div className="mt-4 p-3 rounded-[var(--radius-lg)] bg-[var(--danger-light)] border border-[var(--danger)]/30">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-[var(--danger)] mt-0.5" />
                  <p className="text-sm text-[var(--text-secondary)]">
                    {t("transfer.errors.insufficient_balance")}
                  </p>
                </div>
              </div>
            )}

            {fromAccount && (
              <div className="mt-4 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-4 text-sm text-[var(--text-secondary)]">
                {t("transfer.deduction_preview", {
                  account: fromAccount.name,
                  amount: `${formatMoney(totalDeduction)} ₫`,
                })}
              </div>
            )}
          </Card>

          <div className="flex flex-col-reverse sm:flex-row gap-3 justify-end">
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate(-1)}
            >
              {t("common:actions.cancel")}
            </Button>

            <Button type="submit" disabled={isSubmitDisabled}>
              {isEditMode ? (
                <Save className="w-4 h-4" />
              ) : (
                <ArrowLeftRight className="w-4 h-4" />
              )}
              {submitting
                ? t("transfer.submitting")
                : isEditMode
                  ? t("transfer.submit_edit")
                  : t("transfer.submit_create")}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

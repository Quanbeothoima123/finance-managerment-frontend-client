import React, { useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRightLeft,
  Building2,
  Edit2,
  Eye,
  EyeOff,
  MoreVertical,
  Plus,
  Trash2,
  Wallet,
  Wrench,
} from "lucide-react";
import { useNavigate, useParams } from "react-router";
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useTranslation } from "react-i18next";
import { Card } from "../components/Card";
import { Button } from "../components/Button";
import { TagChip } from "../components/TagChip";
import { ConfirmationModal } from "../components/ConfirmationModals";
import { useToast } from "../contexts/ToastContext";
import { useAppNavigation } from "../hooks/useAppNavigation";
import { useAccountDetail } from "../hooks/useAccountDetail";
import { accountsService } from "../services/accountsService";
import type { AccountSummaryDto } from "../types/accounts";
import {
  getAccountTypeLabel,
  maskAccountNumber,
  normalizeFrontendAccountType,
} from "../utils/accountHelpers";

function formatMoney(value?: string | number | null) {
  return new Intl.NumberFormat("vi-VN").format(Number(value || 0));
}

function formatShortDate(value?: string | null) {
  if (!value) return "Hôm nay";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
  }).format(date);
}

function formatDateTime(value?: string | null) {
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function getAccountIcon(type: string) {
  switch (normalizeFrontendAccountType(type)) {
    case "bank":
      return Building2;
    default:
      return Wallet;
  }
}

function ReconcileModal({
  account,
  pending,
  onClose,
  onSubmit,
}: {
  account: AccountSummaryDto;
  pending: boolean;
  onClose: () => void;
  onSubmit: (payload: {
    actualBalanceMinor: number;
    reason?: string;
    note?: string;
  }) => Promise<void>;
}) {
  const { t } = useTranslation("accounts");
  const [actualBalance, setActualBalance] = useState("");
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");

  const currentBalance = Number(account.currentBalanceMinor || 0);
  const actualValue = Number(actualBalance || 0);
  const difference = actualValue - currentBalance;

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-[var(--card)] rounded-[var(--radius-xl)] p-6"
        onClick={(event) => event.stopPropagation()}
      >
        <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
          {t("overview.adjust_balance.title")}
        </h3>

        <div className="space-y-4">
          <div className="rounded-[var(--radius-lg)] bg-[var(--surface)] p-4 border border-[var(--border)]">
            <p className="text-xs text-[var(--text-tertiary)]">
              {account.name}
            </p>
            <p className="text-sm font-semibold text-[var(--text-primary)] mt-1">
              {t("overview.adjust_balance.current_balance_hint", {
                amount: `${formatMoney(account.currentBalanceMinor)} ₫`,
              })}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
              {t("overview.adjust_balance.actual_balance_label")}
            </label>
            <input
              type="number"
              value={actualBalance}
              onChange={(event) => setActualBalance(event.target.value)}
              className="w-full px-4 py-3 bg-[var(--input-background)] border border-[var(--border)] rounded-[var(--radius-lg)]"
              placeholder={t(
                "overview.adjust_balance.actual_balance_placeholder",
              )}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
              {t("overview.adjust_balance.reason_label")}
            </label>
            <select
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              className="w-full px-4 py-3 bg-[var(--input-background)] border border-[var(--border)] rounded-[var(--radius-lg)]"
            >
              <option value="">
                {t("overview.adjust_balance.reason_default")}
              </option>
              <option value="data-entry">
                {t("overview.adjust_balance.reason_options.data_entry")}
              </option>
              <option value="forgot-txn">
                {t("overview.adjust_balance.reason_options.forgot_txn")}
              </option>
              <option value="bank-fees">
                {t("overview.adjust_balance.reason_options.bank_fees")}
              </option>
              <option value="other">
                {t("overview.adjust_balance.reason_options.other")}
              </option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
              {t("overview.adjust_balance.note_label")}
            </label>
            <input
              type="text"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              className="w-full px-4 py-3 bg-[var(--input-background)] border border-[var(--border)] rounded-[var(--radius-lg)]"
              placeholder={t("overview.adjust_balance.reason_placeholder")}
            />
          </div>
        </div>

        {actualBalance && (
          <div
            className={`mt-4 p-3 rounded-[var(--radius-lg)] ${
              difference > 0
                ? "bg-[var(--success-light)]"
                : difference < 0
                  ? "bg-[var(--danger-light)]"
                  : "bg-[var(--surface)]"
            }`}
          >
            <p className="text-sm text-[var(--text-secondary)]">
              {t("overview.adjust_balance.difference")}:{" "}
              <span
                className={
                  difference >= 0
                    ? "text-[var(--success)] font-semibold"
                    : "text-[var(--danger)] font-semibold"
                }
              >
                {difference >= 0 ? "+" : "-"}
                {formatMoney(Math.abs(difference))} ₫
              </span>
            </p>
          </div>
        )}

        <div className="flex gap-3 mt-6">
          <Button
            variant="secondary"
            className="flex-1"
            onClick={onClose}
            disabled={pending}
          >
            {t("overview.adjust_balance.cancel_button")}
          </Button>
          <Button
            className="flex-1"
            disabled={!actualBalance || difference === 0 || pending}
            onClick={() =>
              onSubmit({
                actualBalanceMinor: actualValue,
                reason: reason || undefined,
                note: note || undefined,
              })
            }
          >
            {pending
              ? t("overview.adjust_balance.processing")
              : t("overview.adjust_balance.confirm_button")}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function AccountDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const nav = useAppNavigation();
  const toast = useToast();
  const { t } = useTranslation("accounts");
  const { data, loading, error, reload } = useAccountDetail(id);

  const [showMenu, setShowMenu] = useState(false);
  const [showNumber, setShowNumber] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showReconcile, setShowReconcile] = useState(false);
  const [pendingAction, setPendingAction] = useState(false);
  const [activeTab, setActiveTab] = useState<"transactions" | "insights">(
    "transactions",
  );

  const chartData = useMemo(() => {
    return (data?.balanceSeries || []).map((item) => ({
      date: formatShortDate(item.date),
      balance: Number(item.balanceMinor || 0),
    }));
  }, [data?.balanceSeries]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--background)] p-4 md:p-6">
        <Card>
          <p className="text-sm text-[var(--text-secondary)]">
            {t("detail.loading")}
          </p>
        </Card>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[var(--background)] p-4 md:p-6">
        <Card>
          <p className="text-sm text-[var(--danger)]">
            {error || t("detail.load_failed")}
          </p>
        </Card>
      </div>
    );
  }

  const account = data.account;
  const Icon = getAccountIcon(account.accountType);
  const canDelete =
    account.transactionCount === 0 && account.reconciliationCount === 0;

  const handleDelete = async () => {
    try {
      setPendingAction(true);
      await accountsService.deleteAccount(account.id);
      toast.success(t("overview.delete_modal.success"));
      navigate("/accounts", { replace: true });
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : t("overview.delete_modal.failed"),
      );
    } finally {
      setPendingAction(false);
      setShowDeleteModal(false);
    }
  };

  const handleReconcile = async (payload: {
    actualBalanceMinor: number;
    reason?: string;
    note?: string;
  }) => {
    try {
      setPendingAction(true);
      await accountsService.reconcileAccount(account.id, payload);
      toast.success(t("overview.adjust_balance.success"));
      setShowReconcile(false);
      await reload();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : t("overview.adjust_balance.failed"),
      );
    } finally {
      setPendingAction(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6 pb-20 md:pb-6">
        <div>
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">{t("detail.back")}</span>
          </button>

          <Card>
            <div className="flex items-start justify-between gap-4 mb-6">
              <div className="flex items-start gap-3 flex-1">
                <div className="p-3 rounded-[var(--radius-lg)] bg-[var(--primary-light)] text-[var(--primary)]">
                  <Icon className="w-6 h-6" />
                </div>

                <div className="min-w-0">
                  <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
                    {account.name}
                  </h1>
                  <p className="text-sm text-[var(--text-tertiary)] mt-1">
                    {account.providerName ||
                      getAccountTypeLabel(account.accountType)}
                  </p>
                  <p className="text-3xl font-bold text-[var(--primary)] tabular-nums mt-4">
                    {formatMoney(data.stats.currentBalanceMinor)} ₫
                  </p>
                  <p className="text-sm text-[var(--text-secondary)] mt-1">
                    {t("detail.fields.current_balance")}
                  </p>
                </div>
              </div>

              <div className="relative">
                <button
                  onClick={() => setShowMenu((prev) => !prev)}
                  className="p-2 rounded-[var(--radius-md)] hover:bg-[var(--surface)] transition-colors"
                >
                  <MoreVertical className="w-5 h-5 text-[var(--text-secondary)]" />
                </button>

                {showMenu && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-[var(--surface-elevated)] border border-[var(--border)] rounded-[var(--radius-lg)] shadow-[var(--shadow-lg)] overflow-hidden z-20">
                    <button
                      onClick={() => navigate(`/accounts/${account.id}/edit`)}
                      className="w-full flex items-center gap-3 px-4 py-3 text-[var(--text-primary)] hover:bg-[var(--surface)] transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                      <span className="text-sm font-medium">
                        {t("detail.actions.edit")}
                      </span>
                    </button>

                    <button
                      onClick={() => {
                        setShowMenu(false);
                        if (!canDelete) {
                          toast.error(t("detail.cannot_delete"));
                          return;
                        }
                        setShowDeleteModal(true);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-[var(--danger)] hover:bg-[var(--danger-light)] transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span className="text-sm font-medium">
                        {t("detail.actions.delete")}
                      </span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="h-40 mb-6 bg-[var(--surface)] rounded-[var(--radius-lg)] border border-[var(--border)] p-3">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <XAxis
                    dataKey="date"
                    stroke="var(--text-tertiary)"
                    fontSize={12}
                  />
                  <YAxis hide domain={[0, "auto"]} />
                  <Tooltip
                    formatter={(value) => `${formatMoney(value as number)} ₫`}
                  />
                  <Line
                    type="monotone"
                    dataKey="balance"
                    stroke="var(--primary)"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button
                variant="secondary"
                onClick={() => setShowReconcile(true)}
              >
                <Wrench className="w-4 h-4" />
                {t("detail.actions.adjust_balance")}
              </Button>

              <Button
                variant="secondary"
                onClick={() =>
                  nav.goTo(`/transfer/create?fromAccountId=${account.id}`)
                }
              >
                <ArrowRightLeft className="w-4 h-4" />
                {t("detail.actions.transfer")}
              </Button>

              <Button onClick={() => nav.goCreateTransaction(account.id)}>
                <Plus className="w-4 h-4" />
                {t("detail.actions.add_transaction")}
              </Button>
            </div>
          </Card>
        </div>

        <Card>
          <h3 className="font-semibold text-[var(--text-primary)] mb-4">
            {t("detail.info_section")}
          </h3>
          <div className="space-y-3">
            <InfoRow
              label={t("detail.fields.account_type")}
              value={
                account.accountTypeLabel ||
                getAccountTypeLabel(account.accountType)
              }
            />

            {account.accountNumber && (
              <div className="flex items-center justify-between py-2 border-b border-[var(--divider)]">
                <span className="text-sm text-[var(--text-secondary)]">
                  {t("detail.fields.account_number")}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-[var(--text-primary)] tabular-nums">
                    {showNumber
                      ? account.accountNumber
                      : maskAccountNumber(
                          account.accountNumber,
                          account.accountType,
                        )}
                  </span>
                  <button
                    onClick={() => setShowNumber((prev) => !prev)}
                    className="p-1 rounded-[var(--radius-sm)] hover:bg-[var(--surface)]"
                  >
                    {showNumber ? (
                      <EyeOff className="w-4 h-4 text-[var(--text-tertiary)]" />
                    ) : (
                      <Eye className="w-4 h-4 text-[var(--text-tertiary)]" />
                    )}
                  </button>
                </div>
              </div>
            )}

            {account.accountOwnerName && (
              <InfoRow
                label={t("detail.fields.account_owner")}
                value={account.accountOwnerName}
              />
            )}

            {account.providerName && (
              <InfoRow
                label={t("detail.fields.institution")}
                value={account.providerName}
              />
            )}

            <InfoRow
              label={t("detail.fields.currency")}
              value={account.currencyCode}
            />
            <InfoRow
              label={t("detail.fields.opening_balance")}
              value={`${formatMoney(data.stats.openingBalanceMinor)} ₫`}
            />
            <InfoRow
              label={t("detail.fields.last_updated")}
              value={formatDateTime(account.updatedAt)}
            />
          </div>
        </Card>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Card>
            <p className="text-sm text-[var(--text-secondary)] mb-1">
              {t("detail.stats.total_income")}
            </p>
            <p className="text-xl font-semibold text-[var(--success)] tabular-nums">
              +{formatMoney(data.stats.incomeMinor)} ₫
            </p>
          </Card>

          <Card>
            <p className="text-sm text-[var(--text-secondary)] mb-1">
              {t("detail.stats.total_expense")}
            </p>
            <p className="text-xl font-semibold text-[var(--danger)] tabular-nums">
              -{formatMoney(data.stats.expenseMinor)} ₫
            </p>
          </Card>

          <Card className="col-span-2 md:col-span-1">
            <p className="text-sm text-[var(--text-secondary)] mb-1">
              {t("detail.stats.transactions")}
            </p>
            <p className="text-xl font-semibold text-[var(--text-primary)] tabular-nums">
              {data.stats.transactionCount}
            </p>
          </Card>
        </div>

        <div className="border-b border-[var(--divider)]">
          <div className="flex gap-8">
            <button
              onClick={() => setActiveTab("transactions")}
              className={`pb-3 font-medium transition-colors relative ${
                activeTab === "transactions"
                  ? "text-[var(--primary)]"
                  : "text-[var(--text-secondary)]"
              }`}
            >
              {t("detail.tabs.transactions")}
              {activeTab === "transactions" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--primary)]" />
              )}
            </button>

            <button
              onClick={() => setActiveTab("insights")}
              className={`pb-3 font-medium transition-colors relative ${
                activeTab === "insights"
                  ? "text-[var(--primary)]"
                  : "text-[var(--text-secondary)]"
              }`}
            >
              {t("detail.tabs.insights")}
              {activeTab === "insights" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--primary)]" />
              )}
            </button>
          </div>
        </div>

        {activeTab === "transactions" ? (
          <Card>
            <div className="flex items-center justify-between gap-3 mb-4">
              <h4 className="font-medium text-[var(--text-primary)]">
                {t("detail.recent_transactions")}
              </h4>

              <button
                onClick={() => nav.goTransactionsByAccount(account.id)}
                className="text-sm font-medium text-[var(--primary)] hover:underline"
              >
                {t("detail.actions.view_all")}
              </button>
            </div>

            {data.recentTransactions.length === 0 ? (
              <p className="text-sm text-[var(--text-secondary)] text-center py-8">
                {t("detail.empty_transactions")}
              </p>
            ) : (
              <div className="space-y-2">
                {data.recentTransactions.map((transaction) => {
                  const signedAmount = Number(
                    transaction.signedAmountMinor || 0,
                  );
                  const isPositive = signedAmount >= 0;

                  return (
                    <button
                      key={transaction.id}
                      onClick={() => nav.goTransactionDetail(transaction.id)}
                      className="w-full flex items-start justify-between gap-4 p-3 rounded-[var(--radius-lg)] hover:bg-[var(--surface)] transition-colors text-left"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-[var(--text-primary)] truncate">
                          {transaction.description ||
                            transaction.category?.name ||
                            t("detail.transaction_fallback")}
                        </p>

                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          <span className="text-xs text-[var(--text-tertiary)]">
                            {formatDateTime(transaction.occurredAt)}
                          </span>

                          {transaction.category?.id && (
                            <button
                              onClick={(event) => {
                                event.stopPropagation();
                                nav.goTransactionsByCategory(
                                  transaction.category!.id,
                                );
                              }}
                              className="text-xs text-[var(--primary)] hover:underline"
                            >
                              {transaction.category.name}
                            </button>
                          )}

                          {transaction.merchant?.id && (
                            <button
                              onClick={(event) => {
                                event.stopPropagation();
                                nav.goTransactionsByMerchant(
                                  transaction.merchant!.id,
                                );
                              }}
                              className="text-xs text-[var(--primary)] hover:underline"
                            >
                              {transaction.merchant.name}
                            </button>
                          )}
                        </div>

                        {transaction.tags?.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {transaction.tags.map((tag) => (
                              <button
                                key={tag.id}
                                onClick={(event) => {
                                  event.stopPropagation();
                                  nav.goTransactionsByTag(tag.id);
                                }}
                                className="rounded-[var(--radius-md)]"
                              >
                                <TagChip
                                  name={tag.name}
                                  color={tag.colorHex || "#64748b"}
                                  className="hover:scale-[1.02] transition-transform"
                                />
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      <span
                        className={`font-semibold tabular-nums ${
                          isPositive
                            ? "text-[var(--success)]"
                            : "text-[var(--danger)]"
                        }`}
                      >
                        {isPositive ? "+" : "-"}
                        {formatMoney(Math.abs(signedAmount))} ₫
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </Card>
        ) : (
          <div className="space-y-4">
            <Card>
              <h4 className="font-medium text-[var(--text-primary)] mb-2">
                {t("detail.balance_growth")}
              </h4>
              <p className="text-sm text-[var(--text-secondary)]">
                {Number(data.stats.netMinor) >= 0
                  ? t("detail.balance_growth_positive", {
                      balance: formatMoney(data.stats.currentBalanceMinor),
                      amount: formatMoney(
                        Math.abs(Number(data.stats.netMinor)),
                      ),
                    })
                  : t("detail.balance_growth_negative", {
                      balance: formatMoney(data.stats.currentBalanceMinor),
                      amount: formatMoney(
                        Math.abs(Number(data.stats.netMinor)),
                      ),
                    })}
              </p>
            </Card>

            <Card>
              <h4 className="font-medium text-[var(--text-primary)] mb-2">
                {t("detail.usage_section")}
              </h4>
              <p className="text-sm text-[var(--text-secondary)]">
                {t("detail.usage_description", {
                  txnCount: data.stats.transactionCount,
                  reconcileCount: account.reconciliationCount,
                })}
              </p>
            </Card>
          </div>
        )}
      </div>

      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={() => void handleDelete()}
        title={t("overview.delete_modal.title")}
        description={t("overview.delete_modal.description", {
          name: account.name,
        })}
        confirmLabel={t("overview.delete_modal.confirm")}
        cancelLabel={t("overview.delete_modal.cancel")}
        isDangerous
      />

      {showReconcile && (
        <ReconcileModal
          account={account}
          pending={pendingAction}
          onClose={() => setShowReconcile(false)}
          onSubmit={handleReconcile}
        />
      )}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-[var(--divider)]">
      <span className="text-sm text-[var(--text-secondary)]">{label}</span>
      <span className="text-sm font-medium text-[var(--text-primary)] text-right">
        {value}
      </span>
    </div>
  );
}

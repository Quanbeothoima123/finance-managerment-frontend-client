import React from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Building2,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Plus,
  Receipt,
  Wallet,
} from "lucide-react";
import { useNavigate } from "react-router";
import { Card } from "../components/Card";
import { useAccountsOverview } from "../hooks/useAccountsOverview";
import {
  getAccountSubtitle,
  normalizeFrontendAccountType,
} from "../utils/accountHelpers";

function formatMoney(value?: string | number | null) {
  return new Intl.NumberFormat("vi-VN").format(Number(value || 0));
}

function formatMonthLabel(value: string) {
  const [year, month] = value.split("-").map(Number);
  return new Intl.DateTimeFormat("vi-VN", {
    month: "long",
    year: "numeric",
  }).format(new Date(year, month - 1, 1));
}

function addMonth(month: string, delta: number) {
  const [year, monthNumber] = month.split("-").map(Number);
  const next = new Date(year, monthNumber - 1 + delta, 1);
  return `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}`;
}

function getAccountIcon(type: string) {
  switch (normalizeFrontendAccountType(type)) {
    case "bank":
      return Building2;
    default:
      return Wallet;
  }
}

function getSignedAmount(txnType: string, signedAmountMinor: string) {
  const value = Number(signedAmountMinor || 0);
  if (txnType === "expense") return -Math.abs(value);
  if (txnType === "income") return Math.abs(value);
  return value;
}

export default function Home() {
  const navigate = useNavigate();
  const { data, loading, error, month, setMonth } = useAccountsOverview();

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--background)] p-4 md:p-6">
        <Card>
          <p className="text-sm text-[var(--text-secondary)]">
            Đang tải trang chủ...
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
            {error || "Không thể tải trang chủ"}
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6 pb-20 md:pb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMonth(addMonth(month, -1))}
              className="p-2 rounded-[var(--radius-lg)] hover:bg-[var(--surface)] transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-[var(--text-secondary)]" />
            </button>

            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[var(--primary)]" />
              <h2 className="text-xl font-semibold text-[var(--text-primary)] capitalize">
                {formatMonthLabel(month)}
              </h2>
            </div>

            <button
              onClick={() => setMonth(addMonth(month, 1))}
              className="p-2 rounded-[var(--radius-lg)] hover:bg-[var(--surface)] transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-[var(--text-secondary)]" />
            </button>
          </div>

          <button
            onClick={() => navigate("/transactions/create")}
            className="flex items-center gap-2 px-4 py-2.5 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white rounded-[var(--radius-lg)] transition-colors shadow-[var(--shadow-sm)]"
          >
            <Plus className="w-5 h-5" />
            <span className="font-medium">Thêm giao dịch</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card
            className="cursor-pointer"
            onClick={() => navigate("/accounts")}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-[var(--primary-light)] flex items-center justify-center text-[var(--primary)]">
                <Wallet className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm text-[var(--text-secondary)]">
                  Tổng tài sản
                </p>
                <p className="text-2xl font-bold text-[var(--text-primary)] tabular-nums">
                  {formatMoney(data.summary.totalBalanceMinor)} ₫
                </p>
              </div>
            </div>
            <p className="text-xs text-[var(--text-tertiary)]">
              {data.summary.activeAccountCount} tài khoản đang hoạt động
            </p>
          </Card>

          <Card
            className="cursor-pointer"
            onClick={() => navigate("/transactions?type=income")}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-[var(--success-light)] flex items-center justify-center text-[var(--success)]">
                <ArrowDownLeft className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm text-[var(--text-secondary)]">Thu</p>
                <p className="text-2xl font-bold text-[var(--success)] tabular-nums">
                  {formatMoney(data.summary.incomeMinor)} ₫
                </p>
              </div>
            </div>
            <p className="text-xs text-[var(--text-tertiary)]">
              Tổng thu trong tháng
            </p>
          </Card>

          <Card
            className="cursor-pointer"
            onClick={() => navigate("/transactions?type=expense")}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-[var(--danger-light)] flex items-center justify-center text-[var(--danger)]">
                <ArrowUpRight className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm text-[var(--text-secondary)]">Chi</p>
                <p className="text-2xl font-bold text-[var(--danger)] tabular-nums">
                  {formatMoney(data.summary.expenseMinor)} ₫
                </p>
              </div>
            </div>
            <p className="text-xs text-[var(--text-tertiary)]">
              Tổng chi trong tháng
            </p>
          </Card>
        </div>

        <Card>
          <h3 className="font-semibold text-[var(--text-primary)] mb-4">
            Phân bổ theo loại tài khoản
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {data.groupedBalances.map((group) => (
              <div
                key={group.type}
                className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--background)] p-4"
              >
                <p className="text-sm text-[var(--text-secondary)]">
                  {group.label}
                </p>
                <p className="text-xl font-semibold text-[var(--text-primary)] mt-1 tabular-nums">
                  {formatMoney(group.totalBalanceMinor)} ₫
                </p>
                <p className="text-xs text-[var(--text-tertiary)] mt-1">
                  {group.count} tài khoản
                </p>
              </div>
            ))}
          </div>
        </Card>

        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-[var(--text-primary)]">
              Tài khoản
            </h3>
            <button
              onClick={() => navigate("/accounts")}
              className="text-sm font-medium text-[var(--primary)] hover:underline"
            >
              Xem tất cả
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {data.accounts
              .filter((account) => account.status === "active")
              .slice(0, 6)
              .map((account) => {
                const Icon = getAccountIcon(account.accountType);
                return (
                  <Card
                    key={account.id}
                    className="cursor-pointer hover:shadow-[var(--shadow-lg)] transition-shadow"
                    onClick={() => navigate(`/accounts/${account.id}`)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-[var(--primary-light)] flex items-center justify-center text-[var(--primary)]">
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-[var(--text-primary)] truncate">
                          {account.name}
                        </p>
                        <p className="text-xs text-[var(--text-tertiary)] mt-1 truncate">
                          {getAccountSubtitle({
                            providerName: account.providerName,
                            accountNumber: account.accountNumber,
                            accountType: account.accountType,
                          }) || account.accountTypeLabel}
                        </p>
                        <p className="text-base font-semibold text-[var(--success)] mt-2 tabular-nums">
                          {formatMoney(account.currentBalanceMinor)} ₫
                        </p>
                      </div>
                    </div>
                  </Card>
                );
              })}
          </div>
        </div>

        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-[var(--text-primary)]">
              Giao dịch gần đây
            </h3>
            <button
              onClick={() => navigate("/transactions")}
              className="text-sm font-medium text-[var(--primary)] hover:underline"
            >
              Xem tất cả
            </button>
          </div>

          {data.recentTransactions.length === 0 ? (
            <div className="text-center py-8">
              <Receipt className="w-10 h-10 text-[var(--text-tertiary)] mx-auto mb-3" />
              <p className="text-sm text-[var(--text-secondary)]">
                Chưa có giao dịch nào trong tháng này.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {data.recentTransactions.map((transaction) => {
                const signedAmount = getSignedAmount(
                  transaction.txnType,
                  transaction.signedAmountMinor,
                );
                const isPositive = signedAmount >= 0;

                return (
                  <button
                    key={transaction.id}
                    onClick={() => navigate(`/transactions/${transaction.id}`)}
                    className="w-full flex items-center justify-between gap-4 p-3 rounded-[var(--radius-lg)] hover:bg-[var(--surface)] transition-colors text-left"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-[var(--text-primary)] truncate">
                        {transaction.description ||
                          transaction.category?.name ||
                          "Giao dịch"}
                      </p>
                      <p className="text-xs text-[var(--text-tertiary)] mt-1 truncate">
                        {[
                          transaction.account?.name,
                          transaction.category?.name,
                          transaction.merchant?.name,
                        ]
                          .filter(Boolean)
                          .join(" • ")}
                      </p>
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
      </div>
    </div>
  );
}

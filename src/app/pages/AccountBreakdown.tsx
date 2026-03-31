import React, { useState, useMemo } from "react";
import {
  ArrowLeft,
  Wallet,
  TrendingUp,
  TrendingDown,
  ChevronDown,
  Loader2,
} from "lucide-react";
import { Card } from "../components/Card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { useAppNavigation } from "../hooks/useAppNavigation";
import { useAccountsOverview } from "../hooks/useAccountsOverview";
import { useTransactionsList } from "../hooks/useTransactionsList";

const ACCOUNT_TYPE_COLORS: Record<string, string> = {
  bank: "#3b82f6",
  cash: "#10b981",
  credit_card: "#ef4444",
  e_wallet: "#06b6d4",
  investment: "#f59e0b",
  savings: "#8b5cf6",
};

const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  bank: "Ngân hàng",
  cash: "Tiền mặt",
  credit_card: "Tín dụng",
  e_wallet: "Ví điện tử",
  investment: "Đầu tư",
  savings: "Tiết kiệm",
};

const dateRangeOptions = [
  { id: "this-month", name: "Tháng này" },
  { id: "last-month", name: "Tháng trước" },
  { id: "last-3-months", name: "3 tháng qua" },
  { id: "last-6-months", name: "6 tháng qua" },
  { id: "this-year", name: "Năm nay" },
];

interface AccountDisplayData {
  id: string;
  name: string;
  type: string;
  currentBalance: number;
  change: number;
  changePercent: number;
  color: string;
}

interface AccountItemProps {
  account: AccountDisplayData;
}

function AccountItem({ account }: AccountItemProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN").format(amount);
  };

  return (
    <div className="flex items-center gap-4 py-4 border-b border-[var(--divider)] last:border-0">
      <div className="flex items-center gap-3 flex-1">
        <div
          className="w-12 h-12 rounded-[var(--radius-lg)] flex items-center justify-center"
          style={{ backgroundColor: `${account.color}20` }}
        >
          <Wallet className="w-6 h-6" style={{ color: account.color }} />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-[var(--text-primary)]">
            {account.name}
          </p>
          <p className="text-xs text-[var(--text-secondary)]">
            {ACCOUNT_TYPE_LABELS[account.type] || account.type}
          </p>
        </div>
      </div>

      <div className="text-right">
        <p className="text-sm font-semibold text-[var(--text-primary)] tabular-nums mb-1">
          {formatCurrency(account.currentBalance)}₫
        </p>
        <div className="flex items-center justify-end gap-1">
          {account.change >= 0 ? (
            <TrendingUp className="w-3.5 h-3.5 text-[var(--success)]" />
          ) : (
            <TrendingDown className="w-3.5 h-3.5 text-[var(--danger)]" />
          )}
          <span
            className={`text-xs font-medium tabular-nums ${
              account.change >= 0
                ? "text-[var(--success)]"
                : "text-[var(--danger)]"
            }`}
          >
            {account.change >= 0 ? "+" : ""}
            {formatCurrency(account.change)}₫ (
            {account.changePercent >= 0 ? "+" : ""}
            {account.changePercent.toFixed(2)}%)
          </span>
        </div>
      </div>
    </div>
  );
}

export default function AccountBreakdown() {
  const [dateRange, setDateRange] = useState("this-month");
  const nav = useAppNavigation();

  // ── Data fetching ──
  const { data: accData, loading: accLoading } = useAccountsOverview();
  const accounts =
    accData?.accounts?.filter((a) => a.status === "active") ?? [];

  const minor = (s: string | null | undefined) => parseInt(s || "0", 10) || 0;
  const pad = (n: number) => String(n).padStart(2, "0");

  const handleBack = () => {
    nav.goBack();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN").format(amount);
  };

  // Get date range bounds
  const dateRangeBounds = useMemo(() => {
    const now = new Date();
    let start: Date;
    switch (dateRange) {
      case "last-month":
        start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        return { start, end: new Date(now.getFullYear(), now.getMonth(), 0) };
      case "last-3-months":
        start = new Date(now.getFullYear(), now.getMonth() - 3, 1);
        return { start, end: now };
      case "last-6-months":
        start = new Date(now.getFullYear(), now.getMonth() - 6, 1);
        return { start, end: now };
      case "this-year":
        start = new Date(now.getFullYear(), 0, 1);
        return { start, end: now };
      case "this-month":
      default:
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        return { start, end: now };
    }
  }, [dateRange]);

  // Fetch transactions for the date range
  const txnQuery = useMemo(
    () => ({
      startDate: `${dateRangeBounds.start.getFullYear()}-${pad(dateRangeBounds.start.getMonth() + 1)}-${pad(dateRangeBounds.start.getDate())}`,
      endDate: `${dateRangeBounds.end.getFullYear()}-${pad(dateRangeBounds.end.getMonth() + 1)}-${pad(dateRangeBounds.end.getDate())}`,
      limit: 100,
      sortBy: "date" as const,
      sortOrder: "desc" as const,
    }),
    [dateRangeBounds],
  );
  const { data: txnData, loading: txnLoading } = useTransactionsList(txnQuery);
  const transactions = txnData?.items ?? [];

  // Compute account data with change from transactions
  const accountData: AccountDisplayData[] = useMemo(() => {
    return accounts.map((acc) => {
      const netFlow = transactions
        .filter((t) => t.account?.id === acc.id)
        .reduce((sum, t) => sum + minor(t.signedAmountMinor), 0);

      const currentBalance = minor(acc.currentBalanceMinor);
      const previousBalance = currentBalance - netFlow;
      const changePercent =
        previousBalance !== 0 ? (netFlow / Math.abs(previousBalance)) * 100 : 0;

      return {
        id: acc.id,
        name: acc.name,
        type: acc.accountType,
        currentBalance,
        change: netFlow,
        changePercent,
        color:
          acc.colorHex || ACCOUNT_TYPE_COLORS[acc.accountType] || "#6b7280",
      };
    });
  }, [accounts, transactions]);

  const totalCurrentBalance = accountData.reduce(
    (sum, acc) => sum + acc.currentBalance,
    0,
  );
  const totalChange = accountData.reduce((sum, acc) => sum + acc.change, 0);
  const totalPreviousBalance = totalCurrentBalance - totalChange;
  const totalChangePercent =
    totalPreviousBalance !== 0
      ? (totalChange / Math.abs(totalPreviousBalance)) * 100
      : 0;

  const accountsWithGrowth = accountData.filter((acc) => acc.change > 0).length;
  const accountsWithDecline = accountData.filter(
    (acc) => acc.change < 0,
  ).length;

  const chartData = [...accountData].sort(
    (a, b) => b.currentBalance - a.currentBalance,
  );

  // Group accounts by type for distribution
  const typeGroups = useMemo(() => {
    const typeSet = new Set(accountData.map((a) => a.type));
    return [...typeSet]
      .map((type) => {
        const accs = accountData.filter((a) => a.type === type);
        const totalBalance = accs.reduce((s, a) => s + a.currentBalance, 0);
        return {
          type,
          label: ACCOUNT_TYPE_LABELS[type] || type,
          accounts: accs,
          color: ACCOUNT_TYPE_COLORS[type] || "#6b7280",
          totalBalance,
          percentage:
            totalCurrentBalance > 0
              ? (totalBalance / totalCurrentBalance) * 100
              : 0,
        };
      })
      .sort((a, b) => b.totalBalance - a.totalBalance);
  }, [accountData, totalCurrentBalance]);

  if (accLoading || txnLoading) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[var(--primary)] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="max-w-6xl mx-auto p-4 md:p-6 pb-20 md:pb-6 space-y-6">
        {/* Header */}
        <div>
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Quay lại</span>
          </button>

          <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
            Phân tích tài khoản
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            So sánh số dư và biến động của các tài khoản
          </p>
        </div>

        {/* Filters */}
        <Card>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                Khoảng thời gian
              </label>
              <div className="relative">
                <select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[var(--input-background)] border border-[var(--border)] rounded-[var(--radius-lg)] text-[var(--text-primary)] appearance-none cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]"
                >
                  {dateRangeOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-secondary)] pointer-events-none" />
              </div>
            </div>
          </div>
        </Card>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <p className="text-sm text-[var(--text-secondary)] mb-2">
              Tổng số dư hiện tại
            </p>
            <p className="text-2xl font-bold text-[var(--text-primary)] tabular-nums">
              {formatCurrency(totalCurrentBalance)}₫
            </p>
          </Card>

          <Card>
            <p className="text-sm text-[var(--text-secondary)] mb-2">
              Thay đổi
            </p>
            <p
              className={`text-2xl font-bold tabular-nums ${
                totalChange >= 0
                  ? "text-[var(--success)]"
                  : "text-[var(--danger)]"
              }`}
            >
              {totalChange >= 0 ? "+" : ""}
              {formatCurrency(totalChange)}₫
            </p>
            <p
              className={`text-xs mt-1 ${
                totalChange >= 0
                  ? "text-[var(--success)]"
                  : "text-[var(--danger)]"
              }`}
            >
              {totalChange >= 0 ? "+" : ""}
              {totalChangePercent.toFixed(2)}%
            </p>
          </Card>

          <Card>
            <p className="text-sm text-[var(--text-secondary)] mb-2">
              Số tài khoản
            </p>
            <p className="text-2xl font-bold text-[var(--text-primary)] tabular-nums">
              {accountData.length}
            </p>
            <p className="text-xs text-[var(--text-secondary)] mt-1">
              {accountsWithGrowth} tăng, {accountsWithDecline} giảm
            </p>
          </Card>
        </div>

        {/* Chart */}
        <Card>
          <div className="mb-4">
            <h3 className="font-semibold text-[var(--text-primary)]">
              So sánh số dư
            </h3>
            <p className="text-sm text-[var(--text-secondary)] mt-1">
              Phân bổ số dư giữa các tài khoản
            </p>
          </div>

          {chartData.length > 0 ? (
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical">
                  <XAxis
                    type="number"
                    tick={{ fill: "var(--text-tertiary)", fontSize: 12 }}
                    tickLine={false}
                    axisLine={{ stroke: "var(--divider)" }}
                    tickFormatter={(value) =>
                      `${(value / 1000000).toFixed(0)}M`
                    }
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fill: "var(--text-tertiary)", fontSize: 12 }}
                    tickLine={false}
                    axisLine={{ stroke: "var(--divider)" }}
                    width={120}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--card)",
                      border: "1px solid var(--border)",
                      borderRadius: "var(--radius-lg)",
                      fontSize: "12px",
                    }}
                    formatter={(value: number) => [
                      `${formatCurrency(value)}₫`,
                      "Số dư",
                    ]}
                  />
                  <Bar dataKey="currentBalance" radius={[0, 8, 8, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-96 flex items-center justify-center">
              <p className="text-sm text-[var(--text-tertiary)]">
                Chưa có tài khoản nào
              </p>
            </div>
          )}
        </Card>

        {/* Account List */}
        <Card>
          <h3 className="font-semibold text-[var(--text-primary)] mb-4">
            Chi tiết tài khoản ({accountData.length})
          </h3>
          <div className="space-y-0">
            {accountData
              .sort((a, b) => b.currentBalance - a.currentBalance)
              .map((account) => (
                <AccountItem key={account.id} account={account} />
              ))}
          </div>
        </Card>

        {/* Insights */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {totalChange >= 0 && (
            <Card className="bg-[var(--success-light)] border-[var(--success)]">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-[var(--success)] rounded-full flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-[var(--text-primary)] mb-1">
                    Tăng trưởng tốt
                  </h4>
                  <p className="text-sm text-[var(--text-secondary)]">
                    Tổng số dư của bạn đã tăng{" "}
                    <span className="font-semibold text-[var(--text-primary)]">
                      {formatCurrency(totalChange)}₫
                    </span>{" "}
                    trong kỳ này. Tiếp tục duy trì!
                  </p>
                </div>
              </div>
            </Card>
          )}

          {accountsWithDecline > 0 && (
            <Card className="bg-[var(--warning-light)] border-[var(--warning)]">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-[var(--warning)] rounded-full flex items-center justify-center flex-shrink-0">
                  <TrendingDown className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-[var(--text-primary)] mb-1">
                    Lưu ý
                  </h4>
                  <p className="text-sm text-[var(--text-secondary)]">
                    Có {accountsWithDecline} tài khoản đang giảm số dư. Hãy kiểm
                    tra để đảm bảo tài chính ổn định.
                  </p>
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Distribution Breakdown */}
        <Card>
          <h3 className="font-semibold text-[var(--text-primary)] mb-4">
            Phân bổ theo loại
          </h3>
          <div className="space-y-4">
            {typeGroups.map((group) => (
              <div key={group.type}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: group.color }}
                    />
                    <span className="text-sm font-medium text-[var(--text-primary)]">
                      {group.label}
                    </span>
                    <span className="text-xs text-[var(--text-secondary)]">
                      ({group.accounts.length} tài khoản)
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-semibold text-[var(--text-primary)] tabular-nums">
                      {formatCurrency(group.totalBalance)}₫
                    </span>
                    <span className="text-xs text-[var(--text-secondary)] ml-2 tabular-nums">
                      {group.percentage.toFixed(1)}%
                    </span>
                  </div>
                </div>
                <div className="h-2 bg-[var(--surface)] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${group.percentage}%`,
                      backgroundColor: group.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

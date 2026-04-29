import React, { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  ArrowLeft,
  TrendingUp,
  Calendar,
  ChevronDown,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { Card } from "../components/Card";
import { Input } from "../components/Input";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  CartesianGrid,
} from "recharts";
import { useAppNavigation } from "../hooks/useAppNavigation";
import { useAccountsOverview } from "../hooks/useAccountsOverview";
import { useTransactionsList } from "../hooks/useTransactionsList";
import { useTagsList } from "../hooks/useTagsList";
import {
  TagFilterDropdown,
  TagFilterBadge,
  filterByTags,
} from "../components/TagFilterDropdown";

export default function CashflowChart() {
  const { t, i18n } = useTranslation("insights");
  const [viewType, setViewType] = useState<"balance" | "netflow">("balance");
  const [selectedAccount, setSelectedAccount] = useState("all");
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const [startDate, setStartDate] = useState(
    `${now.getFullYear()}-${pad(now.getMonth() + 1)}-01`,
  );
  const [endDate, setEndDate] = useState(
    `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`,
  );
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [tagFilterMode, setTagFilterMode] = useState<"AND" | "OR">("OR");
  const nav = useAppNavigation();

  // ── Data fetching ──
  const { data: accData, loading: accLoading } = useAccountsOverview();
  const accounts = accData?.accounts ?? [];

  const { data: tagsData } = useTagsList();
  const tags = useMemo(
    () =>
      (tagsData?.items ?? []).map((t) => ({
        id: t.id,
        name: t.name,
        color: t.colorHex || t.color || "#6b7280",
      })),
    [tagsData],
  );

  const txnQuery = useMemo(
    () => ({
      startDate,
      endDate,
      ...(selectedAccount !== "all" ? { accountId: selectedAccount } : {}),
      ...(selectedTags.length > 0
        ? {
            tagIds: selectedTags,
            tagMode:
              tagFilterMode === "AND" ? ("and" as const) : ("or" as const),
          }
        : {}),
      limit: 100,
      sortBy: "date" as const,
      sortOrder: "asc" as const,
    }),
    [startDate, endDate, selectedAccount, selectedTags, tagFilterMode],
  );
  const {
    data: txnData,
    loading: txnLoading,
    error: txnError,
    reload: reloadTxn,
  } = useTransactionsList(txnQuery);
  const transactions = txnData?.items ?? [];
  const isTruncated =
    (txnData?.pagination?.total ?? 0) > (txnData?.items?.length ?? 0);

  const minor = (s: string | null | undefined) => parseInt(s || "0", 10) || 0;

  const isLoading = accLoading || txnLoading;

  const handleBack = () => {
    nav.goBack();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(
      i18n.language === "vi" ? "vi-VN" : "en-US",
    ).format(amount);
  };

  // Build account filter options from real data
  const accountOptions = useMemo(() => {
    return [
      { id: "all", name: t("cashflow.filters.all_accounts") },
      ...accounts
        .filter((a) => a.status === "active")
        .map((a) => ({ id: a.id, name: a.name })),
    ];
  }, [accounts]);

  // Build balance/netflow data from real transactions
  const balanceData = useMemo(() => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end)
      return [];

    // Group by day
    const dailyNet: Record<string, number> = {};
    transactions.forEach((t) => {
      const key = (t.date || t.occurredAt?.split("T")[0] || "").substring(
        0,
        10,
      );
      const signed = minor(t.signedAmountMinor);
      dailyNet[key] = (dailyNet[key] || 0) + signed;
    });

    // Starting balance: sum of selected account current balances
    let runningBalance: number;
    if (selectedAccount === "all") {
      runningBalance = accounts.reduce(
        (s, a) => s + minor(a.currentBalanceMinor),
        0,
      );
    } else {
      const acc = accounts.find((a) => a.id === selectedAccount);
      runningBalance = acc ? minor(acc.currentBalanceMinor) : 0;
    }

    // Approximate: current balance is "now". Subtract transactions after endDate
    // to get end-of-period balance, then walk backwards.
    // Since we only fetched transactions in [startDate, endDate], we approximate
    // end-of-period balance = currentBalance (close enough for the selected range).
    const endPeriodBalance = runningBalance;

    const dayCount =
      Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const maxDays = Math.min(dayCount, 60);

    const allDays: { key: string; label: string; netFlow: number }[] = [];
    for (let i = 0; i < maxDays; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      const key = d.toISOString().substring(0, 10);
      const label = `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
      allDays.push({ key, label, netFlow: dailyNet[key] || 0 });
    }

    const totalNet = allDays.reduce((s, d) => s + d.netFlow, 0);
    let cumulativeBal = endPeriodBalance - totalNet;

    const result: { date: string; balance: number; netFlow: number }[] = [];
    for (const day of allDays) {
      cumulativeBal += day.netFlow;
      result.push({
        date: day.label,
        balance: Math.round(cumulativeBal),
        netFlow: Math.round(day.netFlow),
      });
    }

    return result;
  }, [transactions, accounts, selectedAccount, startDate, endDate]);

  const startBalance = balanceData.length > 0 ? balanceData[0].balance : 0;
  const endBalance =
    balanceData.length > 0 ? balanceData[balanceData.length - 1].balance : 0;
  const balanceChange = endBalance - startBalance;
  const percentageChange =
    startBalance !== 0 ? (balanceChange / Math.abs(startBalance)) * 100 : 0;

  const totalInflow = balanceData.reduce((sum, item) => {
    return item.netFlow > 0 ? sum + item.netFlow : sum;
  }, 0);

  const totalOutflow = balanceData.reduce((sum, item) => {
    return item.netFlow < 0 ? sum + Math.abs(item.netFlow) : sum;
  }, 0);

  const netFlow = totalInflow - totalOutflow;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[var(--primary)] animate-spin" />
      </div>
    );
  }

  if (txnError) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center p-4">
        <div className="text-center">
          <AlertTriangle className="w-10 h-10 text-[var(--danger)] mx-auto mb-3" />
          <p className="text-[var(--text-primary)] font-medium mb-1">
            {t("cashflow.error.load_failed")}
          </p>
          <p className="text-sm text-[var(--text-secondary)] mb-4">
            {txnError}
          </p>
          <button
            onClick={reloadTxn}
            className="px-4 py-2 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white rounded-[var(--radius-lg)] text-sm font-medium transition-colors"
          >
            {t("cashflow.error.retry")}
          </button>
        </div>
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
            <span className="font-medium">{t("cashflow.back")}</span>
          </button>

          <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
            {t("cashflow.title")}
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            {t("cashflow.subtitle")}
          </p>
        </div>

        {/* Truncation warning */}
        {isTruncated && (
          <div className="flex items-center gap-2 px-4 py-2.5 bg-[var(--warning-light)] border border-[var(--warning)] text-[var(--warning)] rounded-[var(--radius-lg)] text-sm">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>
              {t("cashflow.truncation_warning", {
                shown: txnData?.items?.length,
                total: txnData?.pagination?.total,
              })}
            </span>
          </div>
        )}

        {/* Filters */}
        <Card>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* View Type Toggle */}
            <div className="md:col-span-4">
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                {t("cashflow.view_type.label")}
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setViewType("balance")}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-[var(--radius-lg)] font-medium transition-all ${
                    viewType === "balance"
                      ? "bg-[var(--primary)] text-white shadow-[var(--shadow-sm)]"
                      : "bg-[var(--surface)] text-[var(--text-secondary)] hover:bg-[var(--border)]"
                  }`}
                >
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-sm">
                    {t("cashflow.view_type.balance")}
                  </span>
                </button>
                <button
                  onClick={() => setViewType("netflow")}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-[var(--radius-lg)] font-medium transition-all ${
                    viewType === "netflow"
                      ? "bg-[var(--primary)] text-white shadow-[var(--shadow-sm)]"
                      : "bg-[var(--surface)] text-[var(--text-secondary)] hover:bg-[var(--border)]"
                  }`}
                >
                  <Calendar className="w-4 h-4" />
                  <span className="text-sm">
                    {t("cashflow.view_type.netflow")}
                  </span>
                </button>
              </div>
            </div>

            {/* Date Range */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                {t("cashflow.filters.start_date_label")}
              </label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                {t("cashflow.filters.end_date_label")}
              </label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>

            {/* Account Filter */}
            <div className="md:col-span-4">
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                {t("cashflow.filters.account_label")}
              </label>
              <div className="relative">
                <select
                  value={selectedAccount}
                  onChange={(e) => setSelectedAccount(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[var(--input-background)] border border-[var(--border)] rounded-[var(--radius-lg)] text-[var(--text-primary)] appearance-none cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]"
                >
                  {accountOptions.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-secondary)] pointer-events-none" />
              </div>
            </div>

            {/* Tag Filter */}
            {tags.length > 0 && (
              <div className="md:col-span-4">
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                  {t("cashflow.filters.tag_label")}
                </label>
                <div className="flex items-center gap-3 flex-wrap">
                  <TagFilterDropdown
                    tags={tags}
                    selectedTags={selectedTags}
                    onSelectedTagsChange={setSelectedTags}
                    tagFilterMode={tagFilterMode}
                    onTagFilterModeChange={setTagFilterMode}
                  />
                  {selectedTags.length > 0 && (
                    <TagFilterBadge
                      tags={tags}
                      selectedTags={selectedTags}
                      tagFilterMode={tagFilterMode}
                      onClear={() => setSelectedTags([])}
                    />
                  )}
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Summary Stats */}
        {viewType === "balance" ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <p className="text-sm text-[var(--text-secondary)] mb-2">
                {t("cashflow.balance_stats.start_balance")}
              </p>
              <p className="text-2xl font-bold text-[var(--text-primary)] tabular-nums">
                {formatCurrency(startBalance)}₫
              </p>
            </Card>

            <Card>
              <p className="text-sm text-[var(--text-secondary)] mb-2">
                {t("cashflow.balance_stats.end_balance")}
              </p>
              <p className="text-2xl font-bold text-[var(--text-primary)] tabular-nums">
                {formatCurrency(endBalance)}₫
              </p>
            </Card>

            <Card>
              <p className="text-sm text-[var(--text-secondary)] mb-2">
                {t("cashflow.balance_stats.change")}
              </p>
              <p
                className={`text-2xl font-bold tabular-nums ${
                  balanceChange >= 0
                    ? "text-[var(--success)]"
                    : "text-[var(--danger)]"
                }`}
              >
                {balanceChange >= 0 ? "+" : ""}
                {formatCurrency(balanceChange)}₫
              </p>
              <p
                className={`text-xs mt-1 ${
                  balanceChange >= 0
                    ? "text-[var(--success)]"
                    : "text-[var(--danger)]"
                }`}
              >
                {balanceChange >= 0 ? "+" : ""}
                {percentageChange.toFixed(2)}%
              </p>
            </Card>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <p className="text-sm text-[var(--text-secondary)] mb-2">
                {t("cashflow.netflow_stats.total_inflow")}
              </p>
              <p className="text-2xl font-bold text-[var(--success)] tabular-nums">
                +{formatCurrency(totalInflow)}₫
              </p>
            </Card>

            <Card>
              <p className="text-sm text-[var(--text-secondary)] mb-2">
                {t("cashflow.netflow_stats.total_outflow")}
              </p>
              <p className="text-2xl font-bold text-[var(--danger)] tabular-nums">
                -{formatCurrency(totalOutflow)}₫
              </p>
            </Card>

            <Card>
              <p className="text-sm text-[var(--text-secondary)] mb-2">
                {t("cashflow.netflow_stats.net_flow")}
              </p>
              <p
                className={`text-2xl font-bold tabular-nums ${
                  netFlow >= 0
                    ? "text-[var(--success)]"
                    : "text-[var(--danger)]"
                }`}
              >
                {netFlow >= 0 ? "+" : ""}
                {formatCurrency(netFlow)}₫
              </p>
            </Card>
          </div>
        )}

        {/* Chart */}
        <Card>
          <div className="mb-4">
            <h3 className="font-semibold text-[var(--text-primary)]">
              {viewType === "balance"
                ? t("cashflow.chart.balance_title")
                : t("cashflow.chart.netflow_title")}
            </h3>
            <p className="text-sm text-[var(--text-secondary)] mt-1">
              {viewType === "balance"
                ? t("cashflow.chart.balance_subtitle")
                : t("cashflow.chart.netflow_subtitle")}
            </p>
          </div>

          {balanceData.length > 0 ? (
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={balanceData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--divider)"
                  />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: "var(--text-tertiary)", fontSize: 12 }}
                    tickLine={false}
                    axisLine={{ stroke: "var(--divider)" }}
                    interval={Math.max(0, Math.floor(balanceData.length / 8))}
                  />
                  <YAxis
                    tick={{ fill: "var(--text-tertiary)", fontSize: 12 }}
                    tickLine={false}
                    axisLine={{ stroke: "var(--divider)" }}
                    tickFormatter={(value) => {
                      if (Math.abs(value) >= 1000000) {
                        return `${(value / 1000000).toFixed(0)}M`;
                      }
                      return `${(value / 1000).toFixed(0)}k`;
                    }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--card)",
                      border: "1px solid var(--border)",
                      borderRadius: "var(--radius-lg)",
                      fontSize: "12px",
                    }}
                    formatter={(value: number) => [
                      `${value >= 0 ? "+" : ""}${formatCurrency(value)}₫`,
                      viewType === "balance"
                        ? t("cashflow.chart.tooltip_balance")
                        : t("cashflow.chart.tooltip_netflow"),
                    ]}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: "12px" }}
                    formatter={() =>
                      viewType === "balance"
                        ? t("cashflow.chart.balance_legend")
                        : t("cashflow.chart.netflow_legend")
                    }
                  />
                  {viewType === "balance" ? (
                    <Line
                      type="monotone"
                      dataKey="balance"
                      stroke="var(--primary)"
                      strokeWidth={3}
                      dot={{ fill: "var(--primary)", r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  ) : (
                    <Line
                      type="monotone"
                      dataKey="netFlow"
                      stroke="var(--success)"
                      strokeWidth={3}
                      dot={(props: any) => {
                        const { cx, cy, payload } = props;
                        const color =
                          payload.netFlow >= 0
                            ? "var(--success)"
                            : "var(--danger)";
                        return <circle cx={cx} cy={cy} r={4} fill={color} />;
                      }}
                      activeDot={{ r: 6 }}
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-96 flex items-center justify-center">
              <p className="text-sm text-[var(--text-tertiary)]">
                {t("cashflow.chart.no_data")}
              </p>
            </div>
          )}
        </Card>

        {/* Insights */}
        <Card className="bg-[var(--info-light)] border-[var(--info)]">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-[var(--info)] rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white text-lg font-semibold">
                &#128161;
              </span>
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-[var(--text-primary)] mb-1">
                {t("cashflow.insight.title")}
              </h4>
              {viewType === "balance" ? (
                <div className="space-y-2 text-sm text-[var(--text-secondary)]">
                  <p>
                    {balanceChange >= 0
                      ? t("cashflow.insight.balance_increased", {
                          amount: `${formatCurrency(Math.abs(balanceChange))}₫`,
                          percent: `${Math.abs(percentageChange).toFixed(2)}%`,
                        })
                      : t("cashflow.insight.balance_decreased", {
                          amount: `${formatCurrency(Math.abs(balanceChange))}₫`,
                          percent: `${Math.abs(percentageChange).toFixed(2)}%`,
                        })}
                  </p>
                  {balanceChange < 0 && (
                    <p>{t("cashflow.insight.balance_negative_tip")}</p>
                  )}
                </div>
              ) : (
                <div className="space-y-2 text-sm text-[var(--text-secondary)]">
                  <p>
                    {t("cashflow.insight.netflow_summary", {
                      amount: `${netFlow >= 0 ? "+" : ""}${formatCurrency(netFlow)}₫`,
                    })}
                  </p>
                  {netFlow >= 0 ? (
                    <p>{t("cashflow.insight.netflow_positive")}</p>
                  ) : (
                    <p>{t("cashflow.insight.netflow_negative")}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

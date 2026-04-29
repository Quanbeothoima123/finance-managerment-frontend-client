import React, { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  ArrowLeft,
  PieChart as PieChartIcon,
  BarChart3,
  ChevronDown,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { Card } from "../components/Card";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useAppNavigation } from "../hooks/useAppNavigation";
import { useAccountsOverview } from "../hooks/useAccountsOverview";
import { useTransactionsList } from "../hooks/useTransactionsList";
import { useCategoriesList } from "../hooks/useCategoriesList";
import { useTagsList } from "../hooks/useTagsList";
import {
  TagFilterDropdown,
  TagFilterBadge,
} from "../components/TagFilterDropdown";

const FALLBACK_COLORS = [
  "#ef4444",
  "#8b5cf6",
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ec4899",
  "#6366f1",
  "#14b8a6",
  "#f97316",
  "#06b6d4",
];

interface CategoryItemProps {
  category: {
    id: string;
    name: string;
    amount: number;
    percentage: number;
    color: string;
    transactions: number;
  };
  rank: number;
}

function CategoryItem({ category, rank }: CategoryItemProps) {
  const { t, i18n } = useTranslation("insights");
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(
      i18n.language === "vi" ? "vi-VN" : "en-US",
    ).format(amount);
  };

  return (
    <div className="flex items-center gap-4 py-4 border-b border-[var(--divider)] last:border-0">
      <div className="flex items-center gap-3 flex-1">
        <div className="w-8 h-8 rounded-full bg-[var(--surface)] flex items-center justify-center text-sm font-semibold text-[var(--text-secondary)]">
          {rank}
        </div>
        <div
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: category.color }}
        />
        <div className="flex-1">
          <p className="text-sm font-medium text-[var(--text-primary)]">
            {category.name}
          </p>
          <p className="text-xs text-[var(--text-secondary)]">
            {category.transactions}{" "}
            {t("category_breakdown.list.transactions_suffix")}
          </p>
        </div>
      </div>
      <div className="text-right">
        <p className="text-sm font-semibold text-[var(--text-primary)] tabular-nums">
          {formatCurrency(category.amount)}₫
        </p>
        <p className="text-xs text-[var(--text-secondary)] tabular-nums">
          {category.percentage}%
        </p>
      </div>
    </div>
  );
}

export default function CategoryBreakdown() {
  const { t, i18n } = useTranslation("insights");
  const [chartType, setChartType] = useState<"pie" | "bar">("pie");
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const [selectedMonth, setSelectedMonth] = useState(
    `${now.getFullYear()}-${pad(now.getMonth() + 1)}`,
  );
  const [selectedAccount, setSelectedAccount] = useState("all");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [tagFilterMode, setTagFilterMode] = useState<"AND" | "OR">("OR");
  const nav = useAppNavigation();

  // ── Data fetching ──
  const { data: accData } = useAccountsOverview();
  const accounts = accData?.accounts ?? [];

  const { data: catData } = useCategoriesList();

  const { data: tagsData } = useTagsList();
  const tags = useMemo(
    () =>
      (tagsData?.items ?? []).map((tag) => ({
        id: tag.id,
        name: tag.name,
        color: tag.colorHex || tag.color || "#6b7280",
      })),
    [tagsData],
  );

  // Fetch expenses for selected month with account/tag filters applied server-side
  const txnQuery = useMemo(() => {
    const [y, m] = selectedMonth.split("-").map(Number);
    const start = new Date(y, m - 1, 1);
    const end = new Date(y, m, 0);
    return {
      startDate: `${start.getFullYear()}-${pad(start.getMonth() + 1)}-${pad(start.getDate())}`,
      endDate: `${end.getFullYear()}-${pad(end.getMonth() + 1)}-${pad(end.getDate())}`,
      type: "expense" as const,
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
      sortOrder: "desc" as const,
    };
  }, [selectedMonth, selectedAccount, selectedTags, tagFilterMode]);
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

  const handleBack = () => {
    nav.goBack();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(
      i18n.language === "vi" ? "vi-VN" : "en-US",
    ).format(amount);
  };

  // Build month options (last 12 months)
  const months = useMemo(() => {
    const result: { id: string; name: string }[] = [];
    const today = new Date();
    for (let i = 0; i < 12; i++) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
      result.push({
        id: key,
        name: t("category_breakdown.month_option", {
          month: d.getMonth() + 1,
          year: d.getFullYear(),
        }),
      });
    }
    return result;
  }, []);

  // Build account options
  const accountOptions = useMemo(
    () => [
      { id: "all", name: t("category_breakdown.filters.all_accounts") },
      ...accounts
        .filter((a) => a.status === "active")
        .map((a) => ({ id: a.id, name: a.name })),
    ],
    [accounts],
  );

  // Build category data from real transactions
  const categoryData = useMemo(() => {
    const catLookup: Record<string, { name: string; color: string }> = {};
    (catData?.items ?? []).forEach((c) => {
      catLookup[c.id] = {
        name: c.name,
        color: c.colorHex || c.color || FALLBACK_COLORS[0],
      };
    });

    const catMap: Record<
      string,
      { amount: number; transactions: number; name: string; color: string }
    > = {};

    transactions.forEach((txn) => {
      const catId = txn.category?.id || "unknown";
      const catName =
        txn.category?.name || t("category_breakdown.list.no_category");
      const catColor =
        catLookup[catId]?.color || txn.category?.colorHex || FALLBACK_COLORS[0];
      if (!catMap[catId])
        catMap[catId] = {
          amount: 0,
          transactions: 0,
          name: catName,
          color: catColor,
        };
      catMap[catId].amount += minor(txn.totalAmountMinor);
      catMap[catId].transactions += 1;
    });

    const total = Object.values(catMap).reduce((s, v) => s + v.amount, 0) || 1;

    return Object.entries(catMap)
      .map(([key, val], idx) => ({
        id: key,
        name: val.name,
        amount: val.amount,
        percentage: Math.round((val.amount / total) * 100),
        color: val.color || FALLBACK_COLORS[idx % FALLBACK_COLORS.length],
        transactions: val.transactions,
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [transactions, catData]);

  const totalAmount = categoryData.reduce((sum, cat) => sum + cat.amount, 0);
  const totalTransactions = categoryData.reduce(
    (sum, cat) => sum + cat.transactions,
    0,
  );
  const avgPerTransaction =
    totalTransactions > 0 ? totalAmount / totalTransactions : 0;

  if (txnLoading) {
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
            {t("category_breakdown.error.load_failed")}
          </p>
          <p className="text-sm text-[var(--text-secondary)] mb-4">
            {txnError}
          </p>
          <button
            onClick={reloadTxn}
            className="px-4 py-2 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white rounded-[var(--radius-lg)] text-sm font-medium transition-colors"
          >
            {t("category_breakdown.error.retry")}
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
            <span className="font-medium">{t("category_breakdown.back")}</span>
          </button>

          <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
            {t("category_breakdown.title")}
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            {t("category_breakdown.subtitle")}
          </p>
        </div>

        {/* Truncation warning */}
        {isTruncated && (
          <div className="flex items-center gap-2 px-4 py-2.5 bg-[var(--warning-light)] border border-[var(--warning)] text-[var(--warning)] rounded-[var(--radius-lg)] text-sm">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>
              {t("category_breakdown.truncation_warning", {
                shown: txnData?.items?.length,
                total: txnData?.pagination?.total,
              })}
            </span>
          </div>
        )}

        {/* Filters */}
        <Card>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Month Filter */}
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                {t("category_breakdown.filters.month_label")}
              </label>
              <div className="relative">
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[var(--input-background)] border border-[var(--border)] rounded-[var(--radius-lg)] text-[var(--text-primary)] appearance-none cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]"
                >
                  {months.map((month) => (
                    <option key={month.id} value={month.id}>
                      {month.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-secondary)] pointer-events-none" />
              </div>
            </div>

            {/* Account Filter */}
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                {t("category_breakdown.filters.account_label")}
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

            {/* Chart Type Toggle */}
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                {t("category_breakdown.filters.chart_label")}
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setChartType("pie")}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-[var(--radius-lg)] font-medium transition-all ${
                    chartType === "pie"
                      ? "bg-[var(--primary)] text-white shadow-[var(--shadow-sm)]"
                      : "bg-[var(--surface)] text-[var(--text-secondary)] hover:bg-[var(--border)]"
                  }`}
                >
                  <PieChartIcon className="w-4 h-4" />
                  <span className="text-sm">
                    {t("category_breakdown.filters.chart_types.pie")}
                  </span>
                </button>
                <button
                  onClick={() => setChartType("bar")}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-[var(--radius-lg)] font-medium transition-all ${
                    chartType === "bar"
                      ? "bg-[var(--primary)] text-white shadow-[var(--shadow-sm)]"
                      : "bg-[var(--surface)] text-[var(--text-secondary)] hover:bg-[var(--border)]"
                  }`}
                >
                  <BarChart3 className="w-4 h-4" />
                  <span className="text-sm">
                    {t("category_breakdown.filters.chart_types.bar")}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </Card>

        {/* Tag Filter */}
        {tags.length > 0 && (
          <Card>
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-sm font-medium text-[var(--text-primary)]">
                  {t("category_breakdown.filters.tag_label")}
                </span>
                <TagFilterDropdown
                  tags={tags}
                  selectedTags={selectedTags}
                  onSelectedTagsChange={setSelectedTags}
                  tagFilterMode={tagFilterMode}
                  onTagFilterModeChange={setTagFilterMode}
                />
              </div>
              {selectedTags.length > 0 && (
                <TagFilterBadge
                  tags={tags}
                  selectedTags={selectedTags}
                  tagFilterMode={tagFilterMode}
                  onClear={() => setSelectedTags([])}
                />
              )}
            </div>
          </Card>
        )}

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <p className="text-sm text-[var(--text-secondary)] mb-2">
              {t("category_breakdown.summary.total_spending")}
            </p>
            <p className="text-2xl font-bold text-[var(--text-primary)] tabular-nums">
              {formatCurrency(totalAmount)}₫
            </p>
          </Card>

          <Card>
            <p className="text-sm text-[var(--text-secondary)] mb-2">
              {t("category_breakdown.summary.transaction_count")}
            </p>
            <p className="text-2xl font-bold text-[var(--text-primary)] tabular-nums">
              {totalTransactions}
            </p>
          </Card>

          <Card>
            <p className="text-sm text-[var(--text-secondary)] mb-2">
              {t("category_breakdown.summary.avg_per_transaction")}
            </p>
            <p className="text-2xl font-bold text-[var(--text-primary)] tabular-nums">
              {formatCurrency(Math.round(avgPerTransaction))}₫
            </p>
          </Card>
        </div>

        {/* Chart */}
        <Card>
          {categoryData.length === 0 ? (
            <div className="h-80 flex items-center justify-center">
              <p className="text-sm text-[var(--text-tertiary)]">
                {t("category_breakdown.chart.no_data")}
              </p>
            </div>
          ) : chartType === "pie" ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percentage }) => `${name} ${percentage}%`}
                      outerRadius={120}
                      dataKey="amount"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "var(--card)",
                        border: "1px solid var(--border)",
                        borderRadius: "var(--radius-lg)",
                        fontSize: "12px",
                      }}
                      formatter={(value: number) => [
                        `${formatCurrency(value)}₫`,
                        t("category_breakdown.chart.tooltip_label"),
                      ]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="flex flex-col justify-center space-y-3">
                {categoryData.map((category) => (
                  <div key={category.id} className="flex items-center gap-3">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: category.color }}
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-[var(--text-primary)]">
                        {category.name}
                      </p>
                      <p className="text-xs text-[var(--text-secondary)]">
                        {category.transactions}{" "}
                        {t("category_breakdown.list.transactions_suffix")}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-[var(--text-primary)] tabular-nums">
                        {formatCurrency(category.amount)}₫
                      </p>
                      <p className="text-xs text-[var(--text-secondary)] tabular-nums">
                        {category.percentage}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData} layout="vertical">
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
                    width={100}
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
                      t("category_breakdown.chart.tooltip_label"),
                    ]}
                  />
                  <Bar dataKey="amount" radius={[0, 8, 8, 0]}>
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        {/* Category List */}
        {categoryData.length > 0 && (
          <Card>
            <h3 className="font-semibold text-[var(--text-primary)] mb-4">
              {t("category_breakdown.list.title")} ({categoryData.length})
            </h3>
            <div className="space-y-0">
              {categoryData.map((category, index) => (
                <CategoryItem
                  key={category.id}
                  category={category}
                  rank={index + 1}
                />
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

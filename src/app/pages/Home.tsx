import React, { useMemo } from "react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { useLocalizedName } from "../utils/localizedName";
import {
  AlertCircle,
  AreaChart as AreaChartIcon,
  ArrowDownLeft,
  ArrowUpRight,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Plus,
  TrendingDown,
  TrendingUp,
  Wallet,
  Store,
  Tag,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { ProgressBar } from "../components/ProgressBar";
import { TagChip } from "../components/TagChip";
import { useHomeOverview } from "../hooks/useHomeOverview";
import { useAppNavigation } from "../hooks/useAppNavigation";
import type {
  HomeBudgetPreview,
  HomeInsightCard,
  HomeRecurringPreview,
} from "../types/home";
import type { TransactionListItem } from "../types/transactions";
import i18n from "../../i18n";

function getLocale() {
  return i18n.language === "en" ? "en-US" : "vi-VN";
}

function formatMoney(value?: string | number | null) {
  return new Intl.NumberFormat(getLocale()).format(Number(value || 0));
}

function formatCurrency(value?: string | number | null) {
  return `${formatMoney(value)}₫`;
}

function formatMonth(month: string) {
  const [year, monthNumber] = month.split("-").map(Number);
  return new Intl.DateTimeFormat(getLocale(), {
    month: "long",
    year: "numeric",
  }).format(new Date(year, monthNumber - 1, 1));
}

function addMonth(month: string, delta: number) {
  const [year, monthNumber] = month.split("-").map(Number);
  const next = new Date(year, monthNumber - 1 + delta, 1);
  return `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}`;
}

function getMonthDateRange(month: string) {
  const [year, m] = month.split("-").map(Number);
  const startDate = `${year}-${String(m).padStart(2, "0")}-01`;
  const lastDay = new Date(year, m, 0).getDate();
  const endDate = `${year}-${String(m).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
  return { startDate, endDate };
}

function formatShortDate(value?: string | null) {
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat(getLocale(), {
    day: "2-digit",
    month: "2-digit",
  }).format(date);
}

function formatFullDate(value?: string | null) {
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat(getLocale(), {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function getRelativeRecurringLabel(nextRunAt: string) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const next = new Date(nextRunAt);
  const target = new Date(next.getFullYear(), next.getMonth(), next.getDate());

  const diffMs = target.getTime() - today.getTime();
  const daysUntil = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (daysUntil <= 0) return i18n.t("common:time.today");
  if (daysUntil === 1) return i18n.t("common:time.tomorrow");
  return i18n.t("common:time.days_from_now", { count: daysUntil });
}

function getTrendTone(
  isPositive: boolean,
  semantic: "default" | "expense" = "default",
) {
  if (semantic === "expense") {
    return isPositive ? "text-[var(--success)]" : "text-[var(--danger)]";
  }

  return isPositive ? "text-[var(--success)]" : "text-[var(--danger)]";
}

function getTrendPrefix(trend: { deltaMinor: string | null }) {
  const value = Number(trend.deltaMinor || 0);
  return value >= 0 ? "+" : "-";
}

function getTrendValueText(trend: {
  deltaPercent: number | null;
  deltaMinor: string | null;
}) {
  const fallback = i18n.t("home:summary.no_comparison");
  if (trend.deltaPercent === null) {
    const deltaMinor = Number(trend.deltaMinor || 0);
    if (deltaMinor === 0) return fallback;
    return `${deltaMinor > 0 ? "+" : "-"}${formatMoney(Math.abs(deltaMinor))}₫`;
  }

  return `${getTrendPrefix(trend)}${trend.deltaPercent}%`;
}

function getInsightVariantClasses(variant: string) {
  if (variant === "positive") {
    return {
      wrapper: "bg-[var(--info-light)]",
      iconColor: "text-[var(--info)]",
      badgeBg: "bg-[var(--success-light)]",
      badgeText: "text-[var(--success)]",
      Icon: TrendingDown,
    };
  }

  if (variant === "warning") {
    return {
      wrapper: "bg-[var(--warning-light)]",
      iconColor: "text-[var(--warning)]",
      badgeBg: "bg-[var(--warning-light)]",
      badgeText: "text-[var(--warning)]",
      Icon: AlertCircle,
    };
  }

  return {
    wrapper: "bg-[var(--surface)]",
    iconColor: "text-[var(--text-secondary)]",
    badgeBg: "bg-[var(--surface)]",
    badgeText: "text-[var(--text-secondary)]",
    Icon: AreaChartIcon,
  };
}

function getTransactionAmountColor(type: string) {
  if (type === "income") return "text-[var(--success)]";
  if (type === "expense") return "text-[var(--danger)]";
  return "text-[var(--info)]";
}

function getTransactionDisplayAmount(item: TransactionListItem) {
  if (item.txnType === "income") {
    return `+${formatCurrency(Math.abs(Number(item.signedAmountMinor || 0)))}`;
  }

  if (item.txnType === "expense") {
    return `-${formatCurrency(Math.abs(Number(item.signedAmountMinor || 0)))}`;
  }

  return formatCurrency(Math.abs(Number(item.totalAmountMinor || 0)));
}

function BudgetCard({
  budget,
  onClick,
}: {
  budget: HomeBudgetPreview;
  onClick: () => void;
}) {
  return (
    <Card
      onClick={onClick}
      className="cursor-pointer hover:shadow-[var(--shadow-lg)] transition-shadow"
    >
      <div className="flex items-start justify-between mb-4 gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="p-2.5 rounded-[var(--radius-lg)]"
            style={{
              backgroundColor: `${budget.primaryCategory?.colorHex || "#3b82f6"}20`,
            }}
          >
            <Wallet
              className="w-5 h-5"
              style={{ color: budget.primaryCategory?.colorHex || "#3b82f6" }}
            />
          </div>

          <div className="min-w-0">
            <p className="font-medium text-[var(--text-primary)] truncate">
              {budget.name}
            </p>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              {formatCurrency(budget.spentMinor)} /{" "}
              {formatCurrency(budget.totalLimitMinor)}
            </p>
          </div>
        </div>

        <span
          className={`text-sm font-semibold ${
            budget.isOverBudget
              ? "text-[var(--danger)]"
              : "text-[var(--text-secondary)]"
          }`}
        >
          {Math.round(budget.progressPercent)}%
        </span>
      </div>

      <ProgressBar
        value={budget.progressPercent}
        max={100}
        variant={budget.isOverBudget ? "danger" : "primary"}
      />

      {budget.isOverBudget ? (
        <p className="text-xs text-[var(--danger)] mt-2 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          {i18n.t("home:budget_section.over_budget")}
        </p>
      ) : (
        <p className="text-xs text-[var(--text-tertiary)] mt-2">
          {i18n.t("home:budget_section.remaining")}{" "}
          {formatCurrency(Math.max(Number(budget.remainingMinor || 0), 0))}
        </p>
      )}
    </Card>
  );
}

function InsightSection({
  insight,
  onClick,
}: {
  insight: HomeInsightCard;
  onClick: () => void;
}) {
  const { t, i18n } = useTranslation("home");
  const styles = getInsightVariantClasses(insight.variant);
  const Icon = styles.Icon;

  const { insightKey, comparison } = insight;

  const getCategoryName = (
    cat: { name: string; nameEn: string | null } | null,
  ) => {
    if (!cat) return "";
    return i18n.language === "en" && cat.nameEn ? cat.nameEn : cat.name;
  };

  const title = (() => {
    if (insightKey === "positive") return t("insights.positive.title");
    if (insightKey === "warning") return t("insights.warning.title");
    if (insightKey === "neutral") return t("insights.neutral.title");
    if (insightKey === "no_data") return t("insights.no_data.title");
    return insight.title;
  })();

  const message = (() => {
    const topCat = comparison?.topCategory ?? null;
    const amount = formatMoney(Math.abs(Number(comparison?.deltaMinor || 0)));
    if (insightKey === "positive") {
      return topCat
        ? t("insights.positive.message_with_category", {
            amount,
            category: getCategoryName(topCat),
          })
        : t("insights.positive.message_without_category", { amount });
    }
    if (insightKey === "warning") {
      return t("insights.warning.message", { amount });
    }
    if (insightKey === "neutral") return t("insights.neutral.message");
    if (insightKey === "no_data") return t("insights.no_data.message");
    return insight.message;
  })();

  const badges = (() => {
    const topCat = comparison?.topCategory ?? null;
    const result: string[] = [];
    if (insightKey === "positive") {
      if (
        comparison?.deltaPercent !== null &&
        comparison?.deltaPercent !== undefined
      ) {
        result.push(
          t("insights.badges.decrease_this_week", {
            percent: comparison.deltaPercent,
          }),
        );
      }
      if (topCat) {
        if (topCat.deltaPercent !== null && topCat.deltaPercent !== undefined) {
          result.push(
            t("insights.badges.decrease_category", {
              percent: topCat.deltaPercent,
              category: getCategoryName(topCat),
            }),
          );
        } else {
          result.push(
            t("insights.badges.saving_category", {
              category: getCategoryName(topCat),
            }),
          );
        }
      }
    } else if (insightKey === "warning") {
      if (
        comparison?.deltaPercent !== null &&
        comparison?.deltaPercent !== undefined
      ) {
        result.push(
          t("insights.badges.increase_this_week", {
            percent: comparison.deltaPercent,
          }),
        );
      }
    }
    return result;
  })();

  return (
    <Card
      onClick={onClick}
      className="cursor-pointer hover:shadow-[var(--shadow-lg)] transition-shadow"
    >
      <div className="flex items-start gap-4">
        <div className={`p-3 rounded-[var(--radius-lg)] ${styles.wrapper}`}>
          <Icon className={`w-6 h-6 ${styles.iconColor}`} />
        </div>

        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-[var(--text-primary)] mb-1">
            {title}
          </h4>
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
            {message}
          </p>

          {!!badges.length && (
            <div className="flex flex-wrap gap-2 mt-3">
              {badges.map((badge) => (
                <span
                  key={badge}
                  className={`px-2.5 py-1 rounded-[var(--radius-md)] text-xs font-medium ${styles.badgeBg} ${styles.badgeText}`}
                >
                  {badge}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

function UpcomingRecurringCard({ item }: { item: HomeRecurringPreview }) {
  const isIncome = item.txnType === "income";
  const localName = useLocalizedName();

  return (
    <Card>
      <div className="flex items-center gap-3">
        <div
          className={`flex-shrink-0 w-10 h-10 rounded-[var(--radius-lg)] flex items-center justify-center ${
            isIncome
              ? "bg-[var(--success-light)] text-[var(--success)]"
              : "bg-[var(--danger-light)] text-[var(--danger)]"
          }`}
        >
          {isIncome ? (
            <TrendingUp className="w-5 h-5" />
          ) : (
            <TrendingDown className="w-5 h-5" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-[var(--text-primary)] truncate">
            {item.name}
          </p>
          <p className="text-xs text-[var(--text-secondary)]">
            {getRelativeRecurringLabel(item.nextRunAt)}
            {item.category?.name ? ` · ${localName(item.category)}` : ""}
          </p>
        </div>

        <span
          className={`text-sm font-semibold tabular-nums ${
            isIncome ? "text-[var(--success)]" : "text-[var(--danger)]"
          }`}
        >
          {isIncome ? "+" : "-"}
          {formatCurrency(Math.abs(Number(item.amountMinor || 0)))}
        </span>
      </div>
    </Card>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const nav = useAppNavigation();
  const { t } = useTranslation("home");
  const localName = useLocalizedName();
  const { data, loading, error, month, setMonth } = useHomeOverview();

  const chartData = useMemo(() => {
    return (data?.chart.spendingByDay || []).map((item) => ({
      day: String(item.day),
      amount: Number(item.cumulativeExpenseMinor || 0),
    }));
  }, [data?.chart.spendingByDay]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--background)] p-4 md:p-6">
        <Card>
          <p className="text-sm text-[var(--text-secondary)]">{t("loading")}</p>
        </Card>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[var(--background)] p-4 md:p-6">
        <Card>
          <p className="text-sm text-[var(--danger)]">
            {error || t("errors.load_failed")}
          </p>
        </Card>
      </div>
    );
  }

  const incomeTrend = data.summary.trends.income;
  const expenseTrend = data.summary.trends.expense;
  const netTrend = data.summary.trends.net;

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6 pb-20 md:pb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
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
                {formatMonth(month)}
              </h2>
            </div>

            <button
              onClick={() => setMonth(addMonth(month, 1))}
              className="p-2 rounded-[var(--radius-lg)] hover:bg-[var(--surface)] transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-[var(--text-secondary)]" />
            </button>
          </div>

          <Button onClick={() => navigate("/transactions/create")}>
            <Plus className="w-5 h-5" />
            <span className="font-medium">{t("actions.add_transaction")}</span>
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card
            onClick={() => navigate("/accounts")}
            className="cursor-pointer hover:shadow-[var(--shadow-lg)] transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[var(--text-secondary)]">
                  {t("summary.total_balance")}
                </p>
                <p className="mt-2 text-2xl font-semibold text-[var(--text-primary)] tabular-nums">
                  {formatCurrency(data.summary.totalBalanceMinor)}
                </p>
                <p className="mt-2 text-xs text-[var(--text-tertiary)]">
                  {t("summary.account_count", {
                    count: data.summary.activeAccountCount,
                  })}
                </p>
                {netTrend && (
                  <div className="mt-2 flex items-center gap-1">
                    <span
                      className={`text-xs font-medium ${getTrendTone(netTrend.isPositive)}`}
                    >
                      {getTrendValueText(netTrend)}
                    </span>
                    <span className="text-xs text-[var(--text-secondary)]">
                      {t("summary.vs_last_month")}
                    </span>
                  </div>
                )}
              </div>

              <div className="p-2.5 rounded-[var(--radius-lg)] bg-[var(--surface-elevated)]">
                <Wallet className="w-5 h-5 text-[var(--text-primary)]" />
              </div>
            </div>
          </Card>

          <Card
            onClick={() => {
              const { startDate, endDate } = getMonthDateRange(month);
              navigate(
                `/transactions?type=income&startDate=${startDate}&endDate=${endDate}`,
              );
            }}
            className="cursor-pointer hover:shadow-[var(--shadow-lg)] transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[var(--text-secondary)]">
                  {t("summary.income_short")}
                </p>
                <p className="mt-2 text-2xl font-semibold text-[var(--success)] tabular-nums">
                  {formatCurrency(data.summary.incomeMinor)}
                </p>
                {incomeTrend && (
                  <div className="mt-2 flex items-center gap-1">
                    <span
                      className={`text-xs font-medium ${getTrendTone(incomeTrend.isPositive)}`}
                    >
                      {getTrendValueText(incomeTrend)}
                    </span>
                    <span className="text-xs text-[var(--text-secondary)]">
                      {t("summary.vs_last_month")}
                    </span>
                  </div>
                )}
              </div>

              <div className="p-2.5 rounded-[var(--radius-lg)] bg-[var(--success-light)]">
                <ArrowUpRight className="w-5 h-5 text-[var(--success)]" />
              </div>
            </div>
          </Card>

          <Card
            onClick={() => {
              const { startDate, endDate } = getMonthDateRange(month);
              navigate(
                `/transactions?type=expense&startDate=${startDate}&endDate=${endDate}`,
              );
            }}
            className="cursor-pointer hover:shadow-[var(--shadow-lg)] transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[var(--text-secondary)]">
                  {t("summary.expense_short")}
                </p>
                <p className="mt-2 text-2xl font-semibold text-[var(--danger)] tabular-nums">
                  {formatCurrency(data.summary.expenseMinor)}
                </p>
                {expenseTrend && (
                  <div className="mt-2 flex items-center gap-1">
                    <span
                      className={`text-xs font-medium ${getTrendTone(
                        expenseTrend.isPositive,
                        "expense",
                      )}`}
                    >
                      {getTrendValueText(expenseTrend)}
                    </span>
                    <span className="text-xs text-[var(--text-secondary)]">
                      {t("summary.vs_last_month")}
                    </span>
                  </div>
                )}
              </div>

              <div className="p-2.5 rounded-[var(--radius-lg)] bg-[var(--danger-light)]">
                <ArrowDownLeft className="w-5 h-5 text-[var(--danger)]" />
              </div>
            </div>
          </Card>
        </div>

        <Card>
          <h3 className="font-semibold text-[var(--text-primary)] mb-4">
            {t("chart.daily_expense")}
          </h3>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient
                    id="homeExpenseGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="5%"
                      stopColor="var(--danger)"
                      stopOpacity={0.3}
                    />
                    <stop
                      offset="95%"
                      stopColor="var(--danger)"
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>

                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--border)"
                  vertical={false}
                />

                <XAxis
                  dataKey="day"
                  stroke="var(--text-tertiary)"
                  style={{ fontSize: "12px" }}
                  tickLine={false}
                  axisLine={false}
                />

                <YAxis
                  stroke="var(--text-tertiary)"
                  style={{ fontSize: "12px" }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `${Math.round(value / 1000)}k`}
                />

                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--surface-elevated)",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius-lg)",
                    boxShadow: "var(--shadow-lg)",
                    color: "var(--text-primary)",
                  }}
                  formatter={(value: number) => [
                    formatCurrency(value),
                    t("chart.cumulative_expense"),
                  ]}
                  labelFormatter={(label) =>
                    t("chart.day_label", { day: label })
                  }
                />

                <Area
                  type="monotone"
                  dataKey="amount"
                  stroke="var(--danger)"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#homeExpenseGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-[var(--text-primary)]">
              {t("budget_section.title")}
            </h3>
            <button
              onClick={() => navigate("/budgets")}
              className="text-sm text-[var(--primary)] hover:text-[var(--primary-hover)] font-medium"
            >
              {t("actions.view_all")}
            </button>
          </div>

          {data.budgetsPreview.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.budgetsPreview.map((budget) => (
                <BudgetCard
                  key={budget.id}
                  budget={budget}
                  onClick={() => navigate(`/budgets/${budget.id}`)}
                />
              ))}
            </div>
          ) : (
            <Card>
              <p className="text-sm text-[var(--text-secondary)]">
                {t("budget_section.no_budgets")}
              </p>
              <div className="mt-4">
                <Button onClick={() => navigate("/budgets/create")}>
                  <Plus className="w-4 h-4" />
                  {t("budget_section.create")}
                </Button>
              </div>
            </Card>
          )}
        </div>

        {data.insightCard && (
          <div>
            <h3 className="font-semibold text-[var(--text-primary)] mb-4">
              {t("insights.weekly_title")}
            </h3>

            <InsightSection
              insight={data.insightCard}
              onClick={() => navigate("/insights")}
            />
          </div>
        )}

        {data.upcomingRecurring.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-[var(--text-primary)]">
                {t("upcoming.title")}
              </h3>
              <button
                onClick={() => navigate("/rules/recurring")}
                className="text-sm text-[var(--primary)] hover:text-[var(--primary-hover)] font-medium"
              >
                {t("upcoming.view_schedule")}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {data.upcomingRecurring.map((rule) => (
                <UpcomingRecurringCard key={rule.id} item={rule} />
              ))}
            </div>
          </div>
        )}

        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-[var(--text-primary)]">
              {t("recent_transactions.title")}
            </h3>
            <button
              onClick={() => navigate("/transactions")}
              className="text-sm text-[var(--primary)] hover:text-[var(--primary-hover)] font-medium"
            >
              {t("actions.view_all")}
            </button>
          </div>

          {data.recentTransactions.length === 0 ? (
            <Card>
              <p className="text-sm text-[var(--text-secondary)] text-center py-6">
                {t("recent_transactions.no_transactions")}
              </p>
            </Card>
          ) : (
            <>
              <Card className="hidden md:block p-0 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-[var(--divider)]">
                        <th className="text-left px-6 py-3 text-sm font-medium text-[var(--text-secondary)]">
                          {t("recent_transactions.col_date")}
                        </th>
                        <th className="text-left px-6 py-3 text-sm font-medium text-[var(--text-secondary)]">
                          {t("recent_transactions.col_description")}
                        </th>
                        <th className="text-left px-6 py-3 text-sm font-medium text-[var(--text-secondary)]">
                          {t("recent_transactions.col_category")}
                        </th>
                        <th className="text-left px-6 py-3 text-sm font-medium text-[var(--text-secondary)]">
                          {t("recent_transactions.col_account")}
                        </th>
                        <th className="text-right px-6 py-3 text-sm font-medium text-[var(--text-secondary)]">
                          {t("recent_transactions.col_amount")}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.recentTransactions.map((transaction) => (
                        <tr
                          key={transaction.id}
                          onClick={() =>
                            navigate(`/transactions/${transaction.id}`)
                          }
                          className="border-b border-[var(--divider)] hover:bg-[var(--surface)] transition-colors cursor-pointer"
                        >
                          <td className="px-6 py-4 text-sm text-[var(--text-secondary)]">
                            {formatFullDate(transaction.occurredAt)}
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-sm font-medium text-[var(--text-primary)]">
                              {transaction.description ||
                                t("recent_transactions.fallback_name")}
                            </p>

                            {(transaction.merchant ||
                              transaction.tags.length > 0) && (
                              <div className="flex flex-wrap gap-1.5 mt-2">
                                {transaction.merchant?.id && (
                                  <button
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      nav.goTransactionsByMerchant(
                                        transaction.merchant!.id,
                                      );
                                    }}
                                    className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium bg-[var(--info-light)] text-[var(--info)] border border-[var(--info)]/20 hover:opacity-90"
                                  >
                                    <Store className="w-3 h-3" />
                                    {transaction.merchant.name}
                                  </button>
                                )}

                                {transaction.tags.slice(0, 2).map((tag) => (
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
                                      nameEn={tag.nameEn}
                                      color={tag.colorHex || "#64748b"}
                                      className="hover:scale-[1.02] transition-transform"
                                    />
                                  </button>
                                ))}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 text-sm text-[var(--text-secondary)]">
                            {transaction.category?.name || "--"}
                          </td>
                          <td className="px-6 py-4 text-sm text-[var(--text-secondary)]">
                            {transaction.account?.name ||
                              [
                                transaction.account?.name,
                                transaction.toAccount?.name,
                              ]
                                .filter(Boolean)
                                .join(" → ") ||
                              "--"}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <span
                              className={`text-sm font-semibold tabular-nums ${getTransactionAmountColor(
                                transaction.txnType,
                              )}`}
                            >
                              {getTransactionDisplayAmount(transaction)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>

              <div className="md:hidden space-y-2">
                {data.recentTransactions.map((transaction) => (
                  <Card
                    key={transaction.id}
                    onClick={() => navigate(`/transactions/${transaction.id}`)}
                    className="cursor-pointer"
                  >
                    <div className="flex items-start justify-between mb-2 gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-[var(--text-primary)] mb-1 truncate">
                          {transaction.description ||
                            t("recent_transactions.fallback_name")}
                        </p>
                        <p className="text-xs text-[var(--text-secondary)] truncate">
                          {[
                            transaction.category?.name,
                            transaction.account?.name,
                            transaction.toAccount?.name
                              ? `→ ${transaction.toAccount.name}`
                              : null,
                          ]
                            .filter(Boolean)
                            .join(" • ")}
                        </p>
                      </div>

                      <span
                        className={`font-semibold tabular-nums ml-3 ${getTransactionAmountColor(
                          transaction.txnType,
                        )}`}
                      >
                        {getTransactionDisplayAmount(transaction)}
                      </span>
                    </div>

                    {(transaction.merchant || transaction.tags.length > 0) && (
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {transaction.merchant?.id && (
                          <button
                            onClick={(event) => {
                              event.stopPropagation();
                              nav.goTransactionsByMerchant(
                                transaction.merchant!.id,
                              );
                            }}
                            className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium bg-[var(--info-light)] text-[var(--info)] border border-[var(--info)]/20 hover:opacity-90"
                          >
                            <Store className="w-3 h-3" />
                            {transaction.merchant.name}
                          </button>
                        )}

                        {transaction.tags.slice(0, 2).map((tag) => (
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
                    <p className="text-xs text-[var(--text-tertiary)]">
                      {formatShortDate(transaction.occurredAt)}
                    </p>
                  </Card>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

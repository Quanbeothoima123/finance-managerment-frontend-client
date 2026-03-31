import React, { useMemo } from "react";
import {
  TrendingUp,
  TrendingDown,
  PieChart,
  DollarSign,
  Wallet,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Download,
  CalendarDays,
  ShoppingBag,
  Receipt,
  Share2,
  Loader2,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import { Card } from "../components/Card";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart as RePieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { useAppNavigation } from "../hooks/useAppNavigation";
import { useHomeOverview } from "../hooks/useHomeOverview";
import { useAccountsOverview } from "../hooks/useAccountsOverview";
import { useTransactionsList } from "../hooks/useTransactionsList";
import { useCategoriesList } from "../hooks/useCategoriesList";
import { useToast } from "../contexts/ToastContext";

const ACCOUNT_TYPE_COLORS: Record<string, string> = {
  bank: "#3b82f6",
  cash: "#10b981",
  credit_card: "#ef4444",
  e_wallet: "#06b6d4",
  investment: "#f59e0b",
  savings: "#8b5cf6",
};

const CATEGORY_FALLBACK_COLORS = [
  "#ef4444",
  "#8b5cf6",
  "#3b82f6",
  "#f59e0b",
  "#10b981",
  "#ec4899",
  "#6366f1",
  "#14b8a6",
];

interface InsightCardProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  onViewDetails?: () => void;
  trend?: {
    value: number;
    isPositive: boolean;
    label: string;
  };
}

function InsightCard({
  title,
  icon,
  children,
  onViewDetails,
  trend,
}: InsightCardProps) {
  return (
    <Card>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-[var(--radius-lg)] bg-[var(--primary-light)] flex items-center justify-center">
            {icon}
          </div>
          <div>
            <h3 className="font-semibold text-[var(--text-primary)]">
              {title}
            </h3>
            {trend && (
              <div className="flex items-center gap-1.5 mt-0.5">
                {trend.isPositive ? (
                  <TrendingUp className="w-3.5 h-3.5 text-[var(--success)]" />
                ) : (
                  <TrendingDown className="w-3.5 h-3.5 text-[var(--danger)]" />
                )}
                <span
                  className={`text-xs font-medium ${
                    trend.isPositive
                      ? "text-[var(--success)]"
                      : "text-[var(--danger)]"
                  }`}
                >
                  {trend.isPositive ? "+" : ""}
                  {trend.value.toFixed(1)}% {trend.label}
                </span>
              </div>
            )}
          </div>
        </div>
        {onViewDetails && (
          <button
            onClick={onViewDetails}
            className="p-2 rounded-[var(--radius-lg)] hover:bg-[var(--surface)] transition-colors text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          >
            <ArrowRight className="w-5 h-5" />
          </button>
        )}
      </div>
      {children}
    </Card>
  );
}

export default function InsightsOverview() {
  const nav = useAppNavigation();
  const toast = useToast();

  // ── Data fetching ──
  const {
    data: homeData,
    loading: homeLoading,
    error: homeError,
    month,
    setMonth,
    reload: reloadHome,
  } = useHomeOverview();
  const { data: accData, loading: accLoading } = useAccountsOverview();
  const { data: catData } = useCategoriesList();

  // Derive Date from month key for display / navigation
  const selectedMonth = useMemo(() => {
    const [y, m] = month.split("-").map(Number);
    return new Date(y, m - 1, 1);
  }, [month]);

  // Transactions for 5-month range (charts, weekly recap, CSV export)
  const txnQuery = useMemo(() => {
    const [y, m] = month.split("-").map(Number);
    const start = new Date(y, m - 5, 1);
    const end = new Date(y, m, 0);
    const pad = (n: number) => String(n).padStart(2, "0");
    return {
      startDate: `${start.getFullYear()}-${pad(start.getMonth() + 1)}-${pad(start.getDate())}`,
      endDate: `${end.getFullYear()}-${pad(end.getMonth() + 1)}-${pad(end.getDate())}`,
      limit: 100,
      sortBy: "date" as const,
      sortOrder: "desc" as const,
    };
  }, [month]);
  const { data: txnData, loading: txnLoading } = useTransactionsList(txnQuery);
  const transactions = txnData?.items ?? [];
  const isTruncated = (txnData?.pagination?.total ?? 0) > (txnData?.items?.length ?? 0);

  // ── Helpers ──
  const minor = (s: string | null | undefined) => parseInt(s || "0", 10) || 0;
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("vi-VN").format(amount);

  const toMonthKey = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

  const handlePrevMonth = () => {
    const d = new Date(selectedMonth);
    d.setMonth(d.getMonth() - 1);
    setMonth(toMonthKey(d));
  };

  const handleNextMonth = () => {
    const d = new Date(selectedMonth);
    d.setMonth(d.getMonth() + 1);
    setMonth(toMonthKey(d));
  };

  const formatMonthYear = (date: Date) =>
    date.toLocaleDateString("vi-VN", { month: "long", year: "numeric" });

  // ── Loading / Error ──
  const isLoading = homeLoading || txnLoading || accLoading;

  // ── Spending trend data (from home overview chart) ──
  const spendingTrendData = useMemo(() => {
    if (!homeData?.chart?.spendingByDay) return [];
    return homeData.chart.spendingByDay.map((item) => {
      const d = new Date(item.date);
      return {
        date: `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`,
        amount: minor(item.expenseMinor),
      };
    });
  }, [homeData]);

  // ── Top categories (expenses in selected month) ──
  const topCategoriesData = useMemo(() => {
    const year = selectedMonth.getFullYear();
    const mo = selectedMonth.getMonth();

    const catMap: Record<
      string,
      { name: string; amount: number; color: string }
    > = {};
    transactions
      .filter((t) => {
        if (t.type !== "expense") return false;
        const d = new Date(t.date || t.occurredAt);
        return d.getFullYear() === year && d.getMonth() === mo;
      })
      .forEach((t) => {
        const catId = t.category?.id || "unknown";
        const catName = t.category?.name || "Không danh mục";
        const catColor = t.category?.colorHex || CATEGORY_FALLBACK_COLORS[0];
        if (!catMap[catId])
          catMap[catId] = { name: catName, amount: 0, color: catColor };
        catMap[catId].amount += minor(t.totalAmountMinor);
      });

    // Enrich color from categories list when transaction doesn't carry one
    if (catData?.items) {
      const lookup: Record<string, string> = {};
      catData.items.forEach((c) => {
        if (c.colorHex) lookup[c.id] = c.colorHex;
      });
      Object.entries(catMap).forEach(([id, val]) => {
        if (val.color === CATEGORY_FALLBACK_COLORS[0] && lookup[id])
          val.color = lookup[id];
      });
    }

    const total = Object.values(catMap).reduce((s, v) => s + v.amount, 0) || 1;
    const sorted = Object.values(catMap)
      .map((v) => ({ ...v, percentage: Math.round((v.amount / total) * 100) }))
      .sort((a, b) => b.amount - a.amount);

    if (sorted.length > 5) {
      const top4 = sorted.slice(0, 4);
      const rest = sorted.slice(4);
      const restAmount = rest.reduce((s, v) => s + v.amount, 0);
      return [
        ...top4,
        {
          name: "Khác",
          amount: restAmount,
          percentage: Math.round((restAmount / total) * 100),
          color: "#6b7280",
        },
      ];
    }
    return sorted.length > 0
      ? sorted
      : [
          {
            name: "Chưa có dữ liệu",
            amount: 0,
            percentage: 0,
            color: "#6b7280",
          },
        ];
  }, [transactions, catData, selectedMonth]);

  // ── Income vs Expense (last 5 months) ──
  const incomeExpenseData = useMemo(() => {
    const year = selectedMonth.getFullYear();
    const mo = selectedMonth.getMonth();

    const result: { month: string; income: number; expense: number }[] = [];
    for (let i = 4; i >= 0; i--) {
      const m = new Date(year, mo - i, 1);
      const mYear = m.getFullYear();
      const mMonth = m.getMonth();
      let income = 0;
      let expense = 0;

      transactions.forEach((t) => {
        const d = new Date(t.date || t.occurredAt);
        if (d.getFullYear() === mYear && d.getMonth() === mMonth) {
          if (t.type === "income") income += minor(t.totalAmountMinor);
          else if (t.type === "expense") expense += minor(t.totalAmountMinor);
        }
      });

      result.push({ month: `T${mMonth + 1}`, income, expense });
    }
    return result;
  }, [transactions, selectedMonth]);

  // ── Account distribution (from accounts overview) ──
  const accountDistributionData = useMemo(() => {
    if (!accData?.groupedBalances) return [];
    const total =
      accData.groupedBalances.reduce(
        (s, g) => s + minor(g.totalBalanceMinor),
        0,
      ) || 1;
    return accData.groupedBalances
      .filter((g) => minor(g.totalBalanceMinor) > 0)
      .map((g) => ({
        name: g.label,
        amount: minor(g.totalBalanceMinor),
        color: ACCOUNT_TYPE_COLORS[g.type] || "#6b7280",
        percentage: Math.round((minor(g.totalBalanceMinor) / total) * 100),
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [accData]);

  // ── Summary stats ──
  const totalSpending = homeData ? minor(homeData.summary.expenseMinor) : 0;
  const totalIncome = homeData ? minor(homeData.summary.incomeMinor) : 0;
  const daysWithData =
    spendingTrendData.filter((d) => d.amount > 0).length || 1;
  const avgDailySpending = totalSpending / daysWithData;

  const currentMonthData = incomeExpenseData[incomeExpenseData.length - 1] || {
    income: 0,
    expense: 0,
  };
  const prevMonthData =
    incomeExpenseData.length >= 2
      ? incomeExpenseData[incomeExpenseData.length - 2]
      : null;

  const expenseTrend = homeData?.summary.trends.expense;
  const spendingChange =
    expenseTrend?.deltaPercent ??
    (prevMonthData && prevMonthData.expense > 0
      ? ((currentMonthData.expense - prevMonthData.expense) /
          prevMonthData.expense) *
        100
      : 0);
  const savingsRate =
    totalIncome > 0 ? ((totalIncome - totalSpending) / totalIncome) * 100 : 0;

  const handleViewSpendingTrend = () => nav.goCashflow();
  const handleViewCategoryBreakdown = () => nav.goCategoryBreakdown();
  const handleViewIncomeExpense = () => nav.goCashflow();
  const handleViewAccountDistribution = () => nav.goAccountBreakdown();

  // ── Weekly Recap Data ──
  const weeklyRecapData = useMemo(() => {
    const fmtC = (n: number) => new Intl.NumberFormat("vi-VN").format(n);
    const now = new Date();
    const day = now.getDay();
    const diffMon = day === 0 ? -6 : 1 - day;
    const mon = new Date(now);
    mon.setDate(now.getDate() + diffMon);
    mon.setHours(0, 0, 0, 0);
    const sun = new Date(mon);
    sun.setDate(mon.getDate() + 6);
    sun.setHours(23, 59, 59, 999);

    const weekTxns = transactions.filter((t) => {
      const d = new Date(t.date || t.occurredAt);
      return d >= mon && d <= sun;
    });
    const expenses = weekTxns.filter((t) => t.type === "expense");
    const incTxns = weekTxns.filter((t) => t.type === "income");
    const spending = expenses.reduce(
      (s, t) => s + minor(t.totalAmountMinor),
      0,
    );
    const inc = incTxns.reduce((s, t) => s + minor(t.totalAmountMinor), 0);

    // Build 3 bullets
    const bullets: string[] = [];
    if (expenses.length > 0) {
      // Top category
      const catBuckets: Record<string, { name: string; total: number }> = {};
      expenses.forEach((t) => {
        const key = t.category?.id || "unknown";
        if (!catBuckets[key])
          catBuckets[key] = { name: t.category?.name || "Khác", total: 0 };
        catBuckets[key].total += minor(t.totalAmountMinor);
      });
      const topCat = Object.values(catBuckets).sort(
        (a, b) => b.total - a.total,
      )[0];
      const pct =
        spending > 0 ? Math.round((topCat.total / spending) * 100) : 0;
      bullets.push(
        `Chi nhiều nhất: ${topCat.name} ${fmtC(topCat.total)}₫ (${pct}%)`,
      );

      // Biggest transaction
      const biggest = [...expenses].sort(
        (a, b) => minor(b.totalAmountMinor) - minor(a.totalAmountMinor),
      )[0];
      bullets.push(
        `Giao dịch lớn nhất: ${biggest.description || biggest.category?.name || ""} ${fmtC(minor(biggest.totalAmountMinor))}₫`,
      );

      // Peak day
      const DAYS = [
        "Chủ nhật",
        "Thứ 2",
        "Thứ 3",
        "Thứ 4",
        "Thứ 5",
        "Thứ 6",
        "Thứ 7",
      ];
      const dayMap: Record<number, number> = {};
      expenses.forEach((t) => {
        const d = new Date(t.date || t.occurredAt).getDay();
        dayMap[d] = (dayMap[d] || 0) + minor(t.totalAmountMinor);
      });
      const peak = Object.entries(dayMap).sort(([, a], [, b]) => b - a)[0];
      if (peak)
        bullets.push(
          `Ngày chi nhiều nhất: ${DAYS[parseInt(peak[0])]} ${fmtC(peak[1])}₫`,
        );
    }

    const fmtD = (d: Date) =>
      d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
    return {
      spending,
      income: inc,
      net: inc - spending,
      bullets,
      weekLabel: `${fmtD(mon)} – ${fmtD(sun)}`,
      hasData: weekTxns.length > 0,
    };
  }, [transactions]);

  const handleExportCSV = () => {
    const year = selectedMonth.getFullYear();
    const mo = selectedMonth.getMonth();
    const monthTxns = transactions.filter((t) => {
      const d = new Date(t.date || t.occurredAt);
      return d.getFullYear() === year && d.getMonth() === mo;
    });

    const header = "Ngày,Mô tả,Danh mục,Tài khoản,Loại,Số tiền\n";
    const rows = monthTxns
      .map((t) => {
        const escaped = (s: string) =>
          s.includes(",") || s.includes('"') ? `"${s.replace(/"/g, '""')}"` : s;
        const date = t.date || t.occurredAt?.split("T")[0] || "";
        const desc = t.description || "";
        const cat = t.category?.name || "";
        const acc = t.account?.name || "";
        const type = t.type === "income" ? "Thu nhập" : "Chi tiêu";
        return `${date},${escaped(desc)},${escaped(cat)},${escaped(acc)},${type},${t.signedAmountMinor}`;
      })
      .join("\n");

    const csv = header + rows;
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `thong-ke-${year}-${String(mo + 1).padStart(2, "0")}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(`Đã xuất ${monthTxns.length} giao dịch ra file CSV`);
  };

  if (homeError) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center p-4">
        <Card className="max-w-sm w-full text-center p-8">
          <AlertTriangle className="w-12 h-12 text-[var(--danger)] mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
            Không thể tải dữ liệu
          </h2>
          <p className="text-sm text-[var(--text-secondary)] mb-4">
            {homeError}
          </p>
          <button
            onClick={reloadHome}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white rounded-[var(--radius-lg)] font-medium transition-colors text-sm"
          >
            <RefreshCw className="w-4 h-4" /> Thử lại
          </button>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[var(--primary)] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="max-w-7xl mx-auto p-4 md:p-6 pb-20 md:pb-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
              Thống kê & Báo cáo
            </h1>
            <p className="text-sm text-[var(--text-secondary)] mt-1">
              Phân tích chi tiêu và tài chính
            </p>
          </div>

          {/* Month Selector */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-2 px-3 py-2 border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--surface)] rounded-[var(--radius-lg)] transition-colors"
              title="Xuất CSV"
            >
              <Download className="w-4 h-4" />
              <span className="text-sm font-medium hidden md:inline">
                Xuất CSV
              </span>
            </button>
            <button
              onClick={handlePrevMonth}
              className="p-2 rounded-[var(--radius-lg)] hover:bg-[var(--surface)] transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-[var(--text-secondary)]" />
            </button>
            <div className="px-4 py-2 bg-[var(--card)] rounded-[var(--radius-lg)] min-w-[200px] text-center">
              <p className="text-sm font-semibold text-[var(--text-primary)]">
                {formatMonthYear(selectedMonth)}
              </p>
            </div>
            <button
              onClick={handleNextMonth}
              className="p-2 rounded-[var(--radius-lg)] hover:bg-[var(--surface)] transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-[var(--text-secondary)]" />
            </button>
          </div>
        </div>

        {/* Truncation warning */}
        {isTruncated && (
          <div className="flex items-center gap-2 px-4 py-2.5 bg-[var(--warning-light)] border border-[var(--warning)] text-[var(--warning)] rounded-[var(--radius-lg)] text-sm">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>
              Đang hiển thị {txnData?.items?.length}/{txnData?.pagination?.total} giao dịch.
              Số liệu có thể chưa đầy đủ.
            </span>
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <p className="text-sm text-[var(--text-secondary)] mb-2">
              Tổng chi tiêu
            </p>
            <p className="text-2xl font-bold text-[var(--text-primary)] tabular-nums mb-1">
              {formatCurrency(currentMonthData.expense)}₫
            </p>
            {prevMonthData && prevMonthData.expense > 0 && (
              <div className="flex items-center gap-1.5">
                {spendingChange > 0 ? (
                  <TrendingUp className="w-3.5 h-3.5 text-[var(--danger)]" />
                ) : (
                  <TrendingDown className="w-3.5 h-3.5 text-[var(--success)]" />
                )}
                <span
                  className={`text-xs ${spendingChange > 0 ? "text-[var(--danger)]" : "text-[var(--success)]"}`}
                >
                  {spendingChange > 0 ? "+" : ""}
                  {spendingChange.toFixed(1)}% so với tháng trước
                </span>
              </div>
            )}
          </Card>

          <Card>
            <p className="text-sm text-[var(--text-secondary)] mb-2">
              Trung bình/ngày
            </p>
            <p className="text-2xl font-bold text-[var(--text-primary)] tabular-nums mb-1">
              {formatCurrency(Math.round(avgDailySpending))}₫
            </p>
            <p className="text-xs text-[var(--text-secondary)]">
              Dự kiến: {formatCurrency(Math.round(avgDailySpending * 30))}
              ₫/tháng
            </p>
          </Card>

          <Card>
            <p className="text-sm text-[var(--text-secondary)] mb-2">
              Tỷ lệ tiết kiệm
            </p>
            <p
              className={`text-2xl font-bold tabular-nums mb-1 ${savingsRate > 0 ? "text-[var(--success)]" : "text-[var(--danger)]"}`}
            >
              {savingsRate.toFixed(1)}%
            </p>
            <p className="text-xs text-[var(--text-secondary)]">
              {savingsRate >= 0 ? "Tiết kiệm" : "Vượt chi"}:{" "}
              {formatCurrency(
                Math.abs(currentMonthData.income - currentMonthData.expense),
              )}
              ₫
            </p>
          </Card>
        </div>

        {/* Weekly Recap Card */}
        <Card className="border-l-4 border-l-[var(--primary)]">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-[var(--radius-lg)] bg-[var(--primary-light)] flex items-center justify-center">
                <CalendarDays className="w-5 h-5 text-[var(--primary)]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-[var(--text-primary)]">
                    Recap tuần
                  </h3>
                  <span className="px-2 py-0.5 rounded-full bg-[var(--primary-light)] text-[var(--primary)] text-[10px] font-medium">
                    3–5 điểm nổi bật
                  </span>
                </div>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                  {weeklyRecapData.weekLabel}
                </p>
              </div>
            </div>
          </div>

          {weeklyRecapData.hasData ? (
            <>
              {/* Metrics Row */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="p-2.5 rounded-[var(--radius-lg)] bg-[var(--surface)]">
                  <p className="text-[10px] text-[var(--text-tertiary)]">
                    Chi tiêu
                  </p>
                  <p className="text-sm font-bold text-[var(--danger)] tabular-nums">
                    {formatCurrency(weeklyRecapData.spending)}₫
                  </p>
                </div>
                <div className="p-2.5 rounded-[var(--radius-lg)] bg-[var(--surface)]">
                  <p className="text-[10px] text-[var(--text-tertiary)]">
                    Thu nhập
                  </p>
                  <p className="text-sm font-bold text-[var(--success)] tabular-nums">
                    {formatCurrency(weeklyRecapData.income)}₫
                  </p>
                </div>
                <div className="p-2.5 rounded-[var(--radius-lg)] bg-[var(--surface)]">
                  <p className="text-[10px] text-[var(--text-tertiary)]">
                    Ròng
                  </p>
                  <p
                    className={`text-sm font-bold tabular-nums ${weeklyRecapData.net >= 0 ? "text-[var(--success)]" : "text-[var(--danger)]"}`}
                  >
                    {weeklyRecapData.net >= 0 ? "+" : "-"}
                    {formatCurrency(Math.abs(weeklyRecapData.net))}₫
                  </p>
                </div>
              </div>

              {/* Bullet Preview */}
              <div className="space-y-2 mb-4">
                {weeklyRecapData.bullets.map((b, i) => (
                  <p key={i} className="text-xs text-[var(--text-secondary)]">
                    • {b}
                  </p>
                ))}
              </div>

              {/* CTA Row */}
              <div className="flex gap-3">
                <button
                  onClick={() => nav.goWeeklyRecap()}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white rounded-[var(--radius-lg)] font-medium transition-colors text-sm"
                >
                  <Receipt className="w-4 h-4" />
                  Xem recap
                </button>
                <button
                  onClick={() => nav.goWeeklyRecap()}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 border border-[var(--border)] text-[var(--text-primary)] rounded-[var(--radius-lg)] font-medium hover:bg-[var(--surface)] transition-colors text-sm"
                >
                  <Share2 className="w-4 h-4" />
                  Chia sẻ
                </button>
              </div>
            </>
          ) : (
            <div className="text-center py-6">
              <p className="text-sm text-[var(--text-secondary)] mb-3">
                Tuần này chưa có dữ liệu
              </p>
              <button
                onClick={() => nav.goCreateTransaction()}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white rounded-[var(--radius-lg)] font-medium transition-colors text-sm"
              >
                Thêm giao dịch
              </button>
            </div>
          )}
        </Card>

        {/* Spending Trend Chart */}
        <InsightCard
          title="Xu hướng chi tiêu"
          icon={<TrendingUp className="w-5 h-5 text-[var(--primary)]" />}
          onViewDetails={handleViewSpendingTrend}
          trend={
            prevMonthData && prevMonthData.expense > 0
              ? {
                  value: spendingChange,
                  isPositive: spendingChange < 0,
                  label: "so với tháng trưc",
                }
              : undefined
          }
        >
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={spendingTrendData}>
                <defs>
                  <linearGradient
                    id="spendingGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="5%"
                      stopColor="var(--primary)"
                      stopOpacity={0.3}
                    />
                    <stop
                      offset="95%"
                      stopColor="var(--primary)"
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="date"
                  tick={{ fill: "var(--text-tertiary)", fontSize: 12 }}
                  tickLine={false}
                  axisLine={{ stroke: "var(--divider)" }}
                  interval={4}
                />
                <YAxis
                  tick={{ fill: "var(--text-tertiary)", fontSize: 12 }}
                  tickLine={false}
                  axisLine={{ stroke: "var(--divider)" }}
                  tickFormatter={(value) => `${value / 1000}k`}
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
                    "Chi tiêu",
                  ]}
                />
                <Area
                  type="monotone"
                  dataKey="amount"
                  stroke="var(--primary)"
                  strokeWidth={2}
                  fill="url(#spendingGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </InsightCard>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Top Categories */}
          <InsightCard
            title="Danh mục chi tiêu"
            icon={<PieChart className="w-5 h-5 text-[var(--primary)]" />}
            onViewDetails={handleViewCategoryBreakdown}
          >
            <div className="space-y-3 mb-4">
              {topCategoriesData.map((category) => (
                <div key={category.name}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm text-[var(--text-primary)]">
                      {category.name}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-[var(--text-primary)] tabular-nums">
                        {formatCurrency(category.amount)}₫
                      </span>
                      <span className="text-xs text-[var(--text-secondary)] tabular-nums">
                        {category.percentage}%
                      </span>
                    </div>
                  </div>
                  <div className="h-2 bg-[var(--surface)] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${category.percentage}%`,
                        backgroundColor: category.color,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </InsightCard>

          {/* Income vs Expense */}
          <InsightCard
            title="Thu nhập & Chi tiêu"
            icon={<DollarSign className="w-5 h-5 text-[var(--primary)]" />}
            onViewDetails={handleViewIncomeExpense}
          >
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={incomeExpenseData}>
                  <XAxis
                    dataKey="month"
                    tick={{ fill: "var(--text-tertiary)", fontSize: 12 }}
                    tickLine={false}
                    axisLine={{ stroke: "var(--divider)" }}
                  />
                  <YAxis
                    tick={{ fill: "var(--text-tertiary)", fontSize: 12 }}
                    tickLine={false}
                    axisLine={{ stroke: "var(--divider)" }}
                    tickFormatter={(value) =>
                      `${(value / 1000000).toFixed(0)}M`
                    }
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--card)",
                      border: "1px solid var(--border)",
                      borderRadius: "var(--radius-lg)",
                      fontSize: "12px",
                    }}
                    formatter={(value: number) => `${formatCurrency(value)}₫`}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: "12px" }}
                    formatter={(value) =>
                      value === "income" ? "Thu nhập" : "Chi tiêu"
                    }
                  />
                  <Bar
                    dataKey="income"
                    fill="var(--success)"
                    radius={[8, 8, 0, 0]}
                  />
                  <Bar
                    dataKey="expense"
                    fill="var(--danger)"
                    radius={[8, 8, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </InsightCard>
        </div>

        {/* Account Distribution */}
        <InsightCard
          title="Phân bổ tài khoản"
          icon={<Wallet className="w-5 h-5 text-[var(--primary)]" />}
          onViewDetails={handleViewAccountDistribution}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RePieChart>
                  <Pie
                    data={accountDistributionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="amount"
                  >
                    {accountDistributionData.map((entry, index) => (
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
                      "Số dư",
                    ]}
                  />
                </RePieChart>
              </ResponsiveContainer>
            </div>

            <div className="flex flex-col justify-center space-y-4">
              {accountDistributionData.map((account) => (
                <div key={account.name} className="flex items-center gap-3">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: account.color }}
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-[var(--text-primary)]">
                      {account.name}
                    </p>
                    <p className="text-xs text-[var(--text-secondary)] tabular-nums">
                      {account.percentage}% &bull;{" "}
                      {formatCurrency(account.amount)}₫
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </InsightCard>

        {/* Export Button */}
        {/* Moved to header */}
      </div>
    </div>
  );
}

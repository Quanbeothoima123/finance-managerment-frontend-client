import React, { useState, useMemo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  ArrowLeft,
  Share2,
  Download,
  Copy,
  FileText,
  X,
  ChevronLeft,
  ChevronRight,
  ShoppingBag,
  Receipt,
  CalendarDays,
  PiggyBank,
  TrendingUp,
  TrendingDown,
  Plus,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
} from "recharts";
import { Card } from "../components/Card";
import { useAppNavigation } from "../hooks/useAppNavigation";
import { useTransactionsList } from "../hooks/useTransactionsList";
import { useCategoriesList } from "../hooks/useCategoriesList";
import { useBudgetsList } from "../hooks/useBudgetsList";
import { useToast } from "../contexts/ToastContext";

const fmt = (n: number, loc = "vi-VN") => new Intl.NumberFormat(loc).format(Math.abs(n));

const CATEGORY_COLORS = [
  "#ef4444",
  "#8b5cf6",
  "#3b82f6",
  "#f59e0b",
  "#10b981",
  "#ec4899",
  "#6366f1",
  "#14b8a6",
];

interface Bullet {
  icon: React.ReactNode;
  label: string;
  color: string;
}

// ── Share Bottom Sheet ──────────────────────────────────────────────────────
function ShareSheet({
  isOpen,
  onClose,
  monthLabel,
  metrics,
  bullets,
  onPng,
  onCopy,
  onPdf,
  labels,
}: {
  isOpen: boolean;
  onClose: () => void;
  monthLabel: string;
  metrics: { spending: number; income: number; net: number };
  bullets: Bullet[];
  onPng: () => void;
  onCopy: () => void;
  onPdf: () => void;
  labels: {
    title: string; headerLabel: string; personalFinance: string;
    expense: string; income: string; net: string;
    downloadPng: string; downloadPdf: string; copyText: string;
  };
}) {
  if (!isOpen) return null;
  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-end md:items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-[var(--card)] rounded-t-[var(--radius-xl)] md:rounded-[var(--radius-xl)] p-6 w-full max-w-md max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">
            {labels.title}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-[var(--radius-md)] hover:bg-[var(--surface)] transition-colors"
          >
            <X className="w-5 h-5 text-[var(--text-secondary)]" />
          </button>
        </div>

        {/* Mini poster thumbnail */}
        <div className="rounded-[var(--radius-lg)] overflow-hidden border border-[var(--border)] mb-5 scale-[0.92] origin-top">
          <div className="bg-gradient-to-br from-[var(--primary)] to-[var(--primary-hover)] p-4 text-white">
            <p className="text-[10px] text-white/60">{labels.headerLabel}</p>
            <p className="text-sm font-semibold">{monthLabel}</p>
            <p className="text-[10px] text-white/50 mt-0.5">
              {labels.personalFinance}
            </p>
          </div>
          <div className="p-3 bg-[var(--card)]">
            <div className="grid grid-cols-3 gap-2 mb-3">
              <div className="text-center">
                <p className="text-[9px] text-[var(--text-tertiary)]">
                  {labels.expense}
                </p>
                <p className="text-xs font-bold text-[var(--danger)] tabular-nums">
                  {fmt(metrics.spending)}₫
                </p>
              </div>
              <div className="text-center">
                <p className="text-[9px] text-[var(--text-tertiary)]">
                  {labels.income}
                </p>
                <p className="text-xs font-bold text-[var(--success)] tabular-nums">
                  {fmt(metrics.income)}₫
                </p>
              </div>
              <div className="text-center">
                <p className="text-[9px] text-[var(--text-tertiary)]">{labels.net}</p>
                <p
                  className={`text-xs font-bold tabular-nums ${metrics.net >= 0 ? "text-[var(--success)]" : "text-[var(--danger)]"}`}
                >
                  {metrics.net >= 0 ? "+" : "-"}
                  {fmt(metrics.net)}₫
                </p>
              </div>
            </div>
            <div className="space-y-1 mb-2">
              {bullets.slice(0, 3).map((b, i) => (
                <p
                  key={i}
                  className="text-[10px] text-[var(--text-secondary)] truncate"
                >
                  • {b.label}
                </p>
              ))}
            </div>
            <div className="pt-2 border-t border-[var(--divider)] text-center">
              <span className="text-[9px] text-[var(--text-tertiary)]">
                {t('monthly_summary.poster.footer_app')} • {t('monthly_summary.poster.header_label')}
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={onPng}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white rounded-[var(--radius-lg)] font-medium transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>{labels.downloadPng}</span>
          </button>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={onPdf}
              className="flex items-center justify-center gap-2 px-4 py-2.5 border border-[var(--border)] text-[var(--text-primary)] rounded-[var(--radius-lg)] font-medium hover:bg-[var(--surface)] transition-colors text-sm"
            >
              <FileText className="w-4 h-4" />
              <span>{labels.downloadPdf}</span>
            </button>
            <button
              onClick={onCopy}
              className="flex items-center justify-center gap-2 px-4 py-2.5 border border-[var(--border)] text-[var(--text-primary)] rounded-[var(--radius-lg)] font-medium hover:bg-[var(--surface)] transition-colors text-sm"
            >
              <Copy className="w-4 h-4" />
              <span>{labels.copyText}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════════════
export default function MonthlySummaryReport() {
  const { t, i18n } = useTranslation('reports');
  const locale = i18n.language === 'vi' ? 'vi-VN' : 'en-US';
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const [monthDate, setMonthDate] = useState(
    new Date(`${now.getFullYear()}-${pad(now.getMonth() + 1)}-01`),
  );
  const [showShare, setShowShare] = useState(false);
  const nav = useAppNavigation();
  const toast = useToast();

  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const monthKey = `${year}-${pad(month + 1)}`;
  const monthLabel = t('monthly_summary.poster.month_label', { month: pad(month + 1), year });

  const shiftMonth = (delta: number) => {
    const d = new Date(monthDate);
    d.setMonth(d.getMonth() + delta);
    setMonthDate(d);
  };

  const isThisMonth = year === now.getFullYear() && month === now.getMonth();
  const isLastMonth =
    (year === now.getFullYear() && month === now.getMonth() - 1) ||
    (now.getMonth() === 0 && year === now.getFullYear() - 1 && month === 11);

  // ── Data fetching ──
  const monthStart = new Date(year, month, 1);
  const monthEnd = new Date(year, month + 1, 0);
  const txnQuery = useMemo(
    () => ({
      startDate: `${monthStart.getFullYear()}-${pad(monthStart.getMonth() + 1)}-01`,
      endDate: `${monthEnd.getFullYear()}-${pad(monthEnd.getMonth() + 1)}-${pad(monthEnd.getDate())}`,
      limit: 100,
      sortBy: "date" as const,
      sortOrder: "desc" as const,
    }),
    [monthKey],
  );
  const { data: txnData, loading: txnLoading } = useTransactionsList(txnQuery);
  const monthTxns = txnData?.items ?? [];
  const isTruncated = (txnData?.pagination?.total ?? 0) > (txnData?.items?.length ?? 0);

  const { data: catData } = useCategoriesList();
  const { data: budgetData } = useBudgetsList({ month: monthKey });

  const minor = (s: string | null | undefined) => parseInt(s || "0", 10) || 0;

  const expenses = useMemo(
    () => monthTxns.filter((t) => t.type === "expense"),
    [monthTxns],
  );
  const incomes = useMemo(
    () => monthTxns.filter((t) => t.type === "income"),
    [monthTxns],
  );
  const totalSpending = expenses.reduce(
    (s, t) => s + minor(t.totalAmountMinor),
    0,
  );
  const totalIncome = incomes.reduce(
    (s, t) => s + minor(t.totalAmountMinor),
    0,
  );
  const netBalance = totalIncome - totalSpending;
  const savingsRate = totalIncome > 0 ? (netBalance / totalIncome) * 100 : 0;

  // Category lookup
  const catLookup = useMemo(() => {
    const m: Record<string, { name: string; color: string }> = {};
    (catData?.items ?? []).forEach((c) => {
      m[c.id] = { name: c.name, color: c.colorHex || c.color || "#6b7280" };
    });
    return m;
  }, [catData]);

  // ── Highlights / Bullets ──
  const bullets: Bullet[] = useMemo(() => {
    const result: Bullet[] = [];
    if (expenses.length === 0) return result;

    // Top category
    const catMap: Record<string, number> = {};
    expenses.forEach((t) => {
      const k = t.category?.id || "unknown";
      catMap[k] = (catMap[k] || 0) + minor(t.totalAmountMinor);
    });
    const sorted = Object.entries(catMap).sort(([, a], [, b]) => b - a);
    const topCat = sorted[0];
    if (topCat) {
      const name =
        catLookup[topCat[0]]?.name ||
        expenses.find((t) => t.category?.id === topCat[0])?.category?.name ||
        topCat[0];
      const pct =
        totalSpending > 0 ? Math.round((topCat[1] / totalSpending) * 100) : 0;
      result.push({
        icon: <ShoppingBag className="w-4 h-4" />,
        label: `${name} ${fmt(topCat[1], locale)}₫ (${pct}%)`,
        color: "text-[var(--primary)]",
      });
    }

    // Biggest transaction
    const biggest = [...expenses].sort(
      (a, b) => minor(b.totalAmountMinor) - minor(a.totalAmountMinor),
    )[0];
    if (biggest) {
      result.push({
        icon: <Receipt className="w-4 h-4" />,
        label: `${biggest.description || biggest.category?.name || t('monthly_summary.poster.header_label')} ${fmt(minor(biggest.totalAmountMinor), locale)}₫`,
        color: "text-[var(--warning)]",
      });
    }

    // Peak day
    const DAYS = t('monthly_summary.bullets.day_short', { returnObjects: true }) as string[];
    const dayMap: Record<number, number> = {};
    expenses.forEach((t) => {
      const d = new Date(t.date || t.occurredAt).getDay();
      dayMap[d] = (dayMap[d] || 0) + minor(t.totalAmountMinor);
    });
    const peak = Object.entries(dayMap).sort(([, a], [, b]) => b - a)[0];
    if (peak) {
      result.push({
        icon: <CalendarDays className="w-4 h-4" />,
        label: t('monthly_summary.bullets.peak_day', { day: DAYS[parseInt(peak[0])], amount: fmt(peak[1], locale) }),
        color: "text-[var(--danger)]",
      });
    }

    // Budget status
    const activeBudgets = budgetData?.items ?? [];
    for (const b of activeBudgets) {
      if (b.progressPercent >= 50) {
        result.push({
          icon: <PiggyBank className="w-4 h-4" />,
          label: t('monthly_summary.bullets.budget_usage', { name: b.name, pct: b.progressPercent }),
          color:
            b.progressPercent >= 80
              ? "text-[var(--danger)]"
              : "text-[var(--warning)]",
        });
        break;
      }
    }

    // Savings rate
    if (totalIncome > 0) {
      result.push({
        icon:
          savingsRate >= 0 ? (
            <TrendingUp className="w-4 h-4" />
          ) : (
            <TrendingDown className="w-4 h-4" />
          ),
        label: t('monthly_summary.bullets.savings_rate', { rate: savingsRate.toFixed(1) }),
        color:
          savingsRate >= 0 ? "text-[var(--success)]" : "text-[var(--danger)]",
      });
    }

    return result.slice(0, 5);
  }, [
    expenses,
    catLookup,
    totalSpending,
    budgetData,
    totalIncome,
    savingsRate,
    t,
    locale,
  ]);

  // ── Top 3 categories with colors ──
  const top3Cats = useMemo(() => {
    const catMap: Record<string, number> = {};
    expenses.forEach((t) => {
      const k = t.category?.id || "unknown";
      catMap[k] = (catMap[k] || 0) + minor(t.totalAmountMinor);
    });
    return Object.entries(catMap)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([id, amount], i) => ({
        name:
          catLookup[id]?.name ||
          expenses.find((t) => t.category?.id === id)?.category?.name ||
          id,
        amount,
        pct: totalSpending > 0 ? Math.round((amount / totalSpending) * 100) : 0,
        color: catLookup[id]?.color || CATEGORY_COLORS[i],
      }));
  }, [expenses, catLookup, totalSpending]);

  // ── Weekly spending chart (4 weeks) ──
  const weeklyChart = useMemo(() => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const weeks: { label: string; amount: number }[] = [];
    let d = new Date(firstDay);
    let wk = 1;
    while (d <= lastDay) {
      const weekEnd = new Date(d);
      weekEnd.setDate(d.getDate() + 6);
      if (weekEnd > lastDay) weekEnd.setTime(lastDay.getTime());
      const amount = expenses
        .filter((t) => {
          const td = new Date(t.date || t.occurredAt);
          return td >= d && td <= weekEnd;
        })
        .reduce((s, t) => s + minor(t.totalAmountMinor), 0);
      weeks.push({ label: t('monthly_summary.poster.week_label', { n: wk }), amount });
      d = new Date(weekEnd);
      d.setDate(d.getDate() + 1);
      wk++;
      if (wk > 5) break;
    }
    return weeks;
  }, [year, month, expenses]);

  const maxWeekSpend = Math.max(...weeklyChart.map((w) => w.amount), 1);

  const hasData = monthTxns.length > 0;

  // ── Share actions ──
  const handleCopyText = useCallback(() => {
    const lines = [
      `📊 Tổng kết ${monthLabel}`,
      `💸 Chi tiêu: ${fmt(totalSpending)}₫`,
      `💰 Thu nhập: ${fmt(totalIncome)}₫`,
      `${netBalance >= 0 ? "✅" : "❌"} Ròng: ${netBalance >= 0 ? "+" : "-"}${fmt(Math.abs(netBalance))}₫`,
      "",
      ...bullets.map((b) => `• ${b.label}`),
      "",
      t('monthly_summary.poster.footer_generated', { date: new Date().toLocaleDateString(locale) }),
    ];
    navigator.clipboard
      .writeText(lines.join("\n"))
      .then(() => toast.success(t('monthly_summary.toast.copy_done')))
      .catch(() => toast.error(t('monthly_summary.toast.copy_failed')));
    setShowShare(false);
  }, [monthLabel, totalSpending, totalIncome, netBalance, bullets, toast]);

  const handlePng = useCallback(() => {
    toast.success(t('monthly_summary.toast.png_done'));
    setShowShare(false);
  }, [toast, t]);
  const handlePdf = useCallback(() => {
    toast.success(t('monthly_summary.toast.pdf_done'));
    setShowShare(false);
  }, [toast, t]);

  if (txnLoading) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[var(--primary)] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="max-w-3xl mx-auto p-4 md:p-6 pb-20 md:pb-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => nav.goBack()}
              className="p-2 rounded-[var(--radius-lg)] hover:bg-[var(--surface)] transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-[var(--text-secondary)]" />
            </button>
            <div>
              <h1 className="text-xl font-semibold text-[var(--text-primary)]">
                {t('monthly_summary.title')}
              </h1>
              <p className="text-sm text-[var(--text-secondary)]">
                {monthLabel}
              </p>
            </div>
          </div>
          {hasData && (
            <button
              onClick={() => setShowShare(true)}
              className="p-2.5 rounded-[var(--radius-lg)] hover:bg-[var(--surface)] border border-[var(--border)] transition-colors"
            >
              <Share2 className="w-5 h-5 text-[var(--text-secondary)]" />
            </button>
          )}
        </div>

        {/* Month Selector */}
        <div className="flex items-center gap-2">
          <button
            onClick={() =>
              setMonthDate(
                new Date(
                  `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`,
                ),
              )
            }
            className={`px-3 py-1.5 rounded-[var(--radius-md)] text-xs font-medium border transition-colors ${isThisMonth ? "border-[var(--primary)] bg-[var(--primary-light)] text-[var(--primary)]" : "border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--text-tertiary)]"}`}
          >
            {t('monthly_summary.this_month')}
          </button>
          <button
            onClick={() => {
              const d = new Date(now);
              d.setMonth(d.getMonth() - 1);
              setMonthDate(
                new Date(
                  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`,
                ),
              );
            }}
            className={`px-3 py-1.5 rounded-[var(--radius-md)] text-xs font-medium border transition-colors ${isLastMonth ? "border-[var(--primary)] bg-[var(--primary-light)] text-[var(--primary)]" : "border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--text-tertiary)]"}`}
          >
            {t('monthly_summary.last_month')}
          </button>
          <div className="flex items-center ml-auto gap-1">
            <button
              onClick={() => shiftMonth(-1)}
              className="p-1.5 rounded-[var(--radius-md)] hover:bg-[var(--surface)] transition-colors"
            >
              <ChevronLeft className="w-4 h-4 text-[var(--text-secondary)]" />
            </button>
            <span className="text-xs text-[var(--text-tertiary)] tabular-nums min-w-[100px] text-center">
              {monthLabel}
            </span>
            <button
              onClick={() => shiftMonth(1)}
              className="p-1.5 rounded-[var(--radius-md)] hover:bg-[var(--surface)] transition-colors"
            >
              <ChevronRight className="w-4 h-4 text-[var(--text-secondary)]" />
            </button>
          </div>
        </div>

        {/* Truncation warning */}
        {isTruncated && (
          <div className="flex items-center gap-2 px-4 py-2.5 bg-[var(--warning-light)] border border-[var(--warning)] text-[var(--warning)] rounded-[var(--radius-lg)] text-sm">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>
              {t('monthly_summary.truncation_warning', {
                shown: txnData?.items?.length,
                total: txnData?.pagination?.total,
              })}
            </span>
          </div>
        )}

        {!hasData ? (
          <Card>
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-[var(--surface)] rounded-full flex items-center justify-center mx-auto mb-4">
                <CalendarDays className="w-8 h-8 text-[var(--text-tertiary)]" />
              </div>
              <h3 className="font-semibold text-[var(--text-primary)] mb-2">
                {t('monthly_summary.empty.title')}
              </h3>
              <p className="text-sm text-[var(--text-secondary)] mb-6">
                {t('monthly_summary.empty.subtitle')}
              </p>
              <button
                onClick={() => nav.goCreateTransaction()}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white rounded-[var(--radius-lg)] font-medium transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>{t('monthly_summary.empty.add_transaction')}</span>
              </button>
            </div>
          </Card>
        ) : (
          /* ── Poster Preview ── */
          <div className="rounded-[var(--radius-xl)] overflow-hidden border border-[var(--border)] shadow-[var(--shadow-md)]">
            {/* Poster Header */}
            <div className="bg-gradient-to-br from-[var(--primary)] to-[var(--primary-hover)] p-6 text-white">
              <p className="text-xs text-white/60 mb-1">{t('monthly_summary.poster.header_label')}</p>
              <h2 className="text-2xl font-bold">{monthLabel}</h2>
              <p className="text-xs text-white/50 mt-1">{t('monthly_summary.poster.personal_finance')}</p>
            </div>

            <div className="bg-[var(--card)] p-5 space-y-6">
              {/* Metrics Row */}
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-3 rounded-[var(--radius-lg)] bg-[var(--danger-light)]">
                  <p className="text-[10px] text-[var(--text-tertiary)] mb-1">
                    {t('monthly_summary.stats.expense')}
                  </p>
                  <p className="text-lg font-bold text-[var(--danger)] tabular-nums">
                    {fmt(totalSpending)}₫
                  </p>
                </div>
                <div className="text-center p-3 rounded-[var(--radius-lg)] bg-[var(--success-light)]">
                  <p className="text-[10px] text-[var(--text-tertiary)] mb-1">
                    {t('monthly_summary.stats.income')}
                  </p>
                  <p className="text-lg font-bold text-[var(--success)] tabular-nums">
                    {fmt(totalIncome)}₫
                  </p>
                </div>
                <div
                  className={`text-center p-3 rounded-[var(--radius-lg)] ${netBalance >= 0 ? "bg-[var(--success-light)]" : "bg-[var(--danger-light)]"}`}
                >
                  <p className="text-[10px] text-[var(--text-tertiary)] mb-1">
                    {t('monthly_summary.stats.net')}
                  </p>
                  <p
                    className={`text-lg font-bold tabular-nums ${netBalance >= 0 ? "text-[var(--success)]" : "text-[var(--danger)]"}`}
                  >
                    {netBalance >= 0 ? "+" : "-"}
                    {fmt(Math.abs(netBalance))}₫
                  </p>
                </div>
              </div>

              {/* Highlights */}
              {bullets.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">
                    {t('monthly_summary.poster.highlights_title')}
                  </h3>
                  <div className="space-y-2.5">
                    {bullets.map((b, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-full bg-[var(--surface)] flex items-center justify-center flex-shrink-0 ${b.color}`}
                        >
                          {b.icon}
                        </div>
                        <p className="text-sm text-[var(--text-primary)]">
                          {b.label}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Top 3 Categories */}
              {top3Cats.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">
                    {t('monthly_summary.poster.top_categories_title')}
                  </h3>
                  <div className="space-y-3">
                    {top3Cats.map((cat, i) => (
                      <div key={i}>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-sm text-[var(--text-primary)]">
                            {cat.name}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-[var(--text-primary)] tabular-nums">
                              {fmt(cat.amount)}₫
                            </span>
                            <span className="text-xs text-[var(--text-tertiary)] tabular-nums">
                              {cat.pct}%
                            </span>
                          </div>
                        </div>
                        <div className="h-2 bg-[var(--surface)] rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${cat.pct}%`,
                              backgroundColor: cat.color,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Mini Chart — Spending by Week */}
              {weeklyChart.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">
                    {t('monthly_summary.poster.weekly_chart_title')}
                  </h3>
                  <div className="h-40">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={weeklyChart}
                        margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
                      >
                        <CartesianGrid
                          key="grid"
                          strokeDasharray="3 3"
                          stroke="var(--divider)"
                          vertical={false}
                        />
                        <XAxis
                          key="xaxis"
                          dataKey="label"
                          tick={{ fontSize: 11, fill: "var(--text-tertiary)" }}
                          tickLine={false}
                          axisLine={{ stroke: "var(--divider)" }}
                        />
                        <YAxis
                          key="yaxis"
                          tick={{ fontSize: 10, fill: "var(--text-tertiary)" }}
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(v: number) =>
                            v >= 1000000
                              ? `${(v / 1000000).toFixed(0)}M`
                              : `${(v / 1000).toFixed(0)}k`
                          }
                          width={36}
                        />
                        <Tooltip
                          key="tooltip"
                          contentStyle={{
                            background: "var(--card)",
                            border: "1px solid var(--border)",
                            borderRadius: "var(--radius-lg)",
                            fontSize: 12,
                          }}
                          formatter={(v: number) => [`${fmt(v, locale)}₫`, t('monthly_summary.tooltip.expense')]}
                        />
                        <Bar
                          key="bar-amount"
                          dataKey="amount"
                          radius={[6, 6, 0, 0]}
                        >
                          {weeklyChart.map((w, i) => (
                            <Cell
                              key={`cell-${i}`}
                              fill={
                                w.amount === maxWeekSpend
                                  ? "var(--danger)"
                                  : "var(--primary)"
                              }
                              fillOpacity={0.85}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Footer */}
              <div className="pt-4 border-t border-[var(--divider)] flex items-center justify-between">
                <span className="text-[10px] text-[var(--text-tertiary)]">
                  {t('monthly_summary.poster.footer_app')}
                </span>
                <span className="text-[10px] text-[var(--text-tertiary)]">
                  {t('monthly_summary.poster.footer_generated', { date: new Date().toLocaleDateString(locale) })}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Bottom Actions */}
        {hasData && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <button
              onClick={handlePng}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white rounded-[var(--radius-lg)] font-medium transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>{t('monthly_summary.bottom_actions.download_png')}</span>
            </button>
            <button
              onClick={handleCopyText}
              className="flex items-center justify-center gap-2 px-4 py-3 border border-[var(--border)] text-[var(--text-primary)] rounded-[var(--radius-lg)] font-medium hover:bg-[var(--surface)] transition-colors"
            >
              <Copy className="w-4 h-4" />
              <span>{t('monthly_summary.bottom_actions.copy_text')}</span>
            </button>
            <button
              onClick={() => setShowShare(true)}
              className="flex items-center justify-center gap-2 px-4 py-3 border border-[var(--border)] text-[var(--text-primary)] rounded-[var(--radius-lg)] font-medium hover:bg-[var(--surface)] transition-colors col-span-2 md:col-span-1"
            >
              <Share2 className="w-4 h-4" />
              <span>{t('monthly_summary.bottom_actions.share')}</span>
            </button>
          </div>
        )}

        <ShareSheet
          isOpen={showShare}
          onClose={() => setShowShare(false)}
          monthLabel={monthLabel}
          metrics={{
            spending: totalSpending,
            income: totalIncome,
            net: netBalance,
          }}
          bullets={bullets}
          onPng={handlePng}
          onCopy={handleCopyText}
          onPdf={handlePdf}
          labels={{
            title: t('monthly_summary.share_sheet.title'),
            headerLabel: t('monthly_summary.poster.header_label'),
            personalFinance: t('monthly_summary.poster.personal_finance'),
            expense: t('monthly_summary.stats.expense'),
            income: t('monthly_summary.stats.income'),
            net: t('monthly_summary.stats.net'),
            downloadPng: t('monthly_summary.share_sheet.download_png'),
            downloadPdf: t('monthly_summary.share_sheet.download_pdf'),
            copyText: t('monthly_summary.share_sheet.copy_text'),
          }}
        />
      </div>
    </div>
  );
}

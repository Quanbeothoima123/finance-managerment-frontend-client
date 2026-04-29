import React, { useState, useMemo, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  ArrowLeft,
  Share2,
  ShoppingBag,
  Receipt,
  CalendarDays,
  Wallet,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  ChevronLeft,
  ChevronRight,
  Copy,
  Download,
  X,
  Plus,
  Utensils,
  Car,
  Home as HomeIcon,
  Heart,
  Smile,
  BookOpen,
  Dumbbell,
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
import { Loader2 } from "lucide-react";
import { Card } from "../components/Card";
import { useAppNavigation } from "../hooks/useAppNavigation";
import { useTransactionsList } from "../hooks/useTransactionsList";
import { useBudgetsList } from "../hooks/useBudgetsList";
import { useToast } from "../contexts/ToastContext";

// ── Helpers ─────────────────────────────────────────────────────────────────
const minor = (s: string | null | undefined) => parseInt(s || "0", 10) || 0;
const fmt = (n: number, loc = "vi-VN") => new Intl.NumberFormat(loc).format(Math.abs(n));
const DAY_COLORS = [
  "#ef4444",
  "#3b82f6",
  "#8b5cf6",
  "#f59e0b",
  "#10b981",
  "#ec4899",
  "#14b8a6",
];

function getWeekRange(date: Date): [Date, Date] {
  const d = new Date(date);
  const day = d.getDay(); // 0=Sun
  const diffMon = day === 0 ? -6 : 1 - day;
  const mon = new Date(d);
  mon.setDate(d.getDate() + diffMon);
  mon.setHours(0, 0, 0, 0);
  const sun = new Date(mon);
  sun.setDate(mon.getDate() + 6);
  sun.setHours(23, 59, 59, 999);
  return [mon, sun];
}

function shiftWeek(date: Date, delta: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + delta * 7);
  return d;
}

type WeekPreset = "this" | "last" | "custom";

// Bullet icon mapping
const BULLET_ICONS: Record<string, React.ReactNode> = {
  "top-category": <ShoppingBag className="w-5 h-5" />,
  "biggest-txn": <Receipt className="w-5 h-5" />,
  "day-spike": <CalendarDays className="w-5 h-5" />,
  "account-insight": <Wallet className="w-5 h-5" />,
  "budget-warning": <AlertTriangle className="w-5 h-5" />,
};

const BULLET_COLORS: Record<string, string> = {
  "top-category": "bg-[var(--primary-light)] text-[var(--primary)]",
  "biggest-txn": "bg-[var(--warning-light)] text-[var(--warning)]",
  "day-spike": "bg-[var(--danger-light)] text-[var(--danger)]",
  "account-insight": "bg-[var(--info-light)] text-[var(--info)]",
  "budget-warning": "bg-[var(--warning-light)] text-[var(--warning)]",
};

interface StoryBullet {
  type: string;
  headline: string;
  detail: string;
}

// ── Share Bottom Sheet ──────────────────────────────────────────────────────
function ShareBottomSheet({
  isOpen,
  onClose,
  weekLabel,
  metrics,
  bullets,
  onCopyText,
  onDownloadPng,
  labels,
}: {
  isOpen: boolean;
  onClose: () => void;
  weekLabel: string;
  metrics: { spending: number; income: number; net: number };
  bullets: StoryBullet[];
  onCopyText: () => void;
  onDownloadPng: () => void;
  labels: {
    title: string; posterLabel: string; footerApp: string;
    expense: string; income: string; net: string;
    downloadPng: string; copyText: string;
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
        {/* Header */}
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

        {/* Poster Card Preview */}
        <div
          className="rounded-[var(--radius-lg)] overflow-hidden border border-[var(--border)] mb-5"
          id="recap-poster"
        >
          <div className="bg-gradient-to-br from-[var(--primary)] to-[var(--primary-hover)] p-5 text-white">
            <p className="text-xs text-white/70 mb-1">{labels.posterLabel}</p>
            <p className="text-sm font-semibold">{weekLabel}</p>
          </div>
          <div className="p-4 bg-[var(--card)]">
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="text-center">
                <p className="text-[10px] text-[var(--text-tertiary)] mb-0.5">
                  {labels.expense}
                </p>
                <p className="text-sm font-bold text-[var(--danger)] tabular-nums">
                  {fmt(metrics.spending)}₫
                </p>
              </div>
              <div className="text-center">
                <p className="text-[10px] text-[var(--text-tertiary)] mb-0.5">
                  {labels.income}
                </p>
                <p className="text-sm font-bold text-[var(--success)] tabular-nums">
                  {fmt(metrics.income)}₫
                </p>
              </div>
              <div className="text-center">
                <p className="text-[10px] text-[var(--text-tertiary)] mb-0.5">
                  {labels.net}
                </p>
                <p
                  className={`text-sm font-bold tabular-nums ${metrics.net >= 0 ? "text-[var(--success)]" : "text-[var(--danger)]"}`}
                >
                  {metrics.net >= 0 ? "+" : "-"}
                  {fmt(metrics.net)}₫
                </p>
              </div>
            </div>
            <div className="space-y-2">
              {bullets.slice(0, 3).map((b, i) => (
                <p key={i} className="text-xs text-[var(--text-secondary)]">
                  • {b.headline}
                </p>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t border-[var(--divider)] flex items-center justify-center">
              <span className="text-[10px] text-[var(--text-tertiary)]">
                {labels.footerApp}
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={onDownloadPng}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white rounded-[var(--radius-lg)] font-medium transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>{labels.downloadPng}</span>
          </button>
          <button
            onClick={onCopyText}
            className="flex items-center justify-center gap-2 px-4 py-3 border border-[var(--border)] text-[var(--text-primary)] rounded-[var(--radius-lg)] font-medium hover:bg-[var(--surface)] transition-colors"
          >
            <Copy className="w-4 h-4" />
            <span>{labels.copyText}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════════════
export default function WeeklyRecapDetail() {
  const { t, i18n } = useTranslation('reports');
  const locale = i18n.language === 'vi' ? 'vi-VN' : 'en-US';
  const DAY_NAMES = t('weekly_recap.day_names_short', { returnObjects: true }) as string[];
  const FULL_DAY_NAMES = t('weekly_recap.day_names_full', { returnObjects: true }) as string[];
  const fmtDate = (d: Date) => d.toLocaleDateString(locale, { day: '2-digit', month: '2-digit' });
  const [weekAnchor, setWeekAnchor] = useState(new Date());
  const [showShare, setShowShare] = useState(false);
  const nav = useAppNavigation();
  const toast = useToast();

  const [weekStart, weekEnd] = useMemo(
    () => getWeekRange(weekAnchor),
    [weekAnchor],
  );

  const pad = (n: number) => String(n).padStart(2, "0");
  const startStr = `${weekStart.getFullYear()}-${pad(weekStart.getMonth() + 1)}-${pad(weekStart.getDate())}`;
  const endStr = `${weekEnd.getFullYear()}-${pad(weekEnd.getMonth() + 1)}-${pad(weekEnd.getDate())}`;
  const monthKey = `${weekStart.getFullYear()}-${pad(weekStart.getMonth() + 1)}`;

  const {
    data: txnData,
    loading: txnLoading,
    reload: reloadTxn,
  } = useTransactionsList({
    startDate: startStr,
    endDate: endStr,
    limit: 100,
  });
  const isTruncated = (txnData?.pagination?.total ?? 0) > (txnData?.items?.length ?? 0);
  const { data: budgetData, loading: budgetLoading } = useBudgetsList({
    month: monthKey,
  });

  const weekLabel = `${fmtDate(weekStart)} – ${fmtDate(weekEnd)}`;
  const loading = txnLoading || budgetLoading;

  const weekTxns = txnData?.items ?? [];

  const weekExpenses = useMemo(
    () => weekTxns.filter((t: any) => t.type === "expense"),
    [weekTxns],
  );
  const weekIncome = useMemo(
    () => weekTxns.filter((t: any) => t.type === "income"),
    [weekTxns],
  );

  const totalSpending = weekExpenses.reduce(
    (s: number, t: any) => s + Math.abs(minor(t.totalAmountMinor)),
    0,
  );
  const totalIncome = weekIncome.reduce(
    (s: number, t: any) => s + Math.abs(minor(t.totalAmountMinor)),
    0,
  );
  const netBalance = totalIncome - totalSpending;

  // ── Build story bullets ──
  const bullets: StoryBullet[] = useMemo(() => {
    const result: StoryBullet[] = [];
    if (weekExpenses.length === 0) return result;

    // 1) Top category
    const catMap: Record<string, { name: string; total: number }> = {};
    weekExpenses.forEach((t: any) => {
      const key = t.category?.id || "uncategorized";
      if (!catMap[key])
        catMap[key] = { name: t.category?.name || "Khác", total: 0 };
      catMap[key].total += Math.abs(minor(t.totalAmountMinor));
    });
    const topCat = Object.values(catMap).sort((a, b) => b.total - a.total)[0];
    if (topCat) {
      const pct =
        totalSpending > 0
          ? Math.round((topCat.total / totalSpending) * 100)
          : 0;
      result.push({
        type: "top-category",
        headline: t('weekly_recap.bullets.top_category_headline', { name: topCat.name, amount: fmt(topCat.total, locale), pct }),
        detail: t('weekly_recap.bullets.top_category_detail', { name: topCat.name, pct }),
      });
    }

    // 2) Biggest transaction
    const biggest = [...weekExpenses].sort(
      (a: any, b: any) =>
        Math.abs(minor(b.totalAmountMinor)) -
        Math.abs(minor(a.totalAmountMinor)),
    )[0];
    if (biggest) {
      result.push({
        type: "biggest-txn",
        headline: t('weekly_recap.bullets.biggest_txn_headline', { name: biggest.description || biggest.category?.name || t('weekly_recap.stats.expense'), amount: fmt(minor(biggest.totalAmountMinor), locale) }),
        detail: t('weekly_recap.bullets.biggest_txn_detail', { name: biggest.description || '', date: fmtDate(new Date(biggest.date || biggest.occurredAt)) }),
      });
    }

    // 3) Peak spending day
    const dayMap: Record<number, number> = {};
    weekExpenses.forEach((t: any) => {
      const day = new Date(t.date || t.occurredAt).getDay();
      dayMap[day] = (dayMap[day] || 0) + Math.abs(minor(t.totalAmountMinor));
    });
    const peakDay = Object.entries(dayMap).sort(([, a], [, b]) => b - a)[0];
    if (peakDay) {
      result.push({
        type: "day-spike",
        headline: t('weekly_recap.bullets.day_spike_headline', { day: FULL_DAY_NAMES[parseInt(peakDay[0])], amount: fmt(peakDay[1], locale) }),
        detail: t('weekly_recap.bullets.day_spike_detail', { day: FULL_DAY_NAMES[parseInt(peakDay[0])] }),
      });
    }

    // 4) Account insight — account with biggest balance decrease
    const accDelta: Record<string, { name: string; delta: number }> = {};
    weekTxns.forEach((t: any) => {
      const accId = t.account?.id || "unknown";
      const accName = t.account?.name || "Tài khoản";
      if (t.type === "expense") {
        if (!accDelta[accId]) accDelta[accId] = { name: accName, delta: 0 };
        accDelta[accId].delta -= Math.abs(minor(t.totalAmountMinor));
      } else if (t.type === "income") {
        if (!accDelta[accId]) accDelta[accId] = { name: accName, delta: 0 };
        accDelta[accId].delta += Math.abs(minor(t.totalAmountMinor));
      }
    });
    const biggestDrop = Object.values(accDelta).sort(
      (a, b) => a.delta - b.delta,
    )[0];
    if (biggestDrop && biggestDrop.delta < 0) {
      result.push({
        type: "account-insight",
        headline: t('weekly_recap.bullets.account_insight_headline', { account: biggestDrop.name, amount: fmt(Math.abs(biggestDrop.delta), locale) }),
        detail: t('weekly_recap.bullets.account_insight_detail', { account: biggestDrop.name }),
      });
    }

    // 5) Budget warning
    const budgets = budgetData?.items ?? [];
    const activeBudgets = budgets.filter((b: any) => b.status === "active");
    for (const b of activeBudgets) {
      const pctUsed = Math.round(b.progressPercent ?? 0);
      if (pctUsed >= 70) {
        const spent = minor(b.spentMinor);
        const limit = minor(b.amountMinor);
        result.push({
          type: "budget-warning",
          headline: t('weekly_recap.bullets.budget_warning_headline', { name: b.name, pct: pctUsed }),
          detail: t('weekly_recap.bullets.budget_warning_detail', { spent: fmt(spent, locale), limit: fmt(limit, locale) }),
        });
        break; // Only 1 budget warning
      }
    }

    return result.slice(0, 5);
  }, [weekExpenses, weekTxns, totalSpending, budgetData, t, locale, DAY_NAMES, FULL_DAY_NAMES, fmtDate]);

  // ── Daily spending chart data ──
  const dailyChartData = useMemo(() => {
    const result: { day: string; amount: number; fullDay: string }[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + i);
      const dayOfWeek = d.getDay();
      const dayStr = d.toISOString().split("T")[0];
      const amount = weekExpenses
        .filter((t: any) => (t.date || t.occurredAt?.split("T")[0]) === dayStr)
        .reduce(
          (s: number, t: any) => s + Math.abs(minor(t.totalAmountMinor)),
          0,
        );
      result.push({
        day: DAY_NAMES[dayOfWeek],
        amount,
        fullDay: FULL_DAY_NAMES[dayOfWeek],
      });
    }
    return result;
  }, [weekStart, weekExpenses]);

  const maxDailySpend = Math.max(...dailyChartData.map((d) => d.amount), 1);

  // ── Week presets ──
  const [thisWeekStart] = getWeekRange(new Date());
  const isThisWeek = weekStart.getTime() === thisWeekStart.getTime();
  const [lastWeekStart] = getWeekRange(shiftWeek(new Date(), -1));
  const isLastWeek = weekStart.getTime() === lastWeekStart.getTime();

  // ── Share actions ──
  const handleCopyText = useCallback(() => {
    const lines = [
      `📊 Recap tuần ${weekLabel}`,
      `💸 ${t('weekly_recap.stats.expense')}: ${fmt(totalSpending, locale)}₫`,
      `💰 ${t('weekly_recap.stats.income')}: ${fmt(totalIncome, locale)}₫`,
      `${netBalance >= 0 ? "✅" : "❌"} ${t('weekly_recap.stats.net')}: ${netBalance >= 0 ? "+" : "-"}${fmt(Math.abs(netBalance), locale)}₫`,
      "",
      ...bullets.map((b) => `• ${b.headline}`),
    ];
    navigator.clipboard
      .writeText(lines.join("\n"))
      .then(() => {
        toast.success(t('weekly_recap.toast.copy_done'));
      })
      .catch(() => {
        toast.error(t('weekly_recap.toast.copy_failed'));
      });
    setShowShare(false);
  }, [weekLabel, totalSpending, totalIncome, netBalance, bullets, toast, t, locale]);

  const handleDownloadPng = useCallback(() => {
    toast.success(t('weekly_recap.toast.png_done'));
    setShowShare(false);
  }, [toast, t]);

  const handleViewTransactions = () => {
    nav.goTransactions();
  };

  const hasData = weekTxns.length > 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="max-w-3xl mx-auto p-4 md:p-6 pb-28 md:pb-6 space-y-6">
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
                {t('weekly_recap.title')}
              </h1>
              <p className="text-sm text-[var(--text-secondary)]">
                {weekLabel}
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

        {/* Week Selector */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setWeekAnchor(new Date())}
            className={`px-3 py-1.5 rounded-[var(--radius-md)] text-xs font-medium border transition-colors ${isThisWeek ? "border-[var(--primary)] bg-[var(--primary-light)] text-[var(--primary)]" : "border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--text-tertiary)]"}`}
          >
            {t('weekly_recap.this_week')}
          </button>
          <button
            onClick={() => setWeekAnchor(shiftWeek(new Date(), -1))}
            className={`px-3 py-1.5 rounded-[var(--radius-md)] text-xs font-medium border transition-colors ${isLastWeek ? "border-[var(--primary)] bg-[var(--primary-light)] text-[var(--primary)]" : "border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--text-tertiary)]"}`}
          >
            {t('weekly_recap.last_week')}
          </button>
          <div className="flex items-center ml-auto gap-1">
            <button
              onClick={() => setWeekAnchor(shiftWeek(weekAnchor, -1))}
              className="p-1.5 rounded-[var(--radius-md)] hover:bg-[var(--surface)] transition-colors"
            >
              <ChevronLeft className="w-4 h-4 text-[var(--text-secondary)]" />
            </button>
            <span className="text-xs text-[var(--text-tertiary)] tabular-nums min-w-[120px] text-center">
              {weekLabel}
            </span>
            <button
              onClick={() => setWeekAnchor(shiftWeek(weekAnchor, 1))}
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
              {t('weekly_recap.truncation_warning', {
                shown: txnData?.items?.length,
                total: txnData?.pagination?.total,
              })}
            </span>
          </div>
        )}

        {!hasData ? (
          /* Empty State */
          <Card>
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-[var(--surface)] rounded-full flex items-center justify-center mx-auto mb-4">
                <CalendarDays className="w-8 h-8 text-[var(--text-tertiary)]" />
              </div>
              <h3 className="font-semibold text-[var(--text-primary)] mb-2">
                {t('weekly_recap.empty.title')}
              </h3>
              <p className="text-sm text-[var(--text-secondary)] mb-6">
                {t('weekly_recap.empty.subtitle')}
              </p>
              <button
                onClick={() => nav.goCreateTransaction()}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white rounded-[var(--radius-lg)] font-medium transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>{t('weekly_recap.empty.add_transaction')}</span>
              </button>
            </div>
          </Card>
        ) : (
          <>
            {/* B2: Hero Summary */}
            <div className="grid grid-cols-3 gap-3">
              <Card className="bg-[var(--danger-light)]">
                <p className="text-xs text-[var(--text-secondary)] mb-1">
                  {t('weekly_recap.stats.expense')}
                </p>
                <p className="text-lg md:text-xl font-bold text-[var(--danger)] tabular-nums">
                  {fmt(totalSpending, locale)}₫
                </p>
                <p className="text-[10px] text-[var(--text-tertiary)] mt-0.5">
                  {t('weekly_recap.stats.txn_count', { count: weekExpenses.length })}
                </p>
              </Card>
              <Card className="bg-[var(--success-light)]">
                <p className="text-xs text-[var(--text-secondary)] mb-1">
                  {t('weekly_recap.stats.income')}
                </p>
                <p className="text-lg md:text-xl font-bold text-[var(--success)] tabular-nums">
                  {fmt(totalIncome, locale)}₫
                </p>
                <p className="text-[10px] text-[var(--text-tertiary)] mt-0.5">
                  {t('weekly_recap.stats.txn_count', { count: weekIncome.length })}
                </p>
              </Card>
              <Card
                className={
                  netBalance >= 0
                    ? "bg-[var(--success-light)]"
                    : "bg-[var(--danger-light)]"
                }
              >
                <p className="text-xs text-[var(--text-secondary)] mb-1">
                  {t('weekly_recap.stats.net')}
                </p>
                <p
                  className={`text-lg md:text-xl font-bold tabular-nums ${netBalance >= 0 ? "text-[var(--success)]" : "text-[var(--danger)]"}`}
                >
                  {netBalance >= 0 ? "+" : "-"}
                  {fmt(Math.abs(netBalance), locale)}₫
                </p>
                <p className="text-[10px] text-[var(--text-tertiary)] mt-0.5 flex items-center gap-0.5">
                  {netBalance >= 0 ? (
                    <TrendingUp className="w-3 h-3" />
                  ) : (
                    <TrendingDown className="w-3 h-3" />
                  )}
                  {netBalance >= 0 ? t('weekly_recap.stats.surplus') : t('weekly_recap.stats.deficit')}
                </p>
              </Card>
            </div>

            {/* B3: Story Bullets */}
            {bullets.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <h2 className="font-semibold text-[var(--text-primary)]">
                    {t('weekly_recap.highlights.title')}
                  </h2>
                  <span className="px-2 py-0.5 rounded-full bg-[var(--primary-light)] text-[var(--primary)] text-[10px] font-medium">
                    {t('weekly_recap.highlights.count_badge', { count: bullets.length })}
                  </span>
                </div>
                {bullets.map((b, i) => (
                  <Card key={i}>
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-10 h-10 rounded-[var(--radius-lg)] flex items-center justify-center flex-shrink-0 ${BULLET_COLORS[b.type] || "bg-[var(--surface)] text-[var(--text-tertiary)]"}`}
                      >
                        {BULLET_ICONS[b.type] || (
                          <Receipt className="w-5 h-5" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[var(--text-primary)]">
                          {b.headline}
                        </p>
                        <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                          {b.detail}
                        </p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {/* B4: Daily Spending Chart */}
            <Card>
              <h3 className="font-semibold text-[var(--text-primary)] mb-4">
                {t('weekly_recap.chart.title')}
              </h3>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={dailyChartData}
                    margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="var(--divider)"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="day"
                      tick={{ fontSize: 12, fill: "var(--text-tertiary)" }}
                      tickLine={false}
                      axisLine={{ stroke: "var(--divider)" }}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: "var(--text-tertiary)" }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v: number) =>
                        v >= 1000000
                          ? `${(v / 1000000).toFixed(0)}M`
                          : `${(v / 1000).toFixed(0)}k`
                      }
                      width={40}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "var(--card)",
                        border: "1px solid var(--border)",
                        borderRadius: "var(--radius-lg)",
                        fontSize: 12,
                      }}
                      formatter={(v: number) => [`${fmt(v, locale)}₫`, t('weekly_recap.chart.tooltip_label')]}
                      labelFormatter={(label: string) => label}
                    />
                    <Bar dataKey="amount" radius={[6, 6, 0, 0]}>
                      {dailyChartData.map((entry, i) => (
                        <Cell
                          key={i}
                          fill={
                            entry.amount === maxDailySpend
                              ? "var(--danger)"
                              : "var(--primary)"
                          }
                          fillOpacity={entry.amount === 0 ? 0.2 : 0.85}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </>
        )}

        {/* B5: Sticky Bottom Actions */}
        {hasData && (
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-[var(--background)] border-t border-[var(--divider)] md:static md:border-0 md:p-0 md:bg-transparent z-40">
            <div className="max-w-3xl mx-auto grid grid-cols-2 gap-3">
              <button
                onClick={() => setShowShare(true)}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white rounded-[var(--radius-lg)] font-medium transition-colors"
              >
                <Share2 className="w-4 h-4" />
                <span>{t('weekly_recap.bottom_actions.share')}</span>
              </button>
              <button
                onClick={handleViewTransactions}
                className="flex items-center justify-center gap-2 px-4 py-3 border border-[var(--border)] text-[var(--text-primary)] rounded-[var(--radius-lg)] font-medium hover:bg-[var(--surface)] transition-colors"
              >
                <Receipt className="w-4 h-4" />
                <span>{t('weekly_recap.bottom_actions.view_transactions')}</span>
              </button>
            </div>
          </div>
        )}

        {/* Share Sheet */}
        <ShareBottomSheet
          isOpen={showShare}
          onClose={() => setShowShare(false)}
          weekLabel={weekLabel}
          metrics={{
            spending: totalSpending,
            income: totalIncome,
            net: netBalance,
          }}
          bullets={bullets}
          onCopyText={handleCopyText}
          onDownloadPng={handleDownloadPng}
          labels={{
            title: t('weekly_recap.share_sheet.title'),
            posterLabel: t('weekly_recap.share_sheet.poster_label'),
            footerApp: t('weekly_recap.share_sheet.footer_app'),
            expense: t('weekly_recap.stats.expense'),
            income: t('weekly_recap.stats.income'),
            net: t('weekly_recap.stats.net'),
            downloadPng: t('weekly_recap.share_sheet.download_png'),
            copyText: t('weekly_recap.share_sheet.copy_text'),
          }}
        />
      </div>
    </div>
  );
}

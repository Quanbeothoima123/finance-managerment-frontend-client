import React, { useState, useMemo, useRef, useCallback } from "react";
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
import { Card } from "../components/Card";
import { useAppNavigation } from "../hooks/useAppNavigation";
import { useDemoData } from "../contexts/DemoDataContext";
import { useToast } from "../contexts/ToastContext";

// ── Helpers ─────────────────────────────────────────────────────────────────
const fmt = (n: number) => new Intl.NumberFormat("vi-VN").format(Math.abs(n));
const fmtDate = (d: Date) =>
  d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });

const DAY_NAMES = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
const FULL_DAY_NAMES = [
  "Chủ nhật",
  "Thứ 2",
  "Thứ 3",
  "Thứ 4",
  "Thứ 5",
  "Thứ 6",
  "Thứ 7",
];
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
}: {
  isOpen: boolean;
  onClose: () => void;
  weekLabel: string;
  metrics: { spending: number; income: number; net: number };
  bullets: StoryBullet[];
  onCopyText: () => void;
  onDownloadPng: () => void;
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
            Chia sẻ recap
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
            <p className="text-xs text-white/70 mb-1">Recap tuần</p>
            <p className="text-sm font-semibold">{weekLabel}</p>
          </div>
          <div className="p-4 bg-[var(--card)]">
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="text-center">
                <p className="text-[10px] text-[var(--text-tertiary)] mb-0.5">
                  Chi tiêu
                </p>
                <p className="text-sm font-bold text-[var(--danger)] tabular-nums">
                  {fmt(metrics.spending)}₫
                </p>
              </div>
              <div className="text-center">
                <p className="text-[10px] text-[var(--text-tertiary)] mb-0.5">
                  Thu nhập
                </p>
                <p className="text-sm font-bold text-[var(--success)] tabular-nums">
                  {fmt(metrics.income)}₫
                </p>
              </div>
              <div className="text-center">
                <p className="text-[10px] text-[var(--text-tertiary)] mb-0.5">
                  Ròng
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
                FinanceApp • Weekly Recap
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
            <span>Tải ảnh (PNG)</span>
          </button>
          <button
            onClick={onCopyText}
            className="flex items-center justify-center gap-2 px-4 py-3 border border-[var(--border)] text-[var(--text-primary)] rounded-[var(--radius-lg)] font-medium hover:bg-[var(--surface)] transition-colors"
          >
            <Copy className="w-4 h-4" />
            <span>Copy text</span>
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
  const [weekAnchor, setWeekAnchor] = useState(new Date());
  const [showShare, setShowShare] = useState(false);
  const nav = useAppNavigation();
  const toast = useToast();
  const { transactions, categories, accounts, budgets } = useDemoData();

  const [weekStart, weekEnd] = useMemo(
    () => getWeekRange(weekAnchor),
    [weekAnchor],
  );

  const weekLabel = `${fmtDate(weekStart)} – ${fmtDate(weekEnd)}`;

  // Filter transactions in this week
  const weekTxns = useMemo(() => {
    return transactions.filter((t) => {
      const d = new Date(t.date);
      return d >= weekStart && d <= weekEnd;
    });
  }, [transactions, weekStart, weekEnd]);

  const weekExpenses = useMemo(
    () => weekTxns.filter((t) => t.type === "expense"),
    [weekTxns],
  );
  const weekIncome = useMemo(
    () => weekTxns.filter((t) => t.type === "income"),
    [weekTxns],
  );

  const totalSpending = weekExpenses.reduce(
    (s, t) => s + Math.abs(t.amount),
    0,
  );
  const totalIncome = weekIncome.reduce((s, t) => s + Math.abs(t.amount), 0);
  const netBalance = totalIncome - totalSpending;

  // ── Build story bullets ──
  const bullets: StoryBullet[] = useMemo(() => {
    const result: StoryBullet[] = [];
    if (weekExpenses.length === 0) return result;

    // 1) Top category
    const catMap: Record<string, { name: string; total: number }> = {};
    weekExpenses.forEach((t) => {
      const key = t.categoryId || t.category;
      if (!catMap[key]) catMap[key] = { name: t.category, total: 0 };
      catMap[key].total += Math.abs(t.amount);
    });
    const topCat = Object.values(catMap).sort((a, b) => b.total - a.total)[0];
    if (topCat) {
      const pct =
        totalSpending > 0
          ? Math.round((topCat.total / totalSpending) * 100)
          : 0;
      result.push({
        type: "top-category",
        headline: `Chi nhiều nhất: ${topCat.name} ${fmt(topCat.total)}₫ (${pct}%)`,
        detail: `${topCat.name} chiếm ${pct}% tổng chi tiêu trong tuần.`,
      });
    }

    // 2) Biggest transaction
    const biggest = [...weekExpenses].sort(
      (a, b) => Math.abs(b.amount) - Math.abs(a.amount),
    )[0];
    if (biggest) {
      result.push({
        type: "biggest-txn",
        headline: `Giao dịch lớn nhất: ${biggest.description || biggest.category} ${fmt(biggest.amount)}₫`,
        detail: `${biggest.description} vào ngày ${fmtDate(new Date(biggest.date))}.`,
      });
    }

    // 3) Peak spending day
    const dayMap: Record<number, number> = {};
    weekExpenses.forEach((t) => {
      const day = new Date(t.date).getDay();
      dayMap[day] = (dayMap[day] || 0) + Math.abs(t.amount);
    });
    const peakDay = Object.entries(dayMap).sort(([, a], [, b]) => b - a)[0];
    if (peakDay) {
      result.push({
        type: "day-spike",
        headline: `Ngày chi nhiều nhất: ${FULL_DAY_NAMES[parseInt(peakDay[0])]} ${fmt(peakDay[1])}₫`,
        detail: `Bạn đã chi nhiều nhất vào ${FULL_DAY_NAMES[parseInt(peakDay[0])]} tuần này.`,
      });
    }

    // 4) Account insight — account with biggest balance decrease
    const accDelta: Record<string, { name: string; delta: number }> = {};
    weekTxns.forEach((t) => {
      if (t.type === "expense") {
        if (!accDelta[t.accountId])
          accDelta[t.accountId] = { name: t.account, delta: 0 };
        accDelta[t.accountId].delta -= Math.abs(t.amount);
      } else if (t.type === "income") {
        if (!accDelta[t.accountId])
          accDelta[t.accountId] = { name: t.account, delta: 0 };
        accDelta[t.accountId].delta += Math.abs(t.amount);
      }
    });
    const biggestDrop = Object.values(accDelta).sort(
      (a, b) => a.delta - b.delta,
    )[0];
    if (biggestDrop && biggestDrop.delta < 0) {
      result.push({
        type: "account-insight",
        headline: `${biggestDrop.name} giảm ${fmt(Math.abs(biggestDrop.delta))}₫ trong tuần`,
        detail: `Tài khoản ${biggestDrop.name} có biến động lớn nhất.`,
      });
    }

    // 5) Budget warning
    const now = new Date();
    const activeBudgets = budgets.filter(
      (b) => new Date(b.startDate) <= now && new Date(b.endDate) >= now,
    );
    for (const b of activeBudgets) {
      // Compute spent from real transactions
      const budgetExpenses = transactions.filter((t) => {
        if (t.type !== "expense") return false;
        const d = new Date(t.date);
        return (
          d >= new Date(b.startDate) &&
          d <= new Date(b.endDate) &&
          b.categories.includes(t.categoryId)
        );
      });
      const spent = budgetExpenses.reduce((s, t) => s + Math.abs(t.amount), 0);
      const pctUsed = b.amount > 0 ? Math.round((spent / b.amount) * 100) : 0;
      if (pctUsed >= 70) {
        result.push({
          type: "budget-warning",
          headline: `Ngân sách "${b.name}" đã dùng ${pctUsed}%`,
          detail: `Đã chi ${fmt(spent)}₫ / ${fmt(b.amount)}₫ — hãy cân nhắc chi tiêu.`,
        });
        break; // Only 1 budget warning
      }
    }

    return result.slice(0, 5);
  }, [weekExpenses, weekTxns, totalSpending, budgets, transactions]);

  // ── Daily spending chart data ──
  const dailyChartData = useMemo(() => {
    const result: { day: string; amount: number; fullDay: string }[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + i);
      const dayOfWeek = d.getDay();
      const dayStr = d.toISOString().split("T")[0];
      const amount = weekExpenses
        .filter((t) => t.date === dayStr)
        .reduce((s, t) => s + Math.abs(t.amount), 0);
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
      `💸 Chi tiêu: ${fmt(totalSpending)}₫`,
      `💰 Thu nhập: ${fmt(totalIncome)}₫`,
      `${netBalance >= 0 ? "✅" : "❌"} Ròng: ${netBalance >= 0 ? "+" : "-"}${fmt(Math.abs(netBalance))}₫`,
      "",
      ...bullets.map((b) => `• ${b.headline}`),
    ];
    navigator.clipboard
      .writeText(lines.join("\n"))
      .then(() => {
        toast.success("Đã copy nội dung recap");
      })
      .catch(() => {
        toast.error("Không thể copy");
      });
    setShowShare(false);
  }, [weekLabel, totalSpending, totalIncome, netBalance, bullets, toast]);

  const handleDownloadPng = useCallback(() => {
    // UI-only: show toast simulating download
    toast.success("Đã tạo ảnh recap");
    setShowShare(false);
  }, [toast]);

  const handleViewTransactions = () => {
    nav.goTransactions();
  };

  const hasData = weekTxns.length > 0;

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
                Recap tuần của bạn
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
            Tuần này
          </button>
          <button
            onClick={() => setWeekAnchor(shiftWeek(new Date(), -1))}
            className={`px-3 py-1.5 rounded-[var(--radius-md)] text-xs font-medium border transition-colors ${isLastWeek ? "border-[var(--primary)] bg-[var(--primary-light)] text-[var(--primary)]" : "border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--text-tertiary)]"}`}
          >
            Tuần trước
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

        {!hasData ? (
          /* Empty State */
          <Card>
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-[var(--surface)] rounded-full flex items-center justify-center mx-auto mb-4">
                <CalendarDays className="w-8 h-8 text-[var(--text-tertiary)]" />
              </div>
              <h3 className="font-semibold text-[var(--text-primary)] mb-2">
                Tuần này chưa có dữ liệu
              </h3>
              <p className="text-sm text-[var(--text-secondary)] mb-6">
                Thêm giao dịch để xem recap tuần của bạn.
              </p>
              <button
                onClick={() => nav.goCreateTransaction()}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white rounded-[var(--radius-lg)] font-medium transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Thêm giao dịch</span>
              </button>
            </div>
          </Card>
        ) : (
          <>
            {/* B2: Hero Summary */}
            <div className="grid grid-cols-3 gap-3">
              <Card className="bg-[var(--danger-light)]">
                <p className="text-xs text-[var(--text-secondary)] mb-1">
                  Chi tiêu
                </p>
                <p className="text-lg md:text-xl font-bold text-[var(--danger)] tabular-nums">
                  {fmt(totalSpending)}₫
                </p>
                <p className="text-[10px] text-[var(--text-tertiary)] mt-0.5">
                  {weekExpenses.length} giao dịch
                </p>
              </Card>
              <Card className="bg-[var(--success-light)]">
                <p className="text-xs text-[var(--text-secondary)] mb-1">
                  Thu nhập
                </p>
                <p className="text-lg md:text-xl font-bold text-[var(--success)] tabular-nums">
                  {fmt(totalIncome)}₫
                </p>
                <p className="text-[10px] text-[var(--text-tertiary)] mt-0.5">
                  {weekIncome.length} giao dịch
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
                  Ròng
                </p>
                <p
                  className={`text-lg md:text-xl font-bold tabular-nums ${netBalance >= 0 ? "text-[var(--success)]" : "text-[var(--danger)]"}`}
                >
                  {netBalance >= 0 ? "+" : "-"}
                  {fmt(Math.abs(netBalance))}₫
                </p>
                <p className="text-[10px] text-[var(--text-tertiary)] mt-0.5 flex items-center gap-0.5">
                  {netBalance >= 0 ? (
                    <TrendingUp className="w-3 h-3" />
                  ) : (
                    <TrendingDown className="w-3 h-3" />
                  )}
                  {netBalance >= 0 ? "Dư" : "Thiếu"}
                </p>
              </Card>
            </div>

            {/* B3: Story Bullets */}
            {bullets.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <h2 className="font-semibold text-[var(--text-primary)]">
                    Điểm nổi bật
                  </h2>
                  <span className="px-2 py-0.5 rounded-full bg-[var(--primary-light)] text-[var(--primary)] text-[10px] font-medium">
                    {bullets.length} điểm
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
                Chi tiêu theo ngày
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
                      formatter={(v: number) => [`${fmt(v)}₫`, "Chi tiêu"]}
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
                <span>Chia sẻ recap</span>
              </button>
              <button
                onClick={handleViewTransactions}
                className="flex items-center justify-center gap-2 px-4 py-3 border border-[var(--border)] text-[var(--text-primary)] rounded-[var(--radius-lg)] font-medium hover:bg-[var(--surface)] transition-colors"
              >
                <Receipt className="w-4 h-4" />
                <span>Xem giao dịch tuần</span>
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
        />
      </div>
    </div>
  );
}

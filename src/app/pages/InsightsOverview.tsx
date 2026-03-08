import React, { useState, useMemo } from 'react';
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
} from 'lucide-react';
import { Card } from '../components/Card';
import { AreaChart, Area, BarChart, Bar, PieChart as RePieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useAppNavigation } from '../hooks/useAppNavigation';
import { useDemoData } from '../contexts/DemoDataContext';
import { useToast } from '../contexts/ToastContext';

const ACCOUNT_TYPE_COLORS: Record<string, string> = {
  bank: '#3b82f6',
  cash: '#10b981',
  credit: '#ef4444',
  investment: '#f59e0b',
  savings: '#8b5cf6',
};

const CATEGORY_FALLBACK_COLORS = ['#ef4444', '#8b5cf6', '#3b82f6', '#f59e0b', '#10b981', '#ec4899', '#6366f1', '#14b8a6'];

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

function InsightCard({ title, icon, children, onViewDetails, trend }: InsightCardProps) {
  return (
    <Card>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-[var(--radius-lg)] bg-[var(--primary-light)] flex items-center justify-center">
            {icon}
          </div>
          <div>
            <h3 className="font-semibold text-[var(--text-primary)]">{title}</h3>
            {trend && (
              <div className="flex items-center gap-1.5 mt-0.5">
                {trend.isPositive ? (
                  <TrendingUp className="w-3.5 h-3.5 text-[var(--success)]" />
                ) : (
                  <TrendingDown className="w-3.5 h-3.5 text-[var(--danger)]" />
                )}
                <span
                  className={`text-xs font-medium ${
                    trend.isPositive ? 'text-[var(--success)]' : 'text-[var(--danger)]'
                  }`}
                >
                  {trend.isPositive ? '+' : ''}{trend.value.toFixed(1)}% {trend.label}
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
  const [selectedMonth, setSelectedMonth] = useState(new Date('2026-02-01'));
  const { transactions, accounts, categories } = useDemoData();
  const nav = useAppNavigation();
  const toast = useToast();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN').format(amount);
  };

  const handlePrevMonth = () => {
    const newDate = new Date(selectedMonth);
    newDate.setMonth(newDate.getMonth() - 1);
    setSelectedMonth(newDate);
  };

  const handleNextMonth = () => {
    const newDate = new Date(selectedMonth);
    newDate.setMonth(newDate.getMonth() + 1);
    setSelectedMonth(newDate);
  };

  const formatMonthYear = (date: Date) => {
    return date.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' });
  };

  // Build spending trend data from real transactions (daily expenses for selected month + previous month)
  const spendingTrendData = useMemo(() => {
    const year = selectedMonth.getFullYear();
    const month = selectedMonth.getMonth();

    // Get previous month start
    const prevStart = new Date(year, month - 1, 1);
    const currEnd = new Date(year, month + 1, 0);
    const prevMidPoint = new Date(year, month, 0).getDate();
    const startDay = Math.max(1, prevMidPoint - 14);

    const dailyMap: Record<string, number> = {};

    transactions
      .filter(t => {
        if (t.type !== 'expense') return false;
        const d = new Date(t.date);
        return d >= new Date(prevStart.getFullYear(), prevStart.getMonth(), startDay) && d <= currEnd;
      })
      .forEach(t => {
        const d = new Date(t.date);
        const key = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
        dailyMap[key] = (dailyMap[key] || 0) + Math.abs(t.amount);
      });

    // Generate last 30 days worth of data
    const result: { date: string; amount: number }[] = [];
    const today = currEnd;
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
      result.push({ date: key, amount: dailyMap[key] || 0 });
    }
    return result;
  }, [transactions, selectedMonth]);

  // Build top categories from real transactions (expenses in selected month)
  const topCategoriesData = useMemo(() => {
    const year = selectedMonth.getFullYear();
    const month = selectedMonth.getMonth();

    const catMap: Record<string, number> = {};
    transactions
      .filter(t => {
        if (t.type !== 'expense') return false;
        const d = new Date(t.date);
        return d.getFullYear() === year && d.getMonth() === month;
      })
      .forEach(t => {
        const key = t.categoryId || t.category;
        catMap[key] = (catMap[key] || 0) + Math.abs(t.amount);
      });

    const catLookup: Record<string, { name: string; color: string }> = {};
    categories.forEach(c => { catLookup[c.id] = { name: c.name, color: c.color }; });

    const total = Object.values(catMap).reduce((s, v) => s + v, 0) || 1;

    const sorted = Object.entries(catMap)
      .map(([key, amount]) => ({
        name: catLookup[key]?.name || key,
        amount,
        percentage: Math.round((amount / total) * 100),
        color: catLookup[key]?.color || CATEGORY_FALLBACK_COLORS[0],
      }))
      .sort((a, b) => b.amount - a.amount);

    // Top 4 + "Khác"
    if (sorted.length > 5) {
      const top4 = sorted.slice(0, 4);
      const rest = sorted.slice(4);
      const restAmount = rest.reduce((s, v) => s + v.amount, 0);
      return [
        ...top4,
        { name: 'Khác', amount: restAmount, percentage: Math.round((restAmount / total) * 100), color: '#6b7280' },
      ];
    }
    return sorted.length > 0 ? sorted : [{ name: 'Chưa có dữ liệu', amount: 0, percentage: 0, color: '#6b7280' }];
  }, [transactions, categories, selectedMonth]);

  // Build income vs expense data from real transactions (last 5 months)
  const incomeExpenseData = useMemo(() => {
    const year = selectedMonth.getFullYear();
    const month = selectedMonth.getMonth();

    const result: { month: string; income: number; expense: number }[] = [];
    for (let i = 4; i >= 0; i--) {
      const m = new Date(year, month - i, 1);
      const mYear = m.getFullYear();
      const mMonth = m.getMonth();
      let income = 0;
      let expense = 0;

      transactions.forEach(t => {
        const d = new Date(t.date);
        if (d.getFullYear() === mYear && d.getMonth() === mMonth) {
          if (t.type === 'income') income += Math.abs(t.amount);
          else if (t.type === 'expense') expense += Math.abs(t.amount);
        }
      });

      result.push({
        month: `T${mMonth + 1}`,
        income,
        expense,
      });
    }
    return result;
  }, [transactions, selectedMonth]);

  // Build account distribution from real account balances
  const accountDistributionData = useMemo(() => {
    const typeMap: Record<string, { name: string; amount: number; color: string }> = {};
    const typeLabels: Record<string, string> = {
      bank: 'Ngân hàng',
      cash: 'Tiền mặt',
      credit: 'Tín dụng',
      investment: 'Đầu tư',
      savings: 'Tiết kiệm',
    };

    accounts.forEach(acc => {
      const t = acc.type;
      if (!typeMap[t]) {
        typeMap[t] = {
          name: typeLabels[t] || t,
          amount: 0,
          color: ACCOUNT_TYPE_COLORS[t] || '#6b7280',
        };
      }
      typeMap[t].amount += acc.balance;
    });

    const total = Object.values(typeMap).reduce((s, v) => s + v.amount, 0) || 1;
    return Object.values(typeMap)
      .filter(v => v.amount > 0)
      .map(v => ({
        ...v,
        percentage: Math.round((v.amount / total) * 100),
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [accounts]);

  // Computed summary stats
  const totalSpending = spendingTrendData.reduce((sum, item) => sum + item.amount, 0);
  const daysWithData = spendingTrendData.filter(d => d.amount > 0).length || 1;
  const avgDailySpending = totalSpending / daysWithData;

  const currentMonthData = incomeExpenseData[incomeExpenseData.length - 1];
  const prevMonthData = incomeExpenseData.length >= 2 ? incomeExpenseData[incomeExpenseData.length - 2] : null;
  const spendingChange = prevMonthData && prevMonthData.expense > 0
    ? ((currentMonthData.expense - prevMonthData.expense) / prevMonthData.expense) * 100
    : 0;
  const savingsRate = currentMonthData.income > 0
    ? ((currentMonthData.income - currentMonthData.expense) / currentMonthData.income) * 100
    : 0;

  const handleViewSpendingTrend = () => nav.goCashflow();
  const handleViewCategoryBreakdown = () => nav.goCategoryBreakdown();
  const handleViewIncomeExpense = () => nav.goCashflow();
  const handleViewAccountDistribution = () => nav.goAccountBreakdown();

  // ── Weekly Recap Data ──
  const weeklyRecapData = useMemo(() => {
    const fmtC = (n: number) => new Intl.NumberFormat('vi-VN').format(n);
    const now = new Date();
    const day = now.getDay();
    const diffMon = day === 0 ? -6 : 1 - day;
    const mon = new Date(now);
    mon.setDate(now.getDate() + diffMon);
    mon.setHours(0, 0, 0, 0);
    const sun = new Date(mon);
    sun.setDate(mon.getDate() + 6);
    sun.setHours(23, 59, 59, 999);

    const weekTxns = transactions.filter(t => {
      const d = new Date(t.date);
      return d >= mon && d <= sun;
    });
    const expenses = weekTxns.filter(t => t.type === 'expense');
    const income = weekTxns.filter(t => t.type === 'income');
    const spending = expenses.reduce((s, t) => s + Math.abs(t.amount), 0);
    const inc = income.reduce((s, t) => s + Math.abs(t.amount), 0);

    // Build 3 bullets
    const bullets: string[] = [];
    if (expenses.length > 0) {
      // Top category
      const catMap: Record<string, { name: string; total: number }> = {};
      expenses.forEach(t => {
        const key = t.categoryId || t.category;
        if (!catMap[key]) catMap[key] = { name: t.category, total: 0 };
        catMap[key].total += Math.abs(t.amount);
      });
      const topCat = Object.values(catMap).sort((a, b) => b.total - a.total)[0];
      const pct = spending > 0 ? Math.round((topCat.total / spending) * 100) : 0;
      bullets.push(`Chi nhiều nhất: ${topCat.name} ${fmtC(topCat.total)}₫ (${pct}%)`);

      // Biggest transaction
      const biggest = [...expenses].sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount))[0];
      bullets.push(`Giao dịch lớn nhất: ${biggest.description || biggest.category} ${fmtC(Math.abs(biggest.amount))}₫`);

      // Peak day
      const DAYS = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
      const dayMap: Record<number, number> = {};
      expenses.forEach(t => { const d = new Date(t.date).getDay(); dayMap[d] = (dayMap[d] || 0) + Math.abs(t.amount); });
      const peak = Object.entries(dayMap).sort(([, a], [, b]) => b - a)[0];
      if (peak) bullets.push(`Ngày chi nhiều nhất: ${DAYS[parseInt(peak[0])]} ${fmtC(peak[1])}₫`);
    }

    const fmtD = (d: Date) => d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
    return { spending, income: inc, net: inc - spending, bullets, weekLabel: `${fmtD(mon)} – ${fmtD(sun)}`, hasData: weekTxns.length > 0 };
  }, [transactions]);

  const handleExportCSV = () => {
    const year = selectedMonth.getFullYear();
    const month = selectedMonth.getMonth();
    const monthTxns = transactions.filter(t => {
      const d = new Date(t.date);
      return d.getFullYear() === year && d.getMonth() === month;
    });

    const header = 'Ngày,Mô tả,Danh mục,Tài khoản,Loại,Số tiền\n';
    const rows = monthTxns.map(t => {
      const escaped = (s: string) => s.includes(',') || s.includes('"') ? `"${s.replace(/"/g, '""')}"` : s;
      return `${t.date},${escaped(t.description)},${escaped(t.category)},${escaped(t.account)},${t.type === 'income' ? 'Thu nhập' : 'Chi tiêu'},${t.amount}`;
    }).join('\n');

    const csv = header + rows;
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `thong-ke-${year}-${String(month + 1).padStart(2, '0')}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(`Đã xuất ${monthTxns.length} giao dịch ra file CSV`);
  };

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="max-w-7xl mx-auto p-4 md:p-6 pb-20 md:pb-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Thống kê & Báo cáo</h1>
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
              <span className="text-sm font-medium hidden md:inline">Xuất CSV</span>
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

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <p className="text-sm text-[var(--text-secondary)] mb-2">Tổng chi tiêu</p>
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
                <span className={`text-xs ${spendingChange > 0 ? 'text-[var(--danger)]' : 'text-[var(--success)]'}`}>
                  {spendingChange > 0 ? '+' : ''}{spendingChange.toFixed(1)}% so với tháng trước
                </span>
              </div>
            )}
          </Card>

          <Card>
            <p className="text-sm text-[var(--text-secondary)] mb-2">Trung bình/ngày</p>
            <p className="text-2xl font-bold text-[var(--text-primary)] tabular-nums mb-1">
              {formatCurrency(Math.round(avgDailySpending))}₫
            </p>
            <p className="text-xs text-[var(--text-secondary)]">
              Dự kiến: {formatCurrency(Math.round(avgDailySpending * 30))}₫/tháng
            </p>
          </Card>

          <Card>
            <p className="text-sm text-[var(--text-secondary)] mb-2">Tỷ lệ tiết kiệm</p>
            <p className={`text-2xl font-bold tabular-nums mb-1 ${savingsRate > 0 ? 'text-[var(--success)]' : 'text-[var(--danger)]'}`}>
              {savingsRate.toFixed(1)}%
            </p>
            <p className="text-xs text-[var(--text-secondary)]">
              {savingsRate >= 0 ? 'Tiết kiệm' : 'Vượt chi'}: {formatCurrency(Math.abs(currentMonthData.income - currentMonthData.expense))}₫
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
                  <h3 className="font-semibold text-[var(--text-primary)]">Recap tuần</h3>
                  <span className="px-2 py-0.5 rounded-full bg-[var(--primary-light)] text-[var(--primary)] text-[10px] font-medium">3–5 điểm nổi bật</span>
                </div>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">{weeklyRecapData.weekLabel}</p>
              </div>
            </div>
          </div>

          {weeklyRecapData.hasData ? (
            <>
              {/* Metrics Row */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="p-2.5 rounded-[var(--radius-lg)] bg-[var(--surface)]">
                  <p className="text-[10px] text-[var(--text-tertiary)]">Chi tiêu</p>
                  <p className="text-sm font-bold text-[var(--danger)] tabular-nums">{formatCurrency(weeklyRecapData.spending)}₫</p>
                </div>
                <div className="p-2.5 rounded-[var(--radius-lg)] bg-[var(--surface)]">
                  <p className="text-[10px] text-[var(--text-tertiary)]">Thu nhập</p>
                  <p className="text-sm font-bold text-[var(--success)] tabular-nums">{formatCurrency(weeklyRecapData.income)}₫</p>
                </div>
                <div className="p-2.5 rounded-[var(--radius-lg)] bg-[var(--surface)]">
                  <p className="text-[10px] text-[var(--text-tertiary)]">Ròng</p>
                  <p className={`text-sm font-bold tabular-nums ${weeklyRecapData.net >= 0 ? 'text-[var(--success)]' : 'text-[var(--danger)]'}`}>
                    {weeklyRecapData.net >= 0 ? '+' : '-'}{formatCurrency(Math.abs(weeklyRecapData.net))}₫
                  </p>
                </div>
              </div>

              {/* Bullet Preview */}
              <div className="space-y-2 mb-4">
                {weeklyRecapData.bullets.map((b, i) => (
                  <p key={i} className="text-xs text-[var(--text-secondary)]">• {b}</p>
                ))}
              </div>

              {/* CTA Row */}
              <div className="flex gap-3">
                <button onClick={() => nav.goWeeklyRecap()} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white rounded-[var(--radius-lg)] font-medium transition-colors text-sm">
                  <Receipt className="w-4 h-4" />Xem recap
                </button>
                <button onClick={() => nav.goWeeklyRecap()} className="flex items-center justify-center gap-2 px-4 py-2.5 border border-[var(--border)] text-[var(--text-primary)] rounded-[var(--radius-lg)] font-medium hover:bg-[var(--surface)] transition-colors text-sm">
                  <Share2 className="w-4 h-4" />Chia sẻ
                </button>
              </div>
            </>
          ) : (
            <div className="text-center py-6">
              <p className="text-sm text-[var(--text-secondary)] mb-3">Tuần này chưa có dữ liệu</p>
              <button onClick={() => nav.goCreateTransaction()} className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white rounded-[var(--radius-lg)] font-medium transition-colors text-sm">
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
          trend={prevMonthData && prevMonthData.expense > 0 ? {
            value: spendingChange,
            isPositive: spendingChange < 0,
            label: 'so với tháng trưc',
          } : undefined}
        >
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={spendingTrendData}>
                <defs>
                  <linearGradient id="spendingGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="date"
                  tick={{ fill: 'var(--text-tertiary)', fontSize: 12 }}
                  tickLine={false}
                  axisLine={{ stroke: 'var(--divider)' }}
                  interval={4}
                />
                <YAxis
                  tick={{ fill: 'var(--text-tertiary)', fontSize: 12 }}
                  tickLine={false}
                  axisLine={{ stroke: 'var(--divider)' }}
                  tickFormatter={(value) => `${(value / 1000)}k`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--card)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-lg)',
                    fontSize: '12px',
                  }}
                  formatter={(value: number) => [`${formatCurrency(value)}₫`, 'Chi tiêu']}
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
                    <span className="text-sm text-[var(--text-primary)]">{category.name}</span>
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
                    tick={{ fill: 'var(--text-tertiary)', fontSize: 12 }}
                    tickLine={false}
                    axisLine={{ stroke: 'var(--divider)' }}
                  />
                  <YAxis
                    tick={{ fill: 'var(--text-tertiary)', fontSize: 12 }}
                    tickLine={false}
                    axisLine={{ stroke: 'var(--divider)' }}
                    tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--card)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-lg)',
                      fontSize: '12px',
                    }}
                    formatter={(value: number) => `${formatCurrency(value)}₫`}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: '12px' }}
                    formatter={(value) => (value === 'income' ? 'Thu nhập' : 'Chi tiêu')}
                  />
                  <Bar dataKey="income" fill="var(--success)" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="expense" fill="var(--danger)" radius={[8, 8, 0, 0]} />
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
                      backgroundColor: 'var(--card)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-lg)',
                      fontSize: '12px',
                    }}
                    formatter={(value: number) => [`${formatCurrency(value)}₫`, 'Số dư']}
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
                      {account.percentage}% &bull; {formatCurrency(account.amount)}₫
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
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { 
  Plus, 
  ChevronLeft, 
  ChevronRight,
  TrendingDown,
  TrendingUp,
  Wallet,
  Calendar,
  AlertCircle,
  ShoppingBag,
  Home as HomeIcon,
  Car,
  Coffee,
  Heart,
  Utensils,
  Gift,
  Briefcase,
  Smile,
  Book,
  Dumbbell,
  Folder,
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { StatCard } from '../components/StatCard';
import { Card } from '../components/Card';
import { ProgressBar } from '../components/ProgressBar';
import { useDemoData } from '../contexts/DemoDataContext';
import { useAppNavigation } from '../hooks/useAppNavigation';
import { useAutoGoalContributions } from '../hooks/useAutoGoalContributions';

export default function Home() {
  const navigate = useNavigate();
  const { transactions, accounts, budgets: demoBudgets, categories, recurringRules } = useDemoData();
  const { goCreateTransaction, goTransactions, goTransactionDetail, goAccounts } = useAppNavigation();
  const [currentMonth, setCurrentMonth] = useState(new Date(2026, 2)); // March 2026

  // Run auto-contributions check on Home mount
  useAutoGoalContributions();

  const formatMonth = (date: Date) => {
    return new Intl.DateTimeFormat('vi-VN', { month: 'long', year: 'numeric' }).format(date);
  };

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  // Calculate totals from context data
  const getTotalIncome = () => {
    return transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
  };

  const getTotalExpense = () => {
    return transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  };

  const getTotalBalance = () => {
    return accounts.reduce((sum, a) => sum + a.balance, 0);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  // Get recent transactions (last 5)
  const recentTransactions = [...transactions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  // Build real spending chart data from expense transactions
  const spendingData = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const dailyMap: Record<string, number> = {};
    
    transactions
      .filter(t => {
        if (t.type !== 'expense') return false;
        const d = new Date(t.date);
        return d.getFullYear() === year && d.getMonth() === month;
      })
      .forEach(t => {
        const day = new Date(t.date).getDate().toString();
        dailyMap[day] = (dailyMap[day] || 0) + Math.abs(t.amount);
      });

    // Fill in days for a smooth chart
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const result: { day: string; amount: number }[] = [];
    let cumulative = 0;
    for (let d = 1; d <= daysInMonth; d++) {
      cumulative += dailyMap[d.toString()] || 0;
      if (d % 4 === 1 || d === daysInMonth) {
        result.push({ day: d.toString(), amount: cumulative });
      }
    }
    return result.length > 0 ? result : [{ day: '1', amount: 0 }];
  }, [transactions, currentMonth]);

  // Icon mapping for budget categories
  const iconMap: Record<string, React.ComponentType<any>> = {
    utensils: Utensils, 'shopping-bag': ShoppingBag, home: HomeIcon, car: Car,
    heart: Heart, gift: Gift, briefcase: Briefcase, 'trending-up': TrendingUp,
    smile: Smile, book: Book, dumbbell: Dumbbell, folder: Folder, coffee: Coffee,
  };

  // Map budgets with real category icons & colors
  const budgetsWithIcons = useMemo(() => {
    const categoryMap: Record<string, { icon: string; color: string }> = {};
    categories.forEach(cat => { categoryMap[cat.id] = { icon: cat.icon, color: cat.color }; });

    return demoBudgets.slice(0, 4).map(budget => {
      const firstCatId = budget.categories[0];
      const catInfo = firstCatId ? categoryMap[firstCatId] : null;

      // Compute real spent from transactions
      const catSet = new Set(budget.categories);
      const realSpent = transactions
        .filter(t => {
          if (t.type !== 'expense') return false;
          if (!t.categoryId || !catSet.has(t.categoryId)) return false;
          if (t.date < budget.startDate || t.date > budget.endDate) return false;
          return true;
        })
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);

      return {
        ...budget,
        spent: realSpent,
        icon: iconMap[catInfo?.icon || ''] || Folder,
        color: catInfo?.color || 'var(--chart-1)',
      };
    });
  }, [demoBudgets, categories, transactions]);

  // Upcoming recurring transactions (next 7 days)
  const upcomingRecurring = useMemo(() => {
    const today = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    return recurringRules
      .filter(r => r.enabled)
      .map(r => {
        const nextDate = new Date(r.nextDate);
        const daysUntil = Math.ceil((nextDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return { ...r, nextDateObj: nextDate, daysUntil };
      })
      .filter(r => r.daysUntil >= 0 && r.daysUntil <= 7)
      .sort((a, b) => a.daysUntil - b.daysUntil)
      .slice(0, 4);
  }, [recurringRules]);

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6 pb-20 md:pb-6">
        {/* Header with Month Selector */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrevMonth}
              className="p-2 rounded-[var(--radius-lg)] hover:bg-[var(--surface)] transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-[var(--text-secondary)]" />
            </button>
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[var(--primary)]" />
              <h2 className="text-xl font-semibold text-[var(--text-primary)] capitalize">
                {formatMonth(currentMonth)}
              </h2>
            </div>
            <button
              onClick={handleNextMonth}
              className="p-2 rounded-[var(--radius-lg)] hover:bg-[var(--surface)] transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-[var(--text-secondary)]" />
            </button>
          </div>

          <button 
            onClick={goCreateTransaction}
            className="flex items-center gap-2 px-4 py-2.5 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white rounded-[var(--radius-lg)] transition-colors shadow-[var(--shadow-sm)]"
          >
            <Plus className="w-5 h-5" />
            <span className="font-medium">Thêm giao dịch</span>
          </button>
        </div>

        {/* Summary Cards - Clickable */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div onClick={goAccounts} className="cursor-pointer">
            <StatCard
              title="Tổng tài sản"
              amount={getTotalBalance()}
              type="neutral"
              icon={<Wallet className="w-5 h-5" />}
              trend={{ value: 12.5, isPositive: true }}
            />
          </div>
          <div onClick={() => navigate('/transactions?type=income')} className="cursor-pointer">
            <StatCard
              title="Thu"
              amount={getTotalIncome()}
              type="income"
              trend={{ value: 5.2, isPositive: true }}
            />
          </div>
          <div onClick={() => navigate('/transactions?type=expense')} className="cursor-pointer">
            <StatCard
              title="Chi"
              amount={getTotalExpense()}
              type="expense"
              trend={{ value: 3.8, isPositive: false }}
            />
          </div>
        </div>

        {/* Spending Chart */}
        <Card>
          <h3 className="font-semibold text-[var(--text-primary)] mb-4">
            Chi tiêu theo ngày
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={spendingData}>
                <defs>
                  <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--danger)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="var(--danger)" stopOpacity={0}/>
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
                  style={{ fontSize: '12px' }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  stroke="var(--text-tertiary)"
                  style={{ fontSize: '12px' }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `${value / 1000}k`}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'var(--surface-elevated)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-lg)',
                    boxShadow: 'var(--shadow-lg)',
                    color: 'var(--text-primary)',
                  }}
                  formatter={(value: number) => [formatCurrency(value), 'Chi tiêu']}
                  labelFormatter={(label) => `Ngày ${label}`}
                />
                <Area 
                  type="monotone" 
                  dataKey="amount" 
                  stroke="var(--danger)" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorAmount)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Budget Section - Clickable cards */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-[var(--text-primary)]">Ngân sách</h3>
            <button 
              onClick={() => navigate('/budgets')}
              className="text-sm text-[var(--primary)] hover:text-[var(--primary-hover)] font-medium"
            >
              Xem tất cả
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {budgetsWithIcons.map((budget) => {
              const Icon = budget.icon;
              const percentage = (budget.spent / budget.amount) * 100;
              const isOverBudget = percentage > 100;

              return (
                <Card 
                  key={budget.id}
                  onClick={() => navigate(`/budgets/${budget.id}`)}
                  className="cursor-pointer hover:shadow-[var(--shadow-lg)] transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div 
                        className="p-2.5 rounded-[var(--radius-lg)]"
                        style={{ backgroundColor: `${budget.color}20` }}
                      >
                        <Icon 
                          className="w-5 h-5" 
                          style={{ color: budget.color }}
                        />
                      </div>
                      <div>
                        <p className="font-medium text-[var(--text-primary)]">
                          {budget.name}
                        </p>
                        <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                          {formatCurrency(budget.spent)} / {formatCurrency(budget.amount)}
                        </p>
                      </div>
                    </div>
                    <span 
                      className={`text-sm font-semibold ${
                        isOverBudget ? 'text-[var(--danger)]' : 'text-[var(--text-secondary)]'
                      }`}
                    >
                      {percentage.toFixed(0)}%
                    </span>
                  </div>
                  <ProgressBar 
                    value={percentage} 
                    max={100}
                    variant={isOverBudget ? 'danger' : 'primary'}
                  />
                  {isOverBudget && (
                    <p className="text-xs text-[var(--danger)] mt-2 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      Vượt ngân sách
                    </p>
                  )}
                </Card>
              );
            })}
          </div>
        </div>

        {/* Insights Section - Clickable */}
        <div>
          <h3 className="font-semibold text-[var(--text-primary)] mb-4">
            Gợi ý tuần này
          </h3>
          <Card 
            onClick={() => navigate('/insights')}
            className="cursor-pointer hover:shadow-[var(--shadow-lg)] transition-shadow"
          >
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-[var(--radius-lg)] bg-[var(--info-light)]">
                <TrendingDown className="w-6 h-6 text-[var(--info)]" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-[var(--text-primary)] mb-1">
                  Chi tiêu tốt hơn tuần trước
                </h4>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                  Bạn đã tiết kiệm được <span className="font-semibold text-[var(--success)]">520.000₫</span> so với tuần trước. 
                  Chi tiêu cho danh mục "Ăn uống" giảm <span className="font-semibold">18%</span>. 
                  Tiếp tục duy trì nhé!
                </p>
                <div className="flex gap-2 mt-3">
                  <span className="px-2.5 py-1 bg-[var(--success-light)] text-[var(--success)] text-xs font-medium rounded-[var(--radius-md)]">
                    -18% Ăn uống
                  </span>
                  <span className="px-2.5 py-1 bg-[var(--success-light)] text-[var(--success)] text-xs font-medium rounded-[var(--radius-md)]">
                    Tiết kiệm 520k
                  </span>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Upcoming Recurring Transactions */}
        {upcomingRecurring.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-[var(--text-primary)]">
                Giao dịch sắp tới
              </h3>
              <button
                onClick={() => navigate('/rules/recurring')}
                className="text-sm text-[var(--primary)] hover:text-[var(--primary-hover)] font-medium"
              >
                Xem lịch
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {upcomingRecurring.map(rule => (
                <Card key={rule.id}>
                  <div className="flex items-center gap-3">
                    <div className={`flex-shrink-0 w-10 h-10 rounded-[var(--radius-lg)] flex items-center justify-center ${
                      rule.type === 'income'
                        ? 'bg-[var(--success-light)] text-[var(--success)]'
                        : 'bg-[var(--danger-light)] text-[var(--danger)]'
                    }`}>
                      {rule.type === 'income' ? (
                        <TrendingUp className="w-5 h-5" />
                      ) : (
                        <TrendingDown className="w-5 h-5" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                        {rule.name}
                      </p>
                      <p className="text-xs text-[var(--text-secondary)]">
                        {rule.daysUntil === 0
                          ? 'Hôm nay'
                          : rule.daysUntil === 1
                            ? 'Ngày mai'
                            : `${rule.daysUntil} ngày nữa`}
                        {rule.category ? ` · ${rule.category}` : ''}
                      </p>
                    </div>
                    <span className={`text-sm font-semibold tabular-nums ${
                      rule.type === 'income' ? 'text-[var(--success)]' : 'text-[var(--danger)]'
                    }`}>
                      {rule.type === 'income' ? '+' : '-'}
                      {formatCurrency(Math.abs(rule.amount))}
                    </span>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Recent Transactions - Clickable rows */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-[var(--text-primary)]">
              Giao dịch gần đây
            </h3>
            <button 
              onClick={goTransactions}
              className="text-sm text-[var(--primary)] hover:text-[var(--primary-hover)] font-medium"
            >
              Xem tất cả
            </button>
          </div>

          {/* Desktop Table View */}
          <Card className="hidden md:block">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[var(--divider)]">
                    <th className="text-left px-6 py-3 text-sm font-medium text-[var(--text-secondary)]">
                      Ngày
                    </th>
                    <th className="text-left px-6 py-3 text-sm font-medium text-[var(--text-secondary)]">
                      Mô tả
                    </th>
                    <th className="text-left px-6 py-3 text-sm font-medium text-[var(--text-secondary)]">
                      Danh mục
                    </th>
                    <th className="text-left px-6 py-3 text-sm font-medium text-[var(--text-secondary)]">
                      Tài khoản
                    </th>
                    <th className="text-right px-6 py-3 text-sm font-medium text-[var(--text-secondary)]">
                      Số tiền
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {recentTransactions.map((transaction) => (
                    <tr 
                      key={transaction.id}
                      onClick={() => goTransactionDetail(transaction.id)}
                      className="border-b border-[var(--divider)] hover:bg-[var(--surface)] transition-colors cursor-pointer"
                    >
                      <td className="px-6 py-4 text-sm text-[var(--text-secondary)]">
                        {transaction.date}
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-[var(--text-primary)]">
                          {transaction.description}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-sm text-[var(--text-secondary)]">
                        {transaction.category}
                      </td>
                      <td className="px-6 py-4 text-sm text-[var(--text-secondary)]">
                        {transaction.account}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span 
                          className={`text-sm font-semibold tabular-nums ${
                            transaction.amount > 0 
                              ? 'text-[var(--success)]' 
                              : 'text-[var(--danger)]'
                          }`}
                        >
                          {transaction.amount > 0 ? '+' : '-'}
                          {formatCurrency(Math.abs(transaction.amount))}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Mobile List View */}
          <div className="md:hidden space-y-2">
            {recentTransactions.map((transaction) => (
              <Card 
                key={transaction.id}
                onClick={() => goTransactionDetail(transaction.id)}
                className="cursor-pointer"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <p className="font-medium text-[var(--text-primary)] mb-1">
                      {transaction.description}
                    </p>
                    <p className="text-xs text-[var(--text-secondary)]">
                      {transaction.category} • {transaction.account}
                    </p>
                  </div>
                  <span 
                    className={`font-semibold tabular-nums ml-3 ${
                      transaction.amount > 0 
                        ? 'text-[var(--success)]' 
                        : 'text-[var(--danger)]'
                    }`}
                  >
                    {transaction.amount > 0 ? '+' : '-'}
                    {formatCurrency(Math.abs(transaction.amount))}
                  </span>
                </div>
                <p className="text-xs text-[var(--text-tertiary)]">
                  {transaction.date}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
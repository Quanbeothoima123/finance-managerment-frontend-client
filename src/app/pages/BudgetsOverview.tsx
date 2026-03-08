import React, { useState, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Folder,
  Utensils,
  ShoppingBag,
  Home,
  Car,
  Heart,
  Gift,
  Briefcase,
  Smile,
  Book,
  Dumbbell,
  PlusCircle,
  Search,
  X,
  ArrowUpDown,
  Edit2,
  Trash2,
} from 'lucide-react';
import { Card } from '../components/Card';
import { useAppNavigation } from '../hooks/useAppNavigation';
import { useDemoData } from '../contexts/DemoDataContext';
import { useToast } from '../contexts/ToastContext';
import { ConfirmationModal } from '../components/ConfirmationModals';
import { SwipeableRow } from '../components/SwipeableRow';

// Icon mapping
const iconMap: Record<string, React.ComponentType<any>> = {
  utensils: Utensils,
  'shopping-bag': ShoppingBag,
  home: Home,
  car: Car,
  heart: Heart,
  gift: Gift,
  briefcase: Briefcase,
  'trending-up': TrendingUp,
  'plus-circle': PlusCircle,
  smile: Smile,
  book: Book,
  dumbbell: Dumbbell,
  folder: Folder,
};

function getIcon(iconName: string) {
  return iconMap[iconName] || Folder;
}

// Display budget for cards
interface DisplayBudget {
  id: string;
  name: string;
  icon: string;
  color: string;
  limit: number;
  spent: number;
  remaining: number;
  percentage: number;
  status: 'safe' | 'warning' | 'over';
}

const months = [
  'Tháng 1',
  'Tháng 2',
  'Tháng 3',
  'Tháng 4',
  'Tháng 5',
  'Tháng 6',
  'Tháng 7',
  'Tháng 8',
  'Tháng 9',
  'Tháng 10',
  'Tháng 11',
  'Tháng 12',
];

interface BudgetCardProps {
  budget: DisplayBudget;
  onClick: () => void;
  onDelete: () => void;
}

function BudgetCard({ budget, onClick, onDelete }: BudgetCardProps) {
  const Icon = getIcon(budget.icon);
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN').format(amount);
  };

  const getStatusColor = () => {
    if (budget.status === 'over') return 'var(--danger)';
    if (budget.status === 'warning') return 'var(--warning)';
    return 'var(--success)';
  };

  const getStatusBg = () => {
    if (budget.status === 'over') return 'var(--danger-light)';
    if (budget.status === 'warning') return 'var(--warning-light)';
    return 'var(--success-light)';
  };

  return (
    <Card className="cursor-pointer hover:shadow-[var(--shadow-md)] transition-all" onClick={onClick}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className="p-2.5 rounded-[var(--radius-lg)]"
            style={{ backgroundColor: `${budget.color}20` }}
          >
            <Icon className="w-5 h-5" style={{ color: budget.color }} />
          </div>
          <div>
            <h3 className="font-semibold text-[var(--text-primary)]">{budget.name}</h3>
            <p className="text-xs text-[var(--text-secondary)]">
              Còn lại: {formatCurrency(Math.abs(budget.remaining))}₫
            </p>
          </div>
        </div>
        <div
          className="px-2.5 py-1 rounded-[var(--radius-md)] text-xs font-semibold"
          style={{
            backgroundColor: getStatusBg(),
            color: getStatusColor(),
          }}
        >
          {budget.percentage.toFixed(0)}%
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-3">
        <div className="h-3 bg-[var(--surface)] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${Math.min(budget.percentage, 100)}%`,
              backgroundColor: getStatusColor(),
            }}
          />
        </div>
      </div>

      {/* Amount Info */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-[var(--text-secondary)]">
          <span className="font-semibold text-[var(--text-primary)] tabular-nums">
            {formatCurrency(budget.spent)}₫
          </span>{' '}
          / {formatCurrency(budget.limit)}₫
        </span>
        {budget.status === 'over' && (
          <span className="text-[var(--danger)] text-xs font-medium">Vượt ngân sách</span>
        )}
        {budget.status === 'warning' && (
          <span className="text-[var(--warning)] text-xs font-medium">Sắp vượt</span>
        )}
      </div>

      {/* Delete */}
      <div className="mt-3 pt-3 border-t border-[var(--divider)] flex items-center justify-between">
        <span className="text-xs text-[var(--text-tertiary)]">
          {budget.status === 'over' ? 'Đã vượt' : budget.status === 'warning' ? 'Gần hết' : 'Còn dư'}
        </span>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="hidden md:inline text-xs text-[var(--text-tertiary)] hover:text-[var(--danger)] transition-colors"
        >
          Xoá
        </button>
      </div>
    </Card>
  );
}

export default function BudgetsOverview() {
  const [selectedMonth, setSelectedMonth] = useState(2);
  const [selectedYear] = useState(2026);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [budgetToDelete, setBudgetToDelete] = useState<DisplayBudget | null>(null);
  const { budgets, categories, deleteBudget, transactions } = useDemoData();
  const nav = useAppNavigation();
  const toast = useToast();
  const [statusFilter, setStatusFilter] = useState<'all' | 'safe' | 'warning' | 'over'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'percentage' | 'amount'>('percentage');

  // Build a lookup from category ID to category
  const categoryMap = useMemo(() => {
    const map: Record<string, { icon: string; color: string; name: string }> = {};
    categories.forEach((cat) => {
      map[cat.id] = { icon: cat.icon, color: cat.color, name: cat.name };
    });
    return map;
  }, [categories]);

  // Compute real spent per budget from actual transactions
  const spentByBudget = useMemo(() => {
    const result: Record<string, number> = {};
    budgets.forEach(budget => {
      const catSet = new Set(budget.categories);
      const spent = transactions
        .filter(t => {
          if (t.type !== 'expense') return false;
          if (!t.categoryId || !catSet.has(t.categoryId)) return false;
          if (t.date < budget.startDate || t.date > budget.endDate) return false;
          return true;
        })
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);
      result[budget.id] = spent;
    });
    return result;
  }, [budgets, transactions]);

  // Map DemoDataContext budgets to display budgets
  const displayBudgets: DisplayBudget[] = useMemo(() => {
    return budgets.map((budget) => {
      // Always use computed spent from real transactions (never fallback to hardcoded budget.spent)
      const spent = spentByBudget[budget.id] ?? 0;
      const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;
      const remaining = budget.amount - spent;

      let status: 'safe' | 'warning' | 'over' = 'safe';
      if (percentage > 100) {
        status = 'over';
      } else if (percentage >= 80) {
        status = 'warning';
      }

      // Get icon and color from first category, or fallback
      const firstCatId = budget.categories[0];
      const firstCat = firstCatId ? categoryMap[firstCatId] : null;

      return {
        id: budget.id,
        name: budget.name,
        icon: firstCat?.icon || 'folder',
        color: firstCat?.color || '#3B82F6',
        limit: budget.amount,
        spent,
        remaining,
        percentage,
        status,
      };
    });
  }, [budgets, categoryMap, spentByBudget]);

  const handlePrevMonth = () => {
    setSelectedMonth((prev) => (prev === 0 ? 11 : prev - 1));
  };

  const handleNextMonth = () => {
    setSelectedMonth((prev) => (prev === 11 ? 0 : prev + 1));
  };

  const handleCreateBudget = () => {
    nav.goCreateBudget();
  };

  const handleBudgetClick = (id: string) => {
    nav.goBudgetDetail(id);
  };

  const handleDeleteBudget = (budget: DisplayBudget) => {
    setBudgetToDelete(budget);
    setDeleteModalOpen(true);
  };

  const confirmDeleteBudget = () => {
    if (budgetToDelete) {
      deleteBudget(budgetToDelete.id);
      toast.success(`Đã xoá ngân sách "${budgetToDelete.name}"`);
      setDeleteModalOpen(false);
      setBudgetToDelete(null);
    }
  };

  // Calculate totals
  const totalLimit = displayBudgets.reduce((sum, b) => sum + b.limit, 0);
  const totalSpent = displayBudgets.reduce((sum, b) => sum + b.spent, 0);
  const totalRemaining = totalLimit - totalSpent;
  const overallPercentage = totalLimit > 0 ? (totalSpent / totalLimit) * 100 : 0;

  const onTrackCount = displayBudgets.filter((b) => b.status === 'safe').length;
  const warningCount = displayBudgets.filter((b) => b.status === 'warning').length;
  const overCount = displayBudgets.filter((b) => b.status === 'over').length;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN').format(amount);
  };

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="max-w-6xl mx-auto p-4 md:p-6 pb-20 md:pb-6 space-y-6">
        {/* Header with Month Selector */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Ngân sách</h1>
            <p className="text-sm text-[var(--text-secondary)] mt-1">
              Quản lý chi tiêu theo danh mục
            </p>
          </div>

          {/* Month Selector */}
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrevMonth}
              className="p-2 rounded-[var(--radius-lg)] hover:bg-[var(--surface)] transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-[var(--text-secondary)]" />
            </button>
            <div className="px-4 py-2 bg-[var(--card)] border border-[var(--border)] rounded-[var(--radius-lg)] min-w-[160px] text-center">
              <p className="text-sm font-semibold text-[var(--text-primary)]">
                {months[selectedMonth]} {selectedYear}
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

        {/* Overall Budget Health Summary */}
        <Card className="bg-gradient-to-br from-[var(--primary)] to-[var(--primary-hover)] text-white">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Total Spent vs Limit */}
            <div className="md:col-span-2">
              <p className="text-sm text-white/80 mb-2">Tổng chi tiêu</p>
              <div className="flex items-baseline gap-3 mb-4">
                <h2 className="text-3xl font-bold tabular-nums">{formatCurrency(totalSpent)}₫</h2>
                <span className="text-lg text-white/80">/ {formatCurrency(totalLimit)}₫</span>
              </div>

              {/* Overall Progress Bar */}
              <div className="mb-3">
                <div className="h-4 bg-white/20 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-white rounded-full transition-all"
                    style={{ width: `${Math.min(overallPercentage, 100)}%` }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-white/90">
                  Còn lại: <span className="font-semibold tabular-nums">{formatCurrency(totalRemaining)}₫</span>
                </span>
                <span className="text-white/90 font-semibold tabular-nums">
                  {overallPercentage.toFixed(1)}%
                </span>
              </div>
            </div>

            {/* Status Summary */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-white" />
                <span className="text-sm text-white/90">
                  <span className="font-semibold tabular-nums">{onTrackCount}</span> Đúng kế hoạch
                </span>
              </div>
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-yellow-300" />
                <span className="text-sm text-white/90">
                  <span className="font-semibold tabular-nums">{warningCount}</span> Sắp vượt
                </span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-red-300" />
                <span className="text-sm text-white/90">
                  <span className="font-semibold tabular-nums">{overCount}</span> Vượt ngân sách
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* Budget Cards List */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">
              Ngân sách theo danh mục
            </h2>
            <button
              onClick={handleCreateBudget}
              className="flex items-center gap-2 px-4 py-2.5 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white rounded-[var(--radius-lg)] transition-colors shadow-[var(--shadow-sm)]"
            >
              <Plus className="w-5 h-5" />
              <span className="font-medium hidden md:inline">Tạo ngân sách</span>
              <span className="font-medium md:hidden">Tạo</span>
            </button>
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
            {[
              { value: 'all', label: 'Tất cả', count: displayBudgets.length },
              { value: 'safe', label: 'Đúng kế hoạch', count: onTrackCount },
              { value: 'warning', label: 'Sắp vượt', count: warningCount },
              { value: 'over', label: 'Vượt', count: overCount },
            ].map((tab) => {
              const isActive = statusFilter === tab.value;
              return (
                <button
                  key={tab.value}
                  onClick={() => setStatusFilter(tab.value as any)}
                  className={`px-4 py-2 rounded-[var(--radius-lg)] text-sm font-medium transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-[var(--primary)] text-white shadow-[var(--shadow-sm)]'
                      : 'bg-[var(--card)] text-[var(--text-secondary)] hover:bg-[var(--surface)] border border-[var(--border)]'
                  }`}
                >
                  {tab.label} ({tab.count})
                </button>
              );
            })}
          </div>

          {/* Search */}
          {displayBudgets.length > 0 && (
            <div className="flex gap-3 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-tertiary)]" />
                <input
                  type="text"
                  placeholder="Tìm kiếm ngân sách..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-10 py-2.5 bg-[var(--card)] border border-[var(--border)] rounded-[var(--radius-lg)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-[var(--radius-sm)] hover:bg-[var(--surface)] transition-colors"
                  >
                    <X className="w-4 h-4 text-[var(--text-tertiary)]" />
                  </button>
                )}
              </div>
              <div className="relative flex-shrink-0">
                <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)] pointer-events-none" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="pl-9 pr-8 py-2.5 bg-[var(--card)] border border-[var(--border)] rounded-[var(--radius-lg)] text-sm text-[var(--text-primary)] appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]"
                >
                  <option value="percentage">Tiến độ</option>
                  <option value="amount">Ngân sách</option>
                  <option value="name">Tên A-Z</option>
                </select>
              </div>
            </div>
          )}

          {(() => {
            const filteredBudgets = displayBudgets
              .filter(b => statusFilter === 'all' || b.status === statusFilter)
              .filter(b => !searchQuery || b.name.toLowerCase().includes(searchQuery.toLowerCase()))
              .sort((a, b) => {
                if (sortBy === 'percentage') return b.percentage - a.percentage;
                if (sortBy === 'amount') return b.limit - a.limit;
                return a.name.localeCompare(b.name, 'vi');
              });

            return filteredBudgets.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredBudgets.map((budget) => (
                  <SwipeableRow
                    key={budget.id}
                    actions={[
                      {
                        icon: <Edit2 className="w-4 h-4" />,
                        label: 'Sửa',
                        color: 'white',
                        bgColor: 'var(--primary)',
                        onClick: () => nav.goEditBudget(budget.id),
                      },
                      {
                        icon: <Trash2 className="w-4 h-4" />,
                        label: 'Xoá',
                        color: 'white',
                        bgColor: 'var(--danger)',
                        onClick: () => handleDeleteBudget(budget),
                      },
                    ]}
                  >
                    <BudgetCard
                      budget={budget}
                      onClick={() => handleBudgetClick(budget.id)}
                      onDelete={() => handleDeleteBudget(budget)}
                    />
                  </SwipeableRow>
                ))}
              </div>
            ) : displayBudgets.length === 0 ? (
              <Card>
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-[var(--surface)] rounded-full flex items-center justify-center mx-auto mb-4">
                    <TrendingUp className="w-8 h-8 text-[var(--text-tertiary)]" />
                  </div>
                  <h3 className="font-semibold text-[var(--text-primary)] mb-2">
                    Chưa có ngân sách nào
                  </h3>
                  <p className="text-sm text-[var(--text-secondary)] mb-6">
                    Tạo ngân sách đầu tiên để kiểm soát chi tiêu
                  </p>
                  <button
                    onClick={handleCreateBudget}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white rounded-[var(--radius-lg)] transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                    <span className="font-medium">Tạo ngân sách</span>
                  </button>
                </div>
              </Card>
            ) : (
              <Card>
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-[var(--surface)] rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search className="w-8 h-8 text-[var(--text-tertiary)]" />
                  </div>
                  <h3 className="font-semibold text-[var(--text-primary)] mb-2">
                    Không tìm thấy ngân sách
                  </h3>
                  <p className="text-sm text-[var(--text-secondary)]">
                    Thử thay đổi bộ lọc hoặc từ khoá tìm kiếm
                  </p>
                </div>
              </Card>
            );
          })()}
        </div>

        {/* Insights */}
        <Card>
          <h3 className="font-semibold text-[var(--text-primary)] mb-4">Thông tin hữu ích</h3>
          <div className="space-y-3">
            {overCount > 0 && (
              <div className="flex items-start gap-3 p-3 rounded-[var(--radius-lg)] bg-[var(--danger-light)]">
                <AlertCircle className="w-5 h-5 text-[var(--danger)] flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-[var(--text-primary)] mb-1">
                    {overCount} danh mục vượt ngân sách
                  </p>
                  <p className="text-xs text-[var(--text-secondary)]">
                    Xem xét giảm chi tiêu hoặc điều chỉnh ngân sách cho phù hợp
                  </p>
                </div>
              </div>
            )}

            {warningCount > 0 && (
              <div className="flex items-start gap-3 p-3 rounded-[var(--radius-lg)] bg-[var(--warning-light)]">
                <TrendingUp className="w-5 h-5 text-[var(--warning)] flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-[var(--text-primary)] mb-1">
                    {warningCount} danh mục sắp vượt ngân sách
                  </p>
                  <p className="text-xs text-[var(--text-secondary)]">
                    Theo dõi sát chi tiêu trong những ngày tới
                  </p>
                </div>
              </div>
            )}

            {onTrackCount === displayBudgets.length && displayBudgets.length > 0 && (
              <div className="flex items-start gap-3 p-3 rounded-[var(--radius-lg)] bg-[var(--success-light)]">
                <CheckCircle className="w-5 h-5 text-[var(--success)] flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-[var(--text-primary)] mb-1">
                    Tất cả đúng kế hoạch!
                  </p>
                  <p className="text-xs text-[var(--text-secondary)]">
                    Bạn đang quản lý chi tiêu rất tốt. Tiếp tục duy trì nhé!
                  </p>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Delete Modal */}
        <ConfirmationModal
          isOpen={deleteModalOpen}
          onClose={() => { setDeleteModalOpen(false); setBudgetToDelete(null); }}
          onConfirm={confirmDeleteBudget}
          title="Xoá ngân sách?"
          description={`Bạn có chắc muốn xoá ngân sách "${budgetToDelete?.name || ''}"? Hành động này không thể hoàn tác.`}
          confirmLabel="Xoá"
          cancelLabel="Huỷ"
          isDangerous={true}
        />
      </div>
    </div>
  );
}
import React, { useState, useMemo } from 'react';
import { useParams } from 'react-router';
import {
  ArrowLeft, Edit2, Plus, Trash2,
  Utensils, ShoppingBag, Home, Car, Heart, Gift, Folder,
  Briefcase, TrendingUp, PlusCircle, Smile, Book, Dumbbell,
  AlertTriangle, Bell, BellOff,
} from 'lucide-react';
import { Card } from '../components/Card';
import { useAppNavigation } from '../hooks/useAppNavigation';
import { useDemoData } from '../contexts/DemoDataContext';
import { useToast } from '../contexts/ToastContext';
import { ConfirmationModal } from '../components/ConfirmationModals';

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

interface DisplayBudgetItem {
  id: string;
  categoryId: string;
  categoryName: string;
  icon: string;
  color: string;
  limit: number;
  spent: number;
  remaining: number;
  percentage: number;
  status: 'safe' | 'warning' | 'over';
  transactionCount: number;
}

// ── Progress Bar with Threshold Markers ───────────────────────────────────────

function ThresholdProgressBar({
  percentage,
  thresholds,
  statusColor,
  height = 'h-3',
  bgClass = 'bg-[var(--surface)]',
}: {
  percentage: number;
  thresholds: number[];
  statusColor: string;
  height?: string;
  bgClass?: string;
}) {
  return (
    <div className={`relative ${height} ${bgClass} rounded-full overflow-visible`}>
      {/* Progress fill */}
      <div
        className={`absolute inset-y-0 left-0 rounded-full transition-all`}
        style={{
          width: `${Math.min(percentage, 100)}%`,
          backgroundColor: statusColor,
        }}
      />
      {/* Threshold markers */}
      {thresholds.map(t => {
        const crossed = percentage >= t;
        return (
          <div
            key={t}
            className="absolute top-1/2 -translate-y-1/2 z-10"
            style={{ left: `${t}%` }}
          >
            {/* Marker line */}
            <div
              className={`w-0.5 h-5 -translate-x-1/2 rounded-full ${
                crossed ? 'bg-[var(--text-primary)]' : 'bg-[var(--text-tertiary)]'
              }`}
              style={{ marginTop: '-3px' }}
            />
            {/* Label */}
            <span
              className={`absolute -translate-x-1/2 text-[9px] font-semibold tabular-nums whitespace-nowrap ${
                crossed
                  ? t >= 100 ? 'text-[var(--danger)]' : t >= 80 ? 'text-[var(--warning)]' : 'text-[var(--info)]'
                  : 'text-[var(--text-tertiary)]'
              }`}
              style={{ top: '14px' }}
            >
              {t}%
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ── Budget Item Row ───────────────────────────────────────────────────────────

interface BudgetItemRowProps {
  item: DisplayBudgetItem;
  thresholds: number[];
}

function BudgetItemRow({ item, thresholds }: BudgetItemRowProps) {
  const Icon = getIcon(item.icon);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN').format(Math.abs(amount));
  };

  const getStatusColor = () => {
    if (item.status === 'over') return 'var(--danger)';
    if (item.status === 'warning') return 'var(--warning)';
    return 'var(--success)';
  };

  // Figure out the highest crossed threshold
  const crossedThreshold = [...thresholds].sort((a, b) => b - a).find(t => item.percentage >= t);

  return (
    <Card>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className="p-2.5 rounded-[var(--radius-lg)]"
            style={{ backgroundColor: `${item.color}20` }}
          >
            <Icon className="w-5 h-5" style={{ color: item.color }} />
          </div>
          <div>
            <h3 className="font-semibold text-[var(--text-primary)]">{item.categoryName}</h3>
            <p className="text-xs text-[var(--text-tertiary)]">
              {item.transactionCount} giao dịch
            </p>
          </div>
        </div>
        {/* Alert badge — shows highest crossed threshold */}
        {crossedThreshold && (
          <span className={`px-2 py-1 text-xs font-semibold rounded-[var(--radius-md)] ${
            crossedThreshold >= 100
              ? 'bg-[var(--danger-light)] text-[var(--danger)]'
              : crossedThreshold >= 80
                ? 'bg-[var(--warning-light)] text-[var(--warning)]'
                : 'bg-[var(--info-light)] text-[var(--info)]'
          }`}>
            Đã cảnh báo {crossedThreshold}%
          </span>
        )}
      </div>

      {/* Progress with threshold markers */}
      <div className="mb-6">
        <ThresholdProgressBar
          percentage={item.percentage}
          thresholds={thresholds}
          statusColor={getStatusColor()}
        />
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-3 gap-4 text-center">
        <div>
          <p className="text-xs text-[var(--text-secondary)] mb-1">Đã chi</p>
          <p className="text-sm font-semibold text-[var(--text-primary)] tabular-nums">
            {formatCurrency(item.spent)}₫
          </p>
        </div>
        <div>
          <p className="text-xs text-[var(--text-secondary)] mb-1">Giới hạn</p>
          <p className="text-sm font-semibold text-[var(--text-primary)] tabular-nums">
            {formatCurrency(item.limit)}₫
          </p>
        </div>
        <div>
          <p className="text-xs text-[var(--text-secondary)] mb-1">Còn lại</p>
          <p
            className={`text-sm font-semibold tabular-nums ${
              item.remaining < 0 ? 'text-[var(--danger)]' : 'text-[var(--success)]'
            }`}
          >
            {item.remaining < 0 ? '-' : ''}
            {formatCurrency(item.remaining)}₫
          </p>
        </div>
      </div>

      {/* Status Badge */}
      <div className="mt-4 pt-4 border-t border-[var(--divider)] flex items-center justify-between">
        <span className="text-sm text-[var(--text-secondary)]">
          Tiến độ: <span className="font-semibold tabular-nums">{item.percentage.toFixed(1)}%</span>
        </span>
        {item.status === 'over' && (
          <span className="px-2 py-1 text-xs font-semibold bg-[var(--danger-light)] text-[var(--danger)] rounded-[var(--radius-md)]">
            Vượt ngân sách
          </span>
        )}
        {item.status === 'warning' && (
          <span className="px-2 py-1 text-xs font-semibold bg-[var(--warning-light)] text-[var(--warning)] rounded-[var(--radius-md)]">
            Sắp vượt
          </span>
        )}
        {item.status === 'safe' && (
          <span className="px-2 py-1 text-xs font-semibold bg-[var(--success-light)] text-[var(--success)] rounded-[var(--radius-md)]">
            Đúng kế hoạch
          </span>
        )}
      </div>
    </Card>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function BudgetDetail() {
  const { id } = useParams<{ id: string }>();
  const nav = useAppNavigation();
  const { budgets, categories, transactions, deleteBudget } = useDemoData();
  const toast = useToast();
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  const budget = budgets.find((b) => b.id === id);

  const categoryMap = useMemo(() => {
    const map: Record<string, { name: string; icon: string; color: string }> = {};
    categories.forEach((cat) => {
      map[cat.id] = { name: cat.name, icon: cat.icon, color: cat.color };
    });
    return map;
  }, [categories]);

  const txCountByCat = useMemo(() => {
    const map: Record<string, number> = {};
    transactions.forEach((tx) => {
      if (tx.categoryId) map[tx.categoryId] = (map[tx.categoryId] || 0) + 1;
    });
    return map;
  }, [transactions]);

  const spentByCat = useMemo(() => {
    if (!budget) return {};
    const map: Record<string, number> = {};
    transactions.forEach((tx) => {
      if (tx.type !== 'expense') return;
      if (!tx.categoryId) return;
      if (tx.date < budget.startDate || tx.date > budget.endDate) return;
      map[tx.categoryId] = (map[tx.categoryId] || 0) + Math.abs(tx.amount);
    });
    return map;
  }, [transactions, budget]);

  const budgetItems: DisplayBudgetItem[] = useMemo(() => {
    if (!budget) return [];

    if (budget.items && budget.items.length > 0) {
      return budget.items.map((item) => {
        const cat = categoryMap[item.categoryId];
        const spent = spentByCat[item.categoryId] || 0;
        const percentage = item.amount > 0 ? (spent / item.amount) * 100 : 0;
        const remaining = item.amount - spent;
        let status: 'safe' | 'warning' | 'over' = 'safe';
        if (percentage > 100) status = 'over';
        else if (percentage >= 80) status = 'warning';

        return {
          id: item.id,
          categoryId: item.categoryId,
          categoryName: cat?.name || item.categoryName,
          icon: cat?.icon || 'folder',
          color: cat?.color || '#3B82F6',
          limit: item.amount,
          spent,
          remaining,
          percentage,
          status,
          transactionCount: txCountByCat[item.categoryId] || 0,
        };
      });
    }

    const catCount = budget.categories.length || 1;
    const perCatLimit = Math.round(budget.amount / catCount);

    return budget.categories.map((catId, idx) => {
      const cat = categoryMap[catId];
      const limit = perCatLimit;
      const spent = spentByCat[catId] || 0;
      const percentage = limit > 0 ? (spent / limit) * 100 : 0;
      const remaining = limit - spent;
      let status: 'safe' | 'warning' | 'over' = 'safe';
      if (percentage > 100) status = 'over';
      else if (percentage >= 80) status = 'warning';

      return {
        id: `item-${idx}`,
        categoryId: catId,
        categoryName: cat?.name || catId,
        icon: cat?.icon || 'folder',
        color: cat?.color || '#3B82F6',
        limit,
        spent,
        remaining,
        percentage,
        status,
        transactionCount: txCountByCat[catId] || 0,
      };
    });
  }, [budget, categoryMap, txCountByCat, spentByCat]);

  const handleBack = () => nav.goBack();
  const handleEdit = () => nav.goEditBudget(id || '');
  const handleAddItem = () => nav.goAddBudgetItem(id || '');

  const formatCurrency = (amount: number) => new Intl.NumberFormat('vi-VN').format(amount);
  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  if (!budget) {
    return (
      <div className="min-h-screen bg-[var(--background)]">
        <div className="max-w-4xl mx-auto p-4 md:p-6 pb-20 md:pb-6 space-y-6">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Quay lại</span>
          </button>
          <Card>
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-[var(--warning-light)] rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-[var(--warning)]" />
              </div>
              <h3 className="font-semibold text-[var(--text-primary)] mb-2">
                Không tìm thấy ngân sách
              </h3>
              <p className="text-sm text-[var(--text-secondary)] mb-6">
                Ngân sách này có thể đã bị xoá hoặc không tồn tại.
              </p>
              <button
                onClick={() => nav.goBudgets()}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white rounded-[var(--radius-lg)] transition-colors"
              >
                <span className="font-medium">Về danh sách ngân sách</span>
              </button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  const totalLimit = budget.amount;
  const totalSpent = budgetItems.reduce((sum, item) => sum + item.spent, 0);
  const totalRemaining = totalLimit - totalSpent;
  const overallPercentage = totalLimit > 0 ? (totalSpent / totalLimit) * 100 : 0;

  const thresholds = budget.alertThresholds || [];
  const alertsEnabled = budget.alertsEnabled !== false;

  // Find highest crossed threshold for overall badge
  const overallCrossedThreshold = [...thresholds].sort((a, b) => b - a).find(t => overallPercentage >= t);

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="max-w-4xl mx-auto p-4 md:p-6 pb-20 md:pb-6 space-y-6">
        {/* Header */}
        <div>
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Quay lại</span>
          </button>

          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
                  {budget.name}
                </h1>
                {/* Alert status indicator */}
                {alertsEnabled ? (
                  <Bell className="w-5 h-5 text-[var(--success)]" />
                ) : (
                  <BellOff className="w-5 h-5 text-[var(--text-tertiary)]" />
                )}
              </div>
              <p className="text-sm text-[var(--text-secondary)]">
                {formatDate(budget.startDate)} - {formatDate(budget.endDate)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleEdit}
                className="flex items-center gap-2 px-4 py-2.5 border border-[var(--border)] text-[var(--text-primary)] rounded-[var(--radius-lg)] font-medium hover:bg-[var(--surface)] transition-colors"
              >
                <Edit2 className="w-4 h-4" />
                <span>Chỉnh sửa</span>
              </button>
              <button
                onClick={() => setDeleteModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 border border-[var(--danger)] text-[var(--danger)] rounded-[var(--radius-lg)] font-medium hover:bg-[var(--danger-light)] transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span>Xoá</span>
              </button>
            </div>
          </div>
        </div>

        {/* Summary Card */}
        <Card className="bg-gradient-to-br from-[var(--primary)] to-[var(--primary-hover)] text-white">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
              <div>
                <p className="text-sm text-white/80 mb-2">Tổng đã chi</p>
                <p className="text-2xl font-bold tabular-nums">{formatCurrency(totalSpent)}₫</p>
              </div>
              <div>
                <p className="text-sm text-white/80 mb-2">Tổng giới hạn</p>
                <p className="text-2xl font-bold tabular-nums">{formatCurrency(totalLimit)}₫</p>
              </div>
              <div>
                <p className="text-sm text-white/80 mb-2">Còn lại</p>
                <p className="text-2xl font-bold tabular-nums">
                  {totalRemaining < 0 ? '-' : ''}
                  {formatCurrency(Math.abs(totalRemaining))}₫
                </p>
              </div>
            </div>

            {/* Overall Progress with threshold markers */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-white/80">Tiến độ tổng</span>
                <div className="flex items-center gap-2">
                  {overallCrossedThreshold && (
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                      overallCrossedThreshold >= 100
                        ? 'bg-red-500/30 text-red-200'
                        : overallCrossedThreshold >= 80
                          ? 'bg-yellow-500/30 text-yellow-200'
                          : 'bg-blue-500/30 text-blue-200'
                    }`}>
                      Đã cảnh báo {overallCrossedThreshold}%
                    </span>
                  )}
                  <span className="text-sm font-semibold text-white tabular-nums">
                    {overallPercentage.toFixed(1)}%
                  </span>
                </div>
              </div>
              {/* Progress bar with markers */}
              <div className="relative h-4 bg-white/20 rounded-full overflow-visible">
                <div
                  className="absolute inset-y-0 left-0 bg-white rounded-full transition-all"
                  style={{ width: `${Math.min(overallPercentage, 100)}%` }}
                />
                {/* Threshold markers on summary bar */}
                {thresholds.map(t => (
                  <div
                    key={t}
                    className="absolute top-1/2 -translate-y-1/2 z-10"
                    style={{ left: `${t}%` }}
                  >
                    <div className={`w-0.5 h-6 -translate-x-1/2 rounded-full ${
                      overallPercentage >= t ? 'bg-white' : 'bg-white/40'
                    }`} />
                  </div>
                ))}
              </div>
              {/* Threshold labels */}
              {thresholds.length > 0 && (
                <div className="flex gap-2 mt-2">
                  {thresholds.map(t => (
                    <span key={t} className={`text-[10px] tabular-nums ${
                      overallPercentage >= t ? 'text-white font-semibold' : 'text-white/50'
                    }`}>
                      {t}%
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Alert Configuration Summary */}
        {alertsEnabled && thresholds.length > 0 && (
          <Card className="bg-[var(--surface)]">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-[var(--primary)]" />
              <div className="flex-1">
                <p className="text-sm font-medium text-[var(--text-primary)]">
                  Cảnh báo đang bật
                </p>
                <p className="text-xs text-[var(--text-secondary)]">
                  Ngưỡng: {thresholds.map(t => `${t}%`).join(', ')} • Channel: In-app Inbox
                </p>
              </div>
              <div className="flex gap-1.5">
                {thresholds.map(t => {
                  const crossed = overallPercentage >= t;
                  return (
                    <span
                      key={t}
                      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold tabular-nums ${
                        crossed
                          ? t >= 100
                            ? 'bg-[var(--danger-light)] text-[var(--danger)]'
                            : t >= 80
                              ? 'bg-[var(--warning-light)] text-[var(--warning)]'
                              : 'bg-[var(--info-light)] text-[var(--info)]'
                          : 'bg-[var(--surface)] text-[var(--text-tertiary)] border border-[var(--border)]'
                      }`}
                    >
                      {t}%{crossed ? ' ✓' : ''}
                    </span>
                  );
                })}
              </div>
            </div>
          </Card>
        )}

        {/* Budget Items Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">
              Chi tiết ngân sách ({budgetItems.length})
            </h2>
            <button
              onClick={handleAddItem}
              className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white rounded-[var(--radius-lg)] text-sm font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm danh mục</span>
            </button>
          </div>

          <div className="space-y-4">
            {budgetItems.map((item) => (
              <BudgetItemRow key={item.id} item={item} thresholds={thresholds} />
            ))}
          </div>
        </div>

        {/* Info Card */}
        <Card className="bg-[var(--info-light)] border-[var(--info)]">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-[var(--info)] rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white text-lg font-semibold">💡</span>
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-[var(--text-primary)] mb-1">
                Mẹo quản lý ngân sách
              </h4>
              <p className="text-sm text-[var(--text-secondary)]">
                Kiểm tra ngân sách hàng tuần để đảm bảo chi tiêu đúng kế hoạch. Điều chỉnh kịp thời
                nếu thấy có dấu hiệu vượt ngân sách.
              </p>
            </div>
          </div>
        </Card>

        {/* Delete Confirmation Modal */}
        <ConfirmationModal
          isOpen={deleteModalOpen}
          onClose={() => setDeleteModalOpen(false)}
          onConfirm={() => {
            deleteBudget(budget.id);
            toast.success(`Đã xoá ngân sách "${budget.name}"`);
            nav.goBudgets();
          }}
          title="Xoá ngân sách?"
          description={`Bạn có chắc muốn xoá ngân sách "${budget.name}"? Hành động này không thể hoàn tác.`}
          confirmLabel="Xoá"
          cancelLabel="Huỷ"
          isDangerous={true}
        />
      </div>
    </div>
  );
}

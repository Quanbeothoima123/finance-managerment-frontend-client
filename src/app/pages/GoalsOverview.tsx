import React, { useState, useMemo } from 'react';
import {
  Plus,
  Target,
  Calendar,
  TrendingUp,
  CheckCircle,
  Clock,
  Smartphone,
  Plane,
  ShieldCheck,
  Bike,
  BookOpen,
  Home,
  Car,
  Gift,
  Heart,
  Folder,
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
import { useGoalUndoDelete } from '../hooks/useGoalUndoDelete';

// Icon mapping from goal icon string → lucide component
const goalIconMap: Record<string, React.ComponentType<any>> = {
  smartphone: Smartphone,
  plane: Plane,
  shield: ShieldCheck,
  bike: Bike,
  book: BookOpen,
  home: Home,
  car: Car,
  gift: Gift,
  heart: Heart,
  target: Target,
  folder: Folder,
};

function getGoalIcon(iconName: string): React.ComponentType<any> | null {
  return goalIconMap[iconName] || null;
}

// Display goal for cards
interface DisplayGoal {
  id: string;
  name: string;
  icon: string;
  color: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
  percentage: number;
  status: 'on-track' | 'behind' | 'achieved';
  priority: 'high' | 'medium' | 'low';
}

interface GoalCardProps {
  goal: DisplayGoal;
  onClick: () => void;
  onDelete: () => void;
}

function GoalCard({ goal, onClick, onDelete }: GoalCardProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN').format(amount);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const getDaysRemaining = () => {
    const today = new Date();
    const target = new Date(goal.deadline);
    const diff = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const daysRemaining = getDaysRemaining();
  const remaining = goal.targetAmount - goal.currentAmount;

  const getStatusColor = () => {
    if (goal.status === 'achieved') return 'var(--success)';
    if (goal.status === 'behind') return 'var(--warning)';
    return 'var(--primary)';
  };

  const getStatusBg = () => {
    if (goal.status === 'achieved') return 'var(--success-light)';
    if (goal.status === 'behind') return 'var(--warning-light)';
    return 'var(--primary-light)';
  };

  const getStatusText = () => {
    if (goal.status === 'achieved') return 'Hoàn thành';
    if (goal.status === 'behind') return 'Cần tăng tốc';
    return 'Đúng tiến độ';
  };

  const getStatusIcon = () => {
    if (goal.status === 'achieved') return CheckCircle;
    if (goal.status === 'behind') return Clock;
    return TrendingUp;
  };

  const StatusIcon = getStatusIcon();
  const GoalIconComponent = getGoalIcon(goal.icon);

  return (
    <Card className="cursor-pointer hover:shadow-[var(--shadow-md)] transition-all" onClick={onClick}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-[var(--radius-lg)] flex items-center justify-center text-2xl"
            style={{ backgroundColor: `${goal.color}20` }}
          >
            {GoalIconComponent ? (
              <GoalIconComponent className="w-6 h-6" style={{ color: goal.color }} />
            ) : (
              <Target className="w-6 h-6" style={{ color: goal.color }} />
            )}
          </div>
          <div>
            <h3 className="font-semibold text-[var(--text-primary)]">{goal.name}</h3>
            <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
              {goal.priority === 'high' ? 'Ưu tiên cao' : goal.priority === 'medium' ? 'Ưu tiên TB' : 'Ưu tiên thấp'}
            </p>
          </div>
        </div>
        <div
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-[var(--radius-md)] text-xs font-semibold"
          style={{
            backgroundColor: getStatusBg(),
            color: getStatusColor(),
          }}
        >
          <StatusIcon className="w-3.5 h-3.5" />
          <span>{getStatusText()}</span>
        </div>
      </div>

      {/* Progress */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-[var(--text-secondary)]">
            <span className="font-semibold text-[var(--text-primary)] tabular-nums">
              {formatCurrency(goal.currentAmount)}₫
            </span>{' '}
            / {formatCurrency(goal.targetAmount)}₫
          </span>
          <span className="text-sm font-semibold tabular-nums" style={{ color: getStatusColor() }}>
            {goal.percentage.toFixed(0)}%
          </span>
        </div>
        <div className="h-3 bg-[var(--surface)] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${Math.min(goal.percentage, 100)}%`,
              backgroundColor: getStatusColor(),
            }}
          />
        </div>
      </div>

      {/* Footer */}
      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[var(--divider)]">
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <Calendar className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
            <span className="text-xs text-[var(--text-secondary)]">Mục tiêu</span>
          </div>
          <p className="text-sm font-semibold text-[var(--text-primary)] tabular-nums">
            {formatDate(goal.deadline)}
          </p>
        </div>
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <Target className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
            <span className="text-xs text-[var(--text-secondary)]">Còn lại</span>
          </div>
          <p
            className={`text-sm font-semibold tabular-nums ${
              goal.status === 'achieved' ? 'text-[var(--success)]' : 'text-[var(--text-primary)]'
            }`}
          >
            {goal.status === 'achieved' ? '0₫' : `${formatCurrency(remaining)}₫`}
          </p>
        </div>
      </div>

      {/* Days Remaining */}
      {goal.status !== 'achieved' && (
        <div className="mt-3 pt-3 border-t border-[var(--divider)] flex items-center justify-between">
          <p
            className={`text-xs font-medium ${
              daysRemaining < 30 ? 'text-[var(--warning)]' : 'text-[var(--text-secondary)]'
            }`}
          >
            {daysRemaining > 0 ? `Còn ${daysRemaining} ngày` : 'Đã quá hạn'}
          </p>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="hidden md:inline text-xs text-[var(--text-tertiary)] hover:text-[var(--danger)] transition-colors"
          >
            Xoá
          </button>
        </div>
      )}

      {goal.status === 'achieved' && (
        <div className="mt-3 pt-3 border-t border-[var(--divider)] flex items-center justify-between">
          <p className="text-xs font-medium text-[var(--success)]">Đã hoàn thành!</p>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="hidden md:inline text-xs text-[var(--text-tertiary)] hover:text-[var(--danger)] transition-colors"
          >
            Xoá
          </button>
        </div>
      )}
    </Card>
  );
}

export default function GoalsOverview() {
  const [filter, setFilter] = useState<'all' | 'on-track' | 'behind' | 'achieved'>('all');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [goalToDelete, setGoalToDelete] = useState<DisplayGoal | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'deadline' | 'progress' | 'amount' | 'name'>('deadline');
  const { goals } = useDemoData();
  const nav = useAppNavigation();
  const toast = useToast();
  const { softDeleteGoal } = useGoalUndoDelete();

  // Map DemoDataContext goals to display goals
  const displayGoals: DisplayGoal[] = useMemo(() => {
    return goals.map((goal) => {
      const percentage = goal.targetAmount > 0
        ? (goal.currentAmount / goal.targetAmount) * 100
        : 0;

      return {
        id: goal.id,
        name: goal.name,
        icon: goal.icon,
        color: goal.color,
        targetAmount: goal.targetAmount,
        currentAmount: goal.currentAmount,
        deadline: goal.deadline,
        percentage,
        status: goal.status,
        priority: goal.priority,
      };
    });
  }, [goals]);

  const handleCreateGoal = () => {
    nav.goCreateGoal();
  };

  const handleGoalClick = (id: string) => {
    nav.goGoalDetail(id);
  };

  const handleDeleteGoal = (goal: DisplayGoal) => {
    setGoalToDelete(goal);
    setDeleteModalOpen(true);
  };

  const confirmDeleteGoal = () => {
    if (goalToDelete) {
      softDeleteGoal(goalToDelete.id);
      setDeleteModalOpen(false);
      setGoalToDelete(null);
    }
  };

  const filteredGoals = displayGoals.filter((goal) => {
    const matchesFilter = filter === 'all' || goal.status === filter;
    const matchesSearch = !searchQuery || goal.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const totalSaved = displayGoals.reduce((sum, goal) => sum + goal.currentAmount, 0);
  const totalTarget = displayGoals.reduce((sum, goal) => sum + goal.targetAmount, 0);
  const overallPercentage = totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0;

  const onTrackCount = displayGoals.filter((g) => g.status === 'on-track').length;
  const behindCount = displayGoals.filter((g) => g.status === 'behind').length;
  const achievedCount = displayGoals.filter((g) => g.status === 'achieved').length;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN').format(amount);
  };

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="max-w-6xl mx-auto p-4 md:p-6 pb-20 md:pb-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Mục tiêu</h1>
            <p className="text-sm text-[var(--text-secondary)] mt-1">
              Theo dõi và quản lý mục tiêu tài chính
            </p>
          </div>
          <button
            onClick={handleCreateGoal}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white rounded-[var(--radius-lg)] transition-colors shadow-[var(--shadow-sm)]"
          >
            <Plus className="w-5 h-5" />
            <span className="font-medium">Tạo mục tiêu</span>
          </button>
        </div>

        {/* Overall Summary */}
        <Card className="bg-gradient-to-br from-[var(--primary)] to-[var(--primary-hover)] text-white">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Total Progress */}
            <div className="md:col-span-2">
              <p className="text-sm text-white/80 mb-2">Tổng tiến độ</p>
              <div className="flex items-baseline gap-3 mb-4">
                <h2 className="text-3xl font-bold tabular-nums">{formatCurrency(totalSaved)}₫</h2>
                <span className="text-lg text-white/80">/ {formatCurrency(totalTarget)}₫</span>
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
                  Còn lại:{' '}
                  <span className="font-semibold tabular-nums">
                    {formatCurrency(totalTarget - totalSaved)}₫
                  </span>
                </span>
                <span className="text-white/90 font-semibold tabular-nums">
                  {overallPercentage.toFixed(1)}%
                </span>
              </div>
            </div>

            {/* Status Summary */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-white" />
                <span className="text-sm text-white/90">
                  <span className="font-semibold tabular-nums">{onTrackCount}</span> Đúng tiến độ
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-yellow-300" />
                <span className="text-sm text-white/90">
                  <span className="font-semibold tabular-nums">{behindCount}</span> Cần tăng tốc
                </span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-300" />
                <span className="text-sm text-white/90">
                  <span className="font-semibold tabular-nums">{achievedCount}</span> Hoàn thành
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* Filter Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {[
            { value: 'all', label: 'Tất cả', count: displayGoals.length },
            { value: 'on-track', label: 'Đúng tiến độ', count: onTrackCount },
            { value: 'behind', label: 'Cần tăng tốc', count: behindCount },
            { value: 'achieved', label: 'Hoàn thành', count: achievedCount },
          ].map((tab) => {
            const isActive = filter === tab.value;
            return (
              <button
                key={tab.value}
                onClick={() => setFilter(tab.value as any)}
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
        {displayGoals.length > 0 && (
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-tertiary)]" />
              <input
                type="text"
                placeholder="Tìm kiếm mục tiêu..."
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
                <option value="deadline">Hạn chót</option>
                <option value="progress">Tiến độ</option>
                <option value="amount">Mục tiêu</option>
                <option value="name">Tên A-Z</option>
              </select>
            </div>
          </div>
        )}

        {/* Goals Grid */}
        {filteredGoals.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[...filteredGoals]
              .sort((a, b) => {
                if (sortBy === 'deadline') return a.deadline.localeCompare(b.deadline);
                if (sortBy === 'progress') return b.percentage - a.percentage;
                if (sortBy === 'amount') return b.targetAmount - a.targetAmount;
                return a.name.localeCompare(b.name, 'vi');
              })
              .map((goal) => (
                <SwipeableRow
                  key={goal.id}
                  actions={[
                    {
                      icon: <Edit2 className="w-4 h-4" />,
                      label: 'Sửa',
                      color: 'white',
                      bgColor: 'var(--primary)',
                      onClick: () => nav.goEditGoal(goal.id),
                    },
                    {
                      icon: <Trash2 className="w-4 h-4" />,
                      label: 'Xoá',
                      color: 'white',
                      bgColor: 'var(--danger)',
                      onClick: () => handleDeleteGoal(goal),
                    },
                  ]}
                >
                  <GoalCard goal={goal} onClick={() => handleGoalClick(goal.id)} onDelete={() => handleDeleteGoal(goal)} />
                </SwipeableRow>
              ))}
          </div>
        ) : (
          <Card>
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-[var(--surface)] rounded-full flex items-center justify-center mx-auto mb-4">
                <Target className="w-8 h-8 text-[var(--text-tertiary)]" />
              </div>
              <h3 className="font-semibold text-[var(--text-primary)] mb-2">
                {searchQuery || filter !== 'all'
                  ? 'Không tìm thấy mục tiêu'
                  : 'Chưa có mục tiêu nào'}
              </h3>
              <p className="text-sm text-[var(--text-secondary)] mb-6">
                {searchQuery || filter !== 'all'
                  ? 'Thử thay đổi bộ lọc hoặc từ khoá tìm kiếm'
                  : 'Tạo mục tiêu đầu tiên để bắt đầu hành trình tiết kiệm'}
              </p>
              {!searchQuery && filter === 'all' && (
                <button
                  onClick={handleCreateGoal}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white rounded-[var(--radius-lg)] transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  <span className="font-medium">Tạo mục tiêu</span>
                </button>
              )}
            </div>
          </Card>
        )}

        {/* Motivation Card */}
        {filteredGoals.length > 0 && achievedCount > 0 && (
          <Card className="bg-[var(--success-light)] border-[var(--success)]">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-[var(--success)] rounded-full flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-[var(--text-primary)] mb-1">
                  Chúc mừng!
                </h4>
                <p className="text-sm text-[var(--text-secondary)]">
                  Bạn đã hoàn thành {achievedCount} mục tiêu. Tiếp tục duy trì tiến độ tốt như vậy
                  nhé!
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Delete Confirmation Modal */}
        <ConfirmationModal
          isOpen={deleteModalOpen}
          onClose={() => { setDeleteModalOpen(false); setGoalToDelete(null); }}
          onConfirm={confirmDeleteGoal}
          title="Xoá mục tiêu?"
          description={`Bạn có chắc muốn xoá mục tiêu "${goalToDelete?.name || ''}"? Tất cả đóng góp liên quan cũng sẽ bị xoá.`}
          confirmLabel="Xoá"
          cancelLabel="Huỷ"
          isDangerous={true}
        />
      </div>
    </div>
  );
}
import React, { useState, useRef, useEffect } from 'react';
import {
  Plus, TrendingUp, TrendingDown, Calendar, Trash2, Search, X, ArrowUpDown,
  Edit2, Bell, BellOff, Zap, MoreVertical, Eye, SkipForward, Play, Copy, Clock,
  AlertCircle, PlayCircle,
} from 'lucide-react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { useAppNavigation } from '../hooks/useAppNavigation';
import { useDemoData, RecurringRule } from '../contexts/DemoDataContext';
import { useToast } from '../contexts/ToastContext';
import { ConfirmationModal } from '../components/ConfirmationModals';
import { SwipeableRow } from '../components/SwipeableRow';
import { RecurringCalendar } from '../components/RecurringCalendar';

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('vi-VN').format(amount);
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function getDaysUntil(dateString: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const nextDate = new Date(dateString);
  nextDate.setHours(0, 0, 0, 0);
  return Math.ceil((nextDate.getTime() - today.getTime()) / 86400000);
}

function getFrequencyLabel(freq: string): string {
  switch (freq) {
    case 'daily': return 'Hàng ngày';
    case 'weekly': return 'Hàng tuần';
    case 'monthly': return 'Hàng tháng';
    case 'yearly': return 'Hàng năm';
    default: return freq;
  }
}

// ── Action Menu (⋯) ──────────────────────────────────────────────────────────

interface ActionMenuProps {
  ruleId: string;
  enabled: boolean;
  onViewDetail: () => void;
  onSkipNext: () => void;
  onRunNow: () => void;
  onDuplicate: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

function ActionMenu({ ruleId, enabled, onViewDetail, onSkipNext, onRunNow, onDuplicate, onEdit, onDelete }: ActionMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
        className="p-1.5 rounded-[var(--radius-md)] hover:bg-[var(--surface)] transition-colors"
      >
        <MoreVertical className="w-4 h-4 text-[var(--text-tertiary)]" />
      </button>

      {open && (
        <div className="absolute right-0 top-8 w-52 bg-[var(--card)] border border-[var(--border)] rounded-[var(--radius-lg)] shadow-[var(--shadow-lg)] overflow-hidden z-50">
          <button onClick={() => { setOpen(false); onViewDetail(); }}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--text-primary)] hover:bg-[var(--surface)] transition-colors">
            <Eye className="w-4 h-4 text-[var(--text-secondary)]" /> Xem chi tiết
          </button>
          <button onClick={() => { setOpen(false); onEdit(); }}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--text-primary)] hover:bg-[var(--surface)] transition-colors">
            <Edit2 className="w-4 h-4 text-[var(--text-secondary)]" /> Chỉnh sửa
          </button>
          <div className="border-t border-[var(--border)]" />
          <button onClick={() => { setOpen(false); onSkipNext(); }} disabled={!enabled}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--text-primary)] hover:bg-[var(--surface)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
            <SkipForward className="w-4 h-4 text-[var(--warning)]" /> Bỏ qua lần tiếp
          </button>
          <button onClick={() => { setOpen(false); onRunNow(); }} disabled={!enabled}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--text-primary)] hover:bg-[var(--surface)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
            <Play className="w-4 h-4 text-[var(--success)]" /> Chạy ngay
          </button>
          <button onClick={() => { setOpen(false); onDuplicate(); }}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--text-primary)] hover:bg-[var(--surface)] transition-colors">
            <Copy className="w-4 h-4 text-[var(--text-secondary)]" /> Nhân bản
          </button>
          <div className="border-t border-[var(--border)]" />
          <button onClick={() => { setOpen(false); onDelete(); }}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--danger)] hover:bg-[var(--danger-light)] transition-colors">
            <Trash2 className="w-4 h-4" /> Xoá
          </button>
        </div>
      )}
    </div>
  );
}

// ── Rule Card ─────────────────────────────────────────────────────────────────

interface RuleCardProps {
  rule: RecurringRule;
  onToggle: () => void;
  onViewDetail: () => void;
  onEdit: () => void;
  onSkipNext: () => void;
  onRunNow: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}

function RuleCard({ rule, onToggle, onViewDetail, onEdit, onSkipNext, onRunNow, onDuplicate, onDelete }: RuleCardProps) {
  const amount = Math.abs(rule.amount);
  const daysUntil = getDaysUntil(rule.nextDate);
  const isPaused = !rule.enabled;

  return (
    <Card className={isPaused ? 'opacity-60' : ''}>
      <div className="flex items-start gap-4">
        {/* Type Icon */}
        <button
          onClick={onViewDetail}
          className={`flex-shrink-0 w-12 h-12 rounded-[var(--radius-lg)] flex items-center justify-center transition-transform hover:scale-105 ${
            rule.type === 'income'
              ? 'bg-[var(--success-light)] text-[var(--success)]'
              : 'bg-[var(--danger-light)] text-[var(--danger)]'
          }`}
        >
          {rule.type === 'income' ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1.5">
            <div className="flex-1 min-w-0">
              <button
                onClick={onViewDetail}
                className="font-semibold text-[var(--text-primary)] hover:text-[var(--primary)] transition-colors text-left"
              >
                {rule.name}
              </button>
              <div className="flex flex-wrap items-center gap-1.5 text-sm text-[var(--text-secondary)] mt-0.5">
                <span className={`tabular-nums font-medium ${
                  rule.type === 'income' ? 'text-[var(--success)]' : 'text-[var(--danger)]'
                }`}>
                  {formatCurrency(amount)}₫
                </span>
                <span className="text-[var(--text-tertiary)]">•</span>
                <span>{getFrequencyLabel(rule.frequency)}</span>
              </div>
            </div>

            <div className="flex items-center gap-1 flex-shrink-0">
              {/* Toggle */}
              <button
                onClick={onToggle}
                className={`relative w-10 h-5 rounded-full transition-colors ${
                  rule.enabled ? 'bg-[var(--success)]' : 'bg-[var(--border)]'
                }`}
              >
                <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${
                  rule.enabled ? 'translate-x-5' : 'translate-x-0'
                }`} />
              </button>

              {/* Action menu */}
              <ActionMenu
                ruleId={rule.id}
                enabled={rule.enabled}
                onViewDetail={onViewDetail}
                onSkipNext={onSkipNext}
                onRunNow={onRunNow}
                onDuplicate={onDuplicate}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            </div>
          </div>

          {/* Badges row */}
          <div className="flex flex-wrap gap-1.5 mb-2">
            {/* Mode badge */}
            {rule.executionMode && (
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                rule.executionMode === 'auto'
                  ? 'bg-[var(--warning-light)] text-[var(--warning)]'
                  : 'bg-[var(--info-light)] text-[var(--info)]'
              }`}>
                {rule.executionMode === 'auto' ? <Zap className="w-3 h-3" /> : <Bell className="w-3 h-3" />}
                {rule.executionMode === 'auto' ? 'Tự tạo' : 'Chỉ nhắc'}
              </span>
            )}
            {/* Notification muted badge */}
            {rule.notifyEnabled === false && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-[var(--surface)] text-[var(--text-tertiary)]">
                <BellOff className="w-3 h-3" />
                Tắt thông báo
              </span>
            )}
            {rule.account && (
              <span className="px-2 py-0.5 bg-[var(--surface)] rounded-full text-xs text-[var(--text-secondary)]">
                {rule.account}
              </span>
            )}
            {rule.category && (
              <span className="px-2 py-0.5 bg-[var(--primary-light)] text-[var(--primary)] rounded-full text-xs font-medium">
                {rule.category}
              </span>
            )}
          </div>

          {/* Next Run Status */}
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
            {isPaused ? (
              <span className="text-xs text-[var(--text-tertiary)]">
                Kế tiếp: -- (Tạm dừng)
              </span>
            ) : rule.nextSkipped ? (
              <span className="text-xs">
                <span className="text-[var(--text-secondary)]">Kế tiếp: {formatDate(rule.nextDate)}</span>
                <span className="text-[var(--warning)] ml-1">— Đã bỏ qua</span>
              </span>
            ) : (
              <span className="text-xs text-[var(--text-secondary)]">
                Kế tiếp: {formatDate(rule.nextDate)}
                {daysUntil >= 0 && daysUntil <= 7 && (
                  <span className="ml-1 text-[var(--primary)] font-medium">
                    ({daysUntil === 0 ? 'Hôm nay' : `${daysUntil} ngày nữa`})
                  </span>
                )}
              </span>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

// ── Main List Page ────────────────────────────────────────────────────────────

export default function RecurringRulesList() {
  const {
    recurringRules, updateRecurringRule, deleteRecurringRule,
    generateRecurringTransaction, skipNextOccurrence, duplicateRecurringRule,
  } = useDemoData();
  const nav = useAppNavigation();
  const toast = useToast();

  // Modal states
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [ruleToDelete, setRuleToDelete] = useState<RecurringRule | null>(null);
  const [skipModalOpen, setSkipModalOpen] = useState(false);
  const [ruleToSkip, setRuleToSkip] = useState<RecurringRule | null>(null);
  const [runNowModalOpen, setRunNowModalOpen] = useState(false);
  const [ruleToRun, setRuleToRun] = useState<RecurringRule | null>(null);
  const [pauseModalOpen, setPauseModalOpen] = useState(false);
  const [ruleToPause, setRuleToPause] = useState<RecurringRule | null>(null);
  const [runAllDueModalOpen, setRunAllDueModalOpen] = useState(false);

  // Filter/sort
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [sortBy, setSortBy] = useState<'nextDate' | 'amount' | 'name'>('nextDate');

  // ── Handlers ────────────────────────────────────────────────────────────
  const handleToggle = (rule: RecurringRule) => {
    if (rule.enabled) {
      setRuleToPause(rule);
      setPauseModalOpen(true);
    } else {
      updateRecurringRule(rule.id, { enabled: true });
      toast.success('Đã kích hoạt lại quy tắc định kỳ');
    }
  };

  const confirmPause = () => {
    if (ruleToPause) {
      updateRecurringRule(ruleToPause.id, { enabled: false });
      toast.success('Đã tạm dừng quy tắc định kỳ');
      setPauseModalOpen(false);
      setRuleToPause(null);
    }
  };

  const handleSkipRequest = (rule: RecurringRule) => {
    setRuleToSkip(rule);
    setSkipModalOpen(true);
  };

  const confirmSkip = () => {
    if (ruleToSkip) {
      skipNextOccurrence(ruleToSkip.id);
      toast.success('Đã bỏ qua lần chạy tiếp theo');
      setSkipModalOpen(false);
      setRuleToSkip(null);
    }
  };

  const handleRunNowRequest = (rule: RecurringRule) => {
    setRuleToRun(rule);
    setRunNowModalOpen(true);
  };

  const confirmRunNow = () => {
    if (ruleToRun) {
      generateRecurringTransaction(ruleToRun.id);
      toast.success('Đã tạo giao dịch thành công');
      setRunNowModalOpen(false);
      setRuleToRun(null);
    }
  };

  const handleDuplicate = (rule: RecurringRule) => {
    const newRule = duplicateRecurringRule(rule.id);
    if (newRule) {
      toast.success(`Đã nhân bản "${rule.name}"`);
    }
  };

  const handleDeleteRequest = (rule: RecurringRule) => {
    setRuleToDelete(rule);
    setDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (ruleToDelete) {
      deleteRecurringRule(ruleToDelete.id);
      toast.success(`Đã xoá "${ruleToDelete.name}"`);
      setDeleteModalOpen(false);
      setRuleToDelete(null);
    }
  };

  // ── Computed ─────────────────────────────────────────────────────────────
  const activeRulesCount = recurringRules.filter(r => r.enabled).length;
  const totalMonthlyIncome = recurringRules
    .filter(r => r.type === 'income' && r.frequency === 'monthly' && r.enabled)
    .reduce((sum, r) => sum + Math.abs(r.amount), 0);
  const totalMonthlyExpense = recurringRules
    .filter(r => r.type === 'expense' && r.frequency === 'monthly' && r.enabled)
    .reduce((sum, r) => sum + Math.abs(r.amount), 0);

  // Due rules (nextDate <= today, enabled)
  const dueRules = recurringRules.filter(r => r.enabled && getDaysUntil(r.nextDate) <= 0);
  const dueRulesTotal = dueRules.reduce((sum, r) => sum + Math.abs(r.amount), 0);

  const confirmRunAllDue = () => {
    let count = 0;
    for (const rule of dueRules) {
      try {
        generateRecurringTransaction(rule.id);
        count++;
      } catch {
        // skip failed
      }
    }
    toast.success(`Đã tạo ${count} giao dịch thành công`);
    setRunAllDueModalOpen(false);
  };

  const filteredRules = recurringRules
    .filter(r => r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                 r.description.toLowerCase().includes(searchQuery.toLowerCase()))
    .filter(r => typeFilter === 'all' || r.type === typeFilter)
    .sort((a, b) => {
      if (sortBy === 'nextDate') return new Date(a.nextDate).getTime() - new Date(b.nextDate).getTime();
      if (sortBy === 'amount') return Math.abs(b.amount) - Math.abs(a.amount);
      return a.name.localeCompare(b.name);
    });

  // Build display rules for RecurringCalendar
  const calendarRules = recurringRules.map(r => ({
    id: r.id,
    name: r.name,
    type: r.type as 'income' | 'expense' | 'transfer',
    amount: Math.abs(r.amount),
    frequency: r.frequency,
    nextRunDate: r.nextDate,
    active: r.enabled,
    account: r.account,
    category: r.category,
  }));

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="max-w-5xl mx-auto p-4 md:p-6 pb-20 md:pb-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
              Giao dịch định kỳ
            </h1>
            <p className="text-sm text-[var(--text-secondary)] mt-1">
              Tự động tạo giao dịch theo lịch trình
            </p>
          </div>
          <Button onClick={() => nav.goCreateRecurringRule()} className="md:w-auto">
            <Plus className="w-5 h-5" />
            Tạo định kỳ
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <p className="text-sm text-[var(--text-secondary)] mb-1">Tổng quy tắc</p>
            <p className="text-2xl font-bold text-[var(--text-primary)] tabular-nums">
              {recurringRules.length}
            </p>
          </Card>
          <Card>
            <p className="text-sm text-[var(--text-secondary)] mb-1">Đang hoạt động</p>
            <p className="text-2xl font-bold text-[var(--success)] tabular-nums">
              {activeRulesCount}
            </p>
          </Card>
          <Card>
            <p className="text-sm text-[var(--text-secondary)] mb-1">Thu định kỳ/tháng</p>
            <p className="text-xl font-bold text-[var(--success)] tabular-nums">
              {formatCurrency(totalMonthlyIncome)}₫
            </p>
          </Card>
          <Card>
            <p className="text-sm text-[var(--text-secondary)] mb-1">Chi định kỳ/tháng</p>
            <p className="text-xl font-bold text-[var(--danger)] tabular-nums">
              {formatCurrency(totalMonthlyExpense)}₫
            </p>
          </Card>
        </div>

        {/* ── Run All Due Banner ──────────────────────────────────────── */}
        {dueRules.length > 0 && (
          <div className="flex items-center gap-4 px-5 py-4 bg-[var(--warning-light)] border border-[var(--warning)] rounded-[var(--radius-xl)]">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[var(--warning)] flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-[var(--text-primary)]">
                {dueRules.length} quy tắc đến hạn
              </p>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                Tổng cộng {formatCurrency(dueRulesTotal)}₫ — {dueRules.map(r => r.name).join(', ')}
              </p>
            </div>
            <Button onClick={() => setRunAllDueModalOpen(true)} className="flex-shrink-0 text-sm">
              <PlayCircle className="w-4 h-4" />
              Chạy tất cả
            </Button>
          </div>
        )}

        {/* Calendar */}
        {recurringRules.length > 0 && (
          <RecurringCalendar rules={calendarRules} />
        )}

        {/* Search & Filter */}
        {recurringRules.length > 0 && (
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-tertiary)]" />
              <input
                type="text"
                placeholder="Tìm kiếm giao dịch định kỳ..."
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
            <div className="flex gap-2 overflow-x-auto pb-1">
              {[
                { value: 'all', label: 'Tất cả' },
                { value: 'income', label: 'Thu nhập' },
                { value: 'expense', label: 'Chi tiêu' },
              ].map(tab => (
                <button
                  key={tab.value}
                  onClick={() => setTypeFilter(tab.value as any)}
                  className={`px-3 py-1.5 rounded-[var(--radius-lg)] text-sm font-medium transition-all whitespace-nowrap ${
                    typeFilter === tab.value
                      ? 'bg-[var(--primary)] text-white'
                      : 'bg-[var(--card)] text-[var(--text-secondary)] hover:bg-[var(--surface)] border border-[var(--border)]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
              <div className="ml-auto relative flex-shrink-0">
                <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)] pointer-events-none" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="pl-9 pr-8 py-1.5 bg-[var(--card)] border border-[var(--border)] rounded-[var(--radius-lg)] text-sm text-[var(--text-primary)] appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]"
                >
                  <option value="nextDate">Ngày tiếp</option>
                  <option value="amount">Số tiền</option>
                  <option value="name">Tên A-Z</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Rules List */}
        <div className="space-y-3">
          {filteredRules.map(rule => (
            <SwipeableRow
              key={rule.id}
              actions={[
                {
                  icon: <Edit2 className="w-4 h-4" />,
                  label: 'Sửa',
                  color: 'white',
                  bgColor: 'var(--primary)',
                  onClick: () => nav.goEditRecurringRule(rule.id),
                },
                {
                  icon: <Trash2 className="w-4 h-4" />,
                  label: 'Xoá',
                  color: 'white',
                  bgColor: 'var(--danger)',
                  onClick: () => handleDeleteRequest(rule),
                },
              ]}
            >
              <RuleCard
                rule={rule}
                onToggle={() => handleToggle(rule)}
                onViewDetail={() => nav.goRecurringRuleDetail(rule.id)}
                onEdit={() => nav.goEditRecurringRule(rule.id)}
                onSkipNext={() => handleSkipRequest(rule)}
                onRunNow={() => handleRunNowRequest(rule)}
                onDuplicate={() => handleDuplicate(rule)}
                onDelete={() => handleDeleteRequest(rule)}
              />
            </SwipeableRow>
          ))}
        </div>

        {/* Empty State */}
        {recurringRules.length === 0 && (
          <Card className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-[var(--surface)] rounded-full mb-4">
              <Calendar className="w-8 h-8 text-[var(--text-secondary)]" />
            </div>
            <h3 className="font-semibold text-[var(--text-primary)] mb-2">
              Chưa có giao dịch định kỳ
            </h3>
            <p className="text-sm text-[var(--text-secondary)] mb-4">
              Tạo quy tắc đầu tiên để tự động tạo giao dịch theo lịch trình
            </p>
            <Button onClick={() => nav.goCreateRecurringRule()} className="mx-auto">
              <Plus className="w-5 h-5" />
              Tạo định kỳ
            </Button>
          </Card>
        )}

        {/* Search/Filter No Results */}
        {recurringRules.length > 0 && filteredRules.length === 0 && (
          <Card className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-[var(--surface)] rounded-full mb-4">
              <Search className="w-8 h-8 text-[var(--text-tertiary)]" />
            </div>
            <h3 className="font-semibold text-[var(--text-primary)] mb-2">
              Không tìm thấy
            </h3>
            <p className="text-sm text-[var(--text-secondary)]">
              Thử thay đổi bộ lọc hoặc từ khoá tìm kiếm
            </p>
          </Card>
        )}

        {/* ── Modals ────────────────────────────────────────────────────── */}

        {/* Delete */}
        <ConfirmationModal
          isOpen={deleteModalOpen}
          onClose={() => { setDeleteModalOpen(false); setRuleToDelete(null); }}
          onConfirm={confirmDelete}
          title="Xoá giao dịch định kỳ?"
          description={`Bạn có chắc muốn xoá "${ruleToDelete?.name || ''}"? Giao dịch đã tạo trước đó sẽ không bị ảnh hưởng.`}
          confirmLabel="Xoá"
          cancelLabel="Huỷ"
          isDangerous
        />

        {/* Skip */}
        <ConfirmationModal
          isOpen={skipModalOpen}
          onClose={() => { setSkipModalOpen(false); setRuleToSkip(null); }}
          onConfirm={confirmSkip}
          title="Bỏ qua lần chạy tiếp theo?"
          description="Giao dịch sắp tới sẽ không được tạo. Các kỳ tiếp theo vẫn chạy bình thường."
          confirmLabel="Bỏ qua"
          cancelLabel="Huỷ"
        />

        {/* Run Now */}
        <ConfirmationModal
          isOpen={runNowModalOpen}
          onClose={() => { setRunNowModalOpen(false); setRuleToRun(null); }}
          onConfirm={confirmRunNow}
          title="Tạo giao dịch ngay?"
          description="Giao dịch sẽ được tạo ngay lập tức thay vì chờ đến ngày đã lên lịch."
          confirmLabel="Tạo ngay"
          cancelLabel="Huỷ"
        />

        {/* Pause */}
        <ConfirmationModal
          isOpen={pauseModalOpen}
          onClose={() => { setPauseModalOpen(false); setRuleToPause(null); }}
          onConfirm={confirmPause}
          title="Tạm dừng quy tắc định kỳ?"
          description="Ứng dụng sẽ ngừng tất cả thông báo và tự động tạo giao dịch cho quy tắc này."
          confirmLabel="Tạm dừng"
          cancelLabel="Huỷ"
        />

        {/* Run All Due */}
        <ConfirmationModal
          isOpen={runAllDueModalOpen}
          onClose={() => setRunAllDueModalOpen(false)}
          onConfirm={confirmRunAllDue}
          title={`Tạo ${dueRules.length} giao dịch ngay?`}
          description={`Tất cả ${dueRules.length} quy tắc đến hạn sẽ được thực thi ngay lập tức. Tổng cộng ${formatCurrency(dueRulesTotal)}₫.`}
          confirmLabel="Chạy tất cả"
          cancelLabel="Huỷ"
        />
      </div>
    </div>
  );
}
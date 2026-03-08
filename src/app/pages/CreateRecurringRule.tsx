import React, { useState, useMemo, useCallback } from 'react';
import { useParams } from 'react-router';
import { ArrowLeft, Bell, BellOff, Zap, Plus, Calendar, Clock, Sparkles, Home, Briefcase, Wifi, Lightbulb, Droplets, Tv, Music, Dumbbell, ShieldCheck, CreditCard } from 'lucide-react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { AmountInput } from '../components/AmountInput';
import { TagPickerModal } from '../components/TagPickerModal';
import { TagChip } from '../components/TagChip';
import { useAppNavigation } from '../hooks/useAppNavigation';
import { useToast } from '../contexts/ToastContext';
import { useDemoData, RecurringRule } from '../contexts/DemoDataContext';

// ── Schedule helpers ──────────────────────────────────────────────────────────

const WEEKDAY_LABELS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
const MONTH_LABELS = [
  'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
  'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12',
];

function computeNextRun(
  frequency: string,
  startDate: string,
  dailyInterval: number,
  weeklyDays: number[],
  monthlyMode: string,
  monthlyDay: number,
  yearlyMonth: number,
  yearlyDay: number,
): Date | null {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);

  // Use the later of today and start
  const base = start > today ? start : today;

  switch (frequency) {
    case 'daily': {
      const interval = dailyInterval || 1;
      if (start > today) return start;
      const daysPassed = Math.floor((today.getTime() - start.getTime()) / 86400000);
      const nextMultiple = Math.ceil(daysPassed / interval) * interval;
      const next = new Date(start);
      next.setDate(next.getDate() + nextMultiple);
      if (next <= today) next.setDate(next.getDate() + interval);
      return next;
    }
    case 'weekly': {
      if (weeklyDays.length === 0) return null;
      // Find the next weekday from today (or start, whichever is later)
      const sorted = [...weeklyDays].sort((a, b) => a - b);
      for (let offset = 0; offset < 8; offset++) {
        const candidate = new Date(base);
        candidate.setDate(candidate.getDate() + offset);
        if (sorted.includes(candidate.getDay())) {
          if (candidate >= start && candidate >= today) return candidate;
        }
      }
      return null;
    }
    case 'monthly': {
      if (monthlyMode === 'last') {
        // Last day of the base month or next month
        const candidate = new Date(base.getFullYear(), base.getMonth() + 1, 0);
        if (candidate >= today && candidate >= start) return candidate;
        const next = new Date(base.getFullYear(), base.getMonth() + 2, 0);
        return next;
      }
      // Specific day
      const day = Math.min(monthlyDay, 28); // safe
      let candidate = new Date(base.getFullYear(), base.getMonth(), day);
      if (candidate < today || candidate < start) {
        candidate = new Date(base.getFullYear(), base.getMonth() + 1, day);
      }
      return candidate;
    }
    case 'yearly': {
      let candidate = new Date(base.getFullYear(), yearlyMonth, yearlyDay);
      if (candidate < today || candidate < start) {
        candidate = new Date(base.getFullYear() + 1, yearlyMonth, yearlyDay);
      }
      return candidate;
    }
    default:
      return null;
  }
}

function formatDateVN(d: Date): string {
  const days = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
  return `${days[d.getDay()]}, ${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function CreateRecurringRule() {
  const { id } = useParams<{ id: string }>();
  const nav = useAppNavigation();
  const toast = useToast();
  const {
    accounts, categories, merchants, tags,
    recurringRules, addRecurringRule, updateRecurringRule,
  } = useDemoData();

  const existingRule = id ? recurringRules.find(r => r.id === id) : null;
  const mode = existingRule ? 'edit' : 'create';

  // ── Form state ──────────────────────────────────────────────────────────
  const [executionMode, setExecutionMode] = useState<'notify' | 'auto'>(existingRule?.executionMode || 'notify');
  const [type, setType] = useState<'income' | 'expense'>(existingRule?.type || 'expense');
  const [amount, setAmount] = useState(existingRule ? String(Math.abs(existingRule.amount)) : '');
  const [accountId, setAccountId] = useState(existingRule?.accountId || '');
  const [categoryId, setCategoryId] = useState(existingRule?.categoryId || '');
  const [description, setDescription] = useState(existingRule?.description || '');
  const [merchantId, setMerchantId] = useState(existingRule?.merchantId || '');
  const [tagIds, setTagIds] = useState<string[]>(existingRule?.tagIds || []);
  const [notes, setNotes] = useState(existingRule?.notes || '');

  // Schedule
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>(existingRule?.frequency || 'monthly');
  const [dailyInterval, setDailyInterval] = useState(existingRule?.dailyInterval || 1);
  const [weeklyDays, setWeeklyDays] = useState<number[]>(existingRule?.weeklyDays || [new Date().getDay()]);
  const [monthlyMode, setMonthlyMode] = useState<'specific' | 'last'>(existingRule?.monthlyMode || 'specific');
  const [monthlyDay, setMonthlyDay] = useState(existingRule?.monthlyDay || new Date().getDate());
  const [yearlyMonth, setYearlyMonth] = useState(existingRule?.yearlyMonth ?? new Date().getMonth());
  const [yearlyDay, setYearlyDay] = useState(existingRule?.yearlyDay || new Date().getDate());

  // Timeline
  const [startDate, setStartDate] = useState(existingRule?.startDate || new Date().toISOString().split('T')[0]);
  const [endCondition, setEndCondition] = useState<'never' | 'on-date' | 'after-n'>(existingRule?.endCondition || 'never');
  const [endDate, setEndDate] = useState(existingRule?.endDate || '');
  const [endAfterOccurrences, setEndAfterOccurrences] = useState(existingRule?.endAfterOccurrences || 12);

  const [showTagPicker, setShowTagPicker] = useState(false);
  const [notifyEnabled, setNotifyEnabled] = useState(existingRule?.notifyEnabled !== false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // ── Derived ─────────────────────────────────────────────────────────────
  const filteredCategories = categories.filter(c => c.type === type);
  const selectedTagObjects = tags.filter(t => tagIds.includes(t.id));

  const nextRunDate = useMemo(() => {
    return computeNextRun(frequency, startDate, dailyInterval, weeklyDays, monthlyMode, monthlyDay, yearlyMonth, yearlyDay);
  }, [frequency, startDate, dailyInterval, weeklyDays, monthlyMode, monthlyDay, yearlyMonth, yearlyDay]);

  // ── Validation ──────────────────────────────────────────────────────────
  const validate = useCallback(() => {
    const e: Record<string, string> = {};
    if (!amount || amount === '0') e.amount = 'Vui lòng nhập số tiền';
    if (!accountId) e.accountId = 'Vui lòng chọn tài khoản';
    if (!categoryId) e.categoryId = 'Vui lòng chọn danh mục';
    if (!description.trim()) e.description = 'Vui lòng nhập mô tả';
    if (frequency === 'weekly' && weeklyDays.length === 0) e.weeklyDays = 'Chọn ít nhất 1 ngày';
    if (endCondition === 'on-date' && !endDate) e.endDate = 'Vui lòng chọn ngày kết thúc';
    if (endCondition === 'after-n' && (!endAfterOccurrences || endAfterOccurrences < 1)) e.endAfterOccurrences = 'Nhập số lần hợp lệ';
    setErrors(e);
    return Object.keys(e).length === 0;
  }, [amount, accountId, categoryId, description, frequency, weeklyDays, endCondition, endDate, endAfterOccurrences]);

  // ── Save ────────────────────────────────────────────────────────────────
  const handleSave = () => {
    if (!validate()) return;

    const parsedAmount = parseInt(amount, 10) || 0;
    const finalAmount = type === 'expense' ? -Math.abs(parsedAmount) : Math.abs(parsedAmount);
    const selectedAccount = accounts.find(a => a.id === accountId);
    const selectedCategory = categories.find(c => c.id === categoryId);
    const selectedMerchant = merchants.find(m => m.id === merchantId);

    const ruleData: Omit<RecurringRule, 'id'> = {
      name: description.trim(),
      amount: finalAmount,
      type,
      frequency,
      nextDate: nextRunDate ? nextRunDate.toISOString().split('T')[0] : startDate,
      categoryId,
      category: selectedCategory?.name || '',
      accountId,
      account: selectedAccount?.name || '',
      enabled: true,
      description: description.trim(),
      executionMode,
      dailyInterval: frequency === 'daily' ? dailyInterval : undefined,
      weeklyDays: frequency === 'weekly' ? weeklyDays : undefined,
      monthlyMode: frequency === 'monthly' ? monthlyMode : undefined,
      monthlyDay: frequency === 'monthly' && monthlyMode === 'specific' ? monthlyDay : undefined,
      yearlyMonth: frequency === 'yearly' ? yearlyMonth : undefined,
      yearlyDay: frequency === 'yearly' ? yearlyDay : undefined,
      startDate,
      endCondition,
      endDate: endCondition === 'on-date' ? endDate : undefined,
      endAfterOccurrences: endCondition === 'after-n' ? endAfterOccurrences : undefined,
      completedOccurrences: existingRule?.completedOccurrences || 0,
      merchantId: merchantId || undefined,
      merchant: selectedMerchant?.name || undefined,
      tagIds: tagIds.length ? tagIds : undefined,
      notes: notes.trim() || undefined,
      notifyEnabled,
    };

    if (mode === 'edit' && id) {
      updateRecurringRule(id, ruleData);
      toast.success('Đã cập nhật giao dịch định kỳ');
    } else {
      addRecurringRule(ruleData);
      toast.success('Đã tạo giao dịch định kỳ mới');
    }
    nav.goRecurringRules();
  };

  // ── Helpers ─────────────────────────────────────────────────────────────
  const toggleWeekday = (day: number) => {
    setWeeklyDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day],
    );
  };

  const selectClass = "w-full px-4 py-2.5 bg-[var(--input-background)] border border-[var(--border)] rounded-[var(--radius-lg)] text-[var(--text-primary)] appearance-none cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]";
  const inputClass = "w-full px-4 py-3 bg-[var(--input-background)] border border-[var(--border)] rounded-[var(--radius-lg)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]";
  const errorClass = (field: string) => errors[field] ? 'border-[var(--danger)]' : 'border-[var(--border)]';

  // ── Templates (Create mode only) ────────────────────────────
  const RECURRING_TEMPLATES = [
    {
      id: '1',
      label: 'Tiền thuê nhà',
      type: 'expense' as const,
      frequency: 'monthly' as const,
      amount: '5000000',
      categoryName: 'Nhà ở',
      description: 'Tiền thuê nhà hàng tháng',
      icon: <Home className="w-4 h-4" />,
      executionMode: 'auto' as const,
      monthlyDay: 5,
    },
    {
      id: '2',
      label: 'Lương tháng',
      type: 'income' as const,
      frequency: 'monthly' as const,
      amount: '15000000',
      categoryName: 'Lương',
      description: 'Lương cố định hàng tháng',
      icon: <Briefcase className="w-4 h-4" />,
      executionMode: 'notify' as const,
      monthlyDay: 1,
    },
    {
      id: '3',
      label: 'Tiền điện',
      type: 'expense' as const,
      frequency: 'monthly' as const,
      amount: '500000',
      categoryName: 'Nhà ở',
      description: 'Hóa đơn tiền điện',
      icon: <Lightbulb className="w-4 h-4" />,
      executionMode: 'notify' as const,
      monthlyDay: 20,
    },
    {
      id: '4',
      label: 'Tiền nước',
      type: 'expense' as const,
      frequency: 'monthly' as const,
      amount: '150000',
      categoryName: 'Nhà ở',
      description: 'Hóa đơn tiền nước',
      icon: <Droplets className="w-4 h-4" />,
      executionMode: 'notify' as const,
      monthlyDay: 15,
    },
    {
      id: '5',
      label: 'Internet / WiFi',
      type: 'expense' as const,
      frequency: 'monthly' as const,
      amount: '250000',
      categoryName: 'Nhà ở',
      description: 'Hóa đơn internet hàng tháng',
      icon: <Wifi className="w-4 h-4" />,
      executionMode: 'auto' as const,
      monthlyDay: 10,
    },
    {
      id: '6',
      label: 'Netflix / Streaming',
      type: 'expense' as const,
      frequency: 'monthly' as const,
      amount: '180000',
      categoryName: 'Giải trí',
      description: 'Gói đăng ký xem phim',
      icon: <Tv className="w-4 h-4" />,
      executionMode: 'auto' as const,
      monthlyDay: 1,
    },
    {
      id: '7',
      label: 'Spotify / Nhạc',
      type: 'expense' as const,
      frequency: 'monthly' as const,
      amount: '59000',
      categoryName: 'Giải trí',
      description: 'Gói nghe nhạc premium',
      icon: <Music className="w-4 h-4" />,
      executionMode: 'auto' as const,
      monthlyDay: 1,
    },
    {
      id: '8',
      label: 'Phí tập gym',
      type: 'expense' as const,
      frequency: 'monthly' as const,
      amount: '800000',
      categoryName: 'Thể thao',
      description: 'Phí thẻ tập gym hàng tháng',
      icon: <Dumbbell className="w-4 h-4" />,
      executionMode: 'auto' as const,
      monthlyDay: 1,
    },
    {
      id: '9',
      label: 'Bảo hiểm năm',
      type: 'expense' as const,
      frequency: 'yearly' as const,
      amount: '12000000',
      categoryName: 'Y tế',
      description: 'Phí bảo hiểm hàng năm',
      icon: <ShieldCheck className="w-4 h-4" />,
      executionMode: 'notify' as const,
      monthlyDay: 1,
    },
    {
      id: '10',
      label: 'Trả góp',
      type: 'expense' as const,
      frequency: 'monthly' as const,
      amount: '3000000',
      categoryName: 'Mua sắm',
      description: 'Trả góp hàng tháng',
      icon: <CreditCard className="w-4 h-4" />,
      executionMode: 'auto' as const,
      monthlyDay: 5,
    },
  ];

  const applyTemplate = (tpl: typeof RECURRING_TEMPLATES[number]) => {
    setType(tpl.type);
    setAmount(tpl.amount);
    setDescription(tpl.description);
    setFrequency(tpl.frequency);
    setExecutionMode(tpl.executionMode);
    setMonthlyDay(tpl.monthlyDay);
    setMonthlyMode('specific');
    setStartDate(new Date().toISOString().split('T')[0]);
    setEndCondition('never');
    setNotes('');
    setTagIds([]);
    setMerchantId('');

    // Match category by name
    const matchedCat = categories.find(
      c => c.type === tpl.type && c.name.toLowerCase() === tpl.categoryName.toLowerCase()
    );
    setCategoryId(matchedCat?.id || '');

    // Auto-select first account
    if (accounts.length > 0 && !accountId) {
      setAccountId(accounts[0].id);
    }

    toast.success(`Đã áp dụng mẫu "${tpl.label}"`);
  };

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="max-w-3xl mx-auto p-4 md:p-6 pb-20 md:pb-6 space-y-6">
        {/* Header */}
        <div>
          <button
            onClick={() => nav.goBack()}
            className="flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Quay lại</span>
          </button>
          <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
            {mode === 'create' ? 'Tạo giao dịch định kỳ' : 'Chỉnh sửa giao dịch định kỳ'}
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Ứng dụng sẽ nhắc bạn hoặc tự tạo giao dịch theo lịch trình.
          </p>
        </div>

        {/* ─── Templates (Create mode only) ──────────────────────────── */}
        {mode === 'create' && (
          <Card>
            <h3 className="font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[var(--primary)]" />
              Mẫu nhanh
            </h3>
            <p className="text-xs text-[var(--text-tertiary)] mb-4">
              Chọn một mẫu để tự động điền thông tin. Bạn có thể chỉnh sửa sau.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {RECURRING_TEMPLATES.map(tpl => (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => applyTemplate(tpl)}
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] hover:border-[var(--primary)] hover:bg-[var(--primary-light)] text-left transition-all group"
                >
                  <span className={`flex-shrink-0 w-8 h-8 rounded-[var(--radius-md)] flex items-center justify-center ${
                    tpl.type === 'income'
                      ? 'bg-[var(--success-light)] text-[var(--success)]'
                      : 'bg-[var(--danger-light)] text-[var(--danger)]'
                  }`}>
                    {tpl.icon}
                  </span>
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-[var(--text-primary)] group-hover:text-[var(--primary)] truncate">
                      {tpl.label}
                    </div>
                    <div className="text-xs text-[var(--text-tertiary)]">
                      {tpl.type === 'income' ? 'Thu nhập' : 'Chi tiêu'} • {
                        tpl.frequency === 'monthly' ? 'Hàng tháng' :
                        tpl.frequency === 'yearly' ? 'Hàng năm' : 'Hàng tháng'
                      }
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </Card>
        )}

        {/* ─── Section A: Execution Mode ─────────────────────────────── */}
        <Card>
          <h3 className="font-semibold text-[var(--text-primary)] mb-4">Chế độ thực thi</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Notify */}
            <button
              type="button"
              onClick={() => setExecutionMode('notify')}
              className={`flex items-start gap-3 p-4 rounded-[var(--radius-lg)] border-2 text-left transition-all ${
                executionMode === 'notify'
                  ? 'border-[var(--primary)] bg-[var(--primary-light)]'
                  : 'border-[var(--border)] bg-[var(--surface)] hover:border-[var(--primary)]'
              }`}
            >
              <Bell className={`w-5 h-5 mt-0.5 flex-shrink-0 ${executionMode === 'notify' ? 'text-[var(--primary)]' : 'text-[var(--text-tertiary)]'}`} />
              <div>
                <div className={`font-medium ${executionMode === 'notify' ? 'text-[var(--primary)]' : 'text-[var(--text-primary)]'}`}>
                  Chỉ nhắc
                </div>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                  Nhắc xác nhận trước khi tạo.
                </p>
              </div>
            </button>

            {/* Auto */}
            <button
              type="button"
              onClick={() => setExecutionMode('auto')}
              className={`flex items-start gap-3 p-4 rounded-[var(--radius-lg)] border-2 text-left transition-all ${
                executionMode === 'auto'
                  ? 'border-[var(--primary)] bg-[var(--primary-light)]'
                  : 'border-[var(--border)] bg-[var(--surface)] hover:border-[var(--primary)]'
              }`}
            >
              <Zap className={`w-5 h-5 mt-0.5 flex-shrink-0 ${executionMode === 'auto' ? 'text-[var(--primary)]' : 'text-[var(--text-tertiary)]'}`} />
              <div>
                <div className={`font-medium ${executionMode === 'auto' ? 'text-[var(--primary)]' : 'text-[var(--text-primary)]'}`}>
                  Tự tạo
                </div>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                  Tự động tạo giao dịch vào ngày đến hạn.
                </p>
              </div>
            </button>
          </div>
          <p className="text-xs text-[var(--text-tertiary)] mt-3">
            Bạn có thể chuyển đổi giữa các chế độ bất cứ lúc nào.
          </p>
        </Card>

        {/* ─── Section B: Transaction Template ───────────────────────── */}
        <Card>
          <h3 className="font-semibold text-[var(--text-primary)] mb-4">Mẫu giao dịch</h3>
          <div className="space-y-4">
            {/* Type */}
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                Loại giao dịch
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => { setType('expense'); setCategoryId(''); }}
                  className={`py-2.5 rounded-[var(--radius-lg)] text-sm font-medium border-2 transition-all ${
                    type === 'expense'
                      ? 'text-[var(--danger)] border-[var(--danger)]'
                      : 'border-[var(--border)] text-[var(--text-secondary)]'
                  }`}
                  style={type === 'expense' ? { backgroundColor: 'var(--danger)' + '15' } : {}}
                >
                  Chi tiêu
                </button>
                <button
                  type="button"
                  onClick={() => { setType('income'); setCategoryId(''); }}
                  className={`py-2.5 rounded-[var(--radius-lg)] text-sm font-medium border-2 transition-all ${
                    type === 'income'
                      ? 'text-[var(--success)] border-[var(--success)]'
                      : 'border-[var(--border)] text-[var(--text-secondary)]'
                  }`}
                  style={type === 'income' ? { backgroundColor: 'var(--success)' + '15' } : {}}
                >
                  Thu nhập
                </button>
              </div>
            </div>

            {/* Amount */}
            <AmountInput
              value={amount}
              onChange={setAmount}
              error={errors.amount}
            />

            {/* Account */}
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                Tài khoản <span className="text-[var(--danger)]">*</span>
              </label>
              <select
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className={`${selectClass} ${errorClass('accountId')}`}
              >
                <option value="">Chọn tài khoản</option>
                {accounts.map(acc => (
                  <option key={acc.id} value={acc.id}>{acc.name}</option>
                ))}
              </select>
              {errors.accountId && <p className="mt-1 text-sm text-[var(--danger)]">{errors.accountId}</p>}
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                Danh mục <span className="text-[var(--danger)]">*</span>
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className={`${selectClass} ${errorClass('categoryId')}`}
              >
                <option value="">Chọn danh mục</option>
                {filteredCategories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
                ))}
              </select>
              {errors.categoryId && <p className="mt-1 text-sm text-[var(--danger)]">{errors.categoryId}</p>}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                Mô tả <span className="text-[var(--danger)]">*</span>
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="VD: Tiền thuê nhà, Lương tháng..."
                className={`${inputClass} ${errorClass('description')}`}
              />
              {errors.description && <p className="mt-1 text-sm text-[var(--danger)]">{errors.description}</p>}
            </div>

            {/* Optional: Merchant */}
            {merchants.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">Đơn vị</label>
                <select value={merchantId} onChange={(e) => setMerchantId(e.target.value)} className={selectClass}>
                  <option value="">Không chọn</option>
                  {merchants.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>
            )}

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">Nhãn</label>
              <div className="flex flex-wrap items-center gap-2">
                {selectedTagObjects.map(tag => (
                  <TagChip
                    key={tag.id}
                    name={tag.name}
                    color={tag.color}
                    onRemove={() => setTagIds(prev => prev.filter(tid => tid !== tag.id))}
                  />
                ))}
                <button
                  type="button"
                  onClick={() => setShowTagPicker(true)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 border border-dashed border-[var(--border)] rounded-full text-sm text-[var(--text-secondary)] hover:border-[var(--primary)] hover:text-[var(--primary)] transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Thêm nhãn
                </button>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">Ghi chú</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Thêm ghi chú..."
                rows={2}
                className={`${inputClass} resize-none`}
              />
            </div>
          </div>
        </Card>

        {/* ─── Section C: Schedule Builder ────────────────────────────── */}
        <Card>
          <h3 className="font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-[var(--primary)]" />
            Lịch lặp
          </h3>
          <div className="space-y-4">
            {/* Frequency */}
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">Tần suất</label>
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value as any)}
                className={selectClass}
              >
                <option value="daily">Hàng ngày</option>
                <option value="weekly">Hàng tuần</option>
                <option value="monthly">Hàng tháng</option>
                <option value="yearly">Hàng năm</option>
              </select>
            </div>

            {/* Daily: Interval */}
            {frequency === 'daily' && (
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                  Mỗi bao nhiêu ngày
                </label>
                <input
                  type="number"
                  min={1}
                  max={365}
                  value={dailyInterval}
                  onChange={(e) => setDailyInterval(Math.max(1, parseInt(e.target.value) || 1))}
                  className={`${inputClass} max-w-[150px]`}
                />
              </div>
            )}

            {/* Weekly: Day chips */}
            {frequency === 'weekly' && (
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">Ngày trong tuần</label>
                <div className="flex flex-wrap gap-2">
                  {WEEKDAY_LABELS.map((label, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => toggleWeekday(idx)}
                      className={`w-10 h-10 rounded-full text-sm font-medium transition-all border-2 ${
                        weeklyDays.includes(idx)
                          ? 'bg-[var(--primary)] text-white border-[var(--primary)]'
                          : 'bg-[var(--surface)] text-[var(--text-secondary)] border-[var(--border)] hover:border-[var(--primary)]'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                {errors.weeklyDays && <p className="mt-1 text-sm text-[var(--danger)]">{errors.weeklyDays}</p>}
              </div>
            )}

            {/* Monthly options */}
            {frequency === 'monthly' && (
              <div className="space-y-3">
                <label className="block text-sm font-medium text-[var(--text-primary)]">Ngày trong tháng</label>

                {/* Specific day */}
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="monthlyMode"
                    checked={monthlyMode === 'specific'}
                    onChange={() => setMonthlyMode('specific')}
                    className="w-4 h-4 text-[var(--primary)]"
                  />
                  <span className="text-sm text-[var(--text-primary)]">Ngày cụ thể</span>
                  {monthlyMode === 'specific' && (
                    <select
                      value={monthlyDay}
                      onChange={(e) => setMonthlyDay(parseInt(e.target.value))}
                      className="px-3 py-1.5 bg-[var(--input-background)] border border-[var(--border)] rounded-[var(--radius-md)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]"
                    >
                      {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                        <option key={d} value={d}>Ngày {d}</option>
                      ))}
                    </select>
                  )}
                </label>

                {/* Last day */}
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="monthlyMode"
                    checked={monthlyMode === 'last'}
                    onChange={() => setMonthlyMode('last')}
                    className="w-4 h-4 text-[var(--primary)]"
                  />
                  <span className="text-sm text-[var(--text-primary)]">Ngày cuối tháng</span>
                </label>

                <p className="text-xs text-[var(--text-tertiary)]">
                  Với tháng có ít ngày hơn, sẽ tự điều chỉnh sang ngày cuối cùng có thể.
                </p>
              </div>
            )}

            {/* Yearly: Month + Day */}
            {frequency === 'yearly' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">Tháng</label>
                  <select
                    value={yearlyMonth}
                    onChange={(e) => setYearlyMonth(parseInt(e.target.value))}
                    className={selectClass}
                  >
                    {MONTH_LABELS.map((label, idx) => (
                      <option key={idx} value={idx}>{label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">Ngày</label>
                  <select
                    value={yearlyDay}
                    onChange={(e) => setYearlyDay(parseInt(e.target.value))}
                    className={selectClass}
                  >
                    {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* ─── Section D: Timeline & Expiration ──────────────────────── */}
        <Card>
          <h3 className="font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[var(--primary)]" />
            Thời hạn
          </h3>
          <div className="space-y-4">
            {/* Start Date */}
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">Bắt đầu từ</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className={inputClass}
              />
            </div>

            {/* End Condition */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-[var(--text-primary)]">Điều kiện kết thúc</label>

              {/* Never */}
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="endCondition"
                  checked={endCondition === 'never'}
                  onChange={() => setEndCondition('never')}
                  className="w-4 h-4 text-[var(--primary)]"
                />
                <span className="text-sm text-[var(--text-primary)]">Không kết thúc</span>
              </label>

              {/* On Date */}
              <div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="endCondition"
                    checked={endCondition === 'on-date'}
                    onChange={() => setEndCondition('on-date')}
                    className="w-4 h-4 text-[var(--primary)]"
                  />
                  <span className="text-sm text-[var(--text-primary)]">Kết thúc vào ngày</span>
                </label>
                {endCondition === 'on-date' && (
                  <div className="ml-7 mt-2">
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      min={startDate}
                      className={`${inputClass} max-w-[250px] ${errorClass('endDate')}`}
                    />
                    {errors.endDate && <p className="mt-1 text-sm text-[var(--danger)]">{errors.endDate}</p>}
                  </div>
                )}
              </div>

              {/* After N */}
              <div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="endCondition"
                    checked={endCondition === 'after-n'}
                    onChange={() => setEndCondition('after-n')}
                    className="w-4 h-4 text-[var(--primary)]"
                  />
                  <span className="text-sm text-[var(--text-primary)]">Kết thúc sau</span>
                </label>
                {endCondition === 'after-n' && (
                  <div className="ml-7 mt-2 flex items-center gap-2">
                    <input
                      type="number"
                      min={1}
                      value={endAfterOccurrences}
                      onChange={(e) => setEndAfterOccurrences(Math.max(1, parseInt(e.target.value) || 0))}
                      className={`w-20 px-3 py-2 bg-[var(--input-background)] border rounded-[var(--radius-md)] text-sm text-[var(--text-primary)] text-center focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)] ${errorClass('endAfterOccurrences')}`}
                    />
                    <span className="text-sm text-[var(--text-secondary)]">lần</span>
                    {errors.endAfterOccurrences && <p className="text-sm text-[var(--danger)]">{errors.endAfterOccurrences}</p>}
                  </div>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* ─── Per-rule Notification Preference ──────────────────────── */}
        <Card>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-[var(--radius-lg)] flex items-center justify-center ${
                notifyEnabled
                  ? 'bg-[var(--primary-light)] text-[var(--primary)]'
                  : 'bg-[var(--surface)] text-[var(--text-tertiary)]'
              }`}>
                {notifyEnabled ? <Bell className="w-5 h-5" /> : <BellOff className="w-5 h-5" />}
              </div>
              <div>
                <h4 className="font-medium text-[var(--text-primary)] text-sm">Thông báo cho quy tắc này</h4>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                  {notifyEnabled
                    ? 'Nhận nhắc nhở khi quy tắc đến hạn.'
                    : 'Không nhận thông báo cho quy tắc này.'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setNotifyEnabled(!notifyEnabled)}
              className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${
                notifyEnabled ? 'bg-[var(--success)]' : 'bg-[var(--border)]'
              }`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform shadow-sm ${
                notifyEnabled ? 'translate-x-5' : 'translate-x-0'
              }`} />
            </button>
          </div>
        </Card>

        {/* ─── Next Run Preview (Dynamic Card) ───────────────────────── */}
        <Card className="bg-[var(--primary-light)] border-[var(--primary)]">
          <h3 className="font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[var(--primary)]" />
            Lần chạy tiếp theo
          </h3>
          {nextRunDate ? (
            <div className="space-y-2">
              <div className="text-lg font-semibold text-[var(--text-primary)]">
                {formatDateVN(nextRunDate)}
              </div>
              <div className="text-sm text-[var(--text-secondary)]">
                {executionMode === 'notify'
                  ? '🔔 Bạn sẽ nhận được nhắc nhở.'
                  : '⚡ Ứng dụng sẽ tự tạo giao dịch.'}
              </div>
              {amount && (
                <div className={`text-sm font-medium ${type === 'income' ? 'text-[var(--success)]' : 'text-[var(--danger)]'}`}>
                  {type === 'income' ? '+' : '-'}{new Intl.NumberFormat('vi-VN').format(parseInt(amount) || 0)} ₫
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-[var(--text-tertiary)]">
              Chưa thể tính toán — vui lòng hoàn tất cấu hình lịch lặp.
            </p>
          )}
        </Card>

        {/* ─── Footer Actions ────────────────────────────────────────── */}
        <div className="flex flex-col-reverse md:flex-row gap-3">
          <Button onClick={() => nav.goBack()} variant="secondary" className="flex-1 md:flex-initial">
            Huỷ
          </Button>
          <Button onClick={handleSave} className="flex-1 md:flex-initial">
            {mode === 'create' ? 'Lưu' : 'Lưu thay đổi'}
          </Button>
        </div>
      </div>

      {/* Tag Picker Modal */}
      <TagPickerModal
        isOpen={showTagPicker}
        onClose={() => setShowTagPicker(false)}
        selectedTagIds={tagIds}
        onApply={(ids) => {
          setTagIds(ids);
          setShowTagPicker(false);
        }}
      />
    </div>
  );
}
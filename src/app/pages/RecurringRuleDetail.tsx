import React, { useState, useRef, useEffect } from 'react';
import { useParams } from 'react-router';
import {
  ArrowLeft, MoreVertical, Edit, Trash2, SkipForward, Play,
  Calendar, Bell, BellOff, Zap, TrendingUp, TrendingDown,
  Wallet, Folder, Clock, Eye, CheckCircle2, XCircle, AlertTriangle,
} from 'lucide-react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { ConfirmationModal } from '../components/ConfirmationModals';
import { useAppNavigation } from '../hooks/useAppNavigation';
import { useToast } from '../contexts/ToastContext';
import { useDemoData, RecurringRule } from '../contexts/DemoDataContext';

// ── Helpers ───────────────────────────────────────────────────────────────────

function getFrequencyLabel(rule: RecurringRule): string {
  switch (rule.frequency) {
    case 'daily':
      return rule.dailyInterval && rule.dailyInterval > 1
        ? `Mỗi ${rule.dailyInterval} ngày`
        : 'Hàng ngày';
    case 'weekly': {
      const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
      const days = (rule.weeklyDays || []).map(d => dayNames[d]).join(', ');
      return days ? `Hàng tuần (${days})` : 'Hàng tuần';
    }
    case 'monthly':
      return rule.monthlyMode === 'last'
        ? 'Hàng tháng (ngày cuối)'
        : `Hàng tháng (ngày ${rule.monthlyDay || 1})`;
    case 'yearly': {
      const months = ['Th1', 'Th2', 'Th3', 'Th4', 'Th5', 'Th6', 'Th7', 'Th8', 'Th9', 'Th10', 'Th11', 'Th12'];
      return `Hàng năm (${months[rule.yearlyMonth || 0]} ngày ${rule.yearlyDay || 1})`;
    }
    default:
      return rule.frequency;
  }
}

function getEndConditionLabel(rule: RecurringRule): string {
  switch (rule.endCondition) {
    case 'on-date':
      return rule.endDate ? `Đến ${formatDateShort(rule.endDate)}` : 'Có ngày kết thúc';
    case 'after-n':
      return `Sau ${rule.endAfterOccurrences || 0} lần (đã chạy ${rule.completedOccurrences || 0})`;
    default:
      return 'Không kết thúc';
  }
}

function formatDateShort(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatDateTime(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function getDaysUntil(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - today.getTime()) / 86400000);
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('vi-VN').format(Math.abs(amount));
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function RecurringRuleDetail() {
  const { id } = useParams<{ id: string }>();
  const nav = useAppNavigation();
  const toast = useToast();
  const {
    recurringRules, updateRecurringRule, deleteRecurringRule,
    generateRecurringTransaction, skipNextOccurrence, selectedCurrency,
  } = useDemoData();

  const rule = recurringRules.find(r => r.id === id);

  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showSkipModal, setShowSkipModal] = useState(false);
  const [showRunNowModal, setShowRunNowModal] = useState(false);
  const [showPauseModal, setShowPauseModal] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    if (showMenu) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMenu]);

  const currencySymbol = selectedCurrency === 'VND' ? '₫' : selectedCurrency;

  if (!rule) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-2">
            Không tìm thấy quy tắc
          </h2>
          <p className="text-[var(--text-secondary)] mb-6">
            Quy tắc này có thể đã bị xoá hoặc không tồn tại.
          </p>
          <Button onClick={() => nav.goRecurringRules()} variant="secondary">
            <ArrowLeft className="w-5 h-5 mr-2" />
            Quay lại
          </Button>
        </div>
      </div>
    );
  }

  const daysUntil = getDaysUntil(rule.nextDate);
  const history = [...(rule.executionHistory || [])].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );

  // ── Handlers ────────────────────────────────────────────────────────────
  const handleToggle = () => {
    if (rule.enabled) {
      setShowPauseModal(true);
    } else {
      updateRecurringRule(rule.id, { enabled: true });
      toast.success('Đã kích hoạt lại quy tắc định kỳ');
    }
  };

  const confirmPause = () => {
    updateRecurringRule(rule.id, { enabled: false });
    toast.success('Đã tạm dừng quy tắc định kỳ');
    setShowPauseModal(false);
  };

  const confirmSkip = () => {
    skipNextOccurrence(rule.id);
    toast.success('Đã bỏ qua lần chạy tiếp theo');
    setShowSkipModal(false);
  };

  const confirmRunNow = () => {
    generateRecurringTransaction(rule.id);
    toast.success('Đã tạo giao dịch thành công');
    setShowRunNowModal(false);
  };

  const confirmDelete = () => {
    deleteRecurringRule(rule.id);
    toast.success(`Đã xoá "${rule.name}"`);
    setShowDeleteModal(false);
    nav.goRecurringRules();
  };

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="max-w-3xl mx-auto p-4 md:p-6 pb-20 md:pb-6 space-y-6">
        {/* ── Header ──────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => nav.goBack()}
            className="flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Quay lại</span>
          </button>

          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 rounded-[var(--radius-md)] hover:bg-[var(--surface)] transition-colors"
            >
              <MoreVertical className="w-5 h-5 text-[var(--text-secondary)]" />
            </button>

            {showMenu && (
              <div className="absolute right-0 top-10 w-48 bg-[var(--card)] border border-[var(--border)] rounded-[var(--radius-lg)] shadow-[var(--shadow-lg)] overflow-hidden z-50">
                <button
                  onClick={() => { setShowMenu(false); nav.goEditRecurringRule(rule.id); }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-[var(--text-primary)] hover:bg-[var(--surface)] transition-colors"
                >
                  <Edit className="w-4 h-4" />
                  Chỉnh sửa
                </button>
                <button
                  onClick={() => { setShowMenu(false); setShowDeleteModal(true); }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-[var(--danger)] hover:bg-[var(--danger-light)] transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Xoá quy tắc
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── Title & Status ──────────────────────────────────────────── */}
        <div className="flex items-start gap-4">
          <div className={`flex-shrink-0 w-14 h-14 rounded-[var(--radius-xl)] flex items-center justify-center ${
            rule.type === 'income'
              ? 'bg-[var(--success-light)] text-[var(--success)]'
              : 'bg-[var(--danger-light)] text-[var(--danger)]'
          }`}>
            {rule.type === 'income' ? <TrendingUp className="w-7 h-7" /> : <TrendingDown className="w-7 h-7" />}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-semibold text-[var(--text-primary)]">{rule.name}</h1>
            <p className="text-sm text-[var(--text-secondary)] mt-0.5">{rule.description}</p>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              {/* Mode badge */}
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                rule.executionMode === 'auto'
                  ? 'bg-[var(--warning-light)] text-[var(--warning)]'
                  : 'bg-[var(--info-light)] text-[var(--info)]'
              }`}>
                {rule.executionMode === 'auto' ? <Zap className="w-3 h-3" /> : <Bell className="w-3 h-3" />}
                {rule.executionMode === 'auto' ? 'Tự tạo' : 'Chỉ nhắc'}
              </span>
              {/* Status badge */}
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                rule.enabled
                  ? 'bg-[var(--success-light)] text-[var(--success)]'
                  : 'bg-[var(--border)] text-[var(--text-tertiary)]'
              }`}>
                {rule.enabled ? 'Đang hoạt động' : 'Tạm dừng'}
              </span>
            </div>
          </div>

          {/* Toggle */}
          <button
            onClick={handleToggle}
            className={`flex-shrink-0 relative w-12 h-6 rounded-full transition-colors ${
              rule.enabled ? 'bg-[var(--success)]' : 'bg-[var(--border)]'
            }`}
          >
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
              rule.enabled ? 'translate-x-6' : 'translate-x-0'
            }`} />
          </button>
        </div>

        {/* ── Summary Section ─────────────────────────────────────────── */}
        <Card>
          <h3 className="font-semibold text-[var(--text-primary)] mb-4">Thông tin chi tiết</h3>
          <div className="space-y-3">
            {/* Amount */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--text-secondary)]">Số tiền</span>
              <span className={`font-semibold tabular-nums ${
                rule.type === 'income' ? 'text-[var(--success)]' : 'text-[var(--danger)]'
              }`}>
                {rule.type === 'income' ? '+' : '-'}{formatCurrency(rule.amount)}{currencySymbol}
              </span>
            </div>

            {/* Type */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--text-secondary)]">Loại</span>
              <span className="text-sm font-medium text-[var(--text-primary)]">
                {rule.type === 'income' ? 'Thu nhập' : 'Chi tiêu'}
              </span>
            </div>

            {/* Account */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--text-secondary)] flex items-center gap-1.5">
                <Wallet className="w-3.5 h-3.5" /> Tài khoản
              </span>
              <span className="text-sm font-medium text-[var(--text-primary)]">{rule.account}</span>
            </div>

            {/* Category */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--text-secondary)] flex items-center gap-1.5">
                <Folder className="w-3.5 h-3.5" /> Danh mục
              </span>
              <span className="text-sm font-medium text-[var(--text-primary)]">{rule.category}</span>
            </div>

            <div className="border-t border-[var(--border)] my-2" />

            {/* Schedule */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--text-secondary)] flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" /> Lịch lặp
              </span>
              <span className="text-sm font-medium text-[var(--text-primary)]">
                {getFrequencyLabel(rule)}
              </span>
            </div>

            {/* Start date */}
            {rule.startDate && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-[var(--text-secondary)]">Bắt đầu từ</span>
                <span className="text-sm text-[var(--text-primary)]">{formatDateShort(rule.startDate)}</span>
              </div>
            )}

            {/* End condition */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--text-secondary)]">Kết thúc</span>
              <span className="text-sm text-[var(--text-primary)]">{getEndConditionLabel(rule)}</span>
            </div>

            <div className="border-t border-[var(--border)] my-2" />

            {/* Next run */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--text-secondary)] flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" /> Lần chạy tiếp theo
              </span>
              <span className="text-sm font-medium text-[var(--text-primary)]">
                {rule.enabled ? (
                  <>
                    {formatDateShort(rule.nextDate)}
                    {daysUntil >= 0 && daysUntil <= 7 && (
                      <span className="ml-1 text-[var(--primary)]">
                        ({daysUntil === 0 ? 'Hôm nay' : `${daysUntil} ngày nữa`})
                      </span>
                    )}
                  </>
                ) : (
                  <span className="text-[var(--text-tertiary)]">-- (Tạm dừng)</span>
                )}
              </span>
            </div>
          </div>
        </Card>

        {/* ── Management Action Row ───────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-3">
          <Button
            variant="secondary"
            onClick={() => setShowSkipModal(true)}
            disabled={!rule.enabled}
            className="text-sm"
          >
            <SkipForward className="w-4 h-4" />
            Bỏ qua
          </Button>
          <Button
            variant="secondary"
            onClick={() => setShowRunNowModal(true)}
            disabled={!rule.enabled}
            className="text-sm"
          >
            <Play className="w-4 h-4" />
            Chạy ngay
          </Button>
          <Button
            variant="secondary"
            onClick={() => nav.goEditRecurringRule(rule.id)}
            className="text-sm"
          >
            <Edit className="w-4 h-4" />
            Chỉnh sửa
          </Button>
        </div>

        {/* ── Per-rule Notification Preference ─────────────────────────── */}
        <Card>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-[var(--radius-lg)] flex items-center justify-center ${
                rule.notifyEnabled !== false
                  ? 'bg-[var(--primary-light)] text-[var(--primary)]'
                  : 'bg-[var(--surface)] text-[var(--text-tertiary)]'
              }`}>
                {rule.notifyEnabled !== false ? <Bell className="w-5 h-5" /> : <BellOff className="w-5 h-5" />}
              </div>
              <div>
                <h4 className="font-medium text-[var(--text-primary)] text-sm">Thông báo cho quy tắc này</h4>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                  {rule.notifyEnabled !== false
                    ? 'Nhận nhắc nhở khi quy tắc đến hạn.'
                    : 'Không nhận thông báo cho quy tắc này.'}
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                const newValue = rule.notifyEnabled === false ? true : false;
                updateRecurringRule(rule.id, { notifyEnabled: newValue });
                toast.success(newValue ? 'Đã bật thông báo cho quy tắc này' : 'Đã tắt thông báo cho quy tắc này');
              }}
              className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${
                rule.notifyEnabled !== false ? 'bg-[var(--success)]' : 'bg-[var(--border)]'
              }`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform shadow-sm ${
                rule.notifyEnabled !== false ? 'translate-x-5' : 'translate-x-0'
              }`} />
            </button>
          </div>
        </Card>

        {/* ── Execution History ────────────────────────────────────────── */}
        <Card>
          <h3 className="font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-[var(--primary)]" />
            Lịch sử thực thi
          </h3>

          {history.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 mx-auto bg-[var(--surface)] rounded-full flex items-center justify-center mb-3">
                <Clock className="w-6 h-6 text-[var(--text-tertiary)]" />
              </div>
              <p className="text-sm text-[var(--text-tertiary)]">Chưa có lần thực thi nào.</p>
            </div>
          ) : (
            <div className="space-y-0">
              {history.map((log, idx) => (
                <div
                  key={log.id}
                  className={`flex items-center gap-3 py-3 ${
                    idx < history.length - 1 ? 'border-b border-[var(--border)]' : ''
                  }`}
                >
                  {/* Status icon */}
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                    log.status === 'created'
                      ? 'bg-[var(--success-light)] text-[var(--success)]'
                      : log.status === 'skipped'
                      ? 'bg-[var(--warning-light)] text-[var(--warning)]'
                      : 'bg-[var(--danger-light)] text-[var(--danger)]'
                  }`}>
                    {log.status === 'created' && <CheckCircle2 className="w-4 h-4" />}
                    {log.status === 'skipped' && <SkipForward className="w-4 h-4" />}
                    {log.status === 'failed' && <XCircle className="w-4 h-4" />}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                        log.status === 'created'
                          ? 'bg-[var(--success-light)] text-[var(--success)]'
                          : log.status === 'skipped'
                          ? 'bg-[var(--warning-light)] text-[var(--warning)]'
                          : 'bg-[var(--danger-light)] text-[var(--danger)]'
                      }`}>
                        {log.status === 'created' ? 'Đã tạo' : log.status === 'skipped' ? 'Bỏ qua' : 'Lỗi'}
                      </span>
                      <span className="text-xs text-[var(--text-tertiary)]">
                        {formatDateTime(log.date)}
                      </span>
                    </div>
                    {log.note && (
                      <p className="text-xs text-[var(--text-secondary)] mt-0.5 truncate">{log.note}</p>
                    )}
                  </div>

                  {/* View transaction link */}
                  {log.status === 'created' && log.transactionId && (
                    <button
                      onClick={() => nav.goTransactionDetail(log.transactionId!)}
                      className="flex items-center gap-1 text-xs text-[var(--primary)] hover:text-[var(--primary-hover)] font-medium transition-colors flex-shrink-0"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Xem
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* ── Modals ──────────────────────────────────────────────────── */}

        {/* Pause Confirmation */}
        <ConfirmationModal
          isOpen={showPauseModal}
          onClose={() => setShowPauseModal(false)}
          onConfirm={confirmPause}
          title="Tạm dừng quy tắc định kỳ?"
          description="Ứng dụng sẽ ngừng tất cả thông báo và tự động tạo giao dịch cho quy tắc này."
          confirmLabel="Tạm dừng"
          cancelLabel="Huỷ"
        />

        {/* Skip Confirmation */}
        <ConfirmationModal
          isOpen={showSkipModal}
          onClose={() => setShowSkipModal(false)}
          onConfirm={confirmSkip}
          title="Bỏ qua lần chạy tiếp theo?"
          description="Giao dịch sắp tới sẽ không được tạo. Các kỳ tiếp theo vẫn chạy bình thường."
          confirmLabel="Bỏ qua"
          cancelLabel="Huỷ"
        />

        {/* Run Now Confirmation */}
        <ConfirmationModal
          isOpen={showRunNowModal}
          onClose={() => setShowRunNowModal(false)}
          onConfirm={confirmRunNow}
          title="Tạo giao dịch ngay?"
          description="Giao dịch sẽ được tạo ngay lập tức thay vì chờ đến ngày đã lên lịch."
          confirmLabel="Tạo ngay"
          cancelLabel="Huỷ"
        />

        {/* Delete Confirmation */}
        <ConfirmationModal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={confirmDelete}
          title="Xoá quy tắc định kỳ?"
          description={`Bạn có chắc muốn xoá "${rule.name}"? Giao dịch đã tạo trước đó sẽ không bị ảnh hưởng.`}
          confirmLabel="Xoá"
          cancelLabel="Huỷ"
          isDangerous
        />
      </div>
    </div>
  );
}
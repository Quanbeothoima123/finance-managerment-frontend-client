import React, { useState, useMemo, useRef, useCallback } from 'react';
import { useParams } from 'react-router';
import {
  ArrowLeft, Edit2, Plus, Trash2, TrendingUp, TrendingDown, Calendar, Target, Sparkles,
  Smartphone, Plane, ShieldCheck, Bike, BookOpen, Home, Car, Gift, Heart,
  AlertTriangle, Zap, ArrowDownCircle, X, Filter, Shield, Lock, Unlock, ShieldAlert, Check,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { AmountInput } from '../components/AmountInput';
import { useAppNavigation } from '../hooks/useAppNavigation';
import { useDemoData, type GoalContribution, type Goal } from '../contexts/DemoDataContext';
import { useToast } from '../contexts/ToastContext';
import { useNotifications } from '../contexts/NotificationContext';
import { ConfirmationModal } from '../components/ConfirmationModals';
import { useGoalUndoDelete } from '../hooks/useGoalUndoDelete';
import { SwipeableRow } from '../components/SwipeableRow';

const goalIconMap: Record<string, React.ComponentType<any>> = {
  smartphone: Smartphone, plane: Plane, shield: ShieldCheck, bike: Bike, book: BookOpen,
  home: Home, car: Car, gift: Gift, heart: Heart, target: Target,
};

type ContribFilter = 'all' | 'deposit' | 'withdrawal';

const fmt = (n: number) => new Intl.NumberFormat('vi-VN').format(n);
const fmtDate = (d: string) => new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });

// ── Helpers ─────────────────────────────────────────────────────────────────
function isGoalLocked(goal: Goal): boolean {
  if (!goal.withdrawalLockEnabled || !goal.withdrawalLockUntil) return false;
  return new Date(goal.withdrawalLockUntil).getTime() > Date.now();
}

function lockRemainingLabel(goal: Goal): string {
  if (!goal.withdrawalLockUntil) return '';
  const diff = new Date(goal.withdrawalLockUntil).getTime() - Date.now();
  if (diff <= 0) return 'Đã hết hạn';
  const days = Math.ceil(diff / 86400000);
  if (days >= 30) return `Còn ${Math.floor(days / 30)} tháng ${days % 30} ngày`;
  return `Còn ${days} ngày`;
}

function needsApproval(goal: Goal, amount: number): boolean {
  return !!goal.withdrawalApprovalEnabled && !!goal.withdrawalApprovalThreshold && amount >= goal.withdrawalApprovalThreshold;
}

// ── Contribution Row ────────────────────────────────────────────────────────
function ContributionItem({ contribution, onRemove }: { contribution: GoalContribution; onRemove: () => void }) {
  const isW = contribution.type === 'withdrawal';
  const isAuto = contribution.notes?.includes('tự động');
  return (
    <SwipeableRow actions={[{ icon: <Trash2 className="w-4 h-4" />, label: 'Xoá', color: 'white', bgColor: 'var(--danger)', onClick: onRemove }]}>
      <div className="flex items-center gap-3 py-3 px-3 border-b border-[var(--divider)] last:border-0 bg-[var(--card)]">
        <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${isW ? 'bg-[var(--danger-light)]' : 'bg-[var(--success-light)]'}`}>
          {isW ? <ArrowDownCircle className="w-4 h-4 text-[var(--danger)]" /> : <TrendingUp className="w-4 h-4 text-[var(--success)]" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className={`text-sm font-medium tabular-nums ${isW ? 'text-[var(--danger)]' : 'text-[var(--success)]'}`}>
              {isW ? '−' : '+'}{fmt(Math.abs(contribution.amount))}₫
            </p>
            {isAuto && <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-[var(--radius-sm)] bg-[var(--primary-light)] text-[var(--primary)] text-[10px] font-medium"><Zap className="w-2.5 h-2.5" /> Tự động</span>}
            {isW && <span className="inline-flex items-center px-1.5 py-0.5 rounded-[var(--radius-sm)] bg-[var(--danger-light)] text-[var(--danger)] text-[10px] font-medium">Rút tiền</span>}
          </div>
          {contribution.notes && <p className="text-xs text-[var(--text-secondary)] mt-0.5 truncate">{contribution.notes}</p>}
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <p className="text-xs text-[var(--text-tertiary)] tabular-nums">{fmtDate(contribution.date)}</p>
          <button onClick={e => { e.stopPropagation(); onRemove(); }} className="hidden md:flex p-1.5 rounded-[var(--radius-md)] hover:bg-[var(--danger-light)] text-[var(--text-tertiary)] hover:text-[var(--danger)] transition-colors"><X className="w-3.5 h-3.5" /></button>
        </div>
      </div>
    </SwipeableRow>
  );
}

// ── Withdraw Modal (with 2-step approval) ───────────────────────────────────
function WithdrawModal({ isOpen, onClose, goal, onWithdraw }: {
  isOpen: boolean; onClose: () => void; goal: Goal; onWithdraw: (amount: number, reason: string) => void;
}) {
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [step, setStep] = useState<0 | 1>(0); // 0 = form, 1 = approval confirmation
  const [confirmText, setConfirmText] = useState('');

  if (!isOpen) return null;

  // Compute effective max
  let maxWithdraw = goal.currentAmount;
  let limitLabel = '';
  if (goal.withdrawalLimitType === 'percentage' && goal.withdrawalLimitValue) {
    const pctMax = Math.floor(goal.currentAmount * goal.withdrawalLimitValue / 100);
    maxWithdraw = Math.min(maxWithdraw, pctMax);
    limitLabel = `Giới hạn: ${goal.withdrawalLimitValue}% số dư (${fmt(pctMax)}₫)`;
  } else if (goal.withdrawalLimitType === 'amount' && goal.withdrawalLimitValue) {
    maxWithdraw = Math.min(maxWithdraw, goal.withdrawalLimitValue);
    limitLabel = `Giới hạn: ${fmt(goal.withdrawalLimitValue)}₫/lần`;
  }

  const withdrawAmount = parseInt(amount, 10) || 0;
  const newBalance = goal.currentAmount - withdrawAmount;
  const newPct = goal.targetAmount > 0 ? (newBalance / goal.targetAmount) * 100 : 0;
  const requiresApproval = needsApproval(goal, withdrawAmount);

  const quickAmounts = [
    { label: '1 triệu', value: 1000000 },
    { label: '2 triệu', value: 2000000 },
    { label: '5 triệu', value: 5000000 },
    { label: 'Tối đa', value: maxWithdraw },
  ].filter(q => q.value <= maxWithdraw && q.value > 0);

  const handleStep0Submit = () => {
    const val = parseInt(amount, 10);
    if (!val || val <= 0) { setError('Vui lòng nhập số tiền hợp lệ'); return; }
    if (val > maxWithdraw) { setError(`Số tiền không vượt quá ${fmt(maxWithdraw)}₫`); return; }
    if (requiresApproval && !reason.trim()) { setError('Rút lớn: bắt buộc nhập lý do'); return; }
    if (requiresApproval) {
      setStep(1);
      setConfirmText('');
    } else {
      onWithdraw(val, reason || 'Rút tiền từ mục tiêu');
      resetModal();
    }
  };

  const handleStep1Submit = () => {
    if (confirmText !== 'XÁC NHẬN') return;
    onWithdraw(parseInt(amount, 10), reason);
    resetModal();
  };

  const resetModal = () => { setAmount(''); setReason(''); setError(''); setStep(0); setConfirmText(''); };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => { onClose(); resetModal(); }}>
      <div className="bg-[var(--card)] rounded-[var(--radius-xl)] p-6 max-w-md w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className={`w-10 h-10 rounded-[var(--radius-lg)] flex items-center justify-center ${step === 1 ? 'bg-[var(--warning-light)]' : 'bg-[var(--danger-light)]'}`}>
            {step === 1 ? <ShieldAlert className="w-5 h-5 text-[var(--warning)]" /> : <ArrowDownCircle className="w-5 h-5 text-[var(--danger)]" />}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-[var(--text-primary)]">{step === 1 ? 'Xác nhận rút tiền lớn' : 'Rút tiền từ mục tiêu'}</h3>
            <p className="text-xs text-[var(--text-secondary)]">{step === 1 ? 'Bước 2/2 — Xác nhận bảo mật' : `Rút tiền khỏi "${goal.name}"`}</p>
          </div>
        </div>

        {/* ── Step 0: Amount + Reason ── */}
        {step === 0 && (
          <>
            <div className="mb-5 p-3 rounded-[var(--radius-lg)] bg-[var(--surface)]">
              <p className="text-xs text-[var(--text-secondary)] mb-1">Số dư hiện tại</p>
              <p className="text-lg font-bold text-[var(--text-primary)] tabular-nums">{fmt(goal.currentAmount)}₫</p>
            </div>
            {limitLabel && (
              <div className="mb-4 flex items-center gap-2 p-2.5 rounded-[var(--radius-lg)] bg-[var(--warning-light)]">
                <Shield className="w-4 h-4 text-[var(--warning)] flex-shrink-0" />
                <p className="text-xs text-[var(--warning)] font-medium">{limitLabel}</p>
              </div>
            )}
            <div className="space-y-4">
              {quickAmounts.length > 0 && (
                <div>
                  <p className="text-xs text-[var(--text-secondary)] mb-2">Số tiền nhanh</p>
                  <div className="flex flex-wrap gap-2">
                    {quickAmounts.map(q => (
                      <button key={q.value} type="button" onClick={() => { setAmount(String(q.value)); setError(''); }}
                        className={`px-3 py-1.5 rounded-[var(--radius-md)] text-xs font-medium border transition-colors ${parseInt(amount, 10) === q.value ? 'border-[var(--danger)] bg-[var(--danger-light)] text-[var(--danger)]' : 'border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--text-tertiary)]'}`}>
                        {q.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">Số tiền rút <span className="text-[var(--danger)]">*</span></label>
                <AmountInput value={amount} onChange={v => { setAmount(v); setError(''); }} error={error} />
                <p className="text-xs text-[var(--text-tertiary)] mt-1">Tối đa: {fmt(maxWithdraw)}₫</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                  Lý do rút {requiresApproval ? <span className="text-[var(--danger)]">* (bắt buộc)</span> : '(tuỳ chọn)'}
                </label>
                <textarea placeholder="VD: Chi tiêu khẩn cấp, Đổi kế hoạch..." value={reason} onChange={e => { setReason(e.target.value); if (error.includes('lý do')) setError(''); }} rows={2}
                  className={`w-full px-4 py-2.5 bg-[var(--input-background)] border rounded-[var(--radius-lg)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] resize-none transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)] ${requiresApproval && !reason.trim() && error ? 'border-[var(--danger)]' : 'border-[var(--border)]'}`} />
              </div>
              {/* Approval threshold warning */}
              {requiresApproval && (
                <div className="flex items-center gap-2 p-2.5 rounded-[var(--radius-lg)] bg-[var(--warning-light)]">
                  <ShieldAlert className="w-4 h-4 text-[var(--warning)] flex-shrink-0" />
                  <p className="text-xs text-[var(--warning)] font-medium">
                    Số tiền ≥ {fmt(goal.withdrawalApprovalThreshold!)}₫ — cần xác nhận 2 bước
                  </p>
                </div>
              )}
              {/* Preview */}
              {withdrawAmount > 0 && withdrawAmount <= maxWithdraw && (
                <div className="p-3 rounded-[var(--radius-lg)] bg-[var(--surface)]">
                  <p className="text-xs text-[var(--text-secondary)] mb-2">Sau khi rút tiền</p>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-[var(--text-secondary)]">Số dư còn lại</span>
                    <span className="text-sm font-semibold text-[var(--text-primary)] tabular-nums">{fmt(Math.max(newBalance, 0))}₫</span>
                  </div>
                  <div className="h-2.5 bg-[var(--border)] rounded-full overflow-hidden mb-1.5">
                    <div className="h-full rounded-full transition-all" style={{ width: `${Math.max(0, Math.min(newPct, 100))}%`, backgroundColor: newPct < 30 ? 'var(--danger)' : newPct < 60 ? 'var(--warning)' : 'var(--primary)' }} />
                  </div>
                  <p className="text-xs text-[var(--text-tertiary)] tabular-nums">Tiến độ: {newPct.toFixed(1)}%</p>
                </div>
              )}
            </div>
            <div className="mt-6 flex gap-3">
              <button type="button" onClick={handleStep0Submit} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[var(--danger)] hover:opacity-90 text-white rounded-[var(--radius-lg)] font-medium transition-opacity">
                <ArrowDownCircle className="w-4 h-4" /><span>{requiresApproval ? 'Tiếp tục xác nhận' : 'Xác nhận rút tiền'}</span>
              </button>
              <button type="button" onClick={() => { onClose(); resetModal(); }} className="px-4 py-2.5 border border-[var(--border)] text-[var(--text-primary)] rounded-[var(--radius-lg)] font-medium hover:bg-[var(--surface)] transition-colors">Huỷ</button>
            </div>
          </>
        )}

        {/* ── Step 1: Type "XÁC NHẬN" ── */}
        {step === 1 && (
          <>
            <div className="space-y-5">
              {/* Summary */}
              <div className="p-4 rounded-[var(--radius-lg)] bg-[var(--danger-light)] border border-[var(--danger)]/20">
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div><p className="text-xs text-[var(--text-secondary)] mb-0.5">Số tiền rút</p><p className="text-lg font-bold text-[var(--danger)] tabular-nums">{fmt(withdrawAmount)}₫</p></div>
                  <div><p className="text-xs text-[var(--text-secondary)] mb-0.5">Số dư sau rút</p><p className="text-lg font-bold text-[var(--text-primary)] tabular-nums">{fmt(Math.max(newBalance, 0))}₫</p></div>
                </div>
                <div><p className="text-xs text-[var(--text-secondary)] mb-0.5">Lý do</p><p className="text-sm text-[var(--text-primary)]">{reason}</p></div>
              </div>

              {/* Type to confirm */}
              <div>
                <p className="text-sm text-[var(--text-primary)] mb-3">
                  Đây là giao dịch rút lớn. Để xác nhận, hãy nhập <span className="font-bold text-[var(--danger)] bg-[var(--danger-light)] px-1.5 py-0.5 rounded">XÁC NHẬN</span> vào ô bên dưới:
                </p>
                <Input
                  value={confirmText}
                  onChange={e => setConfirmText(e.target.value.toUpperCase())}
                  placeholder='Nhập "XÁC NHẬN"'
                />
                {confirmText.length > 0 && confirmText !== 'XÁC NHẬN' && (
                  <p className="text-xs text-[var(--danger)] mt-1">Chưa đúng — hãy nhập chính xác: XÁC NHẬN</p>
                )}
                {confirmText === 'XÁC NHẬN' && (
                  <p className="text-xs text-[var(--success)] mt-1 flex items-center gap-1"><Check className="w-3.5 h-3.5" /> Đã xác nhận</p>
                )}
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button type="button" onClick={handleStep1Submit} disabled={confirmText !== 'XÁC NHẬN'}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[var(--danger)] hover:opacity-90 text-white rounded-[var(--radius-lg)] font-medium transition-opacity disabled:opacity-40 disabled:cursor-not-allowed">
                <ShieldAlert className="w-4 h-4" /><span>Xác nhận rút {fmt(withdrawAmount)}₫</span>
              </button>
              <button type="button" onClick={() => setStep(0)} className="px-4 py-2.5 border border-[var(--border)] text-[var(--text-primary)] rounded-[var(--radius-lg)] font-medium hover:bg-[var(--surface)] transition-colors">Quay lại</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Lock Modal ──────────────────────────────────────────────────────────────
function LockModal({ isOpen, onClose, onLock }: { isOpen: boolean; onClose: () => void; onLock: (until: string) => void }) {
  const [selectedDuration, setSelectedDuration] = useState('');
  const [customDate, setCustomDate] = useState('');
  if (!isOpen) return null;

  const today = new Date();
  const presets = [
    { label: '1 tuần', days: 7 },
    { label: '2 tuần', days: 14 },
    { label: '1 tháng', days: 30 },
    { label: '3 tháng', days: 90 },
    { label: '6 tháng', days: 180 },
  ];

  const getDate = (days: number) => { const d = new Date(today); d.setDate(d.getDate() + days); return d.toISOString().split('T')[0]; };
  const minDate = new Date(today.getTime() + 86400000).toISOString().split('T')[0];

  const selectedUntil = selectedDuration === 'custom' ? customDate : selectedDuration;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="bg-[var(--card)] rounded-[var(--radius-xl)] p-6 max-w-md w-full" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-[var(--danger-light)] rounded-[var(--radius-lg)] flex items-center justify-center"><Lock className="w-5 h-5 text-[var(--danger)]" /></div>
          <div><h3 className="text-lg font-semibold text-[var(--text-primary)]">Khoá rút tiền</h3><p className="text-xs text-[var(--text-secondary)]">Chặn tất cả lệnh rút trong thời gian chọn</p></div>
        </div>

        <div className="space-y-3 mb-5">
          {presets.map(p => {
            const until = getDate(p.days);
            return (
              <button key={p.days} type="button" onClick={() => { setSelectedDuration(until); setCustomDate(''); }}
                className={`w-full flex items-center justify-between p-3 rounded-[var(--radius-lg)] border transition-colors ${selectedDuration === until ? 'border-[var(--danger)] bg-[var(--danger-light)]' : 'border-[var(--border)] hover:border-[var(--text-tertiary)]'}`}>
                <span className={`text-sm font-medium ${selectedDuration === until ? 'text-[var(--danger)]' : 'text-[var(--text-primary)]'}`}>{p.label}</span>
                <span className="text-xs text-[var(--text-tertiary)] tabular-nums">đến {fmtDate(until)}</span>
              </button>
            );
          })}
          {/* Custom date */}
          <button type="button" onClick={() => setSelectedDuration('custom')}
            className={`w-full p-3 rounded-[var(--radius-lg)] border transition-colors text-left ${selectedDuration === 'custom' ? 'border-[var(--danger)] bg-[var(--danger-light)]' : 'border-[var(--border)] hover:border-[var(--text-tertiary)]'}`}>
            <span className={`text-sm font-medium ${selectedDuration === 'custom' ? 'text-[var(--danger)]' : 'text-[var(--text-primary)]'}`}>Chọn ngày cụ thể</span>
          </button>
          {selectedDuration === 'custom' && (
            <input type="date" min={minDate} value={customDate} onChange={e => setCustomDate(e.target.value)}
              className="w-full px-4 py-2.5 bg-[var(--input-background)] border border-[var(--border)] rounded-[var(--radius-lg)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]" />
          )}
        </div>

        <div className="p-3 rounded-[var(--radius-lg)] bg-[var(--warning-light)] mb-5">
          <p className="text-xs text-[var(--warning)] font-medium flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" /> Mở khoá sớm yêu cầu nhập cụm từ xác nhận "MỞ KHOÁ"</p>
        </div>

        <div className="flex gap-3">
          <button type="button" onClick={() => { if (selectedUntil && selectedUntil !== 'custom') onLock(selectedUntil); }} disabled={!selectedUntil || selectedUntil === 'custom'}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[var(--danger)] hover:opacity-90 text-white rounded-[var(--radius-lg)] font-medium transition-opacity disabled:opacity-40 disabled:cursor-not-allowed">
            <Lock className="w-4 h-4" /><span>Khoá ngay</span>
          </button>
          <button type="button" onClick={onClose} className="px-4 py-2.5 border border-[var(--border)] text-[var(--text-primary)] rounded-[var(--radius-lg)] font-medium hover:bg-[var(--surface)] transition-colors">Huỷ</button>
        </div>
      </div>
    </div>
  );
}

// ── Early Unlock Modal ──────────────────────────────────────────────────────
function UnlockModal({ isOpen, onClose, onUnlock, lockUntil }: { isOpen: boolean; onClose: () => void; onUnlock: () => void; lockUntil: string }) {
  const [confirmText, setConfirmText] = useState('');
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="bg-[var(--card)] rounded-[var(--radius-xl)] p-6 max-w-md w-full" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-[var(--warning-light)] rounded-[var(--radius-lg)] flex items-center justify-center"><Unlock className="w-5 h-5 text-[var(--warning)]" /></div>
          <div><h3 className="text-lg font-semibold text-[var(--text-primary)]">Mở khoá sớm</h3><p className="text-xs text-[var(--text-secondary)]">Khoá đến {fmtDate(lockUntil)}</p></div>
        </div>
        <div className="p-3 rounded-[var(--radius-lg)] bg-[var(--warning-light)] mb-5">
          <p className="text-sm text-[var(--warning)]">Bạn đã tự khoá rút tiền để bảo vệ mục tiêu. Mở khoá sớm có thể ảnh hưởng đến tiến độ tiết kiệm.</p>
        </div>
        <div className="mb-5">
          <p className="text-sm text-[var(--text-primary)] mb-3">Nhập <span className="font-bold text-[var(--warning)] bg-[var(--warning-light)] px-1.5 py-0.5 rounded">MỞ KHOÁ</span> để xác nhận:</p>
          <Input value={confirmText} onChange={e => setConfirmText(e.target.value.toUpperCase())} placeholder='Nhập "MỞ KHOÁ"' />
          {confirmText.length > 0 && confirmText !== 'MỞ KHOÁ' && <p className="text-xs text-[var(--danger)] mt-1">Chưa đúng — hãy nhập: MỞ KHOÁ</p>}
          {confirmText === 'MỞ KHOÁ' && <p className="text-xs text-[var(--success)] mt-1 flex items-center gap-1"><Check className="w-3.5 h-3.5" /> Đã xác nhận</p>}
        </div>
        <div className="flex gap-3">
          <button type="button" onClick={() => { if (confirmText === 'MỞ KHOÁ') { onUnlock(); setConfirmText(''); } }} disabled={confirmText !== 'MỞ KHOÁ'}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[var(--warning)] hover:opacity-90 text-white rounded-[var(--radius-lg)] font-medium transition-opacity disabled:opacity-40 disabled:cursor-not-allowed">
            <Unlock className="w-4 h-4" /><span>Mở khoá</span>
          </button>
          <button type="button" onClick={onClose} className="px-4 py-2.5 border border-[var(--border)] text-[var(--text-primary)] rounded-[var(--radius-lg)] font-medium hover:bg-[var(--surface)] transition-colors">Huỷ</button>
        </div>
      </div>
    </div>
  );
}

// ── Auto-Contribute Modal ───────────────────────────────────────────────────
function AutoContributeModal({ isOpen, onClose, goal, accounts, onSave }: {
  isOpen: boolean; onClose: () => void; goal: Goal; accounts: { id: string; name: string }[];
  onSave: (s: { amount: number; day: number; accountId: string }) => void;
}) {
  const [amount, setAmount] = useState(String(goal.autoContributeAmount || ''));
  const [day, setDay] = useState(String(goal.autoContributeDay || '1'));
  const [accountId, setAccountId] = useState(goal.autoContributeAccountId || (accounts[0]?.id || ''));
  const [error, setError] = useState('');
  if (!isOpen) return null;
  const remaining = goal.targetAmount - goal.currentAmount;
  const daysToDeadline = Math.max(1, Math.ceil((new Date(goal.deadline).getTime() - Date.now()) / 86400000));
  const suggested = Math.ceil(remaining / Math.max(1, daysToDeadline / 30));
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="bg-[var(--card)] rounded-[var(--radius-xl)] p-6 max-w-md w-full" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-[var(--primary-light)] rounded-[var(--radius-lg)] flex items-center justify-center"><Zap className="w-5 h-5 text-[var(--primary)]" /></div>
          <div><h3 className="text-lg font-semibold text-[var(--text-primary)]">Đóng góp tự động</h3><p className="text-xs text-[var(--text-secondary)]">Hệ thống sẽ tự thêm đóng góp mỗi tháng</p></div>
        </div>
        <div className="space-y-4">
          {remaining > 0 && (
            <button type="button" onClick={() => { setAmount(String(suggested)); setError(''); }}
              className="w-full p-3 rounded-[var(--radius-lg)] bg-[var(--primary-light)] text-left hover:bg-[var(--primary)]/20 transition-colors">
              <p className="text-xs text-[var(--primary)] font-medium mb-0.5">Đề xuất tự động</p>
              <p className="text-sm text-[var(--text-primary)]"><span className="font-semibold tabular-nums">{fmt(suggested)}₫/tháng</span> <span className="text-xs text-[var(--text-secondary)]">để đạt mục tiêu đúng hạn</span></p>
            </button>
          )}
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">Số tiền mỗi tháng <span className="text-[var(--danger)]">*</span></label>
            <Input type="number" value={amount} onChange={e => { setAmount(e.target.value); setError(''); }} placeholder="VD: 2000000" error={error} />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">Ngày thực hiện</label>
            <select value={day} onChange={e => setDay(e.target.value)} className="w-full px-4 py-2.5 bg-[var(--input-background)] border border-[var(--border)] rounded-[var(--radius-lg)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]">
              {Array.from({ length: 28 }, (_, i) => i + 1).map(d => <option key={d} value={d}>Ngày {d}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">Từ tài khoản</label>
            <select value={accountId} onChange={e => setAccountId(e.target.value)} className="w-full px-4 py-2.5 bg-[var(--input-background)] border border-[var(--border)] rounded-[var(--radius-lg)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]">
              {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
        </div>
        <div className="mt-6 flex gap-3">
          <button type="button" onClick={() => { const v = parseInt(amount, 10); if (!v || v <= 0) { setError('Vui lòng nhập số tiền hợp lệ'); return; } onSave({ amount: v, day: parseInt(day, 10), accountId }); }} className="flex-1 px-4 py-2.5 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white rounded-[var(--radius-lg)] font-medium transition-colors">Bật tự động</button>
          <button type="button" onClick={onClose} className="px-4 py-2.5 border border-[var(--border)] text-[var(--text-primary)] rounded-[var(--radius-lg)] font-medium hover:bg-[var(--surface)] transition-colors">Huỷ</button>
        </div>
      </div>
    </div>
  );
}

// ── Withdrawal Limit Settings Modal ─────────────────────────────────────────
function WithdrawalLimitModal({ isOpen, onClose, goal, onSave }: {
  isOpen: boolean; onClose: () => void; goal: Goal;
  onSave: (type: Goal['withdrawalLimitType'], value: number | undefined) => void;
}) {
  const [limitType, setLimitType] = useState<Goal['withdrawalLimitType']>(goal.withdrawalLimitType || 'none');
  const [limitValue, setLimitValue] = useState(String(goal.withdrawalLimitValue || ''));
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="bg-[var(--card)] rounded-[var(--radius-xl)] p-6 max-w-md w-full" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-[var(--warning-light)] rounded-[var(--radius-lg)] flex items-center justify-center"><Shield className="w-5 h-5 text-[var(--warning)]" /></div>
          <div><h3 className="text-lg font-semibold text-[var(--text-primary)]">Giới hạn rút tiền</h3><p className="text-xs text-[var(--text-secondary)]">Bảo vệ mục tiêu khỏi rút quá nhiều</p></div>
        </div>
        <div className="space-y-3 mb-5">
          {([
            { v: 'none' as const, label: 'Không giới hạn', desc: 'Rút tối đa toàn bộ số dư' },
            { v: 'percentage' as const, label: 'Theo phần trăm', desc: 'Giới hạn % số dư mỗi lần' },
            { v: 'amount' as const, label: 'Theo số tiền', desc: 'Giới hạn cố định mỗi lần' },
          ]).map(opt => (
            <button key={opt.v} type="button" onClick={() => setLimitType(opt.v)}
              className={`w-full p-3 rounded-[var(--radius-lg)] border text-left transition-colors ${limitType === opt.v ? 'border-[var(--primary)] bg-[var(--primary-light)]' : 'border-[var(--border)] hover:border-[var(--text-tertiary)]'}`}>
              <p className={`text-sm font-medium ${limitType === opt.v ? 'text-[var(--primary)]' : 'text-[var(--text-primary)]'}`}>{opt.label}</p>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">{opt.desc}</p>
            </button>
          ))}
        </div>
        {limitType !== 'none' && (
          <div className="mb-5">
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">{limitType === 'percentage' ? 'Phần trăm tối đa (%)' : 'Số tiền tối đa (₫)'}</label>
            <Input type="number" value={limitValue} onChange={e => setLimitValue(e.target.value)} placeholder={limitType === 'percentage' ? 'VD: 30' : 'VD: 5000000'} />
            <div className="mt-2 flex flex-wrap gap-2">
              {(limitType === 'percentage' ? [10, 20, 30, 50] : [1000000, 2000000, 5000000]).map(v => (
                <button key={v} type="button" onClick={() => setLimitValue(String(v))}
                  className={`px-3 py-1 rounded-[var(--radius-md)] text-xs font-medium border transition-colors ${parseInt(limitValue, 10) === v ? 'border-[var(--primary)] bg-[var(--primary-light)] text-[var(--primary)]' : 'border-[var(--border)] text-[var(--text-secondary)]'}`}>
                  {limitType === 'percentage' ? `${v}%` : `${fmt(v)}₫`}
                </button>
              ))}
            </div>
          </div>
        )}
        <div className="flex gap-3">
          <button type="button" onClick={() => { if (limitType === 'none') { onSave('none', undefined); return; } const v = parseInt(limitValue, 10); if (!v || v <= 0) return; if (limitType === 'percentage' && v > 100) return; onSave(limitType, v); }}
            className="flex-1 px-4 py-2.5 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white rounded-[var(--radius-lg)] font-medium transition-colors">Lưu</button>
          <button type="button" onClick={onClose} className="px-4 py-2.5 border border-[var(--border)] text-[var(--text-primary)] rounded-[var(--radius-lg)] font-medium hover:bg-[var(--surface)] transition-colors">Huỷ</button>
        </div>
      </div>
    </div>
  );
}

// ── Approval Settings Modal ─────────────────────────────────────────────────
function ApprovalSettingsModal({ isOpen, onClose, goal, onSave }: {
  isOpen: boolean; onClose: () => void; goal: Goal;
  onSave: (enabled: boolean, threshold: number | undefined) => void;
}) {
  const [enabled, setEnabled] = useState(goal.withdrawalApprovalEnabled || false);
  const [threshold, setThreshold] = useState(String(goal.withdrawalApprovalThreshold || ''));
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="bg-[var(--card)] rounded-[var(--radius-xl)] p-6 max-w-md w-full" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-[var(--primary-light)] rounded-[var(--radius-lg)] flex items-center justify-center"><ShieldAlert className="w-5 h-5 text-[var(--primary)]" /></div>
          <div><h3 className="text-lg font-semibold text-[var(--text-primary)]">Xác nhận rút lớn</h3><p className="text-xs text-[var(--text-secondary)]">Yêu cầu xác nhận 2 bước cho rút lớn</p></div>
        </div>

        <div className="space-y-4">
          {/* Toggle */}
          <div className="flex items-center justify-between p-3 rounded-[var(--radius-lg)] bg-[var(--surface)]">
            <div><p className="text-sm font-medium text-[var(--text-primary)]">Bật xác nhận 2 bước</p><p className="text-xs text-[var(--text-secondary)]">Bắt buộc lý do + nhập "XÁC NHẬN"</p></div>
            <button type="button" onClick={() => setEnabled(!enabled)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${enabled ? 'bg-[var(--primary)]' : 'bg-[var(--border)]'}`}>
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${enabled ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>

          {enabled && (
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">Ngưỡng áp dụng (₫)</label>
              <AmountInput value={threshold} onChange={v => setThreshold(v)} />
              <p className="text-xs text-[var(--text-tertiary)] mt-1">Rút từ số tiền này trở lên sẽ cần xác nhận 2 bước</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {[1000000, 3000000, 5000000, 10000000].map(v => (
                  <button key={v} type="button" onClick={() => setThreshold(String(v))}
                    className={`px-3 py-1 rounded-[var(--radius-md)] text-xs font-medium border transition-colors ${parseInt(threshold, 10) === v ? 'border-[var(--primary)] bg-[var(--primary-light)] text-[var(--primary)]' : 'border-[var(--border)] text-[var(--text-secondary)]'}`}>
                    {fmt(v)}₫
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 flex gap-3">
          <button type="button" onClick={() => {
            if (!enabled) { onSave(false, undefined); return; }
            const v = parseInt(threshold, 10);
            if (!v || v <= 0) return;
            onSave(true, v);
          }} className="flex-1 px-4 py-2.5 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white rounded-[var(--radius-lg)] font-medium transition-colors">Lưu</button>
          <button type="button" onClick={onClose} className="px-4 py-2.5 border border-[var(--border)] text-[var(--text-primary)] rounded-[var(--radius-lg)] font-medium hover:bg-[var(--surface)] transition-colors">Huỷ</button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════════════
export default function GoalDetail() {
  const [activeTab, setActiveTab] = useState<'contributions' | 'insights'>('contributions');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [showAutoSetup, setShowAutoSetup] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [showLockModal, setShowLockModal] = useState(false);
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [contribToRemove, setContribToRemove] = useState<GoalContribution | null>(null);
  const [contribFilter, setContribFilter] = useState<ContribFilter>('all');
  const { id } = useParams<{ id: string }>();
  const nav = useAppNavigation();
  const { goals, updateGoal, accounts, withdrawFromGoal, removeGoalContribution, restoreGoals } = useDemoData();
  const toast = useToast();
  const { addNotification } = useNotifications();
  const { softDeleteGoal } = useGoalUndoDelete();

  const goalsSnapshotRef = useRef<typeof goals | null>(null);
  const undoRestore = useCallback(() => {
    if (goalsSnapshotRef.current) { restoreGoals(goalsSnapshotRef.current); toast.success('Đã hoàn tác.'); goalsSnapshotRef.current = null; }
  }, [restoreGoals, toast]);

  const goal = goals.find(g => g.id === id);

  const handleBack = () => nav.goBack();
  const handleEdit = () => nav.goEditGoal(id || '');
  const handleAddContribution = () => nav.goAddGoalContribution(id || '');

  const locked = goal ? isGoalLocked(goal) : false;

  const handleWithdraw = (amount: number, reason: string) => {
    if (!goal) return;
    goalsSnapshotRef.current = [...goals];
    withdrawFromGoal(goal.id, amount, reason);
    toast.showUndoToast(`Đã rút ${fmt(amount)}₫ từ "${goal.name}".`, undoRestore, 6000);
    setShowWithdrawModal(false);

    // Withdrawal alert notification
    const newBalance = goal.currentAmount - amount;
    const newPct = goal.targetAmount > 0 ? (newBalance / goal.targetAmount) * 100 : 0;
    const daysLeft = Math.ceil((new Date(goal.deadline).getTime() - Date.now()) / 86400000);
    const monthsLeft = Math.max(1, daysLeft / 30);
    const remaining = goal.targetAmount - newBalance;
    const neededPerMonth = remaining / monthsLeft;
    const deps = (goal.contributions || []).filter(c => c.type !== 'withdrawal');
    const avgDeposit = deps.length > 0 ? deps.reduce((s, c) => s + c.amount, 0) / deps.length : 0;
    const isBehind = avgDeposit > 0 && neededPerMonth > avgDeposit * 1.5;

    if (newPct < 50 || isBehind) {
      addNotification({
        type: 'goal-withdrawal-alert',
        title: `Cảnh báo rút tiền: ${goal.name}`,
        subtitle: newPct < 50
          ? `Tiến độ giảm còn ${newPct.toFixed(0)}% sau khi rút ${fmt(amount)}₫. Cần tăng tốc tiết kiệm!`
          : `Rút ${fmt(amount)}₫ khiến cần ${fmt(Math.ceil(neededPerMonth))}₫/tháng để kịp hạn.`,
        goalId: goal.id, targetAmount: goal.targetAmount, percentAchieved: Math.max(0, newPct),
      });
    }
  };

  const handleRemoveContribution = (c: GoalContribution) => {
    if (!goal) return;
    goalsSnapshotRef.current = [...goals];
    const isW = c.type === 'withdrawal';
    removeGoalContribution(goal.id, c.id);
    toast.showUndoToast(isW ? `Đã xoá bản ghi rút tiền ${fmt(Math.abs(c.amount))}₫.` : `Đã xoá đóng góp ${fmt(Math.abs(c.amount))}₫.`, undoRestore, 6000);
    setContribToRemove(null);
  };

  const handleLock = (until: string) => {
    if (!goal) return;
    updateGoal(goal.id, { withdrawalLockEnabled: true, withdrawalLockUntil: until });
    toast.success(`Đã khoá rút tiền đến ${fmtDate(until)}`);
    setShowLockModal(false);
  };

  const handleUnlock = () => {
    if (!goal) return;
    updateGoal(goal.id, { withdrawalLockEnabled: false, withdrawalLockUntil: undefined });
    toast.info('Đã mở khoá rút tiền');
    setShowUnlockModal(false);
  };

  // Not found
  if (!goal) {
    return (
      <div className="min-h-screen bg-[var(--background)]">
        <div className="max-w-4xl mx-auto p-4 md:p-6 pb-20 md:pb-6 space-y-6">
          <button onClick={handleBack} className="flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] mb-4 transition-colors"><ArrowLeft className="w-5 h-5" /><span className="font-medium">Quay lại</span></button>
          <Card>
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-[var(--warning-light)] rounded-full flex items-center justify-center mx-auto mb-4"><AlertTriangle className="w-8 h-8 text-[var(--warning)]" /></div>
              <h3 className="font-semibold text-[var(--text-primary)] mb-2">Không tìm thấy mục tiêu</h3>
              <p className="text-sm text-[var(--text-secondary)] mb-6">Mục tiêu này có thể đã bị xoá hoặc không tồn tại.</p>
              <button onClick={() => nav.goGoals()} className="inline-flex items-center gap-2 px-4 py-2.5 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white rounded-[var(--radius-lg)] transition-colors"><span className="font-medium">Về danh sách mục tiêu</span></button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  const contributions = goal.contributions || [];
  const deposits = contributions.filter(c => c.type !== 'withdrawal');
  const withdrawals = contributions.filter(c => c.type === 'withdrawal');
  const percentage = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;
  const remaining = goal.targetAmount - goal.currentAmount;
  const daysRemaining = Math.ceil((new Date(goal.deadline).getTime() - Date.now()) / 86400000);

  const getPredictedDate = () => {
    if (deposits.length < 2) return null;
    const sorted = [...deposits].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const totalDays = Math.ceil((new Date(sorted[0].date).getTime() - new Date(sorted[sorted.length - 1].date).getTime()) / 86400000);
    if (totalDays <= 0) return null;
    const avgPerDay = deposits.reduce((s, c) => s + c.amount, 0) / totalDays;
    if (avgPerDay <= 0) return null;
    const d = new Date(); d.setDate(d.getDate() + Math.ceil(remaining / avgPerDay));
    return d;
  };

  const predictedDate = getPredictedDate();
  const totalDepositAmount = deposits.reduce((s, c) => s + c.amount, 0);
  const totalWithdrawAmount = withdrawals.reduce((s, c) => s + Math.abs(c.amount), 0);
  const GoalIconComponent = goalIconMap[goal.icon];

  const filteredContribs = useMemo(() => {
    let list = [...contributions];
    if (contribFilter === 'deposit') list = list.filter(c => c.type !== 'withdrawal');
    if (contribFilter === 'withdrawal') list = list.filter(c => c.type === 'withdrawal');
    return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [contributions, contribFilter]);

  const chartData = useMemo(() => {
    if (contributions.length === 0) return [];
    const sorted = [...contributions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    let cum = 0;
    return sorted.map(c => { cum += c.amount; const d = new Date(c.date); return { date: `${d.getDate()}/${d.getMonth() + 1}`, cumulative: Math.max(0, cum) }; });
  }, [contributions]);

  const limitDesc = goal.withdrawalLimitType === 'percentage' ? `${goal.withdrawalLimitValue}% số dư/lần`
    : goal.withdrawalLimitType === 'amount' ? `${fmt(goal.withdrawalLimitValue || 0)}₫/lần` : 'Không giới hạn';

  const approvalDesc = goal.withdrawalApprovalEnabled ? `≥ ${fmt(goal.withdrawalApprovalThreshold || 0)}₫` : 'Tắt';

  const withdrawDisabled = goal.currentAmount <= 0 || locked;

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="max-w-4xl mx-auto p-4 md:p-6 pb-20 md:pb-6 space-y-6">
        {/* Header */}
        <div>
          <button onClick={handleBack} className="flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] mb-4 transition-colors"><ArrowLeft className="w-5 h-5" /><span className="font-medium">Quay lại</span></button>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-[var(--radius-lg)] flex items-center justify-center" style={{ backgroundColor: `${goal.color}20` }}>
                {GoalIconComponent ? <GoalIconComponent className="w-7 h-7" style={{ color: goal.color }} /> : <Target className="w-7 h-7" style={{ color: goal.color }} />}
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-[var(--text-primary)]">{goal.name}</h1>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className="text-sm text-[var(--text-secondary)]">{goal.priority === 'high' ? 'Ưu tiên cao' : goal.priority === 'medium' ? 'Ưu tiên TB' : 'Ưu tiên thấp'}</span>
                  {goal.autoContributeEnabled && <span className="inline-flex items-center gap-1 text-sm text-[var(--primary)]"><Zap className="w-3.5 h-3.5" /> Tự động</span>}
                  {locked && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[var(--danger-light)] text-[var(--danger)] text-xs font-medium"><Lock className="w-3 h-3" /> Khoá</span>}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button onClick={handleEdit} className="flex items-center gap-2 px-4 py-2.5 border border-[var(--border)] text-[var(--text-primary)] rounded-[var(--radius-lg)] font-medium hover:bg-[var(--surface)] transition-colors"><Edit2 className="w-4 h-4" /><span className="hidden md:inline">Chỉnh sửa</span></button>
              <button onClick={() => setDeleteModalOpen(true)} className="flex items-center gap-2 px-4 py-2.5 border border-[var(--danger)] text-[var(--danger)] rounded-[var(--radius-lg)] font-medium hover:bg-[var(--danger-light)] transition-colors"><Trash2 className="w-4 h-4" /><span className="hidden md:inline">Xoá</span></button>
            </div>
          </div>
        </div>

        {/* Lock Banner */}
        {locked && (
          <div className="flex items-center gap-3 p-4 rounded-[var(--radius-lg)] bg-[var(--danger-light)] border border-[var(--danger)]/20">
            <div className="w-10 h-10 bg-[var(--danger)] rounded-full flex items-center justify-center flex-shrink-0"><Lock className="w-5 h-5 text-white" /></div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-[var(--danger)]">Rút tiền đang bị khoá</p>
              <p className="text-xs text-[var(--text-secondary)]">{lockRemainingLabel(goal)} — đến {fmtDate(goal.withdrawalLockUntil!)}</p>
            </div>
            <button onClick={() => setShowUnlockModal(true)} className="px-3 py-1.5 text-xs font-medium text-[var(--danger)] border border-[var(--danger)] rounded-[var(--radius-md)] hover:bg-[var(--danger)]/10 transition-colors flex items-center gap-1">
              <Unlock className="w-3.5 h-3.5" /> Mở khoá
            </button>
          </div>
        )}

        {/* Progress Summary */}
        <Card className="bg-gradient-to-br from-[var(--primary)] to-[var(--primary-hover)] text-white">
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div><p className="text-sm text-white/80 mb-2">Đã tiết kiệm</p><p className="text-xl md:text-2xl font-bold tabular-nums">{fmt(goal.currentAmount)}₫</p></div>
              <div><p className="text-sm text-white/80 mb-2">Mục tiêu</p><p className="text-xl md:text-2xl font-bold tabular-nums">{fmt(goal.targetAmount)}₫</p></div>
              <div><p className="text-sm text-white/80 mb-2">Còn lại</p><p className="text-xl md:text-2xl font-bold tabular-nums">{fmt(Math.max(remaining, 0))}₫</p></div>
              {totalWithdrawAmount > 0 && <div><p className="text-sm text-white/80 mb-2">Đã rút</p><p className="text-xl md:text-2xl font-bold tabular-nums text-red-200">{fmt(totalWithdrawAmount)}₫</p></div>}
            </div>
            <div>
              <div className="flex items-center justify-between mb-2"><span className="text-sm text-white/80">Tiến độ</span><span className="text-sm font-semibold tabular-nums">{percentage.toFixed(1)}%</span></div>
              <div className="h-4 bg-white/20 rounded-full overflow-hidden"><div className="h-full bg-white rounded-full transition-all" style={{ width: `${Math.min(Math.max(percentage, 0), 100)}%` }} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/20">
              <div>
                <div className="flex items-center gap-1.5 mb-1"><Calendar className="w-4 h-4 text-white/80" /><span className="text-xs text-white/80">Ngày mục tiêu</span></div>
                <p className="text-sm font-semibold tabular-nums">{fmtDate(goal.deadline)}</p>
                <p className="text-xs text-white/80 mt-0.5">{daysRemaining > 0 ? `Còn ${daysRemaining} ngày` : 'Đã quá hạn'}</p>
              </div>
              <div>
                <div className="flex items-center gap-1.5 mb-1"><Sparkles className="w-4 h-4 text-white/80" /><span className="text-xs text-white/80">Dự kiến đạt</span></div>
                {predictedDate ? (<><p className="text-sm font-semibold tabular-nums">{fmtDate(predictedDate.toISOString())}</p><p className="text-xs text-white/80 mt-0.5">{predictedDate <= new Date(goal.deadline) ? '✓ Đúng tiến độ' : '⚠ Cần tăng tốc'}</p></>) : <p className="text-sm text-white/80">Chưa đủ dữ liệu</p>}
              </div>
            </div>
          </div>
        </Card>

        {/* Tabs */}
        <div className="flex border-b border-[var(--divider)]">
          {([{ value: 'contributions' as const, label: 'Đóng góp', count: contributions.length }, { value: 'insights' as const, label: 'Thông tin', count: null }]).map(tab => {
            const isActive = activeTab === tab.value;
            return <button key={tab.value} onClick={() => setActiveTab(tab.value)} className={`px-4 py-3 text-sm font-medium transition-colors relative ${isActive ? 'text-[var(--primary)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}>{tab.label} {tab.count !== null && `(${tab.count})`}{isActive && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--primary)]" />}</button>;
          })}
        </div>

        {/* ── Tab: Contributions ── */}
        {activeTab === 'contributions' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <button onClick={handleAddContribution} className="flex items-center justify-center gap-2 px-4 py-3 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white rounded-[var(--radius-lg)] font-medium transition-colors shadow-[var(--shadow-sm)]"><Plus className="w-5 h-5" /><span>Đóng góp</span></button>
              <button onClick={() => { if (locked) { toast.warning('Rút tiền đang bị khoá. Mở khoá để tiếp tục.'); return; } setShowWithdrawModal(true); }} disabled={withdrawDisabled}
                className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-[var(--danger)] text-[var(--danger)] rounded-[var(--radius-lg)] font-medium transition-colors hover:bg-[var(--danger-light)] disabled:opacity-40 disabled:cursor-not-allowed">
                {locked ? <Lock className="w-5 h-5" /> : <ArrowDownCircle className="w-5 h-5" />}<span>{locked ? 'Đã khoá' : 'Rút tiền'}</span>
              </button>
            </div>

            {contributions.length > 0 && (
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-md)] bg-[var(--success-light)] text-[var(--success)] text-xs font-medium"><TrendingUp className="w-3.5 h-3.5" />{deposits.length} đóng góp • {fmt(totalDepositAmount)}₫</span>
                {withdrawals.length > 0 && <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-md)] bg-[var(--danger-light)] text-[var(--danger)] text-xs font-medium"><TrendingDown className="w-3.5 h-3.5" />{withdrawals.length} rút tiền • {fmt(totalWithdrawAmount)}₫</span>}
              </div>
            )}

            {contributions.length > 0 && withdrawals.length > 0 && (
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-[var(--text-tertiary)]" />
                {([{ v: 'all' as const, label: 'Tất cả', count: contributions.length }, { v: 'deposit' as const, label: 'Đóng góp', count: deposits.length }, { v: 'withdrawal' as const, label: 'Rút tiền', count: withdrawals.length }]).map(f => (
                  <button key={f.v} onClick={() => setContribFilter(f.v)}
                    className={`px-3 py-1.5 rounded-[var(--radius-md)] text-xs font-medium border transition-colors ${contribFilter === f.v ? 'border-[var(--primary)] bg-[var(--primary-light)] text-[var(--primary)]' : 'border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--text-tertiary)]'}`}>
                    {f.label} ({f.count})
                  </button>
                ))}
              </div>
            )}

            {filteredContribs.length > 0 ? (
              <Card className="!p-0 overflow-hidden">
                <div className="px-4 pt-4 pb-2"><h3 className="font-semibold text-[var(--text-primary)]">{contribFilter === 'all' ? 'Lịch sử' : contribFilter === 'deposit' ? 'Lịch sử đóng góp' : 'Lịch sử rút tiền'} ({filteredContribs.length})</h3></div>
                <div>{filteredContribs.map(c => <ContributionItem key={c.id} contribution={c} onRemove={() => setContribToRemove(c)} />)}</div>
              </Card>
            ) : contributions.length > 0 ? (
              <Card><div className="text-center py-8"><p className="text-sm text-[var(--text-secondary)]">Không có {contribFilter === 'deposit' ? 'đóng góp' : 'bản ghi rút tiền'} nào</p></div></Card>
            ) : (
              <Card><div className="text-center py-8"><div className="w-14 h-14 bg-[var(--surface)] rounded-full flex items-center justify-center mx-auto mb-3"><Target className="w-7 h-7 text-[var(--text-tertiary)]" /></div><p className="text-sm text-[var(--text-secondary)] mb-1">Chưa có đóng góp nào</p><p className="text-xs text-[var(--text-tertiary)]">Thêm đóng góp đầu tiên để bắt đầu!</p></div></Card>
            )}
          </div>
        )}

        {/* ── Tab: Insights ── */}
        {activeTab === 'insights' && (
          <div className="space-y-4">
            {chartData.length >= 2 && (
              <Card>
                <h3 className="font-semibold text-[var(--text-primary)] mb-4">Biểu đồ tiến độ</h3>
                <div className="h-56 md:h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                      <defs><linearGradient id="goalGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={goal.color} stopOpacity={0.3} /><stop offset="95%" stopColor={goal.color} stopOpacity={0.05} /></linearGradient></defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--divider)" />
                      <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }} tickLine={false} axisLine={{ stroke: 'var(--divider)' }} />
                      <YAxis tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }} tickLine={false} axisLine={false} tickFormatter={(v: number) => v >= 1000000 ? `${(v / 1000000).toFixed(0)}tr` : `${(v / 1000).toFixed(0)}k`} width={45} />
                      <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', fontSize: 12 }} formatter={(v: number) => [`${fmt(v)}₫`, 'Tích luỹ']} labelFormatter={(l: string) => `Ngày ${l}`} />
                      <ReferenceLine y={goal.targetAmount} stroke="var(--success)" strokeDasharray="5 5" strokeWidth={1.5} label={{ value: 'Mục tiêu', position: 'right', fill: 'var(--success)', fontSize: 11 }} />
                      <Area type="monotone" dataKey="cumulative" stroke={goal.color} strokeWidth={2.5} fill="url(#goalGrad)" dot={{ r: 4, fill: goal.color, strokeWidth: 2, stroke: 'white' }} activeDot={{ r: 6 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-3 flex items-center justify-center gap-6 text-xs text-[var(--text-tertiary)]">
                  <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 rounded-full" style={{ backgroundColor: goal.color }} /> Tích luỹ</span>
                  <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 rounded-full bg-[var(--success)]" /> Mục tiêu: {fmt(goal.targetAmount)}₫</span>
                </div>
              </Card>
            )}
            {chartData.length < 2 && <Card className="bg-[var(--surface)]"><div className="text-center py-8"><TrendingUp className="w-10 h-10 text-[var(--text-tertiary)] mx-auto mb-3" /><p className="text-sm text-[var(--text-secondary)]">Thêm ít nhất 2 đóng góp để xem biểu đồ</p></div></Card>}

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card><div className="flex items-center gap-3 mb-2"><div className="w-10 h-10 bg-[var(--primary-light)] rounded-[var(--radius-lg)] flex items-center justify-center"><Target className="w-5 h-5 text-[var(--primary)]" /></div><p className="text-sm text-[var(--text-secondary)]">Tổng nạp</p></div><p className="text-2xl font-bold text-[var(--success)] tabular-nums">{fmt(totalDepositAmount)}₫</p><p className="text-xs text-[var(--text-tertiary)] mt-1">{deposits.length} lần</p></Card>
              <Card><div className="flex items-center gap-3 mb-2"><div className="w-10 h-10 bg-[var(--danger-light)] rounded-[var(--radius-lg)] flex items-center justify-center"><ArrowDownCircle className="w-5 h-5 text-[var(--danger)]" /></div><p className="text-sm text-[var(--text-secondary)]">Tổng rút</p></div><p className="text-2xl font-bold text-[var(--danger)] tabular-nums">{fmt(totalWithdrawAmount)}₫</p><p className="text-xs text-[var(--text-tertiary)] mt-1">{withdrawals.length} lần</p></Card>
              <Card><div className="flex items-center gap-3 mb-2"><div className="w-10 h-10 bg-[var(--warning-light)] rounded-[var(--radius-lg)] flex items-center justify-center"><Calendar className="w-5 h-5 text-[var(--warning)]" /></div><p className="text-sm text-[var(--text-secondary)]">Cần/tháng</p></div><p className="text-2xl font-bold text-[var(--text-primary)] tabular-nums">{daysRemaining > 0 && remaining > 0 ? `${fmt(Math.ceil(remaining / (daysRemaining / 30)))}₫` : '—'}</p></Card>
            </div>

            {/* ── Protection Settings ── */}
            <h3 className="font-semibold text-[var(--text-primary)] pt-2">Bảo vệ mục tiêu</h3>

            {/* Lock Mode */}
            <Card>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-[var(--radius-lg)] flex items-center justify-center ${locked ? 'bg-[var(--danger-light)]' : 'bg-[var(--surface)]'}`}>
                    {locked ? <Lock className="w-5 h-5 text-[var(--danger)]" /> : <Lock className="w-5 h-5 text-[var(--text-tertiary)]" />}
                  </div>
                  <div>
                    <h4 className="font-semibold text-[var(--text-primary)]">Khoá rút tiền</h4>
                    <p className="text-xs text-[var(--text-secondary)]">{locked ? `${lockRemainingLabel(goal)} — đến ${fmtDate(goal.withdrawalLockUntil!)}` : 'Chặn tất cả lệnh rút'}</p>
                  </div>
                </div>
                {locked ? (
                  <button type="button" onClick={() => setShowUnlockModal(true)} className="px-3 py-1.5 text-xs font-medium text-[var(--warning)] border border-[var(--warning)] rounded-[var(--radius-md)] hover:bg-[var(--warning-light)] transition-colors flex items-center gap-1"><Unlock className="w-3.5 h-3.5" /> Mở khoá</button>
                ) : (
                  <button type="button" onClick={() => setShowLockModal(true)} className="px-3 py-1.5 text-xs font-medium text-[var(--danger)] border border-[var(--danger)] rounded-[var(--radius-md)] hover:bg-[var(--danger-light)] transition-colors flex items-center gap-1"><Lock className="w-3.5 h-3.5" /> Khoá</button>
                )}
              </div>
            </Card>

            {/* Withdrawal Limit */}
            <Card>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[var(--warning-light)] rounded-[var(--radius-lg)] flex items-center justify-center"><Shield className="w-5 h-5 text-[var(--warning)]" /></div>
                  <div><h4 className="font-semibold text-[var(--text-primary)]">Giới hạn mỗi lần rút</h4><p className="text-xs text-[var(--text-secondary)]">{limitDesc}</p></div>
                </div>
                <button type="button" onClick={() => setShowLimitModal(true)} className="px-3 py-1.5 text-xs font-medium text-[var(--primary)] border border-[var(--primary)] rounded-[var(--radius-md)] hover:bg-[var(--primary-light)] transition-colors">Cài đặt</button>
              </div>
            </Card>

            {/* Approval Flow */}
            <Card>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-[var(--radius-lg)] flex items-center justify-center ${goal.withdrawalApprovalEnabled ? 'bg-[var(--primary-light)]' : 'bg-[var(--surface)]'}`}>
                    <ShieldAlert className={`w-5 h-5 ${goal.withdrawalApprovalEnabled ? 'text-[var(--primary)]' : 'text-[var(--text-tertiary)]'}`} />
                  </div>
                  <div><h4 className="font-semibold text-[var(--text-primary)]">Xác nhận rút lớn</h4><p className="text-xs text-[var(--text-secondary)]">{approvalDesc}</p></div>
                </div>
                <button type="button" onClick={() => setShowApprovalModal(true)} className="px-3 py-1.5 text-xs font-medium text-[var(--primary)] border border-[var(--primary)] rounded-[var(--radius-md)] hover:bg-[var(--primary-light)] transition-colors">Cài đặt</button>
              </div>
            </Card>

            {/* Auto-Contribute */}
            <Card>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[var(--primary-light)] rounded-[var(--radius-lg)] flex items-center justify-center"><Zap className="w-5 h-5 text-[var(--primary)]" /></div>
                  <div><h4 className="font-semibold text-[var(--text-primary)]">Đóng góp tự động</h4><p className="text-xs text-[var(--text-secondary)]">Tự động thêm đóng góp hàng tháng</p></div>
                </div>
                <button type="button" onClick={() => { if (goal.autoContributeEnabled) { updateGoal(goal.id, { autoContributeEnabled: false }); toast.info('Đã tắt đóng góp tự động'); } else { setShowAutoSetup(true); } }}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${goal.autoContributeEnabled ? 'bg-[var(--primary)]' : 'bg-[var(--border)]'}`}>
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${goal.autoContributeEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
              {goal.autoContributeEnabled && (
                <div className="space-y-2 pt-3 border-t border-[var(--divider)]">
                  <div className="grid grid-cols-2 gap-4">
                    <div><p className="text-xs text-[var(--text-secondary)] mb-1">Số tiền/tháng</p><p className="text-sm font-semibold text-[var(--text-primary)] tabular-nums">{fmt(goal.autoContributeAmount || 0)}₫</p></div>
                    <div><p className="text-xs text-[var(--text-secondary)] mb-1">Ngày</p><p className="text-sm font-semibold text-[var(--text-primary)]">Ngày {goal.autoContributeDay || 1}</p></div>
                  </div>
                  {goal.autoContributeAccountId && <div><p className="text-xs text-[var(--text-secondary)] mb-1">Từ tài khoản</p><p className="text-sm font-semibold text-[var(--text-primary)]">{accounts.find(a => a.id === goal.autoContributeAccountId)?.name || 'Chưa chọn'}</p></div>}
                  <button type="button" onClick={() => setShowAutoSetup(true)} className="text-xs text-[var(--primary)] hover:underline font-medium">Chỉnh sửa cài đặt</button>
                </div>
              )}
            </Card>

            {/* Insight cards */}
            <Card className="bg-[var(--info-light)] border-[var(--info)]">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-[var(--info)] rounded-full flex items-center justify-center flex-shrink-0"><span className="text-white text-lg">💡</span></div>
                <div className="flex-1">
                  <h4 className="font-semibold text-[var(--text-primary)] mb-1">Phân tích tiến độ</h4>
                  <p className="text-sm text-[var(--text-secondary)] mb-3">{predictedDate ? `Với tốc độ hiện tại, bạn đạt mục tiêu vào ${fmtDate(predictedDate.toISOString())}.` : 'Thêm đóng góp để xem dự đoán.'}</p>
                  {daysRemaining > 0 && remaining > 0 && <p className="text-sm text-[var(--text-secondary)]">Cần khoảng <span className="font-semibold text-[var(--text-primary)]">{fmt(Math.ceil(remaining / (daysRemaining / 30)))}₫/tháng</span> để đạt đúng hạn.</p>}
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* ── Modals ── */}
        <ConfirmationModal isOpen={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} onConfirm={() => { softDeleteGoal(goal.id); setDeleteModalOpen(false); nav.goGoals(); }} title="Xoá mục tiêu?" description={`Xoá "${goal.name}"? Có thể hoàn tác trong 6 giây.`} confirmLabel="Xoá" cancelLabel="Huỷ" isDangerous />
        <ConfirmationModal isOpen={!!contribToRemove} onClose={() => setContribToRemove(null)} onConfirm={() => { if (contribToRemove) handleRemoveContribution(contribToRemove); }} title={contribToRemove?.type === 'withdrawal' ? 'Xoá bản ghi rút tiền?' : 'Xoá đóng góp?'} description={contribToRemove?.type === 'withdrawal' ? `Xoá rút ${fmt(Math.abs(contribToRemove?.amount || 0))}₫? Tiền sẽ cộng lại. Hoàn tác 6 giây.` : `Xoá đóng góp ${fmt(Math.abs(contribToRemove?.amount || 0))}₫? Tiền sẽ bị trừ. Hoàn tác 6 giây.`} confirmLabel="Xoá" cancelLabel="Huỷ" isDangerous />

        <WithdrawModal isOpen={showWithdrawModal} onClose={() => setShowWithdrawModal(false)} goal={goal} onWithdraw={handleWithdraw} />
        <LockModal isOpen={showLockModal} onClose={() => setShowLockModal(false)} onLock={handleLock} />
        <UnlockModal isOpen={showUnlockModal} onClose={() => setShowUnlockModal(false)} onUnlock={handleUnlock} lockUntil={goal.withdrawalLockUntil || ''} />
        <AutoContributeModal isOpen={showAutoSetup} onClose={() => setShowAutoSetup(false)} goal={goal} accounts={accounts} onSave={s => { updateGoal(goal.id, { autoContributeEnabled: true, autoContributeAmount: s.amount, autoContributeDay: s.day, autoContributeAccountId: s.accountId }); toast.success('Đã bật đóng góp tự động'); setShowAutoSetup(false); }} />
        <WithdrawalLimitModal isOpen={showLimitModal} onClose={() => setShowLimitModal(false)} goal={goal} onSave={(type, value) => { updateGoal(goal.id, { withdrawalLimitType: type, withdrawalLimitValue: value }); toast.success(type === 'none' ? 'Đã tắt giới hạn rút tiền' : 'Đã cập nhật giới hạn'); setShowLimitModal(false); }} />
        <ApprovalSettingsModal isOpen={showApprovalModal} onClose={() => setShowApprovalModal(false)} goal={goal} onSave={(enabled, threshold) => { updateGoal(goal.id, { withdrawalApprovalEnabled: enabled, withdrawalApprovalThreshold: threshold }); toast.success(enabled ? 'Đã bật xác nhận rút lớn' : 'Đã tắt xác nhận rút lớn'); setShowApprovalModal(false); }} />
      </div>
    </div>
  );
}

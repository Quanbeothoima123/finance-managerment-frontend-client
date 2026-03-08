import React, { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router';
import { ChevronLeft, ArrowDown, Wallet, Building2, CreditCard, Banknote, AlertCircle } from 'lucide-react';
import { useDemoData } from '../contexts/DemoDataContext';
import { useToast } from '../contexts/ToastContext';
import { useAppNavigation } from '../hooks/useAppNavigation';
import { Button } from '../components/Button';
import { AmountInput, stripToDigits, formatWithDots } from '../components/AmountInput';
import { maskAccountNumber } from '../utils/accountHelpers';

const ACCOUNT_ICONS: Record<string, React.ComponentType<any>> = {
  building: Building2,
  wallet: Wallet,
  'credit-card': CreditCard,
  banknote: Banknote,
};

export default function AddTransfer() {
  const [searchParams] = useSearchParams();
  const { accounts, addTransaction, updateTransaction, categories, hideAccountNumbers, selectedCurrency } = useDemoData();
  const toast = useToast();
  const { goBack } = useAppNavigation();

  // Pre-fill from account from query params
  const prefilledFromAccountId = searchParams.get('fromAccountId');

  const [formData, setFormData] = useState({
    amount: '',
    fromAccountId: prefilledFromAccountId || '',
    toAccountId: '',
    serviceFee: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    notes: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const currencySymbol = selectedCurrency === 'VND' ? '₫' : selectedCurrency;

  // Parsed numeric values
  const numericAmount = useMemo(() => {
    const n = parseInt(stripToDigits(formData.amount), 10);
    return isNaN(n) ? 0 : n;
  }, [formData.amount]);

  const numericFee = useMemo(() => {
    const n = parseInt(stripToDigits(formData.serviceFee), 10);
    return isNaN(n) ? 0 : n;
  }, [formData.serviceFee]);

  const totalDeduction = numericAmount + numericFee;

  const fromAccount = accounts.find(a => a.id === formData.fromAccountId);
  const toAccount = accounts.find(a => a.id === formData.toAccountId);

  // Balance validation
  const insufficientBalance = fromAccount && numericAmount > 0 && totalDeduction > fromAccount.balance;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    const newErrors: Record<string, string> = {};
    
    if (!formData.amount || numericAmount <= 0) {
      newErrors.amount = 'Vui lòng nhập số tiền hợp lệ';
    }
    
    if (!formData.fromAccountId) {
      newErrors.fromAccountId = 'Vui lòng chọn tài khoản nguồn';
    }
    
    if (!formData.toAccountId) {
      newErrors.toAccountId = 'Vui lòng chọn tài khoản đích';
    }
    
    if (formData.fromAccountId === formData.toAccountId) {
      newErrors.toAccountId = 'Tài khoản đích phải khác tài khoản nguồn';
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'Vui lòng nhập mô tả';
    }
    
    if (!formData.date) {
      newErrors.date = 'Vui lòng chọn ngày';
    }

    if (insufficientBalance) {
      newErrors.balance = 'Số tiền đang có không đủ thực hiện giao dịch (bao gồm phí).';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    if (!fromAccount || !toAccount) {
      toast.error('Không tìm thấy tài khoản');
      return;
    }

    // Find "Phí giao dịch" category for fee expense
    const feeCategory = categories.find(c => c.name === 'Phí giao dịch' && c.type === 'expense');

    // Step 1: Create transfer transaction
    const transferTx = addTransaction({
      type: 'transfer',
      amount: numericAmount,
      category: 'Chuyển tiền',
      categoryId: '0',
      account: fromAccount.name,
      accountId: formData.fromAccountId,
      toAccount: toAccount.name,
      toAccountId: formData.toAccountId,
      serviceFee: numericFee > 0 ? numericFee : undefined,
      description: formData.description,
      date: formData.date,
      tags: [],
      notes: formData.notes,
    });

    // Step 2: If fee > 0, create linked expense transaction
    if (numericFee > 0) {
      const feeTx = addTransaction({
        type: 'expense',
        amount: -numericFee,
        category: feeCategory?.name || 'Phí giao dịch',
        categoryId: feeCategory?.id || 'cat-13',
        account: fromAccount.name,
        accountId: formData.fromAccountId,
        linkedTransactionId: transferTx.id,
        description: `Phí dịch vụ chuyển tiền đến ${toAccount.name}`,
        date: formData.date,
        tags: [],
        notes: `Tự động ghi nhận phí cho giao dịch chuyển khoản`,
      });

      // Step 3: Link back from transfer → fee
      updateTransaction(transferTx.id, { linkedTransactionId: feeTx.id });

      toast.success('Đã chuyển khoản & ghi nhận phí dịch vụ.');
    } else {
      toast.success('Chuyển tiền thành công');
    }

    goBack();
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
    // Clear balance error when amount or fee changes
    if (field === 'amount' || field === 'serviceFee' || field === 'fromAccountId') {
      setErrors(prev => ({ ...prev, balance: '' }));
    }
  };

  // Account picker card
  const AccountCard = ({
    acc,
    isSelected,
    onSelect,
  }: {
    acc: typeof accounts[0];
    isSelected: boolean;
    onSelect: () => void;
  }) => {
    const IconComp = ACCOUNT_ICONS[acc.icon] || Wallet;
    return (
      <button
        type="button"
        onClick={onSelect}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-[var(--radius-lg)] border transition-all text-left ${
          isSelected
            ? 'border-[var(--primary)] bg-[var(--primary-light)] shadow-sm ring-2 ring-[var(--primary)]/20'
            : 'border-[var(--border)] bg-[var(--input-background)] hover:border-[var(--text-tertiary)] hover:shadow-sm'
        }`}
      >
        <div
          className="w-10 h-10 rounded-[var(--radius-md)] flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: `${acc.color}20` }}
        >
          <IconComp className="w-5 h-5" style={{ color: acc.color }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-[var(--text-primary)] truncate">
            {acc.name}
          </p>
          <p className="text-xs text-[var(--text-tertiary)] truncate">
            {acc.accountNumber
              ? (hideAccountNumbers
                ? '••••••••'
                : maskAccountNumber(acc.accountNumber, acc.type))
              : acc.type === 'cash' ? 'Tiền mặt' : ''}
            {acc.accountOwnerName ? ` — ${acc.accountOwnerName}` : ''}
          </p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-sm font-semibold tabular-nums" style={{ color: acc.color }}>
            {new Intl.NumberFormat('vi-VN').format(acc.balance)} {currencySymbol}
          </p>
        </div>
      </button>
    );
  };

  const isSubmitDisabled = insufficientBalance || numericAmount <= 0;

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[var(--card)] border-b border-[var(--border)]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={goBack}
              className="p-2 -ml-2 rounded-[var(--radius-lg)] hover:bg-[var(--surface)] transition-colors"
            >
              <ChevronLeft className="w-6 h-6 text-[var(--text-primary)]" />
            </button>
            <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
              Chuyển tiền
            </h1>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-[var(--card)] rounded-[var(--radius-xl)] border border-[var(--border)] p-6 space-y-6">
          {/* Amount */}
          <div>
            <AmountInput
              id="amount"
              value={formData.amount}
              onChange={(value) => handleChange('amount', value)}
              error={errors.amount}
            />
          </div>

          {/* ── Vertical Transfer Flow ──────────────────── */}
          <div className="relative">
            {/* From Account */}
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                Từ tài khoản <span className="text-[var(--danger)]">*</span>
              </label>
              <div className="space-y-2">
                {accounts.map(acc => (
                  <AccountCard
                    key={acc.id}
                    acc={acc}
                    isSelected={formData.fromAccountId === acc.id}
                    onSelect={() => {
                      handleChange('fromAccountId', acc.id);
                      // Auto-swap if same as toAccount
                      if (formData.toAccountId === acc.id) {
                        handleChange('toAccountId', '');
                      }
                    }}
                  />
                ))}
              </div>
              {errors.fromAccountId && (
                <p className="mt-1 text-sm text-[var(--danger)]">{errors.fromAccountId}</p>
              )}
              {/* Insufficient balance error */}
              {insufficientBalance && (
                <div className="mt-2 flex items-start gap-2 p-3 bg-[var(--danger-light)] border border-[var(--danger)]/30 rounded-[var(--radius-lg)]">
                  <AlertCircle className="w-4 h-4 text-[var(--danger)] flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-[var(--danger)] font-medium">
                      Số tiền đang có không đủ thực hiện giao dịch (bao gồm phí).
                    </p>
                    <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                      Cần: {new Intl.NumberFormat('vi-VN').format(totalDeduction)} {currencySymbol} — 
                      Có: {new Intl.NumberFormat('vi-VN').format(fromAccount?.balance || 0)} {currencySymbol}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* ── Connector: Down Arrow ──────────────────── */}
            <div className="flex justify-center py-3">
              <div className="relative">
                {/* Vertical line above */}
                <div className="absolute left-1/2 -translate-x-1/2 -top-3 w-px h-3 bg-[var(--border)]" />
                {/* Circle with arrow */}
                <div className="w-10 h-10 rounded-full bg-[var(--info-light)] border-2 border-[var(--info)]/30 flex items-center justify-center shadow-sm">
                  <ArrowDown className="w-5 h-5 text-[var(--info)]" />
                </div>
                {/* Vertical line below */}
                <div className="absolute left-1/2 -translate-x-1/2 -bottom-3 w-px h-3 bg-[var(--border)]" />
              </div>
            </div>

            {/* To Account */}
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                Đến tài khoản <span className="text-[var(--danger)]">*</span>
              </label>
              <div className="space-y-2">
                {accounts
                  .filter(acc => acc.id !== formData.fromAccountId)
                  .map(acc => (
                    <AccountCard
                      key={acc.id}
                      acc={acc}
                      isSelected={formData.toAccountId === acc.id}
                      onSelect={() => handleChange('toAccountId', acc.id)}
                    />
                  ))}
              </div>
              {errors.toAccountId && (
                <p className="mt-1 text-sm text-[var(--danger)]">{errors.toAccountId}</p>
              )}
            </div>
          </div>

          {/* ── Service Fee ──────────────────────────────── */}
          <div>
            <label htmlFor="serviceFee" className="block text-sm font-medium text-[var(--text-primary)] mb-2">
              Phí dịch vụ
            </label>
            <div className="relative">
              <input
                type="text"
                inputMode="numeric"
                id="serviceFee"
                value={formData.serviceFee ? formatWithDots(formData.serviceFee) : ''}
                onChange={(e) => {
                  const digits = stripToDigits(e.target.value);
                  if (digits.length > 12) return;
                  const cleaned = digits.replace(/^0+/, '') || (digits.length > 0 ? '0' : '');
                  handleChange('serviceFee', cleaned === '0' && digits === '' ? '' : cleaned);
                }}
                placeholder="Nhập phí (nếu có)"
                autoComplete="off"
                className="w-full px-4 py-3 pr-16 bg-[var(--input-background)] border border-[var(--border)] rounded-[var(--radius-lg)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)] tabular-nums"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-[var(--text-secondary)] pointer-events-none select-none">
                {currencySymbol}
              </div>
            </div>
            {numericFee > 0 && (
              <p className="mt-1 text-xs text-[var(--text-tertiary)]">
                Phí sẽ trừ thêm từ tài khoản nguồn. Tổng trừ: {new Intl.NumberFormat('vi-VN').format(totalDeduction)} {currencySymbol}
              </p>
            )}
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-[var(--text-primary)] mb-2">
              Mô tả <span className="text-[var(--danger)]">*</span>
            </label>
            <input
              type="text"
              id="description"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Nhập mô tả chuyển tiền"
              className={`w-full px-4 py-3 bg-[var(--input-background)] border rounded-[var(--radius-lg)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)] ${
                errors.description ? 'border-[var(--danger)]' : 'border-[var(--border)]'
              }`}
            />
            {errors.description && (
              <p className="mt-1 text-sm text-[var(--danger)]">{errors.description}</p>
            )}
          </div>

          {/* Date */}
          <div>
            <label htmlFor="date" className="block text-sm font-medium text-[var(--text-primary)] mb-2">
              Ngày <span className="text-[var(--danger)]">*</span>
            </label>
            <input
              type="date"
              id="date"
              value={formData.date}
              onChange={(e) => handleChange('date', e.target.value)}
              className={`w-full px-4 py-3 bg-[var(--input-background)] border rounded-[var(--radius-lg)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)] ${
                errors.date ? 'border-[var(--danger)]' : 'border-[var(--border)]'
              }`}
            />
            {errors.date && (
              <p className="mt-1 text-sm text-[var(--danger)]">{errors.date}</p>
            )}
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-[var(--text-primary)] mb-2">
              Ghi chú
            </label>
            <textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              placeholder="Thêm ghi chú (tùy chọn)"
              rows={3}
              className="w-full px-4 py-3 bg-[var(--input-background)] border border-[var(--border)] rounded-[var(--radius-lg)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)] resize-none"
            />
          </div>

          {/* Preview */}
          {numericAmount > 0 && fromAccount && toAccount && (
            <div className="p-4 bg-[var(--info-light)] rounded-[var(--radius-lg)] space-y-2">
              <div className="text-sm text-[var(--text-secondary)] mb-1">Xem trước</div>
              <div className="text-[var(--text-primary)]">
                Chuyển <span className="font-semibold">
                  {new Intl.NumberFormat('vi-VN').format(numericAmount)} {currencySymbol}
                </span>
                {' '}từ <span className="font-semibold">{fromAccount.name}</span> sang <span className="font-semibold">{toAccount.name}</span>
              </div>
              {numericFee > 0 && (
                <div className="text-sm text-[var(--text-secondary)]">
                  Phí dịch vụ: <span className="font-semibold text-[var(--warning)]">
                    {new Intl.NumberFormat('vi-VN').format(numericFee)} {currencySymbol}
                  </span>
                  <span className="text-xs italic ml-1">(ghi nhận riêng dưới dạng Chi tiêu &quot;Phí giao dịch&quot;)</span>
                </div>
              )}
              <div className="pt-2 border-t border-[var(--border)] mt-2">
                <div className="flex justify-between text-xs text-[var(--text-secondary)]">
                  <span>{fromAccount.name} giảm:</span>
                  <span className="font-semibold text-[var(--danger)]">
                    -{new Intl.NumberFormat('vi-VN').format(totalDeduction)} {currencySymbol}
                  </span>
                </div>
                <div className="flex justify-between text-xs text-[var(--text-secondary)] mt-1">
                  <span>{toAccount.name} tăng:</span>
                  <span className="font-semibold text-[var(--success)]">
                    +{new Intl.NumberFormat('vi-VN').format(numericAmount)} {currencySymbol}
                  </span>
                </div>
                {numericFee > 0 && (
                  <div className="flex justify-between text-xs text-[var(--text-tertiary)] mt-1 italic">
                    <span>Phí (ghi nhận Chi tiêu):</span>
                    <span>
                      -{new Intl.NumberFormat('vi-VN').format(numericFee)} {currencySymbol}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="mt-6 grid grid-cols-2 gap-3">
          <Button type="button" variant="secondary" onClick={goBack}>
            Hủy
          </Button>
          <Button type="submit" variant="primary" disabled={isSubmitDisabled}>
            Chuyển tiền
          </Button>
        </div>
      </form>
    </div>
  );
}
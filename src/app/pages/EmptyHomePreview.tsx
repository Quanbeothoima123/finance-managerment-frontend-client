import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import {
  Plus,
  ChevronDown,
  Eye,
  EyeOff,
  Sparkles,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  ArrowDown,
  Wallet,
  Building2,
  CreditCard,
  Banknote,
  Receipt,
  X,
  ChevronRight,
  Lightbulb,
  FileText,
  Store,
  TrendingUp,
  TrendingDown,
  AlertCircle,
} from 'lucide-react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { AmountInput, stripToDigits, formatWithDots } from '../components/AmountInput';
import { useDemoData, type Transaction } from '../contexts/DemoDataContext';
import { useToast } from '../contexts/ToastContext';
import { useAppNavigation } from '../hooks/useAppNavigation';
import { maskAccountNumber } from '../utils/accountHelpers';

type QuickAddTab = 'expense' | 'income' | 'transfer';

const ACCOUNT_ICONS: Record<string, React.ComponentType<any>> = {
  building: Building2,
  wallet: Wallet,
  'credit-card': CreditCard,
  banknote: Banknote,
};

// Today's date for this demo
const TODAY = '2026-03-04';

export default function EmptyHomePreview() {
  const {
    accounts,
    categories,
    merchants,
    hideAccountNumbers,
    selectedCurrency,
    addTransaction,
    updateTransaction,
  } = useDemoData();
  const toast = useToast();
  const {
    goCreateTransaction,
    goCreateTransfer,
    goAccountDetail,
    goAccounts,
    goTransactionDetail,
  } = useAppNavigation();

  // Privacy toggle
  const [privacyOn, setPrivacyOn] = useState(false);

  // Quick Add Bottom Sheet
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetTab, setSheetTab] = useState<QuickAddTab>('expense');

  // Quick Add form state
  const [qaAmount, setQaAmount] = useState('');
  const [qaAccountId, setQaAccountId] = useState('');
  const [qaToAccountId, setQaToAccountId] = useState('');
  const [qaCategoryId, setQaCategoryId] = useState('');
  const [qaNote, setQaNote] = useState('');
  const [qaMerchantId, setQaMerchantId] = useState('');
  const [qaServiceFee, setQaServiceFee] = useState('');

  // Last used account (persisted across sheet opens in this session)
  const [lastUsedAccountId, setLastUsedAccountId] = useState('');

  // Quick entry guide
  const [showGuide, setShowGuide] = useState(false);

  // Locally-added transactions (for demo transition from empty → list)
  const [localTransactions, setLocalTransactions] = useState<Transaction[]>([]);

  // AmountInput auto-focus ref
  const amountInputRef = useRef<HTMLInputElement>(null);

  // ── Computed values ──────────────────────────────────────────────
  const totalBalance = useMemo(
    () => accounts.reduce((s, a) => s + a.balance, 0),
    [accounts]
  );

  const cashAccount = useMemo(
    () => accounts.find((a) => a.type === 'cash' && a.name === 'Tiền mặt'),
    [accounts]
  );

  const defaultExpenseCategory = useMemo(
    () => categories.find((c) => c.name === 'Ăn uống' && c.type === 'expense'),
    [categories]
  );

  const expenseCategories = useMemo(
    () => categories.filter((c) => c.type === 'expense').slice(0, 6),
    [categories]
  );
  const incomeCategories = useMemo(
    () => categories.filter((c) => c.type === 'income').slice(0, 6),
    [categories]
  );

  // Income/Expense totals from locally-added transactions
  const localIncome = useMemo(
    () =>
      localTransactions
        .filter((t) => t.type === 'income')
        .reduce((s, t) => s + t.amount, 0),
    [localTransactions]
  );
  const localExpense = useMemo(
    () =>
      localTransactions
        .filter((t) => t.type === 'expense')
        .reduce((s, t) => s + Math.abs(t.amount), 0),
    [localTransactions]
  );

  const formatCurrency = (amount: number) => {
    if (privacyOn) return '•••••';
    return new Intl.NumberFormat('vi-VN').format(amount);
  };

  const currencySymbol = selectedCurrency === 'VND' ? '₫' : selectedCurrency;

  // ── Auto-focus AmountInput when sheet opens ─────────────────────
  useEffect(() => {
    if (sheetOpen) {
      // Small delay to let DOM paint the sheet
      const timer = setTimeout(() => {
        amountInputRef.current?.focus();
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [sheetOpen]);

  // ── Resolve default account ID ──────────────────────────────────
  const getDefaultAccountId = useCallback(() => {
    // Priority: last used → Tiền mặt → first account
    if (lastUsedAccountId && accounts.some((a) => a.id === lastUsedAccountId)) {
      return lastUsedAccountId;
    }
    if (cashAccount) return cashAccount.id;
    return accounts[0]?.id || '';
  }, [lastUsedAccountId, cashAccount, accounts]);

  const getSecondAccountId = useCallback(
    (fromId: string) => {
      const other = accounts.find((a) => a.id !== fromId);
      return other?.id || '';
    },
    [accounts]
  );

  // ── Quick Add handlers ──────────────────────────────────────────
  const openSheet = (tab: QuickAddTab) => {
    const defaultAcc = getDefaultAccountId();
    setSheetTab(tab);
    setQaAmount('');
    setQaNote('');
    setQaMerchantId('');
    setQaServiceFee('');
    setQaAccountId(defaultAcc);
    setQaToAccountId(getSecondAccountId(defaultAcc));

    // Auto-default category: Ăn uống for expense, first income cat for income
    if (tab === 'expense') {
      setQaCategoryId(defaultExpenseCategory?.id || '');
    } else if (tab === 'income') {
      const firstIncome = incomeCategories[0];
      setQaCategoryId(firstIncome?.id || '');
    } else {
      setQaCategoryId('');
    }

    setSheetOpen(true);
  };

  // Validation
  const numericAmount = parseInt(stripToDigits(qaAmount), 10) || 0;
  const numericServiceFee = parseInt(stripToDigits(qaServiceFee), 10) || 0;
  const totalTransferDeduction = numericAmount + numericServiceFee;
  const qaFromAccount = accounts.find((a) => a.id === qaAccountId);
  const transferError =
    sheetTab === 'transfer' && qaAccountId === qaToAccountId;
  const amountInvalid = numericAmount <= 0;
  const categoryMissing = sheetTab !== 'transfer' && !qaCategoryId;
  const insufficientBalance =
    sheetTab === 'transfer' &&
    qaFromAccount &&
    numericAmount > 0 &&
    totalTransferDeduction > qaFromAccount.balance;

  const saveDisabled = amountInvalid || transferError || categoryMissing || !!insufficientBalance;

  const handleQuickSave = () => {
    if (saveDisabled) return;

    const account = accounts.find((a) => a.id === qaAccountId);
    const catObj = categories.find((c) => c.id === qaCategoryId);
    const merchantObj = merchants.find((m) => m.id === qaMerchantId);

    let newTx: Transaction;

    if (sheetTab === 'transfer') {
      const toAccount = accounts.find((a) => a.id === qaToAccountId);
      const feeCategory = categories.find(c => c.name === 'Phí giao dịch' && c.type === 'expense');

      // Step 1: Create transfer
      newTx = addTransaction({
        type: 'transfer',
        amount: numericAmount,
        category: 'Chuyển khoản',
        categoryId: '',
        account: account?.name || '',
        accountId: qaAccountId,
        toAccount: toAccount?.name || '',
        toAccountId: qaToAccountId,
        serviceFee: numericServiceFee > 0 ? numericServiceFee : undefined,
        description: qaNote || `Chuyển tiền → ${toAccount?.name}`,
        date: TODAY,
        tags: [],
      });

      // Step 2: If fee > 0, create linked expense
      if (numericServiceFee > 0) {
        const feeTx = addTransaction({
          type: 'expense',
          amount: -numericServiceFee,
          category: feeCategory?.name || 'Phí giao dịch',
          categoryId: feeCategory?.id || 'cat-13',
          account: account?.name || '',
          accountId: qaAccountId,
          linkedTransactionId: newTx.id,
          description: `Phí dịch vụ chuyển tiền đến ${toAccount?.name}`,
          date: TODAY,
          tags: [],
          notes: 'Tự động ghi nhận phí cho giao dịch chuyển khoản',
        });

        // Step 3: Link back from transfer → fee
        updateTransaction(newTx.id, { linkedTransactionId: feeTx.id });

        // Also add fee to local list for demo
        setLocalTransactions((prev) => [feeTx, ...prev]);
      }
    } else {
      newTx = addTransaction({
        type: sheetTab,
        amount: sheetTab === 'expense' ? -numericAmount : numericAmount,
        category: catObj?.name || '',
        categoryId: qaCategoryId,
        account: account?.name || '',
        accountId: qaAccountId,
        merchant: merchantObj?.name,
        merchantId: merchantObj?.id,
        description:
          qaNote ||
          merchantObj?.name ||
          (sheetTab === 'expense' ? 'Chi tiêu' : 'Thu nhập'),
        date: TODAY,
        tags: [],
      });
    }

    // Remember last used account
    setLastUsedAccountId(qaAccountId);

    // Add to local list for demo transition
    setLocalTransactions((prev) => [newTx, ...prev]);

    if (sheetTab === 'transfer' && numericServiceFee > 0) {
      toast.success('Đã chuyển khoản & ghi nhận phí dịch vụ.');
    } else {
      toast.success('Đã lưu giao dịch');
    }
    setSheetOpen(false);
  };

  const openFullForm = () => {
    setSheetOpen(false);
    if (sheetTab === 'transfer') {
      goCreateTransfer();
    } else {
      goCreateTransaction();
    }
  };

  // ── Account picker item renderer ────────────────────────────────
  const renderAccountOption = (acc: (typeof accounts)[0]) => {
    const parts: string[] = [acc.name];
    if (acc.accountNumber) {
      parts.push(
        hideAccountNumbers
          ? '••••'
          : maskAccountNumber(acc.accountNumber, acc.type)
      );
    }
    if (acc.accountOwnerName) {
      parts.push(acc.accountOwnerName);
    }
    return `${parts.join(' • ')} — ${new Intl.NumberFormat('vi-VN').format(acc.balance)} ${currencySymbol}`;
  };

  // ── Render ──────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[var(--background)] relative">
      <div className="max-w-2xl mx-auto p-4 md:p-6 space-y-5 pb-24 md:pb-6">
        {/* ── Top App Bar ─────────────────────────────── */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* App icon */}
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--primary-hover)] flex items-center justify-center">
              <Wallet className="w-4 h-4 text-white" />
            </div>
            {/* Month selector */}
            <button className="flex items-center gap-1 px-3 py-1.5 bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-lg)] text-sm font-medium text-[var(--text-primary)]">
              Tháng 3, 2026
              <ChevronDown className="w-4 h-4 text-[var(--text-tertiary)]" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPrivacyOn(!privacyOn)}
              className="p-2 rounded-[var(--radius-md)] hover:bg-[var(--surface)] transition-colors"
              title={privacyOn ? 'Hiện số dư' : 'Ẩn số dư'}
            >
              {privacyOn ? (
                <EyeOff className="w-5 h-5 text-[var(--text-secondary)]" />
              ) : (
                <Eye className="w-5 h-5 text-[var(--text-secondary)]" />
              )}
            </button>
          </div>
        </div>

        {/* ── Demo Badge ──────────────────────────────── */}
        <div className="bg-[var(--info-light)] border border-[var(--info)] rounded-[var(--radius-lg)] px-4 py-2.5 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[var(--info)] flex-shrink-0" />
          <span className="text-sm text-[var(--info)]">
            Demo: First Run Empty State + Quick Add 3–5 giây
          </span>
        </div>

        {/* ── Card A: Balance Overview ────────────────── */}
        <Card>
          <div className="text-center mb-4">
            <p className="text-sm text-[var(--text-secondary)] mb-1">
              Tổng số dư
            </p>
            <p className="text-3xl font-semibold text-[var(--text-primary)] tabular-nums">
              {formatCurrency(totalBalance)}{' '}
              {!privacyOn && currencySymbol}
            </p>
            <p className="text-xs text-[var(--text-tertiary)] mt-1">
              {accounts.length} ví đang hoạt động
            </p>
          </div>

          {/* Mini Metrics */}
          <div className="grid grid-cols-3 gap-3">
            {[
              {
                label: 'Thu',
                amount: localIncome,
                color: 'var(--success)',
                icon: ArrowDownLeft,
              },
              {
                label: 'Chi',
                amount: localExpense,
                color: 'var(--danger)',
                icon: ArrowUpRight,
              },
              {
                label: 'Chênh lệch',
                amount: localIncome - localExpense,
                color: 'var(--text-secondary)',
                icon: ArrowLeftRight,
              },
            ].map((m) => {
              const Icon = m.icon;
              return (
                <div
                  key={m.label}
                  className="flex flex-col items-center gap-1 py-2 px-1 bg-[var(--background)] rounded-[var(--radius-md)]"
                >
                  <div className="flex items-center gap-1">
                    <Icon
                      className="w-3.5 h-3.5"
                      style={{ color: m.color }}
                    />
                    <span className="text-xs text-[var(--text-secondary)]">
                      {m.label}
                    </span>
                  </div>
                  <span
                    className="text-sm font-semibold tabular-nums"
                    style={{ color: m.color }}
                  >
                    {privacyOn
                      ? '•••'
                      : `${new Intl.NumberFormat('vi-VN').format(m.amount)} ${currencySymbol}`}
                  </span>
                </div>
              );
            })}
          </div>
        </Card>

        {/* ── Card B: Quick Actions ───────────────────── */}
        <Card>
          <p className="text-sm font-medium text-[var(--text-primary)] mb-3">
            Nhập nhanh
          </p>

          {/* Action Buttons */}
          <div className="grid grid-cols-3 gap-2 mb-3">
            <button
              onClick={() => openSheet('expense')}
              className="flex items-center justify-center gap-1.5 py-2.5 rounded-[var(--radius-lg)] bg-[var(--danger-light)] text-[var(--danger)] font-medium text-sm hover:opacity-80 transition-opacity"
            >
              <Plus className="w-4 h-4" />
              Chi tiêu
            </button>
            <button
              onClick={() => openSheet('income')}
              className="flex items-center justify-center gap-1.5 py-2.5 rounded-[var(--radius-lg)] bg-[var(--success-light)] text-[var(--success)] font-medium text-sm hover:opacity-80 transition-opacity"
            >
              <Plus className="w-4 h-4" />
              Thu nhập
            </button>
            <button
              onClick={() => openSheet('transfer')}
              className="flex items-center justify-center gap-1.5 py-2.5 rounded-[var(--radius-lg)] bg-[var(--primary-light)] text-[var(--primary)] font-medium text-sm hover:opacity-80 transition-opacity"
            >
              <ArrowLeftRight className="w-4 h-4" />
              Chuyển
            </button>
          </div>

          {/* Quick Input Bar */}
          <button
            onClick={() => openSheet('expense')}
            className="w-full flex items-center gap-3 px-4 py-2.5 bg-[var(--background)] border border-[var(--border)] rounded-[var(--radius-lg)] text-left hover:border-[var(--primary)] transition-colors"
          >
            <Sparkles className="w-4 h-4 text-[var(--warning)] flex-shrink-0" />
            <span className="text-sm text-[var(--text-tertiary)]">
              VD: cafe 45k momo
            </span>
          </button>
        </Card>

        {/* ── Section: Accounts Preview ───────────────── */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-[var(--text-primary)]">
              Tài khoản
            </p>
            <button
              onClick={goAccounts}
              className="text-xs text-[var(--primary)] hover:text-[var(--primary-hover)] font-medium flex items-center gap-0.5"
            >
              Xem tất cả <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
            {accounts.map((acc) => {
              const IconComp = ACCOUNT_ICONS[acc.icon] || Wallet;
              return (
                <button
                  key={acc.id}
                  onClick={() => goAccountDetail(acc.id)}
                  className="flex-shrink-0 flex items-center gap-3 px-4 py-3 bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-lg)] hover:shadow-[var(--shadow-md)] transition-shadow min-w-[200px]"
                >
                  <div
                    className="w-9 h-9 rounded-[var(--radius-md)] flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${acc.color}20` }}
                  >
                    <IconComp
                      className="w-4.5 h-4.5"
                      style={{ color: acc.color }}
                    />
                  </div>
                  <div className="text-left min-w-0">
                    <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                      {acc.name}
                    </p>
                    <p className="text-xs text-[var(--text-tertiary)] truncate">
                      {acc.accountNumber
                        ? hideAccountNumbers
                          ? '••••••••'
                          : maskAccountNumber(acc.accountNumber, acc.type)
                        : acc.type === 'cash'
                          ? 'Tiền mặt'
                          : ''}
                    </p>
                    <p
                      className="text-xs font-semibold tabular-nums mt-0.5"
                      style={{ color: acc.color }}
                    >
                      {formatCurrency(acc.balance)}{' '}
                      {!privacyOn && currencySymbol}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Transaction List Section ─────────────────── */}
        <div>
          <p className="text-sm font-medium text-[var(--text-primary)] mb-4">
            Giao dịch gần đây
          </p>

          {localTransactions.length === 0 ? (
            /* ── Empty State ─────────────────────────── */
            <Card className="flex flex-col items-center justify-center py-10 text-center">
              <div className="w-20 h-20 mb-4 bg-[var(--surface)] rounded-full flex items-center justify-center">
                <Receipt className="w-10 h-10 text-[var(--text-tertiary)]" />
              </div>
              <p className="font-medium text-[var(--text-primary)] mb-1">
                Chưa có giao dịch nào.
              </p>
              <p className="text-sm text-[var(--text-secondary)] max-w-xs mb-5">
                Thêm giao dịch đầu tiên để app bắt đầu thống kê.
              </p>

              <Button
                variant="primary"
                onClick={() => openSheet('expense')}
                className="mb-3"
              >
                <Plus className="w-4 h-4" />
                Thêm giao dịch đầu tiên
              </Button>

              <button
                onClick={() => setShowGuide(!showGuide)}
                className="text-sm text-[var(--primary)] hover:text-[var(--primary-hover)] font-medium flex items-center gap-1"
              >
                <Lightbulb className="w-3.5 h-3.5" />
                Xem hướng dẫn nhập nhanh
              </button>

              {showGuide && (
                <div className="mt-4 w-full bg-[var(--background)] rounded-[var(--radius-lg)] p-4 text-left">
                  <p className="text-xs font-medium text-[var(--text-primary)] mb-2">
                    Ví dụ nhập nhanh:
                  </p>
                  <div className="space-y-1.5 text-xs text-[var(--text-secondary)]">
                    <p>
                      <span className="font-mono bg-[var(--surface)] px-1.5 py-0.5 rounded">
                        cafe 45k momo
                      </span>{' '}
                      → Chi 45.000₫ từ MoMo, danh mục Ăn uống
                    </p>
                    <p>
                      <span className="font-mono bg-[var(--surface)] px-1.5 py-0.5 rounded">
                        lunch 80k cash
                      </span>{' '}
                      → Chi 80.000₫ tiền mặt
                    </p>
                    <p>
                      <span className="font-mono bg-[var(--surface)] px-1.5 py-0.5 rounded">
                        grab 35k
                      </span>{' '}
                      → Chi 35.000₫ di chuyển
                    </p>
                  </div>
                </div>
              )}
            </Card>
          ) : (
            /* ── Transaction List (after adding) ─────── */
            <div className="space-y-2">
              {localTransactions.map((tx) => {
                const isIncome = tx.type === 'income';
                const isTransfer = tx.type === 'transfer';
                return (
                  <Card
                    key={tx.id}
                    onClick={() => goTransactionDetail(tx.id)}
                    className="cursor-pointer hover:shadow-[var(--shadow-lg)] transition-shadow"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex-shrink-0 w-10 h-10 rounded-[var(--radius-lg)] flex items-center justify-center ${
                          isTransfer
                            ? 'bg-[var(--primary-light)] text-[var(--primary)]'
                            : isIncome
                              ? 'bg-[var(--success-light)] text-[var(--success)]'
                              : 'bg-[var(--danger-light)] text-[var(--danger)]'
                        }`}
                      >
                        {isTransfer ? (
                          <ArrowLeftRight className="w-5 h-5" />
                        ) : isIncome ? (
                          <TrendingUp className="w-5 h-5" />
                        ) : (
                          <TrendingDown className="w-5 h-5" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                          {tx.description}
                        </p>
                        <p className="text-xs text-[var(--text-secondary)]">
                          {tx.category || tx.type === 'transfer'
                            ? tx.category
                            : ''}{' '}
                          {tx.category && tx.account ? '•' : ''} {tx.account}
                          {isTransfer && tx.toAccount
                            ? ` → ${tx.toAccount}`
                            : ''}
                        </p>
                      </div>
                      <span
                        className={`text-sm font-semibold tabular-nums flex-shrink-0 ${
                          isTransfer
                            ? 'text-[var(--primary)]'
                            : isIncome
                              ? 'text-[var(--success)]'
                              : 'text-[var(--danger)]'
                        }`}
                      >
                        {isIncome ? '+' : isTransfer ? '' : '-'}
                        {privacyOn
                          ? '•••••'
                          : `${new Intl.NumberFormat('vi-VN').format(Math.abs(tx.amount))}${currencySymbol}`}
                      </span>
                    </div>
                  </Card>
                );
              })}

              {/* CTA for more */}
              <button
                onClick={() => openSheet('expense')}
                className="w-full py-3 text-sm font-medium text-[var(--primary)] hover:text-[var(--primary-hover)] flex items-center justify-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                Thêm giao dịch khác
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── FAB ────────────────────────────────────────── */}
      <button
        onClick={() => openSheet('expense')}
        className="fixed bottom-20 md:bottom-8 right-4 md:right-8 w-14 h-14 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white rounded-full shadow-[var(--shadow-lg)] flex items-center justify-center transition-all hover:scale-105 z-30"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* ── Quick Add Bottom Sheet ─────────────────────── */}
      {sheetOpen && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in"
            onClick={() => setSheetOpen(false)}
          />

          {/* Sheet */}
          <div className="relative w-full max-w-lg bg-[var(--card)] rounded-t-[var(--radius-xl)] md:rounded-[var(--radius-xl)] shadow-[var(--shadow-2xl)] border border-[var(--border)] max-h-[85vh] overflow-y-auto animate-slide-up">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-[var(--divider)] sticky top-0 bg-[var(--card)] z-10">
              <h3 className="font-semibold text-[var(--text-primary)]">
                Nhập nhanh
              </h3>
              <button
                onClick={() => setSheetOpen(false)}
                className="p-1.5 rounded-[var(--radius-md)] hover:bg-[var(--surface)] transition-colors"
              >
                <X className="w-5 h-5 text-[var(--text-secondary)]" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-[var(--divider)] sticky top-[52px] bg-[var(--card)] z-10">
              {(
                [
                  {
                    key: 'expense' as QuickAddTab,
                    label: 'Chi tiêu',
                    color: 'var(--danger)',
                  },
                  {
                    key: 'income' as QuickAddTab,
                    label: 'Thu nhập',
                    color: 'var(--success)',
                  },
                  {
                    key: 'transfer' as QuickAddTab,
                    label: 'Chuyển khoản',
                    color: 'var(--primary)',
                  },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => {
                    setSheetTab(tab.key);
                    if (tab.key === 'expense') {
                      setQaCategoryId(defaultExpenseCategory?.id || '');
                    } else if (tab.key === 'income') {
                      setQaCategoryId(incomeCategories[0]?.id || '');
                    } else {
                      setQaCategoryId('');
                    }
                    setQaMerchantId('');
                  }}
                  className={`flex-1 py-2.5 text-sm font-medium transition-colors relative ${
                    sheetTab === tab.key
                      ? 'text-[var(--text-primary)]'
                      : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
                  }`}
                >
                  {tab.label}
                  {sheetTab === tab.key && (
                    <span
                      className="absolute bottom-0 left-1/4 right-1/4 h-0.5 rounded-full"
                      style={{ backgroundColor: tab.color }}
                    />
                  )}
                </button>
              ))}
            </div>

            {/* Form */}
            <div className="p-5 space-y-4">
              {/* Amount — auto-focused */}
              <div>
                <AmountInput
                  value={qaAmount}
                  onChange={setQaAmount}
                  error={
                    qaAmount.length > 0 && amountInvalid
                      ? 'Số tiền phải > 0'
                      : undefined
                  }
                />
              </div>

              {/* Account Picker */}
              <div>
                <label className="text-sm font-medium text-[var(--text-primary)] mb-1.5 block">
                  {sheetTab === 'transfer' ? 'Từ tài khoản' : 'Tài khoản'}
                </label>
                <div className="space-y-1.5">
                  {accounts.map((acc) => {
                    const IconComp = ACCOUNT_ICONS[acc.icon] || Wallet;
                    const isSelected = acc.id === qaAccountId;
                    return (
                      <button
                        key={acc.id}
                        onClick={() => {
                          setQaAccountId(acc.id);
                          if (
                            sheetTab === 'transfer' &&
                            qaToAccountId === acc.id
                          ) {
                            setQaToAccountId(getSecondAccountId(acc.id));
                          }
                        }}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-lg)] border transition-all text-left ${
                          isSelected
                            ? 'border-[var(--primary)] bg-[var(--primary-light)] shadow-sm'
                            : 'border-[var(--border)] bg-[var(--input-background)] hover:border-[var(--text-tertiary)]'
                        }`}
                      >
                        <div
                          className="w-8 h-8 rounded-[var(--radius-md)] flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: `${acc.color}20` }}
                        >
                          <IconComp
                            className="w-4 h-4"
                            style={{ color: acc.color }}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                            {acc.name}
                            {acc.accountNumber && (
                              <span className="text-[var(--text-tertiary)] font-normal">
                                {' '}
                                •{' '}
                                {hideAccountNumbers
                                  ? '••••'
                                  : maskAccountNumber(
                                      acc.accountNumber,
                                      acc.type
                                    )}
                              </span>
                            )}
                            {acc.accountOwnerName && (
                              <span className="text-[var(--text-tertiary)] font-normal">
                                {' '}
                                | {acc.accountOwnerName}
                              </span>
                            )}
                          </p>
                        </div>
                        <span
                          className="text-xs font-semibold tabular-nums flex-shrink-0"
                          style={{ color: acc.color }}
                        >
                          {new Intl.NumberFormat('vi-VN').format(acc.balance)}
                          {currencySymbol}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* To Account (transfer only) */}
              {sheetTab === 'transfer' && (
                <>
                  {/* Down Arrow Connector */}
                  <div className="flex justify-center py-1">
                    <div className="relative">
                      <div className="absolute left-1/2 -translate-x-1/2 -top-1 w-px h-1 bg-[var(--border)]" />
                      <div className="w-8 h-8 rounded-full bg-[var(--info-light)] border border-[var(--info)]/30 flex items-center justify-center">
                        <ArrowDown className="w-4 h-4 text-[var(--info)]" />
                      </div>
                      <div className="absolute left-1/2 -translate-x-1/2 -bottom-1 w-px h-1 bg-[var(--border)]" />
                    </div>
                  </div>

                  {/* Insufficient Balance Error */}
                  {insufficientBalance && (
                    <div className="flex items-start gap-2 p-2.5 bg-[var(--danger-light)] border border-[var(--danger)]/30 rounded-[var(--radius-lg)]">
                      <AlertCircle className="w-4 h-4 text-[var(--danger)] flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs text-[var(--danger)] font-medium">
                          Số tiền đang có không đủ thực hiện giao dịch (bao gồm phí).
                        </p>
                        <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
                          Cần: {new Intl.NumberFormat('vi-VN').format(totalTransferDeduction)} {currencySymbol} —
                          Có: {new Intl.NumberFormat('vi-VN').format(qaFromAccount?.balance || 0)} {currencySymbol}
                        </p>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="text-sm font-medium text-[var(--text-primary)] mb-1.5 block">
                      Đến tài khoản
                    </label>
                    <div className="space-y-1.5">
                      {accounts
                        .filter((a) => a.id !== qaAccountId)
                        .map((acc) => {
                          const IconComp = ACCOUNT_ICONS[acc.icon] || Wallet;
                          const isSelected = acc.id === qaToAccountId;
                          return (
                            <button
                              key={acc.id}
                              onClick={() => setQaToAccountId(acc.id)}
                              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-lg)] border transition-all text-left ${
                                isSelected
                                  ? 'border-[var(--primary)] bg-[var(--primary-light)] shadow-sm'
                                  : 'border-[var(--border)] bg-[var(--input-background)] hover:border-[var(--text-tertiary)]'
                              }`}
                            >
                              <div
                                className="w-8 h-8 rounded-[var(--radius-md)] flex items-center justify-center flex-shrink-0"
                                style={{ backgroundColor: `${acc.color}20` }}
                              >
                                <IconComp
                                  className="w-4 h-4"
                                  style={{ color: acc.color }}
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                                  {acc.name}
                                  {acc.accountNumber && (
                                    <span className="text-[var(--text-tertiary)] font-normal">
                                      {' '}
                                      •{' '}
                                      {hideAccountNumbers
                                        ? '••••'
                                        : maskAccountNumber(
                                            acc.accountNumber,
                                            acc.type
                                          )}
                                    </span>
                                  )}
                                </p>
                              </div>
                              <span
                                className="text-xs font-semibold tabular-nums flex-shrink-0"
                                style={{ color: acc.color }}
                              >
                                {new Intl.NumberFormat('vi-VN').format(
                                  acc.balance
                                )}
                                {currencySymbol}
                              </span>
                            </button>
                          );
                        })}
                    </div>
                    {transferError && (
                      <p className="text-xs text-[var(--danger)] mt-1.5">
                        Tài khoản nguồn và đích phải khác nhau.
                      </p>
                    )}
                  </div>

                  {/* Service Fee */}
                  <div>
                    <label className="text-sm font-medium text-[var(--text-primary)] mb-1.5 block">
                      Phí dịch vụ
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        inputMode="numeric"
                        value={qaServiceFee ? formatWithDots(qaServiceFee) : ''}
                        onChange={(e) => {
                          const digits = stripToDigits(e.target.value);
                          if (digits.length > 12) return;
                          const cleaned = digits.replace(/^0+/, '') || (digits.length > 0 ? '0' : '');
                          setQaServiceFee(cleaned === '0' && digits === '' ? '' : cleaned);
                        }}
                        placeholder="Nhập phí (nếu có)"
                        autoComplete="off"
                        className="w-full px-4 py-2.5 pr-12 bg-[var(--input-background)] border border-[var(--border)] rounded-[var(--radius-lg)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)] tabular-nums"
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[var(--text-secondary)] pointer-events-none select-none">
                        {currencySymbol}
                      </div>
                    </div>
                    {numericServiceFee > 0 && (
                      <p className="mt-1 text-xs text-[var(--text-tertiary)]">
                        Tổng trừ từ nguồn: {new Intl.NumberFormat('vi-VN').format(totalTransferDeduction)} {currencySymbol}
                      </p>
                    )}
                  </div>
                </>
              )}

              {/* Category Picker (expense/income) */}
              {sheetTab !== 'transfer' && (
                <div>
                  <label className="text-sm font-medium text-[var(--text-primary)] mb-2 block">
                    Danh mục{' '}
                    <span className="text-[var(--danger)]">*</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {(sheetTab === 'expense'
                      ? expenseCategories
                      : incomeCategories
                    ).map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() =>
                          setQaCategoryId(
                            cat.id === qaCategoryId ? '' : cat.id
                          )
                        }
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                          qaCategoryId === cat.id
                            ? 'text-white shadow-sm'
                            : 'bg-[var(--surface)] text-[var(--text-secondary)] border-[var(--border)] hover:border-[var(--text-tertiary)]'
                        }`}
                        style={
                          qaCategoryId === cat.id
                            ? {
                                backgroundColor: cat.color,
                                borderColor: cat.color,
                              }
                            : undefined
                        }
                      >
                        {cat.name}
                      </button>
                    ))}
                  </div>
                  {categoryMissing && qaAmount.length > 0 && (
                    <p className="text-xs text-[var(--warning)] mt-1.5">
                      Vui lòng chọn danh mục để lưu.
                    </p>
                  )}
                </div>
              )}

              {/* Merchant (optional, expense/income only) */}
              {sheetTab !== 'transfer' && merchants.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-[var(--text-primary)] mb-1.5 flex items-center gap-1.5">
                    <Store className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
                    Đối tác
                    <span className="text-xs text-[var(--text-tertiary)] font-normal">
                      (tuỳ chọn)
                    </span>
                  </label>
                  <select
                    value={qaMerchantId}
                    onChange={(e) => {
                      setQaMerchantId(e.target.value);
                      // Auto-set category if merchant has default
                      if (e.target.value) {
                        const m = merchants.find(
                          (m) => m.id === e.target.value
                        );
                        if (m?.defaultCategory) {
                          setQaCategoryId(m.defaultCategory);
                        }
                      }
                    }}
                    className="w-full px-4 py-2.5 bg-[var(--input-background)] border border-[var(--border)] rounded-[var(--radius-lg)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]"
                  >
                    <option value="">— Không chọn —</option>
                    {merchants.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                        {m.categoryName ? ` (${m.categoryName})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Note */}
              <div>
                <label className="text-sm font-medium text-[var(--text-primary)] mb-1.5 block">
                  Ghi chú{' '}
                  <span className="text-xs text-[var(--text-tertiary)] font-normal">
                    (tuỳ chọn)
                  </span>
                </label>
                <input
                  type="text"
                  value={qaNote}
                  onChange={(e) => setQaNote(e.target.value)}
                  placeholder="Nhập ghi chú..."
                  className="w-full px-4 py-2.5 bg-[var(--input-background)] border border-[var(--border)] rounded-[var(--radius-lg)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <Button
                  variant="primary"
                  className="flex-1"
                  onClick={handleQuickSave}
                  disabled={saveDisabled}
                >
                  Lưu
                </Button>
                <Button
                  variant="secondary"
                  onClick={openFullForm}
                  className="flex items-center gap-1.5"
                >
                  <FileText className="w-4 h-4" />
                  Mở form đầy đủ
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── CSS for animations ─────────────────────────── */}
      <style>{`
        @keyframes slide-up {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }
      `}</style>
    </div>
  );
}
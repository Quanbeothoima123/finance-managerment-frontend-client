import React, { useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
  Wallet,
  Banknote,
  Landmark,
  Smartphone,
  Plus,
  MoreVertical,
  Pencil,
  Trash2,
  X,
  AlertCircle,
  Check,
} from 'lucide-react';
import { useDemoData } from '../contexts/DemoDataContext';
import { useToast } from '../contexts/ToastContext';
import { formatWithDots, stripToDigits, numberToVietnameseWords } from '../components/AmountInput';
import { maskAccountNumber } from '../utils/accountHelpers';

// ============================================================================
// TYPES
// ============================================================================

type WalletType = 'cash' | 'ewallet' | 'bank';

interface OnboardingWallet {
  id: string;
  name: string;
  type: WalletType;
  balance: string; // raw digit string
  icon: string;
  color: string;
  provider?: string;
  accountNumber?: string;
  accountOwnerName?: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const WALLET_TYPE_META: Record<WalletType, { label: string; icon: typeof Wallet; color: string; accountType: 'cash' | 'cash' | 'bank' }> = {
  cash: { label: 'Tiền mặt', icon: Banknote, color: '#10B981', accountType: 'cash' },
  ewallet: { label: 'Ví điện tử', icon: Smartphone, color: '#8B5CF6', accountType: 'cash' },
  bank: { label: 'Ngân hàng', icon: Landmark, color: '#3B82F6', accountType: 'bank' },
};

const QUICK_SUGGESTIONS = [
  { name: 'MoMo', type: 'ewallet' as WalletType, color: '#D91C5C', icon: 'smartphone' },
  { name: 'ZaloPay', type: 'ewallet' as WalletType, color: '#008FE5', icon: 'smartphone' },
  { name: 'Vietcombank', type: 'bank' as WalletType, color: '#0E7C3A', icon: 'landmark' },
  { name: 'Techcombank', type: 'bank' as WalletType, color: '#E4002B', icon: 'landmark' },
  { name: 'MB', type: 'bank' as WalletType, color: '#004A8F', icon: 'landmark' },
];

const EWALLET_PROVIDERS = ['MoMo', 'ZaloPay', 'ShopeePay', 'Viettel Money', 'Khác'];
const BANK_SUGGESTIONS = ['Vietcombank', 'Techcombank', 'MB', 'ACB'];

let _walletIdCounter = 1;
function genId() {
  return `onb-wallet-${_walletIdCounter++}-${Date.now()}`;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function OnboardingWalletBalance() {
  const navigate = useNavigate();
  const { addAccount, selectedCurrency: contextCurrency } = useDemoData();
  const toast = useToast();
  const [searchParams] = useSearchParams();
  
  // Read currency from URL param (passed from ONB-01) or context
  const currency = searchParams.get('currency') || contextCurrency || 'VND';

  // Wallet list (local state during onboarding)
  const [wallets, setWallets] = useState<OnboardingWallet[]>([
    {
      id: genId(),
      name: 'Tiền mặt',
      type: 'cash',
      balance: '0',
      icon: 'banknote',
      color: '#10B981',
    },
  ]);

  // Bottom sheet states
  const [showTypeSheet, setShowTypeSheet] = useState(false);
  const [showCreateSheet, setShowCreateSheet] = useState(false);
  const [createType, setCreateType] = useState<WalletType>('cash');

  // Create form state
  const [createName, setCreateName] = useState('');
  const [createBalance, setCreateBalance] = useState('');
  const [createProvider, setCreateProvider] = useState('');
  const [createProviderOther, setCreateProviderOther] = useState('');
  const [createBankName, setCreateBankName] = useState('');
  const [createNameError, setCreateNameError] = useState('');
  const [createAccountNumber, setCreateAccountNumber] = useState('');
  const [createAccountNumberError, setCreateAccountNumberError] = useState('');
  const [createOwnerName, setCreateOwnerName] = useState('');

  // Edit/delete states
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  // Delete confirmation
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // ===== HANDLERS =====

  const handleSkip = () => {
    // Auto-create single Cash wallet
    addAccount({
      name: 'Tiền mặt',
      type: 'cash',
      balance: 0,
      openingBalance: 0,
      currency: 'VND',
      color: '#10B981',
      icon: 'wallet',
      accountNumber: '',
    });
    toast.info('Đã bỏ qua thiết lập. Bạn có thể thay đổi trong Cài đặt.');
    navigate('/home');
  };

  const handleContinue = () => {
    if (wallets.length === 0) {
      toast.error('Cần ít nhất 1 ví để tiếp tục.');
      return;
    }

    // Batch-create all wallets in DemoData
    wallets.forEach((w) => {
      const bal = parseInt(w.balance, 10) || 0;
      addAccount({
        name: w.name,
        type: w.type === 'bank' ? 'bank' : 'cash',
        balance: bal,
        openingBalance: bal,
        currency: currency,
        color: w.color,
        icon: w.icon,
        accountNumber: w.accountNumber || '',
        accountOwnerName: w.accountOwnerName || '',
      });
    });

    toast.success(`Đã tạo ${wallets.length} ví thành công!`);
    navigate('/onboarding/categories-setup');
  };

  // --- Wallet balance inline edit ---
  const updateWalletBalance = useCallback((id: string, rawValue: string) => {
    const digits = stripToDigits(rawValue);
    if (digits.length > 15) return;
    const cleaned = digits.replace(/^0+/, '') || (digits.length > 0 ? '0' : '');
    setWallets((prev) =>
      prev.map((w) => (w.id === id ? { ...w, balance: cleaned === '0' && digits === '' ? '' : cleaned } : w))
    );
  }, []);

  // --- Update wallet field (accountNumber, accountOwnerName, etc.) ---
  const updateWalletField = useCallback((id: string, field: keyof OnboardingWallet, value: string) => {
    setWallets((prev) =>
      prev.map((w) => (w.id === id ? { ...w, [field]: value } : w))
    );
  }, []);

  // --- Quick suggestion ---
  const addQuickSuggestion = (suggestion: typeof QUICK_SUGGESTIONS[0]) => {
    // Don't add if already exists
    if (wallets.some((w) => w.name === suggestion.name)) {
      toast.warning(`"${suggestion.name}" đã có trong danh sách.`);
      return;
    }
    setWallets((prev) => [
      ...prev,
      {
        id: genId(),
        name: suggestion.name,
        type: suggestion.type,
        balance: '0',
        icon: suggestion.icon,
        color: suggestion.color,
      },
    ]);
    toast.success(`Đã thêm ví "${suggestion.name}"`);
  };

  // --- Type selection → open create sheet ---
  const handleSelectType = (type: WalletType) => {
    setCreateType(type);
    setCreateName('');
    setCreateBalance('');
    setCreateProvider('');
    setCreateProviderOther('');
    setCreateBankName('');
    setCreateNameError('');
    setCreateAccountNumber('');
    setCreateAccountNumberError('');
    setCreateOwnerName('');
    setShowTypeSheet(false);
    setShowCreateSheet(true);
  };

  // --- Create wallet ---
  const handleCreateWallet = () => {
    if (!createName.trim()) {
      setCreateNameError('Vui lòng nhập tên ví.');
      return;
    }

    // Validate: BANK type must have account_number
    if (createType === 'bank' && !createAccountNumber.trim()) {
      setCreateAccountNumberError('Vui lòng nhập số tài khoản.');
      return;
    }

    // Uniqueness: Prevent duplicate bank_name + account_number
    if (createType === 'bank' && createAccountNumber.trim()) {
      const duplicate = wallets.find(
        (w) => w.type === 'bank' && w.provider === (createBankName || undefined) && w.accountNumber === createAccountNumber.trim()
      );
      if (duplicate) {
        setCreateAccountNumberError('Tài khoản này đã tồn tại.');
        return;
      }
    }

    const meta = WALLET_TYPE_META[createType];
    const newWallet: OnboardingWallet = {
      id: genId(),
      name: createName.trim(),
      type: createType,
      balance: createBalance || '0',
      icon: createType === 'cash' ? 'banknote' : createType === 'ewallet' ? 'smartphone' : 'landmark',
      color: meta.color,
      provider: createType === 'ewallet'
        ? (createProvider === 'Khác' ? createProviderOther : createProvider) || undefined
        : createType === 'bank'
        ? createBankName || undefined
        : undefined,
      accountNumber: (createType === 'bank' || createType === 'ewallet') ? createAccountNumber.trim() || undefined : undefined,
      accountOwnerName: (createType === 'bank' || createType === 'ewallet') ? createOwnerName.trim() || undefined : undefined,
    };

    setWallets((prev) => [...prev, newWallet]);
    setShowCreateSheet(false);
    toast.success('Đã thêm ví');
  };

  // --- Delete wallet ---
  const handleDeleteWallet = (id: string) => {
    if (wallets.length <= 1) {
      toast.error('Cần ít nhất 1 ví để tiếp tục.');
      setDeleteConfirmId(null);
      return;
    }
    const w = wallets.find((w) => w.id === id);
    setWallets((prev) => prev.filter((w) => w.id !== id));
    setDeleteConfirmId(null);
    setActiveMenuId(null);
    if (w) toast.success(`Đã xoá ví "${w.name}"`);
  };

  // --- Inline rename ---
  const startEditing = (w: OnboardingWallet) => {
    setEditingId(w.id);
    setEditName(w.name);
    setActiveMenuId(null);
  };

  const saveEditing = () => {
    if (!editName.trim()) return;
    setWallets((prev) =>
      prev.map((w) => (w.id === editingId ? { ...w, name: editName.trim() } : w))
    );
    setEditingId(null);
  };

  const canContinue = wallets.length >= 1;

  // Quick suggestions that haven't been added yet
  const availableSuggestions = QUICK_SUGGESTIONS.filter(
    (s) => !wallets.some((w) => w.name === s.name)
  );

  return (
    <div className="min-h-screen bg-[var(--background)] flex flex-col">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-center justify-between px-4 py-4 sm:px-6"
      >
        {/* Left: Back */}
        <button
          onClick={() => navigate('/onboarding/currency-date')}
          className="p-2 -ml-2 rounded-[var(--radius-md)] hover:bg-[var(--surface)] transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-[var(--text-primary)]" />
        </button>

        {/* Center: Progress */}
        <div className="flex flex-col items-center gap-1">
          <span className="text-xs text-[var(--text-tertiary)]">Bước 2/3</span>
          <div className="w-24 h-1 bg-[var(--surface)] rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-[var(--primary)] rounded-full"
              initial={{ width: '33%' }}
              animate={{ width: '66%' }}
              transition={{ duration: 0.6, delay: 0.3 }}
            />
          </div>
        </div>

        {/* Right: Skip */}
        <button
          onClick={handleSkip}
          className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors px-2 py-1"
        >
          Bỏ qua
        </button>
      </motion.header>

      {/* Content */}
      <div className="flex-1 px-4 sm:px-6 pb-6 flex flex-col max-w-lg mx-auto w-full overflow-y-auto">
        {/* Title & Description */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="mt-4 mb-5"
        >
          <h1 className="text-2xl font-semibold text-[var(--text-primary)] mb-2">
            Tạo ví ban đầu
          </h1>
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
            Thêm ít nhất 1 ví để bắt đầu nhập giao dịch. Nếu chưa chắc số dư, cứ để 0 — bạn chỉnh lại sau.
          </p>
        </motion.div>

        {/* Section A: Wallet List */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="bg-[var(--surface-elevated)] border border-[var(--border)] rounded-[var(--radius-xl)] p-4 mb-4 shadow-[var(--shadow-sm)]"
        >
          <h2 className="text-sm font-medium text-[var(--text-primary)] mb-3">
            Danh sách ví
          </h2>

          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {wallets.map((w) => {
                const meta = WALLET_TYPE_META[w.type];
                const IconComp = meta.icon;
                const numVal = parseInt(w.balance, 10) || 0;

                return (
                  <motion.div
                    key={w.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95, height: 0, marginBottom: 0 }}
                    transition={{ duration: 0.2 }}
                    className="bg-[var(--background)] border border-[var(--border)] rounded-[var(--radius-lg)] p-3"
                  >
                    {/* Top row: icon + name + overflow menu */}
                    <div className="flex items-center gap-3 mb-2">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: w.color + '20' }}
                      >
                        <IconComp className="w-5 h-5" style={{ color: w.color }} />
                      </div>

                      <div className="flex-1 min-w-0">
                        {editingId === w.id ? (
                          <div className="flex items-center gap-2">
                            <input
                              autoFocus
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') saveEditing();
                                if (e.key === 'Escape') setEditingId(null);
                              }}
                              className="flex-1 px-2 py-1 bg-[var(--input-background)] border border-[var(--border)] rounded-[var(--radius-md)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]"
                            />
                            <button
                              onClick={saveEditing}
                              className="p-1 rounded-[var(--radius-sm)] bg-[var(--primary)] text-white"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <>
                            <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                              {w.name}
                            </p>
                            {/* Provider/Bank + Masked Number */}
                            {(w.provider || w.accountNumber) && (
                              <p className="text-[10px] text-[var(--text-tertiary)] truncate mt-0.5">
                                {[w.provider, w.accountNumber ? maskAccountNumber(w.accountNumber, w.type === 'bank' ? 'bank' : undefined) : ''].filter(Boolean).join(' • ')}
                              </p>
                            )}
                            {/* Owner Name */}
                            {w.accountOwnerName && (
                              <p className="text-[10px] text-[var(--text-tertiary)] truncate">
                                {w.accountOwnerName}
                              </p>
                            )}
                            <span
                              className="inline-block text-[10px] px-2 py-0.5 rounded-full mt-0.5"
                              style={{
                                backgroundColor: w.color + '15',
                                color: w.color,
                              }}
                            >
                              {meta.label}
                            </span>
                          </>
                        )}
                      </div>

                      {/* Overflow menu */}
                      <div className="relative">
                        <button
                          onClick={() => setActiveMenuId(activeMenuId === w.id ? null : w.id)}
                          className="p-1.5 rounded-[var(--radius-md)] hover:bg-[var(--surface)] transition-colors"
                        >
                          <MoreVertical className="w-4 h-4 text-[var(--text-tertiary)]" />
                        </button>

                        {activeMenuId === w.id && (
                          <>
                            <div className="fixed inset-0 z-10" onClick={() => setActiveMenuId(null)} />
                            <motion.div
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className="absolute right-0 top-full mt-1 z-20 bg-[var(--surface-elevated)] border border-[var(--border)] rounded-[var(--radius-lg)] shadow-[var(--shadow-lg)] overflow-hidden min-w-[120px]"
                            >
                              <button
                                onClick={() => startEditing(w)}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--surface)] transition-colors"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                                Đổi tên
                              </button>
                              <button
                                onClick={() => {
                                  setActiveMenuId(null);
                                  setDeleteConfirmId(w.id);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[var(--danger)] hover:bg-[var(--surface)] transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                Xoá
                              </button>
                            </motion.div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Amount input row */}
                    <div>
                      <label className="block text-[11px] text-[var(--text-tertiary)] mb-1">
                        Số dư ban đầu
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          inputMode="numeric"
                          value={formatWithDots(w.balance)}
                          onChange={(e) => updateWalletBalance(w.id, e.target.value)}
                          placeholder="0"
                          autoComplete="off"
                          className="w-full px-3 py-2 pr-14 bg-[var(--input-background)] border border-[var(--border)] rounded-[var(--radius-md)] text-[var(--text-primary)] text-lg font-semibold placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)] tabular-nums"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-[var(--text-secondary)] pointer-events-none">
                          {currency}
                        </span>
                      </div>
                      {numVal > 0 && (
                        <p className="mt-1 text-[10px] text-[var(--text-tertiary)] italic">
                          {numberToVietnameseWords(numVal)}
                        </p>
                      )}
                    </div>

                    {/* Inline fields for bank/ewallet: Account Number + Owner Name */}
                    {(w.type === 'bank' || w.type === 'ewallet') && (
                      <div className="mt-3 pt-3 border-t border-[var(--border)] space-y-2">
                        <div>
                          <label className="block text-[11px] text-[var(--text-tertiary)] mb-1">
                            {w.type === 'bank' ? 'Số tài khoản' : 'Số điện thoại'}
                          </label>
                          <input
                            type="text"
                            inputMode={w.type === 'ewallet' ? 'tel' : 'text'}
                            value={w.accountNumber || ''}
                            onChange={(e) => updateWalletField(w.id, 'accountNumber', e.target.value)}
                            placeholder={w.type === 'bank' ? 'VD: 19036699999999' : 'VD: 0901234567'}
                            autoComplete="off"
                            className="w-full px-3 py-2 bg-[var(--input-background)] border border-[var(--border)] rounded-[var(--radius-md)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] text-[var(--text-tertiary)] mb-1">
                            Tên chủ tài khoản
                          </label>
                          <input
                            type="text"
                            value={w.accountOwnerName || ''}
                            onChange={(e) => updateWalletField(w.id, 'accountOwnerName', e.target.value)}
                            placeholder="VD: NGUYEN VAN A"
                            autoComplete="off"
                            className="w-full px-3 py-2 bg-[var(--input-background)] border border-[var(--border)] rounded-[var(--radius-md)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]"
                          />
                        </div>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Section B: Quick Suggestions */}
        {availableSuggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="bg-[var(--surface-elevated)] border border-[var(--border)] rounded-[var(--radius-xl)] p-4 mb-4 shadow-[var(--shadow-sm)]"
          >
            <h2 className="text-sm font-medium text-[var(--text-primary)] mb-3">
              Gợi ý nhanh
            </h2>
            <div className="flex flex-wrap gap-2">
              {availableSuggestions.map((s) => (
                <button
                  key={s.name}
                  onClick={() => addQuickSuggestion(s)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[var(--border)] bg-[var(--background)] text-sm text-[var(--text-primary)] hover:border-[var(--primary)] hover:bg-[var(--primary-light)] transition-all active:scale-95"
                >
                  <Plus className="w-3 h-3 text-[var(--text-tertiary)]" />
                  {s.name}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Section C: Add Wallet CTA */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.35 }}
        >
          <button
            onClick={() => setShowTypeSheet(true)}
            className="w-full py-3 rounded-[var(--radius-lg)] border-2 border-dashed border-[var(--border)] text-sm font-medium text-[var(--text-secondary)] hover:border-[var(--primary)] hover:text-[var(--primary)] hover:bg-[var(--primary-light)] transition-all flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Thêm ví
          </button>
        </motion.div>

        {/* Spacer */}
        <div className="flex-1 min-h-4" />

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.45 }}
          className="mt-6 sticky bottom-4"
        >
          <button
            onClick={handleContinue}
            disabled={!canContinue}
            className={`w-full py-3.5 rounded-[var(--radius-lg)] font-medium text-base transition-all shadow-[var(--shadow-sm)] ${
              canContinue
                ? 'bg-[var(--primary)] text-[var(--primary-foreground)] hover:bg-[var(--primary-hover)] active:scale-[0.98]'
                : 'bg-[var(--border)] text-[var(--text-tertiary)] cursor-not-allowed'
            }`}
          >
            Tiếp tục
          </button>
          <p className="text-center text-xs text-[var(--text-tertiary)] mt-3">
            Bạn có thể thêm/sửa ví sau trong Accounts.
          </p>
        </motion.div>
      </div>

      {/* ====== BOTTOM SHEET: Type Selection ====== */}
      <AnimatePresence>
        {showTypeSheet && (
          <BottomSheet onClose={() => setShowTypeSheet(false)} title="Chọn loại ví">
            <div className="space-y-2">
              {(Object.entries(WALLET_TYPE_META) as [WalletType, typeof WALLET_TYPE_META['cash']][]).map(
                ([type, meta]) => {
                  const IconComp = meta.icon;
                  return (
                    <button
                      key={type}
                      onClick={() => handleSelectType(type)}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-[var(--radius-lg)] hover:bg-[var(--surface)] transition-colors"
                    >
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: meta.color + '20' }}
                      >
                        <IconComp className="w-5 h-5" style={{ color: meta.color }} />
                      </div>
                      <span className="text-sm font-medium text-[var(--text-primary)]">
                        {meta.label}
                      </span>
                    </button>
                  );
                }
              )}
            </div>
          </BottomSheet>
        )}
      </AnimatePresence>

      {/* ====== BOTTOM SHEET: Create Wallet Form ====== */}
      <AnimatePresence>
        {showCreateSheet && (
          <BottomSheet
            onClose={() => setShowCreateSheet(false)}
            title="Tạo ví"
          >
            <div className="space-y-4">
              {/* Wallet type badge */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-[var(--text-tertiary)]">Loại:</span>
                <span
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                  style={{
                    backgroundColor: WALLET_TYPE_META[createType].color + '15',
                    color: WALLET_TYPE_META[createType].color,
                  }}
                >
                  {WALLET_TYPE_META[createType].label}
                </span>
              </div>

              {/* Name field */}
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">
                  Tên ví <span className="text-[var(--danger)]">*</span>
                </label>
                <input
                  type="text"
                  value={createName}
                  onChange={(e) => {
                    setCreateName(e.target.value);
                    if (e.target.value.trim()) setCreateNameError('');
                  }}
                  placeholder={
                    createType === 'cash'
                      ? 'Ví cá nhân'
                      : createType === 'ewallet'
                      ? 'MoMo'
                      : 'Vietcombank'
                  }
                  className={`w-full px-4 py-2.5 bg-[var(--input-background)] border rounded-[var(--radius-lg)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)] ${
                    createNameError ? 'border-[var(--danger)]' : 'border-[var(--border)]'
                  }`}
                />
                {createNameError && (
                  <div className="flex items-center gap-1 mt-1">
                    <AlertCircle className="w-3 h-3 text-[var(--danger)]" />
                    <span className="text-xs text-[var(--danger)]">{createNameError}</span>
                  </div>
                )}
              </div>

              {/* E-wallet provider */}
              {createType === 'ewallet' && (
                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">
                    Nhà cung cấp
                  </label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {EWALLET_PROVIDERS.map((p) => (
                      <button
                        key={p}
                        onClick={() => setCreateProvider(p)}
                        className={`px-3 py-1.5 rounded-full text-xs border transition-all ${
                          createProvider === p
                            ? 'border-[var(--primary)] bg-[var(--primary-light)] text-[var(--primary)]'
                            : 'border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--primary)]'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                  {createProvider === 'Khác' && (
                    <input
                      type="text"
                      value={createProviderOther}
                      onChange={(e) => setCreateProviderOther(e.target.value)}
                      placeholder="Tên nhà cung cấp"
                      className="w-full px-4 py-2 bg-[var(--input-background)] border border-[var(--border)] rounded-[var(--radius-lg)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)] text-sm"
                    />
                  )}
                </div>
              )}

              {/* E-wallet phone number (optional) */}
              {createType === 'ewallet' && (
                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">
                    Số điện thoại liên kết
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={createAccountNumber}
                    onChange={(e) => setCreateAccountNumber(e.target.value)}
                    placeholder="VD: 0901234567"
                    className="w-full px-4 py-2.5 bg-[var(--input-background)] border border-[var(--border)] rounded-[var(--radius-lg)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]"
                  />
                  <p className="text-[10px] text-[var(--text-tertiary)] mt-1">Không bắt buộc</p>
                </div>
              )}

              {/* Bank name */}
              {createType === 'bank' && (
                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">
                    Tên ngân hàng
                  </label>
                  <input
                    type="text"
                    value={createBankName}
                    onChange={(e) => setCreateBankName(e.target.value)}
                    placeholder="Nhập tên ngân hàng"
                    className="w-full px-4 py-2.5 bg-[var(--input-background)] border border-[var(--border)] rounded-[var(--radius-lg)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]"
                  />
                  <div className="flex flex-wrap gap-2 mt-2">
                    {BANK_SUGGESTIONS.map((b) => (
                      <button
                        key={b}
                        onClick={() => {
                          setCreateBankName(b);
                          if (!createName.trim()) setCreateName(b);
                        }}
                        className={`px-2.5 py-1 rounded-full text-xs border transition-all ${
                          createBankName === b
                            ? 'border-[var(--primary)] bg-[var(--primary-light)] text-[var(--primary)]'
                            : 'border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--primary)]'
                        }`}
                      >
                        {b}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Account number */}
              {createType === 'bank' && (
                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">
                    Số tài khoản
                  </label>
                  <input
                    type="text"
                    value={createAccountNumber}
                    onChange={(e) => {
                      setCreateAccountNumber(e.target.value);
                      if (e.target.value.trim()) setCreateAccountNumberError('');
                    }}
                    placeholder="Nhập số tài khoản"
                    className={`w-full px-4 py-2.5 bg-[var(--input-background)] border rounded-[var(--radius-lg)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)] ${
                      createAccountNumberError ? 'border-[var(--danger)]' : 'border-[var(--border)]'
                    }`}
                  />
                  {createAccountNumberError && (
                    <div className="flex items-center gap-1 mt-1">
                      <AlertCircle className="w-3 h-3 text-[var(--danger)]" />
                      <span className="text-xs text-[var(--danger)]">{createAccountNumberError}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Account owner name */}
              {createType === 'bank' && (
                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">
                    Tên chủ tài khoản
                  </label>
                  <input
                    type="text"
                    value={createOwnerName}
                    onChange={(e) => setCreateOwnerName(e.target.value)}
                    placeholder="Nhập tên chủ tài khoản"
                    className="w-full px-4 py-2.5 bg-[var(--input-background)] border border-[var(--border)] rounded-[var(--radius-lg)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]"
                  />
                </div>
              )}

              {/* Balance */}
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">
                  Số dư ban đầu
                </label>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={formatWithDots(createBalance)}
                    onChange={(e) => {
                      const digits = stripToDigits(e.target.value);
                      if (digits.length > 15) return;
                      const cleaned = digits.replace(/^0+/, '') || (digits.length > 0 ? '0' : '');
                      setCreateBalance(cleaned === '0' && digits === '' ? '' : cleaned);
                    }}
                    placeholder="0"
                    autoComplete="off"
                    className="w-full px-4 py-2.5 pr-14 bg-[var(--input-background)] border border-[var(--border)] rounded-[var(--radius-lg)] text-[var(--text-primary)] text-lg font-semibold placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)] tabular-nums"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-[var(--text-secondary)] pointer-events-none">
                    {currency}
                  </span>
                </div>
                {parseInt(createBalance, 10) > 0 && (
                  <p className="mt-1 text-[10px] text-[var(--text-tertiary)] italic">
                    {numberToVietnameseWords(parseInt(createBalance, 10))}
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowCreateSheet(false)}
                  className="flex-1 py-2.5 rounded-[var(--radius-lg)] border border-[var(--border)] text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--surface)] transition-colors"
                >
                  Huỷ
                </button>
                <button
                  onClick={handleCreateWallet}
                  className="flex-1 py-2.5 rounded-[var(--radius-lg)] bg-[var(--primary)] text-[var(--primary-foreground)] text-sm font-medium hover:bg-[var(--primary-hover)] transition-colors"
                >
                  Thêm
                </button>
              </div>
            </div>
          </BottomSheet>
        )}
      </AnimatePresence>

      {/* ====== DELETE CONFIRMATION BOTTOM SHEET ====== */}
      <AnimatePresence>
        {deleteConfirmId && (
          <BottomSheet
            onClose={() => setDeleteConfirmId(null)}
            title="Xoá ví?"
          >
            <p className="text-sm text-[var(--text-secondary)] mb-4">
              Bạn có chắc muốn xoá ví &ldquo;{wallets.find((w) => w.id === deleteConfirmId)?.name}&rdquo;?
              Hành động này không thể hoàn tác.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 py-2.5 rounded-[var(--radius-lg)] border border-[var(--border)] text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--surface)] transition-colors"
              >
                Huỷ
              </button>
              <button
                onClick={() => handleDeleteWallet(deleteConfirmId)}
                className="flex-1 py-2.5 rounded-[var(--radius-lg)] bg-[var(--danger)] text-white text-sm font-medium hover:opacity-90 transition-colors"
              >
                Xoá
              </button>
            </div>
          </BottomSheet>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================================================
// BOTTOM SHEET COMPONENT (reusable within this file)
// ============================================================================

function BottomSheet({
  onClose,
  title,
  children,
}: {
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/50"
        onClick={onClose}
      />
      {/* Sheet */}
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        className="fixed bottom-0 left-0 right-0 z-50 bg-[var(--card)] rounded-t-[var(--radius-2xl)] shadow-2xl max-h-[85vh] flex flex-col"
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-[var(--border)]" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pb-3 border-b border-[var(--border)]">
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">{title}</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-[var(--radius-md)] hover:bg-[var(--surface)] transition-colors"
          >
            <X className="w-5 h-5 text-[var(--text-secondary)]" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {children}
        </div>
      </motion.div>
    </>
  );
}
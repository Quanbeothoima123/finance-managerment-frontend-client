import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { Wallet, ChevronDown, Calendar as CalendarIcon, AlertCircle } from 'lucide-react';
import { useDemoData } from '../contexts/DemoDataContext';
import { useToast } from '../contexts/ToastContext';

type TrackingOption = 'today' | 'start-of-month' | 'custom';

const CURRENCIES = [
  { value: 'VND', label: 'VND (₫)', symbol: '₫' },
  { value: 'USD', label: 'USD ($)', symbol: '$' },
  { value: 'EUR', label: 'EUR (€)', symbol: '€' },
];

export default function OnboardingCurrencyDate() {
  const navigate = useNavigate();
  const { addAccount, accounts, setSelectedCurrency: saveSelectedCurrency } = useDemoData();
  const toast = useToast();

  const [currency, setCurrency] = useState('VND');
  const [trackingOption, setTrackingOption] = useState<TrackingOption>('start-of-month');
  const [customDate, setCustomDate] = useState('');
  const [showDateError, setShowDateError] = useState(false);
  const [currencyDropdownOpen, setCurrencyDropdownOpen] = useState(false);

  const selectedCurrency = CURRENCIES.find(c => c.value === currency)!;

  const computedStartDate = useMemo(() => {
    const now = new Date();
    switch (trackingOption) {
      case 'today':
        return now.toISOString().split('T')[0];
      case 'start-of-month': {
        const first = new Date(now.getFullYear(), now.getMonth(), 1);
        return first.toISOString().split('T')[0];
      }
      case 'custom':
        return customDate || '';
      default:
        return '';
    }
  }, [trackingOption, customDate]);

  const canContinue = trackingOption !== 'custom' || customDate !== '';

  const handleSkip = () => {
    // Auto-create default Cash wallet if no accounts exist
    const hasCashWallet = accounts.some(a => a.type === 'cash' && a.name === 'Tiền mặt');
    if (!hasCashWallet) {
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
    }
    toast.info('Đã bỏ qua thiết lập. Bạn có thể thay đổi trong Cài đặt.');
    navigate('/home');
  };

  const handleContinue = () => {
    if (trackingOption === 'custom' && !customDate) {
      setShowDateError(true);
      return;
    }
    setShowDateError(false);
    toast.success(`Đã chọn ${selectedCurrency.label}, bắt đầu theo dõi từ ${formatDateVN(computedStartDate)}`);
    // Save selected currency to context
    saveSelectedCurrency(currency);
    // Navigate to ONB-02 (Wallet Creation & Initial Balance) with currency param
    navigate(`/onboarding/wallet-balance?currency=${currency}`);
  };

  const handleCustomDateChange = (val: string) => {
    setCustomDate(val);
    if (val) setShowDateError(false);
  };

  const trackingOptions: { value: TrackingOption; label: string }[] = [
    { value: 'today', label: 'Hôm nay' },
    { value: 'start-of-month', label: 'Đầu tháng này' },
    { value: 'custom', label: 'Tuỳ chọn' },
  ];

  return (
    <div className="min-h-screen bg-[var(--background)] flex flex-col">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-center justify-between px-4 py-4 sm:px-6"
      >
        {/* Left: Logo/Icon */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-[var(--radius-md)] bg-gradient-to-br from-[var(--primary)] to-[var(--success)] flex items-center justify-center">
            <Wallet className="w-4 h-4 text-white" />
          </div>
        </div>

        {/* Center: Progress */}
        <div className="flex flex-col items-center gap-1">
          <span className="text-xs text-[var(--text-tertiary)]">Bước 1/3</span>
          <div className="w-24 h-1 bg-[var(--surface)] rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-[var(--primary)] rounded-full"
              initial={{ width: 0 }}
              animate={{ width: '33%' }}
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
      <div className="flex-1 px-4 sm:px-6 pb-6 flex flex-col max-w-lg mx-auto w-full">
        {/* Title & Description */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="mt-4 mb-6"
        >
          <h1 className="text-2xl font-semibold text-[var(--text-primary)] mb-2">
            Thiết lập nhanh
          </h1>
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
            Chỉ mất ~15 giây. Bạn có thể thay đổi lại trong Cài đặt.
          </p>
        </motion.div>

        {/* Section A: Currency */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="bg-[var(--surface-elevated)] border border-[var(--border)] rounded-[var(--radius-xl)] p-5 mb-4 shadow-[var(--shadow-sm)]"
        >
          <div className="mb-1">
            <span className="text-sm font-medium text-[var(--text-primary)]">
              Tiền tệ mặc định <span className="text-[var(--danger)]">*</span>
            </span>
          </div>
          <p className="text-xs text-[var(--text-tertiary)] mb-3">
            Áp dụng cho giao dịch mới. Giao dịch cũ giữ nguyên.
          </p>

          {/* Currency Dropdown */}
          <div className="relative">
            <button
              onClick={() => setCurrencyDropdownOpen(!currencyDropdownOpen)}
              className="w-full flex items-center justify-between px-4 py-3 bg-[var(--input-background)] border border-[var(--border)] rounded-[var(--radius-lg)] text-[var(--text-primary)] hover:border-[var(--primary)] transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-[var(--primary-light)] flex items-center justify-center text-sm font-medium text-[var(--primary)]">
                  {selectedCurrency.symbol}
                </span>
                <span>{selectedCurrency.label}</span>
              </div>
              <ChevronDown className={`w-4 h-4 text-[var(--text-tertiary)] transition-transform ${currencyDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {currencyDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="absolute z-10 top-full mt-1 w-full bg-[var(--surface-elevated)] border border-[var(--border)] rounded-[var(--radius-lg)] shadow-[var(--shadow-lg)] overflow-hidden"
              >
                {CURRENCIES.map((c) => (
                  <button
                    key={c.value}
                    onClick={() => {
                      setCurrency(c.value);
                      setCurrencyDropdownOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-[var(--surface)] transition-colors ${
                      currency === c.value ? 'bg-[var(--primary-light)]' : ''
                    }`}
                  >
                    <span className="w-8 h-8 rounded-full bg-[var(--primary-light)] flex items-center justify-center text-sm font-medium text-[var(--primary)]">
                      {c.symbol}
                    </span>
                    <span className="text-sm text-[var(--text-primary)]">{c.label}</span>
                    {currency === c.value && (
                      <span className="ml-auto text-[var(--primary)]">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </span>
                    )}
                  </button>
                ))}
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Section B: Tracking Start Date */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.35 }}
          className="bg-[var(--surface-elevated)] border border-[var(--border)] rounded-[var(--radius-xl)] p-5 mb-4 shadow-[var(--shadow-sm)]"
        >
          <div className="mb-1">
            <span className="text-sm font-medium text-[var(--text-primary)]">
              Bắt đầu theo dõi từ <span className="text-[var(--danger)]">*</span>
            </span>
          </div>
          <p className="text-xs text-[var(--text-tertiary)] mb-4">
            Báo cáo/insight sẽ tính từ ngày này.
          </p>

          {/* Segmented Control */}
          <div className="flex bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-lg)] p-1 mb-4">
            {trackingOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => {
                  setTrackingOption(opt.value);
                  if (opt.value !== 'custom') setShowDateError(false);
                }}
                className={`flex-1 px-2 py-2 rounded-[var(--radius-md)] text-xs sm:text-sm font-medium transition-all ${
                  trackingOption === opt.value
                    ? 'bg-[var(--background)] text-[var(--text-primary)] shadow-[var(--shadow-sm)]'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Date Display for non-custom options */}
          {trackingOption !== 'custom' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-2 px-3 py-2 bg-[var(--surface)] rounded-[var(--radius-md)]"
            >
              <CalendarIcon className="w-4 h-4 text-[var(--text-tertiary)]" />
              <span className="text-sm text-[var(--text-secondary)]">
                {formatDateVN(computedStartDate)}
              </span>
            </motion.div>
          )}

          {/* Custom Date Picker */}
          {trackingOption === 'custom' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                  <CalendarIcon className="w-4 h-4 text-[var(--text-tertiary)]" />
                </div>
                <input
                  type="date"
                  value={customDate}
                  onChange={(e) => handleCustomDateChange(e.target.value)}
                  placeholder="Chọn ngày"
                  max={new Date().toISOString().split('T')[0]}
                  className={`w-full pl-10 pr-4 py-3 bg-[var(--input-background)] border rounded-[var(--radius-lg)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)] focus:border-transparent transition-all ${
                    showDateError ? 'border-[var(--danger)]' : 'border-[var(--border)]'
                  }`}
                />
              </div>
              {showDateError && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-1.5 mt-2"
                >
                  <AlertCircle className="w-3.5 h-3.5 text-[var(--danger)]" />
                  <span className="text-xs text-[var(--danger)]">
                    Vui lòng chọn ngày bắt đầu.
                  </span>
                </motion.div>
              )}
            </motion.div>
          )}
        </motion.div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.5 }}
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
            Bạn có thể chỉnh lại trong Settings &rarr; General.
          </p>
        </motion.div>
      </div>

      {/* Close dropdown on outside click */}
      {currencyDropdownOpen && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setCurrencyDropdownOpen(false)}
        />
      )}
    </div>
  );
}

// Helper: Format date to Vietnamese
function formatDateVN(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}
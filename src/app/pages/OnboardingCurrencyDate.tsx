import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { Wallet, ChevronDown, Calendar as CalendarIcon, AlertCircle, Loader2 } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../hooks/useAuth';
import { onboardingService } from '../services/onboardingService';
import { getApiErrorMessage } from '../utils/authError';
import { resolveOnboardingPath } from '../types/onboarding';

type TrackingOption = 'today' | 'start-of-month' | 'custom';

const CURRENCIES = [
  { value: 'VND', label: 'VND (₫)', symbol: '₫' },
  { value: 'USD', label: 'USD ($)', symbol: '$' },
  { value: 'EUR', label: 'EUR (€)', symbol: '€' },
];

export default function OnboardingCurrencyDate() {
  const navigate = useNavigate();
  const toast = useToast();
  const { isAuthenticated, isHydrated } = useAuth();

  const [currency, setCurrency] = useState('VND');
  const [trackingOption, setTrackingOption] = useState<TrackingOption>('start-of-month');
  const [customDate, setCustomDate] = useState('');
  const [showDateError, setShowDateError] = useState(false);
  const [currencyDropdownOpen, setCurrencyDropdownOpen] = useState(false);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedCurrency = CURRENCIES.find((item) => item.value === currency) || CURRENCIES[0];

  const computedStartDate = useMemo(() => {
    const now = new Date();
    switch (trackingOption) {
      case 'today':
        return now.toISOString().split('T')[0];
      case 'start-of-month': {
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        return firstDay.toISOString().split('T')[0];
      }
      case 'custom':
        return customDate || '';
      default:
        return '';
    }
  }, [customDate, trackingOption]);

  const canContinue = Boolean(computedStartDate) && !isSubmitting;

  useEffect(() => {
    if (!isHydrated) return;
    if (!isAuthenticated) {
      navigate('/auth/login', { replace: true });
      return;
    }

    let isMounted = true;

    const loadState = async () => {
      try {
        const state = await onboardingService.getState();
        if (!isMounted) return;

        setCurrency(state.ledger.baseCurrencyCode || 'VND');

        if (state.onboarding.completed) {
          navigate('/home', { replace: true });
          return;
        }

        if (state.onboarding.trackingStartDate) {
          const normalizedDate = state.onboarding.trackingStartDate.slice(0, 10);
          applyTrackingDate(normalizedDate, setTrackingOption, setCustomDate);
        }
      } catch (error) {
        if (!isMounted) return;
        toast.error(getApiErrorMessage(error, 'Không thể tải dữ liệu onboarding.'));
      } finally {
        if (isMounted) setIsBootstrapping(false);
      }
    };

    loadState();

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, isHydrated, navigate, toast]);

  const submitCurrencyDate = async (skipMode = false) => {
    if (!computedStartDate) {
      setShowDateError(true);
      return;
    }

    setShowDateError(false);
    setIsSubmitting(true);

    try {
      const state = await onboardingService.saveCurrencyDate({
        baseCurrencyCode: currency,
        trackingStartDate: computedStartDate,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        weekStartsOn: 1,
      });

      toast.success(
        skipMode
          ? 'Đã lưu thiết lập cơ bản. Tiếp tục tạo ví ban đầu.'
          : `Đã chọn ${selectedCurrency.label}, bắt đầu theo dõi từ ${formatDateVN(computedStartDate)}`,
      );

      navigate(resolveOnboardingPath(state.onboarding.currentStep), { replace: true });
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Không thể lưu bước thiết lập này.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCustomDateChange = (value: string) => {
    setCustomDate(value);
    if (value) setShowDateError(false);
  };

  const trackingOptions: Array<{ value: TrackingOption; label: string }> = [
    { value: 'today', label: 'Hôm nay' },
    { value: 'start-of-month', label: 'Đầu tháng này' },
    { value: 'custom', label: 'Tuỳ chọn' },
  ];

  return (
    <div className="min-h-screen bg-[var(--background)] flex flex-col">
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-center justify-between px-4 py-4 sm:px-6"
      >
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-[var(--radius-md)] bg-gradient-to-br from-[var(--primary)] to-[var(--success)] flex items-center justify-center">
            <Wallet className="w-4 h-4 text-white" />
          </div>
        </div>

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

        <button
          onClick={() => submitCurrencyDate(true)}
          disabled={isBootstrapping || isSubmitting}
          className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors px-2 py-1 disabled:opacity-50"
        >
          Bỏ qua
        </button>
      </motion.header>

      <div className="flex-1 px-4 sm:px-6 pb-6 flex flex-col max-w-lg mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="mt-4 mb-6"
        >
          <h1 className="text-2xl font-semibold text-[var(--text-primary)] mb-2">Thiết lập nhanh</h1>
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
            Chỉ mất ~15 giây. Bạn có thể thay đổi lại trong Cài đặt.
          </p>
        </motion.div>

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
          <p className="text-xs text-[var(--text-tertiary)] mb-3">Áp dụng cho giao dịch mới. Giao dịch cũ giữ nguyên.</p>

          <div className="relative">
            <button
              onClick={() => setCurrencyDropdownOpen((prev) => !prev)}
              disabled={isBootstrapping || isSubmitting}
              className="w-full flex items-center justify-between px-4 py-3 bg-[var(--input-background)] border border-[var(--border)] rounded-[var(--radius-lg)] text-[var(--text-primary)] hover:border-[var(--primary)] transition-colors disabled:opacity-60"
            >
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-[var(--primary-light)] flex items-center justify-center text-sm font-medium text-[var(--primary)]">
                  {selectedCurrency.symbol}
                </span>
                <span>{selectedCurrency.label}</span>
              </div>
              <ChevronDown className={`w-4 h-4 text-[var(--text-tertiary)] transition-transform ${currencyDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {currencyDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute z-10 top-full mt-1 w-full bg-[var(--surface-elevated)] border border-[var(--border)] rounded-[var(--radius-lg)] shadow-[var(--shadow-lg)] overflow-hidden"
              >
                {CURRENCIES.map((item) => (
                  <button
                    key={item.value}
                    onClick={() => {
                      setCurrency(item.value);
                      setCurrencyDropdownOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-[var(--surface)] transition-colors ${currency === item.value ? 'bg-[var(--primary-light)]' : ''}`}
                  >
                    <span className="w-8 h-8 rounded-full bg-[var(--primary-light)] flex items-center justify-center text-sm font-medium text-[var(--primary)]">
                      {item.symbol}
                    </span>
                    <span className="text-sm text-[var(--text-primary)]">{item.label}</span>
                  </button>
                ))}
              </motion.div>
            )}
          </div>
        </motion.div>

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
          <p className="text-xs text-[var(--text-tertiary)] mb-4">Báo cáo/insight sẽ tính từ ngày này.</p>

          <div className="flex bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-lg)] p-1 mb-4">
            {trackingOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  setTrackingOption(option.value);
                  if (option.value !== 'custom') setShowDateError(false);
                }}
                className={`flex-1 px-2 py-2 rounded-[var(--radius-md)] text-xs sm:text-sm font-medium transition-all ${trackingOption === option.value ? 'bg-[var(--primary)] text-white shadow-[var(--shadow-xs)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
              >
                {option.label}
              </button>
            ))}
          </div>

          {trackingOption === 'custom' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              transition={{ duration: 0.2 }}
            >
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                  <CalendarIcon className="w-4 h-4 text-[var(--text-tertiary)]" />
                </div>
                <input
                  type="date"
                  value={customDate}
                  onChange={(event) => handleCustomDateChange(event.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  className={`w-full pl-10 pr-4 py-3 bg-[var(--input-background)] border rounded-[var(--radius-lg)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)] focus:border-transparent transition-all ${showDateError ? 'border-[var(--danger)]' : 'border-[var(--border)]'}`}
                />
              </div>
              {showDateError && (
                <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-1.5 mt-2">
                  <AlertCircle className="w-3.5 h-3.5 text-[var(--danger)]" />
                  <span className="text-xs text-[var(--danger)]">Vui lòng chọn ngày bắt đầu.</span>
                </motion.div>
              )}
            </motion.div>
          )}

          {trackingOption !== 'custom' && (
            <div className="px-3 py-3 rounded-[var(--radius-lg)] bg-[var(--surface)] text-sm text-[var(--text-secondary)]">
              Dữ liệu sẽ được tính từ <span className="font-medium text-[var(--text-primary)]">{formatDateVN(computedStartDate)}</span>
            </div>
          )}
        </motion.div>

        {isBootstrapping && (
          <div className="flex items-center justify-center gap-2 text-sm text-[var(--text-secondary)] mt-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            Đang tải thiết lập hiện tại...
          </div>
        )}

        <div className="flex-1" />

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.5 }}
          className="mt-6 sticky bottom-4"
        >
          <button
            onClick={() => submitCurrencyDate(false)}
            disabled={!canContinue || isBootstrapping}
            className={`w-full py-3.5 rounded-[var(--radius-lg)] font-medium text-base transition-all shadow-[var(--shadow-sm)] ${canContinue && !isBootstrapping ? 'bg-[var(--primary)] text-[var(--primary-foreground)] hover:bg-[var(--primary-hover)] active:scale-[0.98]' : 'bg-[var(--border)] text-[var(--text-tertiary)] cursor-not-allowed'}`}
          >
            {isSubmitting ? 'Đang lưu...' : 'Tiếp tục'}
          </button>
          <p className="text-center text-xs text-[var(--text-tertiary)] mt-3">Bạn có thể chỉnh lại trong Settings → General.</p>
        </motion.div>
      </div>

      {currencyDropdownOpen && <div className="fixed inset-0 z-0" onClick={() => setCurrencyDropdownOpen(false)} />}
    </div>
  );
}

function applyTrackingDate(
  date: string,
  setTrackingOption: React.Dispatch<React.SetStateAction<TrackingOption>>,
  setCustomDate: React.Dispatch<React.SetStateAction<string>>,
) {
  const today = new Date().toISOString().slice(0, 10);
  const firstOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    .toISOString()
    .slice(0, 10);

  if (date === today) {
    setTrackingOption('today');
    setCustomDate('');
    return;
  }

  if (date === firstOfMonth) {
    setTrackingOption('start-of-month');
    setCustomDate('');
    return;
  }

  setTrackingOption('custom');
  setCustomDate(date);
}

function formatDateVN(dateStr: string): string {
  if (!dateStr) return '';
  const date = new Date(`${dateStr}T00:00:00`);
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

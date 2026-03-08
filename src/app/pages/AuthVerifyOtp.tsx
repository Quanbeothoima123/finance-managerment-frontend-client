import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import {
  Mail, Loader2, ArrowLeft, Shield, RotateCcw,
  Wallet, CheckCircle, Sparkles, ShieldCheck, Fingerprint, AlertTriangle
} from 'lucide-react';
import { useAppNavigation } from '../hooks/useAppNavigation';
import { useToast } from '../contexts/ToastContext';
import { ThemeSwitcher } from '../components/ThemeSwitcher';
import { useAuth } from '../hooks/useAuth';
import { authService } from '../services/authService';
import { getApiErrorMessage } from '../utils/authError';

type VerifyStage = 'input' | 'success' | 'error';
type VerifyPurpose = 'email-verification' | 'login' | 'action';

const purposeConfig: Record<VerifyPurpose, {
  title: string;
  description: string;
  successTitle: string;
  successDesc: string;
  successCta: string;
  icon: React.ReactNode;
  successIcon: React.ReactNode;
  gradient: string;
}> = {
  'email-verification': {
    title: 'Xác minh email',
    description: 'Nhập mã OTP 6 số đã gửi tới email của bạn để hoàn tất đăng ký.',
    successTitle: 'Email đã xác minh!',
    successDesc: 'Tài khoản của bạn đã sẵn sàng. Hãy thiết lập nhanh để bắt đầu.',
    successCta: 'Bắt đầu thiết lập',
    icon: <Mail className="w-7 h-7 text-[var(--primary)]" />,
    successIcon: <CheckCircle className="w-10 h-10 text-[var(--success)]" />,
    gradient: 'from-emerald-600 via-teal-600 to-cyan-700',
  },
  login: {
    title: 'Xác minh đăng nhập',
    description: 'Nhập mã OTP 6 số đã gửi tới email để xác nhận danh tính.',
    successTitle: 'Xác minh thành công!',
    successDesc: 'Chào mừng bạn quay lại. Đang chuyển hướng...',
    successCta: 'Vào trang chủ',
    icon: <Fingerprint className="w-7 h-7 text-[var(--primary)]" />,
    successIcon: <ShieldCheck className="w-10 h-10 text-[var(--success)]" />,
    gradient: 'from-[var(--primary)] via-blue-600 to-indigo-700',
  },
  action: {
    title: 'Xác nhận hành động',
    description: 'Hành động này yêu cầu xác minh bảo mật. Nhập mã OTP từ email.',
    successTitle: 'Đã xác nhận!',
    successDesc: 'Hành động đã được thực hiện thành công.',
    successCta: 'Tiếp tục',
    icon: <Shield className="w-7 h-7 text-[var(--primary)]" />,
    successIcon: <ShieldCheck className="w-10 h-10 text-[var(--success)]" />,
    gradient: 'from-violet-600 via-purple-600 to-indigo-700',
  },
};

export default function AuthVerifyOtp() {
  const nav = useAppNavigation();
  const toast = useToast();
  const { loginWithOtp } = useAuth();
  const [searchParams] = useSearchParams();

  // Read purpose and email from URL params
  const purposeParam = (searchParams.get('purpose') || 'email-verification') as VerifyPurpose;
  const purpose: VerifyPurpose = purposeConfig[purposeParam] ? purposeParam : 'email-verification';
  const emailParam = searchParams.get('email') || '';
  const config = purposeConfig[purpose];

  const [stage, setStage] = useState<VerifyStage>('input');
  const [email, setEmail] = useState(emailParam);
  const [showEmailEdit, setShowEmailEdit] = useState(!emailParam);
  const [emailError, setEmailError] = useState('');

  // OTP
  const [otpValues, setOtpValues] = useState<string[]>(['', '', '', '', '', '']);
  const [otpError, setOtpError] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [countdown, setCountdown] = useState(emailParam ? 60 : 0);
  const [attempts, setAttempts] = useState(0);
  const [locked, setLocked] = useState(false);
  const [lockCountdown, setLockCountdown] = useState(0);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const validateEmail = (val: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);

  // Countdown timers
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => setCountdown(c => c - 1), 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  useEffect(() => {
    if (lockCountdown <= 0) {
      if (locked) { setLocked(false); setAttempts(0); }
      return;
    }
    const timer = setInterval(() => setLockCountdown(c => c - 1), 1000);
    return () => clearInterval(timer);
  }, [lockCountdown, locked]);

  const formatCountdown = (s: number) =>
    `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  // Send OTP
  const handleSendOtp = async () => {
    if (!email.trim() || !validateEmail(email)) {
      setEmailError('Email không hợp lệ.');
      return;
    }

    setEmailError('');
    setOtpLoading(true);
    try {
      if (purpose === 'email-verification') {
        await authService.requestEmailVerification({ email });
      } else if (purpose === 'login') {
        await authService.requestLoginOtp({ email });
      } else {
        toast.info('Luồng OTP này chưa có endpoint riêng ở backend.');
      }

      setShowEmailEdit(false);
      setOtpValues(['', '', '', '', '', '']);
      setOtpError('');
      setCountdown(60);
      toast.info(`Mã OTP đã gửi tới ${email}`);
    } catch (error) {
      const message = getApiErrorMessage(error, 'Không thể gửi OTP lúc này.');
      setEmailError(message);
      toast.error(message);
    } finally {
      setOtpLoading(false);
    }
  };

  // OTP input handling
  const handleOtpChange = useCallback((index: number, value: string) => {
    if (locked) return;
    if (!/^\d*$/.test(value)) return;
    const newVals = [...otpValues];
    newVals[index] = value.slice(-1);
    setOtpValues(newVals);
    setOtpError('');
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  }, [otpValues, locked]);

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (locked) return;
    if (e.key === 'Backspace' && !otpValues[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    if (locked) return;
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length > 0) {
      const newVals = [...otpValues];
      for (let i = 0; i < 6; i++) {
        newVals[i] = pasted[i] || '';
      }
      setOtpValues(newVals);
      const focusIdx = Math.min(pasted.length, 5);
      otpRefs.current[focusIdx]?.focus();
      e.preventDefault();
    }
  };

  // Verify OTP
  const handleVerify = async () => {
    if (locked) return;
    const code = otpValues.join('');
    if (code.length < 6) return;

    setOtpLoading(true);
    try {
      if (purpose === 'email-verification') {
        await authService.verifyEmail({ email, code });
      } else if (purpose === 'login') {
        await loginWithOtp({ email, code }, true);
      } else {
        await new Promise((resolve) => setTimeout(resolve, 400));
      }

      setStage('success');
      setAttempts(0);
      setLocked(false);
      setLockCountdown(0);
      toast.success(config.successTitle);
    } catch (error) {
      const message = getApiErrorMessage(error, 'Mã OTP không đúng hoặc đã hết hạn.');
      const nextAttempts = attempts + 1;
      setAttempts(nextAttempts);

      if (message.toLowerCase().includes('quá số lần')) {
        setLocked(true);
        setLockCountdown(30);
      }

      setOtpError(message);
      toast.error(message);
    } finally {
      setOtpLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (countdown > 0) return;

    setOtpValues(['', '', '', '', '', '']);
    setOtpError('');
    setAttempts(0);
    setLocked(false);
    setLockCountdown(0);
    otpRefs.current[0]?.focus();
    await handleSendOtp();
  };

  const handleSuccessAction = () => {
    const next = searchParams.get('next');

    switch (purpose) {
      case 'email-verification':
        if (next === 'onboarding') {
          nav.goOnboardingCurrencyDate();
        } else {
          nav.goLogin();
        }
        break;
      case 'login':
        nav.goHome();
        break;
      case 'action':
        nav.goHome();
        break;
    }
  };

  const otpComplete = otpValues.every(v => v !== '');

  return (
    <div className="min-h-screen w-full flex bg-[var(--background)]">
      {/* Theme Switcher */}
      <div className="absolute top-4 right-4 z-20">
        <ThemeSwitcher />
      </div>

      {/* Desktop Illustration Panel */}
      <div className={`hidden lg:flex lg:w-[45%] xl:w-[50%] relative overflow-hidden bg-gradient-to-br ${config.gradient} items-center justify-center p-12`}>
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 right-10 w-72 h-72 rounded-full bg-white blur-3xl" />
          <div className="absolute bottom-20 left-10 w-96 h-96 rounded-full bg-white blur-3xl" />
        </div>
        <div className="relative z-10 max-w-md">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 rounded-[var(--radius-lg)] bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Wallet className="w-7 h-7 text-white" />
              </div>
              <span className="text-white/90 text-xl font-semibold">FinanceApp</span>
            </div>

            <h2 className="text-3xl text-white font-semibold mb-4">
              Xác minh bảo mật
            </h2>
            <p className="text-white/70 mb-10">
              Mỗi bước xác minh giúp bảo vệ tài khoản và dữ liệu tài chính của bạn an toàn hơn.
            </p>

            {/* Security features */}
            <div className="space-y-3">
              {[
                { icon: Shield, label: 'Mã hóa đầu cuối', desc: 'Dữ liệu được mã hóa AES-256' },
                { icon: Fingerprint, label: 'Xác thực đa lớp', desc: 'OTP + mật khẩu + sinh trắc học' },
                { icon: ShieldCheck, label: 'Bảo vệ giao dịch', desc: 'Cảnh báo hoạt động đáng ngờ' },
              ].map((f, i) => (
                <motion.div
                  key={f.label}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.3 + i * 0.15 }}
                  className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-[var(--radius-lg)] p-3"
                >
                  <div className="w-10 h-10 rounded-[var(--radius-md)] bg-white/15 flex items-center justify-center flex-shrink-0">
                    <f.icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{f.label}</p>
                    <p className="text-xs text-white/60">{f.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Main Panel */}
      <div className="flex-1 flex items-center justify-center p-5 sm:p-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md"
        >
          {/* Back button */}
          {stage !== 'success' && (
            <button
              onClick={() => nav.goLogin()}
              className="flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors mb-6"
            >
              <ArrowLeft className="w-4 h-4" />
              Quay lại đăng nhập
            </button>
          )}

          <AnimatePresence mode="wait">
            {/* ─── INPUT STAGE ─── */}
            {stage === 'input' && (
              <motion.div
                key="input"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
              >
                {/* Header */}
                <div className="text-center mb-8">
                  <div className="w-14 h-14 rounded-[var(--radius-xl)] bg-[var(--primary-light)] flex items-center justify-center mx-auto mb-4">
                    {config.icon}
                  </div>
                  <h1 className="text-2xl font-semibold text-[var(--text-primary)]">{config.title}</h1>
                  <p className="text-[var(--text-secondary)] mt-1 text-sm">{config.description}</p>
                </div>

                {/* Card */}
                <div className="bg-[var(--card)] rounded-[var(--radius-2xl)] border border-[var(--border)] shadow-[var(--shadow-lg)] p-6">
                  {/* Email display/edit */}
                  {showEmailEdit ? (
                    <div className="mb-5">
                      <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">Email</label>
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-[var(--text-tertiary)]" />
                        <input
                          type="email"
                          value={email}
                          onChange={e => { setEmail(e.target.value); setEmailError(''); }}
                          placeholder="you@example.com"
                          autoFocus
                          className={`w-full pl-11 pr-4 py-3 bg-[var(--input-background)] border rounded-[var(--radius-lg)] text-[var(--text-primary)] placeholder:text-[var(--text-disabled)] focus:outline-none focus:ring-2 transition-all ${
                            emailError ? 'border-[var(--danger)] focus:ring-[var(--danger)]/30' : 'border-[var(--border)] focus:ring-[var(--focus-ring)]/30 focus:border-[var(--primary)]'
                          }`}
                          onKeyDown={e => e.key === 'Enter' && handleSendOtp()}
                        />
                      </div>
                      {emailError && <p className="mt-1.5 text-xs text-[var(--danger)]">{emailError}</p>}
                      <button
                        onClick={handleSendOtp}
                        disabled={otpLoading}
                        className="w-full mt-3 py-3 bg-[var(--primary)] text-white rounded-[var(--radius-lg)] font-medium hover:bg-[var(--primary-hover)] disabled:opacity-60 transition-all flex items-center justify-center gap-2"
                      >
                        {otpLoading ? (
                          <>
                            <Loader2 className="w-4.5 h-4.5 animate-spin" />
                            Đang gửi...
                          </>
                        ) : (
                          <>
                            <Mail className="w-4 h-4" />
                            Gửi mã OTP
                          </>
                        )}
                      </button>
                    </div>
                  ) : (
                    <div className="mb-5">
                      <div className="flex items-center justify-between p-3 bg-[var(--surface)] rounded-[var(--radius-lg)]">
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-[var(--text-tertiary)]" />
                          <span className="text-sm text-[var(--text-primary)]">{email}</span>
                        </div>
                        <button
                          onClick={() => setShowEmailEdit(true)}
                          className="text-xs font-medium text-[var(--primary)] hover:underline"
                        >
                          Đổi email
                        </button>
                      </div>
                    </div>
                  )}

                  {/* OTP Section (only show if email confirmed) */}
                  {!showEmailEdit && (
                    <>
                      {/* Lock warning */}
                      {locked && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="flex gap-3 p-3 mb-4 bg-[var(--danger-light)] rounded-[var(--radius-lg)]"
                        >
                          <AlertTriangle className="w-4 h-4 text-[var(--danger)] flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-xs font-medium text-[var(--danger)]">Tạm khoá nhập OTP</p>
                            <p className="text-xs text-[var(--danger)]/80">
                              Thử lại sau <span className="font-mono font-medium">{formatCountdown(lockCountdown)}</span>
                            </p>
                          </div>
                        </motion.div>
                      )}

                      {/* OTP Inputs */}
                      <div className="flex justify-center gap-2.5 mb-4" onPaste={handleOtpPaste}>
                        {otpValues.map((val, i) => (
                          <input
                            key={i}
                            ref={el => { otpRefs.current[i] = el; }}
                            type="text"
                            inputMode="numeric"
                            maxLength={1}
                            value={val}
                            onChange={e => handleOtpChange(i, e.target.value)}
                            onKeyDown={e => handleOtpKeyDown(i, e)}
                            disabled={locked}
                            autoFocus={i === 0 && !!emailParam}
                            className={`w-12 h-14 text-center text-xl font-semibold bg-[var(--input-background)] border rounded-[var(--radius-lg)] text-[var(--text-primary)] focus:outline-none focus:ring-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                              otpError
                                ? 'border-[var(--danger)] focus:ring-[var(--danger)]/30'
                                : val
                                  ? 'border-[var(--primary)] focus:ring-[var(--focus-ring)]/30'
                                  : 'border-[var(--border)] focus:ring-[var(--focus-ring)]/30 focus:border-[var(--primary)]'
                            }`}
                          />
                        ))}
                      </div>

                      {otpError && (
                        <p className="text-xs text-[var(--danger)] text-center mb-3">{otpError}</p>
                      )}

                      {/* Countdown + Resend */}
                      <div className="text-center mb-5">
                        {countdown > 0 ? (
                          <p className="text-xs text-[var(--text-tertiary)]">
                            Gửi lại sau <span className="font-mono font-medium text-[var(--text-secondary)]">{formatCountdown(countdown)}</span>
                          </p>
                        ) : (
                          <button
                            onClick={handleResendOtp}
                            className="text-xs font-medium text-[var(--primary)] hover:underline inline-flex items-center gap-1"
                          >
                            <RotateCcw className="w-3 h-3" />
                            Gửi lại mã
                          </button>
                        )}
                      </div>

                      {/* Attempts indicator */}
                      {attempts > 0 && !locked && (
                        <div className="flex justify-center gap-1 mb-4">
                          {[0, 1, 2, 3, 4].map(i => (
                            <div
                              key={i}
                              className={`w-2 h-2 rounded-full transition-all ${
                                i < attempts ? 'bg-[var(--danger)]' : 'bg-[var(--border)]'
                              }`}
                            />
                          ))}
                        </div>
                      )}

                      {/* Hint */}
                      <div className="flex gap-3 p-3 mb-5 bg-[var(--surface)] rounded-[var(--radius-lg)]">
                        <Shield className="w-4 h-4 text-[var(--text-tertiary)] flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs text-[var(--text-tertiary)]">
                            Mã demo: <span className="font-mono font-medium text-[var(--text-secondary)]">123456</span>
                          </p>
                          <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
                            Hỗ trợ paste mã từ clipboard
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={handleVerify}
                        disabled={!otpComplete || otpLoading || locked}
                        className="w-full py-3 bg-[var(--primary)] text-white rounded-[var(--radius-lg)] font-medium hover:bg-[var(--primary-hover)] disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                      >
                        {otpLoading ? (
                          <>
                            <Loader2 className="w-4.5 h-4.5 animate-spin" />
                            Đang xác minh...
                          </>
                        ) : (
                          <>
                            <ShieldCheck className="w-4 h-4" />
                            Xác minh
                          </>
                        )}
                      </button>
                    </>
                  )}
                </div>

                {/* Footer */}
                <div className="mt-8 text-center space-y-2">
                  <p className="text-sm text-[var(--text-secondary)]">
                    Không nhận được mã?{' '}
                    <button
                      onClick={() => toast.info('Kiểm tra thư mục Spam hoặc liên hệ hỗ trợ.')}
                      className="font-medium text-[var(--primary)] hover:underline"
                    >
                      Cần trợ giúp?
                    </button>
                  </p>
                  <p className="text-xs text-[var(--text-tertiary)]">
                    <Link to="/auth/login" className="text-[var(--primary)] hover:underline">
                      Quay lại đăng nhập
                    </Link>
                    {' · '}
                    <Link to="/auth/register" className="text-[var(--primary)] hover:underline">
                      Tạo tài khoản mới
                    </Link>
                  </p>
                </div>
              </motion.div>
            )}

            {/* ─── SUCCESS STAGE ─── */}
            {stage === 'success' && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', damping: 20, stiffness: 300 }}
              >
                <div className="bg-[var(--card)] rounded-[var(--radius-2xl)] border border-[var(--border)] shadow-[var(--shadow-lg)] p-8 text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', damping: 12, stiffness: 200, delay: 0.15 }}
                  >
                    <div className="w-20 h-20 rounded-full bg-[var(--success-light)] flex items-center justify-center mx-auto mb-6">
                      {config.successIcon}
                    </div>
                  </motion.div>

                  <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-2">
                    {config.successTitle}
                  </h2>
                  <p className="text-sm text-[var(--text-secondary)] mb-2">
                    {config.successDesc}
                  </p>
                  {email && (
                    <p className="text-xs text-[var(--text-tertiary)] mb-8">
                      Email: <span className="font-medium text-[var(--text-secondary)]">{email}</span>
                    </p>
                  )}

                  {/* Checkmarks */}
                  <div className="space-y-2 mb-8 text-left max-w-xs mx-auto">
                    {[
                      'Mã OTP đã xác minh',
                      purpose === 'email-verification' ? 'Email đã xác nhận' : 'Danh tính đã xác nhận',
                      'Tài khoản đã sẵn sàng',
                    ].map((text, i) => (
                      <motion.div
                        key={text}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 + i * 0.15 }}
                        className="flex items-center gap-2"
                      >
                        <CheckCircle className="w-4 h-4 text-[var(--success)]" />
                        <span className="text-sm text-[var(--text-primary)]">{text}</span>
                      </motion.div>
                    ))}
                  </div>

                  <button
                    onClick={handleSuccessAction}
                    className="w-full py-3.5 bg-[var(--primary)] text-white rounded-[var(--radius-lg)] font-medium hover:bg-[var(--primary-hover)] transition-colors flex items-center justify-center gap-2"
                  >
                    {config.successCta}
                    <Sparkles className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => nav.goHome()}
                    className="w-full mt-3 py-3 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                  >
                    Về trang chủ
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}

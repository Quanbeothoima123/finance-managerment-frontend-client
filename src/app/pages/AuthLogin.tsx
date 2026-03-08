import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Link } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import {
  Mail, Lock, Eye, EyeOff, Loader2, ChevronRight,
  Wallet, TrendingUp, PiggyBank, BarChart3, Shield
} from 'lucide-react';
import { useAppNavigation } from '../hooks/useAppNavigation';
import { useToast } from '../contexts/ToastContext';
import { ThemeSwitcher } from '../components/ThemeSwitcher';
import { useAuth } from '../hooks/useAuth';
import { authService } from '../services/authService';
import { getApiErrorMessage } from '../utils/authError';

type AuthTab = 'password' | 'otp';
type OtpStage = 'email' | 'verify';

export default function AuthLogin() {
  const nav = useAppNavigation();
  const toast = useToast();
  const { loginWithPassword, loginWithOtp } = useAuth();

  // Tab
  const [tab, setTab] = useState<AuthTab>('password');

  // Password login
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [loading, setLoading] = useState(false);

  // OTP login
  const [otpEmail, setOtpEmail] = useState('');
  const [otpStage, setOtpStage] = useState<OtpStage>('email');
  const [otpValues, setOtpValues] = useState<string[]>(['', '', '', '', '', '']);
  const [otpError, setOtpError] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [otpEmailError, setOtpEmailError] = useState('');
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Forgot password
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);

  // Countdown timer for OTP
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => setCountdown(c => c - 1), 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const validateEmail = (val: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);

  // Password login handler
  const handlePasswordLogin = async () => {
    const newErrors: typeof errors = {};
    if (!email.trim()) newErrors.email = 'Vui lòng nhập email.';
    else if (!validateEmail(email)) newErrors.email = 'Email không hợp lệ.';
    if (!password.trim()) newErrors.password = 'Vui lòng nhập mật khẩu.';
    else if (password.length < 8) newErrors.password = 'Mật khẩu tối thiểu 8 ký tự.';
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setLoading(true);
    try {
      await loginWithPassword({ email, password }, rememberMe);
      toast.success('Đăng nhập thành công!');
      nav.goHome();
    } catch (error) {
      const message = getApiErrorMessage(error, 'Đăng nhập thất bại.');
      setErrors((prev) => ({ ...prev, password: message }));

      if (message.toLowerCase().includes('chưa xác minh email')) {
        try {
          await authService.requestEmailVerification({ email });
          setTab('otp');
          setOtpEmail(email);
          setOtpStage('verify');
          setOtpValues(['', '', '', '', '', '']);
          setOtpError('');
          setCountdown(60);
          toast.info('Tài khoản chưa xác minh. Mã OTP đã được gửi lại tới email của bạn.');
          return;
        } catch {
          // fall through to show original error
        }
      }

      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  // Send OTP handler
  const handleSendOtp = async () => {
    if (!otpEmail.trim() || !validateEmail(otpEmail)) {
      setOtpEmailError('Email không hợp lệ.');
      return;
    }

    setOtpEmailError('');
    setOtpLoading(true);

    try {
      await authService.requestLoginOtp({ email: otpEmail });
      setOtpValues(['', '', '', '', '', '']);
      setOtpError('');
      setOtpStage('verify');
      setCountdown(60);
      toast.info('Mã OTP đã gửi tới email của bạn.');
    } catch (error) {
      const message = getApiErrorMessage(error, 'Không thể gửi OTP lúc này.');
      setOtpEmailError(message);
      toast.error(message);
    } finally {
      setOtpLoading(false);
    }
  };

  // Verify OTP handler
  const handleVerifyOtp = async () => {
    const code = otpValues.join('');
    if (code.length < 6) return;

    setOtpLoading(true);
    try {
      await loginWithOtp({ email: otpEmail, code }, rememberMe);
      toast.success('Đăng nhập thành công!');
      nav.goHome();
    } catch (error) {
      const message = getApiErrorMessage(error, 'Mã OTP không đúng hoặc đã hết hạn.');
      setOtpError(message);
      toast.error(message);
    } finally {
      setOtpLoading(false);
    }
  };

  // OTP input handling
  const handleOtpChange = useCallback((index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newValues = [...otpValues];
    newValues[index] = value.slice(-1);
    setOtpValues(newValues);
    setOtpError('');
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  }, [otpValues]);

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otpValues[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length > 0) {
      const newValues = [...otpValues];
      for (let i = 0; i < 6; i++) {
        newValues[i] = pasted[i] || '';
      }
      setOtpValues(newValues);
      const focusIdx = Math.min(pasted.length, 5);
      otpRefs.current[focusIdx]?.focus();
      e.preventDefault();
    }
  };

  // OAuth handler
  const handleOAuth = (provider: string) => {
    toast.info(`Đang chuyển hướng đến ${provider}...`);
    setTimeout(() => {
      toast.success('Đăng nhập thành công!');
      nav.goHome();
    }, 1500);
  };

  // Forgot password handler
  const handleForgotPassword = async () => {
    if (!forgotEmail.trim() || !validateEmail(forgotEmail)) return;

    setForgotLoading(true);
    try {
      await authService.requestForgotPassword({ email: forgotEmail });
      setForgotSent(true);
      toast.success('Đã gửi mã đặt lại mật khẩu tới email của bạn.');
    } catch (error) {
      const message = getApiErrorMessage(error, 'Không thể gửi email đặt lại mật khẩu.');
      toast.error(message);
    } finally {
      setForgotLoading(false);
    }
  };

  const otpComplete = otpValues.every(v => v !== '');
  const formatCountdown = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  return (
    <div className="min-h-screen w-full flex bg-[var(--background)]">
      {/* Theme Switcher */}
      <div className="absolute top-4 right-4 z-20">
        <ThemeSwitcher />
      </div>

      {/* Desktop Left Illustration Panel */}
      <div className="hidden lg:flex lg:w-[45%] xl:w-[50%] relative overflow-hidden bg-gradient-to-br from-[var(--primary)] via-blue-600 to-indigo-700 items-center justify-center p-12">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 rounded-full bg-white blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 rounded-full bg-white blur-3xl" />
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
              Giữ mọi tài khoản của bạn trong tầm mắt
            </h2>
            <p className="text-white/70 mb-10">
              Ngân sách, mục tiêu và báo cáo trong một nơi. Theo dõi thu chi dễ dàng mỗi ngày.
            </p>

            {/* Mini feature cards */}
            <div className="space-y-3">
              {[
                { icon: TrendingUp, label: 'Biểu đồ thu chi', desc: 'Trực quan hoá dòng tiền' },
                { icon: PiggyBank, label: 'Mục tiêu tiết kiệm', desc: 'Theo dõi tiến độ mỗi ngày' },
                { icon: BarChart3, label: 'Báo cáo chi tiết', desc: 'Weekly & Monthly recap' },
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

      {/* Main Form Panel */}
      <div className="flex-1 flex items-center justify-center p-5 sm:p-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md"
        >
          {/* Logo + Title */}
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-[var(--radius-xl)] bg-[var(--primary)] flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Wallet className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Đăng nhập</h1>
            <p className="text-[var(--text-secondary)] mt-1">Chào mừng bạn quay lại</p>
          </div>

          {/* Auth card */}
          <div className="bg-[var(--card)] rounded-[var(--radius-2xl)] border border-[var(--border)] shadow-[var(--shadow-lg)] overflow-hidden">
            {/* Segmented Control */}
            <div className="flex border-b border-[var(--border)]">
              {([
                { key: 'password' as AuthTab, label: 'Email & Mật khẩu' },
                { key: 'otp' as AuthTab, label: 'OTP Email' },
              ]).map(t => (
                <button
                  key={t.key}
                  onClick={() => { setTab(t.key); setErrors({}); setOtpError(''); }}
                  className={`flex-1 py-3.5 text-sm font-medium relative transition-colors ${
                    tab === t.key
                      ? 'text-[var(--primary)]'
                      : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
                  }`}
                >
                  {t.label}
                  {tab === t.key && (
                    <motion.div
                      layoutId="authTab"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--primary)]"
                    />
                  )}
                </button>
              ))}
            </div>

            <div className="p-6">
              <AnimatePresence mode="wait">
                {tab === 'password' ? (
                  <motion.div
                    key="password"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ duration: 0.2 }}
                  >
                    {/* Email field */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">Email</label>
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-[var(--text-tertiary)]" />
                        <input
                          type="email"
                          value={email}
                          onChange={e => { setEmail(e.target.value); setErrors(prev => ({ ...prev, email: undefined })); }}
                          placeholder="you@example.com"
                          className={`w-full pl-11 pr-4 py-3 bg-[var(--input-background)] border rounded-[var(--radius-lg)] text-[var(--text-primary)] placeholder:text-[var(--text-disabled)] focus:outline-none focus:ring-2 transition-all ${
                            errors.email ? 'border-[var(--danger)] focus:ring-[var(--danger)]/30' : 'border-[var(--border)] focus:ring-[var(--focus-ring)]/30 focus:border-[var(--primary)]'
                          }`}
                        />
                      </div>
                      {errors.email && <p className="mt-1.5 text-xs text-[var(--danger)]">{errors.email}</p>}
                    </div>

                    {/* Password field */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">Mật khẩu</label>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-[var(--text-tertiary)]" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={e => { setPassword(e.target.value); setErrors(prev => ({ ...prev, password: undefined })); }}
                          placeholder="Nhập mật khẩu"
                          className={`w-full pl-11 pr-12 py-3 bg-[var(--input-background)] border rounded-[var(--radius-lg)] text-[var(--text-primary)] placeholder:text-[var(--text-disabled)] focus:outline-none focus:ring-2 transition-all ${
                            errors.password ? 'border-[var(--danger)] focus:ring-[var(--danger)]/30' : 'border-[var(--border)] focus:ring-[var(--focus-ring)]/30 focus:border-[var(--primary)]'
                          }`}
                          onKeyDown={e => e.key === 'Enter' && handlePasswordLogin()}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-[var(--radius-sm)] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors"
                        >
                          {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                        </button>
                      </div>
                      {errors.password && <p className="mt-1.5 text-xs text-[var(--danger)]">{errors.password}</p>}
                    </div>

                    {/* Remember + Forgot */}
                    <div className="flex items-center justify-between mb-6">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={rememberMe}
                          onChange={e => setRememberMe(e.target.checked)}
                          className="w-4 h-4 rounded border-[var(--border)] text-[var(--primary)] accent-[var(--primary)]"
                        />
                        <span className="text-sm text-[var(--text-secondary)]">Ghi nhớ đăng nhập</span>
                      </label>
                      <button
                        onClick={() => nav.goForgotPassword()}
                        className="text-sm font-medium text-[var(--primary)] hover:underline"
                      >
                        Quên mật khẩu?
                      </button>
                    </div>

                    {/* Login button */}
                    <button
                      onClick={handlePasswordLogin}
                      disabled={loading}
                      className="w-full py-3 bg-[var(--primary)] text-white rounded-[var(--radius-lg)] font-medium hover:bg-[var(--primary-hover)] disabled:opacity-60 transition-all flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4.5 h-4.5 animate-spin" />
                          Đang đăng nhập...
                        </>
                      ) : (
                        'Đăng nhập'
                      )}
                    </button>
                  </motion.div>
                ) : (
                  <motion.div
                    key="otp"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <AnimatePresence mode="wait">
                      {otpStage === 'email' ? (
                        <motion.div
                          key="otp-email"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                        >
                          <div className="mb-4">
                            <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">Email đã đăng ký</label>
                            <div className="relative">
                              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-[var(--text-tertiary)]" />
                              <input
                                type="email"
                                value={otpEmail}
                                onChange={e => { setOtpEmail(e.target.value); setOtpEmailError(''); }}
                                placeholder="you@example.com"
                                className={`w-full pl-11 pr-4 py-3 bg-[var(--input-background)] border rounded-[var(--radius-lg)] text-[var(--text-primary)] placeholder:text-[var(--text-disabled)] focus:outline-none focus:ring-2 transition-all ${
                                  otpEmailError ? 'border-[var(--danger)] focus:ring-[var(--danger)]/30' : 'border-[var(--border)] focus:ring-[var(--focus-ring)]/30 focus:border-[var(--primary)]'
                                }`}
                                onKeyDown={e => e.key === 'Enter' && handleSendOtp()}
                              />
                            </div>
                            {otpEmailError && <p className="mt-1.5 text-xs text-[var(--danger)]">{otpEmailError}</p>}
                          </div>
                          <button
                            onClick={handleSendOtp}
                            disabled={otpLoading}
                            className="w-full py-3 bg-[var(--primary)] text-white rounded-[var(--radius-lg)] font-medium hover:bg-[var(--primary-hover)] disabled:opacity-60 transition-all flex items-center justify-center gap-2"
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
                          <p className="text-center text-xs text-[var(--text-tertiary)] mt-3">
                            Hoặc{' '}
                            <Link to="/auth/verify-otp?purpose=login" className="text-[var(--primary)] hover:underline font-medium">
                              xác minh trang riêng
                            </Link>
                          </p>
                        </motion.div>
                      ) : (
                        <motion.div
                          key="otp-verify"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                        >
                          <div className="text-center mb-6">
                            <div className="w-12 h-12 rounded-full bg-[var(--primary-light)] flex items-center justify-center mx-auto mb-3">
                              <Shield className="w-6 h-6 text-[var(--primary)]" />
                            </div>
                            <p className="text-sm text-[var(--text-secondary)]">
                              Nhập mã OTP đã gửi tới
                            </p>
                            <p className="text-sm font-medium text-[var(--text-primary)] mt-0.5">{otpEmail}</p>
                          </div>

                          {/* OTP Input */}
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
                                className={`w-12 h-14 text-center text-xl font-semibold bg-[var(--input-background)] border rounded-[var(--radius-lg)] text-[var(--text-primary)] focus:outline-none focus:ring-2 transition-all ${
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
                          <div className="text-center mb-6">
                            {countdown > 0 ? (
                              <p className="text-xs text-[var(--text-tertiary)]">
                                Gửi lại sau <span className="font-mono font-medium text-[var(--text-secondary)]">{formatCountdown(countdown)}</span>
                              </p>
                            ) : (
                              <button
                                onClick={handleSendOtp}
                                className="text-xs font-medium text-[var(--primary)] hover:underline"
                              >
                                Gửi lại mã
                              </button>
                            )}
                          </div>

                          <div className="flex gap-3">
                            <button
                              onClick={() => { setOtpStage('email'); setOtpValues(['', '', '', '', '', '']); setOtpError(''); }}
                              className="px-4 py-3 rounded-[var(--radius-lg)] border border-[var(--border)] text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--surface)] transition-colors"
                            >
                              Quay lại
                            </button>
                            <button
                              onClick={handleVerifyOtp}
                              disabled={!otpComplete || otpLoading}
                              className="flex-1 py-3 bg-[var(--primary)] text-white rounded-[var(--radius-lg)] font-medium hover:bg-[var(--primary-hover)] disabled:opacity-60 transition-all flex items-center justify-center gap-2"
                            >
                              {otpLoading ? (
                                <>
                                  <Loader2 className="w-4.5 h-4.5 animate-spin" />
                                  Đang xác nhận...
                                </>
                              ) : (
                                'Xác nhận đăng nhập'
                              )}
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* OAuth Divider & Buttons */}
          <div className="mt-6">
            <div className="flex items-center gap-4 mb-5">
              <div className="flex-1 h-px bg-[var(--border)]" />
              <span className="text-xs text-[var(--text-tertiary)]">Hoặc tiếp tục với</span>
              <div className="flex-1 h-px bg-[var(--border)]" />
            </div>
            <div className="space-y-2.5">
              <button
                onClick={() => handleOAuth('Google')}
                className="w-full flex items-center justify-center gap-3 py-3 bg-[var(--card)] border border-[var(--border)] rounded-[var(--radius-lg)] text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--surface)] transition-colors shadow-[var(--shadow-sm)]"
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Tiếp tục với Google
              </button>
              <button
                onClick={() => handleOAuth('Apple')}
                className="w-full flex items-center justify-center gap-3 py-3 bg-[var(--card)] border border-[var(--border)] rounded-[var(--radius-lg)] text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--surface)] transition-colors shadow-[var(--shadow-sm)]"
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
                  <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                </svg>
                Tiếp tục với Apple
              </button>
              <button
                onClick={() => handleOAuth('Facebook')}
                className="w-full flex items-center justify-center gap-3 py-3 bg-[var(--card)] border border-[var(--border)] rounded-[var(--radius-lg)] text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--surface)] transition-colors shadow-[var(--shadow-sm)]"
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5">
                  <path fill="#1877F2" d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
                Tiếp tục với Facebook
              </button>
            </div>
          </div>

          {/* Footer */}
          <p className="text-center text-sm text-[var(--text-secondary)] mt-8">
            Chưa có tài khoản?{' '}
            <Link to="/auth/register" className="font-medium text-[var(--primary)] hover:underline">
              Đăng ký ngay
            </Link>
          </p>
        </motion.div>
      </div>

      {/* Forgot Password Bottom Sheet */}
      <AnimatePresence>
        {showForgot && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center" onClick={() => { setShowForgot(false); setForgotSent(false); }}>
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-[var(--card)] w-full max-w-md rounded-t-[var(--radius-2xl)] sm:rounded-[var(--radius-2xl)] overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-6">
                {!forgotSent ? (
                  <>
                    <h3 className="font-semibold text-[var(--text-primary)] mb-2">Quên mật khẩu?</h3>
                    <p className="text-sm text-[var(--text-secondary)] mb-5">
                      Nhập email đã đăng ký, chúng tôi sẽ gửi hướng dẫn đặt lại mật khẩu.
                    </p>
                    <div className="relative mb-4">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-[var(--text-tertiary)]" />
                      <input
                        type="email"
                        value={forgotEmail}
                        onChange={e => setForgotEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="w-full pl-11 pr-4 py-3 bg-[var(--input-background)] border border-[var(--border)] rounded-[var(--radius-lg)] text-[var(--text-primary)] placeholder:text-[var(--text-disabled)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]/30 focus:border-[var(--primary)]"
                      />
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={() => { setShowForgot(false); setForgotSent(false); }}
                        className="flex-1 py-3 rounded-[var(--radius-lg)] border border-[var(--border)] text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--surface)] transition-colors"
                      >
                        Huỷ
                      </button>
                      <button
                        onClick={handleForgotPassword}
                        disabled={!forgotEmail.trim() || !validateEmail(forgotEmail) || forgotLoading}
                        className="flex-1 py-3 bg-[var(--primary)] text-white rounded-[var(--radius-lg)] font-medium hover:bg-[var(--primary-hover)] disabled:opacity-60 transition-all flex items-center justify-center gap-2"
                      >
                        {forgotLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Gửi email'}
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-4">
                    <div className="w-14 h-14 rounded-full bg-[var(--success-light)] flex items-center justify-center mx-auto mb-4">
                      <Mail className="w-7 h-7 text-[var(--success)]" />
                    </div>
                    <h3 className="font-semibold text-[var(--text-primary)] mb-2">Đã gửi email!</h3>
                    <p className="text-sm text-[var(--text-secondary)] mb-6">
                      Kiểm tra hộp thư <span className="font-medium">{forgotEmail}</span> để đặt lại mật khẩu.
                    </p>
                    <button
                      onClick={() => { setShowForgot(false); setForgotSent(false); }}
                      className="w-full py-3 bg-[var(--primary)] text-white rounded-[var(--radius-lg)] font-medium hover:bg-[var(--primary-hover)] transition-colors"
                    >
                      Quay lại đăng nhập
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
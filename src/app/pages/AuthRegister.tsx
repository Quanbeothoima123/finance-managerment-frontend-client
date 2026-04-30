import React, {
  useState,
  useMemo,
  useRef,
  useCallback,
  useEffect,
} from "react";
import { Link } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  User,
  Calendar,
  CheckCircle,
  Wallet,
  TrendingUp,
  PiggyBank,
  BarChart3,
  Sparkles,
  Shield,
  RotateCcw,
  ArrowLeft,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAppNavigation } from "../hooks/useAppNavigation";
import { useToast } from "../contexts/ToastContext";
import { ThemeSwitcher } from "../components/ThemeSwitcher";
import { LanguageSwitcher } from "../components/LanguageSwitcher";
import { useAuth } from "../hooks/useAuth";
import { authService } from "../services/authService";
import { getApiErrorMessage } from "../utils/authError";

type PasswordStrength = "weak" | "medium" | "strong";

function getPasswordStrength(pw: string): PasswordStrength {
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^a-zA-Z\d]/.test(pw)) score++;
  if (score <= 2) return "weak";
  if (score <= 3) return "medium";
  return "strong";
}

export default function AuthRegister() {
  const nav = useAppNavigation();
  const toast = useToast();
  const { loginWithPassword } = useAuth();
  const { t } = useTranslation("auth");

  // Form
  const [displayName, setDisplayName] = useState("");
  const [dob, setDob] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  // Step state: 'form' → 'otp' → 'success'
  type RegisterStep = "form" | "otp" | "success";
  const [step, setStep] = useState<RegisterStep>("form");

  // OTP state
  const [otpValues, setOtpValues] = useState<string[]>([
    "",
    "",
    "",
    "",
    "",
    "",
  ]);
  const [otpError, setOtpError] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const validateEmail = (val: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);

  const passwordStrength = useMemo(() => {
    if (!password) return null;
    return getPasswordStrength(password);
  }, [password]);

  const strengthConfig: Record<
    PasswordStrength,
    { color: string; bg: string; width: string }
  > = {
    weak: {
      color: "text-[var(--danger)]",
      bg: "bg-[var(--danger)]",
      width: "w-1/3",
    },
    medium: {
      color: "text-[var(--warning)]",
      bg: "bg-[var(--warning)]",
      width: "w-2/3",
    },
    strong: {
      color: "text-[var(--success)]",
      bg: "bg-[var(--success)]",
      width: "w-full",
    },
  };

  const handleRegister = async () => {
    const newErrors: Record<string, string> = {};
    if (!displayName.trim())
      newErrors.displayName = t("register.errors.display_name_required");
    if (!dob) newErrors.dob = t("register.errors.dob_required");
    if (!email.trim()) newErrors.email = t("register.errors.email_required");
    else if (!validateEmail(email)) newErrors.email = t("register.errors.email_invalid");
    if (!password) newErrors.password = t("register.errors.password_required");
    else if (password.length < 8)
      newErrors.password = t("register.errors.password_min");
    else if (!/^(?=.*[A-Za-z])(?=.*\d).+$/.test(password))
      newErrors.password = t("register.errors.password_alphanumeric");
    if (!confirmPassword)
      newErrors.confirmPassword = t("register.errors.confirm_required");
    else if (confirmPassword !== password)
      newErrors.confirmPassword = t("register.errors.confirm_mismatch");
    if (!agreedTerms)
      newErrors.agreedTerms = t("register.errors.terms_required");

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setLoading(true);
    try {
      await authService.register({
        displayName,
        birthDate: dob || null,
        email,
        password,
        confirmPassword,
        agreeToTerms: agreedTerms,
      });
      setStep("otp");
      setCountdown(60);
      toast.info(t("register.otp_sent"));
    } catch (error) {
      const message = getApiErrorMessage(error, t("register.errors.register_failed"));

      if (message.toLowerCase().includes("chưa xác minh")) {
        try {
          await authService.requestEmailVerification({ email });
          setStep("otp");
          setCountdown(60);
          toast.info(t("register.otp_sent"));
          return;
        } catch {
          // fall through to main error
        }
      }

      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  // OTP handlers
  const handleOtpChange = useCallback(
    (index: number, value: string) => {
      if (!/^\d*$/.test(value)) return;
      const newVals = [...otpValues];
      newVals[index] = value.slice(-1);
      setOtpValues(newVals);
      setOtpError("");
      if (value && index < 5) {
        otpRefs.current[index + 1]?.focus();
      }
    },
    [otpValues],
  );

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otpValues[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);
    if (pasted.length > 0) {
      const newVals = [...otpValues];
      for (let i = 0; i < 6; i++) {
        newVals[i] = pasted[i] || "";
      }
      setOtpValues(newVals);
      const focusIdx = Math.min(pasted.length, 5);
      otpRefs.current[focusIdx]?.focus();
      e.preventDefault();
    }
  };

  const handleVerifyOtp = async () => {
    const code = otpValues.join("");
    if (code.length < 6) return;

    setOtpLoading(true);
    try {
      await authService.verifyEmail({ email, code });
      await loginWithPassword({ email, password }, true);
      setStep("success");
      toast.success(t("otp.success"));
    } catch (error) {
      const message = getApiErrorMessage(
        error,
        t("register.errors.otp_invalid"),
      );
      setOtpError(message);
      toast.error(message);
    } finally {
      setOtpLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setOtpValues(["", "", "", "", "", ""]);
    setOtpError("");

    try {
      await authService.requestEmailVerification({ email });
      setCountdown(60);
      toast.info(t("register.otp_resent"));
    } catch (error) {
      const message = getApiErrorMessage(error, t("register.errors.otp_resend_failed"));
      toast.error(message);
    }
  };

  // Countdown timer
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const otpComplete = otpValues.every((v) => v !== "");
  const formatCountdown = (s: number) =>
    `${Math.floor(s / 60)
      .toString()
      .padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  // OAuth handler
  const handleOAuth = (provider: string) => {
    toast.info(t("oauth.redirecting", { provider }));
    setTimeout(() => {
      toast.success(t("register.success"));
      nav.goOnboardingCurrencyDate();
    }, 1500);
  };

  const clearError = (field: string) => {
    setErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  if (step === "success") {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[var(--background)] p-5">
        <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
          <LanguageSwitcher />
          <ThemeSwitcher />
        </div>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", damping: 20, stiffness: 300 }}
          className="w-full max-w-md text-center"
        >
          <div className="bg-[var(--card)] rounded-[var(--radius-2xl)] border border-[var(--border)] shadow-[var(--shadow-lg)] p-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{
                type: "spring",
                damping: 12,
                stiffness: 200,
                delay: 0.2,
              }}
            >
              <div className="w-20 h-20 rounded-full bg-[var(--success-light)] flex items-center justify-center mx-auto mb-6">
                <Sparkles className="w-10 h-10 text-[var(--success)]" />
              </div>
            </motion.div>
            <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-2">
              {t("register.account_ready_title")}
            </h2>
            <p className="text-sm text-[var(--text-secondary)] mb-8">
              {t("register.account_ready_desc")}
            </p>
            <button
              onClick={() => nav.goOnboardingCurrencyDate()}
              className="w-full py-3.5 bg-[var(--primary)] text-white rounded-[var(--radius-lg)] font-medium hover:bg-[var(--primary-hover)] transition-colors flex items-center justify-center gap-2"
            >
              {t("register.start_setup")}
              <Sparkles className="w-4 h-4" />
            </button>
            <button
              onClick={() => nav.goHome()}
              className="w-full mt-3 py-3 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
              {t("register.skip_to_home")}
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex bg-[var(--background)]">
      {/* Theme + Language Switchers */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
        <LanguageSwitcher />
        <ThemeSwitcher />
      </div>

      {/* Desktop Left Illustration Panel */}
      <div className="hidden lg:flex lg:w-[45%] xl:w-[50%] relative overflow-hidden bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 items-center justify-center p-12">
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
              <span className="text-white/90 text-xl font-semibold">
                {t('app_name')}
              </span>
            </div>
            <h2 className="text-3xl text-white font-semibold mb-4">
              {t("register.hero_title")}
            </h2>
            <p className="text-white/70 mb-10">
              {t("register.hero_desc")}
            </p>

            {/* Steps */}
            <div className="space-y-4">
              {[
                {
                  num: "1",
                  label: t("register.quick_setup_steps.step1"),
                  desc: t("register.quick_setup_steps.step1_desc"),
                },
                {
                  num: "2",
                  label: t("register.quick_setup_steps.step2"),
                  desc: t("register.quick_setup_steps.step2_desc"),
                },
                {
                  num: "3",
                  label: t("register.quick_setup_steps.step3"),
                  desc: t("register.quick_setup_steps.step3_desc"),
                },
              ].map((s, i) => (
                <motion.div
                  key={s.num}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.3 + i * 0.15 }}
                  className="flex items-center gap-4"
                >
                  <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0 text-white font-semibold">
                    {s.num}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{s.label}</p>
                    <p className="text-xs text-white/60">{s.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Main Form Panel */}
      <div className="flex-1 flex items-start sm:items-center justify-center p-5 sm:p-8 overflow-y-auto">
        <AnimatePresence mode="wait">
          {step === "form" ? (
            <motion.div
              key="form-step"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.3 }}
              className="w-full max-w-md py-4"
            >
              {/* Logo + Title */}
              <div className="text-center mb-8">
                <div className="w-14 h-14 rounded-[var(--radius-xl)] bg-[var(--primary)] flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <Wallet className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
                  {t("register.title")}
                </h1>
                <p className="text-[var(--text-secondary)] mt-1">
                  {t("register.subtitle")}
                </p>
              </div>

              {/* Register Card */}
              <div className="bg-[var(--card)] rounded-[var(--radius-2xl)] border border-[var(--border)] shadow-[var(--shadow-lg)] p-6">
                {/* Display Name */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">
                    {t("register.display_name_label")}
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-[var(--text-tertiary)]" />
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => {
                        setDisplayName(e.target.value);
                        clearError("displayName");
                      }}
                      placeholder={t("register.display_name_placeholder")}
                      className={`w-full pl-11 pr-4 py-3 bg-[var(--input-background)] border rounded-[var(--radius-lg)] text-[var(--text-primary)] placeholder:text-[var(--text-disabled)] focus:outline-none focus:ring-2 transition-all ${
                        errors.displayName
                          ? "border-[var(--danger)] focus:ring-[var(--danger)]/30"
                          : "border-[var(--border)] focus:ring-[var(--focus-ring)]/30 focus:border-[var(--primary)]"
                      }`}
                    />
                  </div>
                  {errors.displayName ? (
                    <p className="mt-1.5 text-xs text-[var(--danger)]">
                      {errors.displayName}
                    </p>
                  ) : (
                    <p className="mt-1.5 text-xs text-[var(--text-tertiary)]">
                      {t("register.display_name_hint")}
                    </p>
                  )}
                </div>

                {/* Date of Birth */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">
                    {t("register.dob_label")}
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-[var(--text-tertiary)]" />
                    <input
                      type="date"
                      value={dob}
                      onChange={(e) => {
                        setDob(e.target.value);
                        clearError("dob");
                      }}
                      max="2012-01-01"
                      className={`w-full pl-11 pr-4 py-3 bg-[var(--input-background)] border rounded-[var(--radius-lg)] text-[var(--text-primary)] placeholder:text-[var(--text-disabled)] focus:outline-none focus:ring-2 transition-all ${
                        errors.dob
                          ? "border-[var(--danger)] focus:ring-[var(--danger)]/30"
                          : "border-[var(--border)] focus:ring-[var(--focus-ring)]/30 focus:border-[var(--primary)]"
                      }`}
                    />
                  </div>
                  {errors.dob ? (
                    <p className="mt-1.5 text-xs text-[var(--danger)]">
                      {errors.dob}
                    </p>
                  ) : (
                    <p className="mt-1.5 text-xs text-[var(--text-tertiary)]">
                      {t("register.dob_hint")}
                    </p>
                  )}
                </div>

                {/* Email */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">
                    {t("register.email_label")}
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-[var(--text-tertiary)]" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        clearError("email");
                      }}
                      placeholder={t("register.email_placeholder")}
                      className={`w-full pl-11 pr-4 py-3 bg-[var(--input-background)] border rounded-[var(--radius-lg)] text-[var(--text-primary)] placeholder:text-[var(--text-disabled)] focus:outline-none focus:ring-2 transition-all ${
                        errors.email
                          ? "border-[var(--danger)] focus:ring-[var(--danger)]/30"
                          : "border-[var(--border)] focus:ring-[var(--focus-ring)]/30 focus:border-[var(--primary)]"
                      }`}
                    />
                  </div>
                  {errors.email && (
                    <p className="mt-1.5 text-xs text-[var(--danger)]">
                      {errors.email}
                    </p>
                  )}
                </div>

                {/* Password */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">
                    {t("register.password_label")}
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-[var(--text-tertiary)]" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        clearError("password");
                      }}
                      placeholder={t("register.password_placeholder")}
                      className={`w-full pl-11 pr-12 py-3 bg-[var(--input-background)] border rounded-[var(--radius-lg)] text-[var(--text-primary)] placeholder:text-[var(--text-disabled)] focus:outline-none focus:ring-2 transition-all ${
                        errors.password
                          ? "border-[var(--danger)] focus:ring-[var(--danger)]/30"
                          : "border-[var(--border)] focus:ring-[var(--focus-ring)]/30 focus:border-[var(--primary)]"
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-[var(--radius-sm)] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4.5 h-4.5" />
                      ) : (
                        <Eye className="w-4.5 h-4.5" />
                      )}
                    </button>
                  </div>
                  {errors.password ? (
                    <p className="mt-1.5 text-xs text-[var(--danger)]">
                      {errors.password}
                    </p>
                  ) : (
                    <p className="mt-1.5 text-xs text-[var(--text-tertiary)]">
                      {t("register.password_hint")}
                    </p>
                  )}

                  {/* Password Strength Meter */}
                  {password && passwordStrength && (
                    <div className="mt-2">
                      <div className="h-1.5 bg-[var(--border)] rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${strengthConfig[passwordStrength].bg} ${strengthConfig[passwordStrength].width}`}
                        />
                      </div>
                      <p
                        className={`text-xs mt-1 ${strengthConfig[passwordStrength].color}`}
                      >
                        {t("register.strength_label")}{" "}
                        {t(`register.password_strength.${passwordStrength}`)}
                      </p>
                    </div>
                  )}
                </div>

                {/* Confirm Password */}
                <div className="mb-5">
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">
                    {t("register.confirm_password_label")}
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-[var(--text-tertiary)]" />
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        clearError("confirmPassword");
                      }}
                      placeholder={t("register.confirm_password_placeholder")}
                      className={`w-full pl-11 pr-12 py-3 bg-[var(--input-background)] border rounded-[var(--radius-lg)] text-[var(--text-primary)] placeholder:text-[var(--text-disabled)] focus:outline-none focus:ring-2 transition-all ${
                        errors.confirmPassword
                          ? "border-[var(--danger)] focus:ring-[var(--danger)]/30"
                          : "border-[var(--border)] focus:ring-[var(--focus-ring)]/30 focus:border-[var(--primary)]"
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-[var(--radius-sm)] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="w-4.5 h-4.5" />
                      ) : (
                        <Eye className="w-4.5 h-4.5" />
                      )}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="mt-1.5 text-xs text-[var(--danger)]">
                      {errors.confirmPassword}
                    </p>
                  )}
                  {confirmPassword &&
                    !errors.confirmPassword &&
                    confirmPassword === password && (
                      <div className="flex items-center gap-1 mt-1.5">
                        <CheckCircle className="w-3.5 h-3.5 text-[var(--success)]" />
                        <p className="text-xs text-[var(--success)]">
                          {t("register.password_match")}
                        </p>
                      </div>
                    )}
                </div>

                {/* Terms Checkbox */}
                <label className="flex items-start gap-3 mb-6 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreedTerms}
                    onChange={(e) => setAgreedTerms(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded border-[var(--border)] text-[var(--primary)] accent-[var(--primary)]"
                  />
                  <span className="text-sm text-[var(--text-secondary)]">
                    {t("register.terms_agree")}{" "}
                    <button
                      onClick={() => toast.info(t("register.terms_link"))}
                      className="text-[var(--primary)] hover:underline font-medium"
                    >
                      {t("register.terms_link")}
                    </button>{" "}
                    {t("register.and")}{" "}
                    <button
                      onClick={() => toast.info(t("register.privacy_link"))}
                      className="text-[var(--primary)] hover:underline font-medium"
                    >
                      {t("register.privacy_link")}
                    </button>
                  </span>
                </label>

                {/* Register button */}
                <button
                  onClick={handleRegister}
                  disabled={loading || !agreedTerms}
                  className="w-full py-3 bg-[var(--primary)] text-white rounded-[var(--radius-lg)] font-medium hover:bg-[var(--primary-hover)] disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4.5 h-4.5 animate-spin" />
                      {t("register.submitting")}
                    </>
                  ) : (
                    t("register.submit")
                  )}
                </button>
              </div>

              {/* OAuth Divider & Buttons */}
              <div className="mt-6">
                <div className="flex items-center gap-4 mb-5">
                  <div className="flex-1 h-px bg-[var(--border)]" />
                  <span className="text-xs text-[var(--text-tertiary)]">
                    {t("register.or_register_with")}
                  </span>
                  <div className="flex-1 h-px bg-[var(--border)]" />
                </div>
                <div className="space-y-2.5">
                  <button
                    onClick={() => handleOAuth("Google")}
                    className="w-full flex items-center justify-center gap-3 py-3 bg-[var(--card)] border border-[var(--border)] rounded-[var(--radius-lg)] text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--surface)] transition-colors shadow-[var(--shadow-sm)]"
                  >
                    <svg viewBox="0 0 24 24" className="w-5 h-5">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    {t("oauth.register_google")}
                  </button>
                  <button
                    onClick={() => handleOAuth("Apple")}
                    className="w-full flex items-center justify-center gap-3 py-3 bg-[var(--card)] border border-[var(--border)] rounded-[var(--radius-lg)] text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--surface)] transition-colors shadow-[var(--shadow-sm)]"
                  >
                    <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
                      <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                    </svg>
                    {t("oauth.register_apple")}
                  </button>
                  <button
                    onClick={() => handleOAuth("Facebook")}
                    className="w-full flex items-center justify-center gap-3 py-3 bg-[var(--card)] border border-[var(--border)] rounded-[var(--radius-lg)] text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--surface)] transition-colors shadow-[var(--shadow-sm)]"
                  >
                    <svg viewBox="0 0 24 24" className="w-5 h-5">
                      <path
                        fill="#1877F2"
                        d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
                      />
                    </svg>
                    {t("oauth.register_facebook")}
                  </button>
                </div>
              </div>

              {/* Footer */}
              <p className="text-center text-sm text-[var(--text-secondary)] mt-8 pb-4">
                {t("register.already_have_account")}{" "}
                <Link
                  to="/auth/login"
                  className="font-medium text-[var(--primary)] hover:underline"
                >
                  {t("register.login_link")}
                </Link>
              </p>
            </motion.div>
          ) : (
            /* ─── OTP VERIFICATION STEP ─── */
            <motion.div
              key="otp-step"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.3 }}
              className="w-full max-w-md py-4"
            >
              {/* Header */}
              <div className="text-center mb-8">
                <div className="w-14 h-14 rounded-[var(--radius-xl)] bg-[var(--primary)] flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <Mail className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
                  {t("register.otp_title")}
                </h1>
                <p className="text-[var(--text-secondary)] mt-2 text-sm max-w-xs mx-auto">
                  {t("register.otp_desc")}
                </p>
              </div>

              {/* OTP Card */}
              <div className="bg-[var(--card)] rounded-[var(--radius-2xl)] border border-[var(--border)] shadow-[var(--shadow-lg)] p-6">
                {/* Email display */}
                <div className="flex items-center justify-center gap-2 mb-6 p-3 bg-[var(--surface)] rounded-[var(--radius-lg)]">
                  <Mail className="w-4 h-4 text-[var(--text-tertiary)]" />
                  <span className="text-sm text-[var(--text-primary)] font-medium">
                    {email}
                  </span>
                </div>

                {/* OTP Input Grid */}
                <div
                  className="flex justify-center gap-2.5 mb-4"
                  onPaste={handleOtpPaste}
                >
                  {otpValues.map((val, i) => (
                    <input
                      key={i}
                      ref={(el) => {
                        otpRefs.current[i] = el;
                      }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={val}
                      onChange={(e) => handleOtpChange(i, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(i, e)}
                      autoFocus={i === 0}
                      className={`w-12 h-14 text-center text-xl font-semibold bg-[var(--input-background)] border rounded-[var(--radius-lg)] text-[var(--text-primary)] focus:outline-none focus:ring-2 transition-all ${
                        otpError
                          ? "border-[var(--danger)] focus:ring-[var(--danger)]/30"
                          : val
                            ? "border-[var(--primary)] focus:ring-[var(--focus-ring)]/30"
                            : "border-[var(--border)] focus:ring-[var(--focus-ring)]/30 focus:border-[var(--primary)]"
                      }`}
                    />
                  ))}
                </div>

                {otpError && (
                  <p className="text-xs text-[var(--danger)] text-center mb-3">
                    {otpError}
                  </p>
                )}

                {/* Countdown + Resend */}
                <div className="text-center mb-6">
                  {countdown > 0 ? (
                    <p className="text-xs text-[var(--text-tertiary)]">
                      {t("register.otp_no_code")}{" "}
                      <span className="font-medium text-[var(--text-secondary)]">
                        {t("register.otp_resend_after")} {formatCountdown(countdown)}
                      </span>
                    </p>
                  ) : (
                    <p className="text-xs text-[var(--text-tertiary)]">
                      {t("register.otp_no_code")}{" "}
                      <button
                        onClick={handleResendOtp}
                        className="font-medium text-[var(--primary)] hover:underline inline-flex items-center gap-1"
                      >
                        <RotateCcw className="w-3 h-3" />
                        {t("otp.resend")}
                      </button>
                    </p>
                  )}
                </div>

                {/* Verify button */}
                <button
                  onClick={handleVerifyOtp}
                  disabled={!otpComplete || otpLoading}
                  className="w-full py-3 bg-[var(--primary)] text-white rounded-[var(--radius-lg)] font-medium hover:bg-[var(--primary-hover)] disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                >
                  {otpLoading ? (
                    <>
                      <Loader2 className="w-4.5 h-4.5 animate-spin" />
                      {t("register.otp_verifying")}
                    </>
                  ) : (
                    t("register.otp_verify_continue")
                  )}
                </button>
              </div>

              {/* Back link */}
              <div className="mt-6 text-center">
                <button
                  onClick={() => {
                    setStep("form");
                    setOtpValues(["", "", "", "", "", ""]);
                    setOtpError("");
                  }}
                  className="inline-flex items-center gap-1.5 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  {t("register.otp_back")}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

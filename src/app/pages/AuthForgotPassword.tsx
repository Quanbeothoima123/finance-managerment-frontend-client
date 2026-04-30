import React, { useState, useRef, useEffect, useCallback } from "react";
import { Link } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  ArrowLeft,
  Shield,
  Wallet,
  CheckCircle,
  KeyRound,
  ShieldCheck,
  RotateCcw,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAppNavigation } from "../hooks/useAppNavigation";
import { useToast } from "../contexts/ToastContext";
import { ThemeSwitcher } from "../components/ThemeSwitcher";
import { LanguageSwitcher } from "../components/LanguageSwitcher";
import { authService } from "../services/authService";
import { getApiErrorMessage } from "../utils/authError";

type Step = "email" | "otp" | "newPassword" | "success";

export default function AuthForgotPassword() {
  const nav = useAppNavigation();
  const toast = useToast();
  const { t } = useTranslation("auth");

  const [step, setStep] = useState<Step>("email");

  // Step 1: Email
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [sendLoading, setSendLoading] = useState(false);

  // Step 2: OTP verify
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

  // Step 3: New password
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState<{
    newPassword?: string;
    confirm?: string;
  }>({});
  const [resetLoading, setResetLoading] = useState(false);
  const [resetToken, setResetToken] = useState("");

  const validateEmail = (val: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);

  // Countdown timer
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const formatCountdown = (s: number) =>
    `${Math.floor(s / 60)
      .toString()
      .padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  // Step 1: Send OTP
  const handleSendOtp = async () => {
    if (!email.trim()) {
      setEmailError(t("forgot_password.errors.email_required"));
      return;
    }
    if (!validateEmail(email)) {
      setEmailError(t("forgot_password.errors.email_invalid"));
      return;
    }

    setEmailError("");
    setSendLoading(true);
    try {
      await authService.requestForgotPassword({ email });
      setOtpValues(["", "", "", "", "", ""]);
      setOtpError("");
      setStep("otp");
      setCountdown(60);
      toast.info(t("forgot_password.email_sent"));
    } catch (error) {
      const message = getApiErrorMessage(error, t("forgot_password.errors.send_code_failed"));
      setEmailError(message);
      toast.error(message);
    } finally {
      setSendLoading(false);
    }
  };

  // Step 2: Verify OTP
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
      const data = await authService.verifyForgotPasswordOtp({ email, code });
      setResetToken(data.resetToken);
      setStep("newPassword");
      toast.success(t("otp.success"));
    } catch (error) {
      const message = getApiErrorMessage(
        error,
        t("forgot_password.errors.otp_invalid"),
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
      await authService.requestForgotPassword({ email });
      setCountdown(60);
      toast.info(t("forgot_password.otp_resent"));
    } catch (error) {
      const message = getApiErrorMessage(error, t("forgot_password.errors.otp_resend_failed"));
      toast.error(message);
    }
  };

  // Step 3: Reset password
  const getPasswordStrength = (
    pw: string,
  ): {
    level: "weak" | "medium" | "strong";
    color: string;
    bg: string;
    width: string;
  } => {
    let score = 0;
    if (pw.length >= 8) score++;
    if (pw.length >= 12) score++;
    if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
    if (/\d/.test(pw)) score++;
    if (/[^a-zA-Z\d]/.test(pw)) score++;
    if (score <= 2)
      return {
        level: "weak",
        color: "text-[var(--danger)]",
        bg: "bg-[var(--danger)]",
        width: "w-1/3",
      };
    if (score <= 3)
      return {
        level: "medium",
        color: "text-[var(--warning)]",
        bg: "bg-[var(--warning)]",
        width: "w-2/3",
      };
    return {
      level: "strong",
      color: "text-[var(--success)]",
      bg: "bg-[var(--success)]",
      width: "w-full",
    };
  };

  const handleResetPassword = async () => {
    const errs: typeof passwordErrors = {};
    if (!newPassword) errs.newPassword = t("forgot_password.errors.password_required");
    else if (newPassword.length < 8)
      errs.newPassword = t("forgot_password.errors.password_min");
    else if (!/^(?=.*[A-Za-z])(?=.*\d).+$/.test(newPassword))
      errs.newPassword = t("forgot_password.errors.password_alphanumeric");
    if (!confirmPassword) errs.confirm = t("forgot_password.errors.confirm_required");
    else if (confirmPassword !== newPassword)
      errs.confirm = t("forgot_password.errors.confirm_mismatch");
    setPasswordErrors(errs);
    if (Object.keys(errs).length > 0) return;

    if (!resetToken) {
      toast.error(t("forgot_password.errors.reset_failed"));
      setStep("email");
      return;
    }

    setResetLoading(true);
    try {
      await authService.resetPassword({
        email,
        resetToken,
        newPassword,
        confirmNewPassword: confirmPassword,
      });
      setStep("success");
      toast.success(t("forgot_password.success"));
    } catch (error) {
      const message = getApiErrorMessage(error, t("forgot_password.errors.reset_failed"));
      toast.error(message);
    } finally {
      setResetLoading(false);
    }
  };

  const otpComplete = otpValues.every((v) => v !== "");
  const pwStrength = newPassword ? getPasswordStrength(newPassword) : null;
  const stepIndex = ["email", "otp", "newPassword", "success"].indexOf(step);

  const stepConfigs: Record<Step, { title: string; subtitle: string; icon: React.ReactNode }> = {
    email: {
      title: t("forgot_password.title"),
      subtitle: t("forgot_password.subtitle"),
      icon: <Mail className="w-7 h-7 text-[var(--primary)]" />,
    },
    otp: {
      title: t("forgot_password.step_otp.label"),
      subtitle: t("forgot_password.step_otp.description"),
      icon: <Shield className="w-7 h-7 text-[var(--primary)]" />,
    },
    newPassword: {
      title: t("forgot_password.step_new_password.label"),
      subtitle: t("forgot_password.errors.password_hint"),
      icon: <KeyRound className="w-7 h-7 text-[var(--primary)]" />,
    },
    success: {
      title: t("forgot_password.step_success.title"),
      subtitle: t("forgot_password.step_success.description"),
      icon: <ShieldCheck className="w-7 h-7 text-[var(--success)]" />,
    },
  };

  const currentStep = stepConfigs[step];

  return (
    <div className="min-h-screen w-full flex bg-[var(--background)]">
      {/* Theme + Language Switchers */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
        <LanguageSwitcher />
        <ThemeSwitcher />
      </div>

      {/* Desktop Illustration Panel */}
      <div className="hidden lg:flex lg:w-[45%] xl:w-[50%] relative overflow-hidden bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 items-center justify-center p-12">
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
              <span className="text-white/90 text-xl font-semibold">
                {t('app_name')}
              </span>
            </div>
            <h2 className="text-3xl text-white font-semibold mb-4">
              {t("forgot_password.title")}
            </h2>

            {/* Steps visual */}
            <div className="space-y-4">
              {[
                {
                  num: 1,
                  label: t("forgot_password.step_email.label"),
                  desc: t("forgot_password.step_email.email_placeholder"),
                },
                {
                  num: 2,
                  label: t("forgot_password.step_otp.label"),
                  desc: t("forgot_password.step_otp.description"),
                },
                {
                  num: 3,
                  label: t("forgot_password.step_new_password.label"),
                  desc: t("forgot_password.step_new_password.new_password_placeholder"),
                },
              ].map((s, i) => {
                const isCompleted = stepIndex > i;
                const isCurrent = stepIndex === i;
                return (
                  <motion.div
                    key={s.num}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: 0.3 + i * 0.15 }}
                    className={`flex items-center gap-4 p-3 rounded-[var(--radius-lg)] transition-all ${
                      isCurrent ? "bg-white/15 backdrop-blur-sm" : ""
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                        isCompleted
                          ? "bg-white/30 backdrop-blur-sm"
                          : isCurrent
                            ? "bg-white/25 backdrop-blur-sm ring-2 ring-white/40"
                            : "bg-white/10 backdrop-blur-sm"
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle className="w-5 h-5 text-white" />
                      ) : (
                        <span
                          className={`text-sm font-semibold ${isCurrent ? "text-white" : "text-white/50"}`}
                        >
                          {s.num}
                        </span>
                      )}
                    </div>
                    <div>
                      <p
                        className={`text-sm font-medium ${isCurrent || isCompleted ? "text-white" : "text-white/50"}`}
                      >
                        {s.label}
                      </p>
                      <p
                        className={`text-xs ${isCurrent || isCompleted ? "text-white/70" : "text-white/30"}`}
                      >
                        {s.desc}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
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
          {/* Back button */}
          <button
            onClick={() => {
              if (step === "email") nav.goLogin();
              else if (step === "otp") setStep("email");
              else if (step === "newPassword") setStep("otp");
              else nav.goLogin();
            }}
            className="flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            {step === "email" || step === "success"
              ? t("forgot_password.back_to_login")
              : t("common:actions.back")}
          </button>

          {/* Progress bar */}
          <div className="flex gap-2 mb-8">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="flex-1 h-1 rounded-full overflow-hidden bg-[var(--border)]"
              >
                <motion.div
                  className="h-full bg-[var(--primary)] rounded-full"
                  initial={{ width: "0%" }}
                  animate={{ width: stepIndex >= i ? "100%" : "0%" }}
                  transition={{
                    duration: 0.4,
                    delay: stepIndex >= i ? i * 0.1 : 0,
                  }}
                />
              </div>
            ))}
          </div>

          {/* Header */}
          <div className="text-center mb-8">
            <div
              className={`w-14 h-14 rounded-[var(--radius-xl)] flex items-center justify-center mx-auto mb-4 ${
                step === "success"
                  ? "bg-[var(--success-light)]"
                  : "bg-[var(--primary-light)]"
              }`}
            >
              {currentStep.icon}
            </div>
            <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
              {currentStep.title}
            </h1>
            <p className="text-[var(--text-secondary)] mt-1 text-sm">
              {currentStep.subtitle}
            </p>
          </div>

          {/* Card */}
          <AnimatePresence mode="wait">
            {/* ─── STEP 1: EMAIL ─── */}
            {step === "email" && (
              <motion.div
                key="step-email"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.25 }}
                className="bg-[var(--card)] rounded-[var(--radius-2xl)] border border-[var(--border)] shadow-[var(--shadow-lg)] p-6"
              >
                <div className="mb-5">
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">
                    {t("forgot_password.step_email.label")}
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-[var(--text-tertiary)]" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setEmailError("");
                      }}
                      placeholder={t("forgot_password.step_email.email_placeholder")}
                      className={`w-full pl-11 pr-4 py-3 bg-[var(--input-background)] border rounded-[var(--radius-lg)] text-[var(--text-primary)] placeholder:text-[var(--text-disabled)] focus:outline-none focus:ring-2 transition-all ${
                        emailError
                          ? "border-[var(--danger)] focus:ring-[var(--danger)]/30"
                          : "border-[var(--border)] focus:ring-[var(--focus-ring)]/30 focus:border-[var(--primary)]"
                      }`}
                      onKeyDown={(e) => e.key === "Enter" && handleSendOtp()}
                      autoFocus
                    />
                  </div>
                  {emailError && (
                    <p className="mt-1.5 text-xs text-[var(--danger)]">
                      {emailError}
                    </p>
                  )}
                </div>

                <button
                  onClick={handleSendOtp}
                  disabled={sendLoading}
                  className="w-full py-3 bg-[var(--primary)] text-white rounded-[var(--radius-lg)] font-medium hover:bg-[var(--primary-hover)] disabled:opacity-60 transition-all flex items-center justify-center gap-2"
                >
                  {sendLoading ? (
                    <>
                      <Loader2 className="w-4.5 h-4.5 animate-spin" />
                      {t("login.sending")}
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4" />
                      {t("forgot_password.step_email.submit")}
                    </>
                  )}
                </button>
              </motion.div>
            )}

            {/* ─── STEP 2: OTP ─── */}
            {step === "otp" && (
              <motion.div
                key="step-otp"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
                className="bg-[var(--card)] rounded-[var(--radius-2xl)] border border-[var(--border)] shadow-[var(--shadow-lg)] p-6"
              >
                {/* OTP Inputs */}
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
                <div className="text-center mb-5">
                  {countdown > 0 ? (
                    <p className="text-xs text-[var(--text-tertiary)]">
                      {t("otp.resend_in", { seconds: formatCountdown(countdown) })}
                    </p>
                  ) : (
                    <button
                      onClick={handleResendOtp}
                      className="text-xs font-medium text-[var(--primary)] hover:underline inline-flex items-center gap-1"
                    >
                      <RotateCcw className="w-3 h-3" />
                      {t("otp.resend")}
                    </button>
                  )}
                </div>

                <button
                  onClick={handleVerifyOtp}
                  disabled={!otpComplete || otpLoading}
                  className="w-full py-3 bg-[var(--primary)] text-white rounded-[var(--radius-lg)] font-medium hover:bg-[var(--primary-hover)] disabled:opacity-60 transition-all flex items-center justify-center gap-2"
                >
                  {otpLoading ? (
                    <>
                      <Loader2 className="w-4.5 h-4.5 animate-spin" />
                      {t("register.otp_verifying")}
                    </>
                  ) : (
                    t("forgot_password.step_otp.submit")
                  )}
                </button>
              </motion.div>
            )}

            {/* ─── STEP 3: NEW PASSWORD ─── */}
            {step === "newPassword" && (
              <motion.div
                key="step-newpw"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
                className="bg-[var(--card)] rounded-[var(--radius-2xl)] border border-[var(--border)] shadow-[var(--shadow-lg)] p-6"
              >
                {/* New Password */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">
                    {t("forgot_password.step_new_password.new_password_label")}
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-[var(--text-tertiary)]" />
                    <input
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => {
                        setNewPassword(e.target.value);
                        setPasswordErrors((prev) => ({
                          ...prev,
                          newPassword: undefined,
                        }));
                      }}
                      placeholder={t("forgot_password.step_new_password.new_password_placeholder")}
                      autoFocus
                      className={`w-full pl-11 pr-12 py-3 bg-[var(--input-background)] border rounded-[var(--radius-lg)] text-[var(--text-primary)] placeholder:text-[var(--text-disabled)] focus:outline-none focus:ring-2 transition-all ${
                        passwordErrors.newPassword
                          ? "border-[var(--danger)] focus:ring-[var(--danger)]/30"
                          : "border-[var(--border)] focus:ring-[var(--focus-ring)]/30 focus:border-[var(--primary)]"
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-[var(--radius-sm)] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors"
                    >
                      {showNewPassword ? (
                        <EyeOff className="w-4.5 h-4.5" />
                      ) : (
                        <Eye className="w-4.5 h-4.5" />
                      )}
                    </button>
                  </div>
                  {passwordErrors.newPassword ? (
                    <p className="mt-1.5 text-xs text-[var(--danger)]">
                      {passwordErrors.newPassword}
                    </p>
                  ) : (
                    <p className="mt-1.5 text-xs text-[var(--text-tertiary)]">
                      {t("register.password_hint")}
                    </p>
                  )}

                  {/* Strength meter */}
                  {newPassword && pwStrength && (
                    <div className="mt-2">
                      <div className="h-1.5 bg-[var(--border)] rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${pwStrength.bg} ${pwStrength.width}`}
                        />
                      </div>
                      <p className={`text-xs mt-1 ${pwStrength.color}`}>
                        {t("register.strength_label")}{" "}
                        {t(`register.password_strength.${pwStrength.level}`)}
                      </p>
                    </div>
                  )}
                </div>

                {/* Confirm Password */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">
                    {t("forgot_password.step_new_password.confirm_password_label")}
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-[var(--text-tertiary)]" />
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        setPasswordErrors((prev) => ({
                          ...prev,
                          confirm: undefined,
                        }));
                      }}
                      placeholder={t("forgot_password.step_new_password.confirm_password_placeholder")}
                      className={`w-full pl-11 pr-12 py-3 bg-[var(--input-background)] border rounded-[var(--radius-lg)] text-[var(--text-primary)] placeholder:text-[var(--text-disabled)] focus:outline-none focus:ring-2 transition-all ${
                        passwordErrors.confirm
                          ? "border-[var(--danger)] focus:ring-[var(--danger)]/30"
                          : "border-[var(--border)] focus:ring-[var(--focus-ring)]/30 focus:border-[var(--primary)]"
                      }`}
                      onKeyDown={(e) =>
                        e.key === "Enter" && handleResetPassword()
                      }
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
                  {passwordErrors.confirm && (
                    <p className="mt-1.5 text-xs text-[var(--danger)]">
                      {passwordErrors.confirm}
                    </p>
                  )}
                  {confirmPassword &&
                    !passwordErrors.confirm &&
                    confirmPassword === newPassword && (
                      <div className="flex items-center gap-1 mt-1.5">
                        <CheckCircle className="w-3.5 h-3.5 text-[var(--success)]" />
                        <p className="text-xs text-[var(--success)]">
                          {t("register.password_match")}
                        </p>
                      </div>
                    )}
                </div>

                <button
                  onClick={handleResetPassword}
                  disabled={resetLoading}
                  className="w-full py-3 bg-[var(--primary)] text-white rounded-[var(--radius-lg)] font-medium hover:bg-[var(--primary-hover)] disabled:opacity-60 transition-all flex items-center justify-center gap-2"
                >
                  {resetLoading ? (
                    <>
                      <Loader2 className="w-4.5 h-4.5 animate-spin" />
                      {t("forgot_password.step_new_password.submitting")}
                    </>
                  ) : (
                    <>
                      <KeyRound className="w-4 h-4" />
                      {t("forgot_password.step_new_password.submit")}
                    </>
                  )}
                </button>
              </motion.div>
            )}

            {/* ─── STEP 4: SUCCESS ─── */}
            {step === "success" && (
              <motion.div
                key="step-success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: "spring", damping: 20, stiffness: 300 }}
                className="bg-[var(--card)] rounded-[var(--radius-2xl)] border border-[var(--border)] shadow-[var(--shadow-lg)] p-8 text-center"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{
                    type: "spring",
                    damping: 12,
                    stiffness: 200,
                    delay: 0.15,
                  }}
                >
                  <div className="w-20 h-20 rounded-full bg-[var(--success-light)] flex items-center justify-center mx-auto mb-6">
                    <ShieldCheck className="w-10 h-10 text-[var(--success)]" />
                  </div>
                </motion.div>

                <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-2">
                  {t("forgot_password.step_success.title")}
                </h2>
                <p className="text-sm text-[var(--text-secondary)] mb-8">
                  {t("forgot_password.step_success.description")}
                </p>

                <button
                  onClick={() => nav.goLogin()}
                  className="w-full py-3.5 bg-[var(--primary)] text-white rounded-[var(--radius-lg)] font-medium hover:bg-[var(--primary-hover)] transition-colors"
                >
                  {t("forgot_password.step_success.back_to_login")}
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Footer */}
          {step !== "success" && (
            <p className="text-center text-sm text-[var(--text-secondary)] mt-8">
              <Link
                to="/auth/login"
                className="font-medium text-[var(--primary)] hover:underline"
              >
                {t("forgot_password.back_to_login")}
              </Link>
            </p>
          )}
        </motion.div>
      </div>
    </div>
  );
}

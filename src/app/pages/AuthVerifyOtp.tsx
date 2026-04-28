import React, { useState, useRef, useEffect, useCallback } from "react";
import { Link, useSearchParams } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import {
  Mail,
  Loader2,
  ArrowLeft,
  Shield,
  RotateCcw,
  Wallet,
  CheckCircle,
  Sparkles,
  ShieldCheck,
  Fingerprint,
  AlertTriangle,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAppNavigation } from "../hooks/useAppNavigation";
import { useToast } from "../contexts/ToastContext";
import { ThemeSwitcher } from "../components/ThemeSwitcher";
import { LanguageSwitcher } from "../components/LanguageSwitcher";
import { useAuth } from "../hooks/useAuth";
import { authService } from "../services/authService";
import { getApiErrorMessage } from "../utils/authError";

type VerifyStage = "input" | "success" | "error";
type VerifyPurpose = "email-verification" | "login" | "action";

export default function AuthVerifyOtp() {
  const nav = useAppNavigation();
  const toast = useToast();
  const { loginWithOtp } = useAuth();
  const [searchParams] = useSearchParams();
  const { t } = useTranslation("auth");

  // Read purpose and email from URL params
  const purposeParam = (searchParams.get("purpose") ||
    "email-verification") as VerifyPurpose;

  const validPurposes: VerifyPurpose[] = ["email-verification", "login", "action"];
  const purpose: VerifyPurpose = validPurposes.includes(purposeParam)
    ? purposeParam
    : "email-verification";
  const emailParam = searchParams.get("email") || "";

  const purposeConfig: Record<
    VerifyPurpose,
    {
      title: string;
      description: string;
      successTitle: string;
      successDesc: string;
      successCta: string;
      icon: React.ReactNode;
      successIcon: React.ReactNode;
      gradient: string;
    }
  > = {
    "email-verification": {
      title: t("otp.title"),
      description: t("otp.description"),
      successTitle: t("otp.success"),
      successDesc: t("register.account_ready_desc"),
      successCta: t("register.start_setup"),
      icon: <Mail className="w-7 h-7 text-[var(--primary)]" />,
      successIcon: <CheckCircle className="w-10 h-10 text-[var(--success)]" />,
      gradient: "from-emerald-600 via-teal-600 to-cyan-700",
    },
    login: {
      title: t("login.title"),
      description: t("otp.description"),
      successTitle: t("login.success"),
      successDesc: t("login.subtitle"),
      successCta: t("common:nav.home"),
      icon: <Fingerprint className="w-7 h-7 text-[var(--primary)]" />,
      successIcon: <ShieldCheck className="w-10 h-10 text-[var(--success)]" />,
      gradient: "from-[var(--primary)] via-blue-600 to-indigo-700",
    },
    action: {
      title: t("otp.title"),
      description: t("otp.description"),
      successTitle: t("otp.success"),
      successDesc: t("login.subtitle"),
      successCta: t("common:actions.continue"),
      icon: <Shield className="w-7 h-7 text-[var(--primary)]" />,
      successIcon: <ShieldCheck className="w-10 h-10 text-[var(--success)]" />,
      gradient: "from-violet-600 via-purple-600 to-indigo-700",
    },
  };

  const config = purposeConfig[purpose];

  const [stage, setStage] = useState<VerifyStage>("input");
  const [email, setEmail] = useState(emailParam);
  const [showEmailEdit, setShowEmailEdit] = useState(!emailParam);
  const [emailError, setEmailError] = useState("");

  // OTP
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
  const [countdown, setCountdown] = useState(emailParam ? 60 : 0);
  const [attempts, setAttempts] = useState(0);
  const [locked, setLocked] = useState(false);
  const [lockCountdown, setLockCountdown] = useState(0);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const validateEmail = (val: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);

  // Countdown timers
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  useEffect(() => {
    if (lockCountdown <= 0) {
      if (locked) {
        setLocked(false);
        setAttempts(0);
      }
      return;
    }
    const timer = setInterval(() => setLockCountdown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [lockCountdown, locked]);

  const formatCountdown = (s: number) =>
    `${Math.floor(s / 60)
      .toString()
      .padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  // Send OTP
  const handleSendOtp = async () => {
    if (!email.trim() || !validateEmail(email)) {
      setEmailError(t("login.errors.email_invalid"));
      return;
    }

    setEmailError("");
    setOtpLoading(true);
    try {
      if (purpose === "email-verification") {
        await authService.requestEmailVerification({ email });
      } else if (purpose === "login") {
        await authService.requestLoginOtp({ email });
      } else {
        toast.info(t("common:status.coming_soon"));
      }

      setShowEmailEdit(false);
      setOtpValues(["", "", "", "", "", ""]);
      setOtpError("");
      setCountdown(60);
      toast.info(t("login.otp_sent"));
    } catch (error) {
      const message = getApiErrorMessage(error, t("login.errors.otp_send_failed"));
      setEmailError(message);
      toast.error(message);
    } finally {
      setOtpLoading(false);
    }
  };

  // OTP input handling
  const handleOtpChange = useCallback(
    (index: number, value: string) => {
      if (locked) return;
      if (!/^\d*$/.test(value)) return;
      const newVals = [...otpValues];
      newVals[index] = value.slice(-1);
      setOtpValues(newVals);
      setOtpError("");
      if (value && index < 5) {
        otpRefs.current[index + 1]?.focus();
      }
    },
    [otpValues, locked],
  );

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (locked) return;
    if (e.key === "Backspace" && !otpValues[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    if (locked) return;
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

  // Verify OTP
  const handleVerify = async () => {
    if (locked) return;
    const code = otpValues.join("");
    if (code.length < 6) return;

    setOtpLoading(true);
    try {
      if (purpose === "email-verification") {
        await authService.verifyEmail({ email, code });
      } else if (purpose === "login") {
        await loginWithOtp({ email, code }, true);
      } else {
        await new Promise((resolve) => setTimeout(resolve, 400));
      }

      setStage("success");
      setAttempts(0);
      setLocked(false);
      setLockCountdown(0);
      toast.success(config.successTitle);
    } catch (error) {
      const message = getApiErrorMessage(
        error,
        t("otp.errors.invalid"),
      );
      const nextAttempts = attempts + 1;
      setAttempts(nextAttempts);

      if (message.toLowerCase().includes("quá số lần")) {
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

    setOtpValues(["", "", "", "", "", ""]);
    setOtpError("");
    setAttempts(0);
    setLocked(false);
    setLockCountdown(0);
    otpRefs.current[0]?.focus();
    await handleSendOtp();
  };

  const handleSuccessAction = () => {
    const next = searchParams.get("next");

    switch (purpose) {
      case "email-verification":
        if (next === "onboarding") {
          nav.goOnboardingCurrencyDate();
        } else {
          nav.goLogin();
        }
        break;
      case "login":
        nav.goHome();
        break;
      case "action":
        nav.goHome();
        break;
    }
  };

  const otpComplete = otpValues.every((v) => v !== "");

  return (
    <div className="min-h-screen w-full flex bg-[var(--background)]">
      {/* Theme + Language Switchers */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
        <LanguageSwitcher />
        <ThemeSwitcher />
      </div>

      {/* Desktop Illustration Panel */}
      <div
        className={`hidden lg:flex lg:w-[45%] xl:w-[50%] relative overflow-hidden bg-gradient-to-br ${config.gradient} items-center justify-center p-12`}
      >
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
                FinanceApp
              </span>
            </div>

            <h2 className="text-3xl text-white font-semibold mb-4">
              {config.title}
            </h2>
            <p className="text-white/70 mb-10">
              {config.description}
            </p>

            {/* Security features */}
            <div className="space-y-3">
              {[
                { icon: Shield },
                { icon: Fingerprint },
                { icon: ShieldCheck },
              ].map((f, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.3 + i * 0.15 }}
                  className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-[var(--radius-lg)] p-3"
                >
                  <div className="w-10 h-10 rounded-[var(--radius-md)] bg-white/15 flex items-center justify-center flex-shrink-0">
                    <f.icon className="w-5 h-5 text-white" />
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
          {stage !== "success" && (
            <button
              onClick={() => nav.goLogin()}
              className="flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors mb-6"
            >
              <ArrowLeft className="w-4 h-4" />
              {t("forgot_password.back_to_login")}
            </button>
          )}

          <AnimatePresence mode="wait">
            {/* ─── INPUT STAGE ─── */}
            {stage === "input" && (
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
                  <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
                    {config.title}
                  </h1>
                  <p className="text-[var(--text-secondary)] mt-1 text-sm">
                    {config.description}
                  </p>
                </div>

                {/* Card */}
                <div className="bg-[var(--card)] rounded-[var(--radius-2xl)] border border-[var(--border)] shadow-[var(--shadow-lg)] p-6">
                  {/* Email display/edit */}
                  {showEmailEdit ? (
                    <div className="mb-5">
                      <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">
                        {t("login.email_label")}
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
                          placeholder={t("login.email_placeholder")}
                          autoFocus
                          className={`w-full pl-11 pr-4 py-3 bg-[var(--input-background)] border rounded-[var(--radius-lg)] text-[var(--text-primary)] placeholder:text-[var(--text-disabled)] focus:outline-none focus:ring-2 transition-all ${
                            emailError
                              ? "border-[var(--danger)] focus:ring-[var(--danger)]/30"
                              : "border-[var(--border)] focus:ring-[var(--focus-ring)]/30 focus:border-[var(--primary)]"
                          }`}
                          onKeyDown={(e) =>
                            e.key === "Enter" && handleSendOtp()
                          }
                        />
                      </div>
                      {emailError && (
                        <p className="mt-1.5 text-xs text-[var(--danger)]">
                          {emailError}
                        </p>
                      )}
                      <button
                        onClick={handleSendOtp}
                        disabled={otpLoading}
                        className="w-full mt-3 py-3 bg-[var(--primary)] text-white rounded-[var(--radius-lg)] font-medium hover:bg-[var(--primary-hover)] disabled:opacity-60 transition-all flex items-center justify-center gap-2"
                      >
                        {otpLoading ? (
                          <>
                            <Loader2 className="w-4.5 h-4.5 animate-spin" />
                            {t("login.sending")}
                          </>
                        ) : (
                          <>
                            <Mail className="w-4 h-4" />
                            {t("login.send_otp")}
                          </>
                        )}
                      </button>
                    </div>
                  ) : (
                    <div className="mb-5">
                      <div className="flex items-center justify-between p-3 bg-[var(--surface)] rounded-[var(--radius-lg)]">
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-[var(--text-tertiary)]" />
                          <span className="text-sm text-[var(--text-primary)]">
                            {email}
                          </span>
                        </div>
                        <button
                          onClick={() => setShowEmailEdit(true)}
                          className="text-xs font-medium text-[var(--primary)] hover:underline"
                        >
                          {t("common:actions.edit")}
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
                          animate={{ opacity: 1, height: "auto" }}
                          className="flex gap-3 p-3 mb-4 bg-[var(--danger-light)] rounded-[var(--radius-lg)]"
                        >
                          <AlertTriangle className="w-4 h-4 text-[var(--danger)] flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-xs font-medium text-[var(--danger)]">
                              {t("otp.errors.invalid")}
                            </p>
                            <p className="text-xs text-[var(--danger)]/80">
                              {t("otp.resend_in", { seconds: formatCountdown(lockCountdown) })}
                            </p>
                          </div>
                        </motion.div>
                      )}

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
                            disabled={locked}
                            autoFocus={i === 0 && !!emailParam}
                            className={`w-12 h-14 text-center text-xl font-semibold bg-[var(--input-background)] border rounded-[var(--radius-lg)] text-[var(--text-primary)] focus:outline-none focus:ring-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
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

                      {/* Attempts indicator */}
                      {attempts > 0 && !locked && (
                        <div className="flex justify-center gap-1 mb-4">
                          {[0, 1, 2, 3, 4].map((i) => (
                            <div
                              key={i}
                              className={`w-2 h-2 rounded-full transition-all ${
                                i < attempts
                                  ? "bg-[var(--danger)]"
                                  : "bg-[var(--border)]"
                              }`}
                            />
                          ))}
                        </div>
                      )}
                      <button
                        onClick={handleVerify}
                        disabled={!otpComplete || otpLoading || locked}
                        className="w-full py-3 bg-[var(--primary)] text-white rounded-[var(--radius-lg)] font-medium hover:bg-[var(--primary-hover)] disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                      >
                        {otpLoading ? (
                          <>
                            <Loader2 className="w-4.5 h-4.5 animate-spin" />
                            {t("register.otp_verifying")}
                          </>
                        ) : (
                          <>
                            <ShieldCheck className="w-4 h-4" />
                            {t("otp.verify")}
                          </>
                        )}
                      </button>
                    </>
                  )}
                </div>

                {/* Footer */}
                <div className="mt-8 text-center space-y-2">
                  <p className="text-xs text-[var(--text-tertiary)]">
                    <Link
                      to="/auth/login"
                      className="text-[var(--primary)] hover:underline"
                    >
                      {t("forgot_password.back_to_login")}
                    </Link>
                    {" · "}
                    <Link
                      to="/auth/register"
                      className="text-[var(--primary)] hover:underline"
                    >
                      {t("register.title")}
                    </Link>
                  </p>
                </div>
              </motion.div>
            )}

            {/* ─── SUCCESS STAGE ─── */}
            {stage === "success" && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: "spring", damping: 20, stiffness: 300 }}
              >
                <div className="bg-[var(--card)] rounded-[var(--radius-2xl)] border border-[var(--border)] shadow-[var(--shadow-lg)] p-8 text-center">
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
                      {config.successIcon}
                    </div>
                  </motion.div>

                  <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-2">
                    {config.successTitle}
                  </h2>
                  <p className="text-sm text-[var(--text-secondary)] mb-8">
                    {config.successDesc}
                  </p>

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
                    {t("register.skip_to_home")}
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

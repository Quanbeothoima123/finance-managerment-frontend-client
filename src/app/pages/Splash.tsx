import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { ThemeSwitcher } from "../components/ThemeSwitcher";
import { useAuth } from "../hooks/useAuth";
import { appService } from "../services/appService";
import { ApiError } from "../services/apiClient";
import { resolveOnboardingPath } from "../types/onboarding";

export default function Splash() {
  const navigate = useNavigate();
  const { isHydrated, isAuthenticated, clearSession } = useAuth();
  const [statusText, setStatusText] = useState("Đang khởi tạo ứng dụng...");

  const fallbackRoute = useMemo(
    () => (isAuthenticated ? "/home" : "/welcome"),
    [isAuthenticated],
  );

  useEffect(() => {
    if (!isHydrated) return;

    let isMounted = true;

    const runBootstrap = async () => {
      try {
        await new Promise((resolve) => setTimeout(resolve, 1200));
        if (!isMounted) return;

        if (!isAuthenticated) {
          navigate("/welcome", { replace: true });
          return;
        }

        setStatusText("Đang đồng bộ phiên đăng nhập...");
        const bootstrap = await appService.getBootstrap();
        if (!isMounted) return;

        const targetRoute =
          bootstrap.redirectTo ||
          resolveOnboardingPath(bootstrap.onboarding.currentStep);
        setStatusText("Đang chuyển hướng...");
        navigate(
          targetRoute === "/onboarding/completed" ? "/home" : targetRoute,
          {
            replace: true,
          },
        );
      } catch (error) {
        if (!isMounted) return;

        if (error instanceof ApiError && error.status === 401) {
          clearSession();
          navigate("/auth/login", { replace: true });
          return;
        }

        navigate(fallbackRoute, { replace: true });
      }
    };

    runBootstrap();

    return () => {
      isMounted = false;
    };
  }, [clearSession, fallbackRoute, isAuthenticated, isHydrated, navigate]);

  return (
    <div className="min-h-screen w-full relative overflow-hidden flex items-center justify-center bg-gradient-to-br from-[var(--background)] via-[var(--primary-light)] to-[var(--background)]">
      <div className="absolute top-4 right-4 z-20">
        <ThemeSwitcher />
      </div>

      <motion.div
        className="absolute top-1/4 left-1/4 w-64 h-64 md:w-96 md:h-96 rounded-full bg-[var(--primary)] opacity-10 blur-3xl"
        animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.15, 0.1] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-1/4 right-1/4 w-64 h-64 md:w-96 md:h-96 rounded-full bg-[var(--success)] opacity-10 blur-3xl"
        animate={{ scale: [1, 1.3, 1], opacity: [0.1, 0.15, 0.1] }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.5,
        }}
      />

      <div className="relative z-10 flex flex-col items-center justify-center px-6">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="mb-12"
        >
          <div className="relative">
            <div className="w-20 h-20 md:w-24 md:h-24 rounded-[var(--radius-xl)] bg-gradient-to-br from-[var(--primary)] to-[var(--success)] flex items-center justify-center shadow-lg">
              <svg
                className="w-10 h-10 md:w-12 md:h-12 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <motion.div
              className="absolute inset-0 rounded-[var(--radius-xl)] border-2 border-[var(--primary)]"
              animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
            />
          </div>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-center mb-8"
        >
          <h1 className="text-2xl md:text-3xl font-semibold text-[var(--text-primary)] mb-2">
            Quản lý tài chính cá nhân
          </h1>
          <p className="text-sm md:text-base text-[var(--text-secondary)]">
            Kiểm soát chi tiêu thông minh
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="flex flex-col items-center gap-3"
        >
          <div className="relative w-10 h-10">
            <motion.div className="absolute inset-0 rounded-full border-2 border-[var(--border)]" />
            <motion.div
              className="absolute inset-0 rounded-full border-2 border-[var(--primary)] border-t-transparent"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
          </div>

          <div className="flex gap-1.5">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-2 h-2 rounded-full bg-[var(--primary)]"
                animate={{ scale: [1, 1.2, 1], opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
              />
            ))}
          </div>

          <p className="text-sm text-[var(--text-secondary)]">{statusText}</p>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.6 }}
        className="absolute bottom-8 text-xs text-[var(--text-tertiary)]"
      >
        Version 1.0.0
      </motion.div>
    </div>
  );
}

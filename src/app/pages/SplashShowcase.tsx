import React, { useState } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { Button } from "../components/Button";
import { ThemeSwitcher } from "../components/ThemeSwitcher";
import { ArrowLeft, Monitor, Tablet, Smartphone, Columns } from "lucide-react";

export default function SplashShowcase() {
  const navigate = useNavigate();
  const [device, setDevice] = useState<"desktop" | "tablet" | "mobile">(
    "desktop",
  );
  const [viewMode, setViewMode] = useState<"single" | "compare">("single");

  const deviceSizes = {
    desktop: "w-full max-w-7xl",
    tablet: "w-full max-w-3xl",
    mobile: "w-full max-w-sm",
  };

  return (
    <div className="min-h-screen bg-[var(--surface)] p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate("/demo")}>
              <ArrowLeft className="w-4 h-4" />
              Back to Demo
            </Button>
            <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
              Splash Screen (A1) - Responsive Preview
            </h1>
          </div>
          <ThemeSwitcher />
        </div>

        {/* Controls */}
        <div className="flex gap-4 flex-wrap">
          {/* Device selector */}
          <div className="flex gap-2 bg-[var(--surface-elevated)] p-1 rounded-lg border border-[var(--border)]">
            <button
              onClick={() => setDevice("desktop")}
              className={`px-4 py-2 rounded-md flex items-center gap-2 transition-colors ${
                device === "desktop"
                  ? "bg-[var(--primary)] text-white"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              <Monitor className="w-4 h-4" />
              Desktop
            </button>
            <button
              onClick={() => setDevice("tablet")}
              className={`px-4 py-2 rounded-md flex items-center gap-2 transition-colors ${
                device === "tablet"
                  ? "bg-[var(--primary)] text-white"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              <Tablet className="w-4 h-4" />
              Tablet
            </button>
            <button
              onClick={() => setDevice("mobile")}
              className={`px-4 py-2 rounded-md flex items-center gap-2 transition-colors ${
                device === "mobile"
                  ? "bg-[var(--primary)] text-white"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              <Smartphone className="w-4 h-4" />
              Mobile
            </button>
          </div>

          {/* View mode toggle */}
          <Button
            variant={viewMode === "compare" ? "primary" : "secondary"}
            size="sm"
            onClick={() =>
              setViewMode(viewMode === "single" ? "compare" : "single")
            }
          >
            <Columns className="w-4 h-4" />
            {viewMode === "compare" ? "Single View" : "Compare Themes"}
          </Button>
        </div>
      </div>

      {/* Preview Container */}
      {viewMode === "single" ? (
        <div className="flex justify-center">
          <motion.div
            layout
            className={`${deviceSizes[device]} mx-auto`}
            transition={{ duration: 0.3 }}
          >
            <div className="bg-[var(--surface-elevated)] rounded-xl border border-[var(--border)] overflow-hidden shadow-lg">
              <div
                className="relative"
                style={{ aspectRatio: device === "mobile" ? "9/16" : "16/9" }}
              >
                <SplashPreview />
              </div>
            </div>

            <FeatureInfo />
          </motion.div>
        </div>
      ) : (
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Light theme */}
            <div>
              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-3">
                Light Theme
              </h3>
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-lg">
                <div
                  className="relative"
                  style={{ aspectRatio: device === "mobile" ? "9/16" : "16/9" }}
                >
                  <SplashPreview forceTheme="light" />
                </div>
              </div>
            </div>

            {/* Dark theme */}
            <div>
              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-3">
                Dark Theme
              </h3>
              <div className="bg-[#0f1113] rounded-xl border border-[#2a2c30] overflow-hidden shadow-lg">
                <div
                  className="relative"
                  style={{ aspectRatio: device === "mobile" ? "9/16" : "16/9" }}
                >
                  <SplashPreview forceTheme="dark" />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <FeatureInfo />
          </div>
        </div>
      )}
    </div>
  );
}

// Feature info component
function FeatureInfo() {
  return (
    <div className="mt-6 bg-[var(--surface-elevated)] rounded-xl border border-[var(--border)] p-6">
      <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
        Features Implemented
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-[var(--text-primary)]">
            Visual Design
          </h3>
          <ul className="text-sm text-[var(--text-secondary)] space-y-1">
            <li>✓ Minimal centered logo with gradient</li>
            <li>✓ Subtle gradient background</li>
            <li>✓ Animated background elements</li>
            <li>✓ Animated loading spinner & dots</li>
          </ul>
        </div>
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-[var(--text-primary)]">
            Functionality
          </h3>
          <ul className="text-sm text-[var(--text-secondary)] space-y-1">
            <li>✓ Auto-navigation after 2.5s</li>
            <li>✓ Light & Dark theme support</li>
            <li>✓ Fully responsive (mobile/tablet/desktop)</li>
            <li>✓ Smooth animations with Motion</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

// Mini preview component that shows the splash screen design
function SplashPreview({ forceTheme }: { forceTheme?: "light" | "dark" }) {
  // Theme-specific colors
  const colors =
    forceTheme === "light"
      ? {
          background: "#ffffff",
          primaryLight: "#e6f0ff",
          primary: "#0066ff",
          success: "#16a34a",
          textPrimary: "#1a1d1f",
          textSecondary: "#6f7379",
          textTertiary: "#9a9fa5",
          border: "#e4e6e8",
        }
      : forceTheme === "dark"
        ? {
            background: "#0f1113",
            primaryLight: "#1e3a8a",
            primary: "#3b82f6",
            success: "#22c55e",
            textPrimary: "#f5f5f6",
            textSecondary: "#b4b6ba",
            textTertiary: "#7c7e84",
            border: "#2a2c30",
          }
        : null;

  const style = colors
    ? ({
        "--bg": colors.background,
        "--primary-light": colors.primaryLight,
        "--primary": colors.primary,
        "--success": colors.success,
        "--text-primary": colors.textPrimary,
        "--text-secondary": colors.textSecondary,
        "--text-tertiary": colors.textTertiary,
        "--border": colors.border,
      } as React.CSSProperties)
    : {};

  return (
    <div
      className="absolute inset-0 flex items-center justify-center"
      style={{
        ...style,
        background: colors
          ? `linear-gradient(135deg, ${colors.background}, ${colors.primaryLight}, ${colors.background})`
          : "linear-gradient(135deg, var(--background), var(--primary-light), var(--background))",
      }}
    >
      {/* Animated background circles */}
      <motion.div
        className="absolute top-1/4 left-1/4 w-32 h-32 md:w-48 md:h-48 rounded-full opacity-10 blur-3xl"
        style={{ backgroundColor: colors?.primary || "var(--primary)" }}
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.1, 0.15, 0.1],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="absolute bottom-1/4 right-1/4 w-32 h-32 md:w-48 md:h-48 rounded-full opacity-10 blur-3xl"
        style={{ backgroundColor: colors?.success || "var(--success)" }}
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.1, 0.15, 0.1],
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.5,
        }}
      />

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center justify-center px-6">
        {/* Logo */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="mb-8 md:mb-12"
        >
          <div className="relative">
            <div
              className="w-16 h-16 md:w-20 md:h-20 rounded-[16px] flex items-center justify-center shadow-lg"
              style={{
                background: colors
                  ? `linear-gradient(135deg, ${colors.primary}, ${colors.success})`
                  : "linear-gradient(135deg, var(--primary), var(--success))",
              }}
            >
              <svg
                className="w-8 h-8 md:w-10 md:h-10 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
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
              className="absolute inset-0 rounded-[16px] border-2"
              style={{ borderColor: colors?.primary || "var(--primary)" }}
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.5, 0, 0.5],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeOut",
              }}
            />
          </div>
        </motion.div>

        {/* App name */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-center mb-6 md:mb-8"
        >
          <h1
            className="text-xl md:text-2xl font-semibold mb-1 md:mb-2"
            style={{ color: colors?.textPrimary || "var(--text-primary)" }}
          >
            Quản lý tài chính cá nhân
          </h1>
          <p
            className="text-xs md:text-sm"
            style={{ color: colors?.textSecondary || "var(--text-secondary)" }}
          >
            Kiểm soát chi tiêu thông minh
          </p>
        </motion.div>

        {/* Loading indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="flex flex-col items-center gap-2 md:gap-3"
        >
          <div className="relative w-8 h-8 md:w-10 md:h-10">
            <motion.div
              className="absolute inset-0 rounded-full border-2"
              style={{ borderColor: colors?.border || "var(--border)" }}
            />
            <motion.div
              className="absolute inset-0 rounded-full border-2 border-t-transparent"
              style={{ borderColor: colors?.primary || "var(--primary)" }}
              animate={{ rotate: 360 }}
              transition={{
                duration: 1,
                repeat: Infinity,
                ease: "linear",
              }}
            />
          </div>
          <div className="flex gap-1.5">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full"
                style={{ backgroundColor: colors?.primary || "var(--primary)" }}
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.4, 1, 0.4],
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  delay: i * 0.2,
                }}
              />
            ))}
          </div>
        </motion.div>
      </div>

      {/* Version */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.6 }}
        className="absolute bottom-4 md:bottom-8 text-xs"
        style={{ color: colors?.textTertiary || "var(--text-tertiary)" }}
      >
        Version 1.0.0
      </motion.div>
    </div>
  );
}

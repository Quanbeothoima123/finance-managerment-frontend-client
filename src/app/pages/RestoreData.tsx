import React, {
  useState,
  useRef,
  useMemo,
  useCallback,
  useEffect,
} from "react";
import {
  ArrowLeft,
  Upload,
  FileText,
  AlertTriangle,
  CheckCircle,
  X,
  Database,
  Tag,
  Wallet,
  List,
  Target,
  Repeat,
  Bot,
  ChevronRight,
  Home,
  Eye,
} from "lucide-react";
import { Card } from "../components/Card";
import { useAppNavigation } from "../hooks/useAppNavigation";
import { useAppData } from "../contexts/AppDataContext";
import { useToast } from "../contexts/ToastContext";
import { useTranslation } from "react-i18next";

const APP_VERSION = "1.0";

interface BackupMeta {
  version: string;
  exportedAt: string;
  timezone?: string;
  device?: string;
}

interface BackupData {
  transactions?: any[];
  accounts?: any[];
  categories?: any[];
  tags?: any[];
  merchants?: any[];
  budgets?: any[];
  goals?: any[];
  autoRules?: any[];
  recurringRules?: any[];
}

interface ParsedBackup {
  meta: BackupMeta;
  data: BackupData;
  counts: Record<string, number>;
}

type RestoreMode = "replace" | "merge";

// ═══════════════════════════════════════════════════════════════════════════
export default function RestoreData() {
  const nav = useAppNavigation();
  const { t, i18n } = useTranslation("misc");
  const locale = i18n.language === "vi" ? "vi-VN" : "en-US";
  const toast = useToast();
  const {
    restoreFullData,
    transactions,
    accounts,
    categories,
    tags,
    merchants,
    budgets,
    goals,
    autoRules,
    recurringRules,
  } = useAppData();
  const fileRef = useRef<HTMLInputElement>(null);

  const STEPS = [
    { label: t("restore.steps.0"), icon: Upload },
    { label: t("restore.steps.1"), icon: Eye },
    { label: t("restore.steps.2"), icon: CheckCircle },
  ];

  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [parsed, setParsed] = useState<ParsedBackup | null>(null);
  const [restoreMode, setRestoreMode] = useState<RestoreMode>("replace");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [restoringProgress, setRestoringProgress] = useState(0);
  const [restoreSuccess, setRestoreSuccess] = useState(false);
  const [restoredCounts, setRestoredCounts] = useState<Record<
    string,
    number
  > | null>(null);
  const [fileName, setFileName] = useState("");

  const currentCounts = useMemo(
    () => ({
      transactions: transactions.length,
      accounts: accounts.length,
      categories: categories.length,
      tags: tags.length,
      merchants: merchants.length,
      budgets: budgets.length,
      goals: goals.length,
      autoRules: autoRules.length,
      recurringRules: recurringRules.length,
    }),
    [
      transactions,
      accounts,
      categories,
      tags,
      merchants,
      budgets,
      goals,
      autoRules,
      recurringRules,
    ],
  );

  const versionMismatch = parsed && parsed.meta.version !== APP_VERSION;

  // ── File parsing ──
  const handleFile = useCallback((file: File) => {
    setError(null);
    setFileName(file.name);

    if (!file.name.endsWith(".json")) {
      setError(t("restore.errors.invalid_file"));
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);

        // Validate schema
        if (!json.data || typeof json.data !== "object") {
          setError(t("restore.errors.unrecognized_backup"));
          return;
        }

        const data = json.data as BackupData;
        const counts: Record<string, number> = {};
        const KEYS: (keyof BackupData)[] = [
          "transactions",
          "accounts",
          "categories",
          "tags",
          "merchants",
          "budgets",
          "goals",
          "autoRules",
          "recurringRules",
        ];
        KEYS.forEach((k) => {
          counts[k] = Array.isArray(data[k]) ? data[k]!.length : 0;
        });

        const meta: BackupMeta = {
          version: json.version || "unknown",
          exportedAt: json.exportedAt || "unknown",
          timezone:
            json.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
          device: json.device,
        };

        setParsed({ meta, data, counts });
        setStep(1);
      } catch {
        setError(t("restore.errors.invalid_file"));
      }
    };
    reader.readAsText(file);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  // ── Restore ──
  const executeRestore = useCallback(() => {
    if (!parsed) return;
    setShowConfirmModal(false);
    setRestoring(true);
    setRestoringProgress(0);

    // Simulate progress
    const interval = setInterval(() => {
      setRestoringProgress((prev) => {
        if (prev >= 90) {
          clearInterval(interval);
          return prev;
        }
        return prev + Math.random() * 20;
      });
    }, 200);

    setTimeout(() => {
      clearInterval(interval);
      setRestoringProgress(100);

      try {
        restoreFullData(parsed.data, restoreMode);
        setRestoredCounts(parsed.counts);
        setRestoreSuccess(true);
        setRestoring(false);
      } catch {
        setRestoring(false);
        setError(t("restore.errors.incompatible_version"));
        setStep(0);
        setParsed(null);
      }
    }, 1500);
  }, [parsed, restoreMode, restoreFullData]);

  // ── Count label helpers ──
  const countLabels: Record<string, { label: string; icon: React.ReactNode }> =
    {
      transactions: {
        label: t("restore.count_labels.transactions"),
        icon: <List className="w-4 h-4" />,
      },
      accounts: {
        label: t("restore.count_labels.accounts"),
        icon: <Wallet className="w-4 h-4" />,
      },
      categories: {
        label: t("restore.count_labels.categories"),
        icon: <Tag className="w-4 h-4" />,
      },
      tags: {
        label: t("restore.count_labels.tags"),
        icon: <Tag className="w-4 h-4" />,
      },
      merchants: {
        label: t("restore.count_labels.merchants"),
        icon: <Database className="w-4 h-4" />,
      },
      budgets: {
        label: t("restore.count_labels.budgets"),
        icon: <Target className="w-4 h-4" />,
      },
      goals: {
        label: t("restore.count_labels.goals"),
        icon: <Target className="w-4 h-4" />,
      },
      autoRules: {
        label: t("restore.count_labels.auto_rules"),
        icon: <Bot className="w-4 h-4" />,
      },
      recurringRules: {
        label: t("restore.count_labels.recurring_rules"),
        icon: <Repeat className="w-4 h-4" />,
      },
    };

  // ── Success screen ──
  if (restoreSuccess && restoredCounts) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="w-20 h-20 bg-[var(--success-light)] rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="w-10 h-10 text-[var(--success)]" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
              {t("restore.success.title")}
            </h2>
            <p className="text-sm text-[var(--text-secondary)]">
              {restoreMode === "replace"
                ? t("restore.success.description_replace")
                : t("restore.success.description_merge")}
            </p>
          </div>

          <Card>
            <div className="space-y-2">
              {Object.entries(restoredCounts)
                .filter(([, v]) => v > 0)
                .map(([key, count]) => (
                  <div
                    key={key}
                    className="flex items-center justify-between py-1.5"
                  >
                    <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                      {countLabels[key]?.icon}
                      <span>{countLabels[key]?.label || key}</span>
                    </div>
                    <span className="text-sm font-semibold text-[var(--text-primary)] tabular-nums">
                      {count}
                    </span>
                  </div>
                ))}
            </div>
          </Card>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => nav.goHome()}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white rounded-[var(--radius-lg)] font-medium transition-colors"
            >
              <Home className="w-4 h-4" />
              <span>{t("restore.success.go_home")}</span>
            </button>
            <button
              onClick={() => nav.goTransactions()}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border border-[var(--border)] text-[var(--text-primary)] rounded-[var(--radius-lg)] font-medium hover:bg-[var(--surface)] transition-colors"
            >
              <List className="w-4 h-4" />
              <span>{t("restore.success.view_transactions")}</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Restoring progress ──
  if (restoring) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center p-4">
        <div className="max-w-sm w-full text-center space-y-6">
          <div className="w-16 h-16 bg-[var(--primary-light)] rounded-full flex items-center justify-center mx-auto animate-pulse">
            <Database className="w-8 h-8 text-[var(--primary)]" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-2">
              {t("restore.progress.title")}
            </h2>
            <p className="text-sm text-[var(--text-secondary)]">
              {t("restore.progress.subtitle")}
            </p>
          </div>
          <div className="h-3 bg-[var(--surface)] rounded-full overflow-hidden">
            <div
              className="h-full bg-[var(--primary)] rounded-full transition-all duration-300"
              style={{ width: `${Math.min(restoringProgress, 100)}%` }}
            />
          </div>
          <p className="text-xs text-[var(--text-tertiary)] tabular-nums">
            {Math.round(Math.min(restoringProgress, 100))}%
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="max-w-3xl mx-auto p-4 md:p-6 pb-28 md:pb-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => nav.goBack()}
            className="p-2 rounded-[var(--radius-lg)] hover:bg-[var(--surface)] transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-[var(--text-secondary)]" />
          </button>
          <div>
            <h1 className="text-xl font-semibold text-[var(--text-primary)]">
              {t("restore.title")}
            </h1>
            <p className="text-sm text-[var(--text-secondary)]">
              {t("restore.subtitle")}
            </p>
          </div>
        </div>

        {/* Stepper */}
        <div className="flex items-center gap-2">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const active = step === i;
            const done = step > i;
            return (
              <React.Fragment key={i}>
                {i > 0 && (
                  <div
                    className={`flex-1 h-0.5 ${done ? "bg-[var(--primary)]" : "bg-[var(--border)]"}`}
                  />
                )}
                <div
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    active
                      ? "bg-[var(--primary-light)] text-[var(--primary)]"
                      : done
                        ? "bg-[var(--success-light)] text-[var(--success)]"
                        : "bg-[var(--surface)] text-[var(--text-tertiary)]"
                  }`}
                >
                  {done ? (
                    <CheckCircle className="w-3.5 h-3.5" />
                  ) : (
                    <Icon className="w-3.5 h-3.5" />
                  )}
                  <span className="hidden sm:inline">{s.label}</span>
                </div>
              </React.Fragment>
            );
          })}
        </div>

        {/* STEP 0: File Picker */}
        {step === 0 && (
          <Card>
            <h3 className="font-semibold text-[var(--text-primary)] mb-4">
              {t("restore.step0.title")}
            </h3>

            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => fileRef.current?.click()}
              className="border-2 border-dashed border-[var(--border)] rounded-[var(--radius-xl)] p-10 text-center cursor-pointer hover:border-[var(--primary)] hover:bg-[var(--primary-light)] transition-colors"
            >
              <div className="w-14 h-14 bg-[var(--surface)] rounded-full flex items-center justify-center mx-auto mb-4">
                <Upload className="w-7 h-7 text-[var(--text-tertiary)]" />
              </div>
              <p className="text-sm font-medium text-[var(--text-primary)] mb-1">
                {t("restore.step0.drop_label")}
              </p>
              <p className="text-xs text-[var(--text-tertiary)]">
                {t("restore.step0.accept_hint")}
              </p>
              <input
                ref={fileRef}
                type="file"
                accept=".json"
                className="hidden"
                onChange={handleInputChange}
              />
            </div>

            <p className="text-xs text-[var(--text-tertiary)] mt-3">
              {t("restore.step0.source_hint")}
            </p>

            {/* Error */}
            {error && (
              <div className="mt-4 p-4 bg-[var(--danger-light)] border border-[var(--danger)] rounded-[var(--radius-lg)] flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-[var(--danger)] flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-[var(--danger)]">
                    {error}
                  </p>
                  <button
                    onClick={() => {
                      setError(null);
                      setParsed(null);
                      setStep(0);
                      fileRef.current && (fileRef.current.value = "");
                    }}
                    className="text-xs text-[var(--primary)] mt-1 underline"
                  >
                    {t("restore.step0.choose_another")}
                  </button>
                </div>
              </div>
            )}
          </Card>
        )}

        {/* STEP 1: Preview */}
        {step === 1 && parsed && (
          <div className="space-y-6">
            <Card>
              <h3 className="font-semibold text-[var(--text-primary)] mb-4">
                {t("restore.step1.file_info_title")}
              </h3>

              <div className="space-y-3 mb-4">
                <div className="flex justify-between">
                  <span className="text-sm text-[var(--text-secondary)]">
                    {t("restore.step1.file_label")}
                  </span>
                  <span className="text-sm font-medium text-[var(--text-primary)]">
                    {fileName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-[var(--text-secondary)]">
                    {t("restore.step1.version_label")}
                  </span>
                  <span className="text-sm font-medium text-[var(--text-primary)]">
                    {parsed.meta.version}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-[var(--text-secondary)]">
                    {t("restore.step1.exported_at_label")}
                  </span>
                  <span className="text-sm font-medium text-[var(--text-primary)]">
                    {parsed.meta.exportedAt !== "unknown"
                      ? new Date(parsed.meta.exportedAt).toLocaleString(locale)
                      : "—"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-[var(--text-secondary)]">
                    {t("restore.step1.timezone_label")}
                  </span>
                  <span className="text-sm font-medium text-[var(--text-primary)]">
                    {parsed.meta.timezone || "—"}
                  </span>
                </div>
              </div>

              {versionMismatch && (
                <div className="p-3 bg-[var(--warning-light)] border border-[var(--warning)] rounded-[var(--radius-lg)] mb-4">
                  <p className="text-xs text-[var(--text-secondary)]">
                    <AlertTriangle className="w-3.5 h-3.5 inline mr-1 text-[var(--warning)]" />
                    {t("restore.step1.version_mismatch_warning", {
                      version: parsed.meta.version,
                    })}
                  </p>
                </div>
              )}
            </Card>

            <Card>
              <h3 className="font-semibold text-[var(--text-primary)] mb-4">
                {t("restore.step1.content_title")}
              </h3>
              <div className="space-y-2">
                {Object.entries(parsed.counts).map(([key, count]) => (
                  <div
                    key={key}
                    className="flex items-center justify-between py-2 border-b border-[var(--divider)] last:border-0"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 bg-[var(--surface)] rounded-[var(--radius-md)] flex items-center justify-center text-[var(--text-secondary)]">
                        {countLabels[key]?.icon}
                      </div>
                      <span className="text-sm text-[var(--text-primary)]">
                        {countLabels[key]?.label || key}
                      </span>
                    </div>
                    <span className="text-sm font-semibold text-[var(--text-primary)] tabular-nums">
                      {count}
                    </span>
                  </div>
                ))}
              </div>
            </Card>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setStep(0);
                  setParsed(null);
                  setError(null);
                }}
                className="px-6 py-3 border border-[var(--border)] text-[var(--text-secondary)] rounded-[var(--radius-lg)] font-medium hover:bg-[var(--surface)] transition-colors"
              >
                {t("restore.back_button")}
              </button>
              <button
                onClick={() => setStep(2)}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white rounded-[var(--radius-lg)] font-medium transition-colors"
              >
                {t("restore.continue_button")}{" "}
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Confirm — Replace vs Merge */}
        {step === 2 && parsed && (
          <div className="space-y-6">
            <Card>
              <h3 className="font-semibold text-[var(--text-primary)] mb-4">
                {t("restore.step2.title")}
              </h3>

              <div className="space-y-3">
                {/* Replace */}
                <button
                  onClick={() => setRestoreMode("replace")}
                  className={`w-full text-left p-4 rounded-[var(--radius-lg)] border-2 transition-colors ${
                    restoreMode === "replace"
                      ? "border-[var(--primary)] bg-[var(--primary-light)]"
                      : "border-[var(--border)] hover:border-[var(--text-tertiary)]"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        restoreMode === "replace"
                          ? "border-[var(--primary)]"
                          : "border-[var(--border)]"
                      }`}
                    >
                      {restoreMode === "replace" && (
                        <div className="w-2.5 h-2.5 rounded-full bg-[var(--primary)]" />
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-[var(--text-primary)]">
                        {t("restore.step2.replace_title")}{" "}
                        <span className="text-xs font-normal text-[var(--text-tertiary)] ml-1">
                          {t("restore.step2.replace_recommended")}
                        </span>
                      </p>
                      <p className="text-sm text-[var(--text-secondary)] mt-0.5">
                        {t("restore.step2.replace_description")}
                      </p>
                    </div>
                  </div>
                </button>

                {/* Merge */}
                <button
                  onClick={() => setRestoreMode("merge")}
                  className={`w-full text-left p-4 rounded-[var(--radius-lg)] border-2 transition-colors ${
                    restoreMode === "merge"
                      ? "border-[var(--primary)] bg-[var(--primary-light)]"
                      : "border-[var(--border)] hover:border-[var(--text-tertiary)]"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        restoreMode === "merge"
                          ? "border-[var(--primary)]"
                          : "border-[var(--border)]"
                      }`}
                    >
                      {restoreMode === "merge" && (
                        <div className="w-2.5 h-2.5 rounded-full bg-[var(--primary)]" />
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-[var(--text-primary)]">
                        {t("restore.step2.merge_title")}
                      </p>
                      <p className="text-sm text-[var(--text-secondary)] mt-0.5">
                        {t("restore.step2.merge_description")}
                      </p>
                    </div>
                  </div>
                </button>
              </div>

              {restoreMode === "replace" && (
                <div className="mt-4 p-3 bg-[var(--danger-light)] border border-[var(--danger)] rounded-[var(--radius-lg)]">
                  <p className="text-xs text-[var(--danger)] font-medium">
                    <AlertTriangle className="w-3.5 h-3.5 inline mr-1" />
                    {t("restore.step2.irreversible_warning")}
                  </p>
                </div>
              )}
            </Card>

            {/* Current data summary */}
            <Card className="bg-[var(--surface)]">
              <h3 className="font-semibold text-[var(--text-primary)] mb-3">
                {t("restore.step2.current_data_title")}
              </h3>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-xs text-[var(--text-tertiary)]">
                    {t("restore.count_labels.transactions")}
                  </p>
                  <p className="text-sm font-bold text-[var(--text-primary)] tabular-nums">
                    {currentCounts.transactions}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[var(--text-tertiary)]">
                    {t("restore.count_labels.accounts")}
                  </p>
                  <p className="text-sm font-bold text-[var(--text-primary)] tabular-nums">
                    {currentCounts.accounts}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[var(--text-tertiary)]">
                    {t("restore.count_labels.goals")}
                  </p>
                  <p className="text-sm font-bold text-[var(--text-primary)] tabular-nums">
                    {currentCounts.goals}
                  </p>
                </div>
              </div>
            </Card>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="px-6 py-3 border border-[var(--border)] text-[var(--text-secondary)] rounded-[var(--radius-lg)] font-medium hover:bg-[var(--surface)] transition-colors"
              >
                {t("restore.back_button")}
              </button>
              <button
                onClick={() => setShowConfirmModal(true)}
                className={`flex-1 px-6 py-3 text-white rounded-[var(--radius-lg)] font-medium transition-colors ${
                  restoreMode === "replace"
                    ? "bg-[var(--danger)] hover:opacity-90"
                    : "bg-[var(--primary)] hover:bg-[var(--primary-hover)]"
                }`}
              >
                {t("restore.restore_button")}
              </button>
            </div>
          </div>
        )}

        {/* Confirmation Modal */}
        {showConfirmModal && parsed && (
          <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowConfirmModal(false)}
          >
            <div
              className="bg-[var(--card)] rounded-[var(--radius-xl)] p-6 w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                  {t("restore.confirm_modal.title")}
                </h3>
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="p-1.5 rounded-[var(--radius-md)] hover:bg-[var(--surface)]"
                >
                  <X className="w-5 h-5 text-[var(--text-secondary)]" />
                </button>
              </div>

              <div className="space-y-3 mb-5">
                <p className="text-sm text-[var(--text-secondary)]">
                  {restoreMode === "replace"
                    ? t("restore.confirm_modal.replace_description")
                    : t("restore.confirm_modal.merge_description")}
                </p>

                <div className="p-3 bg-[var(--surface)] rounded-[var(--radius-lg)]">
                  <p className="text-xs text-[var(--text-tertiary)] mb-2">
                    {t("restore.confirm_modal.will_restore")}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(parsed.counts)
                      .filter(([, v]) => v > 0)
                      .map(([key, count]) => (
                        <span
                          key={key}
                          className="px-2 py-1 bg-[var(--card)] rounded-[var(--radius-md)] text-xs text-[var(--text-primary)] tabular-nums"
                        >
                          {countLabels[key]?.label || key}: {count}
                        </span>
                      ))}
                  </div>
                </div>

                {restoreMode === "replace" && (
                  <div className="p-3 bg-[var(--danger-light)] rounded-[var(--radius-lg)]">
                    <p className="text-xs text-[var(--danger)] font-medium">
                      <AlertTriangle className="w-3.5 h-3.5 inline mr-1" />
                      {t("restore.step2.irreversible_warning")}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="flex-1 px-4 py-2.5 border border-[var(--border)] text-[var(--text-secondary)] rounded-[var(--radius-lg)] font-medium hover:bg-[var(--surface)] transition-colors"
                >
                  {t("restore.confirm_modal.cancel")}
                </button>
                <button
                  onClick={executeRestore}
                  className={`flex-1 px-4 py-2.5 text-white rounded-[var(--radius-lg)] font-medium transition-colors ${
                    restoreMode === "replace"
                      ? "bg-[var(--danger)] hover:opacity-90"
                      : "bg-[var(--primary)] hover:bg-[var(--primary-hover)]"
                  }`}
                >
                  {t("restore.confirm_modal.confirm")}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

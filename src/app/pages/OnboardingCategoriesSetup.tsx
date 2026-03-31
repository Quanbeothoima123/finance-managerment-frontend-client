import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowLeft,
  GraduationCap,
  Briefcase,
  SlidersHorizontal,
  ChevronDown,
  Coins,
  Sparkles,
  Check,
  Wallet,
  Loader2,
  X,
} from "lucide-react";
import { useToast } from "../contexts/ToastContext";
import { useAuth } from "../hooks/useAuth";
import { onboardingService } from "../services/onboardingService";
import { getApiErrorMessage } from "../utils/authError";

type PresetKey = "student" | "professional" | "custom";

interface CategoryGroup {
  key: string;
  name: string;
  type: "expense" | "income";
  icon: string;
  color: string;
  children: { name: string; icon: string }[];
}

const ALL_CATEGORY_GROUPS: CategoryGroup[] = [
  {
    key: "eating",
    name: "Ăn uống",
    type: "expense",
    icon: "utensils",
    color: "#F59E0B",
    children: [
      { name: "Cơm trưa", icon: "soup" },
      { name: "Cơm tối", icon: "utensils" },
      { name: "Cafe & Trà", icon: "coffee" },
    ],
  },
  {
    key: "transport",
    name: "Di chuyển",
    type: "expense",
    icon: "car",
    color: "#8B5CF6",
    children: [
      { name: "Xăng dầu", icon: "fuel" },
      { name: "Grab/Taxi", icon: "car" },
      { name: "Xe buýt", icon: "bus" },
    ],
  },
  {
    key: "housing",
    name: "Nhà ở",
    type: "expense",
    icon: "home",
    color: "#3B82F6",
    children: [
      { name: "Tiền trọ", icon: "home" },
      { name: "Điện nước", icon: "zap" },
      { name: "Internet", icon: "wifi" },
    ],
  },
  {
    key: "study",
    name: "Học tập",
    type: "expense",
    icon: "book",
    color: "#6366F1",
    children: [
      { name: "Học phí", icon: "school" },
      { name: "Sách vở", icon: "book" },
      { name: "Khoá học", icon: "laptop" },
    ],
  },
  {
    key: "entertainment",
    name: "Giải trí",
    type: "expense",
    icon: "smile",
    color: "#F97316",
    children: [
      { name: "Phim ảnh", icon: "film" },
      { name: "Game", icon: "gamepad" },
      { name: "Du lịch", icon: "map" },
    ],
  },
  {
    key: "health",
    name: "Sức khoẻ",
    type: "expense",
    icon: "heart",
    color: "#EF4444",
    children: [
      { name: "Thuốc", icon: "pill" },
      { name: "Khám bệnh", icon: "stethoscope" },
    ],
  },
  {
    key: "shopping",
    name: "Mua sắm",
    type: "expense",
    icon: "shopping-bag",
    color: "#EC4899",
    children: [
      { name: "Quần áo", icon: "shirt" },
      { name: "Đồ dùng", icon: "package" },
    ],
  },
  {
    key: "sports",
    name: "Thể thao",
    type: "expense",
    icon: "dumbbell",
    color: "#14B8A6",
    children: [
      { name: "Gym", icon: "dumbbell" },
      { name: "Bơi lội", icon: "waves" },
    ],
  },
  {
    key: "other",
    name: "Khác",
    type: "expense",
    icon: "more-horizontal",
    color: "#6B7280",
    children: [
      { name: "Quà tặng", icon: "gift" },
      { name: "Từ thiện", icon: "heart-handshake" },
    ],
  },
  {
    key: "income",
    name: "Thu nhập",
    type: "income",
    icon: "briefcase",
    color: "#10B981",
    children: [
      { name: "Lương", icon: "briefcase" },
      { name: "Thưởng", icon: "gift" },
      { name: "Thu nhập khác", icon: "plus-circle" },
    ],
  },
];

const STUDENT_GROUPS = [
  "eating",
  "transport",
  "housing",
  "study",
  "entertainment",
  "health",
  "shopping",
  "other",
  "income",
];
const PROFESSIONAL_GROUPS = [
  "eating",
  "transport",
  "housing",
  "shopping",
  "entertainment",
  "health",
  "sports",
  "other",
  "income",
];

const PRESETS: Array<{
  key: PresetKey;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  recommended?: boolean;
  groups: string[];
}> = [
  {
    key: "student",
    title: "Sinh viên",
    subtitle: "Đủ nhóm chi tiêu phổ biến + thu nhập cơ bản.",
    icon: <GraduationCap className="w-6 h-6" />,
    recommended: true,
    groups: STUDENT_GROUPS,
  },
  {
    key: "professional",
    title: "Người mới đi làm",
    subtitle: "Tập trung Nhà ở, Đi lại, Ăn uống, Mua sắm.",
    icon: <Briefcase className="w-6 h-6" />,
    groups: PROFESSIONAL_GROUPS,
  },
  {
    key: "custom",
    title: "Tự tuỳ chỉnh",
    subtitle: "Chọn nhóm danh mục bạn muốn tạo.",
    icon: <SlidersHorizontal className="w-6 h-6" />,
    groups: STUDENT_GROUPS,
  },
];

export default function OnboardingCategoriesSetup() {
  const navigate = useNavigate();
  const toast = useToast();
  const { isAuthenticated, isHydrated } = useAuth();

  const [selectedPreset, setSelectedPreset] = useState<PresetKey>("student");
  const [customGroupKeys, setCustomGroupKeys] = useState<Set<string>>(
    new Set(STUDENT_GROUPS),
  );
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
  const [showQuickEditSheet, setShowQuickEditSheet] = useState(false);
  const [showSuccessSheet, setShowSuccessSheet] = useState(false);
  const [walletCount, setWalletCount] = useState(0);
  const [currency, setCurrency] = useState("VND");
  const [redirectTo, setRedirectTo] = useState("/home");
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isHydrated) return;
    if (!isAuthenticated) {
      navigate("/auth/login", { replace: true });
      return;
    }

    let isMounted = true;

    const loadState = async () => {
      try {
        const state = await onboardingService.getState();
        if (!isMounted) return;
        setWalletCount(state.onboarding.counts.accountCount);
        setCurrency(state.ledger.baseCurrencyCode || "VND");
        if (state.onboarding.completed) {
          navigate("/home", { replace: true });
        }
      } catch (error) {
        if (!isMounted) return;
        toast.error(
          getApiErrorMessage(error, "Không thể tải dữ liệu onboarding."),
        );
      } finally {
        if (isMounted) setIsBootstrapping(false);
      }
    };

    loadState();
    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, isHydrated, navigate, toast]);

  const activeGroupKeys = useMemo(() => {
    if (selectedPreset === "custom") return customGroupKeys;
    return new Set(
      PRESETS.find((preset) => preset.key === selectedPreset)?.groups ||
        STUDENT_GROUPS,
    );
  }, [customGroupKeys, selectedPreset]);

  const activeGroups = useMemo(
    () => ALL_CATEGORY_GROUPS.filter((group) => activeGroupKeys.has(group.key)),
    [activeGroupKeys],
  );

  const totalSubCategories = useMemo(
    () => activeGroups.reduce((sum, group) => sum + group.children.length, 0),
    [activeGroups],
  );

  const toggleCustomGroup = (key: string) => {
    setCustomGroupKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const persistCategories = async (skipMode = false) => {
    setIsSubmitting(true);
    try {
      await onboardingService.saveCategories(
        selectedPreset === "custom"
          ? { groups: Array.from(activeGroupKeys) }
          : {
              preset:
                selectedPreset === "professional" ? "professional" : "student",
            },
      );

      if (skipMode) {
        const completion = await onboardingService.complete();
        navigate(completion.redirectTo || "/home", { replace: true });
        return;
      }

      toast.success("Đã tạo bộ danh mục mặc định.");
      setShowSuccessSheet(true);
    } catch (error) {
      toast.error(
        getApiErrorMessage(error, "Không thể lưu danh mục onboarding."),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = () => {
    setSelectedPreset("student");
    void persistCategories(true);
  };

  const handleFinish = () => {
    void persistCategories(false);
  };

  const handleStart = async () => {
    setIsSubmitting(true);
    try {
      const completion = await onboardingService.complete();
      setRedirectTo(completion.redirectTo || "/home");
      toast.success("Onboarding hoàn tất");
      navigate(completion.redirectTo || "/home", { replace: true });
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Không thể hoàn tất onboarding."));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)] flex flex-col">
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-center justify-between px-4 py-4 sm:px-6"
      >
        <button
          onClick={() => navigate("/onboarding/wallet-balance")}
          className="p-2 -ml-2 rounded-[var(--radius-md)] hover:bg-[var(--surface)] transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-[var(--text-primary)]" />
        </button>

        <div className="flex flex-col items-center gap-1">
          <span className="text-xs text-[var(--text-tertiary)]">Bước 3/3</span>
          <div className="w-24 h-1 bg-[var(--surface)] rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-[var(--primary)] rounded-full"
              initial={{ width: "66%" }}
              animate={{ width: "100%" }}
              transition={{ duration: 0.6, delay: 0.3 }}
            />
          </div>
        </div>

        <button
          onClick={handleSkip}
          disabled={isSubmitting || isBootstrapping}
          className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors px-2 py-1 disabled:opacity-50"
        >
          Bỏ qua
        </button>
      </motion.header>

      <div className="flex-1 px-4 sm:px-6 pb-6 flex flex-col max-w-lg mx-auto w-full overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="mt-4 mb-5"
        >
          <h1 className="text-2xl font-semibold text-[var(--text-primary)] mb-2">
            Thiết lập danh mục
          </h1>
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
            Chọn bộ danh mục có sẵn để xem báo cáo đẹp ngay. Bạn có thể chỉnh
            sửa lại trong Categories.
          </p>
        </motion.div>

        {isBootstrapping && (
          <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)] mb-4">
            <Loader2 className="w-4 h-4 animate-spin" />
            Đang đồng bộ dữ liệu onboarding...
          </div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="bg-[var(--surface-elevated)] border border-[var(--border)] rounded-[var(--radius-xl)] p-4 mb-4 shadow-[var(--shadow-sm)]"
        >
          <h2 className="text-sm font-medium text-[var(--text-primary)] mb-3">
            Chọn preset
          </h2>
          <div className="space-y-3">
            {PRESETS.map((preset) => {
              const isSelected = selectedPreset === preset.key;
              return (
                <button
                  key={preset.key}
                  onClick={() => setSelectedPreset(preset.key)}
                  className={`w-full flex items-start gap-3 p-3 rounded-[var(--radius-lg)] border-2 transition-all text-left ${isSelected ? "border-[var(--primary)] bg-[var(--primary-light)]" : "border-[var(--border)] bg-[var(--background)] hover:border-[var(--primary)]/50"}`}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${isSelected ? "bg-[var(--primary)] text-white" : "bg-[var(--surface)] text-[var(--text-secondary)]"}`}
                  >
                    {preset.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-[var(--text-primary)]">
                        {preset.title}
                      </span>
                      {preset.recommended && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-[var(--success-light)] text-[var(--success)]">
                          Gợi ý
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[var(--text-tertiary)] mt-0.5 leading-relaxed">
                      {preset.subtitle}
                    </p>
                  </div>
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${isSelected ? "border-[var(--primary)] bg-[var(--primary)]" : "border-[var(--border)]"}`}
                  >
                    {isSelected && <Check className="w-3 h-3 text-white" />}
                  </div>
                </button>
              );
            })}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="bg-[var(--surface-elevated)] border border-[var(--border)] rounded-[var(--radius-xl)] p-4 mb-4 shadow-[var(--shadow-sm)]"
        >
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-[var(--text-primary)]">
              Xem trước danh mục
            </h2>
            {selectedPreset === "custom" && (
              <button
                onClick={() => setShowQuickEditSheet(true)}
                className="text-xs font-medium text-[var(--primary)] hover:underline"
              >
                Chỉnh nhanh
              </button>
            )}
          </div>
          <div className="space-y-1">
            {activeGroups.map((group) => {
              const isExpanded = expandedGroup === group.key;
              return (
                <div key={group.key}>
                  <button
                    onClick={() =>
                      setExpandedGroup(isExpanded ? null : group.key)
                    }
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-md)] hover:bg-[var(--surface)] transition-colors"
                  >
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${group.color}20` }}
                    >
                      <span className="text-xs" style={{ color: group.color }}>
                        {getCategoryEmoji(group.key)}
                      </span>
                    </div>
                    <span className="flex-1 text-sm text-[var(--text-primary)] text-left">
                      {group.name}
                    </span>
                    <span className="text-xs text-[var(--text-tertiary)] mr-1">
                      {group.children.length}
                    </span>
                    <motion.div
                      animate={{ rotate: isExpanded ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ChevronDown className="w-4 h-4 text-[var(--text-tertiary)]" />
                    </motion.div>
                  </button>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="pl-13 pb-2">
                          {group.children.map((child) => (
                            <div
                              key={child.name}
                              className="flex items-center gap-2 px-3 py-1.5 ml-10"
                            >
                              <div
                                className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                                style={{ backgroundColor: group.color }}
                              />
                              <span className="text-xs text-[var(--text-secondary)]">
                                {child.name}
                              </span>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
          <div className="mt-3 pt-3 border-t border-[var(--border)]">
            <p className="text-xs text-[var(--text-tertiary)]">
              {activeGroups.length} nhóm · {totalSubCategories} danh mục con
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.35 }}
          className="bg-[var(--surface-elevated)] border border-[var(--border)] rounded-[var(--radius-xl)] p-4 mb-4 shadow-[var(--shadow-sm)]"
        >
          <h2 className="text-sm font-medium text-[var(--text-primary)] mb-3">
            Tóm tắt thiết lập
          </h2>
          <div className="space-y-2.5">
            <SummaryRow
              icon={<Coins className="w-4 h-4" />}
              label="Tiền tệ"
              value={currency}
              color="#F59E0B"
            />
            <SummaryRow
              icon={<Wallet className="w-4 h-4" />}
              label="Ví"
              value={`${walletCount} ví`}
              color="#3B82F6"
            />
            <SummaryRow
              icon={<Sparkles className="w-4 h-4" />}
              label="Danh mục"
              value={`${activeGroups.length} nhóm (${totalSubCategories} danh mục con)`}
              color="#8B5CF6"
            />
          </div>
        </motion.div>

        <div className="flex-1 min-h-4" />

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.45 }}
          className="mt-6 sticky bottom-4"
        >
          <button
            onClick={handleFinish}
            disabled={isSubmitting || isBootstrapping}
            className="w-full py-3.5 rounded-[var(--radius-lg)] font-medium text-base transition-all shadow-[var(--shadow-sm)] bg-[var(--primary)] text-[var(--primary-foreground)] hover:bg-[var(--primary-hover)] active:scale-[0.98] disabled:opacity-60"
          >
            {isSubmitting ? "Đang lưu..." : "Hoàn tất"}
          </button>
          <p className="text-center text-xs text-[var(--text-tertiary)] mt-3">
            Bạn có thể chỉnh trong Settings/Categories sau.
          </p>
        </motion.div>
      </div>

      <AnimatePresence>
        {showQuickEditSheet && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/50"
              onClick={() => setShowQuickEditSheet(false)}
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-[var(--card)] rounded-t-[var(--radius-2xl)] shadow-2xl max-h-[85vh] flex flex-col"
            >
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full bg-[var(--border)]" />
              </div>
              <div className="flex items-center justify-between px-5 pb-3 border-b border-[var(--border)]">
                <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                  Chọn nhóm danh mục
                </h3>
                <button
                  onClick={() => setShowQuickEditSheet(false)}
                  className="p-1.5 rounded-[var(--radius-md)] hover:bg-[var(--surface)] transition-colors"
                >
                  <X className="w-5 h-5 text-[var(--text-secondary)]" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-2">
                {ALL_CATEGORY_GROUPS.map((group) => {
                  const checked = customGroupKeys.has(group.key);
                  return (
                    <button
                      key={group.key}
                      onClick={() => toggleCustomGroup(group.key)}
                      className={`w-full flex items-center justify-between p-3 rounded-[var(--radius-lg)] border ${checked ? "border-[var(--primary)] bg-[var(--primary-light)]" : "border-[var(--border)] bg-[var(--background)]"}`}
                    >
                      <span className="text-sm text-[var(--text-primary)]">
                        {group.name}
                      </span>
                      {checked && (
                        <Check className="w-4 h-4 text-[var(--primary)]" />
                      )}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSuccessSheet && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/50"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-[var(--card)] rounded-t-[var(--radius-2xl)] shadow-2xl"
            >
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full bg-[var(--border)]" />
              </div>
              <div className="px-6 py-8 text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{
                    type: "spring",
                    damping: 12,
                    stiffness: 200,
                    delay: 0.2,
                  }}
                  className="w-20 h-20 rounded-full bg-[var(--success-light)] flex items-center justify-center mx-auto mb-5"
                >
                  <Check className="w-10 h-10 text-[var(--success)]" />
                </motion.div>
                <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-2">
                  Bạn đã sẵn sàng!
                </h2>
                <p className="text-sm text-[var(--text-secondary)] mb-8 leading-relaxed">
                  Bắt đầu nhập giao dịch đầu tiên của bạn.
                </p>
                <button
                  onClick={handleStart}
                  className="w-full py-3.5 rounded-[var(--radius-lg)] font-medium text-base bg-[var(--primary)] text-[var(--primary-foreground)] hover:bg-[var(--primary-hover)] active:scale-[0.98] transition-all shadow-[var(--shadow-sm)]"
                >
                  Bắt đầu
                </button>
                <p className="text-xs text-[var(--text-tertiary)] mt-3">
                  Sau khi hoàn tất sẽ chuyển tới {redirectTo}.
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function SummaryRow({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center"
        style={{ backgroundColor: `${color}20`, color }}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-[var(--text-tertiary)]">{label}</p>
        <p className="text-sm text-[var(--text-primary)] truncate">{value}</p>
      </div>
    </div>
  );
}

function getCategoryEmoji(key: string) {
  const map: Record<string, string> = {
    eating: "🍜",
    transport: "🛵",
    housing: "🏠",
    study: "📚",
    entertainment: "🎬",
    health: "💊",
    shopping: "🛍️",
    sports: "🏋️",
    other: "✨",
    income: "💰",
  };
  return map[key] || "•";
}

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
  GraduationCap,
  Briefcase,
  SlidersHorizontal,
  ChevronDown,
  ChevronRight,
  Wallet,
  Coins,
  Sparkles,
  Check,
  X,
  AlertCircle,
} from 'lucide-react';
import { useDemoData } from '../contexts/DemoDataContext';
import { useToast } from '../contexts/ToastContext';

// ============================================================================
// TYPES & PRESET DATA
// ============================================================================

type PresetKey = 'student' | 'professional' | 'custom';

interface CategoryGroup {
  key: string;
  name: string;
  type: 'expense' | 'income';
  icon: string;
  color: string;
  children: { name: string; icon: string }[];
}

const ALL_CATEGORY_GROUPS: CategoryGroup[] = [
  {
    key: 'eating',
    name: 'Ăn uống',
    type: 'expense',
    icon: 'utensils',
    color: '#F59E0B',
    children: [
      { name: 'Cơm trưa', icon: 'soup' },
      { name: 'Cơm tối', icon: 'utensils' },
      { name: 'Cafe & Trà', icon: 'coffee' },
    ],
  },
  {
    key: 'transport',
    name: 'Di chuyển',
    type: 'expense',
    icon: 'car',
    color: '#8B5CF6',
    children: [
      { name: 'Xăng dầu', icon: 'fuel' },
      { name: 'Grab/Taxi', icon: 'car' },
      { name: 'Xe buýt', icon: 'bus' },
    ],
  },
  {
    key: 'housing',
    name: 'Nhà ở',
    type: 'expense',
    icon: 'home',
    color: '#3B82F6',
    children: [
      { name: 'Tiền trọ', icon: 'home' },
      { name: 'Điện nước', icon: 'zap' },
      { name: 'Internet', icon: 'wifi' },
    ],
  },
  {
    key: 'study',
    name: 'Học tập',
    type: 'expense',
    icon: 'book',
    color: '#6366F1',
    children: [
      { name: 'Học phí', icon: 'school' },
      { name: 'Sách vở', icon: 'book' },
      { name: 'Khoá học', icon: 'laptop' },
    ],
  },
  {
    key: 'entertainment',
    name: 'Giải trí',
    type: 'expense',
    icon: 'smile',
    color: '#F97316',
    children: [
      { name: 'Phim ảnh', icon: 'film' },
      { name: 'Game', icon: 'gamepad' },
      { name: 'Du lịch', icon: 'map' },
    ],
  },
  {
    key: 'health',
    name: 'Sức khoẻ',
    type: 'expense',
    icon: 'heart',
    color: '#EF4444',
    children: [
      { name: 'Thuốc', icon: 'pill' },
      { name: 'Khám bệnh', icon: 'stethoscope' },
    ],
  },
  {
    key: 'shopping',
    name: 'Mua sắm',
    type: 'expense',
    icon: 'shopping-bag',
    color: '#EC4899',
    children: [
      { name: 'Quần áo', icon: 'shirt' },
      { name: 'Đồ dùng', icon: 'package' },
    ],
  },
  {
    key: 'sports',
    name: 'Thể thao',
    type: 'expense',
    icon: 'dumbbell',
    color: '#14B8A6',
    children: [
      { name: 'Gym', icon: 'dumbbell' },
      { name: 'Bơi lội', icon: 'waves' },
    ],
  },
  {
    key: 'other',
    name: 'Khác',
    type: 'expense',
    icon: 'more-horizontal',
    color: '#6B7280',
    children: [
      { name: 'Quà tặng', icon: 'gift' },
      { name: 'Từ thiện', icon: 'heart-handshake' },
    ],
  },
  {
    key: 'income',
    name: 'Thu nhập',
    type: 'income',
    icon: 'briefcase',
    color: '#10B981',
    children: [
      { name: 'Lương', icon: 'briefcase' },
      { name: 'Thưởng', icon: 'gift' },
      { name: 'Thu nhập khác', icon: 'plus-circle' },
    ],
  },
];

const STUDENT_GROUPS = ['eating', 'transport', 'housing', 'study', 'entertainment', 'health', 'shopping', 'other', 'income'];
const PROFESSIONAL_GROUPS = ['eating', 'transport', 'housing', 'shopping', 'entertainment', 'health', 'sports', 'other', 'income'];

const PRESETS: {
  key: PresetKey;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  recommended?: boolean;
  groups: string[];
}[] = [
  {
    key: 'student',
    title: 'Sinh viên',
    subtitle: 'Đủ nhóm chi tiêu phổ biến + thu nhập cơ bản.',
    icon: <GraduationCap className="w-6 h-6" />,
    recommended: true,
    groups: STUDENT_GROUPS,
  },
  {
    key: 'professional',
    title: 'Người mới đi làm',
    subtitle: 'Tập trung Nhà ở, Đi lại, Ăn uống, Mua sắm.',
    icon: <Briefcase className="w-6 h-6" />,
    groups: PROFESSIONAL_GROUPS,
  },
  {
    key: 'custom',
    title: 'Tự tuỳ chỉnh',
    subtitle: 'Chọn nhóm danh mục bạn muốn tạo.',
    icon: <SlidersHorizontal className="w-6 h-6" />,
    groups: STUDENT_GROUPS, // default starting point
  },
];

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function OnboardingCategoriesSetup() {
  const navigate = useNavigate();
  const { addCategory, accounts, categories } = useDemoData();
  const toast = useToast();

  const [selectedPreset, setSelectedPreset] = useState<PresetKey>('student');
  const [customGroupKeys, setCustomGroupKeys] = useState<Set<string>>(new Set(STUDENT_GROUPS));
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
  const [showQuickEditSheet, setShowQuickEditSheet] = useState(false);
  const [showSuccessSheet, setShowSuccessSheet] = useState(false);

  // Active group keys based on selection
  const activeGroupKeys = useMemo(() => {
    if (selectedPreset === 'custom') return customGroupKeys;
    const preset = PRESETS.find((p) => p.key === selectedPreset)!;
    return new Set(preset.groups);
  }, [selectedPreset, customGroupKeys]);

  const activeGroups = useMemo(
    () => ALL_CATEGORY_GROUPS.filter((g) => activeGroupKeys.has(g.key)),
    [activeGroupKeys]
  );

  const totalSubCategories = useMemo(
    () => activeGroups.reduce((sum, g) => sum + g.children.length, 0),
    [activeGroups]
  );

  // Wallet count from DemoData (already created in ONB-02)
  const walletCount = accounts.length;

  // ===== HANDLERS =====

  const handleSkip = () => {
    // Auto-generate student preset
    generateCategories(new Set(STUDENT_GROUPS));
    toast.info('Đã tạo danh mục mặc định "Sinh viên".');
    navigate('/home');
  };

  const handleFinish = () => {
    generateCategories(activeGroupKeys);
    setShowSuccessSheet(true);
  };

  const handleStart = () => {
    setShowSuccessSheet(false);
    toast.success('Onboarding hoàn tất');
    navigate('/home');
  };

  const generateCategories = (groupKeys: Set<string>) => {
    const groups = ALL_CATEGORY_GROUPS.filter((g) => groupKeys.has(g.key));

    groups.forEach((group) => {
      // Create parent category
      const parent = addCategory({
        name: group.name,
        type: group.type,
        icon: group.icon,
        color: group.color,
      });

      // Create children
      group.children.forEach((child) => {
        addCategory({
          name: child.name,
          type: group.type,
          icon: child.icon,
          color: group.color,
          parentId: parent.id,
        });
      });
    });
  };

  const toggleCustomGroup = (key: string) => {
    setCustomGroupKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        // Don't allow unchecking "income" — always need at least 1
        if (next.size <= 1) return prev;
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const handlePresetSelect = (key: PresetKey) => {
    setSelectedPreset(key);
    if (key !== 'custom') {
      setExpandedGroup(null);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)] flex flex-col">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-center justify-between px-4 py-4 sm:px-6"
      >
        {/* Left: Back */}
        <button
          onClick={() => navigate('/onboarding/wallet-balance')}
          className="p-2 -ml-2 rounded-[var(--radius-md)] hover:bg-[var(--surface)] transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-[var(--text-primary)]" />
        </button>

        {/* Center: Progress */}
        <div className="flex flex-col items-center gap-1">
          <span className="text-xs text-[var(--text-tertiary)]">Bước 3/3</span>
          <div className="w-24 h-1 bg-[var(--surface)] rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-[var(--primary)] rounded-full"
              initial={{ width: '66%' }}
              animate={{ width: '100%' }}
              transition={{ duration: 0.6, delay: 0.3 }}
            />
          </div>
        </div>

        {/* Right: Skip */}
        <button
          onClick={handleSkip}
          className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors px-2 py-1"
        >
          Bỏ qua
        </button>
      </motion.header>

      {/* Content */}
      <div className="flex-1 px-4 sm:px-6 pb-6 flex flex-col max-w-lg mx-auto w-full overflow-y-auto">
        {/* Title & Description */}
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
            Chọn bộ danh mục có sẵn để xem báo cáo đẹp ngay. Bạn có thể chỉnh sửa lại trong Categories.
          </p>
        </motion.div>

        {/* Section A: Select Preset */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="bg-[var(--surface-elevated)] border border-[var(--border)] rounded-[var(--radius-xl)] p-4 mb-4 shadow-[var(--shadow-sm)]"
        >
          <h2 className="text-sm font-medium text-[var(--text-primary)] mb-3">Chọn preset</h2>

          <div className="space-y-3">
            {PRESETS.map((preset) => {
              const isSelected = selectedPreset === preset.key;
              return (
                <button
                  key={preset.key}
                  onClick={() => handlePresetSelect(preset.key)}
                  className={`w-full flex items-start gap-3 p-3 rounded-[var(--radius-lg)] border-2 transition-all text-left ${
                    isSelected
                      ? 'border-[var(--primary)] bg-[var(--primary-light)]'
                      : 'border-[var(--border)] bg-[var(--background)] hover:border-[var(--primary)]/50'
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                      isSelected
                        ? 'bg-[var(--primary)] text-white'
                        : 'bg-[var(--surface)] text-[var(--text-secondary)]'
                    }`}
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
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      isSelected
                        ? 'border-[var(--primary)] bg-[var(--primary)]'
                        : 'border-[var(--border)]'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3 text-white" />}
                  </div>
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* Section B: Category Preview */}
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
            {selectedPreset === 'custom' && (
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
                    onClick={() => setExpandedGroup(isExpanded ? null : group.key)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-md)] hover:bg-[var(--surface)] transition-colors"
                  >
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: group.color + '20' }}
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
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="pl-13 pb-2">
                          {group.children.map((child, idx) => (
                            <div
                              key={idx}
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
              {activeGroups.length} nhóm &middot; {totalSubCategories} danh mục con
            </p>
          </div>
        </motion.div>

        {/* Section C: Setup Summary */}
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
              value="VND"
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

        {/* Spacer */}
        <div className="flex-1 min-h-4" />

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.45 }}
          className="mt-6 sticky bottom-4"
        >
          <button
            onClick={handleFinish}
            className="w-full py-3.5 rounded-[var(--radius-lg)] font-medium text-base transition-all shadow-[var(--shadow-sm)] bg-[var(--primary)] text-[var(--primary-foreground)] hover:bg-[var(--primary-hover)] active:scale-[0.98]"
          >
            Hoàn tất
          </button>
          <p className="text-center text-xs text-[var(--text-tertiary)] mt-3">
            Bạn có thể chỉnh trong Settings/Categories sau.
          </p>
        </motion.div>
      </div>

      {/* ====== QUICK EDIT BOTTOM SHEET ====== */}
      <AnimatePresence>
        {showQuickEditSheet && (
          <QuickEditSheet
            allGroups={ALL_CATEGORY_GROUPS}
            selectedKeys={customGroupKeys}
            onToggle={toggleCustomGroup}
            onClose={() => setShowQuickEditSheet(false)}
          />
        )}
      </AnimatePresence>

      {/* ====== SUCCESS BOTTOM SHEET ====== */}
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
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-[var(--card)] rounded-t-[var(--radius-2xl)] shadow-2xl"
            >
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full bg-[var(--border)]" />
              </div>
              <div className="px-6 py-8 text-center">
                {/* Success icon */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', damping: 12, stiffness: 200, delay: 0.2 }}
                  className="w-20 h-20 rounded-full bg-[var(--success-light)] flex items-center justify-center mx-auto mb-5"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.4, type: 'spring' }}
                  >
                    <Check className="w-10 h-10 text-[var(--success)]" />
                  </motion.div>
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
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================================================
// QUICK EDIT SHEET
// ============================================================================

function QuickEditSheet({
  allGroups,
  selectedKeys,
  onToggle,
  onClose,
}: {
  allGroups: CategoryGroup[];
  selectedKeys: Set<string>;
  onToggle: (key: string) => void;
  onClose: () => void;
}) {
  const canFinish = selectedKeys.size >= 1;

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/50"
        onClick={onClose}
      />
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        className="fixed bottom-0 left-0 right-0 z-50 bg-[var(--card)] rounded-t-[var(--radius-2xl)] shadow-2xl max-h-[85vh] flex flex-col"
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-[var(--border)]" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pb-3 border-b border-[var(--border)]">
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">
            Chọn nhóm danh mục
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-[var(--radius-md)] hover:bg-[var(--surface)] transition-colors"
          >
            <X className="w-5 h-5 text-[var(--text-secondary)]" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          <div className="space-y-2">
            {allGroups.map((group) => {
              const isChecked = selectedKeys.has(group.key);
              return (
                <button
                  key={group.key}
                  onClick={() => onToggle(group.key)}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-[var(--radius-lg)] border transition-all ${
                    isChecked
                      ? 'border-[var(--primary)] bg-[var(--primary-light)]'
                      : 'border-[var(--border)] hover:border-[var(--primary)]/50'
                  }`}
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: group.color + '20' }}
                  >
                    <span className="text-sm" style={{ color: group.color }}>
                      {getCategoryEmoji(group.key)}
                    </span>
                  </div>
                  <div className="flex-1 text-left">
                    <span className="text-sm font-medium text-[var(--text-primary)]">
                      {group.name}
                    </span>
                    <span className="text-xs text-[var(--text-tertiary)] ml-1.5">
                      ({group.children.length})
                    </span>
                  </div>
                  <div
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                      isChecked
                        ? 'border-[var(--primary)] bg-[var(--primary)]'
                        : 'border-[var(--border)]'
                    }`}
                  >
                    {isChecked && <Check className="w-3 h-3 text-white" />}
                  </div>
                </button>
              );
            })}
          </div>

          {!canFinish && (
            <div className="flex items-center gap-1.5 mt-3">
              <AlertCircle className="w-3.5 h-3.5 text-[var(--danger)]" />
              <span className="text-xs text-[var(--danger)]">
                Cần chọn ít nhất 1 nhóm danh mục.
              </span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="px-5 py-4 border-t border-[var(--border)] flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-[var(--radius-lg)] border border-[var(--border)] text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--surface)] transition-colors"
          >
            Huỷ
          </button>
          <button
            onClick={onClose}
            disabled={!canFinish}
            className={`flex-1 py-2.5 rounded-[var(--radius-lg)] text-sm font-medium transition-colors ${
              canFinish
                ? 'bg-[var(--primary)] text-[var(--primary-foreground)] hover:bg-[var(--primary-hover)]'
                : 'bg-[var(--border)] text-[var(--text-tertiary)] cursor-not-allowed'
            }`}
          >
            Xong
          </button>
        </div>
      </motion.div>
    </>
  );
}

// ============================================================================
// HELPERS
// ============================================================================

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
        className="w-8 h-8 rounded-[var(--radius-md)] flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: color + '15', color }}
      >
        {icon}
      </div>
      <span className="text-sm text-[var(--text-secondary)] flex-1">{label}</span>
      <span className="text-sm font-medium text-[var(--text-primary)]">{value}</span>
    </div>
  );
}

function getCategoryEmoji(key: string): string {
  const emojiMap: Record<string, string> = {
    eating: '🍜',
    transport: '🚗',
    housing: '🏠',
    study: '📚',
    entertainment: '🎬',
    health: '💊',
    shopping: '🛍️',
    sports: '🏃',
    other: '📦',
    income: '💰',
  };
  return emojiMap[key] || '📁';
}

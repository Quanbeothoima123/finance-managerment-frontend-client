import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { ChevronLeft, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { useSocialData, type Audience, type RecapType, type FinanceRecapData } from '../contexts/SocialDataContext';
import { useDemoData } from '../contexts/DemoDataContext';
import { FinanceRecapCard } from '../components/social/FinanceRecapCard';
import { AudienceSelector } from '../components/social/AudienceSelector';
import { SensitiveInfoBanner } from '../components/social/SensitiveInfoBanner';
import { useToast } from '../contexts/ToastContext';

export default function ShareFinanceRecap() {
  const navigate = useNavigate();
  const { addPost, currentUser } = useSocialData();
  const { transactions, budgets, goals } = useDemoData();
  const toast = useToast();

  const [selectedType, setSelectedType] = useState<RecapType>('weekly');
  const [caption, setCaption] = useState('');
  const [audience, setAudience] = useState<Audience>('public');
  const [showAudienceSheet, setShowAudienceSheet] = useState(false);
  const [privacyToggles, setPrivacyToggles] = useState({
    showExactAmounts: false,
    showPercentOnly: true,
    hideSensitiveCategories: true,
    hideAccountInfo: true,
  });

  const formatVND = (n: number) => new Intl.NumberFormat('vi-VN').format(n) + 'đ';

  // Build recap data from REAL DemoDataContext
  const recapTemplates = useMemo((): { type: RecapType; label: string; description: string; data: FinanceRecapData }[] => {
    const now = new Date('2026-03-17');
    const weekStart = new Date(now); weekStart.setDate(now.getDate() - 7);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Weekly
    const weekTxn = transactions.filter(t => new Date(t.date) >= weekStart && new Date(t.date) <= now);
    const weekIncome = weekTxn.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const weekExpense = weekTxn.filter(t => t.type === 'expense').reduce((s, t) => s + Math.abs(t.amount), 0);
    const weekSaving = weekIncome - weekExpense;

    // Monthly
    const monthTxn = transactions.filter(t => new Date(t.date) >= monthStart && new Date(t.date) <= now);
    const monthIncome = monthTxn.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const monthExpense = monthTxn.filter(t => t.type === 'expense').reduce((s, t) => s + Math.abs(t.amount), 0);
    const monthSaving = monthIncome - monthExpense;

    // Goal - use first active goal
    const activeGoal = goals.find(g => g.status === 'active');
    const goalProgress = activeGoal ? Math.round((activeGoal.currentAmount / activeGoal.targetAmount) * 100) : 0;

    // Budget - use first budget
    const activeBudget = budgets[0];
    const budgetSpent = activeBudget
      ? transactions
          .filter(t => t.type === 'expense' && activeBudget.categories.includes(t.categoryId || '') && t.date >= activeBudget.startDate && t.date <= activeBudget.endDate)
          .reduce((s, t) => s + Math.abs(t.amount), 0)
      : 0;
    const budgetProgress = activeBudget ? Math.round((budgetSpent / activeBudget.amount) * 100) : 0;

    return [
      {
        type: 'weekly',
        label: 'Recap tuần',
        description: 'Tổng hợp thu chi 7 ngày gần nhất',
        data: {
          type: 'weekly',
          title: 'Recap tuần 11/2026',
          period: '10/03 - 16/03/2026',
          stats: [
            { label: 'Thu nhập', value: formatVND(weekIncome), trend: 'up' },
            { label: 'Chi tiêu', value: formatVND(weekExpense), trend: weekExpense > weekIncome * 0.7 ? 'up' : 'down' },
            { label: 'Tiết kiệm', value: formatVND(Math.max(0, weekSaving)), trend: weekSaving > 0 ? 'up' : 'down' },
          ],
          progress: weekIncome > 0 ? Math.round(((weekIncome - weekExpense) / weekIncome) * 100) : 0,
          color: '#16A34A',
        },
      },
      {
        type: 'monthly',
        label: 'Tổng kết tháng',
        description: 'Tổng hợp tài chính tháng này',
        data: {
          type: 'monthly',
          title: 'Tổng kết tháng 3/2026',
          period: 'Tháng 03/2026',
          stats: [
            { label: 'Tổng thu', value: formatVND(monthIncome), trend: 'neutral' },
            { label: 'Tổng chi', value: formatVND(monthExpense), trend: 'down' },
            { label: 'Tiết kiệm', value: formatVND(Math.max(0, monthSaving)), trend: monthSaving > 0 ? 'up' : 'down' },
            { label: 'Tỷ lệ tiết kiệm', value: monthIncome > 0 ? `${Math.round(((monthIncome - monthExpense) / monthIncome) * 100)}%` : '0%', trend: monthSaving > 0 ? 'up' : 'neutral' },
          ],
          color: '#0891B2',
        },
      },
      {
        type: 'goal',
        label: 'Tiến độ mục tiêu',
        description: activeGoal ? activeGoal.name : 'Chưa có mục tiêu nào',
        data: {
          type: 'goal',
          title: `Mục tiêu: ${activeGoal?.name || 'Quỹ khẩn cấp'}`,
          stats: [
            { label: 'Đã tiết kiệm', value: formatVND(activeGoal?.currentAmount || 0) },
            { label: 'Mục tiêu', value: formatVND(activeGoal?.targetAmount || 10000000) },
            { label: 'Còn lại', value: formatVND(Math.max(0, (activeGoal?.targetAmount || 10000000) - (activeGoal?.currentAmount || 0))) },
          ],
          progress: goalProgress,
          color: '#0066FF',
        },
      },
      {
        type: 'budget',
        label: 'Tiến độ ngân sách',
        description: activeBudget ? activeBudget.name : 'Chưa có ngân sách nào',
        data: {
          type: 'budget',
          title: `Ngân sách: ${activeBudget?.name || 'Ăn uống'}`,
          period: 'Tháng 3/2026',
          stats: [
            { label: 'Đã chi', value: formatVND(budgetSpent) },
            { label: 'Giới hạn', value: formatVND(activeBudget?.amount || 3000000) },
            { label: 'Còn lại', value: formatVND(Math.max(0, (activeBudget?.amount || 3000000) - budgetSpent)) },
          ],
          progress: budgetProgress,
          color: '#EA580C',
        },
      },
    ];
  }, [transactions, budgets, goals]);

  const selectedTemplate = recapTemplates.find(t => t.type === selectedType)!;

  // Apply privacy masking
  const maskedData: FinanceRecapData = useMemo(() => ({
    ...selectedTemplate.data,
    stats: selectedTemplate.data.stats.map(s => ({
      ...s,
      value: privacyToggles.showExactAmounts ? s.value : (s.value.includes('%') ? s.value : '***'),
    })),
  }), [selectedTemplate.data, privacyToggles.showExactAmounts]);

  const displayData = privacyToggles.showExactAmounts ? selectedTemplate.data : maskedData;

  const handleShare = () => {
    addPost({
      authorId: currentUser.id,
      type: 'recap',
      content: caption || `Chia sẻ ${selectedTemplate.label.toLowerCase()} của mình!`,
      recapData: displayData,
      topics: ['Budget', 'Tiết kiệm'],
      audience,
    });
    toast.success('Đã chia sẻ recap lên cộng đồng!');
    navigate('/community');
  };

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="sticky top-0 z-20 bg-[var(--background)]/95 backdrop-blur-sm border-b border-[var(--border)] px-4 py-3 flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-[var(--text-secondary)]">
            <ChevronLeft className="w-4 h-4" /> Quay lại
          </button>
          <h1 className="font-semibold text-[var(--text-primary)]">Chia sẻ Recap</h1>
          <button onClick={handleShare} className="px-4 py-1.5 rounded-full text-sm font-semibold bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)]">
            Đăng
          </button>
        </div>

        <div className="px-4 py-4 space-y-5">
          {/* Source Selector */}
          <div>
            <p className="text-sm font-medium text-[var(--text-primary)] mb-2">Chọn nguồn dữ liệu</p>
            <div className="grid grid-cols-2 gap-2">
              {recapTemplates.map(t => (
                <button
                  key={t.type}
                  onClick={() => setSelectedType(t.type)}
                  className={`p-3 rounded-xl text-left transition-all ${
                    selectedType === t.type
                      ? 'bg-[var(--primary)] text-white ring-2 ring-[var(--primary)] ring-offset-2 ring-offset-[var(--background)]'
                      : 'bg-[var(--surface)] text-[var(--text-secondary)] hover:bg-[var(--primary-light)]'
                  }`}
                >
                  <p className="text-sm font-semibold">{t.label}</p>
                  <p className={`text-xs mt-0.5 ${selectedType === t.type ? 'text-white/80' : 'text-[var(--text-tertiary)]'}`}>
                    {t.description}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Preview Card */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-[var(--text-primary)]">Xem trước</p>
              <div className="flex items-center gap-1 text-xs text-[var(--success)]">
                <ShieldCheck className="w-3.5 h-3.5" />
                Chia sẻ an toàn
              </div>
            </div>
            <FinanceRecapCard data={displayData} large showPrivacyHint />
          </div>

          {/* Privacy Toggles */}
          <div className="bg-[var(--card)] rounded-2xl border border-[var(--border)] p-4 space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <ShieldCheck className="w-4 h-4 text-[var(--success)]" />
              <p className="text-sm font-semibold text-[var(--text-primary)]">Bảo mật thông tin</p>
            </div>
            <p className="text-xs text-[var(--text-tertiary)] -mt-2 mb-2">Chọn dữ liệu bạn muốn hiển thị</p>
            {[
              { key: 'showExactAmounts' as const, label: 'Hiển thị số tiền chính xác', desc: 'Mọi người sẽ thấy con số thật', icon: <Eye className="w-4 h-4" /> },
              { key: 'showPercentOnly' as const, label: 'Chỉ hiển thị phần trăm tiến độ', desc: 'Ẩn số tiền, chỉ hiện %', icon: <EyeOff className="w-4 h-4" /> },
              { key: 'hideSensitiveCategories' as const, label: 'Ẩn danh mục nhạy cảm', desc: 'Ẩn các danh mục riêng tư', icon: <EyeOff className="w-4 h-4" /> },
              { key: 'hideAccountInfo' as const, label: 'Ẩn thông tin tài khoản', desc: 'Không hiển thị tên tài khoản', icon: <EyeOff className="w-4 h-4" /> },
            ].map(toggle => (
              <label key={toggle.key} className="flex items-center justify-between py-1 cursor-pointer">
                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                  <span className="text-[var(--text-secondary)]">{toggle.icon}</span>
                  <div>
                    <span className="text-sm text-[var(--text-primary)] block">{toggle.label}</span>
                    <span className="text-xs text-[var(--text-tertiary)]">{toggle.desc}</span>
                  </div>
                </div>
                <div
                  onClick={() => setPrivacyToggles(prev => ({ ...prev, [toggle.key]: !prev[toggle.key] }))}
                  className={`flex-shrink-0 w-10 h-6 rounded-full transition-colors cursor-pointer flex items-center ${
                    privacyToggles[toggle.key] ? 'bg-[var(--primary)]' : 'bg-[var(--surface)]'
                  }`}
                >
                  <div className={`w-[18px] h-[18px] bg-white rounded-full shadow-sm transition-transform ${
                    privacyToggles[toggle.key] ? 'translate-x-5' : 'translate-x-0.5'
                  }`} />
                </div>
              </label>
            ))}
          </div>

          {/* Caption */}
          <div>
            <p className="text-sm font-medium text-[var(--text-primary)] mb-2">Lời chia sẻ (tùy chọn)</p>
            <textarea
              value={caption}
              onChange={e => setCaption(e.target.value)}
              placeholder="Thêm lời chia sẻ của bạn..."
              className="w-full h-24 bg-[var(--surface)] rounded-xl p-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] resize-none outline-none focus:ring-2 focus:ring-[var(--primary)]"
            />
          </div>

          {/* Audience */}
          <div>
            <p className="text-sm font-medium text-[var(--text-primary)] mb-2">Ai có thể thấy?</p>
            <AudienceSelector value={audience} onChange={setAudience} />
          </div>

          {/* Safety Banner */}
          <SensitiveInfoBanner
            variant="info"
            title="Chia sẻ recap an toàn"
            description="Recap được tạo tự động từ dữ liệu của bạn. Bạn có thể ẩn số tiền chính xác và chỉ hiển thị phần trăm tiến độ."
          />

          {/* CTA */}
          <button
            onClick={handleShare}
            className="w-full py-3.5 bg-[var(--primary)] text-white rounded-2xl font-semibold text-sm hover:bg-[var(--primary-hover)] transition-colors"
          >
            Đăng lên cộng đồng
          </button>
        </div>
      </div>
    </div>
  );
}

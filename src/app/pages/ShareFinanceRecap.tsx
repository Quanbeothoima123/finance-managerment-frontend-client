import React, { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { ChevronLeft, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { useMyProfile } from "../hooks/useMyProfile";
import { communityPostsService } from "../services/communityPostsService";
import { useAppData } from "../contexts/AppDataContext";
import { FinanceRecapCard } from "../components/social/FinanceRecapCard";
import type { RecapCardData } from "../components/social/FinanceRecapCard";
import { AudienceSelector } from "../components/social/AudienceSelector";
import { SensitiveInfoBanner } from "../components/social/SensitiveInfoBanner";
import { useToast } from "../contexts/ToastContext";
import type { PostAudience, RecapType } from "../types/community";

export default function ShareFinanceRecap() {
  const { t, i18n } = useTranslation('reports');
  const locale = i18n.language === 'vi' ? 'vi-VN' : 'en-US';
  const navigate = useNavigate();
  const { data: myProfile } = useMyProfile();
  const { transactions, budgets, goals } = useAppData();
  const toast = useToast();

  const [selectedType, setSelectedType] = useState<RecapType>("weekly");
  const [caption, setCaption] = useState("");
  const [audience, setAudience] = useState<PostAudience>("public");
  const [showAudienceSheet, setShowAudienceSheet] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [privacyToggles, setPrivacyToggles] = useState({
    showExactAmounts: false,
    showPercentOnly: true,
    hideSensitiveCategories: true,
    hideAccountInfo: true,
  });

  const formatVND = (n: number) =>
    new Intl.NumberFormat(locale).format(n) + "đ";

  const recapTemplates = useMemo((): {
    type: RecapType;
    label: string;
    description: string;
    data: RecapCardData;
  }[] => {
    const now = new Date("2026-03-17");
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - 7);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const weekTxn = transactions.filter(
      (t) => new Date(t.date) >= weekStart && new Date(t.date) <= now,
    );
    const weekIncome = weekTxn
      .filter((t) => t.type === "income")
      .reduce((s, t) => s + t.amount, 0);
    const weekExpense = weekTxn
      .filter((t) => t.type === "expense")
      .reduce((s, t) => s + Math.abs(t.amount), 0);
    const weekSaving = weekIncome - weekExpense;

    const monthTxn = transactions.filter(
      (t) => new Date(t.date) >= monthStart && new Date(t.date) <= now,
    );
    const monthIncome = monthTxn
      .filter((t) => t.type === "income")
      .reduce((s, t) => s + t.amount, 0);
    const monthExpense = monthTxn
      .filter((t) => t.type === "expense")
      .reduce((s, t) => s + Math.abs(t.amount), 0);
    const monthSaving = monthIncome - monthExpense;

    const activeGoal = goals.find((g) => g.status === "on-track");
    const goalProgress = activeGoal
      ? Math.round((activeGoal.currentAmount / activeGoal.targetAmount) * 100)
      : 0;

    const activeBudget = budgets[0];
    const budgetSpent = activeBudget
      ? transactions
          .filter(
            (t) =>
              t.type === "expense" &&
              activeBudget.categories.includes(t.categoryId || "") &&
              t.date >= activeBudget.startDate &&
              t.date <= activeBudget.endDate,
          )
          .reduce((s, t) => s + Math.abs(t.amount), 0)
      : 0;
    const budgetProgress = activeBudget
      ? Math.round((budgetSpent / activeBudget.amount) * 100)
      : 0;

    const week = 11;
    const year = 2026;
    const month = 3;
    return [
      {
        type: "weekly",
        label: t('share_recap.templates.weekly_label'),
        description: t('share_recap.templates.weekly_description'),
        data: {
          recapType: "weekly",
          title: t('share_recap.template_data.weekly_title', { week, year }),
          period: "10/03 - 16/03/2026",
          stats: [
            {
              label: t('share_recap.stats_labels.income'),
              value: formatVND(weekIncome),
              trend: "up" as const,
            },
            {
              label: t('share_recap.stats_labels.expense'),
              value: formatVND(weekExpense),
              trend: (weekExpense > weekIncome * 0.7 ? "up" : "down") as
                | "up"
                | "down",
            },
            {
              label: t('share_recap.stats_labels.savings'),
              value: formatVND(Math.max(0, weekSaving)),
              trend: (weekSaving > 0 ? "up" : "down") as "up" | "down",
            },
          ],
          progressPercent:
            weekIncome > 0
              ? Math.round(((weekIncome - weekExpense) / weekIncome) * 100)
              : 0,
          color: "#16A34A",
        },
      },
      {
        type: "monthly",
        label: t('share_recap.templates.monthly_label'),
        description: t('share_recap.templates.monthly_description'),
        data: {
          recapType: "monthly",
          title: t('share_recap.template_data.monthly_title', { month, year }),
          period: t('share_recap.template_data.monthly_period', { month: '03', year }),
          stats: [
            {
              label: t('share_recap.stats_labels.total_income'),
              value: formatVND(monthIncome),
              trend: "neutral" as const,
            },
            {
              label: t('share_recap.stats_labels.total_expense'),
              value: formatVND(monthExpense),
              trend: "down" as const,
            },
            {
              label: t('share_recap.stats_labels.savings'),
              value: formatVND(Math.max(0, monthSaving)),
              trend: (monthSaving > 0 ? "up" : "down") as "up" | "down",
            },
            {
              label: t('share_recap.stats_labels.savings_rate'),
              value:
                monthIncome > 0
                  ? `${Math.round(((monthIncome - monthExpense) / monthIncome) * 100)}%`
                  : "0%",
              trend: (monthSaving > 0 ? "up" : "neutral") as "up" | "neutral",
            },
          ],
          color: "#0891B2",
        },
      },
      {
        type: "goal",
        label: t('share_recap.templates.goal_label'),
        description: activeGoal ? activeGoal.name : t('share_recap.templates.goal_no_data'),
        data: {
          recapType: "goal",
          title: t('share_recap.template_data.goal_title', { name: activeGoal?.name || t('share_recap.template_data.goal_fallback') }),
          stats: [
            {
              label: t('share_recap.stats_labels.saved'),
              value: formatVND(activeGoal?.currentAmount || 0),
            },
            {
              label: t('share_recap.stats_labels.target'),
              value: formatVND(activeGoal?.targetAmount || 10000000),
            },
            {
              label: t('share_recap.stats_labels.remaining'),
              value: formatVND(
                Math.max(
                  0,
                  (activeGoal?.targetAmount || 10000000) -
                    (activeGoal?.currentAmount || 0),
                ),
              ),
            },
          ],
          progressPercent: goalProgress,
          color: "#0066FF",
        },
      },
      {
        type: "budget",
        label: t('share_recap.templates.budget_label'),
        description: activeBudget ? activeBudget.name : t('share_recap.templates.budget_no_data'),
        data: {
          recapType: "budget",
          title: t('share_recap.template_data.budget_title', { name: activeBudget?.name || t('share_recap.template_data.budget_fallback') }),
          period: t('share_recap.template_data.budget_period', { month, year }),
          stats: [
            { label: t('share_recap.stats_labels.spent'), value: formatVND(budgetSpent) },
            {
              label: t('share_recap.stats_labels.limit'),
              value: formatVND(activeBudget?.amount || 3000000),
            },
            {
              label: t('share_recap.stats_labels.remaining'),
              value: formatVND(
                Math.max(0, (activeBudget?.amount || 3000000) - budgetSpent),
              ),
            },
          ],
          progressPercent: budgetProgress,
          color: "#EA580C",
        },
      },
    ];
  }, [transactions, budgets, goals, t, locale]);

  const selectedTemplate = recapTemplates.find((t) => t.type === selectedType)!;

  const maskedData: RecapCardData = useMemo(
    () => ({
      ...selectedTemplate.data,
      stats: selectedTemplate.data.stats.map((s) => ({
        ...s,
        value: privacyToggles.showExactAmounts
          ? s.value
          : s.value.includes("%")
            ? s.value
            : "***",
      })),
    }),
    [selectedTemplate.data, privacyToggles.showExactAmounts],
  );

  const displayData = privacyToggles.showExactAmounts
    ? selectedTemplate.data
    : maskedData;

  const handleShare = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      await communityPostsService.createPost({
        type: "recap",
        content:
          caption ||
          t('share_recap.default_caption', { label: selectedTemplate.label.toLowerCase() }),
        audience,
        topicIds: [],
        recapData: {
          recapType: displayData.recapType,
          title: displayData.title,
          period: displayData.period || undefined,
          color: displayData.color,
          progressPercent: displayData.progressPercent ?? undefined,
          showExactAmounts: privacyToggles.showExactAmounts,
          hideSensitiveCategories: privacyToggles.hideSensitiveCategories,
          stats: displayData.stats.map((s, i) => ({
            label: s.label,
            value: s.value,
            trend:
              (s.trend as "up" | "down" | "neutral" | undefined) ?? undefined,
            sortOrder: s.sortOrder ?? i,
          })),
        },
      });
      toast.success(t('share_recap.toast.share_success'));
      navigate("/community");
    } catch {
      toast.error(t('share_recap.toast.share_failed'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="sticky top-0 z-20 bg-[var(--background)]/95 backdrop-blur-sm border-b border-[var(--border)] px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1 text-sm text-[var(--text-secondary)]"
          >
            <ChevronLeft className="w-4 h-4" /> {t('share_recap.back')}
          </button>
          <h1 className="font-semibold text-[var(--text-primary)]">
            {t('share_recap.title')}
          </h1>
          <button
            onClick={handleShare}
            disabled={submitting}
            className="px-4 py-1.5 rounded-full text-sm font-semibold bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] disabled:opacity-50"
          >
            {submitting ? t('share_recap.submitting') : t('share_recap.submit')}
          </button>
        </div>

        <div className="px-4 py-4 space-y-5">
          {/* Source Selector */}
          <div>
            <p className="text-sm font-medium text-[var(--text-primary)] mb-2">
              {t('share_recap.source_section')}
            </p>
            <div className="grid grid-cols-2 gap-2">
              {recapTemplates.map((t) => (
                <button
                  key={t.type}
                  onClick={() => setSelectedType(t.type)}
                  className={`p-3 rounded-xl text-left transition-all ${
                    selectedType === t.type
                      ? "bg-[var(--primary)] text-white ring-2 ring-[var(--primary)] ring-offset-2 ring-offset-[var(--background)]"
                      : "bg-[var(--surface)] text-[var(--text-secondary)] hover:bg-[var(--primary-light)]"
                  }`}
                >
                  <p className="text-sm font-semibold">{t.label}</p>
                  <p
                    className={`text-xs mt-0.5 ${selectedType === t.type ? "text-white/80" : "text-[var(--text-tertiary)]"}`}
                  >
                    {t.description}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Preview Card */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-[var(--text-primary)]">
                {t('share_recap.preview_section')}
              </p>
              <div className="flex items-center gap-1 text-xs text-[var(--success)]">
                <ShieldCheck className="w-3.5 h-3.5" />
                {t('share_recap.safe_share_label')}
              </div>
            </div>
            <FinanceRecapCard data={displayData} large showPrivacyHint />
          </div>

          {/* Privacy Toggles */}
          <div className="bg-[var(--card)] rounded-2xl border border-[var(--border)] p-4 space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <ShieldCheck className="w-4 h-4 text-[var(--success)]" />
              <p className="text-sm font-semibold text-[var(--text-primary)]">
                {t('share_recap.privacy.title')}
              </p>
            </div>
            <p className="text-xs text-[var(--text-tertiary)] -mt-2 mb-2">
              {t('share_recap.privacy.subtitle')}
            </p>
            {[
              {
                key: "showExactAmounts" as const,
                label: t('share_recap.privacy.show_exact_amounts_label'),
                desc: t('share_recap.privacy.show_exact_amounts_desc'),
                icon: <Eye className="w-4 h-4" />,
              },
              {
                key: "showPercentOnly" as const,
                label: t('share_recap.privacy.show_percent_only_label'),
                desc: t('share_recap.privacy.show_percent_only_desc'),
                icon: <EyeOff className="w-4 h-4" />,
              },
              {
                key: "hideSensitiveCategories" as const,
                label: t('share_recap.privacy.hide_sensitive_categories_label'),
                desc: t('share_recap.privacy.hide_sensitive_categories_desc'),
                icon: <EyeOff className="w-4 h-4" />,
              },
              {
                key: "hideAccountInfo" as const,
                label: t('share_recap.privacy.hide_account_info_label'),
                desc: t('share_recap.privacy.hide_account_info_desc'),
                icon: <EyeOff className="w-4 h-4" />,
              },
            ].map((toggle) => (
              <label
                key={toggle.key}
                className="flex items-center justify-between py-1 cursor-pointer"
              >
                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                  <span className="text-[var(--text-secondary)]">
                    {toggle.icon}
                  </span>
                  <div>
                    <span className="text-sm text-[var(--text-primary)] block">
                      {toggle.label}
                    </span>
                    <span className="text-xs text-[var(--text-tertiary)]">
                      {toggle.desc}
                    </span>
                  </div>
                </div>
                <div
                  onClick={() =>
                    setPrivacyToggles((prev) => ({
                      ...prev,
                      [toggle.key]: !prev[toggle.key],
                    }))
                  }
                  className={`flex-shrink-0 w-10 h-6 rounded-full transition-colors cursor-pointer flex items-center ${
                    privacyToggles[toggle.key]
                      ? "bg-[var(--primary)]"
                      : "bg-[var(--surface)]"
                  }`}
                >
                  <div
                    className={`w-[18px] h-[18px] bg-white rounded-full shadow-sm transition-transform ${
                      privacyToggles[toggle.key]
                        ? "translate-x-5"
                        : "translate-x-0.5"
                    }`}
                  />
                </div>
              </label>
            ))}
          </div>

          {/* Caption */}
          <div>
            <p className="text-sm font-medium text-[var(--text-primary)] mb-2">
              {t('share_recap.caption_section')}
            </p>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder={t('share_recap.caption_placeholder')}
              className="w-full h-24 bg-[var(--surface)] rounded-xl p-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] resize-none outline-none focus:ring-2 focus:ring-[var(--primary)]"
            />
          </div>

          {/* Audience */}
          <div>
            <p className="text-sm font-medium text-[var(--text-primary)] mb-2">
              {t('share_recap.audience_section')}
            </p>
            <AudienceSelector value={audience} onChange={setAudience} />
          </div>

          {/* Safety Banner */}
          <SensitiveInfoBanner
            variant="info"
            title={t('share_recap.safety_banner.title')}
            description={t('share_recap.safety_banner.description')}
          />

          {/* CTA */}
          <button
            onClick={handleShare}
            disabled={submitting}
            className="w-full py-3.5 bg-[var(--primary)] text-white rounded-2xl font-semibold text-sm hover:bg-[var(--primary-hover)] transition-colors disabled:opacity-50"
          >
            {submitting ? t('share_recap.submitting') : t('share_recap.publish')}
          </button>
        </div>
      </div>
    </div>
  );
}

import { useNavigate as useRouterNavigate } from 'react-router';

export function useAppNavigation() {
  const navigate = useRouterNavigate();

  return {
    // Core navigation
    goHome: () => navigate('/home'),
    goBack: () => navigate(-1),

    // Onboarding
    goOnboardingCurrencyDate: () => navigate('/onboarding/currency-date'),
    goOnboardingWalletBalance: () => navigate('/onboarding/wallet-balance'),
    goOnboardingCategoriesSetup: () => navigate('/onboarding/categories-setup'),

    // Auth
    goLogin: () => navigate('/auth/login'),
    goRegister: () => navigate('/auth/register'),
    goForgotPassword: () => navigate('/auth/forgot-password'),
    goVerifyOtp: (params?: { purpose?: string; email?: string }) => {
      const searchParams = new URLSearchParams();
      if (params?.purpose) searchParams.set('purpose', params.purpose);
      if (params?.email) searchParams.set('email', params.email);
      const qs = searchParams.toString();
      navigate(`/auth/verify-otp${qs ? `?${qs}` : ''}`);
    },

    // Transactions
    goTransactions: () => navigate('/transactions'),
    goCreateTransaction: (accountId?: string) => {
      const params = accountId ? `?accountId=${accountId}` : '';
      navigate(`/transactions/create${params}`);
    },
    goTransactionDetail: (id: string) => navigate(`/transactions/${id}`),
    goEditTransaction: (id: string) => navigate(`/transactions/${id}/edit`),
    goDuplicateTransaction: (id: string) => navigate(`/transactions/create?duplicateFrom=${id}`),

    // Accounts
    goAccounts: () => navigate('/accounts'),
    goCreateAccount: () => navigate('/accounts/create'),
    goAccountDetail: (id: string) => navigate(`/accounts/${id}`),
    goEditAccount: (id: string) => navigate(`/accounts/${id}/edit`),

    // Categories, Tags, Merchants
    goCategories: () => navigate('/categories'),
    goCreateCategory: () => navigate('/categories/create'),
    goEditCategory: (id: string) => navigate(`/categories/${id}/edit`),
    goTags: () => navigate('/tags'),
    goCreateTag: () => navigate('/tags/create'),
    goEditTag: (id: string) => navigate(`/tags/${id}/edit`),
    goMerchants: () => navigate('/merchants'),
    goCreateMerchant: () => navigate('/merchants/create'),
    goMerchantDetail: (id: string) => navigate(`/merchants/${id}`),
    goEditMerchant: (id: string) => navigate(`/merchants/${id}/edit`),

    // Budgets
    goBudgets: () => navigate('/budgets'),
    goCreateBudget: () => navigate('/budgets/create'),
    goBudgetDetail: (id: string) => navigate(`/budgets/${id}`),
    goEditBudget: (id: string) => navigate(`/budgets/${id}/edit`),
    goAddBudgetItem: (budgetId: string) => navigate(`/budgets/${budgetId}/add-item`),

    // Goals
    goGoals: () => navigate('/goals'),
    goCreateGoal: () => navigate('/goals/create'),
    goGoalDetail: (id: string) => navigate(`/goals/${id}`),
    goEditGoal: (id: string) => navigate(`/goals/${id}/edit`),
    goAddGoalContribution: (goalId: string) => navigate(`/goals/${goalId}/add-contribution`),

    // Insights
    goInsights: () => navigate('/insights'),
    goCategoryBreakdown: () => navigate('/insights/category-breakdown'),
    goCashflow: () => navigate('/insights/cashflow'),
    goAccountBreakdown: () => navigate('/insights/account-breakdown'),
    goMonthlyRecap: () => navigate('/insights/monthly-recap'),
    goWeeklyRecap: () => navigate('/insights/weekly-recap'),
    goMonthlySummary: () => navigate('/export/monthly-summary'),

    // Rules
    goAutoRules: () => navigate('/rules/auto'),
    goCreateAutoRule: () => navigate('/rules/auto/create'),
    goEditAutoRule: (id: string) => navigate(`/rules/auto/${id}/edit`),
    goRecurringRules: () => navigate('/rules/recurring'),
    goRecurringRuleDetail: (id: string) => navigate(`/rules/recurring/${id}`),
    goCreateRecurringRule: () => navigate('/rules/recurring/create'),
    goEditRecurringRule: (id: string) => navigate(`/rules/recurring/${id}/edit`),

    // Settings
    goSettings: () => navigate('/settings'),
    goSecuritySettings: () => navigate('/settings/security'),
    goBackupSettings: () => navigate('/settings/backup'),
    goNotificationSettings: () => navigate('/settings/notifications'),
    goNotifications: () => navigate('/notifications'),
    goAbout: () => navigate('/about'),
    goGeneralSettings: () => navigate('/settings/general'),
    goRestoreData: () => navigate('/settings/restore'),

    // Attachments & Export
    goAttachments: () => navigate('/attachments'),
    goExport: () => navigate('/export'),

    // Generic navigation
    goTo: (path: string) => navigate(path),
  };
}
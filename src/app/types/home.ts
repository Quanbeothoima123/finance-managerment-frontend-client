import type { TransactionListItem } from "./transactions";

export interface HomeTrend {
  deltaPercent: number | null;
  deltaMinor: string | null;
  isPositive: boolean;
  comparedLabel: string;
}

export interface HomeSpendingByDayItem {
  date: string;
  day: number;
  expenseMinor: string;
  cumulativeExpenseMinor: string;
}

export interface HomeBudgetPreview {
  id: string;
  name: string;
  periodType: string;
  status: string;
  startDate: string;
  endDate: string | null;
  totalLimitMinor: string;
  spentMinor: string;
  remainingMinor: string;
  progressPercent: number;
  isOverBudget: boolean;
  alertsEnabled: boolean;
  rolloverEnabled: boolean;
  effectivePeriodStart: string;
  effectivePeriodEnd: string;
  itemCount: number;
  primaryCategory: {
    id: string;
    name: string;
    categoryType: string;
    iconKey: string | null;
    colorHex: string | null;
  } | null;
}

export interface HomeInsightCard {
  variant: "positive" | "warning" | "neutral" | string;
  title: string;
  message: string;
  badges: string[];
  comparison: {
    currentWeekExpenseMinor: string | null;
    previousWeekExpenseMinor: string | null;
    deltaMinor: string | null;
    deltaPercent: number | null;
    topCategory: {
      id: string;
      name: string;
      savedMinor: string;
      deltaPercent: number | null;
    } | null;
  };
}

export interface HomeRecurringPreview {
  id: string;
  name: string;
  txnType: string;
  executionMode: string;
  frequency: string;
  intervalValue: number;
  amountMinor: string;
  currencyCode: string;
  nextRunAt: string;
  isPaused: boolean;
  account: {
    id: string;
    name: string;
    accountType: string;
    accountTypeLabel: string;
  } | null;
  toAccount: {
    id: string;
    name: string;
    accountType: string;
    accountTypeLabel: string;
  } | null;
  category: {
    id: string;
    name: string;
    categoryType: string;
    iconKey: string | null;
    colorHex: string | null;
  } | null;
  merchant: {
    id: string;
    name: string;
  } | null;
}

export interface HomeOverviewResponse {
  ledger: {
    id: string;
    name: string;
    baseCurrencyCode: string;
    timezone: string;
    weekStartsOn: number;
  };
  month: string;
  period: {
    startDate: string;
    endDate: string;
  };
  summary: {
    totalBalanceMinor: string;
    incomeMinor: string;
    expenseMinor: string;
    netMinor: string;
    activeAccountCount: number;
    transactionCount: number;
    trends: {
      income: HomeTrend | null;
      expense: HomeTrend | null;
      net: HomeTrend | null;
    };
  };
  chart: {
    spendingByDay: HomeSpendingByDayItem[];
  };
  budgetsPreview: HomeBudgetPreview[];
  insightCard: HomeInsightCard | null;
  upcomingRecurring: HomeRecurringPreview[];
  recentTransactions: TransactionListItem[];
  sections: {
    hasBudgets: boolean;
    hasRecurring: boolean;
    hasInsight: boolean;
    hasTransactions: boolean;
  };
}

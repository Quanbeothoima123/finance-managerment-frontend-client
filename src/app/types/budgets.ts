import type { TransactionListItem } from "./transactions";

export type BudgetPeriodType =
  | "weekly"
  | "monthly"
  | "quarterly"
  | "yearly"
  | "custom";

export type BudgetStatus = "active" | "inactive" | "archived";

export interface BudgetCategoryRef {
  id: string;
  name: string;
  categoryType: string;
  parentId: string | null;
  iconKey: string | null;
  colorHex: string | null;
  archivedAt: string | null;
}

export interface BudgetItemPreview {
  id: string;
  categoryId: string;
  category: BudgetCategoryRef | null;
  limitAmountMinor: string;
  spentMinor: string;
  progressPercent: number;
}

export interface BudgetSummaryItem {
  id: string;
  ledgerId: string;
  name: string;
  periodType: BudgetPeriodType | string;
  period: BudgetPeriodType | string;
  rolloverEnabled: boolean;
  rollover: boolean;
  alertsEnabled: boolean;
  status: BudgetStatus | string;
  startDate: string;
  endDate: string | null;
  totalLimitMinor: string;
  amountMinor: string;
  amount: string;
  spentMinor: string;
  spent: string;
  remainingMinor: string;
  remaining: string;
  progressPercent: number;
  itemCount: number;
  categories: string[];
  alertThresholds: number[];
  thresholds: number[];
  itemsPreview: BudgetItemPreview[];
  createdAt: string;
  updatedAt: string;
}

export interface BudgetItemDetail {
  id: string;
  categoryId: string;
  category: BudgetCategoryRef | null;
  categoryName: string | null;
  limitAmountMinor: string;
  limitMinor: string;
  limit: string;
  spentMinor: string;
  spent: string;
  remainingMinor: string;
  remaining: string;
  progressPercent: number;
  transactionCount: number;
  alertThresholds: number[];
  thresholds: number[];
  alertThreshold50: boolean;
  alertThreshold80: boolean;
  alertThreshold100: boolean;
}

export interface BudgetsMetaResponse {
  ledger: {
    id: string;
    name: string;
    baseCurrencyCode: string;
    timezone: string;
    weekStartsOn: number;
  };
  categories: BudgetCategoryRef[];
}

export interface BudgetsListResponse {
  ledger: {
    id: string;
    name: string;
    baseCurrencyCode: string;
    timezone: string;
    weekStartsOn: number;
  };
  summary: {
    total: number;
    totalLimitMinor: string;
    spentMinor: string;
    remainingMinor: string;
  };
  items: BudgetSummaryItem[];
}

export interface BudgetDetailResponse {
  budget: BudgetSummaryItem;
  items: BudgetItemDetail[];
  summary: {
    totalLimitMinor: string;
    spentMinor: string;
    remainingMinor: string;
    progressPercent: number;
    transactionCount: number;
  };
  recentTransactions: TransactionListItem[];
}

export interface BudgetsListQuery {
  month?: string;
  status?: "all" | "active" | "inactive" | "archived";
  sortBy?: "startDate" | "createdAt" | "name" | "spent" | "progress";
  sortOrder?: "asc" | "desc";
}

export interface BudgetItemPayload {
  categoryId: string;
  limitAmountMinor?: string | number;
  amountMinor?: string | number;
  amount?: string | number;
  limit?: string | number;
  alertThresholds?: number[];
  alertThreshold50?: boolean;
  alertThreshold80?: boolean;
  alertThreshold100?: boolean;
}

export interface CreateBudgetPayload {
  name: string;
  periodType?: BudgetPeriodType;
  period?: BudgetPeriodType;
  rolloverEnabled?: boolean;
  rollover?: boolean;
  alertsEnabled?: boolean;
  status?: BudgetStatus;
  startDate: string;
  endDate?: string | null;
  amountMinor?: string | number;
  amount?: string | number;
  categories?: string[];
  items?: BudgetItemPayload[];
  alertThresholds?: number[];
}

export interface UpdateBudgetPayload extends Partial<CreateBudgetPayload> {}

export interface UpdateBudgetItemPayload extends Partial<
  Omit<BudgetItemPayload, "categoryId">
> {}

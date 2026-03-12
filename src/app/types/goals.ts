import type { TransactionListItem } from "./transactions";

export type GoalPriority = "low" | "medium" | "high";
export type GoalStatus = "active" | "completed" | "paused" | "cancelled";
export type GoalUiStatus = "on-track" | "behind" | "achieved";
export type GoalWithdrawalLimitType = "none" | "percentage" | "amount";
export type GoalEventType =
  | "deposit"
  | "withdrawal"
  | "adjustment"
  | "complete"
  | "reopen";

export interface GoalLedgerSummary {
  id: string;
  name: string;
  baseCurrencyCode: string;
  timezone: string;
  weekStartsOn: number;
}

export interface GoalAccountOption {
  id: string;
  name: string;
  accountType: string;
  accountTypeLabel: string;
  currencyCode: string;
  providerName: string | null;
  iconKey: string | null;
  colorHex: string | null;
  currentBalanceMinor: string;
}

export interface GoalListItem {
  id: string;
  ledgerId: string;
  name: string;
  icon: string;
  color: string;
  note: string | null;
  startDate: string | null;
  targetDate: string | null;
  deadline: string | null;
  targetAmountMinor: string;
  targetAmount: number;
  currentAmountMinor: string;
  currentAmount: number;
  remainingMinor: string;
  remainingAmount: number;
  currencyCode: string;
  priority: GoalPriority;
  status: GoalStatus;
  percentage: number;
  progressPercent: number;
  uiStatus: GoalUiStatus;
  autoContributeEnabled: boolean;
  autoContributeAmountMinor: string;
  autoContributeAmount: number;
  autoContributeDay: number | null;
  autoContributeAccountId: string | null;
  linkedAccountId: string | null;
  withdrawalLockEnabled: boolean;
  withdrawalLockUntil: string | null;
  withdrawalLimitType: GoalWithdrawalLimitType;
  withdrawalLimitValue: number | null;
  withdrawalApprovalEnabled: boolean;
  withdrawalApprovalThreshold: number | null;
  withdrawalApprovalThresholdMinor: string;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  autoContributeAccount: GoalAccountOption | null;
}

export interface GoalContribution {
  id: string;
  goalId: string;
  eventType: GoalEventType;
  type: GoalEventType;
  amountMinor: string;
  amount: number;
  note: string | null;
  notes: string | null;
  eventAt: string;
  date: string;
  transactionId: string | null;
  linkedTransactionId: string | null;
  accountId: string | null;
  linkedAccountId: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  account: GoalAccountOption | null;
  transaction: TransactionListItem | null;
}

export interface GoalsMetaResponse {
  ledger: GoalLedgerSummary;
  defaults: {
    currencyCode: string;
  };
  accounts: GoalAccountOption[];
}

export interface GoalsListResponse {
  ledger: GoalLedgerSummary;
  summary: {
    total: number;
    achievedCount: number;
    behindCount: number;
    onTrackCount: number;
  };
  items: GoalListItem[];
}

export interface GoalDetailResponse {
  goal: GoalListItem & {
    contributions: GoalContribution[];
  };
  summary: {
    totalDepositedMinor: string;
    totalWithdrawnMinor: string;
    netContributedMinor: string;
    contributionCount: number;
    withdrawalCount: number;
    eventCount: number;
    linkedTransactionCount: number;
    percentage: number;
    progressPercent: number;
    remainingMinor: string;
    daysRemaining: number | null;
    lastContributionAt: string | null;
  };
  events: GoalContribution[];
  contributions: GoalContribution[];
  recentTransactions: TransactionListItem[];
}

export interface GoalsListQuery {
  search?: string;
  status?: "all" | GoalStatus;
  priority?: "all" | GoalPriority;
  sortBy?: "targetDate" | "createdAt" | "progress" | "targetAmount" | "name";
  sortOrder?: "asc" | "desc";
}

export interface CreateGoalPayload {
  name: string;
  icon?: string | null;
  color?: string | null;
  note?: string | null;
  startDate?: string | null;
  targetDate?: string | null;
  deadline?: string | null;
  targetAmountMinor?: number | string;
  targetAmount?: number | string;
  amount?: number | string;
  currentAmountMinor?: number | string;
  currentAmount?: number | string;
  initialAmount?: number | string;
  currencyCode?: string;
  priority?: GoalPriority;
  status?: GoalStatus;
  autoContributeEnabled?: boolean;
  autoContributeAmountMinor?: number | string | null;
  autoContributeAmount?: number | string | null;
  autoContributeDay?: number | null;
  autoContributeAccountId?: string | null;
  linkedAccountId?: string | null;
  withdrawalLockEnabled?: boolean;
  withdrawalLockUntil?: string | null;
  withdrawalLimitType?: GoalWithdrawalLimitType;
  withdrawalLimitValue?: number | string | null;
  withdrawalApprovalEnabled?: boolean;
  withdrawalApprovalThreshold?: number | string | null;
}

export interface UpdateGoalPayload extends Partial<CreateGoalPayload> {}

export interface CreateGoalContributionPayload {
  eventType?: GoalEventType;
  type?: GoalEventType;
  amountMinor?: number | string;
  amount?: number | string;
  transactionId?: string | null;
  linkedTransactionId?: string | null;
  accountId?: string | null;
  linkedAccountId?: string | null;
  note?: string | null;
  notes?: string | null;
  date?: string;
  eventAt?: string;
  approvalConfirmed?: boolean;
}

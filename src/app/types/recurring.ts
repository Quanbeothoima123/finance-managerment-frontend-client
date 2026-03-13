import type {
  TransactionAccountOption,
  TransactionCategoryOption,
  TransactionMerchantOption,
  TransactionListItem,
  TransactionTagOption,
} from './transactions';

export type RecurringTxnType = 'income' | 'expense' | 'transfer';
export type RecurringFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly';
export type RecurringExecutionMode = 'notify' | 'auto';
export type RecurringEndCondition = 'never' | 'on-date' | 'after-n';

export interface RecurringRuleItem {
  id: string;
  ledgerId: string;
  name: string;
  description: string;
  amount: number;
  amountMinor: string;
  signedAmountMinor: string;
  txnType: RecurringTxnType;
  type: RecurringTxnType;
  executionMode: RecurringExecutionMode;
  frequency: RecurringFrequency;
  intervalValue: number;
  currencyCode: string;
  accountId: string | null;
  account: string;
  accountInfo: TransactionAccountOption | null;
  toAccountId: string | null;
  toAccount: string;
  toAccountInfo: TransactionAccountOption | null;
  categoryId: string | null;
  category: string;
  categoryInfo: TransactionCategoryOption | null;
  merchantId: string | null;
  merchant: string;
  merchantInfo: TransactionMerchantOption | null;
  tagIds: string[];
  tags: TransactionTagOption[];
  nextRunAt: string | null;
  nextDate: string | null;
  lastRunAt: string | null;
  startDate: string;
  endDate: string | null;
  endCondition: RecurringEndCondition;
  endAfterOccurrences: number | null;
  completedOccurrences: number;
  dailyInterval?: number;
  weeklyDays?: number[];
  monthlyMode?: 'specific' | 'last';
  monthlyDay?: number;
  yearlyMonth?: number;
  yearlyDay?: number;
  enabled: boolean;
  isPaused: boolean;
  notifyEnabled: boolean;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  executionHistory?: RecurringOccurrenceItem[];
}

export interface RecurringOccurrenceItem {
  id: string;
  recurringRuleId: string;
  scheduledFor: string;
  scheduledDate: string;
  status: string;
  transactionId: string | null;
  errorMessage: string | null;
  processedAt: string | null;
  createdAt: string;
  updatedAt: string;
  date: string;
  note: string | null;
  transaction: TransactionListItem | null;
}

export interface RecurringMetaResponse {
  ledger: {
    id: string;
    name: string;
    baseCurrencyCode: string;
    timezone: string;
    weekStartsOn: number;
  };
  defaults: {
    currencyCode: string;
    executionMode: RecurringExecutionMode;
    frequency: RecurringFrequency;
    startDate: string;
  };
  accounts: TransactionAccountOption[];
  categories: TransactionCategoryOption[];
  merchants: TransactionMerchantOption[];
  tags: TransactionTagOption[];
}

export interface RecurringListQuery {
  search?: string;
  txnType?: RecurringTxnType;
  type?: RecurringTxnType;
  frequency?: RecurringFrequency;
  executionMode?: RecurringExecutionMode;
  status?: 'all' | 'active' | 'paused';
  sortBy?: 'nextRunAt' | 'amount' | 'name' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}

export interface RecurringListResponse {
  ledger: RecurringMetaResponse['ledger'];
  summary: {
    total: number;
    active: number;
    paused: number;
    autoPost: number;
    notifyOnly: number;
    dueToday: number;
    overdue: number;
  };
  items: RecurringRuleItem[];
}

export interface RecurringDetailResponse {
  rule: RecurringRuleItem;
  summary: {
    occurrenceCount: number;
    successCount: number;
    skippedCount: number;
    failedCount: number;
    lastProcessedAt: string | null;
  };
  occurrences: RecurringOccurrenceItem[];
  executionHistory: RecurringOccurrenceItem[];
}

export interface RecurringOccurrencesResponse {
  summary: RecurringDetailResponse['summary'];
  items: RecurringOccurrenceItem[];
}

export interface CreateRecurringRulePayload {
  name?: string;
  description?: string;
  txnType?: RecurringTxnType;
  type?: RecurringTxnType;
  executionMode?: RecurringExecutionMode;
  amount?: number | string;
  amountMinor?: number | string;
  currencyCode?: string;
  accountId?: string | null;
  fromAccountId?: string | null;
  toAccountId?: string | null;
  categoryId?: string | null;
  merchantId?: string | null;
  tagIds?: string[];
  frequency: RecurringFrequency;
  intervalValue?: number;
  dailyInterval?: number;
  weeklyDays?: number[];
  monthlyMode?: 'specific' | 'last';
  monthlyDay?: number;
  yearlyMonth?: number;
  yearlyDay?: number;
  startDate?: string;
  endDate?: string | null;
  endCondition?: RecurringEndCondition;
  endAfterOccurrences?: number | null;
  notes?: string | null;
  notifyEnabled?: boolean;
  enabled?: boolean;
  isPaused?: boolean;
}

export interface UpdateRecurringRulePayload extends Partial<CreateRecurringRulePayload> {}

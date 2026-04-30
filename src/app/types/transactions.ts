import type { AccountType } from "./accounts";

export type TransactionType =
  | "income"
  | "expense"
  | "transfer"
  | "adjustment"
  | "goal_contribution";

export type TransactionStatus = "posted" | "pending" | "cancelled";

export interface TransactionAccountOption {
  id: string;
  name: string;
  accountType: AccountType;
  accountTypeLabel: string;
  providerName: string | null;
  accountNumber: string | null;
  accountOwnerName: string | null;
  currencyCode: string;
  currentBalanceMinor: string;
  openingBalanceMinor: string;
  status: "active" | "archived";
  iconKey: string | null;
  colorHex: string | null;
}

export interface TransactionCategoryOption {
  id: string;
  name: string;
  nameEn: string | null;
  categoryType: "income" | "expense" | "both" | string;
  parentId: string | null;
  iconKey: string | null;
  colorHex: string | null;
  isHidden: boolean;
  archivedAt: string | null;
}

export interface TransactionMerchantOption {
  id: string;
  name: string;
  normalizedName: string;
  defaultCategoryId: string | null;
  iconKey: string | null;
  note: string | null;
  isHidden: boolean;
}

export interface TransactionTagOption {
  id: string;
  name: string;
  nameEn: string | null;
  colorHex: string | null;
}

export interface TransactionSplitItem {
  id: string;
  splitOrder: number;
  amountMinor: string;
  note: string | null;
  category: TransactionCategoryOption | null;
}

export interface TransactionPosting {
  id: string;
  accountId: string;
  postingRole: string;
  amountMinorSigned: string;
  currencyCode: string;
  exchangeRate: string | null;
  account: {
    id: string;
    name: string;
    accountType: AccountType;
    accountTypeLabel: string;
  } | null;
}

export interface TransactionListItem {
  id: string;
  txnType: TransactionType | string;
  type: TransactionType | string;
  status: TransactionStatus | string;
  occurredAt: string;
  bookingDate: string | null;
  date: string | null;
  currencyCode: string;
  totalAmountMinor: string;
  serviceFeeMinor: string | null;
  signedAmountMinor: string;
  description: string | null;
  note: string | null;
  notes: string | null;
  imageUrl: string | null;
  sourceType: string;
  sourceRefId: string | null;
  merchant: TransactionMerchantOption | null;
  category: TransactionCategoryOption | null;
  account: {
    id: string;
    name: string;
    accountType: AccountType;
    accountTypeLabel: string;
  } | null;
  toAccount: {
    id: string;
    name: string;
    accountType: AccountType;
    accountTypeLabel: string;
  } | null;
  tags: TransactionTagOption[];
  isSplit: boolean;
  splitCount: number;
  splitItems: TransactionSplitItem[];
  postingCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface TransactionDetailResponse extends TransactionListItem {
  postings: TransactionPosting[];
  createdByUserId: string | null;
  updatedByUserId: string | null;
  references: {
    reconciliationCount: number;
    goalEventCount: number;
    recurringOccurrenceCount: number;
    importRowCount: number;
    ruleMatchCount: number;
  };
}

export interface TransactionsMetaResponse {
  ledger: {
    id: string;
    name: string;
    baseCurrencyCode: string;
    timezone: string;
    weekStartsOn: number;
  };
  defaults: {
    defaultAccountId: string | null;
    defaultExpenseCategoryId: string | null;
    defaultIncomeCategoryId: string | null;
  };
  accounts: TransactionAccountOption[];
  categories: TransactionCategoryOption[];
  merchants: TransactionMerchantOption[];
  tags: TransactionTagOption[];
}

export interface TransactionsListResponse {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  filters: {
    type: TransactionType | null;
    status: TransactionStatus | null;
    accountId: string | null;
    categoryId: string | null;
    merchantId: string | null;
    tagIds: string[];
    tagMode: "and" | "or";
    search: string | null;
    startDate: string | Date | null;
    endDate: string | Date | null;
    sortBy: "date" | "amount" | "createdAt";
    sortOrder: "asc" | "desc";
  };
  items: TransactionListItem[];
}

export interface TransactionsListQuery {
  page?: number;
  limit?: number;
  type?: TransactionType;
  status?: TransactionStatus;
  accountId?: string;
  categoryId?: string;
  merchantId?: string;
  tagIds?: string[];
  tagMode?: "and" | "or";
  search?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: "date" | "amount" | "createdAt";
  sortOrder?: "asc" | "desc";
}

export interface CreateTransactionSplitPayload {
  categoryId: string;
  amountMinor?: number | string;
  amount?: number | string;
  note?: string | null;
}

export interface CreateTransactionPayload {
  type?: "income" | "expense" | "transfer";
  txnType?: "income" | "expense" | "transfer";
  amount?: number | string;
  amountMinor?: number | string;
  accountId?: string;
  fromAccountId?: string;
  toAccountId?: string;
  categoryId?: string | null;
  merchantId?: string | null;
  merchantName?: string | null;
  description: string;
  note?: string | null;
  notes?: string | null;
  date?: string;
  occurredAt?: string;
  bookingDate?: string;
  status?: TransactionStatus;
  tagIds?: string[];
  tags?: string[];
  splitItems?: CreateTransactionSplitPayload[];
  serviceFee?: number | string;
  serviceFeeMinor?: number | string;
}

export interface UpdateTransactionPayload extends CreateTransactionPayload {}

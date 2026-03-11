import type { TransactionListItem } from "./transactions";

export interface MerchantDefaultCategoryInfo {
  id: string;
  name: string;
  categoryType: string;
  iconKey: string | null;
  colorHex: string | null;
}

export interface MerchantItem {
  id: string;
  ledgerId: string;
  name: string;
  normalizedName: string;
  defaultCategoryId: string | null;
  defaultCategory: string | null;
  categoryName: string | null;
  iconKey: string | null;
  note: string | null;
  isHidden: boolean;
  transactionCount: number;
  recurringRuleCount: number;
  learningStatCount: number;
  usageCount: number;
  totalSpentMinor: string;
  totalSpent: string;
  lastTransactionAt: string | null;
  lastTransaction: string | null;
  createdAt: string;
  updatedAt: string;
  defaultCategoryInfo: MerchantDefaultCategoryInfo | null;
}

export interface MerchantsMetaResponse {
  ledger: {
    id: string;
    name: string;
    baseCurrencyCode: string;
    timezone: string;
    weekStartsOn: number;
  };
  categories: Array<{
    id: string;
    name: string;
    categoryType: string;
    parentId: string | null;
    iconKey: string | null;
    colorHex: string | null;
    archivedAt: string | null;
  }>;
}

export interface MerchantsListQuery {
  search?: string;
  defaultCategoryId?: string;
  categoryId?: string;
  hidden?: "all" | "visible" | "hidden";
  sortBy?: "name" | "usage" | "spent" | "recent" | "createdAt";
  sortOrder?: "asc" | "desc";
}

export interface MerchantsListResponse {
  ledger: {
    id: string;
    name: string;
    baseCurrencyCode: string;
    timezone: string;
    weekStartsOn: number;
  };
  summary: {
    total: number;
    hiddenCount: number;
    visibleCount: number;
    noDefaultCategoryCount: number;
    totalUsage: number;
    totalSpentMinor: string;
  };
  items: MerchantItem[];
}

export interface MerchantDetailResponse {
  merchant: MerchantItem;
  stats: {
    transactionCount: number;
    recurringRuleCount: number;
    learningStatCount: number;
    totalSpentMinor: string;
    incomeMinor: string;
    expenseMinor: string;
    lastTransactionAt: string | null;
  };
  recentTransactions: TransactionListItem[];
}

export interface CreateMerchantPayload {
  name: string;
  defaultCategoryId?: string | null;
  defaultCategory?: string | null;
  categoryId?: string | null;
  iconKey?: string | null;
  note?: string | null;
  isHidden?: boolean;
}

export interface UpdateMerchantPayload extends Partial<CreateMerchantPayload> {}

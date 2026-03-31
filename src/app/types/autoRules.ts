import type {
  TransactionCategoryOption,
  TransactionMerchantOption,
  TransactionTagOption,
} from "./transactions";

export type AutoRuleStatusFilter = "all" | "active" | "inactive";
export type AutoRuleSortBy = "priority" | "name" | "createdAt" | "updatedAt";
export type AutoRuleSortOrder = "asc" | "desc";
export type AutoRuleMatchField =
  | "description"
  | "merchant"
  | "amount"
  | "account"
  | "weekday"
  | "note";
export type AutoRuleMatchType =
  | "contains"
  | "equals"
  | "starts_with"
  | "ends_with"
  | "gt"
  | "lt"
  | "in"
  | "regex"
  | "greater_than"
  | "less_than";
export type AutoRuleActionType =
  | "set_category"
  | "add_tag"
  | "set_merchant"
  | "set_account";

export interface AutoRuleAccountOption {
  id: string;
  name: string;
  accountType: string;
  accountTypeLabel: string;
  providerName: string | null;
  currencyCode: string;
  iconKey: string | null;
  colorHex: string | null;
  status: string;
  archivedAt: string | null;
}

export interface AutoRuleCondition {
  id?: string;
  field: AutoRuleMatchField;
  operator: AutoRuleMatchType;
  value: string | number;
  rawFieldName?: string;
  rawOperator?: string;
  valueText?: string | null;
  valueNumber?: number | null;
  sortOrder?: number;
}

export interface AutoRuleAction {
  id?: string;
  type: AutoRuleActionType;
  value: string;
  targetId?: string | null;
  targetText?: string | null;
  sortOrder?: number;
}

export interface AutoRuleItem {
  id: string;
  ledgerId: string;
  name: string;
  priority: number;
  enabled: boolean;
  active: boolean;
  isActive: boolean;
  stopAfterMatch: boolean;
  matchField: AutoRuleMatchField | null;
  matchType: AutoRuleMatchType | null;
  pattern: string;
  selectedCategory: string;
  selectedCategoryId: string | null;
  selectedMerchant: string;
  selectedMerchantId: string | null;
  selectedAccount: string;
  selectedAccountId: string | null;
  selectedTags: string[];
  selectedTagIds: string[];
  conditions: AutoRuleCondition[];
  actions: AutoRuleAction[];
  actionCount: number;
  conditionCount: number;
  matchLogCount: number;
  summaryText: string;
  createdAt: string;
  updatedAt: string;
}

export interface AutoRulesMetaResponse {
  ledger: {
    id: string;
    name: string;
    baseCurrencyCode: string;
    timezone: string;
    weekStartsOn: number;
  };
  defaults: {
    enabled: boolean;
    priority: number;
    matchField: AutoRuleMatchField;
    matchType: AutoRuleMatchType;
  };
  supportedFields: Array<{ value: AutoRuleMatchField; label: string }>;
  supportedOperators: Array<{ value: AutoRuleMatchType; label: string }>;
  supportedActions: Array<{ value: AutoRuleActionType; label: string }>;
  accounts: AutoRuleAccountOption[];
  categories: TransactionCategoryOption[];
  merchants: TransactionMerchantOption[];
  tags: TransactionTagOption[];
}

export interface AutoRulesListResponse {
  ledger: AutoRulesMetaResponse["ledger"];
  summary: {
    totalRules: number;
    activeRules: number;
    inactiveRules: number;
  };
  items: AutoRuleItem[];
}

export interface AutoRuleDetailResponse {
  rule: AutoRuleItem;
}

export interface AutoRulesListQuery {
  search?: string;
  status?: AutoRuleStatusFilter;
  sortBy?: AutoRuleSortBy;
  sortOrder?: AutoRuleSortOrder;
}

export interface CreateAutoRulePayload {
  name?: string;
  priority?: number | string;
  enabled?: boolean;
  active?: boolean;
  isActive?: boolean;
  stopAfterMatch?: boolean;
  matchField?: AutoRuleMatchField;
  matchType?: AutoRuleMatchType;
  pattern?: string | number;
  selectedCategory?: string | null;
  selectedCategoryId?: string | null;
  selectedMerchant?: string | null;
  selectedMerchantId?: string | null;
  selectedTags?: string[];
  selectedTagIds?: string[];
  selectedAccount?: string | null;
  selectedAccountId?: string | null;
  conditions?: AutoRuleCondition[];
  actions?: AutoRuleAction[];
}

export interface UpdateAutoRulePayload extends Partial<CreateAutoRulePayload> {}

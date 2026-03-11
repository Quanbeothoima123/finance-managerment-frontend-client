export interface TagItem {
  id: string;
  ledgerId: string;
  name: string;
  colorHex: string | null;
  color: string | null;
  transactionCount: number;
  recurringRuleCount: number;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface TagsListResponse {
  ledger: {
    id: string;
    name: string;
    baseCurrencyCode: string;
    timezone: string;
    weekStartsOn: number;
  };
  summary: {
    total: number;
    totalUsage: number;
    transactionUsage: number;
    recurringUsage: number;
  };
  items: TagItem[];
}

export interface TagsListQuery {
  search?: string;
  sortBy?: "usage" | "name" | "createdAt";
  sortOrder?: "asc" | "desc";
}

export interface CreateTagPayload {
  name: string;
  colorHex?: string | null;
  color?: string | null;
}

export interface UpdateTagPayload extends Partial<CreateTagPayload> {}

export type CategoryKind = "expense" | "income" | "both";

export interface CategoryItem {
  id: string;
  ledgerId: string;
  name: string;
  nameEn: string | null;
  categoryType: CategoryKind | string;
  type: CategoryKind | string;
  parentId: string | null;
  iconKey: string | null;
  icon: string | null;
  colorHex: string | null;
  color: string | null;
  isHidden: boolean;
  hidden: boolean;
  active: boolean;
  sortOrder: number;
  systemCode: string | null;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
  transactionCount: number;
  totalTransactionCount: number;
  childCount: number;
  budgetItemCount: number;
  merchantDefaultCount: number;
  recurringRuleCount: number;
  merchantLearningStatCount: number;
  preferenceCount: number;
  mergeLogCount: number;
  usageCount: number;
  canDelete: boolean;
}

export interface CategoryTreeNode extends CategoryItem {
  children: CategoryTreeNode[];
}

export interface CategoriesMetaResponse {
  ledger: {
    id: string;
    name: string;
    baseCurrencyCode: string;
    timezone: string;
    weekStartsOn: number;
  };
  summary: {
    total: number;
    rootCount: number;
    hiddenCount: number;
    activeCount: number;
  };
  categories: CategoryItem[];
  rootCategories: CategoryItem[];
}

export interface CategoriesListQuery {
  search?: string;
  type?: "all" | "expense" | "income" | "both";
  visibility?: "all" | "active" | "hidden" | "archived";
  sortBy?: "sortOrder" | "name" | "usage" | "createdAt";
  sortOrder?: "asc" | "desc";
  view?: "tree" | "flat";
}

export interface CategoriesListResponse {
  ledger: {
    id: string;
    name: string;
    baseCurrencyCode: string;
    timezone: string;
    weekStartsOn: number;
  };
  summary: {
    total: number;
    visibleTotal: number;
    rootCount: number;
    hiddenCount: number;
    activeCount: number;
    totalTransactionCount: number;
  };
  items: CategoryItem[];
  tree: CategoryTreeNode[];
}

export interface CategoryDetailResponse {
  category: CategoryItem;
  parent: CategoryItem | null;
  children: CategoryItem[];
  eligibleParents: CategoryItem[];
  mergeTargets: CategoryItem[];
  descendantIds: string[];
  summary: {
    transactionCount: number;
    totalTransactionCount: number;
    childCount: number;
    budgetItemCount: number;
    merchantDefaultCount: number;
    recurringRuleCount: number;
    merchantLearningStatCount: number;
    preferenceCount: number;
    mergeLogCount: number;
    usageCount: number;
    canDelete: boolean;
  };
}

export interface CreateCategoryPayload {
  name: string;
  nameEn?: string | null;
  categoryType?: CategoryKind;
  type?: CategoryKind;
  kind?: CategoryKind;
  parentId?: string | null;
  iconKey?: string | null;
  icon?: string | null;
  colorHex?: string | null;
  color?: string | null;
  isHidden?: boolean;
  hidden?: boolean;
  active?: boolean;
}

export interface UpdateCategoryPayload extends Partial<CreateCategoryPayload> {}

export interface UpdateCategoryVisibilityPayload {
  hidden: boolean;
  cascadeChildren?: boolean;
}

export interface MergeCategoryPayload {
  targetCategoryId: string;
  includeChildren?: boolean;
}

export interface ReorderCategoriesPayload {
  parentId?: string | null;
  orderedIds: string[];
}

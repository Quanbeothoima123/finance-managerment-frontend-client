import { apiRequest } from "./apiClient";
import type {
  BudgetDetailResponse,
  BudgetsListQuery,
  BudgetsListResponse,
  BudgetsMetaResponse,
  CreateBudgetPayload,
  BudgetItemPayload,
  UpdateBudgetItemPayload,
  UpdateBudgetPayload,
} from "../types/budgets";

function buildQueryString(query: Record<string, string | undefined>) {
  const params = new URLSearchParams();

  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    params.set(key, value);
  });

  const serialized = params.toString();
  return serialized ? `?${serialized}` : "";
}

export const budgetsService = {
  getMeta() {
    return apiRequest<BudgetsMetaResponse>("/budgets/meta", {
      method: "GET",
      requiresAuth: true,
    });
  },

  listBudgets(query: BudgetsListQuery = {}) {
    const qs = buildQueryString({
      month: query.month,
      status: query.status,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    });

    return apiRequest<BudgetsListResponse>(`/budgets${qs}`, {
      method: "GET",
      requiresAuth: true,
    });
  },

  getBudgetDetail(budgetId: string) {
    return apiRequest<BudgetDetailResponse>(`/budgets/${budgetId}`, {
      method: "GET",
      requiresAuth: true,
    });
  },

  createBudget(payload: CreateBudgetPayload) {
    return apiRequest<BudgetDetailResponse>("/budgets", {
      method: "POST",
      requiresAuth: true,
      body: payload,
    });
  },

  updateBudget(budgetId: string, payload: UpdateBudgetPayload) {
    return apiRequest<BudgetDetailResponse>(`/budgets/${budgetId}`, {
      method: "PATCH",
      requiresAuth: true,
      body: payload,
    });
  },

  deleteBudget(budgetId: string) {
    return apiRequest<{ deleted: boolean; id: string; name: string }>(
      `/budgets/${budgetId}`,
      {
        method: "DELETE",
        requiresAuth: true,
      },
    );
  },

  addBudgetItem(budgetId: string, payload: BudgetItemPayload) {
    return apiRequest<BudgetDetailResponse>(`/budgets/${budgetId}/items`, {
      method: "POST",
      requiresAuth: true,
      body: payload,
    });
  },

  updateBudgetItem(
    budgetId: string,
    itemId: string,
    payload: UpdateBudgetItemPayload,
  ) {
    return apiRequest<BudgetDetailResponse>(
      `/budgets/${budgetId}/items/${itemId}`,
      {
        method: "PATCH",
        requiresAuth: true,
        body: payload,
      },
    );
  },

  deleteBudgetItem(budgetId: string, itemId: string) {
    return apiRequest<BudgetDetailResponse>(
      `/budgets/${budgetId}/items/${itemId}`,
      {
        method: "DELETE",
        requiresAuth: true,
      },
    );
  },
};

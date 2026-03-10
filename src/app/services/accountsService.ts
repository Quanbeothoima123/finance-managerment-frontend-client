import { apiRequest } from "./apiClient";
import type {
  AccountDetailResponse,
  AccountSummaryDto,
  AccountTransactionsResponse,
  AccountsOverviewResponse,
  CreateAccountPayload,
  ReconcileAccountPayload,
  ReconcileAccountResponse,
  UpdateAccountPayload,
} from "../types/accounts";

export const accountsService = {
  getOverview(month?: string) {
    const search = month ? `?month=${encodeURIComponent(month)}` : "";
    return apiRequest<AccountsOverviewResponse>(`/accounts/overview${search}`, {
      method: "GET",
      requiresAuth: true,
    });
  },

  createAccount(payload: CreateAccountPayload) {
    return apiRequest<AccountSummaryDto>("/accounts", {
      method: "POST",
      requiresAuth: true,
      body: payload,
    });
  },

  getAccountDetail(accountId: string, limit = 20) {
    return apiRequest<AccountDetailResponse>(
      `/accounts/${accountId}?limit=${limit}`,
      {
        method: "GET",
        requiresAuth: true,
      },
    );
  },

  updateAccount(accountId: string, payload: UpdateAccountPayload) {
    return apiRequest<AccountSummaryDto>(`/accounts/${accountId}`, {
      method: "PATCH",
      requiresAuth: true,
      body: payload,
    });
  },

  archiveAccount(accountId: string, archived: boolean) {
    return apiRequest<AccountSummaryDto>(`/accounts/${accountId}/archive`, {
      method: "PATCH",
      requiresAuth: true,
      body: { archived },
    });
  },

  deleteAccount(accountId: string) {
    return apiRequest<{ deleted: boolean; id: string }>(
      `/accounts/${accountId}`,
      {
        method: "DELETE",
        requiresAuth: true,
      },
    );
  },

  getAccountTransactions(accountId: string, page = 1, limit = 20) {
    return apiRequest<AccountTransactionsResponse>(
      `/accounts/${accountId}/transactions?page=${page}&limit=${limit}`,
      {
        method: "GET",
        requiresAuth: true,
      },
    );
  },

  reconcileAccount(accountId: string, payload: ReconcileAccountPayload) {
    return apiRequest<ReconcileAccountResponse>(
      `/accounts/${accountId}/reconcile`,
      {
        method: "POST",
        requiresAuth: true,
        body: payload,
      },
    );
  },
};

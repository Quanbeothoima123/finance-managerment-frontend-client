import { apiRequest } from "./apiClient";
import type {
  CreateTransactionPayload,
  TransactionDetailResponse,
  TransactionsListQuery,
  TransactionsListResponse,
  TransactionsMetaResponse,
  UpdateTransactionPayload,
} from "../types/transactions";

function buildQueryString(query: TransactionsListQuery = {}) {
  const searchParams = new URLSearchParams();

  Object.entries(query).forEach(([key, value]) => {
    if (
      value === undefined ||
      value === null ||
      value === "" ||
      (Array.isArray(value) && value.length === 0)
    ) {
      return;
    }

    if (Array.isArray(value)) {
      searchParams.set(key, value.join(","));
      return;
    }

    searchParams.set(key, String(value));
  });

  const serialized = searchParams.toString();
  return serialized ? `?${serialized}` : "";
}

export const transactionsService = {
  getMeta() {
    return apiRequest<TransactionsMetaResponse>("/transactions/meta", {
      method: "GET",
      requiresAuth: true,
    });
  },

  listTransactions(query: TransactionsListQuery = {}) {
    return apiRequest<TransactionsListResponse>(
      `/transactions${buildQueryString(query)}`,
      {
        method: "GET",
        requiresAuth: true,
      },
    );
  },

  getTransactionDetail(transactionId: string) {
    return apiRequest<TransactionDetailResponse>(
      `/transactions/${transactionId}`,
      {
        method: "GET",
        requiresAuth: true,
      },
    );
  },

  createTransaction(payload: CreateTransactionPayload) {
    return apiRequest<TransactionDetailResponse>("/transactions", {
      method: "POST",
      requiresAuth: true,
      body: payload,
    });
  },

  updateTransaction(transactionId: string, payload: UpdateTransactionPayload) {
    return apiRequest<TransactionDetailResponse>(
      `/transactions/${transactionId}`,
      {
        method: "PATCH",
        requiresAuth: true,
        body: payload,
      },
    );
  },

  deleteTransaction(transactionId: string) {
    return apiRequest<{ deleted: boolean; id: string }>(
      `/transactions/${transactionId}`,
      {
        method: "DELETE",
        requiresAuth: true,
      },
    );
  },
};

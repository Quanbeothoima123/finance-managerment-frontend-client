import { apiRequest } from "./apiClient";
import type {
  CreateMerchantPayload,
  MerchantDetailResponse,
  MerchantItem,
  MerchantsListQuery,
  MerchantsListResponse,
  MerchantsMetaResponse,
  UpdateMerchantPayload,
} from "../types/merchants";

function buildQueryString(query: MerchantsListQuery = {}) {
  const params = new URLSearchParams();

  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    params.set(key, String(value));
  });

  const serialized = params.toString();
  return serialized ? `?${serialized}` : "";
}

export const merchantsService = {
  getMeta() {
    return apiRequest<MerchantsMetaResponse>("/merchants/meta", {
      method: "GET",
      requiresAuth: true,
    });
  },

  listMerchants(query: MerchantsListQuery = {}) {
    return apiRequest<MerchantsListResponse>(
      `/merchants${buildQueryString(query)}`,
      {
        method: "GET",
        requiresAuth: true,
      },
    );
  },

  getMerchantDetail(merchantId: string) {
    return apiRequest<MerchantDetailResponse>(`/merchants/${merchantId}`, {
      method: "GET",
      requiresAuth: true,
    });
  },

  createMerchant(payload: CreateMerchantPayload) {
    return apiRequest<MerchantItem>("/merchants", {
      method: "POST",
      requiresAuth: true,
      body: payload,
    });
  },

  updateMerchant(merchantId: string, payload: UpdateMerchantPayload) {
    return apiRequest<MerchantItem>(`/merchants/${merchantId}`, {
      method: "PATCH",
      requiresAuth: true,
      body: payload,
    });
  },

  deleteMerchant(merchantId: string) {
    return apiRequest<{ deleted: boolean; id: string; name: string }>(
      `/merchants/${merchantId}`,
      {
        method: "DELETE",
        requiresAuth: true,
      },
    );
  },
};

import { apiRequest } from "./apiClient";
import type {
  CompleteOnboardingResponse,
  OnboardingStateResponse,
  SaveCurrencyDatePayload,
  SaveOnboardingAccountsPayload,
  SaveOnboardingAccountsResponse,
  SaveOnboardingCategoriesPayload,
  SaveOnboardingCategoriesResponse,
} from "../types/onboarding";

export const onboardingService = {
  getState() {
    return apiRequest<OnboardingStateResponse>("/onboarding/state", {
      method: "GET",
      requiresAuth: true,
    });
  },

  saveCurrencyDate(payload: SaveCurrencyDatePayload) {
    return apiRequest<OnboardingStateResponse>("/onboarding/currency-date", {
      method: "PUT",
      requiresAuth: true,
      body: payload,
    });
  },

  saveAccounts(payload: SaveOnboardingAccountsPayload) {
    return apiRequest<SaveOnboardingAccountsResponse>("/onboarding/accounts", {
      method: "POST",
      requiresAuth: true,
      body: payload,
    });
  },

  saveCategories(payload: SaveOnboardingCategoriesPayload) {
    return apiRequest<SaveOnboardingCategoriesResponse>(
      "/onboarding/categories",
      {
        method: "POST",
        requiresAuth: true,
        body: payload,
      },
    );
  },

  complete() {
    return apiRequest<CompleteOnboardingResponse>("/onboarding/complete", {
      method: "POST",
      requiresAuth: true,
    });
  },
};

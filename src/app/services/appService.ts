import { apiRequest } from "./apiClient";
import type { AppBootstrapResponse } from "../types/onboarding";

export const appService = {
  getBootstrap() {
    return apiRequest<AppBootstrapResponse>("/app/bootstrap", {
      method: "GET",
      requiresAuth: true,
    });
  },
};

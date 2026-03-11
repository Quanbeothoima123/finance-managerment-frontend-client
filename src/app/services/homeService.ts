import { apiRequest } from "./apiClient";
import type { HomeOverviewResponse } from "../types/home";

export const homeService = {
  getOverview(month?: string) {
    const search = month ? `?month=${encodeURIComponent(month)}` : "";
    return apiRequest<HomeOverviewResponse>(`/home/overview${search}`, {
      method: "GET",
      requiresAuth: true,
    });
  },
};

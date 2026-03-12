import { apiRequest } from "./apiClient";
import type {
  CreateGoalContributionPayload,
  CreateGoalPayload,
  GoalDetailResponse,
  GoalsListQuery,
  GoalsListResponse,
  GoalsMetaResponse,
  UpdateGoalPayload,
} from "../types/goals";

function buildQueryString(query: GoalsListQuery = {}) {
  const params = new URLSearchParams();

  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    params.set(key, String(value));
  });

  const serialized = params.toString();
  return serialized ? `?${serialized}` : "";
}

export const goalsService = {
  getMeta() {
    return apiRequest<GoalsMetaResponse>("/goals/meta", {
      method: "GET",
      requiresAuth: true,
    });
  },

  listGoals(query: GoalsListQuery = {}) {
    return apiRequest<GoalsListResponse>(`/goals${buildQueryString(query)}`, {
      method: "GET",
      requiresAuth: true,
    });
  },

  getGoalDetail(goalId: string) {
    return apiRequest<GoalDetailResponse>(`/goals/${goalId}`, {
      method: "GET",
      requiresAuth: true,
    });
  },

  createGoal(payload: CreateGoalPayload) {
    return apiRequest<GoalDetailResponse>("/goals", {
      method: "POST",
      requiresAuth: true,
      body: payload,
    });
  },

  updateGoal(goalId: string, payload: UpdateGoalPayload) {
    return apiRequest<GoalDetailResponse>(`/goals/${goalId}`, {
      method: "PATCH",
      requiresAuth: true,
      body: payload,
    });
  },

  deleteGoal(goalId: string) {
    return apiRequest<{ deleted: boolean; id: string }>(`/goals/${goalId}`, {
      method: "DELETE",
      requiresAuth: true,
    });
  },

  createContribution(goalId: string, payload: CreateGoalContributionPayload) {
    return apiRequest<GoalDetailResponse>(`/goals/${goalId}/contributions`, {
      method: "POST",
      requiresAuth: true,
      body: payload,
    });
  },

  deleteContribution(goalId: string, eventId: string) {
    return apiRequest<GoalDetailResponse>(
      `/goals/${goalId}/contributions/${eventId}`,
      {
        method: "DELETE",
        requiresAuth: true,
      },
    );
  },
};

import { apiRequest } from "./apiClient";
import type { ReportPostPayload, SavedPostsResponse } from "../types/community";

function buildQueryString(query: Record<string, unknown> = {}) {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    params.set(key, String(value));
  });
  const serialized = params.toString();
  return serialized ? `?${serialized}` : "";
}

export const communityInteractionsService = {
  listSavedPosts(query: { page?: number; limit?: number } = {}) {
    return apiRequest<SavedPostsResponse>(
      `/community/interactions/saved${buildQueryString(query)}`,
      { method: "GET", requiresAuth: true },
    );
  },

  likePost(postId: string) {
    return apiRequest<{ liked: boolean }>(
      `/community/interactions/${postId}/like`,
      { method: "POST", requiresAuth: true },
    );
  },

  unlikePost(postId: string) {
    return apiRequest<{ liked: boolean }>(
      `/community/interactions/${postId}/like`,
      { method: "DELETE", requiresAuth: true },
    );
  },

  savePost(postId: string) {
    return apiRequest<{ saved: boolean }>(
      `/community/interactions/${postId}/save`,
      { method: "POST", requiresAuth: true },
    );
  },

  unsavePost(postId: string) {
    return apiRequest<{ saved: boolean }>(
      `/community/interactions/${postId}/save`,
      { method: "DELETE", requiresAuth: true },
    );
  },

  reportPost(postId: string, payload: ReportPostPayload) {
    return apiRequest<{ reported: boolean }>(
      `/community/interactions/${postId}/report`,
      {
        method: "POST",
        requiresAuth: true,
        body: payload as unknown as Record<string, unknown>,
      },
    );
  },
};

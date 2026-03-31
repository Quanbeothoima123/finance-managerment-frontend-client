import { apiRequest } from "./apiClient";
import type { FollowListQuery, FollowListResponse } from "../types/community";

function buildQueryString(query: Record<string, unknown> = {}) {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    params.set(key, String(value));
  });
  const serialized = params.toString();
  return serialized ? `?${serialized}` : "";
}

export const socialFollowsService = {
  follow(targetProfileId: string) {
    return apiRequest<{ following: boolean }>("/community/follows", {
      method: "POST",
      requiresAuth: true,
      body: { targetProfileId },
    });
  },

  unfollow(profileId: string) {
    return apiRequest<{ following: boolean }>(
      `/community/follows/${profileId}`,
      { method: "DELETE", requiresAuth: true },
    );
  },

  listFollowers(profileId: string, query: FollowListQuery = {}) {
    return apiRequest<FollowListResponse>(
      `/community/follows/${profileId}/followers${buildQueryString({ ...query })}`,
      { method: "GET", requiresAuth: true },
    );
  },

  listFollowing(profileId: string, query: FollowListQuery = {}) {
    return apiRequest<FollowListResponse>(
      `/community/follows/${profileId}/following${buildQueryString({ ...query })}`,
      { method: "GET", requiresAuth: true },
    );
  },

  blockUser(targetProfileId: string) {
    return apiRequest<{ blocked: boolean }>("/community/follows/block", {
      method: "POST",
      requiresAuth: true,
      body: { targetProfileId },
    });
  },

  unblockUser(profileId: string) {
    return apiRequest<{ blocked: boolean }>(
      `/community/follows/block/${profileId}`,
      { method: "DELETE", requiresAuth: true },
    );
  },
};

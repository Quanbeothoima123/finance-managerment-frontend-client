import { apiRequest } from "./apiClient";
import type { SocialTopic } from "../types/community";

export const socialTopicsService = {
  listTopics() {
    return apiRequest<SocialTopic[]>("/community/topics", {
      method: "GET",
      requiresAuth: true,
    });
  },

  getTopicDetail(topicId: string) {
    return apiRequest<SocialTopic>(`/community/topics/${topicId}`, {
      method: "GET",
      requiresAuth: true,
    });
  },

  followTopic(topicId: string) {
    return apiRequest<{ following: boolean }>(
      `/community/topics/${topicId}/follow`,
      { method: "POST", requiresAuth: true },
    );
  },

  unfollowTopic(topicId: string) {
    return apiRequest<{ following: boolean }>(
      `/community/topics/${topicId}/follow`,
      { method: "DELETE", requiresAuth: true },
    );
  },
};

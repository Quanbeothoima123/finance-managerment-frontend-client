import { apiRequest } from "./apiClient";
import type {
  CommunityPost,
  CreatePostPayload,
  DraftsQuery,
  FeedQuery,
  FeedResponse,
  UpdatePostPayload,
  UserPostsQuery,
} from "../types/community";

function buildQueryString(query: Record<string, unknown> = {}) {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    params.set(key, String(value));
  });
  const serialized = params.toString();
  return serialized ? `?${serialized}` : "";
}

export const communityPostsService = {
  getFeed(query: FeedQuery = {}) {
    return apiRequest<FeedResponse>(
      `/community/posts/feed${buildQueryString({ ...query })}`,
      { method: "GET", requiresAuth: true },
    );
  },

  getPostDetail(postId: string) {
    return apiRequest<CommunityPost>(`/community/posts/${postId}`, {
      method: "GET",
      requiresAuth: true,
    });
  },

  listDrafts(query: DraftsQuery = {}) {
    return apiRequest<FeedResponse>(
      `/community/posts/drafts${buildQueryString({ ...query })}`,
      { method: "GET", requiresAuth: true },
    );
  },

  listUserPosts(profileId: string, query: UserPostsQuery = {}) {
    return apiRequest<FeedResponse>(
      `/community/posts/user/${profileId}${buildQueryString({ ...query })}`,
      { method: "GET", requiresAuth: true },
    );
  },

  createPost(payload: CreatePostPayload) {
    return apiRequest<CommunityPost>("/community/posts", {
      method: "POST",
      requiresAuth: true,
      body: payload as unknown as Record<string, unknown>,
    });
  },

  updatePost(postId: string, payload: UpdatePostPayload) {
    return apiRequest<CommunityPost>(`/community/posts/${postId}`, {
      method: "PATCH",
      requiresAuth: true,
      body: payload as unknown as Record<string, unknown>,
    });
  },

  deletePost(postId: string) {
    return apiRequest<{ deleted: boolean; id: string }>(
      `/community/posts/${postId}`,
      { method: "DELETE", requiresAuth: true },
    );
  },
};

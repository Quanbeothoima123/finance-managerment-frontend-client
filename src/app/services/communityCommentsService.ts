import { apiRequest } from "./apiClient";
import type {
  CommentsListQuery,
  CommentsListResponse,
  CreateCommentPayload,
  PostComment,
  UpdateCommentPayload,
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

export const communityCommentsService = {
  listComments(query: CommentsListQuery) {
    return apiRequest<CommentsListResponse>(
      `/community/comments${buildQueryString({ ...query })}`,
      { method: "GET", requiresAuth: true },
    );
  },

  createComment(payload: CreateCommentPayload) {
    return apiRequest<PostComment>("/community/comments", {
      method: "POST",
      requiresAuth: true,
      body: payload as unknown as Record<string, unknown>,
    });
  },

  updateComment(commentId: string, payload: UpdateCommentPayload) {
    return apiRequest<PostComment>(`/community/comments/${commentId}`, {
      method: "PATCH",
      requiresAuth: true,
      body: payload as unknown as Record<string, unknown>,
    });
  },

  deleteComment(commentId: string) {
    return apiRequest<PostComment>(`/community/comments/${commentId}`, {
      method: "DELETE",
      requiresAuth: true,
    });
  },

  likeComment(commentId: string) {
    return apiRequest<{ liked: boolean }>(
      `/community/comments/${commentId}/like`,
      { method: "POST", requiresAuth: true },
    );
  },

  unlikeComment(commentId: string) {
    return apiRequest<{ liked: boolean }>(
      `/community/comments/${commentId}/like`,
      { method: "DELETE", requiresAuth: true },
    );
  },
};

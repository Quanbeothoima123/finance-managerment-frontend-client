import { apiRequest } from "./apiClient";
import type {
  CreateTagPayload,
  TagItem,
  TagsListQuery,
  TagsListResponse,
  UpdateTagPayload,
} from "../types/tags";

function buildQueryString(query: TagsListQuery = {}) {
  const params = new URLSearchParams();

  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    params.set(key, String(value));
  });

  const serialized = params.toString();
  return serialized ? `?${serialized}` : "";
}

export const tagsService = {
  listTags(query: TagsListQuery = {}) {
    return apiRequest<TagsListResponse>(`/tags${buildQueryString(query)}`, {
      method: "GET",
      requiresAuth: true,
    });
  },

  getTagDetail(tagId: string) {
    return apiRequest<TagItem>(`/tags/${tagId}`, {
      method: "GET",
      requiresAuth: true,
    });
  },

  createTag(payload: CreateTagPayload) {
    return apiRequest<TagItem>("/tags", {
      method: "POST",
      requiresAuth: true,
      body: payload,
    });
  },

  updateTag(tagId: string, payload: UpdateTagPayload) {
    return apiRequest<TagItem>(`/tags/${tagId}`, {
      method: "PATCH",
      requiresAuth: true,
      body: payload,
    });
  },

  deleteTag(tagId: string) {
    return apiRequest<{ deleted: boolean; id: string; name: string }>(
      `/tags/${tagId}`,
      {
        method: "DELETE",
        requiresAuth: true,
      },
    );
  },
};

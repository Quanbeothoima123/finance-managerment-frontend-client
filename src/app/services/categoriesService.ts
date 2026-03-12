import { apiRequest } from "./apiClient";
import type {
  CategoriesListQuery,
  CategoriesListResponse,
  CategoriesMetaResponse,
  CategoryDetailResponse,
  CreateCategoryPayload,
  MergeCategoryPayload,
  ReorderCategoriesPayload,
  UpdateCategoryPayload,
  UpdateCategoryVisibilityPayload,
} from "../types/categories";

function buildQueryString(query: Record<string, string | undefined>) {
  const params = new URLSearchParams();

  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    params.set(key, String(value));
  });

  const serialized = params.toString();
  return serialized ? `?${serialized}` : "";
}

export const categoriesService = {
  getMeta() {
    return apiRequest<CategoriesMetaResponse>("/categories/meta", {
      method: "GET",
      requiresAuth: true,
    });
  },

  listCategories(query: CategoriesListQuery = {}) {
    const qs = buildQueryString({
      search: query.search,
      type: query.type,
      visibility: query.visibility,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
      view: query.view,
    });

    return apiRequest<CategoriesListResponse>(`/categories${qs}`, {
      method: "GET",
      requiresAuth: true,
    });
  },

  getCategoryDetail(categoryId: string) {
    return apiRequest<CategoryDetailResponse>(`/categories/${categoryId}`, {
      method: "GET",
      requiresAuth: true,
    });
  },

  createCategory(payload: CreateCategoryPayload) {
    return apiRequest<CategoryDetailResponse>("/categories", {
      method: "POST",
      requiresAuth: true,
      body: payload,
    });
  },

  updateCategory(categoryId: string, payload: UpdateCategoryPayload) {
    return apiRequest<CategoryDetailResponse>(`/categories/${categoryId}`, {
      method: "PATCH",
      requiresAuth: true,
      body: payload,
    });
  },

  updateVisibility(
    categoryId: string,
    payload: UpdateCategoryVisibilityPayload,
  ) {
    return apiRequest<CategoryDetailResponse>(
      `/categories/${categoryId}/visibility`,
      {
        method: "PATCH",
        requiresAuth: true,
        body: payload,
      },
    );
  },

  mergeCategory(categoryId: string, payload: MergeCategoryPayload) {
    return apiRequest<{
      merged: boolean;
      sourceCategoryId: string;
      targetCategoryId: string;
      mergedCategoryIds: string[];
      target: CategoryDetailResponse;
    }>(`/categories/${categoryId}/merge`, {
      method: "POST",
      requiresAuth: true,
      body: payload,
    });
  },

  reorderCategories(payload: ReorderCategoriesPayload) {
    return apiRequest<CategoriesListResponse>("/categories/reorder", {
      method: "POST",
      requiresAuth: true,
      body: payload,
    });
  },

  deleteCategory(categoryId: string, cascadeChildren = false) {
    const qs = buildQueryString({
      cascadeChildren: cascadeChildren ? "true" : undefined,
    });

    return apiRequest<{
      deleted: boolean;
      categoryId: string;
      deletedIds: string[];
    }>(`/categories/${categoryId}${qs}`, {
      method: "DELETE",
      requiresAuth: true,
    });
  },
};

import { useCallback, useEffect, useState } from "react";
import { categoriesService } from "../services/categoriesService";
import type { CategoryDetailResponse } from "../types/categories";

export function useCategoryDetail(categoryId?: string) {
  const [data, setData] = useState<CategoryDetailResponse | null>(null);
  const [loading, setLoading] = useState(Boolean(categoryId));
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!categoryId) {
      setData(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const result = await categoriesService.getCategoryDetail(categoryId);
      setData(result);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Không thể tải chi tiết danh mục",
      );
    } finally {
      setLoading(false);
    }
  }, [categoryId]);

  useEffect(() => {
    void load();
  }, [load]);

  return {
    data,
    loading,
    error,
    reload: load,
  };
}

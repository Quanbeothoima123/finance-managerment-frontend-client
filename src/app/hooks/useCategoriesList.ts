import { useCallback, useEffect, useMemo, useState } from "react";
import { categoriesService } from "../services/categoriesService";
import type {
  CategoriesListQuery,
  CategoriesListResponse,
} from "../types/categories";

export function useCategoriesList(query: CategoriesListQuery = {}) {
  const [data, setData] = useState<CategoriesListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const queryKey = useMemo(() => JSON.stringify(query), [query]);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await categoriesService.listCategories(query);
      setData(result);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Không thể tải danh sách danh mục",
      );
    } finally {
      setLoading(false);
    }
  }, [queryKey]);

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

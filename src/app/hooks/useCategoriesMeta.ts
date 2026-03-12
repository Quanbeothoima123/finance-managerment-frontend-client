import { useCallback, useEffect, useState } from "react";
import { categoriesService } from "../services/categoriesService";
import type { CategoriesMetaResponse } from "../types/categories";

export function useCategoriesMeta() {
  const [data, setData] = useState<CategoriesMetaResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await categoriesService.getMeta();
      setData(result);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Không thể tải dữ liệu danh mục",
      );
    } finally {
      setLoading(false);
    }
  }, []);

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

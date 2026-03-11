import { useCallback, useEffect, useMemo, useState } from "react";
import { tagsService } from "../services/tagsService";
import type { TagsListQuery, TagsListResponse } from "../types/tags";

export function useTagsList(query: TagsListQuery = {}) {
  const [data, setData] = useState<TagsListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const queryKey = useMemo(() => JSON.stringify(query), [query]);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await tagsService.listTags(query);
      setData(result);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Không thể tải danh sách tag",
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

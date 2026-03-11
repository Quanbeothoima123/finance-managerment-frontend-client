import { useCallback, useEffect, useState } from "react";
import { tagsService } from "../services/tagsService";
import type { TagItem } from "../types/tags";

export function useTagDetail(tagId?: string) {
  const [data, setData] = useState<TagItem | null>(null);
  const [loading, setLoading] = useState(Boolean(tagId));
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!tagId) {
      setData(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const result = await tagsService.getTagDetail(tagId);
      setData(result);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Không thể tải chi tiết tag",
      );
    } finally {
      setLoading(false);
    }
  }, [tagId]);

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

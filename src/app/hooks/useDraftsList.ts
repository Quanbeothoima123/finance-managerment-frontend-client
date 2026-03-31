import { useCallback, useEffect, useState } from "react";
import { communityPostsService } from "../services/communityPostsService";
import type { FeedResponse } from "../types/community";

export function useDraftsList() {
  const [data, setData] = useState<FeedResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await communityPostsService.listDrafts();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể tải bản nháp");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return { data, loading, error, reload: load };
}

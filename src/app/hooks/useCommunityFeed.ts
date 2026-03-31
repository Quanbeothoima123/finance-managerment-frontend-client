import { useCallback, useEffect, useMemo, useState } from "react";
import { communityPostsService } from "../services/communityPostsService";
import type { FeedResponse } from "../types/community";

export function useCommunityFeed(
  tab: "for-you" | "following" = "for-you",
  topicId?: string,
) {
  const [data, setData] = useState<FeedResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const queryKey = useMemo(
    () => JSON.stringify({ tab, topicId }),
    [tab, topicId],
  );

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await communityPostsService.getFeed({ tab, topicId });
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể tải bảng tin");
    } finally {
      setLoading(false);
    }
  }, [queryKey]);

  useEffect(() => {
    void load();
  }, [load]);

  return { data, loading, error, reload: load };
}

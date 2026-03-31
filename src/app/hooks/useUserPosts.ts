import { useCallback, useEffect, useState } from "react";
import { communityPostsService } from "../services/communityPostsService";
import type { FeedResponse } from "../types/community";

export function useUserPosts(profileId?: string) {
  const [data, setData] = useState<FeedResponse | null>(null);
  const [loading, setLoading] = useState(Boolean(profileId));
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!profileId) {
      setData(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const result = await communityPostsService.listUserPosts(profileId);
      setData(result);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Không thể tải bài viết người dùng",
      );
    } finally {
      setLoading(false);
    }
  }, [profileId]);

  useEffect(() => {
    void load();
  }, [load]);

  return { data, loading, error, reload: load };
}

import { useCallback, useEffect, useState } from "react";
import { communityPostsService } from "../services/communityPostsService";
import type { CommunityPost } from "../types/community";

export function usePostDetail(postId?: string) {
  const [data, setData] = useState<CommunityPost | null>(null);
  const [loading, setLoading] = useState(Boolean(postId));
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!postId) {
      setData(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const result = await communityPostsService.getPostDetail(postId);
      setData(result);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Không thể tải chi tiết bài viết",
      );
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    void load();
  }, [load]);

  return { data, loading, error, reload: load, setData };
}

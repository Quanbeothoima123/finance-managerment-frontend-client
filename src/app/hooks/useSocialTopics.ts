import { useCallback, useEffect, useState } from "react";
import { socialTopicsService } from "../services/socialTopicsService";
import type { SocialTopic } from "../types/community";

export function useSocialTopics() {
  const [data, setData] = useState<SocialTopic[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await socialTopicsService.listTopics();
      setData(result);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Không thể tải danh sách chủ đề",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return { data, loading, error, reload: load };
}

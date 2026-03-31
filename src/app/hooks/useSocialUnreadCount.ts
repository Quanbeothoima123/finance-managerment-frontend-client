import { useCallback, useEffect, useState } from "react";
import { socialNotificationsService } from "../services/socialNotificationsService";

export function useSocialUnreadCount() {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await socialNotificationsService.getUnreadCount();
      setCount(result?.count ?? 0);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Không thể tải số thông báo chưa đọc",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return { count, loading, error, reload: load };
}

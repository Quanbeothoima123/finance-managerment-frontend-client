import { useCallback, useEffect, useState } from "react";
import { socialNotificationsService } from "../services/socialNotificationsService";
import type { NotificationsListResponse } from "../types/community";

export function useSocialNotifications() {
  const [data, setData] = useState<NotificationsListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await socialNotificationsService.listNotifications();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể tải thông báo");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return { data, loading, error, reload: load };
}

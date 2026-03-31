import { useCallback, useEffect, useState } from "react";
import { socialProfilesService } from "../services/socialProfilesService";
import type { SocialProfile } from "../types/community";

export function useMyProfile() {
  const [data, setData] = useState<SocialProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await socialProfilesService.getMyProfile();
      setData(result);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Không thể tải hồ sơ cá nhân",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return { data, loading, error, reload: load, setData };
}

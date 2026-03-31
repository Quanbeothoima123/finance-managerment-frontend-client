import { useCallback, useEffect, useState } from "react";
import { socialProfilesService } from "../services/socialProfilesService";
import type { SocialProfile } from "../types/community";

export function usePublicProfile(identifier?: string) {
  const [data, setData] = useState<SocialProfile | null>(null);
  const [loading, setLoading] = useState(Boolean(identifier));
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!identifier) {
      setData(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      // ULID profile IDs are 26 chars; anything else is a username
      const result =
        identifier.length === 26
          ? await socialProfilesService.getProfileById(identifier)
          : await socialProfilesService.getProfileByUsername(identifier);
      setData(result);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Không thể tải hồ sơ người dùng",
      );
    } finally {
      setLoading(false);
    }
  }, [identifier]);

  useEffect(() => {
    void load();
  }, [load]);

  return { data, loading, error, reload: load, setData };
}

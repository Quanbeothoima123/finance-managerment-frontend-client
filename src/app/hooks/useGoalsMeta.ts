import { useCallback, useEffect, useState } from "react";
import { goalsService } from "../services/goalsService";
import type { GoalsMetaResponse } from "../types/goals";

export function useGoalsMeta() {
  const [data, setData] = useState<GoalsMetaResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await goalsService.getMeta();
      setData(result);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Không thể tải dữ liệu mục tiêu",
      );
    } finally {
      setLoading(false);
    }
  }, []);

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

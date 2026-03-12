import { useCallback, useEffect, useMemo, useState } from "react";
import { goalsService } from "../services/goalsService";
import type { GoalsListQuery, GoalsListResponse } from "../types/goals";

export function useGoalsList(query: GoalsListQuery = {}) {
  const [data, setData] = useState<GoalsListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const queryKey = useMemo(() => JSON.stringify(query), [query]);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await goalsService.listGoals(query);
      setData(result);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Không thể tải danh sách mục tiêu",
      );
    } finally {
      setLoading(false);
    }
  }, [queryKey]);

  useEffect(() => {
    void load();
  }, [load]);

  return { data, loading, error, reload: load, setData };
}

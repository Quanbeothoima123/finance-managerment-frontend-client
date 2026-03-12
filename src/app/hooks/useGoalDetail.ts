import { useCallback, useEffect, useState } from "react";
import { goalsService } from "../services/goalsService";
import type { GoalDetailResponse } from "../types/goals";

export function useGoalDetail(goalId?: string, enabled = true) {
  const [data, setData] = useState<GoalDetailResponse | null>(null);
  const [loading, setLoading] = useState(Boolean(goalId && enabled));
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!enabled || !goalId) {
      setData(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const result = await goalsService.getGoalDetail(goalId);
      setData(result);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Không thể tải chi tiết mục tiêu",
      );
    } finally {
      setLoading(false);
    }
  }, [enabled, goalId]);

  useEffect(() => {
    void load();
  }, [load]);

  return { data, loading, error, reload: load, setData };
}

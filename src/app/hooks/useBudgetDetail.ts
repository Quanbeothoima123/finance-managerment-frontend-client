import { useCallback, useEffect, useState } from "react";
import { budgetsService } from "../services/budgetsService";
import type { BudgetDetailResponse } from "../types/budgets";

export function useBudgetDetail(budgetId?: string) {
  const [data, setData] = useState<BudgetDetailResponse | null>(null);
  const [loading, setLoading] = useState(Boolean(budgetId));
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!budgetId) {
      setData(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const result = await budgetsService.getBudgetDetail(budgetId);
      setData(result);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Không thể tải chi tiết ngân sách",
      );
    } finally {
      setLoading(false);
    }
  }, [budgetId]);

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

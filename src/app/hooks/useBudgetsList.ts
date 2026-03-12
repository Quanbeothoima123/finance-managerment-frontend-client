import { useCallback, useEffect, useMemo, useState } from "react";
import { budgetsService } from "../services/budgetsService";
import type { BudgetsListQuery, BudgetsListResponse } from "../types/budgets";

export function useBudgetsList(query: BudgetsListQuery = {}) {
  const [data, setData] = useState<BudgetsListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const queryKey = useMemo(() => JSON.stringify(query), [query]);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await budgetsService.listBudgets(query);
      setData(result);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Không thể tải danh sách ngân sách",
      );
    } finally {
      setLoading(false);
    }
  }, [queryKey]);

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

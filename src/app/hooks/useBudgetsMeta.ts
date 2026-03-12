import { useCallback, useEffect, useState } from "react";
import { budgetsService } from "../services/budgetsService";
import type { BudgetsMetaResponse } from "../types/budgets";

export function useBudgetsMeta() {
  const [data, setData] = useState<BudgetsMetaResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await budgetsService.getMeta();
      setData(result);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Không thể tải dữ liệu ngân sách",
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

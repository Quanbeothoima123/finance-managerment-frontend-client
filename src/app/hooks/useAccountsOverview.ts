import { useCallback, useEffect, useState } from "react";
import { accountsService } from "../services/accountsService";
import type { AccountsOverviewResponse } from "../types/accounts";

function getCurrentMonthKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export function useAccountsOverview(initialMonth?: string) {
  const [month, setMonth] = useState(initialMonth || getCurrentMonthKey());
  const [data, setData] = useState<AccountsOverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (nextMonth?: string) => {
      try {
        setLoading(true);
        setError(null);
        const result = await accountsService.getOverview(nextMonth || month);
        setData(result);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Không thể tải dữ liệu tài khoản",
        );
      } finally {
        setLoading(false);
      }
    },
    [month],
  );

  useEffect(() => {
    void load(month);
  }, [load, month]);

  return {
    month,
    setMonth,
    data,
    loading,
    error,
    reload: () => load(month),
  };
}

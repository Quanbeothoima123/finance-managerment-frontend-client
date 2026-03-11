import { useCallback, useEffect, useState } from "react";
import { homeService } from "../services/homeService";
import type { HomeOverviewResponse } from "../types/home";

function getCurrentMonthKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export function useHomeOverview(initialMonth?: string) {
  const [month, setMonth] = useState(initialMonth || getCurrentMonthKey());
  const [data, setData] = useState<HomeOverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (nextMonth?: string) => {
      try {
        setLoading(true);
        setError(null);
        const result = await homeService.getOverview(nextMonth || month);
        setData(result);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Không thể tải dữ liệu trang chủ",
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

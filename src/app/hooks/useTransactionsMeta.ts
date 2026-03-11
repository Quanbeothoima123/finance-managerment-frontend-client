import { useCallback, useEffect, useState } from "react";
import { transactionsService } from "../services/transactionsService";
import type { TransactionsMetaResponse } from "../types/transactions";

export function useTransactionsMeta() {
  const [data, setData] = useState<TransactionsMetaResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await transactionsService.getMeta();
      setData(result);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Không thể tải dữ liệu tham chiếu giao dịch",
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

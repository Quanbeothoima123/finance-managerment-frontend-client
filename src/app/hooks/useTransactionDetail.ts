import { useCallback, useEffect, useState } from "react";
import { transactionsService } from "../services/transactionsService";
import type { TransactionDetailResponse } from "../types/transactions";

export function useTransactionDetail(transactionId?: string) {
  const [data, setData] = useState<TransactionDetailResponse | null>(null);
  const [loading, setLoading] = useState(Boolean(transactionId));
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!transactionId) {
      setData(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const result =
        await transactionsService.getTransactionDetail(transactionId);
      setData(result);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Không thể tải chi tiết giao dịch",
      );
    } finally {
      setLoading(false);
    }
  }, [transactionId]);

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

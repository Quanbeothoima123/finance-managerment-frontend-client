import { useCallback, useEffect, useMemo, useState } from "react";
import { transactionsService } from "../services/transactionsService";
import type {
  TransactionsListQuery,
  TransactionsListResponse,
} from "../types/transactions";

export function useTransactionsList(query: TransactionsListQuery) {
  const [data, setData] = useState<TransactionsListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const queryKey = useMemo(() => JSON.stringify(query), [query]);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await transactionsService.listTransactions(query);
      setData(result);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Không thể tải danh sách giao dịch",
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

import { useCallback, useEffect, useState } from "react";
import { accountsService } from "../services/accountsService";
import type { AccountDetailResponse } from "../types/accounts";

export function useAccountDetail(accountId?: string, limit = 20) {
  const [data, setData] = useState<AccountDetailResponse | null>(null);
  const [loading, setLoading] = useState(Boolean(accountId));
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!accountId) {
      setData(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const result = await accountsService.getAccountDetail(accountId, limit);
      setData(result);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Không thể tải chi tiết tài khoản",
      );
    } finally {
      setLoading(false);
    }
  }, [accountId, limit]);

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

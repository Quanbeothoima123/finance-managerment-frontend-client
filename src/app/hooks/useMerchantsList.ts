import { useCallback, useEffect, useMemo, useState } from "react";
import { merchantsService } from "../services/merchantsService";
import type {
  MerchantsListQuery,
  MerchantsListResponse,
} from "../types/merchants";

export function useMerchantsList(query: MerchantsListQuery = {}) {
  const [data, setData] = useState<MerchantsListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const queryKey = useMemo(() => JSON.stringify(query), [query]);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await merchantsService.listMerchants(query);
      setData(result);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Không thể tải danh sách merchant",
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

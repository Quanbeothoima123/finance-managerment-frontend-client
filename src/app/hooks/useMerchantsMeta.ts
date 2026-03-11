import { useCallback, useEffect, useState } from "react";
import { merchantsService } from "../services/merchantsService";
import type { MerchantsMetaResponse } from "../types/merchants";

export function useMerchantsMeta() {
  const [data, setData] = useState<MerchantsMetaResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await merchantsService.getMeta();
      setData(result);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Không thể tải dữ liệu merchant",
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

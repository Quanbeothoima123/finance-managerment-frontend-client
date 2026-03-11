import { useCallback, useEffect, useState } from "react";
import { merchantsService } from "../services/merchantsService";
import type { MerchantDetailResponse } from "../types/merchants";

export function useMerchantDetail(merchantId?: string) {
  const [data, setData] = useState<MerchantDetailResponse | null>(null);
  const [loading, setLoading] = useState(Boolean(merchantId));
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!merchantId) {
      setData(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const result = await merchantsService.getMerchantDetail(merchantId);
      setData(result);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Không thể tải chi tiết merchant",
      );
    } finally {
      setLoading(false);
    }
  }, [merchantId]);

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

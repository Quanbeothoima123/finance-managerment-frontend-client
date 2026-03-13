import { useCallback, useEffect, useState } from 'react';
import { recurringService } from '../services/recurringService';
import type { RecurringMetaResponse } from '../types/recurring';

export function useRecurringMeta(enabled = true) {
  const [data, setData] = useState<RecurringMetaResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!enabled) {
      setData(null);
      setLoading(false);
      setError(null);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      setData(await recurringService.getMeta());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tải dữ liệu giao dịch định kỳ');
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    void load();
  }, [load]);

  return { data, loading, error, reload: load };
}

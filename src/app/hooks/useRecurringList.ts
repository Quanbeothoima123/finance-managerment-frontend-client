import { useCallback, useEffect, useMemo, useState } from 'react';
import { recurringService } from '../services/recurringService';
import type { RecurringListQuery, RecurringListResponse } from '../types/recurring';

export function useRecurringList(query: RecurringListQuery = {}, enabled = true) {
  const [data, setData] = useState<RecurringListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const queryKey = useMemo(() => JSON.stringify(query), [query]);

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
      setData(await recurringService.listRecurringRules(query));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tải danh sách giao dịch định kỳ');
    } finally {
      setLoading(false);
    }
  }, [enabled, queryKey]);

  useEffect(() => {
    void load();
  }, [load]);

  return { data, loading, error, reload: load, setData };
}

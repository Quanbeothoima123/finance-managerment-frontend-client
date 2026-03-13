import { useCallback, useEffect, useState } from 'react';
import { recurringService } from '../services/recurringService';
import type { RecurringDetailResponse } from '../types/recurring';

export function useRecurringDetail(ruleId?: string, enabled = true) {
  const [data, setData] = useState<RecurringDetailResponse | null>(null);
  const [loading, setLoading] = useState(Boolean(ruleId && enabled));
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!enabled || !ruleId) {
      setData(null);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      setData(await recurringService.getRecurringRuleDetail(ruleId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tải chi tiết giao dịch định kỳ');
    } finally {
      setLoading(false);
    }
  }, [enabled, ruleId]);

  useEffect(() => {
    void load();
  }, [load]);

  return { data, loading, error, reload: load, setData };
}

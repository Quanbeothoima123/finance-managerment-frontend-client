import { useCallback, useEffect, useMemo, useState } from 'react';
import { autoRulesService } from '../services/autoRulesService';
import type { AutoRulesListQuery, AutoRulesListResponse } from '../types/autoRules';

export function useAutoRulesList(query: AutoRulesListQuery = {}, enabled = true) {
  const [data, setData] = useState<AutoRulesListResponse | null>(null);
  const [loading, setLoading] = useState(Boolean(enabled));
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
      setData(await autoRulesService.listAutoRules(query));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tải danh sách quy tắc tự động');
    } finally {
      setLoading(false);
    }
  }, [enabled, queryKey]);

  useEffect(() => {
    void load();
  }, [load]);

  return { data, loading, error, reload: load, setData };
}

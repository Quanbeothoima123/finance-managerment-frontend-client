import { useCallback, useEffect, useState } from 'react';
import { autoRulesService } from '../services/autoRulesService';
import type { AutoRulesMetaResponse } from '../types/autoRules';

export function useAutoRulesMeta(enabled = true) {
  const [data, setData] = useState<AutoRulesMetaResponse | null>(null);
  const [loading, setLoading] = useState(Boolean(enabled));
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
      setData(await autoRulesService.getMeta());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tải dữ liệu quy tắc tự động');
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    void load();
  }, [load]);

  return { data, loading, error, reload: load };
}

import { useCallback, useEffect, useState } from "react";
import { autoRulesService } from "../services/autoRulesService";
import type { AutoRuleDetailResponse } from "../types/autoRules";

export function useAutoRuleDetail(ruleId?: string, enabled = true) {
  const [data, setData] = useState<AutoRuleDetailResponse | null>(null);
  const [loading, setLoading] = useState(Boolean(ruleId && enabled));
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!enabled || !ruleId) {
      setData(null);
      setLoading(false);
      setError(null);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      setData(await autoRulesService.getAutoRuleDetail(ruleId));
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Không thể tải chi tiết quy tắc tự động",
      );
    } finally {
      setLoading(false);
    }
  }, [enabled, ruleId]);

  useEffect(() => {
    void load();
  }, [load]);

  return { data, loading, error, reload: load, setData };
}

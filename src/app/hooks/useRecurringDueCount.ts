import { useMemo } from 'react';
import { useRecurringList } from './useRecurringList';

export function useRecurringDueCount(withinDays = 0) {
  const { data } = useRecurringList({ status: 'active', sortBy: 'nextRunAt', sortOrder: 'asc' });
  const recurringRules = data?.items || [];

  return useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const threshold = new Date(today);
    threshold.setDate(threshold.getDate() + withinDays);

    return recurringRules.filter((rule) => {
      if (!rule.enabled) return false;
      const next = new Date(rule.nextDate);
      next.setHours(0, 0, 0, 0);
      return next <= threshold;
    }).length;
  }, [recurringRules, withinDays]);
}

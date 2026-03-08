import { useMemo } from 'react';
import { useDemoData } from '../contexts/DemoDataContext';

/**
 * Returns the number of enabled recurring rules that are due
 * (nextDate <= today) or coming up within `withinDays` days.
 */
export function useRecurringDueCount(withinDays = 0) {
  const { recurringRules } = useDemoData();

  return useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const threshold = new Date(today);
    threshold.setDate(threshold.getDate() + withinDays);

    return recurringRules.filter(r => {
      if (!r.enabled) return false;
      const next = new Date(r.nextDate);
      next.setHours(0, 0, 0, 0);
      return next <= threshold;
    }).length;
  }, [recurringRules, withinDays]);
}

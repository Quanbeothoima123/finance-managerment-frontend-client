import { useEffect, useRef } from 'react';
import { useNotifications } from '../contexts/NotificationContext';
import { useRecurringList } from './useRecurringList';

const STORAGE_KEY_GENERATED = 'finance-notif-generated-rules';

export function useAutoRecurringNotifications() {
  const { data } = useRecurringList({ status: 'active', sortBy: 'nextRunAt', sortOrder: 'asc' });
  const recurringRules = data?.items || [];
  const { settings, addNotification, notifications } = useNotifications();
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    if (!settings.recurringReminders) return;
    if (!recurringRules.length) return;

    let generatedSet: Set<string>;
    try {
      const stored = localStorage.getItem(STORAGE_KEY_GENERATED);
      generatedSet = stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
      generatedSet = new Set();
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];
    let didGenerate = false;

    for (const rule of recurringRules) {
      if (!rule.enabled) continue;
      if (rule.notifyEnabled === false) continue;

      const nextDate = new Date(rule.nextDate);
      nextDate.setHours(0, 0, 0, 0);
      if (nextDate > today) continue;

      const key = `${rule.id}:${rule.nextDate}`;
      if (generatedSet.has(key)) continue;

      const existingNotif = notifications.find(
        (notification) => notification.type === 'recurring-due' && notification.recurringRuleId === rule.id && !notification.read,
      );
      if (existingNotif) {
        generatedSet.add(key);
        continue;
      }

      const currencySymbol = rule.currencyCode === 'VND' ? '₫' : rule.currencyCode;
      const amountStr = new Intl.NumberFormat('vi-VN').format(Math.abs(rule.amount));
      const typeLabel = rule.type === 'income' ? 'Thu nhập' : rule.type === 'transfer' ? 'Chuyển khoản' : 'Chi tiêu';
      const dueLabel = rule.nextDate === todayStr ? 'Hôm nay' : rule.nextDate;

      addNotification({
        type: 'recurring-due',
        title: `Đến hạn: ${rule.name}`,
        subtitle: `${typeLabel} • ${amountStr}${currencySymbol} • ${rule.account} • Đến hạn: ${dueLabel}`,
        recurringRuleId: rule.id,
        amount: Math.abs(rule.amount),
        accountName: rule.account,
      });

      generatedSet.add(key);
      didGenerate = true;
    }

    if (didGenerate || generatedSet.size > 0) {
      try {
        localStorage.setItem(STORAGE_KEY_GENERATED, JSON.stringify([...generatedSet]));
      } catch {
        // ignore local storage issues
      }
    }

    hasRun.current = true;
  }, [recurringRules, settings.recurringReminders, addNotification, notifications]);
}

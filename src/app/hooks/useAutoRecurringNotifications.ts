import { useEffect, useRef } from 'react';
import { useDemoData } from '../contexts/DemoDataContext';
import { useNotifications } from '../contexts/NotificationContext';

const STORAGE_KEY_GENERATED = 'finance-notif-generated-rules';

/**
 * Auto-generates notification items for recurring rules whose nextDate ≤ today.
 * 
 * Respects:
 * - Global `recurringReminders` setting from NotificationContext
 * - Per-rule `notifyEnabled` flag (default true)
 * - Tracks which rule+date combos have already been generated to avoid duplicates
 */
export function useAutoRecurringNotifications() {
  const { recurringRules, selectedCurrency } = useDemoData();
  const { settings, addNotification, notifications } = useNotifications();
  const hasRun = useRef(false);

  useEffect(() => {
    // Only run once per mount to avoid spam during re-renders
    if (hasRun.current) return;
    if (!settings.recurringReminders) return;

    // Load set of already-generated keys: "ruleId:nextDate"
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
      // Skip disabled rules or rules with notifications turned off
      if (!rule.enabled) continue;
      if (rule.notifyEnabled === false) continue;

      const nextDate = new Date(rule.nextDate);
      nextDate.setHours(0, 0, 0, 0);
      if (nextDate > today) continue;

      // Dedupe key
      const key = `${rule.id}:${rule.nextDate}`;
      if (generatedSet.has(key)) continue;

      // Also check if a notification already exists for this rule that's unread
      const existingNotif = notifications.find(
        n => n.type === 'recurring-due' && n.recurringRuleId === rule.id && !n.read,
      );
      if (existingNotif) {
        generatedSet.add(key);
        continue;
      }

      const currencySymbol = selectedCurrency === 'VND' ? '₫' : selectedCurrency;
      const amountStr = new Intl.NumberFormat('vi-VN').format(Math.abs(rule.amount));
      const typeLabel = rule.type === 'income' ? 'Thu nhập' : 'Chi tiêu';
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
      } catch {}
    }

    hasRun.current = true;
  }, [recurringRules, settings.recurringReminders, addNotification, notifications, selectedCurrency]);
}

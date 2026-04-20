import { useEffect, useRef } from "react";
import { useAppData } from "../contexts/AppDataContext";
import { useNotifications } from "../contexts/NotificationContext";

const STORAGE_KEY = "finance-budget-alert-triggered";

/**
 * Auto-generate budget-alert notifications when a budget's spending crosses
 * a configured threshold.
 *
 * Anti-spam: each threshold per budget can only fire once per budget period.
 * Tracked in localStorage keyed by `{budgetId}:{threshold}:{startDate}`.
 */
export function useAutoBudgetNotifications() {
  const { budgets, transactions } = useAppData();
  const { addNotification, settings } = useNotifications();
  const prevRef = useRef<string>("");

  useEffect(() => {
    // Respect global budgetAlerts toggle
    if (!settings.budgetAlerts) return;

    // Build a fingerprint to avoid re-running on every render
    const fingerprint = `${budgets.length}-${transactions.length}`;
    if (fingerprint === prevRef.current) return;
    prevRef.current = fingerprint;

    // Load triggered set
    let triggered: Set<string>;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      triggered = stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
      triggered = new Set();
    }

    let added = false;

    for (const budget of budgets) {
      // Skip if alerts disabled on this budget
      if (budget.alertsEnabled === false) continue;
      const thresholds = budget.alertThresholds || [];
      if (thresholds.length === 0) continue;

      // Compute real spent
      const catSet = new Set(budget.categories);
      const spent = transactions
        .filter((t) => {
          if (t.type !== "expense") return false;
          if (!t.categoryId || !catSet.has(t.categoryId)) return false;
          if (t.date < budget.startDate || t.date > budget.endDate)
            return false;
          return true;
        })
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);

      const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;
      const remaining = budget.amount - spent;

      for (const threshold of thresholds) {
        if (percentage < threshold) continue;

        const key = `${budget.id}:${threshold}:${budget.startDate}`;
        if (triggered.has(key)) continue;

        // Fire notification
        const title =
          threshold >= 100
            ? `Vượt ngân sách ${budget.name}`
            : `Sắp vượt ngân sách ${budget.name}`;

        addNotification({
          type: "budget-alert",
          title,
          subtitle: `Đã dùng ${Math.round(percentage)}% • còn ${new Intl.NumberFormat("vi-VN").format(Math.max(0, remaining))}₫`,
          budgetId: budget.id,
          percentUsed: Math.round(percentage),
          remaining: Math.max(0, remaining),
        });

        triggered.add(key);
        added = true;
      }
    }

    if (added) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify([...triggered]));
      } catch {}
    }
  }, [budgets, transactions, settings.budgetAlerts, addNotification]);
}

import { useEffect, useRef } from 'react';
import { useDemoData } from '../contexts/DemoDataContext';
import { useToast } from '../contexts/ToastContext';

/**
 * Hook that auto-generates goal contributions based on each goal's
 * autoContribute settings. Runs once per mount and checks if the
 * current month's contribution has already been made.
 */
export function useAutoGoalContributions() {
  const { goals, addGoalContribution, updateGoal } = useDemoData();
  const toast = useToast();
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    const today = new Date();
    const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    const todayDay = today.getDate();

    goals.forEach(goal => {
      if (!goal.autoContributeEnabled) return;
      if (!goal.autoContributeAmount || goal.autoContributeAmount <= 0) return;
      if (goal.status === 'achieved') return;

      // Check if already contributed this month
      if (goal.lastAutoContributeDate === currentMonth) return;

      // Check if today is on or past the contribution day
      const contributeDay = goal.autoContributeDay || 1;
      if (todayDay < contributeDay) return;

      // Generate auto-contribution
      const amount = goal.autoContributeAmount;
      const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(contributeDay).padStart(2, '0')}`;

      addGoalContribution(goal.id, {
        amount,
        date: dateStr,
        notes: `Đóng góp tự động tháng ${today.getMonth() + 1}/${today.getFullYear()}`,
      });

      // Mark this month as done
      updateGoal(goal.id, {
        lastAutoContributeDate: currentMonth,
      });

      toast.success(
        `Đã tự động đóng góp ${new Intl.NumberFormat('vi-VN').format(amount)}₫ vào "${goal.name}"`,
      );
    });
  }, [goals, addGoalContribution, updateGoal, toast]);
}

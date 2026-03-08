import { useRef, useCallback } from 'react';
import { useDemoData, Goal } from '../contexts/DemoDataContext';
import { useToast } from '../contexts/ToastContext';

const UNDO_TIMEOUT_MS = 6000;

/**
 * Hook that provides "soft delete with undo" for goals.
 * Same pattern as useTransactionUndoDelete.
 */
export function useGoalUndoDelete() {
  const { goals, deleteGoal, restoreGoals } = useDemoData();
  const toast = useToast();

  const snapshotRef = useRef<Goal[] | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const commitPending = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    snapshotRef.current = null;
  }, []);

  const undoDelete = useCallback(() => {
    if (snapshotRef.current) {
      restoreGoals(snapshotRef.current);
      toast.success('Đã khôi phục mục tiêu.');
    }
    commitPending();
  }, [restoreGoals, toast, commitPending]);

  const softDeleteGoal = useCallback(
    (goalId: string) => {
      commitPending();

      // Snapshot before deleting
      snapshotRef.current = [...goals];

      const goal = goals.find(g => g.id === goalId);
      const goalName = goal?.name || 'Mục tiêu';

      deleteGoal(goalId);

      toast.showUndoToast(`Đã xoá "${goalName}".`, undoDelete, UNDO_TIMEOUT_MS);

      timerRef.current = setTimeout(() => {
        commitPending();
      }, UNDO_TIMEOUT_MS + 500);
    },
    [goals, deleteGoal, toast, undoDelete, commitPending],
  );

  return { softDeleteGoal };
}

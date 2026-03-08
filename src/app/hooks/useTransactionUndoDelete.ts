import { useRef, useCallback } from 'react';
import { useDemoData, Transaction } from '../contexts/DemoDataContext';
import { useToast } from '../contexts/ToastContext';

const UNDO_TIMEOUT_MS = 6000; // 6 seconds

/**
 * Hook that provides "soft delete with undo" for transactions.
 *
 * Flow:
 * 1. `softDelete(id)` — immediately removes the transaction(s) from state
 *    and shows an undo toast.
 * 2. If the user clicks "Hoàn tác" within 6 s, the snapshot is restored.
 * 3. If the timeout expires, the deletion is committed (no-op since already removed).
 *
 * Only the most-recent deletion is undoable.
 */
export function useTransactionUndoDelete() {
  const { transactions, deleteTransaction, restoreTransactions } = useDemoData();
  const toast = useToast();

  // Stores the full transactions array snapshot before the deletion
  const snapshotRef = useRef<Transaction[] | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toastIdRef = useRef<string | null>(null);

  /** Clear any pending undo state */
  const commitPending = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    snapshotRef.current = null;
    toastIdRef.current = null;
  }, []);

  /** Undo the most recent deletion */
  const undoDelete = useCallback(() => {
    if (snapshotRef.current) {
      restoreTransactions(snapshotRef.current);
      toast.success('Đã khôi phục giao dịch.');
    }
    commitPending();
  }, [restoreTransactions, toast, commitPending]);

  /**
   * Soft-delete a transaction (+ its linked fee if applicable).
   * Shows an undo toast and returns immediately.
   */
  const softDelete = useCallback(
    (txnId: string, options?: { deleteLinked?: boolean }) => {
      // Commit any previous pending undo first
      commitPending();

      // Take snapshot BEFORE deleting
      snapshotRef.current = [...transactions];

      // Check for linked transaction info for toast message
      const txn = transactions.find(t => t.id === txnId);
      const hasLinked =
        options?.deleteLinked &&
        txn?.linkedTransactionId &&
        transactions.some(t => t.id === txn.linkedTransactionId);

      // Actually delete
      deleteTransaction(txnId, options?.deleteLinked);

      // Build toast message
      const message = hasLinked
        ? 'Đã xoá giao dịch và phí liên kết.'
        : 'Đã xoá giao dịch.';

      // Show undo toast
      const id = toast.showUndoToast(message, undoDelete, UNDO_TIMEOUT_MS);
      toastIdRef.current = id;

      // Set commit timer — after timeout, clear snapshot (no-op)
      timerRef.current = setTimeout(() => {
        commitPending();
      }, UNDO_TIMEOUT_MS + 500); // Slightly longer than toast to avoid race
    },
    [transactions, deleteTransaction, toast, undoDelete, commitPending],
  );

  /**
   * Soft-delete multiple transactions (bulk).
   * Only the most recent bulk operation is undoable.
   */
  const softBulkDelete = useCallback(
    (txnIds: string[]) => {
      commitPending();

      // Take snapshot
      snapshotRef.current = [...transactions];

      // Delete each (including linked for transfers with fees)
      txnIds.forEach(id => {
        const txn = transactions.find(t => t.id === id);
        const hasLinked = txn?.linkedTransactionId && transactions.some(t => t.id === txn.linkedTransactionId);
        deleteTransaction(id, !!hasLinked);
      });

      const message = `Đã xoá ${txnIds.length} giao dịch.`;
      const id = toast.showUndoToast(message, undoDelete, UNDO_TIMEOUT_MS);
      toastIdRef.current = id;

      timerRef.current = setTimeout(() => {
        commitPending();
      }, UNDO_TIMEOUT_MS + 500);
    },
    [transactions, deleteTransaction, toast, undoDelete, commitPending],
  );

  return { softDelete, softBulkDelete };
}

import { useEffect } from 'react';
import { useNavigate } from 'react-router';

export function useKeyboardShortcuts() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable
      ) {
        return;
      }

      const isCtrlOrCmd = e.ctrlKey || e.metaKey;

      if (isCtrlOrCmd) {
        switch (e.key.toLowerCase()) {
          case 'n':
            e.preventDefault();
            navigate('/transactions/new');
            break;
          case 'e':
            e.preventDefault();
            navigate('/export');
            break;
          case 'b':
            e.preventDefault();
            navigate('/budgets');
            break;
          case 'k':
            // Could be used for command palette in the future
            break;
        }
      }

      // Non-modifier shortcuts
      if (!isCtrlOrCmd && !e.altKey) {
        switch (e.key) {
          case '?':
            // Show keyboard shortcuts help - could open a modal
            break;
        }
      }

      // Alt shortcuts for quick navigation
      if (e.altKey && !isCtrlOrCmd) {
        switch (e.key.toLowerCase()) {
          case 'h':
            e.preventDefault();
            navigate('/');
            break;
          case 't':
            e.preventDefault();
            navigate('/transactions');
            break;
          case 'a':
            e.preventDefault();
            navigate('/accounts');
            break;
          case 'i':
            e.preventDefault();
            navigate('/insights');
            break;
          case 's':
            e.preventDefault();
            navigate('/settings');
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);
}

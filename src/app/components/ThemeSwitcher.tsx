import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

export function ThemeSwitcher() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="inline-flex items-center justify-center gap-2 rounded-[var(--radius-lg)] bg-[var(--surface)] px-3 py-2 transition-colors hover:bg-[var(--surface-elevated)] border border-[var(--border)]"
      aria-label="Chuyển đổi chủ đề"
    >
      {theme === 'light' ? (
        <>
          <Moon className="w-4 h-4 text-[var(--text-secondary)]" />
          <span className="text-sm text-[var(--text-secondary)]">Tối</span>
        </>
      ) : (
        <>
          <Sun className="w-4 h-4 text-[var(--text-secondary)]" />
          <span className="text-sm text-[var(--text-secondary)]">Sáng</span>
        </>
      )}
    </button>
  );
}

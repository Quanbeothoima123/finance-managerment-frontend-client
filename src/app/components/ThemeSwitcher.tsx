import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';

export function ThemeSwitcher() {
  const { theme, toggleTheme } = useTheme();
  const { t } = useTranslation('common');

  return (
    <button
      onClick={toggleTheme}
      className="inline-flex items-center justify-center gap-2 rounded-[var(--radius-lg)] bg-[var(--surface)] px-3 py-2 transition-colors hover:bg-[var(--surface-elevated)] border border-[var(--border)]"
      aria-label={t('theme.toggle')}
    >
      {theme === 'light' ? (
        <>
          <Moon className="w-4 h-4 text-[var(--text-secondary)]" />
          <span className="text-sm text-[var(--text-secondary)]">{t('theme.dark')}</span>
        </>
      ) : (
        <>
          <Sun className="w-4 h-4 text-[var(--text-secondary)]" />
          <span className="text-sm text-[var(--text-secondary)]">{t('theme.light')}</span>
        </>
      )}
    </button>
  );
}

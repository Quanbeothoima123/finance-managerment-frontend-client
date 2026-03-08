import React, { useState } from 'react';
import { Bell, Search, ChevronDown, Menu } from 'lucide-react';
import { useNavigate } from 'react-router';
import { ThemeSwitcher } from './ThemeSwitcher';
import { useNotifications } from '../contexts/NotificationContext';

interface TopbarProps {
  title?: string;
  onMenuClick?: () => void;
}

export function Topbar({ title = 'Tổng quan', onMenuClick }: TopbarProps) {
  const [selectedMonth, setSelectedMonth] = useState('Tháng 2, 2026');
  const navigate = useNavigate();
  const { unreadCount } = useNotifications();

  const months = [
    'Tháng 1, 2026',
    'Tháng 2, 2026',
    'Tháng 3, 2026',
    'Tháng 12, 2025',
    'Tháng 11, 2025',
  ];

  return (
    <header className="h-16 bg-[var(--background)] border-b border-[var(--border)] flex items-center justify-between px-4 md:px-6">
      {/* Left: Title + Month Selector */}
      <div className="flex items-center gap-4">
        {/* Mobile menu button */}
        {onMenuClick && (
          <button
            onClick={onMenuClick}
            className="p-2 rounded-[var(--radius-lg)] hover:bg-[var(--surface)] transition-colors md:hidden"
          >
            <Menu className="w-5 h-5 text-[var(--text-secondary)]" />
          </button>
        )}

        <h2 className="text-lg md:text-xl font-semibold text-[var(--text-primary)]">{title}</h2>

        {/* Month Selector (hidden on mobile) */}
        <div className="relative hidden lg:block">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="appearance-none pl-4 pr-10 py-2 bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-lg)] text-sm font-medium text-[var(--text-primary)] cursor-pointer hover:bg-[var(--surface-elevated)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]"
          >
            {months.map((month) => (
              <option key={month} value={month}>
                {month}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)] pointer-events-none" />
        </div>
      </div>

      {/* Right: Search + Notifications + Theme Toggle */}
      <div className="flex items-center gap-2 md:gap-4">
        {/* Search Bar (Desktop) */}
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]" />
          <input
            type="text"
            placeholder="Tìm kiếm giao dịch..."
            className="w-64 lg:w-80 pl-10 pr-4 py-2 bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-lg)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)] transition-shadow"
          />
        </div>

        {/* Search Button (Mobile) */}
        <button className="p-2 rounded-[var(--radius-lg)] hover:bg-[var(--surface)] transition-colors md:hidden">
          <Search className="w-5 h-5 text-[var(--text-secondary)]" />
        </button>

        {/* Notifications */}
        <button
          onClick={() => navigate('/notifications')}
          className="relative p-2 rounded-[var(--radius-lg)] hover:bg-[var(--surface)] transition-colors"
        >
          <Bell className="w-5 h-5 text-[var(--text-secondary)]" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-[var(--danger)] text-white text-[10px] font-bold flex items-center justify-center">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>

        {/* Theme Switcher */}
        <ThemeSwitcher />
      </div>
    </header>
  );
}
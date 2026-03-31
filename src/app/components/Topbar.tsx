import React from "react";
import { Bell, Menu } from "lucide-react";
import { useNavigate } from "react-router";
import { ThemeSwitcher } from "./ThemeSwitcher";
import { useNotifications } from "../contexts/NotificationContext";

interface TopbarProps {
  title?: string;
  onMenuClick?: () => void;
}

export function Topbar({ title = "Tổng quan", onMenuClick }: TopbarProps) {
  const navigate = useNavigate();
  const { unreadCount } = useNotifications();

  return (
    <header className="h-16 bg-[var(--background)] border-b border-[var(--border)] flex items-center justify-between px-4 md:px-6">
      {/* Left: Title */}
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

        <h2 className="text-lg md:text-xl font-semibold text-[var(--text-primary)]">
          {title}
        </h2>
      </div>

      {/* Right: Notifications + Theme Toggle */}
      <div className="flex items-center gap-2 md:gap-4">
        {/* Notifications */}
        <button
          onClick={() => navigate("/notifications")}
          className="relative p-2 rounded-[var(--radius-lg)] hover:bg-[var(--surface)] transition-colors"
        >
          <Bell className="w-5 h-5 text-[var(--text-secondary)]" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-[var(--danger)] text-white text-[10px] font-bold flex items-center justify-center">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </button>

        {/* Theme Switcher */}
        <ThemeSwitcher />
      </div>
    </header>
  );
}

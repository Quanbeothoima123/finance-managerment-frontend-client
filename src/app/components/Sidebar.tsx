import React, { useRef, useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router";
import { Wallet, ChevronDown, Settings, LogOut } from "lucide-react";
import { getSidebarRoutes } from "../routes";
import { useRecurringDueCount } from "../hooks/useRecurringDueCount";
import { useAuth } from "../hooks/useAuth";
import { LogoutModal } from "./ConfirmationModals";

interface SidebarProps {
  activePath?: string;
  onNavigate?: (path: string) => void;
}

export function Sidebar({ activePath, onNavigate }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const sidebarRoutes = getSidebarRoutes();
  const recurringDueCount = useRecurringDueCount(1);
  const { user, logout } = useAuth();

  const [profileOpen, setProfileOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        profileRef.current &&
        !profileRef.current.contains(e.target as Node)
      ) {
        setProfileOpen(false);
      }
    }
    if (profileOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [profileOpen]);

  const handleLogoutConfirm = async () => {
    setShowLogoutModal(false);
    await logout();
    navigate("/auth/login", { replace: true });
  };

  const initials = user?.displayName
    ? user.displayName
        .split(" ")
        .map((w) => w[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "?";

  const currentPath = activePath || location.pathname;

  const handleNavigate = (path: string) => {
    if (onNavigate) {
      onNavigate(path);
    } else {
      navigate(path);
    }
  };

  // Group routes by category
  const groupedRoutes = {
    core: sidebarRoutes.filter((r) => r.group === "core"),
    accounts: sidebarRoutes.filter((r) => r.group === "accounts"),
    categories: sidebarRoutes.filter((r) => r.group === "categories"),
    budgets: sidebarRoutes.filter((r) => r.group === "budgets"),
    goals: sidebarRoutes.filter((r) => r.group === "goals"),
    insights: sidebarRoutes.filter((r) => r.group === "insights"),
    rules: sidebarRoutes.filter((r) => r.group === "rules"),
    settings: sidebarRoutes.filter((r) => r.group === "settings"),
  };

  const renderNavItem = (route: any) => {
    const Icon = route.icon;
    const isActive =
      currentPath === route.path || currentPath.startsWith(route.path + "/");
    const showBadge =
      route.path === "/rules/recurring" && recurringDueCount > 0;

    return (
      <button
        key={route.path}
        onClick={() => handleNavigate(route.path)}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-[var(--radius-lg)] transition-colors ${
          isActive
            ? "bg-[var(--primary-light)] text-[var(--primary)]"
            : "text-[var(--text-secondary)] hover:bg-[var(--surface-elevated)] hover:text-[var(--text-primary)]"
        }`}
      >
        {Icon && <Icon className="w-5 h-5" />}
        <span className="font-medium flex-1 text-left">{route.label}</span>
        {showBadge && (
          <span className="flex-shrink-0 min-w-[20px] h-5 px-1.5 rounded-full bg-[var(--danger)] text-white text-xs font-bold flex items-center justify-center">
            {recurringDueCount}
          </span>
        )}
      </button>
    );
  };

  return (
    <aside className="w-64 h-screen bg-[var(--surface)] border-r border-[var(--border)] flex flex-col overflow-y-auto">
      {/* Logo/Brand */}
      <div className="p-6 border-b border-[var(--divider)]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-[var(--radius-lg)] bg-[var(--primary)] flex items-center justify-center">
            <Wallet className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-semibold text-[var(--text-primary)]">
              MoneyApp
            </h1>
            <p className="text-xs text-[var(--text-secondary)]">
              Quản lý tài chính
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-6">
        {/* Core */}
        {groupedRoutes.core.length > 0 && (
          <div>{groupedRoutes.core.map(renderNavItem)}</div>
        )}

        {/* Accounts */}
        {groupedRoutes.accounts.length > 0 && (
          <div>
            <div className="px-4 py-2 text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">
              Tài khoản
            </div>
            <div className="space-y-1">
              {groupedRoutes.accounts.map(renderNavItem)}
            </div>
          </div>
        )}

        {/* Categories */}
        {groupedRoutes.categories.length > 0 && (
          <div>
            <div className="px-4 py-2 text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">
              Phân loại
            </div>
            <div className="space-y-1">
              {groupedRoutes.categories.map(renderNavItem)}
            </div>
          </div>
        )}

        {/* Budgets & Goals */}
        {(groupedRoutes.budgets.length > 0 ||
          groupedRoutes.goals.length > 0) && (
          <div>
            <div className="px-4 py-2 text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">
              Lập kế hoạch
            </div>
            <div className="space-y-1">
              {groupedRoutes.budgets.map(renderNavItem)}
              {groupedRoutes.goals.map(renderNavItem)}
            </div>
          </div>
        )}

        {/* Insights */}
        {groupedRoutes.insights.length > 0 && (
          <div>
            <div className="px-4 py-2 text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">
              Phân tích
            </div>
            <div className="space-y-1">
              {groupedRoutes.insights.map(renderNavItem)}
            </div>
          </div>
        )}

        {/* Rules */}
        {groupedRoutes.rules.length > 0 && (
          <div>
            <div className="px-4 py-2 text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">
              Tự động hoá
            </div>
            <div className="space-y-1">
              {groupedRoutes.rules.map(renderNavItem)}
            </div>
          </div>
        )}

        {/* Settings */}
        {groupedRoutes.settings.length > 0 && (
          <div>
            <div className="px-4 py-2 text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">
              Khác
            </div>
            <div className="space-y-1">
              {groupedRoutes.settings.map(renderNavItem)}
            </div>
          </div>
        )}
      </nav>

      {/* User Profile */}
      <div
        className="p-4 border-t border-[var(--divider)] relative"
        ref={profileRef}
      >
        {/* Dropdown menu — renders above the button */}
        {profileOpen && (
          <div className="absolute bottom-full left-4 right-4 mb-2 bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-lg)] shadow-lg overflow-hidden z-50">
            {/* User info header */}
            <div className="px-4 py-3 border-b border-[var(--divider)]">
              <p className="text-sm font-semibold text-[var(--text-primary)] truncate">
                {user?.displayName ?? "—"}
              </p>
              <p className="text-xs text-[var(--text-secondary)] truncate">
                {user?.email ?? "—"}
              </p>
            </div>
            {/* Actions */}
            <div className="py-1">
              <button
                onClick={() => {
                  setProfileOpen(false);
                  navigate("/settings");
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--text-primary)] hover:bg-[var(--surface-elevated)] transition-colors"
              >
                <Settings className="w-4 h-4 text-[var(--text-secondary)]" />
                Cài đặt
              </button>
              <button
                onClick={() => {
                  setProfileOpen(false);
                  setShowLogoutModal(true);
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--danger)] hover:bg-[var(--surface-elevated)] transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Đăng xuất
              </button>
            </div>
          </div>
        )}

        {/* Profile button */}
        <button
          onClick={() => setProfileOpen((prev) => !prev)}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-[var(--radius-lg)] transition-colors ${
            profileOpen
              ? "bg-[var(--surface-elevated)]"
              : "hover:bg-[var(--surface-elevated)]"
          }`}
        >
          {user?.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.displayName}
              className="w-8 h-8 rounded-full object-cover flex-shrink-0"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-[var(--primary-light)] flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-semibold text-[var(--primary)]">
                {initials}
              </span>
            </div>
          )}
          <div className="flex-1 min-w-0 text-left">
            <p className="text-sm font-medium text-[var(--text-primary)] truncate">
              {user?.displayName ?? "—"}
            </p>
            <p className="text-xs text-[var(--text-secondary)] truncate">
              {user?.email ?? "—"}
            </p>
          </div>
          <ChevronDown
            className={`w-4 h-4 text-[var(--text-tertiary)] transition-transform ${profileOpen ? "rotate-180" : ""}`}
          />
        </button>
      </div>

      <LogoutModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleLogoutConfirm}
      />
    </aside>
  );
}

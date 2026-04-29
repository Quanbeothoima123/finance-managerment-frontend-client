import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router";
import {
  Home,
  Receipt,
  Plus,
  PiggyBank,
  MoreHorizontal,
  X,
} from "lucide-react";
import { getSidebarRoutes } from "../routes";
import { Button } from "./Button";
import { useRecurringDueCount } from "../hooks/useRecurringDueCount";
import { useTranslation } from "react-i18next";

interface BottomNavigationProps {
  activePath?: string;
  onNavigate?: (path: string) => void;
}

export function BottomNavigation({
  activePath,
  onNavigate,
}: BottomNavigationProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [showMoreDrawer, setShowMoreDrawer] = useState(false);
  const recurringDueCount = useRecurringDueCount(1);
  const { t } = useTranslation("common");

  const currentPath = activePath || location.pathname;
  const allRoutes = getSidebarRoutes();

  const handleNavigate = (path: string) => {
    if (onNavigate) {
      onNavigate(path);
    } else {
      navigate(path);
    }
    setShowMoreDrawer(false);
  };

  // Primary 5 tabs for bottom nav
  const primaryTabs = [
    { icon: Home, label: t("nav.home"), path: "/home" },
    { icon: Receipt, label: t("nav.transactions"), path: "/transactions" }, // Placeholder - will be implemented
    { icon: Plus, label: t("nav.add"), path: "/add-transaction" }, // Placeholder - will be implemented
    { icon: PiggyBank, label: t("nav.budgets"), path: "/budgets" },
    { icon: MoreHorizontal, label: t("nav.more"), path: "MORE_DRAWER" },
  ];

  // Routes to show in More drawer (excluding primary tabs)
  const primaryPaths = [
    "/home",
    "/transactions",
    "/add-transaction",
    "/budgets",
  ];
  const moreRoutes = allRoutes.filter(
    (route) => !primaryPaths.includes(route.path),
  );

  // Group more routes by category
  const groupedMoreRoutes = {
    accounts: moreRoutes.filter((r) => r.group === "accounts"),
    categories: moreRoutes.filter((r) => r.group === "categories"),
    goals: moreRoutes.filter((r) => r.group === "goals"),
    insights: moreRoutes.filter((r) => r.group === "insights"),
    rules: moreRoutes.filter((r) => r.group === "rules"),
    community: moreRoutes.filter((r) => r.group === "community"),
    settings: moreRoutes.filter((r) => r.group === "settings"),
  };

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 bg-[var(--surface-elevated)] border-t border-[var(--border)] md:hidden safe-area-inset-bottom z-40">
        <div className="flex items-center justify-around px-2 py-2">
          {primaryTabs.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.path === "MORE_DRAWER"
                ? showMoreDrawer
                : currentPath === item.path ||
                  currentPath.startsWith(item.path + "/");

            return (
              <button
                key={item.path}
                onClick={() => {
                  if (item.path === "MORE_DRAWER") {
                    setShowMoreDrawer(!showMoreDrawer);
                  } else {
                    handleNavigate(item.path);
                  }
                }}
                className={`flex flex-col items-center gap-1 px-3 py-2 rounded-[var(--radius-md)] transition-colors ${
                  isActive
                    ? "text-[var(--primary)]"
                    : "text-[var(--text-tertiary)]"
                }`}
              >
                {item.path === "/add-transaction" ? (
                  <div className="w-12 h-12 -mt-6 bg-[var(--primary)] rounded-full flex items-center justify-center shadow-lg">
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                ) : (
                  <Icon className="w-6 h-6" />
                )}
                {item.path !== "/add-transaction" && (
                  <span className="text-xs font-medium">{item.label}</span>
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* More Drawer */}
      {showMoreDrawer && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 z-50 md:hidden"
            onClick={() => setShowMoreDrawer(false)}
          />

          {/* Drawer */}
          <div className="fixed bottom-0 left-0 right-0 bg-[var(--card)] rounded-t-[var(--radius-xl)] z-50 md:hidden max-h-[70vh] overflow-y-auto safe-area-inset-bottom animate-in slide-in-from-bottom duration-300">
            <div className="sticky top-0 bg-[var(--card)] border-b border-[var(--border)] px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                {t("nav.more")}
              </h3>
              <button
                onClick={() => setShowMoreDrawer(false)}
                className="p-2 hover:bg-[var(--surface)] rounded-[var(--radius-md)] transition-colors"
              >
                <X className="w-5 h-5 text-[var(--text-secondary)]" />
              </button>
            </div>

            <div className="px-6 py-4 space-y-6">
              {/* Accounts */}
              {groupedMoreRoutes.accounts.length > 0 && (
                <div>
                  <div className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-3">
                    {t("sidebar.sections.accounts")}
                  </div>
                  <div className="space-y-2">
                    {groupedMoreRoutes.accounts.map((route) => {
                      const Icon = route.icon;
                      return (
                        <button
                          key={route.path}
                          onClick={() => handleNavigate(route.path)}
                          className="w-full flex items-center gap-3 px-4 py-3 rounded-[var(--radius-lg)] hover:bg-[var(--surface)] transition-colors text-left"
                        >
                          {Icon && (
                            <Icon className="w-5 h-5 text-[var(--text-secondary)]" />
                          )}
                          <span className="font-medium text-[var(--text-primary)]">
                            {route.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Categories */}
              {groupedMoreRoutes.categories.length > 0 && (
                <div>
                  <div className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-3">
                    {t("sidebar.sections.categories")}
                  </div>
                  <div className="space-y-2">
                    {groupedMoreRoutes.categories.map((route) => {
                      const Icon = route.icon;
                      return (
                        <button
                          key={route.path}
                          onClick={() => handleNavigate(route.path)}
                          className="w-full flex items-center gap-3 px-4 py-3 rounded-[var(--radius-lg)] hover:bg-[var(--surface)] transition-colors text-left"
                        >
                          {Icon && (
                            <Icon className="w-5 h-5 text-[var(--text-secondary)]" />
                          )}
                          <span className="font-medium text-[var(--text-primary)]">
                            {route.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Goals */}
              {groupedMoreRoutes.goals.length > 0 && (
                <div>
                  <div className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-3">
                    {t("sidebar.sections.goals")}
                  </div>
                  <div className="space-y-2">
                    {groupedMoreRoutes.goals.map((route) => {
                      const Icon = route.icon;
                      return (
                        <button
                          key={route.path}
                          onClick={() => handleNavigate(route.path)}
                          className="w-full flex items-center gap-3 px-4 py-3 rounded-[var(--radius-lg)] hover:bg-[var(--surface)] transition-colors text-left"
                        >
                          {Icon && (
                            <Icon className="w-5 h-5 text-[var(--text-secondary)]" />
                          )}
                          <span className="font-medium text-[var(--text-primary)]">
                            {route.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Insights */}
              {groupedMoreRoutes.insights.length > 0 && (
                <div>
                  <div className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-3">
                    {t("sidebar.sections.insights")}
                  </div>
                  <div className="space-y-2">
                    {groupedMoreRoutes.insights.map((route) => {
                      const Icon = route.icon;
                      return (
                        <button
                          key={route.path}
                          onClick={() => handleNavigate(route.path)}
                          className="w-full flex items-center gap-3 px-4 py-3 rounded-[var(--radius-lg)] hover:bg-[var(--surface)] transition-colors text-left"
                        >
                          {Icon && (
                            <Icon className="w-5 h-5 text-[var(--text-secondary)]" />
                          )}
                          <span className="font-medium text-[var(--text-primary)]">
                            {route.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Rules */}
              {groupedMoreRoutes.rules.length > 0 && (
                <div>
                  <div className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-3">
                    {t("sidebar.sections.automation")}
                  </div>
                  <div className="space-y-2">
                    {groupedMoreRoutes.rules.map((route) => {
                      const Icon = route.icon;
                      const showBadge =
                        route.path === "/rules/recurring" &&
                        recurringDueCount > 0;
                      return (
                        <button
                          key={route.path}
                          onClick={() => handleNavigate(route.path)}
                          className="w-full flex items-center gap-3 px-4 py-3 rounded-[var(--radius-lg)] hover:bg-[var(--surface)] transition-colors text-left"
                        >
                          {Icon && (
                            <Icon className="w-5 h-5 text-[var(--text-secondary)]" />
                          )}
                          <span className="font-medium text-[var(--text-primary)] flex-1">
                            {route.label}
                          </span>
                          {showBadge && (
                            <span className="flex-shrink-0 min-w-[20px] h-5 px-1.5 rounded-full bg-[var(--danger)] text-white text-xs font-bold flex items-center justify-center">
                              {recurringDueCount}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Community */}
              {groupedMoreRoutes.community.length > 0 && (
                <div>
                  <div className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-3">
                    {t("sidebar.sections.community")}
                  </div>
                  <div className="space-y-2">
                    {groupedMoreRoutes.community.map((route) => {
                      const Icon = route.icon;
                      return (
                        <button
                          key={route.path}
                          onClick={() => handleNavigate(route.path)}
                          className="w-full flex items-center gap-3 px-4 py-3 rounded-[var(--radius-lg)] hover:bg-[var(--surface)] transition-colors text-left"
                        >
                          {Icon && (
                            <Icon className="w-5 h-5 text-[var(--text-secondary)]" />
                          )}
                          <span className="font-medium text-[var(--text-primary)]">
                            {route.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Settings */}
              {groupedMoreRoutes.settings.length > 0 && (
                <div>
                  <div className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-3">
                    {t("sidebar.sections.settings")}
                  </div>
                  <div className="space-y-2">
                    {groupedMoreRoutes.settings.map((route) => {
                      const Icon = route.icon;
                      return (
                        <button
                          key={route.path}
                          onClick={() => handleNavigate(route.path)}
                          className="w-full flex items-center gap-3 px-4 py-3 rounded-[var(--radius-lg)] hover:bg-[var(--surface)] transition-colors text-left"
                        >
                          {Icon && (
                            <Icon className="w-5 h-5 text-[var(--text-secondary)]" />
                          )}
                          <span className="font-medium text-[var(--text-primary)]">
                            {route.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Safe area padding for bottom */}
            <div className="h-6" />
          </div>
        </>
      )}
    </>
  );
}

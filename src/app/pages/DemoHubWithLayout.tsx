import React from 'react';
import { useNavigate } from 'react-router';
import { Layout } from '../components/Layout';
import { Button } from '../components/Button';
import { routeConfigs, RouteGroup } from '../routes';
import {
  Home,
  Wallet,
  Folder,
  PiggyBank,
  Target,
  BarChart3,
  Zap,
  Settings,
  Eye,
  Rocket,
  Inbox,
} from 'lucide-react';

export default function DemoHubWithLayout() {
  const navigate = useNavigate();

  // Group routes by their group property
  const groupedRoutes = {
    onboarding: routeConfigs.filter(r => r.group === 'onboarding'),
    core: routeConfigs.filter(r => r.group === 'core'),
    accounts: routeConfigs.filter(r => r.group === 'accounts'),
    categories: routeConfigs.filter(r => r.group === 'categories'),
    budgets: routeConfigs.filter(r => r.group === 'budgets'),
    goals: routeConfigs.filter(r => r.group === 'goals'),
    insights: routeConfigs.filter(r => r.group === 'insights'),
    rules: routeConfigs.filter(r => r.group === 'rules'),
    settings: routeConfigs.filter(r => r.group === 'settings'),
    showcase: routeConfigs.filter(r => r.group === 'showcase'),
  };

  const groupMetadata: Record<RouteGroup, { label: string; icon: any; color: string }> = {
    onboarding: { label: 'Onboarding', icon: Rocket, color: 'text-purple-500' },
    core: { label: 'Core Screens', icon: Home, color: 'text-blue-500' },
    accounts: { label: 'Accounts', icon: Wallet, color: 'text-green-500' },
    categories: { label: 'Categories & Tags', icon: Folder, color: 'text-yellow-500' },
    budgets: { label: 'Budgets', icon: PiggyBank, color: 'text-pink-500' },
    goals: { label: 'Goals', icon: Target, color: 'text-indigo-500' },
    insights: { label: 'Insights & Reports', icon: BarChart3, color: 'text-cyan-500' },
    rules: { label: 'Rules & Automation', icon: Zap, color: 'text-orange-500' },
    settings: { label: 'Settings & Other', icon: Settings, color: 'text-gray-500' },
    showcase: { label: 'Showcase Pages', icon: Eye, color: 'text-violet-500' },
  };

  const renderGroup = (group: RouteGroup, routes: typeof routeConfigs) => {
    if (routes.length === 0) return null;

    const meta = groupMetadata[group];
    const Icon = meta.icon;

    return (
      <div key={group} className="bg-[var(--card)] rounded-[var(--radius-xl)] border border-[var(--border)] overflow-hidden">
        {/* Group Header */}
        <div className="px-6 py-4 bg-[var(--surface)] border-b border-[var(--border)] flex items-center gap-3">
          <div className={`p-2 rounded-[var(--radius-md)] bg-[var(--surface-elevated)] ${meta.color}`}>
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-[var(--text-primary)]">{meta.label}</h3>
            <p className="text-xs text-[var(--text-tertiary)]">{routes.length} screens</p>
          </div>
        </div>

        {/* Routes Grid */}
        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {routes.map(route => {
            const RouteIcon = route.icon;
            return (
              <Button
                key={route.path}
                onClick={() => navigate(route.path)}
                variant="secondary"
                className="justify-start text-left h-auto py-3"
              >
                {RouteIcon && <RouteIcon className="w-4 h-4 flex-shrink-0" />}
                <span className="truncate flex-1">{route.label}</span>
              </Button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <Layout title="Demo Hub - QA Testing">
      <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-br from-[var(--primary-light)] to-[var(--success-light)] rounded-[var(--radius-xl)] p-6 md:p-8 border border-[var(--border)]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)] mb-2">
                Demo Hub
              </h1>
              <p className="text-[var(--text-secondary)] max-w-2xl">
                Quick access to all screens for QA testing. Click any button below to navigate to that screen.
                All routes are organized by feature group.
              </p>
            </div>
            <div className="hidden md:block p-4 bg-[var(--card)] rounded-[var(--radius-lg)] border border-[var(--border)]">
              <div className="text-center">
                <div className="text-3xl font-bold text-[var(--primary)]">
                  {routeConfigs.length}
                </div>
                <div className="text-xs text-[var(--text-tertiary)]">Total Routes</div>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-[var(--card)] rounded-[var(--radius-lg)] p-4 border border-[var(--border)]">
              <div className="text-2xl font-bold text-[var(--text-primary)]">
                {groupedRoutes.core.length + groupedRoutes.accounts.length + groupedRoutes.categories.length}
              </div>
              <div className="text-xs text-[var(--text-tertiary)]">Core Screens</div>
            </div>
            <div className="bg-[var(--card)] rounded-[var(--radius-lg)] p-4 border border-[var(--border)]">
              <div className="text-2xl font-bold text-[var(--text-primary)]">
                {groupedRoutes.budgets.length + groupedRoutes.goals.length}
              </div>
              <div className="text-xs text-[var(--text-tertiary)]">Planning</div>
            </div>
            <div className="bg-[var(--card)] rounded-[var(--radius-lg)] p-4 border border-[var(--border)]">
              <div className="text-2xl font-bold text-[var(--text-primary)]">
                {groupedRoutes.insights.length + groupedRoutes.rules.length}
              </div>
              <div className="text-xs text-[var(--text-tertiary)]">Analysis</div>
            </div>
            <div className="bg-[var(--card)] rounded-[var(--radius-lg)] p-4 border border-[var(--border)]">
              <div className="text-2xl font-bold text-[var(--text-primary)]">
                {groupedRoutes.settings.length}
              </div>
              <div className="text-xs text-[var(--text-tertiary)]">Settings</div>
            </div>
          </div>
        </div>

        {/* Groups */}
        <div className="space-y-6">
          {/* Special Demo Previews Section */}
          <div className="bg-[var(--card)] rounded-[var(--radius-xl)] border border-[var(--border)] overflow-hidden">
            <div className="px-6 py-4 bg-[var(--surface)] border-b border-[var(--border)] flex items-center gap-3">
              <div className="p-2 rounded-[var(--radius-md)] bg-[var(--surface-elevated)] text-emerald-500">
                <Inbox className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-[var(--text-primary)]">Demo Previews</h3>
                <p className="text-xs text-[var(--text-tertiary)]">Preview special UI states without modifying data</p>
              </div>
            </div>
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <Button
                onClick={() => navigate('/demo/empty-home')}
                variant="secondary"
                className="justify-start text-left h-auto py-3"
              >
                <Rocket className="w-4 h-4 flex-shrink-0" />
                <span className="truncate flex-1">Preview Empty Home</span>
              </Button>
            </div>
          </div>

          {(Object.keys(groupedRoutes) as RouteGroup[]).map(group =>
            renderGroup(group, groupedRoutes[group])
          )}
        </div>

        {/* Footer */}
        <div className="bg-[var(--info-light)] border border-[var(--info)] rounded-[var(--radius-lg)] p-6">
          <h3 className="font-semibold text-[var(--text-primary)] mb-2">Testing Tips</h3>
          <ul className="text-sm text-[var(--text-secondary)] space-y-1">
            <li>• All routes use React Router (no page reloads)</li>
            <li>• Active states are automatically highlighted in sidebar/bottom nav</li>
            <li>• Test responsive behavior by resizing your browser</li>
            <li>• Mobile bottom nav "Thêm" (More) button opens a drawer with all routes</li>
            <li>• Theme toggle works globally and persists in localStorage</li>
            <li>• All cards and lists have click handlers that navigate to detail pages</li>
          </ul>
        </div>
      </div>
    </Layout>
  );
}
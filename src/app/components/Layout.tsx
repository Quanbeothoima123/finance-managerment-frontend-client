import React, { useState } from 'react';
import { useLocation } from 'react-router';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { BottomNavigation } from './BottomNavigation';
import { PageTransition } from './PageTransition';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { useAutoRecurringNotifications } from '../hooks/useAutoRecurringNotifications';
import { useAutoBudgetNotifications } from '../hooks/useAutoBudgetNotifications';

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
}

export function Layout({ children, title }: LayoutProps) {
  const location = useLocation();
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  useKeyboardShortcuts();
  useAutoRecurringNotifications();
  useAutoBudgetNotifications();

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--background)]">
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <Sidebar />
      </div>

      {/* Mobile Sidebar Overlay */}
      {showMobileSidebar && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={() => setShowMobileSidebar(false)}
          />
          <div className="fixed left-0 top-0 bottom-0 z-50 md:hidden">
            <Sidebar />
          </div>
        </>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <Topbar 
          title={title} 
          onMenuClick={() => setShowMobileSidebar(true)}
        />

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
          <PageTransition>
            {children}
          </PageTransition>
        </main>

        {/* Mobile Bottom Navigation */}
        <BottomNavigation />
      </div>
    </div>
  );
}
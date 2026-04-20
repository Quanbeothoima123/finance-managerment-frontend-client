import React from "react";
import { RouterProvider } from "react-router";

import { ThemeProvider } from "./contexts/ThemeContext";
import { AuthProvider } from "./contexts/AuthContext";
import { ToastProvider } from "./contexts/ToastContext";
import { NotificationProvider } from "./contexts/NotificationContext";
import { SocialDataProvider } from "./contexts/SocialDataContext";
import { AppDataProvider } from "./contexts/AppDataContext";

import { router } from "./routes";

/**
 * Root of the application.
 *
 * Provider order (outer → inner):
 *   Theme          — only sets <html> class; must be outermost so classes
 *                    exist before any child paints.
 *   Auth           — user/session; most other providers may read from it.
 *   Toast          — UI infra; anyone below can trigger toasts.
 *   Notification   — in-app notifications.
 *   SocialData     — community/social state.
 *   AppData        — local app state layer (was misnamed DemoData).
 *   Router         — innermost so every route has access to all providers.
 *
 * NOTE: I18nProvider will slot in between SocialDataProvider and
 * AppDataProvider when the i18n infrastructure lands (see UPGRADE_PLAN §3).
 */
export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <NotificationProvider>
            <SocialDataProvider>
              <AppDataProvider>
                <RouterProvider router={router} />
              </AppDataProvider>
            </SocialDataProvider>
          </NotificationProvider>
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

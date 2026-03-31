import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  ReactNode,
} from "react";

// ============================================================================
// TYPES
// ============================================================================

export type NotificationType =
  | "recurring-due"
  | "budget-alert"
  | "goal-reminder"
  | "goal-withdrawal-alert";

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  subtitle: string;
  read: boolean;
  createdAt: string; // ISO date-time
  // Recurring-due specific
  recurringRuleId?: string;
  amount?: number;
  accountName?: string;
  // Budget-alert specific
  budgetId?: string;
  percentUsed?: number;
  remaining?: number;
  // Goal-reminder specific
  goalId?: string;
  targetAmount?: number;
  percentAchieved?: number;
}

export interface NotificationSettings {
  recurringReminders: boolean;
  budgetAlerts: boolean;
  goalReminders: boolean;
  weeklyRecap: boolean; // always disabled — coming soon
  quietHoursEnabled: boolean;
  quietHoursFrom: string; // "HH:mm"
  quietHoursTo: string; // "HH:mm"
  soundEnabled: boolean;
  vibrationEnabled: boolean;
}

interface NotificationContextType {
  notifications: AppNotification[];
  settings: NotificationSettings;
  unreadCount: number;
  addNotification: (
    n: Omit<AppNotification, "id" | "read" | "createdAt">,
  ) => AppNotification;
  markAsRead: (id: string) => void;
  markAsReadMultiple: (ids: string[]) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  removeNotifications: (ids: string[]) => void;
  clearAllRead: () => void;
  updateSettings: (patch: Partial<NotificationSettings>) => void;
}

// ============================================================================
// DEFAULTS
// ============================================================================

const DEFAULT_SETTINGS: NotificationSettings = {
  recurringReminders: true,
  budgetAlerts: true,
  goalReminders: true,
  weeklyRecap: false,
  quietHoursEnabled: false,
  quietHoursFrom: "22:00",
  quietHoursTo: "07:00",
  soundEnabled: true,
  vibrationEnabled: true,
};

// ============================================================================
// STORAGE
// ============================================================================

const STORAGE_KEY_NOTIFS = "finance-notifications";
const STORAGE_KEY_SETTINGS = "finance-notification-settings";

// ============================================================================
// CONTEXT
// ============================================================================

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined,
);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_NOTIFS);
      if (stored) return JSON.parse(stored);
    } catch {}
    return [];
  });

  const [settings, setSettings] = useState<NotificationSettings>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_SETTINGS);
      if (stored) return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
    } catch {}
    return DEFAULT_SETTINGS;
  });

  // Persist
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_NOTIFS, JSON.stringify(notifications));
    } catch {}
  }, [notifications]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
    } catch {}
  }, [settings]);

  // Unread count
  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications],
  );

  const addNotification = useCallback(
    (
      n: Omit<AppNotification, "id" | "read" | "createdAt">,
    ): AppNotification => {
      const newNotif: AppNotification = {
        ...n,
        id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        read: false,
        createdAt: new Date().toISOString(),
      };
      setNotifications((prev) => [newNotif, ...prev]);
      return newNotif;
    },
    [],
  );

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
  }, []);

  const markAsReadMultiple = useCallback((ids: string[]) => {
    setNotifications((prev) =>
      prev.map((n) => (ids.includes(n.id) ? { ...n, read: true } : n)),
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const removeNotifications = useCallback((ids: string[]) => {
    setNotifications((prev) => prev.filter((n) => !ids.includes(n.id)));
  }, []);

  const clearAllRead = useCallback(() => {
    setNotifications((prev) => prev.filter((n) => !n.read));
  }, []);

  const updateSettings = useCallback((patch: Partial<NotificationSettings>) => {
    setSettings((prev) => ({ ...prev, ...patch }));
  }, []);

  const value: NotificationContextType = {
    notifications,
    settings,
    unreadCount,
    addNotification,
    markAsRead,
    markAsReadMultiple,
    markAllAsRead,
    removeNotification,
    removeNotifications,
    clearAllRead,
    updateSettings,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotifications must be used within NotificationProvider",
    );
  }
  return context;
}

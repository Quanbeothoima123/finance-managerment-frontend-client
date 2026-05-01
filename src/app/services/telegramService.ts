import { apiRequest } from "./apiClient";

export interface TelegramNotificationSettings {
  notifyRecurringDue: boolean;
  notifyTransactionAdded: boolean;
  notifyBudgetAlert: boolean;
  notifyGoalMilestone: boolean;
  notifyGoalReminder: boolean;
  notifyWeeklyRecap: boolean;
  notifyGeneral: boolean;
}

export interface TelegramStatus {
  /** null = chưa kết nối Telegram, truthy = đã kết nối */
  telegramChatId: string | null;
  telegramEnabled: boolean;
  telegramLinkedAt: string | null;
  /** null khi chưa kết nối (telegramChatId == null), object khi đã kết nối */
  settings: TelegramNotificationSettings | null;
}

export interface TelegramConnectLink {
  connectUrl: string;
  botUrl: string;
  botUsername: string;
  expiresIn: string;
}

export const telegramService = {
  getStatus() {
    return apiRequest<TelegramStatus>("/telegram/status", {
      method: "GET",
      requiresAuth: true,
    });
  },

  getConnectLink() {
    return apiRequest<TelegramConnectLink>("/telegram/connect-link", {
      method: "GET",
      requiresAuth: true,
    });
  },

  unlink() {
    return apiRequest<null>("/telegram/unlink", {
      method: "DELETE",
      requiresAuth: true,
    });
  },

  toggle(enabled: boolean) {
    return apiRequest<null>("/telegram/toggle", {
      method: "PATCH",
      requiresAuth: true,
      body: { enabled },
    });
  },

  getSettings() {
    return apiRequest<TelegramNotificationSettings>("/telegram/settings", {
      method: "GET",
      requiresAuth: true,
    });
  },

  updateSettings(settings: Partial<TelegramNotificationSettings>) {
    return apiRequest<TelegramNotificationSettings>("/telegram/settings", {
      method: "PUT",
      requiresAuth: true,
      body: settings,
    });
  },
};

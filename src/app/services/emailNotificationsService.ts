import { apiRequest } from "./apiClient";

export interface EmailNotificationPreferences {
  notifyRecurringDue: boolean;
  notifyTransactionAdded: boolean;
  notifyBudgetAlert: boolean;
  notifyGoalMilestone: boolean;
  notifyGoalReminder: boolean;
  notifyWeeklyRecap: boolean;
  notifyGeneral: boolean;
}

export interface EmailNotificationSettings {
  email: string;
  settings: EmailNotificationPreferences & {
    id: string;
    userId: string;
    createdAt: string;
    updatedAt: string;
  };
}

export const emailNotificationsService = {
  getSettings() {
    return apiRequest<EmailNotificationSettings>(
      "/email-notifications/settings",
      {
        method: "GET",
        requiresAuth: true,
      },
    );
  },

  updateSettings(settings: Partial<EmailNotificationPreferences>) {
    return apiRequest<EmailNotificationSettings>(
      "/email-notifications/settings",
      {
        method: "PUT",
        requiresAuth: true,
        body: settings,
      },
    );
  },
};

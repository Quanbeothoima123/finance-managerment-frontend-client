import { apiRequest } from "./apiClient";
import type {
  NotificationsListQuery,
  NotificationsListResponse,
} from "../types/community";

function buildQueryString(query: Record<string, unknown> = {}) {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    params.set(key, String(value));
  });
  const serialized = params.toString();
  return serialized ? `?${serialized}` : "";
}

export const socialNotificationsService = {
  listNotifications(query: NotificationsListQuery = {}) {
    return apiRequest<NotificationsListResponse>(
      `/community/notifications${buildQueryString({ ...query })}`,
      { method: "GET", requiresAuth: true },
    );
  },

  getUnreadCount() {
    return apiRequest<{ count: number }>(
      "/community/notifications/unread-count",
      { method: "GET", requiresAuth: true },
    );
  },

  markAsRead(notificationId: string) {
    return apiRequest<{ read: boolean }>(
      `/community/notifications/${notificationId}/read`,
      { method: "PATCH", requiresAuth: true },
    );
  },

  markAllAsRead() {
    return apiRequest<{ read: boolean }>("/community/notifications/read-all", {
      method: "PATCH",
      requiresAuth: true,
    });
  },
};

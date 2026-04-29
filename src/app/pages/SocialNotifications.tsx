import React, { useCallback } from "react";
import { useNavigate } from "react-router";
import {
  ChevronLeft,
  Heart,
  MessageCircle,
  Reply,
  UserPlus,
  Trophy,
  CheckCheck,
  Bell,
} from "lucide-react";
import { useSocialNotifications } from "../hooks/useSocialNotifications";
import { useSocialUnreadCount } from "../hooks/useSocialUnreadCount";
import { socialNotificationsService } from "../services/socialNotificationsService";
import { SocialEmptyState } from "../components/social/SocialEmptyState";
import { PostSkeleton } from "../components/social/PostSkeleton";
import type { SocialNotification } from "../types/community";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";

function formatTimeAgo(dateStr: string, t: TFunction): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diff = now.getTime() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return t("social_notifications.time_ago.minutes", { n: mins });
  const hours = Math.floor(mins / 60);
  if (hours < 24) return t("social_notifications.time_ago.hours", { n: hours });
  const days = Math.floor(hours / 24);
  return t("social_notifications.time_ago.days", { n: days });
}

type GroupKey = "today" | "yesterday" | "earlier";

function groupByDate(
  items: SocialNotification[],
): Record<GroupKey, SocialNotification[]> {
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  const groups: Record<GroupKey, SocialNotification[]> = {
    today: [],
    yesterday: [],
    earlier: [],
  };

  items.forEach((item) => {
    const d = new Date(item.createdAt);
    if (d.toDateString() === today.toDateString()) groups.today.push(item);
    else if (d.toDateString() === yesterday.toDateString())
      groups.yesterday.push(item);
    else groups.earlier.push(item);
  });

  return groups;
}

const typeConfig: Record<string, { icon: React.ReactNode; color: string }> = {
  like: {
    icon: <Heart className="w-4 h-4" />,
    color: "bg-[var(--danger-light)] text-[var(--danger)]",
  },
  comment: {
    icon: <MessageCircle className="w-4 h-4" />,
    color: "bg-[var(--primary-light)] text-[var(--primary)]",
  },
  reply: {
    icon: <Reply className="w-4 h-4" />,
    color: "bg-[var(--info-light)] text-[var(--info)]",
  },
  follow: {
    icon: <UserPlus className="w-4 h-4" />,
    color: "bg-[var(--success-light)] text-[var(--success)]",
  },
  mention: {
    icon: <MessageCircle className="w-4 h-4" />,
    color: "bg-[var(--warning-light)] text-[var(--warning)]",
  },
};

export default function SocialNotifications() {
  const navigate = useNavigate();
  const { t } = useTranslation("community");
  const { data: notifData, loading, reload } = useSocialNotifications();
  const { count: unreadCount, reload: reloadCount } = useSocialUnreadCount();

  const notifications = notifData?.items || [];
  const grouped = groupByDate(notifications);

  const handleMarkAllRead = useCallback(async () => {
    try {
      await socialNotificationsService.markAllAsRead();
      reload();
      reloadCount();
    } catch {
      /* ignore */
    }
  }, [reload, reloadCount]);

  const handleNotificationClick = useCallback(
    async (notif: SocialNotification) => {
      if (!notif.isRead) {
        try {
          await socialNotificationsService.markAsRead(notif.id);
        } catch {
          /* ignore */
        }
      }
      if (notif.postId) navigate(`/community/post/${notif.postId}`);
      else navigate(`/community/profile/${notif.actor.id}`);
    },
    [navigate],
  );

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="max-w-2xl mx-auto">
        <div className="sticky top-0 z-20 bg-[var(--background)]/95 backdrop-blur-sm border-b border-[var(--border)] px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-xl hover:bg-[var(--surface)] text-[var(--text-secondary)]"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h1 className="font-semibold text-[var(--text-primary)]">
              {t("social_notifications.title")}
            </h1>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-[var(--danger)] text-white text-[10px] font-bold tabular-nums">
                {unreadCount}
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="flex items-center gap-1.5 text-xs font-medium text-[var(--primary)]"
            >
              <CheckCheck className="w-4 h-4" />
              {t("social_notifications.mark_all_read")}
            </button>
          )}
        </div>

        <div className="pb-24">
          {loading ? (
            <div className="px-4 py-4">
              <PostSkeleton />
              <PostSkeleton />
            </div>
          ) : notifications.length === 0 ? (
            <SocialEmptyState
              icon={<Bell className="w-8 h-8" />}
              title={t("social_notifications.empty.title")}
              description={t("social_notifications.empty.description")}
            />
          ) : (
            Object.entries(grouped).map(([key, items]) => {
              if (items.length === 0) return null;
              const label = t(`social_notifications.groups.${key}`);
              return (
                <div key={key}>
                  <div className="px-4 py-2 bg-[var(--surface)]">
                    <p className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">
                      {label}
                    </p>
                  </div>
                  <div className="divide-y divide-[var(--divider)]">
                    {items.map((notif) => {
                      const actor = notif.actor;
                      const config = typeConfig[notif.type] || typeConfig.like;
                      return (
                        <button
                          key={notif.id}
                          onClick={() => handleNotificationClick(notif)}
                          className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-[var(--surface)] ${
                            !notif.isRead ? "bg-[var(--primary-light)]/30" : ""
                          }`}
                        >
                          <div className="relative flex-shrink-0">
                            <img
                              src={actor.avatarUrl || ""}
                              alt=""
                              className="w-10 h-10 rounded-full object-cover"
                            />
                            <div
                              className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center ${config.color}`}
                            >
                              {config.icon}
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-[var(--text-primary)]">
                              <span className="font-semibold">
                                {actor.displayName || actor.username}
                              </span>{" "}
                              <span className="text-[var(--text-secondary)]">
                                {notif.message}
                              </span>
                            </p>
                            <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
                              {formatTimeAgo(notif.createdAt, t)}
                            </p>
                          </div>
                          {!notif.isRead && (
                            <div className="w-2.5 h-2.5 rounded-full bg-[var(--primary)] flex-shrink-0 mt-1.5" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

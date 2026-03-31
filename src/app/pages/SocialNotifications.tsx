import React from 'react';
import { useNavigate } from 'react-router';
import { ChevronLeft, Heart, MessageCircle, Reply, UserPlus, Trophy, CheckCheck, Bell } from 'lucide-react';
import { useSocialData } from '../contexts/SocialDataContext';
import { SocialEmptyState } from '../components/social/SocialEmptyState';

function formatTimeAgo(dateStr: string): string {
  const now = new Date('2026-03-17T12:00:00');
  const date = new Date(dateStr);
  const diff = now.getTime() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins} phút trước`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  return `${days} ngày trước`;
}

function groupByDate(items: { createdAt: string }[]) {
  const today = new Date('2026-03-17');
  const yesterday = new Date('2026-03-16');
  const groups: Record<string, typeof items> = { 'Hôm nay': [], 'Hôm qua': [], 'Trước đó': [] };

  items.forEach(item => {
    const d = new Date(item.createdAt);
    if (d.toDateString() === today.toDateString()) groups['Hôm nay'].push(item);
    else if (d.toDateString() === yesterday.toDateString()) groups['Hôm qua'].push(item);
    else groups['Trước đó'].push(item);
  });

  return groups;
}

const typeConfig: Record<string, { icon: React.ReactNode; color: string }> = {
  like: { icon: <Heart className="w-4 h-4" />, color: 'bg-[var(--danger-light)] text-[var(--danger)]' },
  comment: { icon: <MessageCircle className="w-4 h-4" />, color: 'bg-[var(--primary-light)] text-[var(--primary)]' },
  reply: { icon: <Reply className="w-4 h-4" />, color: 'bg-[var(--info-light)] text-[var(--info)]' },
  follow: { icon: <UserPlus className="w-4 h-4" />, color: 'bg-[var(--success-light)] text-[var(--success)]' },
  challenge: { icon: <Trophy className="w-4 h-4" />, color: 'bg-[var(--warning-light)] text-[var(--warning)]' },
};

export default function SocialNotifications() {
  const navigate = useNavigate();
  const { notifications, getUserById, markNotificationRead, markAllNotificationsRead, unreadNotificationsCount } = useSocialData();

  const grouped = groupByDate(notifications);

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="max-w-2xl mx-auto">
        <div className="sticky top-0 z-20 bg-[var(--background)]/95 backdrop-blur-sm border-b border-[var(--border)] px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-[var(--surface)] text-[var(--text-secondary)]">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h1 className="font-semibold text-[var(--text-primary)]">Thông báo</h1>
            {unreadNotificationsCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-[var(--danger)] text-white text-[10px] font-bold tabular-nums">
                {unreadNotificationsCount}
              </span>
            )}
          </div>
          {unreadNotificationsCount > 0 && (
            <button onClick={markAllNotificationsRead} className="flex items-center gap-1.5 text-xs font-medium text-[var(--primary)]">
              <CheckCheck className="w-4 h-4" />
              Đọc tất cả
            </button>
          )}
        </div>

        <div className="pb-24">
          {notifications.length === 0 ? (
            <SocialEmptyState
              icon={<Bell className="w-8 h-8" />}
              title="Chưa có thông báo"
              description="Khi có người tương tác với bài viết của bạn, thông báo sẽ xuất hiện ở đây."
            />
          ) : (
            Object.entries(grouped).map(([label, items]) => {
              if (items.length === 0) return null;
              return (
                <div key={label}>
                  <div className="px-4 py-2 bg-[var(--surface)]">
                    <p className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">{label}</p>
                  </div>
                  <div className="divide-y divide-[var(--divider)]">
                    {items.map(notif => {
                      const user = getUserById(notif.userId);
                      const config = typeConfig[notif.type];
                      return (
                        <button
                          key={notif.id}
                          onClick={() => {
                            markNotificationRead(notif.id);
                            if (notif.postId) navigate(`/community/post/${notif.postId}`);
                            else navigate(`/community/profile/${notif.userId}`);
                          }}
                          className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-[var(--surface)] ${
                            !notif.isRead ? 'bg-[var(--primary-light)]/30' : ''
                          }`}
                        >
                          <div className="relative flex-shrink-0">
                            <img src={user?.avatar} alt="" className="w-10 h-10 rounded-full object-cover" />
                            <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center ${config.color}`}>
                              {config.icon}
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-[var(--text-primary)]">
                              <span className="font-semibold">{user?.displayName}</span>{' '}
                              <span className="text-[var(--text-secondary)]">{notif.message}</span>
                            </p>
                            <p className="text-xs text-[var(--text-tertiary)] mt-0.5">{formatTimeAgo(notif.createdAt)}</p>
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

import React from "react";
import { CheckCircle, Award, Shield } from "lucide-react";
import type { SocialBadge } from "../../types/community";

/** Minimal user shape accepted by ProfileRow – both SocialProfile and FollowProfile satisfy it. */
export interface ProfileRowUser {
  id: string;
  displayName: string | null;
  username: string;
  avatarUrl: string | null;
  badge: SocialBadge | null;
  bio?: string | null;
}

interface ProfileRowProps {
  user: ProfileRowUser;
  isFollowing?: boolean;
  isMe?: boolean;
  onFollow?: () => void;
  onClick?: () => void;
  showBio?: boolean;
  showFollowButton?: boolean;
}

function BadgeIcon({ badge }: { badge?: string }) {
  if (!badge) return null;
  const map: Record<string, { icon: React.ReactNode; color: string }> = {
    verified: {
      icon: <CheckCircle className="w-3.5 h-3.5" />,
      color: "text-[var(--primary)]",
    },
    expert: {
      icon: <Award className="w-3.5 h-3.5" />,
      color: "text-[var(--warning)]",
    },
    mentor: {
      icon: <Shield className="w-3.5 h-3.5" />,
      color: "text-[var(--success)]",
    },
  };
  const b = map[badge];
  if (!b) return null;
  return <span className={`inline-flex ${b.color}`}>{b.icon}</span>;
}

export function ProfileRow({
  user,
  isFollowing = false,
  isMe = false,
  onFollow,
  onClick,
  showBio = true,
  showFollowButton = true,
}: ProfileRowProps) {
  return (
    <div className="flex items-center gap-3 py-3">
      <button onClick={onClick} className="flex-shrink-0">
        <img
          src={user.avatarUrl || ""}
          alt={user.displayName || ""}
          className="w-11 h-11 rounded-full object-cover"
        />
      </button>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <button
            onClick={onClick}
            className="font-semibold text-sm text-[var(--text-primary)] hover:underline truncate"
          >
            {user.displayName || user.username}
          </button>
          <BadgeIcon badge={user.badge ?? undefined} />
        </div>
        <p className="text-xs text-[var(--text-tertiary)]">@{user.username}</p>
        {showBio && user.bio && (
          <p className="text-xs text-[var(--text-secondary)] mt-0.5 line-clamp-1">
            {user.bio}
          </p>
        )}
      </div>
      {showFollowButton && !isMe && (
        <button
          onClick={onFollow}
          className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold transition-colors ${
            isFollowing
              ? "bg-[var(--surface)] text-[var(--text-secondary)] hover:bg-[var(--danger-light)] hover:text-[var(--danger)]"
              : "bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)]"
          }`}
        >
          {isFollowing ? "Đang theo dõi" : "Theo dõi"}
        </button>
      )}
    </div>
  );
}

import React, { useState } from "react";
import {
  Heart,
  MessageCircle,
  Bookmark,
  Share2,
  MoreHorizontal,
  Award,
  CheckCircle,
  Shield,
  Flag,
  EyeOff,
  Ban,
  Trash2,
} from "lucide-react";
import type { CommunityPost } from "../../types/community";
import { communityInteractionsService } from "../../services/communityInteractionsService";
import { communityPostsService } from "../../services/communityPostsService";
import { socialFollowsService } from "../../services/socialFollowsService";
import { FinanceRecapCard } from "./FinanceRecapCard";
import { TopicChip } from "./TopicChip";
import { AudienceBadge } from "./AudienceBadge";
import {
  BottomSheetActions,
  type BottomSheetAction,
} from "./BottomSheetActions";
import { useToast } from "../../contexts/ToastContext";

interface PostCardProps {
  post: CommunityPost;
  myProfileId?: string;
  onPostClick?: (postId: string) => void;
  onAuthorClick?: (profileId: string) => void;
  onTopicClick?: (topicName: string) => void;
  onPostRemoved?: (postId: string) => void;
  compact?: boolean;
}

function formatTimeAgo(dateStr: string): string {
  const now = new Date("2026-03-17T12:00:00");
  const date = new Date(dateStr);
  const diff = now.getTime() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}p`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
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

function formatCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return n.toString();
}

const typeLabels: Record<string, string | null> = {
  article: null,
  photo: null,
  recap: "Recap",
  milestone: "Cột mốc",
  question: "Câu hỏi",
};

export function PostCard({
  post,
  myProfileId,
  onPostClick,
  onAuthorClick,
  onTopicClick,
  onPostRemoved,
  compact,
}: PostCardProps) {
  const toast = useToast();
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [liked, setLiked] = useState(post.isLiked);
  const [likesCount, setLikesCount] = useState(post.likesCount);
  const [saved, setSaved] = useState(post.isSaved);
  const [savesCount, setSavesCount] = useState(post.savesCount);

  const author = post.author;
  const typeLabel = typeLabels[post.type];
  const isOwnPost = myProfileId ? post.authorId === myProfileId : false;
  const showDraftIndicator = post.isDraft && isOwnPost;

  const handleToggleLike = async () => {
    const wasLiked = liked;
    setLiked(!wasLiked);
    setLikesCount((c) => (wasLiked ? c - 1 : c + 1));
    try {
      if (wasLiked) await communityInteractionsService.unlikePost(post.id);
      else await communityInteractionsService.likePost(post.id);
    } catch {
      setLiked(wasLiked);
      setLikesCount((c) => (wasLiked ? c + 1 : c - 1));
    }
  };

  const handleToggleSave = async () => {
    const wasSaved = saved;
    setSaved(!wasSaved);
    setSavesCount((c) => (wasSaved ? c - 1 : c + 1));
    try {
      if (wasSaved) await communityInteractionsService.unsavePost(post.id);
      else await communityInteractionsService.savePost(post.id);
    } catch {
      setSaved(wasSaved);
      setSavesCount((c) => (wasSaved ? c + 1 : c - 1));
    }
  };

  // Build more-actions list
  const moreActions: BottomSheetAction[] = isOwnPost
    ? [
        {
          icon: <Trash2 className="w-5 h-5" />,
          label: "Xóa bài viết",
          description: "Bài viết sẽ bị xóa vĩnh viễn",
          destructive: true,
          onClick: async () => {
            try {
              await communityPostsService.deletePost(post.id);
              toast.success("Đã xóa bài viết");
              onPostRemoved?.(post.id);
            } catch {
              toast.error("Không thể xóa bài viết");
            }
          },
        },
      ]
    : [
        {
          icon: <Flag className="w-5 h-5" />,
          label: "Báo cáo bài viết",
          description: "Bài viết vi phạm quy tắc cộng đồng",
          destructive: true,
          onClick: async () => {
            try {
              await communityInteractionsService.reportPost(post.id, {
                reason: "spam",
              });
              toast.info("Đã gửi báo cáo. Cảm ơn bạn!");
            } catch {
              toast.error("Không thể gửi báo cáo");
            }
          },
        },
        {
          icon: <EyeOff className="w-5 h-5" />,
          label: "Ẩn bài viết này",
          description: "Bạn sẽ không thấy bài viết này nữa",
          onClick: () => {
            toast.success("Đã ẩn bài viết");
            onPostRemoved?.(post.id);
          },
        },
        {
          icon: <Ban className="w-5 h-5" />,
          label: `Chặn ${author.displayName || author.username}`,
          description: "Bạn sẽ không thấy nội dung từ người này",
          destructive: true,
          onClick: async () => {
            try {
              await socialFollowsService.blockUser(post.authorId);
              toast.success(`Đã chặn ${author.displayName || author.username}`);
              onPostRemoved?.(post.id);
            } catch {
              toast.error("Không thể chặn người dùng");
            }
          },
        },
      ];

  return (
    <>
      <div
        className={`bg-[var(--card)] rounded-[20px] border border-[var(--border)] overflow-hidden ${showDraftIndicator ? "border-dashed border-[var(--text-tertiary)]" : ""}`}
      >
        {/* Author Row */}
        <div className="px-4 pt-4 pb-2 flex items-start gap-3">
          <button
            onClick={() => onAuthorClick?.(post.authorId)}
            className="flex-shrink-0"
          >
            <img
              src={author.avatarUrl || ""}
              alt={author.displayName || ""}
              className="w-10 h-10 rounded-full object-cover"
            />
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                onClick={() => onAuthorClick?.(post.authorId)}
                className="font-semibold text-[var(--text-primary)] text-sm hover:underline truncate"
              >
                {author.displayName || author.username}
              </button>
              <BadgeIcon badge={author.badge ?? undefined} />
              <span className="text-xs text-[var(--text-tertiary)]">
                @{author.username}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              <span className="text-xs text-[var(--text-tertiary)]">
                {formatTimeAgo(post.createdAt)}
              </span>
              {typeLabel && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--surface)] text-[var(--text-secondary)] font-medium">
                  {typeLabel}
                </span>
              )}
              <AudienceBadge audience={post.audience} />
              {showDraftIndicator && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--warning-light)] text-[var(--warning)] font-medium">
                  Bản nháp
                </span>
              )}
            </div>
          </div>
          <button
            onClick={() => setShowActionSheet(true)}
            className="p-1.5 rounded-full hover:bg-[var(--surface)] text-[var(--text-tertiary)]"
          >
            <MoreHorizontal className="w-[18px] h-[18px]" />
          </button>
        </div>

        {/* Content */}
        <div className="px-4 pb-3">
          <p
            className={`text-[var(--text-primary)] whitespace-pre-wrap leading-relaxed ${compact ? "text-sm line-clamp-3" : "text-sm"}`}
            onClick={() => onPostClick?.(post.id)}
            style={{ cursor: onPostClick ? "pointer" : undefined }}
          >
            {post.content}
          </p>
        </div>

        {/* Recap Card */}
        {post.recapData && (
          <div
            className="px-4 pb-3"
            onClick={() => onPostClick?.(post.id)}
            style={{ cursor: onPostClick ? "pointer" : undefined }}
          >
            <FinanceRecapCard data={post.recapData} />
          </div>
        )}

        {/* Topics */}
        {post.topics.length > 0 && (
          <div className="px-4 pb-3 flex flex-wrap gap-1.5">
            {post.topics.map((t) => (
              <TopicChip
                key={t.id}
                label={t.name}
                onClick={() => onTopicClick?.(t.name)}
                size="sm"
              />
            ))}
          </div>
        )}

        {/* Action Row */}
        <div className="px-4 py-2.5 border-t border-[var(--divider)] flex items-center justify-between">
          <button
            onClick={handleToggleLike}
            className={`flex items-center gap-1.5 text-sm transition-colors ${liked ? "text-[var(--danger)]" : "text-[var(--text-tertiary)] hover:text-[var(--danger)]"}`}
          >
            <Heart
              className={`w-[18px] h-[18px] ${liked ? "fill-current" : ""}`}
            />
            <span className="tabular-nums">{formatCount(likesCount)}</span>
          </button>

          <button
            onClick={() => onPostClick?.(post.id)}
            className="flex items-center gap-1.5 text-sm text-[var(--text-tertiary)] hover:text-[var(--primary)] transition-colors"
          >
            <MessageCircle className="w-[18px] h-[18px]" />
            <span className="tabular-nums">
              {formatCount(post.commentsCount)}
            </span>
          </button>

          <button
            onClick={handleToggleSave}
            className={`flex items-center gap-1.5 text-sm transition-colors ${saved ? "text-[var(--warning)]" : "text-[var(--text-tertiary)] hover:text-[var(--warning)]"}`}
          >
            <Bookmark
              className={`w-[18px] h-[18px] ${saved ? "fill-current" : ""}`}
            />
            <span className="tabular-nums">{formatCount(savesCount)}</span>
          </button>

          <button className="flex items-center gap-1.5 text-sm text-[var(--text-tertiary)] hover:text-[var(--primary)] transition-colors">
            <Share2 className="w-[18px] h-[18px]" />
          </button>
        </div>
      </div>

      <BottomSheetActions
        open={showActionSheet}
        onClose={() => setShowActionSheet(false)}
        title={isOwnPost ? "Bài viết của bạn" : "Tùy chọn"}
        subtitle={
          isOwnPost
            ? undefined
            : `Bài viết bởi ${author.displayName || author.username}`
        }
        actions={moreActions}
      />
    </>
  );
}

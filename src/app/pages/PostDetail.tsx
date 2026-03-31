import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router";
import {
  ChevronLeft,
  Heart,
  MessageCircle,
  Bookmark,
  Share2,
  MoreHorizontal,
  Send,
  Flag,
  EyeOff,
  Ban,
  Award,
  CheckCircle,
  Shield,
  Trash2,
} from "lucide-react";
import { usePostDetail } from "../hooks/usePostDetail";
import { useMyProfile } from "../hooks/useMyProfile";
import { communityCommentsService } from "../services/communityCommentsService";
import { communityInteractionsService } from "../services/communityInteractionsService";
import { communityPostsService } from "../services/communityPostsService";
import { socialFollowsService } from "../services/socialFollowsService";
import type { PostComment } from "../types/community";
import { FinanceRecapCard } from "../components/social/FinanceRecapCard";
import { TopicChip } from "../components/social/TopicChip";
import { AudienceBadge } from "../components/social/AudienceBadge";
import { RestrictedContent } from "../components/social/RestrictedContent";
import { PostSkeleton } from "../components/social/PostSkeleton";
import {
  BottomSheetActions,
  type BottomSheetAction,
} from "../components/social/BottomSheetActions";
import { useToast } from "../contexts/ToastContext";

function formatTimeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diff = now.getTime() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins} phút trước`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  return `${days} ngày trước`;
}

function BadgeIcon({ badge }: { badge?: string | null }) {
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

export default function PostDetail() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { data: post, loading, error } = usePostDetail(id);
  const { data: myProfile } = useMyProfile();
  const toast = useToast();

  const [commentText, setCommentText] = useState("");
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [comments, setComments] = useState<PostComment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);

  // Local optimistic state for like / save
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [saved, setSaved] = useState(false);
  const [savesCount, setSavesCount] = useState(0);

  // Sync local state when post loads
  useEffect(() => {
    if (post) {
      setLiked(post.isLiked);
      setLikesCount(post.likesCount);
      setSaved(post.isSaved);
      setSavesCount(post.savesCount);
    }
  }, [post]);

  // Load comments
  const loadComments = useCallback(async () => {
    if (!id) return;
    try {
      setCommentsLoading(true);
      const result = await communityCommentsService.listComments({
        postId: id,
      });
      setComments(result.items);
    } catch {
      /* ignore */
    } finally {
      setCommentsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--background)]">
        <div className="max-w-2xl mx-auto">
          <div className="sticky top-0 z-20 bg-[var(--background)]/95 backdrop-blur-sm border-b border-[var(--border)] px-4 py-3 flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-xl hover:bg-[var(--surface)] text-[var(--text-secondary)]"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h1 className="font-semibold text-[var(--text-primary)]">
              Bài viết
            </h1>
          </div>
          <div className="px-4 py-4">
            <PostSkeleton />
          </div>
        </div>
      </div>
    );
  }

  // Not found
  if (!post || error) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex flex-col items-center justify-center px-6">
        <div className="w-16 h-16 rounded-2xl bg-[var(--surface)] flex items-center justify-center mb-4">
          <MessageCircle className="w-8 h-8 text-[var(--text-tertiary)]" />
        </div>
        <h3 className="font-semibold text-[var(--text-primary)] mb-2">
          Bài viết không tồn tại
        </h3>
        <p className="text-sm text-[var(--text-secondary)] text-center mb-6">
          Bài viết này có thể đã bị xóa hoặc không khả dụng.
        </p>
        <button
          onClick={() => navigate(-1)}
          className="px-6 py-2.5 bg-[var(--primary)] text-white rounded-2xl font-semibold text-sm"
        >
          Quay lại
        </button>
      </div>
    );
  }

  const author = post.author;
  const isOwnPost = myProfile ? post.authorId === myProfile.id : false;

  // Check access restrictions
  if (!isOwnPost && post.audience === "private") {
    return (
      <div className="min-h-screen bg-[var(--background)]">
        <div className="max-w-2xl mx-auto">
          <div className="sticky top-0 z-20 bg-[var(--background)]/95 backdrop-blur-sm border-b border-[var(--border)] px-4 py-3 flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-xl hover:bg-[var(--surface)] text-[var(--text-secondary)]"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h1 className="font-semibold text-[var(--text-primary)]">
              Bài viết
            </h1>
          </div>
          <RestrictedContent
            audience="private"
            authorName={author.displayName || author.username}
            onGoBack={() => navigate(-1)}
          />
        </div>
      </div>
    );
  }

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

  const handleToggleCommentLike = async (
    commentId: string,
    wasLiked: boolean,
  ) => {
    setComments((prev) =>
      prev.map((c) =>
        c.id === commentId
          ? {
              ...c,
              isLiked: !wasLiked,
              likesCount: wasLiked ? c.likesCount - 1 : c.likesCount + 1,
            }
          : c,
      ),
    );
    try {
      if (wasLiked) await communityCommentsService.unlikeComment(commentId);
      else await communityCommentsService.likeComment(commentId);
    } catch {
      setComments((prev) =>
        prev.map((c) =>
          c.id === commentId
            ? {
                ...c,
                isLiked: wasLiked,
                likesCount: wasLiked ? c.likesCount + 1 : c.likesCount - 1,
              }
            : c,
        ),
      );
    }
  };

  const handleSendComment = async () => {
    if (!commentText.trim()) return;
    try {
      const newComment = await communityCommentsService.createComment({
        postId: post.id,
        content: commentText.trim(),
      });
      setComments((prev) => [...prev, newComment]);
      setCommentText("");
      toast.success("Đã gửi bình luận");
    } catch {
      toast.error("Không thể gửi bình luận");
    }
  };

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
              navigate(-1);
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
            navigate(-1);
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
              navigate(-1);
            } catch {
              toast.error("Không thể chặn người dùng");
            }
          },
        },
      ];

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="sticky top-0 z-20 bg-[var(--background)]/95 backdrop-blur-sm border-b border-[var(--border)] px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-xl hover:bg-[var(--surface)] text-[var(--text-secondary)]"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h1 className="font-semibold text-[var(--text-primary)]">Bài viết</h1>
          <button
            onClick={() => setShowActionSheet(true)}
            className="p-2 rounded-xl hover:bg-[var(--surface)] text-[var(--text-secondary)]"
          >
            <MoreHorizontal className="w-5 h-5" />
          </button>
        </div>

        <div className="pb-24">
          {/* Post Content */}
          <div className="px-4 pt-4 pb-3">
            {/* Author */}
            <div className="flex items-center gap-3 mb-4">
              <button
                onClick={() => navigate(`/community/profile/${post.authorId}`)}
              >
                <img
                  src={author.avatarUrl || ""}
                  alt={author.displayName || ""}
                  className="w-12 h-12 rounded-full object-cover"
                />
              </button>
              <div className="flex-1">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() =>
                      navigate(`/community/profile/${post.authorId}`)
                    }
                    className="font-semibold text-[var(--text-primary)] hover:underline"
                  >
                    {author.displayName || author.username}
                  </button>
                  <BadgeIcon badge={author.badge} />
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <p className="text-xs text-[var(--text-tertiary)]">
                    @{author.username} · {formatTimeAgo(post.createdAt)}
                  </p>
                  <AudienceBadge audience={post.audience} />
                </div>
              </div>
            </div>

            {/* Content */}
            <p className="text-[var(--text-primary)] whitespace-pre-wrap leading-relaxed mb-4">
              {post.content}
            </p>

            {/* Recap Card */}
            {post.recapData && (
              <div className="mb-4">
                <FinanceRecapCard data={post.recapData} large showPrivacyHint />
              </div>
            )}

            {/* Topics */}
            {post.topics.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {post.topics.map((t) => (
                  <TopicChip
                    key={t.id}
                    label={t.name}
                    onClick={() => navigate(`/community/topic/${t.name}`)}
                  />
                ))}
              </div>
            )}

            {/* Stats */}
            <div className="flex items-center gap-4 py-3 border-t border-b border-[var(--divider)] text-sm text-[var(--text-tertiary)]">
              <span className="tabular-nums">{likesCount} lượt thích</span>
              <span className="tabular-nums">
                {comments.length || post.commentsCount} bình luận
              </span>
              <span className="tabular-nums">{savesCount} đã lưu</span>
              <span className="tabular-nums">{post.sharesCount} chia sẻ</span>
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-around py-2 border-b border-[var(--divider)]">
              <button
                onClick={handleToggleLike}
                className={`flex items-center gap-2 py-2 px-3 rounded-xl transition-colors ${liked ? "text-[var(--danger)]" : "text-[var(--text-secondary)] hover:text-[var(--danger)]"}`}
              >
                <Heart className={`w-5 h-5 ${liked ? "fill-current" : ""}`} />
                <span className="text-sm">Thích</span>
              </button>
              <button className="flex items-center gap-2 py-2 px-3 rounded-xl text-[var(--text-secondary)]">
                <MessageCircle className="w-5 h-5" />
                <span className="text-sm">Bình luận</span>
              </button>
              <button
                onClick={handleToggleSave}
                className={`flex items-center gap-2 py-2 px-3 rounded-xl transition-colors ${saved ? "text-[var(--warning)]" : "text-[var(--text-secondary)] hover:text-[var(--warning)]"}`}
              >
                <Bookmark
                  className={`w-5 h-5 ${saved ? "fill-current" : ""}`}
                />
                <span className="text-sm">Lưu</span>
              </button>
              <button className="flex items-center gap-2 py-2 px-3 rounded-xl text-[var(--text-secondary)] hover:text-[var(--primary)]">
                <Share2 className="w-5 h-5" />
                <span className="text-sm">Chia sẻ</span>
              </button>
            </div>
          </div>

          {/* Comments */}
          <div className="px-4 py-3">
            <h3 className="font-semibold text-sm text-[var(--text-primary)] mb-3">
              Bình luận ({comments.length || post.commentsCount})
            </h3>
            {comments.length === 0 ? (
              <div className="text-center py-8">
                <MessageCircle className="w-8 h-8 text-[var(--text-tertiary)] mx-auto mb-2" />
                <p className="text-sm text-[var(--text-tertiary)]">
                  Chưa có bình luận nào
                </p>
                <p className="text-xs text-[var(--text-tertiary)] mt-1">
                  Hãy là người đầu tiên chia sẻ ý kiến!
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {comments.map((comment) => {
                  const cAuthor = comment.author;
                  return (
                    <div key={comment.id}>
                      <div className="flex gap-3">
                        <button
                          onClick={() =>
                            navigate(`/community/profile/${cAuthor.id}`)
                          }
                        >
                          <img
                            src={cAuthor.avatarUrl || ""}
                            alt=""
                            className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                          />
                        </button>
                        <div className="flex-1">
                          <div className="bg-[var(--surface)] rounded-2xl px-3.5 py-2.5">
                            <div className="flex items-center gap-1.5">
                              <p className="font-semibold text-xs text-[var(--text-primary)]">
                                {cAuthor.displayName || cAuthor.username}
                              </p>
                              <BadgeIcon badge={cAuthor.badge} />
                            </div>
                            <p className="text-sm text-[var(--text-primary)] mt-0.5">
                              {comment.content}
                            </p>
                          </div>
                          <div className="flex items-center gap-3 mt-1 px-2">
                            <span className="text-xs text-[var(--text-tertiary)]">
                              {formatTimeAgo(comment.createdAt)}
                            </span>
                            <button
                              onClick={() =>
                                handleToggleCommentLike(
                                  comment.id,
                                  comment.isLiked,
                                )
                              }
                              className={`text-xs font-medium ${comment.isLiked ? "text-[var(--danger)]" : "text-[var(--text-tertiary)]"}`}
                            >
                              Thích{" "}
                              {comment.likesCount > 0 &&
                                `(${comment.likesCount})`}
                            </button>
                            <button className="text-xs font-medium text-[var(--text-tertiary)]">
                              Trả lời
                            </button>
                          </div>

                          {/* Replies */}
                          {comment.replies &&
                            comment.replies.map((reply) => {
                              const rAuthor = reply.author;
                              return (
                                <div
                                  key={reply.id}
                                  className="flex gap-2.5 mt-3 ml-4"
                                >
                                  <img
                                    src={rAuthor.avatarUrl || ""}
                                    alt=""
                                    className="w-6 h-6 rounded-full object-cover flex-shrink-0"
                                  />
                                  <div className="flex-1">
                                    <div className="bg-[var(--surface)] rounded-xl px-3 py-2">
                                      <div className="flex items-center gap-1">
                                        <p className="font-semibold text-xs text-[var(--text-primary)]">
                                          {rAuthor.displayName ||
                                            rAuthor.username}
                                        </p>
                                        <BadgeIcon badge={rAuthor.badge} />
                                      </div>
                                      <p className="text-xs text-[var(--text-primary)] mt-0.5">
                                        {reply.content}
                                      </p>
                                    </div>
                                    <div className="flex items-center gap-3 mt-1 px-2">
                                      <span className="text-xs text-[var(--text-tertiary)]">
                                        {formatTimeAgo(reply.createdAt)}
                                      </span>
                                      <button className="text-xs font-medium text-[var(--text-tertiary)]">
                                        Thích
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Sticky Comment Input */}
        <div className="fixed bottom-0 left-0 right-0 bg-[var(--card)] border-t border-[var(--border)] px-4 py-3 z-30 safe-area-inset-bottom">
          <div className="max-w-2xl mx-auto flex items-center gap-3">
            <img
              src={myProfile?.avatarUrl || ""}
              alt=""
              className="w-8 h-8 rounded-full object-cover flex-shrink-0"
            />
            <input
              type="text"
              placeholder="Viết bình luận..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendComment()}
              className="flex-1 bg-[var(--surface)] rounded-xl px-4 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none focus:ring-2 focus:ring-[var(--primary)]"
            />
            <button
              onClick={handleSendComment}
              disabled={!commentText.trim()}
              className={`p-2.5 rounded-xl transition-colors ${commentText.trim() ? "bg-[var(--primary)] text-white" : "bg-[var(--surface)] text-[var(--text-tertiary)]"}`}
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Action Sheet */}
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
      </div>
    </div>
  );
}

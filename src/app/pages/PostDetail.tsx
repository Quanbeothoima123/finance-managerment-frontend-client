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
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";

function formatTimeAgo(dateStr: string, t: TFunction): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diff = now.getTime() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return t("post_detail.time_ago.minutes", { n: mins });
  const hours = Math.floor(mins / 60);
  if (hours < 24) return t("post_detail.time_ago.hours", { n: hours });
  const days = Math.floor(hours / 24);
  return t("post_detail.time_ago.days", { n: days });
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
  const { t } = useTranslation("community");
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
              {t("post_detail.title")}
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
          {t("post_detail.not_found.title")}
        </h3>
        <p className="text-sm text-[var(--text-secondary)] text-center mb-6">
          {t("post_detail.not_found.description")}
        </p>
        <button
          onClick={() => navigate(-1)}
          className="px-6 py-2.5 bg-[var(--primary)] text-white rounded-2xl font-semibold text-sm"
        >
          {t("post_detail.not_found.back_button")}
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
              {t("post_detail.title")}
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
      toast.success(t("post_detail.comments.send_success"));
    } catch {
      toast.error(t("post_detail.comments.send_failed"));
    }
  };

  const moreActions: BottomSheetAction[] = isOwnPost
    ? [
        {
          icon: <Trash2 className="w-5 h-5" />,
          label: t("post_detail.action_sheet.delete_label"),
          description: t("post_detail.action_sheet.delete_description"),
          destructive: true,
          onClick: async () => {
            try {
              await communityPostsService.deletePost(post.id);
              toast.success(t("post_detail.toast.deleted"));
              navigate(-1);
            } catch {
              toast.error(t("post_detail.toast.delete_failed"));
            }
          },
        },
      ]
    : [
        {
          icon: <Flag className="w-5 h-5" />,
          label: t("post_detail.action_sheet.report_label"),
          description: t("post_detail.action_sheet.report_description"),
          destructive: true,
          onClick: async () => {
            try {
              await communityInteractionsService.reportPost(post.id, {
                reason: "spam",
              });
              toast.info(t("post_detail.toast.reported"));
            } catch {
              toast.error(t("post_detail.toast.report_failed"));
            }
          },
        },
        {
          icon: <EyeOff className="w-5 h-5" />,
          label: t("post_detail.action_sheet.hide_label"),
          description: t("post_detail.action_sheet.hide_description"),
          onClick: () => {
            toast.success(t("post_detail.toast.hidden"));
            navigate(-1);
          },
        },
        {
          icon: <Ban className="w-5 h-5" />,
          label: t("post_detail.action_sheet.block_label", {
            name: author.displayName || author.username,
          }),
          description: t("post_detail.action_sheet.block_description"),
          destructive: true,
          onClick: async () => {
            try {
              await socialFollowsService.blockUser(post.authorId);
              toast.success(
                t("post_detail.toast.blocked", {
                  name: author.displayName || author.username,
                }),
              );
              navigate(-1);
            } catch {
              toast.error(t("post_detail.toast.block_failed"));
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
          <h1 className="font-semibold text-[var(--text-primary)]">
            {t("post_detail.title")}
          </h1>
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
                    @{author.username} · {formatTimeAgo(post.createdAt, t)}
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
              <span className="tabular-nums">
                {t("post_detail.stats.likes", { count: likesCount })}
              </span>
              <span className="tabular-nums">
                {t("post_detail.stats.comments", {
                  count: comments.length || post.commentsCount,
                })}
              </span>
              <span className="tabular-nums">
                {t("post_detail.stats.saves", { count: savesCount })}
              </span>
              <span className="tabular-nums">
                {t("post_detail.stats.shares", { count: post.sharesCount })}
              </span>
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-around py-2 border-b border-[var(--divider)]">
              <button
                onClick={handleToggleLike}
                className={`flex items-center gap-2 py-2 px-3 rounded-xl transition-colors ${liked ? "text-[var(--danger)]" : "text-[var(--text-secondary)] hover:text-[var(--danger)]"}`}
              >
                <Heart className={`w-5 h-5 ${liked ? "fill-current" : ""}`} />
                <span className="text-sm">{t("post_detail.actions.like")}</span>
              </button>
              <button className="flex items-center gap-2 py-2 px-3 rounded-xl text-[var(--text-secondary)]">
                <MessageCircle className="w-5 h-5" />
                <span className="text-sm">
                  {t("post_detail.actions.comment")}
                </span>
              </button>
              <button
                onClick={handleToggleSave}
                className={`flex items-center gap-2 py-2 px-3 rounded-xl transition-colors ${saved ? "text-[var(--warning)]" : "text-[var(--text-secondary)] hover:text-[var(--warning)]"}`}
              >
                <Bookmark
                  className={`w-5 h-5 ${saved ? "fill-current" : ""}`}
                />
                <span className="text-sm">{t("post_detail.actions.save")}</span>
              </button>
              <button className="flex items-center gap-2 py-2 px-3 rounded-xl text-[var(--text-secondary)] hover:text-[var(--primary)]">
                <Share2 className="w-5 h-5" />
                <span className="text-sm">
                  {t("post_detail.actions.share")}
                </span>
              </button>
            </div>
          </div>

          {/* Comments */}
          <div className="px-4 py-3">
            <h3 className="font-semibold text-sm text-[var(--text-primary)] mb-3">
              {t("post_detail.comments.section_title", {
                count: comments.length || post.commentsCount,
              })}
            </h3>
            {comments.length === 0 ? (
              <div className="text-center py-8">
                <MessageCircle className="w-8 h-8 text-[var(--text-tertiary)] mx-auto mb-2" />
                <p className="text-sm text-[var(--text-tertiary)]">
                  {t("post_detail.comments.empty_title")}
                </p>
                <p className="text-xs text-[var(--text-tertiary)] mt-1">
                  {t("post_detail.comments.empty_hint")}
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
                              {formatTimeAgo(comment.createdAt, t)}
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
                              {t("post_detail.comments.like")}{" "}
                              {comment.likesCount > 0 &&
                                `(${comment.likesCount})`}
                            </button>
                            <button className="text-xs font-medium text-[var(--text-tertiary)]">
                              {t("post_detail.comments.reply")}
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
                                        {formatTimeAgo(reply.createdAt, t)}
                                      </span>
                                      <button className="text-xs font-medium text-[var(--text-tertiary)]">
                                        {t("post_detail.comments.like")}
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
              placeholder={t("post_detail.comments.input_placeholder")}
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
          title={
            isOwnPost
              ? t("post_detail.action_sheet.own_post_title")
              : t("post_detail.action_sheet.others_post_title")
          }
          subtitle={
            isOwnPost
              ? undefined
              : t("post_detail.action_sheet.others_post_subtitle", {
                  name: author.displayName || author.username,
                })
          }
          actions={moreActions}
        />
      </div>
    </div>
  );
}

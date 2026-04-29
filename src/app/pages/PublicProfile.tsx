import React, { useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router";
import {
  ChevronLeft,
  MoreHorizontal,
  Award,
  CheckCircle,
  Shield,
  Settings,
  PenSquare,
  Bookmark,
  Flag,
  Ban,
} from "lucide-react";
import { usePublicProfile } from "../hooks/usePublicProfile";
import { useMyProfile } from "../hooks/useMyProfile";
import { useUserPosts } from "../hooks/useUserPosts";
import { socialFollowsService } from "../services/socialFollowsService";
import { communityInteractionsService } from "../services/communityInteractionsService";
import { PostCard } from "../components/social/PostCard";
import { TopicChip } from "../components/social/TopicChip";
import { SocialEmptyState } from "../components/social/SocialEmptyState";
import {
  BottomSheetActions,
  type BottomSheetAction,
} from "../components/social/BottomSheetActions";
import { useToast } from "../contexts/ToastContext";
import { useTranslation } from "react-i18next";

type ProfileTab = "posts" | "recaps";

function BadgeIcon({ badge }: { badge?: string | null }) {
  const { t } = useTranslation("community");
  if (!badge) return null;
  const map: Record<
    string,
    { icon: React.ReactNode; color: string; label: string }
  > = {
    verified: {
      icon: <CheckCircle className="w-4 h-4" />,
      color: "text-[var(--primary)]",
      label: t("public_profile.badge_labels.verified"),
    },
    expert: {
      icon: <Award className="w-4 h-4" />,
      color: "text-[var(--warning)]",
      label: t("public_profile.badge_labels.expert"),
    },
    mentor: {
      icon: <Shield className="w-4 h-4" />,
      color: "text-[var(--success)]",
      label: "Mentor",
    },
  };
  const b = map[badge];
  if (!b) return null;
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${b.color}`}
      style={{ backgroundColor: "var(--surface)" }}
    >
      {b.icon} {b.label}
    </span>
  );
}

export default function PublicProfile() {
  const navigate = useNavigate();
  const { t } = useTranslation("community");
  const { id } = useParams<{ id: string }>();
  const {
    data: profile,
    loading: profileLoading,
    error: profileError,
  } = usePublicProfile(id);
  const { data: myProfile } = useMyProfile();
  const { data: postsData, loading: postsLoading } = useUserPosts(profile?.id);

  const toast = useToast();
  const [activeTab, setActiveTab] = useState<ProfileTab>("posts");
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [isFollowing, setIsFollowing] = useState<boolean | null>(null);
  const [hiddenPostIds, setHiddenPostIds] = useState<Set<string>>(new Set());

  const isMe = myProfile && profile ? myProfile.id === profile.id : false;

  // Track follow state: use local override if set, otherwise unknown from profile API
  // (The profile API doesn't include isFollowing, so we track optimistically)
  const following = isFollowing;

  const userPosts = useMemo(() => {
    if (!postsData?.items) return [];
    return postsData.items.filter((p) => !hiddenPostIds.has(p.id));
  }, [postsData, hiddenPostIds]);

  const userRecaps = useMemo(
    () => userPosts.filter((p) => p.type === "recap" || p.type === "milestone"),
    [userPosts],
  );

  const currentPosts = activeTab === "posts" ? userPosts : userRecaps;

  const handleToggleFollow = async () => {
    if (!profile) return;
    const wasFollowing = following;
    setIsFollowing(!wasFollowing);
    try {
      if (wasFollowing) {
        await socialFollowsService.unfollow(profile.id);
      } else {
        await socialFollowsService.follow(profile.id);
      }
    } catch {
      setIsFollowing(wasFollowing);
    }
  };

  const handleBlock = async () => {
    if (!profile) return;
    try {
      await socialFollowsService.blockUser(profile.id);
      toast.success(`Đã chặn ${profile.displayName || profile.username}`);
      navigate(-1);
    } catch {
      toast.error(t("public_profile.toast.block_failed"));
    }
  };

  const handlePostRemoved = (postId: string) => {
    setHiddenPostIds((prev) => new Set(prev).add(postId));
  };

  if (profileLoading) {
    return (
      <div className="min-h-screen bg-[var(--background)]">
        <div className="max-w-2xl mx-auto">
          <div className="sticky top-0 z-20 bg-[var(--background)]/95 backdrop-blur-sm border-b border-[var(--border)] px-4 py-3 flex items-center">
            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-xl hover:bg-[var(--surface)] text-[var(--text-secondary)]"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          </div>
          <div className="px-4 py-6 flex flex-col items-center">
            <div className="w-20 h-20 rounded-full bg-[var(--surface)] animate-pulse mb-3" />
            <div className="w-32 h-5 rounded bg-[var(--surface)] animate-pulse mb-2" />
            <div className="w-24 h-4 rounded bg-[var(--surface)] animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (profileError || !profile) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex flex-col items-center justify-center px-6">
        <div className="w-16 h-16 rounded-2xl bg-[var(--surface)] flex items-center justify-center mb-4">
          <Award className="w-8 h-8 text-[var(--text-tertiary)]" />
        </div>
        <h3 className="font-semibold text-[var(--text-primary)] mb-2">
          Người dùng không tồn tại
        </h3>
        <p className="text-sm text-[var(--text-secondary)] text-center mb-6">
          Tài khoản này có thể đã bị xóa hoặc không khả dụng.
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

  const displayName = profile.displayName || profile.username;

  const visitorActions: BottomSheetAction[] = [
    {
      icon: <Flag className="w-5 h-5" />,
      label: t("public_profile.actions.report"),
      description: t("public_profile.actions.report_description"),
      destructive: true,
      onClick: () => toast.info(t("public_profile.toast.reported")),
    },
    {
      icon: <Ban className="w-5 h-5" />,
      label: t("public_profile.actions.block"),
      description: t("public_profile.actions.block_description"),
      destructive: true,
      onClick: handleBlock,
    },
  ];

  const tabs: { key: ProfileTab; label: string; count: number }[] = [
    {
      key: "posts",
      label: t("public_profile.tabs.posts"),
      count: userPosts.length,
    },
    {
      key: "recaps",
      label: t("public_profile.tabs.recaps"),
      count: userRecaps.length,
    },
  ];

  const emptyConfig = {
    posts: {
      title: isMe ? "Chưa có bài viết nào" : `${displayName} chưa có bài viết`,
      desc: isMe
        ? t("public_profile.empty_posts")
        : `${displayName} chưa đăng bài viết nào.`,
      action: isMe
        ? {
            label: t("public_profile.actions.create_post"),
            onClick: () => navigate("/community/create"),
          }
        : undefined,
    },
    recaps: {
      title: isMe ? "Chưa có recap nào" : `${displayName} chưa chia sẻ recap`,
      desc: isMe
        ? t("public_profile.empty_recaps")
        : t("public_profile.empty_recaps_own"),
      action: isMe
        ? {
            label: t("public_profile.actions.share_recap"),
            onClick: () => navigate("/community/share-recap"),
          }
        : undefined,
    },
  };

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
            @{profile.username}
          </h1>
          <button
            onClick={() =>
              isMe ? navigate("/settings") : setShowActionSheet(true)
            }
            className="p-2 rounded-xl hover:bg-[var(--surface)] text-[var(--text-secondary)]"
          >
            {isMe ? (
              <Settings className="w-5 h-5" />
            ) : (
              <MoreHorizontal className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Profile Header */}
        <div className="px-4 py-6 text-center">
          <img
            src={profile.avatarUrl || ""}
            alt={displayName}
            className="w-20 h-20 rounded-full object-cover mx-auto mb-3 border-4 border-[var(--card)]"
          />
          <div className="flex items-center justify-center gap-2 mb-1">
            <h2 className="text-lg font-bold text-[var(--text-primary)]">
              {displayName}
            </h2>
          </div>
          <p className="text-sm text-[var(--text-tertiary)] mb-2">
            @{profile.username}
          </p>
          <BadgeIcon badge={profile.badge} />
          {profile.bio && (
            <p className="text-sm text-[var(--text-secondary)] mt-3 max-w-sm mx-auto leading-relaxed">
              {profile.bio}
            </p>
          )}

          {/* Stats */}
          <div className="flex items-center justify-center gap-8 mt-4">
            <div className="text-center">
              <p className="font-bold text-[var(--text-primary)] tabular-nums">
                {profile.postsCount}
              </p>
              <p className="text-xs text-[var(--text-tertiary)]">Bài viết</p>
            </div>
            <button
              onClick={() =>
                navigate(`/community/profile/${profile.id}/followers`)
              }
              className="text-center"
            >
              <p className="font-bold text-[var(--text-primary)] tabular-nums">
                {profile.followersCount.toLocaleString()}
              </p>
              <p className="text-xs text-[var(--text-tertiary)]">
                Người theo dõi
              </p>
            </button>
            <button
              onClick={() =>
                navigate(`/community/profile/${profile.id}/following`)
              }
              className="text-center"
            >
              <p className="font-bold text-[var(--text-primary)] tabular-nums">
                {profile.followingCount}
              </p>
              <p className="text-xs text-[var(--text-tertiary)]">
                Đang theo dõi
              </p>
            </button>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-center gap-3 mt-4">
            {isMe ? (
              <>
                <button
                  onClick={() => navigate("/community/create")}
                  className="flex items-center gap-2 px-6 py-2.5 bg-[var(--primary)] text-white rounded-2xl font-semibold text-sm hover:bg-[var(--primary-hover)] transition-colors"
                >
                  <PenSquare className="w-4 h-4" />
                  {t("public_profile.actions.create_post")}
                </button>
                <button
                  onClick={() => navigate("/community/saved")}
                  className="flex items-center gap-2 px-4 py-2.5 bg-[var(--surface)] text-[var(--text-secondary)] rounded-2xl font-semibold text-sm hover:bg-[var(--border)] transition-colors"
                >
                  <Bookmark className="w-4 h-4" />
                  Đã lưu
                </button>
              </>
            ) : (
              <button
                onClick={handleToggleFollow}
                className={`px-8 py-2.5 rounded-2xl font-semibold text-sm transition-colors ${
                  following
                    ? "bg-[var(--surface)] text-[var(--text-secondary)] hover:bg-[var(--danger-light)] hover:text-[var(--danger)]"
                    : "bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)]"
                }`}
              >
                {following ? "Đang theo dõi" : "Theo dõi"}
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-[var(--border)]">
          <div className="flex">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.key
                    ? "border-[var(--primary)] text-[var(--primary)]"
                    : "border-transparent text-[var(--text-tertiary)]"
                }`}
              >
                {tab.label}
                <span className="ml-1 tabular-nums text-xs">({tab.count})</span>
              </button>
            ))}
          </div>
        </div>

        {/* Posts */}
        <div className="px-4 py-4 space-y-4 pb-24">
          {postsLoading ? (
            [1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-40 rounded-2xl bg-[var(--surface)] animate-pulse"
              />
            ))
          ) : currentPosts.length === 0 ? (
            <SocialEmptyState
              icon={<Award className="w-8 h-8" />}
              title={emptyConfig[activeTab].title}
              description={emptyConfig[activeTab].desc}
              action={emptyConfig[activeTab].action}
            />
          ) : (
            currentPosts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                myProfileId={myProfile?.id}
                onPostClick={(pid) => navigate(`/community/post/${pid}`)}
                onAuthorClick={(uid) => navigate(`/community/profile/${uid}`)}
                onPostRemoved={handlePostRemoved}
              />
            ))
          )}
        </div>

        {/* Visitor Action Sheet */}
        {!isMe && (
          <BottomSheetActions
            open={showActionSheet}
            onClose={() => setShowActionSheet(false)}
            title={t("public_profile.action_sheet_title")}
            subtitle={`Hồ sơ của ${displayName}`}
            actions={visitorActions}
          />
        )}
      </div>
    </div>
  );
}

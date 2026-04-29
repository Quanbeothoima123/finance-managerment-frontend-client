import React, { useState, useMemo, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";
import { Search, Bell, PenSquare, Sparkles } from "lucide-react";
import { useCommunityFeed } from "../hooks/useCommunityFeed";
import { useMyProfile } from "../hooks/useMyProfile";
import { useSocialUnreadCount } from "../hooks/useSocialUnreadCount";
import { useSocialTopics } from "../hooks/useSocialTopics";
import { PostCard } from "../components/social/PostCard";
import { TopicChip } from "../components/social/TopicChip";
import { PostSkeleton } from "../components/social/PostSkeleton";
import { SocialEmptyState } from "../components/social/SocialEmptyState";
import { useTranslation } from "react-i18next";

type FeedTab = "foryou" | "following";

export default function CommunityFeed() {
  const navigate = useNavigate();
  const { t } = useTranslation("community");

  const { data: myProfile } = useMyProfile();
  const { count: unreadNotificationsCount } = useSocialUnreadCount();
  const { data: topicsList } = useSocialTopics();

  const [activeTab, setActiveTab] = useState<FeedTab>("foryou");
  const [activeTopicId, setActiveTopicId] = useState<string | undefined>(
    undefined,
  );

  const apiTab =
    activeTab === "foryou" ? ("for-you" as const) : ("following" as const);
  const {
    data: feedData,
    loading,
    reload,
  } = useCommunityFeed(apiTab, activeTopicId);

  // Redirect if not onboarded
  const hasCompletedOnboarding = myProfile?.onboardingDoneAt != null;
  useEffect(() => {
    if (myProfile && !hasCompletedOnboarding) {
      navigate("/community/onboarding", { replace: true });
    }
  }, [myProfile, hasCompletedOnboarding, navigate]);

  // Client-side hidden post tracking
  const [hiddenPostIds, setHiddenPostIds] = useState<Set<string>>(new Set());
  const handlePostRemoved = useCallback((postId: string) => {
    setHiddenPostIds((prev) => new Set(prev).add(postId));
  }, []);

  const filteredPosts = useMemo(() => {
    if (!feedData) return [];
    return feedData.items.filter((p) => !hiddenPostIds.has(p.id));
  }, [feedData, hiddenPostIds]);

  const topicFilters = useMemo(() => {
    const all = [
      { id: undefined as string | undefined, name: t("feed.topic_filter_all") },
    ];
    if (topicsList)
      all.push(
        ...topicsList.map((t) => ({
          id: t.id as string | undefined,
          name: t.name,
        })),
      );
    return all;
  }, [topicsList, t]);

  if (myProfile && !hasCompletedOnboarding) return null;

  const tabs: { key: FeedTab; label: string }[] = [
    { key: "foryou", label: t("feed.tabs.for_you") },
    { key: "following", label: t("feed.tabs.following") },
  ];

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="sticky top-0 z-20 bg-[var(--background)]/95 backdrop-blur-sm border-b border-[var(--border)]">
          <div className="px-4 pt-4 pb-2 flex items-center justify-between">
            <h1 className="text-xl font-bold text-[var(--text-primary)]">
              {t("feed.title")}
            </h1>
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate("/community/discover")}
                className="p-2.5 rounded-xl hover:bg-[var(--surface)] text-[var(--text-secondary)] transition-colors"
              >
                <Search className="w-5 h-5" />
              </button>
              <button
                onClick={() => navigate("/community/notifications")}
                className="relative p-2.5 rounded-xl hover:bg-[var(--surface)] text-[var(--text-secondary)] transition-colors"
              >
                <Bell className="w-5 h-5" />
                {unreadNotificationsCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-[var(--danger)] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {unreadNotificationsCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Segmented Tabs */}
          <div className="px-4 pb-2">
            <div className="flex bg-[var(--surface)] rounded-xl p-1">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => {
                    setActiveTab(tab.key);
                  }}
                  className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                    activeTab === tab.key
                      ? "bg-[var(--card)] text-[var(--text-primary)] shadow-sm"
                      : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Topic Filter Chips */}
          <div className="px-4 pb-3 overflow-x-auto scrollbar-none">
            <div className="flex gap-2 min-w-max">
              {topicFilters.map((topic) => (
                <TopicChip
                  key={topic.name}
                  label={topic.name}
                  isActive={activeTopicId === topic.id}
                  onClick={() => setActiveTopicId(topic.id)}
                  size="sm"
                />
              ))}
            </div>
          </div>
        </div>

        {/* Feed Content */}
        <div className="px-4 py-4 space-y-4 pb-24">
          {loading ? (
            <>
              <PostSkeleton />
              <PostSkeleton />
              <PostSkeleton />
            </>
          ) : filteredPosts.length === 0 ? (
            <SocialEmptyState
              icon={<Sparkles className="w-8 h-8" />}
              title={t("feed.empty.title")}
              description={
                activeTab === "following"
                  ? t("feed.empty.description_following")
                  : t("feed.empty.description_default")
              }
              action={{
                label: t("feed.empty.discover_action"),
                onClick: () => navigate("/community/discover"),
              }}
            />
          ) : (
            filteredPosts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                myProfileId={myProfile?.id}
                onPostClick={(id) => navigate(`/community/post/${id}`)}
                onAuthorClick={(id) => navigate(`/community/profile/${id}`)}
                onTopicClick={(t) => navigate(`/community/topic/${t}`)}
                onPostRemoved={handlePostRemoved}
              />
            ))
          )}
        </div>

        {/* Floating Create Button */}
        <button
          onClick={() => navigate("/community/create")}
          className="fixed bottom-24 md:bottom-8 right-4 md:right-8 w-14 h-14 bg-[var(--primary)] text-white rounded-2xl shadow-lg hover:bg-[var(--primary-hover)] transition-all hover:scale-105 flex items-center justify-center z-30"
        >
          <PenSquare className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
}

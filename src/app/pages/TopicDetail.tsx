import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate, useParams } from "react-router";
import { ChevronLeft, Hash, PenSquare } from "lucide-react";
import { socialTopicsService } from "../services/socialTopicsService";
import { useCommunityFeed } from "../hooks/useCommunityFeed";
import { useMyProfile } from "../hooks/useMyProfile";
import type { SocialTopic } from "../types/community";
import { PostCard } from "../components/social/PostCard";
import { TopicChip } from "../components/social/TopicChip";
import { PostSkeleton } from "../components/social/PostSkeleton";
import { SocialEmptyState } from "../components/social/SocialEmptyState";
import { useToast } from "../contexts/ToastContext";

export default function TopicDetail() {
  const navigate = useNavigate();
  const { name } = useParams<{ name: string }>();
  const toast = useToast();
  const { data: myProfile } = useMyProfile();

  const [topic, setTopic] = useState<SocialTopic | null>(null);
  const [topicLoading, setTopicLoading] = useState(true);
  const [allTopics, setAllTopics] = useState<SocialTopic[]>([]);

  // Load topic by name - we need to find its ID first
  const loadTopic = useCallback(async () => {
    try {
      setTopicLoading(true);
      const topics = await socialTopicsService.listTopics();
      setAllTopics(topics);
      const found = topics.find((t) => t.name === name);
      if (found) setTopic(found);
    } catch {
      /* ignore */
    } finally {
      setTopicLoading(false);
    }
  }, [name]);

  useEffect(() => {
    loadTopic();
  }, [loadTopic]);

  // Load posts for this topic
  const { data: feedData, loading: postsLoading } = useCommunityFeed(
    "for-you",
    topic?.id,
  );
  const topicPosts = feedData?.items || [];

  const relatedTopics = useMemo(
    () => allTopics.filter((t) => t.name !== name).slice(0, 4),
    [allTopics, name],
  );

  const [isFollowing, setIsFollowing] = useState(false);
  useEffect(() => {
    if (topic) setIsFollowing(topic.isFollowed);
  }, [topic]);

  const handleToggleFollow = async () => {
    if (!topic) return;
    const was = isFollowing;
    setIsFollowing(!was);
    try {
      if (was) await socialTopicsService.unfollowTopic(topic.id);
      else await socialTopicsService.followTopic(topic.id);
      toast.success(
        was ? `Đã bỏ theo dõi #${topic.name}` : `Đã theo dõi #${topic.name}`,
      );
    } catch {
      setIsFollowing(was);
    }
  };

  // Hidden posts client-side
  const [hiddenPostIds, setHiddenPostIds] = useState<Set<string>>(new Set());
  const handlePostRemoved = useCallback((postId: string) => {
    setHiddenPostIds((prev) => new Set(prev).add(postId));
  }, []);
  const filteredPosts = topicPosts.filter((p) => !hiddenPostIds.has(p.id));

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
          <h1 className="font-semibold text-[var(--text-primary)]">#{name}</h1>
        </div>

        {/* Topic Header */}
        {topic && (
          <div className="px-4 py-5 border-b border-[var(--border)]">
            <div className="flex items-center gap-3 mb-3">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center"
                style={{
                  backgroundColor: `${topic.color}20`,
                  color: topic.color,
                }}
              >
                <Hash className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h2 className="font-bold text-[var(--text-primary)]">
                  #{topic.name}
                </h2>
                <p className="text-xs text-[var(--text-tertiary)]">
                  <span className="tabular-nums">
                    {topic.postsCount.toLocaleString()}
                  </span>{" "}
                  bài viết ·{" "}
                  <span className="tabular-nums">
                    {topic.followersCount.toLocaleString()}
                  </span>{" "}
                  người theo dõi
                </p>
              </div>
              <button
                onClick={handleToggleFollow}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                  isFollowing
                    ? "bg-[var(--surface)] text-[var(--text-secondary)] hover:bg-[var(--danger-light)] hover:text-[var(--danger)]"
                    : "bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)]"
                }`}
              >
                {isFollowing ? "Đã theo dõi" : "Theo dõi"}
              </button>
            </div>
            {topic.description && (
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                {topic.description}
              </p>
            )}
          </div>
        )}

        {/* Related Topics */}
        {relatedTopics.length > 0 && (
          <div className="px-4 py-3 border-b border-[var(--border)]">
            <p className="text-xs font-semibold text-[var(--text-tertiary)] uppercase mb-2">
              Chủ đề liên quan
            </p>
            <div className="flex flex-wrap gap-2">
              {relatedTopics.map((t) => (
                <TopicChip
                  key={t.id}
                  label={t.name}
                  color={t.color}
                  onClick={() => navigate(`/community/topic/${t.name}`)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Posts */}
        <div className="px-4 py-4 space-y-4 pb-24">
          {postsLoading || topicLoading ? (
            <>
              <PostSkeleton />
              <PostSkeleton />
            </>
          ) : filteredPosts.length === 0 ? (
            <SocialEmptyState
              icon={<Hash className="w-8 h-8" />}
              title="Chưa có bài viết nào"
              description={`Chưa có bài viết nào với chủ đề #${name}. Hãy là người đầu tiên chia sẻ!`}
              action={{
                label: "Tạo bài viết",
                onClick: () => navigate("/community/create"),
              }}
            />
          ) : (
            filteredPosts.map((post) => (
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

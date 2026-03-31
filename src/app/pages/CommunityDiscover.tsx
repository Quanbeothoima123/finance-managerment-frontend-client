import React, { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router";
import {
  Search,
  ChevronLeft,
  TrendingUp,
  Users,
  Flame,
  Trophy,
  X,
  Clock,
  Hash,
} from "lucide-react";
import { useSocialTopics } from "../hooks/useSocialTopics";
import { useCommunityFeed } from "../hooks/useCommunityFeed";
import { useMyProfile } from "../hooks/useMyProfile";
import { PostCard } from "../components/social/PostCard";
import { Card } from "../components/Card";
import { SocialEmptyState } from "../components/social/SocialEmptyState";
import type { CommunityPost, SocialTopic } from "../types/community";

type SearchTab = "posts" | "topics";

const SUGGESTED_SEARCHES = [
  "tiết kiệm mua nhà",
  "ngân sách sinh viên",
  "quy tắc 50/30/20",
  "quỹ khẩn cấp",
  "meal prep",
];

export default function CommunityDiscover() {
  const navigate = useNavigate();
  const { data: myProfile } = useMyProfile();
  const { data: topics, loading: topicsLoading } = useSocialTopics();
  const { data: feedData, loading: feedLoading } = useCommunityFeed("for-you");

  const [searchQuery, setSearchQuery] = useState("");
  const [searchTab, setSearchTab] = useState<SearchTab>("posts");
  const [hiddenPostIds, setHiddenPostIds] = useState<Set<string>>(new Set());
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("social_recent_searches") || "[]");
    } catch {
      return [];
    }
  });

  const isSearching = searchQuery.trim().length > 0;

  const allPosts = useMemo(() => {
    if (!feedData?.items) return [];
    return feedData.items.filter((p) => !hiddenPostIds.has(p.id));
  }, [feedData, hiddenPostIds]);

  const trendingPosts = useMemo(
    () =>
      [...allPosts]
        .filter((p) => p.audience === "public")
        .sort((a, b) => b.likesCount - a.likesCount)
        .slice(0, 3),
    [allPosts],
  );

  const q = searchQuery.toLowerCase().trim();

  const searchResults = useMemo(() => {
    if (!q)
      return { posts: [] as CommunityPost[], topics: [] as SocialTopic[] };
    return {
      posts: allPosts.filter(
        (p) => p.audience === "public" && p.content.toLowerCase().includes(q),
      ),
      topics: (topics || []).filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          (t.description || "").toLowerCase().includes(q),
      ),
    };
  }, [q, allPosts, topics]);

  const totalResults = searchResults.posts.length + searchResults.topics.length;

  const addRecentSearch = (s: string) => {
    const updated = [s, ...recentSearches.filter((r) => r !== s)].slice(0, 8);
    setRecentSearches(updated);
    localStorage.setItem("social_recent_searches", JSON.stringify(updated));
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem("social_recent_searches");
  };

  const handleSearch = (term: string) => {
    setSearchQuery(term);
    if (term.trim()) addRecentSearch(term.trim());
  };

  const handlePostRemoved = (postId: string) => {
    setHiddenPostIds((prev) => new Set(prev).add(postId));
  };

  const topicIcons: Record<string, React.ReactNode> = {
    "piggy-bank": <TrendingUp className="w-5 h-5" />,
    calculator: <TrendingUp className="w-5 h-5" />,
    target: <Trophy className="w-5 h-5" />,
    home: <Users className="w-5 h-5" />,
    "graduation-cap": <Users className="w-5 h-5" />,
    briefcase: <TrendingUp className="w-5 h-5" />,
    "trending-up": <TrendingUp className="w-5 h-5" />,
  };

  const searchTabs: { key: SearchTab; label: string; count: number }[] = [
    { key: "posts", label: "Bài viết", count: searchResults.posts.length },
    { key: "topics", label: "Chủ đề", count: searchResults.topics.length },
  ];

  const loading = topicsLoading || feedLoading;

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="sticky top-0 z-20 bg-[var(--background)]/95 backdrop-blur-sm px-4 pt-4 pb-3 border-b border-[var(--border)]">
          <div className="flex items-center gap-3 mb-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-xl hover:bg-[var(--surface)] text-[var(--text-secondary)]"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-bold text-[var(--text-primary)]">
              Khám phá
            </h1>
          </div>
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]" />
            <input
              type="text"
              placeholder="Tìm kiếm bài viết, chủ đề..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch(searchQuery)}
              className="w-full pl-10 pr-10 py-3 bg-[var(--surface)] rounded-xl text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] border-0 outline-none focus:ring-2 focus:ring-[var(--primary)]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-[var(--border)]"
              >
                <X className="w-4 h-4 text-[var(--text-tertiary)]" />
              </button>
            )}
          </div>

          {/* Search Tabs (when searching) */}
          {isSearching && (
            <div className="flex gap-1 mt-3 overflow-x-auto scrollbar-none">
              {searchTabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setSearchTab(tab.key)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                    searchTab === tab.key
                      ? "bg-[var(--primary)] text-white"
                      : "bg-[var(--surface)] text-[var(--text-secondary)]"
                  }`}
                >
                  {tab.label}
                  <span
                    className={`tabular-nums ${searchTab === tab.key ? "text-white/80" : "text-[var(--text-tertiary)]"}`}
                  >
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {loading ? (
          <div className="px-4 py-6 space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-32 rounded-2xl bg-[var(--surface)] animate-pulse"
              />
            ))}
          </div>
        ) : isSearching ? (
          <div className="px-4 py-4 space-y-4 pb-24">
            {totalResults === 0 ? (
              <SocialEmptyState
                icon={<Search className="w-8 h-8" />}
                title="Không tìm thấy kết quả"
                description={`Không có kết quả nào phù hợp với "${searchQuery}". Thử tìm với từ khóa khác.`}
              />
            ) : searchTab === "posts" ? (
              searchResults.posts.length === 0 ? (
                <p className="text-center py-8 text-sm text-[var(--text-tertiary)]">
                  Không có bài viết phù hợp
                </p>
              ) : (
                searchResults.posts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    myProfileId={myProfile?.id}
                    compact
                    onPostClick={(id) => navigate(`/community/post/${id}`)}
                    onAuthorClick={(id) => navigate(`/community/profile/${id}`)}
                    onPostRemoved={handlePostRemoved}
                  />
                ))
              )
            ) : searchResults.topics.length === 0 ? (
              <p className="text-center py-8 text-sm text-[var(--text-tertiary)]">
                Không tìm thấy chủ đề
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {searchResults.topics.map((topic) => (
                  <button
                    key={topic.id}
                    onClick={() => navigate(`/community/topic/${topic.name}`)}
                    className="p-4 rounded-2xl border border-[var(--border)] bg-[var(--card)] text-left hover:border-[var(--primary)] transition-colors"
                  >
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center mb-2"
                      style={{
                        backgroundColor: `${topic.color}20`,
                        color: topic.color,
                      }}
                    >
                      <Hash className="w-5 h-5" />
                    </div>
                    <p className="font-semibold text-sm text-[var(--text-primary)] mb-0.5">
                      #{topic.name}
                    </p>
                    <p className="text-xs text-[var(--text-tertiary)]">
                      {topic.postsCount.toLocaleString()} bài viết
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="px-4 py-4 space-y-6 pb-24">
            {/* Recent Searches */}
            {recentSearches.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-2">
                  <h2 className="font-semibold text-[var(--text-primary)] flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[var(--text-tertiary)]" />
                    Tìm kiếm gần đây
                  </h2>
                  <button
                    onClick={clearRecentSearches}
                    className="text-xs text-[var(--primary)] font-medium"
                  >
                    Xóa tất cả
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {recentSearches.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => handleSearch(s)}
                      className="px-3 py-1.5 rounded-full bg-[var(--surface)] text-sm text-[var(--text-secondary)] hover:bg-[var(--primary-light)] hover:text-[var(--primary)] transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </section>
            )}

            {/* Suggested Searches */}
            <section>
              <h2 className="font-semibold text-[var(--text-primary)] mb-2 flex items-center gap-2">
                <Search className="w-4 h-4 text-[var(--text-tertiary)]" />
                Gợi ý tìm kiếm
              </h2>
              <div className="flex flex-wrap gap-2">
                {SUGGESTED_SEARCHES.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => handleSearch(s)}
                    className="px-3 py-1.5 rounded-full bg-[var(--surface)] text-sm text-[var(--text-secondary)] hover:bg-[var(--primary-light)] hover:text-[var(--primary)] transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </section>

            {/* Topic Cards */}
            {topics && topics.length > 0 && (
              <section>
                <h2 className="font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-2">
                  <Flame className="w-4 h-4 text-[var(--warning)]" />
                  Chủ đề nổi bật
                </h2>
                <div className="grid grid-cols-2 gap-3">
                  {topics.slice(0, 6).map((topic) => (
                    <button
                      key={topic.id}
                      onClick={() => navigate(`/community/topic/${topic.name}`)}
                      className="p-4 rounded-2xl border border-[var(--border)] bg-[var(--card)] text-left hover:border-[var(--primary)] transition-colors"
                    >
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center mb-2"
                        style={{
                          backgroundColor: `${topic.color}20`,
                          color: topic.color,
                        }}
                      >
                        {topicIcons[topic.icon || ""] || (
                          <TrendingUp className="w-5 h-5" />
                        )}
                      </div>
                      <p className="font-semibold text-sm text-[var(--text-primary)] mb-0.5">
                        #{topic.name}
                      </p>
                      <p className="text-xs text-[var(--text-tertiary)]">
                        {topic.postsCount.toLocaleString()} bài viết
                      </p>
                    </button>
                  ))}
                </div>
              </section>
            )}

            {/* Trending Posts */}
            {trendingPosts.length > 0 && (
              <section>
                <h2 className="font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-[var(--success)]" />
                  Bài viết xu hướng
                </h2>
                <div className="space-y-4">
                  {trendingPosts.map((post) => (
                    <PostCard
                      key={post.id}
                      post={post}
                      myProfileId={myProfile?.id}
                      compact
                      onPostClick={(id) => navigate(`/community/post/${id}`)}
                      onAuthorClick={(id) =>
                        navigate(`/community/profile/${id}`)
                      }
                      onPostRemoved={handlePostRemoved}
                    />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

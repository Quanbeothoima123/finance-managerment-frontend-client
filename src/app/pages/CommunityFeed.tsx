import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Search, Bell, PenSquare, Sparkles } from 'lucide-react';
import { useSocialData } from '../contexts/SocialDataContext';
import { PostCard } from '../components/social/PostCard';
import { TopicChip } from '../components/social/TopicChip';
import { PostSkeleton } from '../components/social/PostSkeleton';
import { SocialEmptyState } from '../components/social/SocialEmptyState';

type FeedTab = 'foryou' | 'following' | 'discover';

const TOPIC_FILTERS = ['Tất cả', 'Tiết kiệm', 'Budget', 'Mục tiêu', 'Chi tiêu gia đình', 'Sinh viên', 'Thu nhập phụ', 'Đầu tư cơ bản'];

export default function CommunityFeed() {
  const navigate = useNavigate();
  const {
    posts, users, unreadNotificationsCount,
    hasCompletedOnboarding, hiddenPostIds, blockedUserIds, currentUser,
  } = useSocialData();

  const [activeTab, setActiveTab] = useState<FeedTab>('foryou');
  const [activeTopic, setActiveTopic] = useState('Tất cả');
  const [isLoading] = useState(false);

  // If not onboarded, redirect
  useEffect(() => {
    if (!hasCompletedOnboarding) {
      navigate('/community/onboarding', { replace: true });
    }
  }, [hasCompletedOnboarding, navigate]);

  if (!hasCompletedOnboarding) return null;

  const filteredPosts = useMemo(() => {
    let result = [...posts];

    // Filter out hidden and blocked
    result = result.filter(p => !hiddenPostIds.includes(p.id) && !blockedUserIds.includes(p.authorId));

    // Filter by audience visibility
    result = result.filter(p => {
      if (p.authorId === currentUser.id) return true; // Own posts always visible
      if (p.audience === 'private') return false;
      if (p.audience === 'followers') {
        const author = users.find(u => u.id === p.authorId);
        return author?.isFollowing ?? false;
      }
      return true; // public
    });

    if (activeTab === 'following') {
      const followingIds = users.filter(u => u.isFollowing).map(u => u.id);
      result = result.filter(p => followingIds.includes(p.authorId));
    }

    if (activeTopic !== 'Tất cả') {
      result = result.filter(p => p.topics.includes(activeTopic));
    }

    return result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [posts, users, activeTab, activeTopic, hiddenPostIds, blockedUserIds, currentUser.id]);

  const tabs: { key: FeedTab; label: string }[] = [
    { key: 'foryou', label: 'Dành cho bạn' },
    { key: 'following', label: 'Đang theo dõi' },
    { key: 'discover', label: 'Khám phá' },
  ];

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="sticky top-0 z-20 bg-[var(--background)]/95 backdrop-blur-sm border-b border-[var(--border)]">
          <div className="px-4 pt-4 pb-2 flex items-center justify-between">
            <h1 className="text-xl font-bold text-[var(--text-primary)]">Cộng đồng</h1>
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate('/community/discover')}
                className="p-2.5 rounded-xl hover:bg-[var(--surface)] text-[var(--text-secondary)] transition-colors"
              >
                <Search className="w-5 h-5" />
              </button>
              <button
                onClick={() => navigate('/community/notifications')}
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
              {tabs.map(tab => (
                <button
                  key={tab.key}
                  onClick={() => {
                    setActiveTab(tab.key);
                    if (tab.key === 'discover') navigate('/community/discover');
                  }}
                  className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                    activeTab === tab.key
                      ? 'bg-[var(--card)] text-[var(--text-primary)] shadow-sm'
                      : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
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
              {TOPIC_FILTERS.map(topic => (
                <TopicChip
                  key={topic}
                  label={topic}
                  isActive={activeTopic === topic}
                  onClick={() => setActiveTopic(topic)}
                  size="sm"
                />
              ))}
            </div>
          </div>
        </div>

        {/* Feed Content */}
        <div className="px-4 py-4 space-y-4 pb-24">
          {isLoading ? (
            <>
              <PostSkeleton />
              <PostSkeleton />
              <PostSkeleton />
            </>
          ) : filteredPosts.length === 0 ? (
            <SocialEmptyState
              icon={<Sparkles className="w-8 h-8" />}
              title="Chưa có bài viết nào"
              description={activeTab === 'following' ? 'Hãy theo dõi những người dùng khác để thấy bài viết của họ.' : 'Chưa có bài viết nào phù hợp với bộ lọc của bạn.'}
              action={{ label: 'Khám phá cộng đồng', onClick: () => navigate('/community/discover') }}
            />
          ) : (
            filteredPosts.map(post => (
              <PostCard
                key={post.id}
                post={post}
                onPostClick={(id) => navigate(`/community/post/${id}`)}
                onAuthorClick={(id) => navigate(`/community/profile/${id}`)}
                onTopicClick={(t) => navigate(`/community/topic/${t}`)}
              />
            ))
          )}
        </div>

        {/* Floating Create Button */}
        <button
          onClick={() => navigate('/community/create')}
          className="fixed bottom-24 md:bottom-8 right-4 md:right-8 w-14 h-14 bg-[var(--primary)] text-white rounded-2xl shadow-lg hover:bg-[var(--primary-hover)] transition-all hover:scale-105 flex items-center justify-center z-30"
        >
          <PenSquare className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
}

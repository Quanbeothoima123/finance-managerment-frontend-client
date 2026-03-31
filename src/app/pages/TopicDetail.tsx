import React from 'react';
import { useNavigate, useParams } from 'react-router';
import { ChevronLeft, Hash, PenSquare } from 'lucide-react';
import { useSocialData } from '../contexts/SocialDataContext';
import { PostCard } from '../components/social/PostCard';
import { TopicChip } from '../components/social/TopicChip';
import { SocialEmptyState } from '../components/social/SocialEmptyState';
import { useToast } from '../contexts/ToastContext';

export default function TopicDetail() {
  const navigate = useNavigate();
  const { name } = useParams<{ name: string }>();
  const { posts, topics, toggleTopicFollow, hiddenPostIds, blockedUserIds } = useSocialData();
  const toast = useToast();

  const topic = topics.find(t => t.name === name);
  const topicPosts = posts.filter(p =>
    p.topics.includes(name || '') &&
    p.audience === 'public' &&
    !hiddenPostIds.includes(p.id) &&
    !blockedUserIds.includes(p.authorId)
  );
  const relatedTopics = topics.filter(t => t.name !== name).slice(0, 4);

  const handleToggleFollow = () => {
    if (topic) {
      toggleTopicFollow(topic.id);
      toast.success(topic.isFollowing ? `Đã bỏ theo dõi #${topic.name}` : `Đã theo dõi #${topic.name}`);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="max-w-2xl mx-auto">
        <div className="sticky top-0 z-20 bg-[var(--background)]/95 backdrop-blur-sm border-b border-[var(--border)] px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-[var(--surface)] text-[var(--text-secondary)]">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h1 className="font-semibold text-[var(--text-primary)]">#{name}</h1>
        </div>

        {/* Topic Header */}
        {topic && (
          <div className="px-4 py-5 border-b border-[var(--border)]">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ backgroundColor: `${topic.color}20`, color: topic.color }}>
                <Hash className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h2 className="font-bold text-[var(--text-primary)]">#{topic.name}</h2>
                <p className="text-xs text-[var(--text-tertiary)]">
                  <span className="tabular-nums">{topic.postsCount.toLocaleString()}</span> bài viết · <span className="tabular-nums">{topic.followersCount.toLocaleString()}</span> người theo dõi
                </p>
              </div>
              <button
                onClick={handleToggleFollow}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                  topic.isFollowing
                    ? 'bg-[var(--surface)] text-[var(--text-secondary)] hover:bg-[var(--danger-light)] hover:text-[var(--danger)]'
                    : 'bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)]'
                }`}
              >
                {topic.isFollowing ? 'Đã theo dõi' : 'Theo dõi'}
              </button>
            </div>
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{topic.description}</p>
          </div>
        )}

        {/* Related Topics */}
        {relatedTopics.length > 0 && (
          <div className="px-4 py-3 border-b border-[var(--border)]">
            <p className="text-xs font-semibold text-[var(--text-tertiary)] uppercase mb-2">Chủ đề liên quan</p>
            <div className="flex flex-wrap gap-2">
              {relatedTopics.map(t => (
                <TopicChip key={t.id} label={t.name} color={t.color} onClick={() => navigate(`/community/topic/${t.name}`)} />
              ))}
            </div>
          </div>
        )}

        {/* Posts */}
        <div className="px-4 py-4 space-y-4 pb-24">
          {topicPosts.length === 0 ? (
            <SocialEmptyState
              icon={<Hash className="w-8 h-8" />}
              title="Chưa có bài viết nào"
              description={`Chưa có bài viết nào với chủ đề #${name}. Hãy là người đầu tiên chia sẻ!`}
              action={{ label: 'Tạo bài viết', onClick: () => navigate('/community/create') }}
            />
          ) : (
            topicPosts.map(post => (
              <PostCard key={post.id} post={post} onPostClick={(pid) => navigate(`/community/post/${pid}`)} onAuthorClick={(uid) => navigate(`/community/profile/${uid}`)} />
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

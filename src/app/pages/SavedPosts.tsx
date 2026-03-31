import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { ChevronLeft, Bookmark } from 'lucide-react';
import { useSocialData } from '../contexts/SocialDataContext';
import { PostCard } from '../components/social/PostCard';
import { SocialEmptyState } from '../components/social/SocialEmptyState';

type FilterType = 'all' | 'recap' | 'tips' | 'question';

export default function SavedPosts() {
  const navigate = useNavigate();
  const { posts } = useSocialData();
  const [filter, setFilter] = useState<FilterType>('all');

  const savedPosts = useMemo(() => posts.filter(p => p.isSaved), [posts]);

  const filteredPosts = useMemo(() => savedPosts.filter(p => {
    if (filter === 'all') return true;
    if (filter === 'recap') return p.type === 'recap' || p.type === 'milestone';
    if (filter === 'tips') return p.type === 'article';
    if (filter === 'question') return p.type === 'question';
    return true;
  }), [savedPosts, filter]);

  const filters: { key: FilterType; label: string; count: number }[] = [
    { key: 'all', label: 'Tất cả', count: savedPosts.length },
    { key: 'recap', label: 'Recap', count: savedPosts.filter(p => p.type === 'recap' || p.type === 'milestone').length },
    { key: 'tips', label: 'Tips', count: savedPosts.filter(p => p.type === 'article').length },
    { key: 'question', label: 'Câu hỏi', count: savedPosts.filter(p => p.type === 'question').length },
  ];

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="max-w-2xl mx-auto">
        <div className="sticky top-0 z-20 bg-[var(--background)]/95 backdrop-blur-sm border-b border-[var(--border)]">
          <div className="px-4 py-3 flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-[var(--surface)] text-[var(--text-secondary)]">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h1 className="font-semibold text-[var(--text-primary)]">Đã lưu</h1>
            <span className="text-xs text-[var(--text-tertiary)] ml-auto tabular-nums">{savedPosts.length} bài viết</span>
          </div>
          <div className="px-4 pb-3 flex gap-2 overflow-x-auto scrollbar-none">
            {filters.map(f => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  filter === f.key ? 'bg-[var(--primary)] text-white' : 'bg-[var(--surface)] text-[var(--text-secondary)]'
                }`}
              >
                {f.label}
                <span className={`text-xs tabular-nums ${filter === f.key ? 'text-white/80' : 'text-[var(--text-tertiary)]'}`}>
                  {f.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="px-4 py-4 space-y-4 pb-24">
          {filteredPosts.length === 0 ? (
            <SocialEmptyState
              icon={<Bookmark className="w-8 h-8" />}
              title="Chưa có bài viết nào được lưu"
              description="Khi bạn lưu bài viết, chúng sẽ xuất hiện ở đây để bạn đọc lại sau."
              action={{ label: 'Khám phá bài viết', onClick: () => navigate('/community/discover') }}
            />
          ) : (
            filteredPosts.map(post => (
              <PostCard key={post.id} post={post} onPostClick={(pid) => navigate(`/community/post/${pid}`)} onAuthorClick={(uid) => navigate(`/community/profile/${uid}`)} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

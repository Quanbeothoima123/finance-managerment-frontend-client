import React, { useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router';
import { ChevronLeft, Search, Users, UserPlus } from 'lucide-react';
import { useSocialData } from '../contexts/SocialDataContext';
import { ProfileRow } from '../components/social/ProfileRow';
import { SocialEmptyState } from '../components/social/SocialEmptyState';

type Tab = 'followers' | 'following';

export default function FollowersList() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { users, toggleFollow } = useSocialData();
  const [activeTab, setActiveTab] = useState<Tab>(window.location.pathname.endsWith('following') ? 'following' : 'followers');
  const [searchQuery, setSearchQuery] = useState('');

  const user = users.find(u => u.id === id);
  if (!user) return null;

  const isMe = user.id === 'user-me';

  // Mock followers/following from available users (excluding self)
  const mockFollowers = useMemo(() => users.filter(u => u.id !== id && u.id !== 'user-me'), [users, id]);
  const mockFollowing = useMemo(() => users.filter(u => u.id !== id && u.isFollowing), [users, id]);

  const currentList = activeTab === 'followers' ? mockFollowers : mockFollowing;

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return currentList;
    const q = searchQuery.toLowerCase();
    return currentList.filter(u =>
      u.displayName.toLowerCase().includes(q) || u.username.toLowerCase().includes(q)
    );
  }, [currentList, searchQuery]);

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="sticky top-0 z-20 bg-[var(--background)]/95 backdrop-blur-sm border-b border-[var(--border)]">
          <div className="px-4 py-3 flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-[var(--surface)] text-[var(--text-secondary)]">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h1 className="font-semibold text-[var(--text-primary)]">{user.displayName}</h1>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-[var(--border)]">
            <button
              onClick={() => setActiveTab('followers')}
              className={`flex-1 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'followers' ? 'border-[var(--primary)] text-[var(--primary)]' : 'border-transparent text-[var(--text-tertiary)]'
              }`}
            >
              <span className="tabular-nums">{user.followersCount.toLocaleString()}</span> Người theo dõi
            </button>
            <button
              onClick={() => setActiveTab('following')}
              className={`flex-1 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'following' ? 'border-[var(--primary)] text-[var(--primary)]' : 'border-transparent text-[var(--text-tertiary)]'
              }`}
            >
              <span className="tabular-nums">{user.followingCount}</span> Đang theo dõi
            </button>
          </div>

          {/* Search */}
          <div className="px-4 py-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]" />
              <input
                type="text"
                placeholder="Tìm kiếm..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-[var(--surface)] rounded-xl text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none focus:ring-2 focus:ring-[var(--primary)]"
              />
            </div>
          </div>
        </div>

        {/* List */}
        <div className="px-4 pb-24">
          {filtered.length > 0 ? (
            <div className="divide-y divide-[var(--divider)]">
              {filtered.map(u => (
                <ProfileRow
                  key={u.id}
                  user={u}
                  onClick={() => navigate(`/community/profile/${u.id}`)}
                  onFollow={() => toggleFollow(u.id)}
                />
              ))}
            </div>
          ) : searchQuery.trim() ? (
            <div className="text-center py-12">
              <Search className="w-8 h-8 text-[var(--text-tertiary)] mx-auto mb-2" />
              <p className="text-sm text-[var(--text-tertiary)]">Không tìm thấy kết quả cho "{searchQuery}"</p>
            </div>
          ) : (
            <SocialEmptyState
              icon={activeTab === 'followers' ? <Users className="w-8 h-8" /> : <UserPlus className="w-8 h-8" />}
              title={activeTab === 'followers'
                ? (isMe ? 'Chưa có người theo dõi' : `${user.displayName} chưa có người theo dõi`)
                : (isMe ? 'Bạn chưa theo dõi ai' : `${user.displayName} chưa theo dõi ai`)
              }
              description={activeTab === 'followers'
                ? 'Chia sẻ bài viết chất lượng để thu hút người theo dõi!'
                : 'Khám phá cộng đồng để tìm người dùng thú vị.'
              }
              action={isMe ? { label: 'Khám phá cộng đồng', onClick: () => navigate('/community/discover') } : undefined}
            />
          )}
        </div>
      </div>
    </div>
  );
}

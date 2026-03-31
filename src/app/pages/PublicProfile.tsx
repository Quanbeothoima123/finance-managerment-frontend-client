import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { ChevronLeft, MoreHorizontal, Award, CheckCircle, Shield, Settings, PenSquare, Bookmark, Flag, Ban } from 'lucide-react';
import { useSocialData } from '../contexts/SocialDataContext';
import { PostCard } from '../components/social/PostCard';
import { TopicChip } from '../components/social/TopicChip';
import { SocialEmptyState } from '../components/social/SocialEmptyState';
import { BottomSheetActions, type BottomSheetAction } from '../components/social/BottomSheetActions';
import { useToast } from '../contexts/ToastContext';

type ProfileTab = 'posts' | 'recaps' | 'saved';

function BadgeIcon({ badge }: { badge?: string }) {
  if (!badge) return null;
  const map: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
    verified: { icon: <CheckCircle className="w-4 h-4" />, color: 'text-[var(--primary)]', label: 'Đã xác minh' },
    expert: { icon: <Award className="w-4 h-4" />, color: 'text-[var(--warning)]', label: 'Chuyên gia' },
    mentor: { icon: <Shield className="w-4 h-4" />, color: 'text-[var(--success)]', label: 'Mentor' },
  };
  const b = map[badge];
  if (!b) return null;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${b.color}`} style={{ backgroundColor: 'var(--surface)' }}>
      {b.icon} {b.label}
    </span>
  );
}

export default function PublicProfile() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { users, posts, toggleFollow, blockUser, currentUser } = useSocialData();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<ProfileTab>('posts');
  const [showActionSheet, setShowActionSheet] = useState(false);

  const user = users.find(u => u.id === id);
  if (!user) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex flex-col items-center justify-center px-6">
        <div className="w-16 h-16 rounded-2xl bg-[var(--surface)] flex items-center justify-center mb-4">
          <Award className="w-8 h-8 text-[var(--text-tertiary)]" />
        </div>
        <h3 className="font-semibold text-[var(--text-primary)] mb-2">Người dùng không tồn tại</h3>
        <p className="text-sm text-[var(--text-secondary)] text-center mb-6">Tài khoản này có thể đã bị xóa hoặc không khả dụng.</p>
        <button onClick={() => navigate(-1)} className="px-6 py-2.5 bg-[var(--primary)] text-white rounded-2xl font-semibold text-sm">
          Quay lại
        </button>
      </div>
    );
  }

  const isMe = user.id === currentUser.id;
  const userPosts = posts.filter(p => {
    if (p.authorId !== user.id) return false;
    if (isMe) return true; // Owner sees all
    if (p.audience === 'private') return false;
    if (p.audience === 'followers' && !user.isFollowing) return false;
    return true;
  });
  const userRecaps = userPosts.filter(p => p.type === 'recap' || p.type === 'milestone');
  const savedPosts = isMe ? posts.filter(p => p.isSaved) : [];

  const tabs: { key: ProfileTab; label: string; count: number; show: boolean }[] = [
    { key: 'posts', label: 'Bài viết', count: userPosts.length, show: true },
    { key: 'recaps', label: 'Recap', count: userRecaps.length, show: true },
    { key: 'saved', label: 'Đã lưu', count: savedPosts.length, show: isMe },
  ];

  const currentPosts = activeTab === 'posts' ? userPosts : activeTab === 'recaps' ? userRecaps : savedPosts;

  const visitorActions: BottomSheetAction[] = [
    {
      icon: <Flag className="w-5 h-5" />,
      label: 'Báo cáo người dùng',
      description: 'Vi phạm quy tắc cộng đồng',
      destructive: true,
      onClick: () => toast.info('Đã gửi báo cáo. Cảm ơn bạn!'),
    },
    {
      icon: <Ban className="w-5 h-5" />,
      label: `Chặn ${user.displayName}`,
      description: 'Bạn sẽ không thấy nội dung từ người này',
      destructive: true,
      onClick: () => { blockUser(user.id); toast.success(`Đã chặn ${user.displayName}`); navigate(-1); },
    },
  ];

  const emptyConfig = {
    posts: {
      title: isMe ? 'Chưa có bài viết nào' : `${user.displayName} chưa có bài viết`,
      desc: isMe ? 'Bắt đầu chia sẻ kinh nghiệm tài chính với cộng đồng!' : `${user.displayName} chưa đăng bài viết nào.`,
      action: isMe ? { label: 'Tạo bài viết', onClick: () => navigate('/community/create') } : undefined,
    },
    recaps: {
      title: isMe ? 'Chưa có recap nào' : `${user.displayName} chưa chia sẻ recap`,
      desc: isMe ? 'Chia sẻ recap tài chính để theo dõi tiến trình và truyền cảm hứng!' : 'Recap tài chính sẽ hiển thị ở đây.',
      action: isMe ? { label: 'Chia sẻ Recap', onClick: () => navigate('/community/share-recap') } : undefined,
    },
    saved: {
      title: 'Chưa lưu bài viết nào',
      desc: 'Khi bạn lưu bài viết, chúng sẽ xuất hiện ở đây để đọc lại sau.',
      action: { label: 'Khám phá bài viết', onClick: () => navigate('/community/discover') },
    },
  };

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="sticky top-0 z-20 bg-[var(--background)]/95 backdrop-blur-sm border-b border-[var(--border)] px-4 py-3 flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-[var(--surface)] text-[var(--text-secondary)]">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h1 className="font-semibold text-[var(--text-primary)]">@{user.username}</h1>
          <button
            onClick={() => isMe ? navigate('/settings') : setShowActionSheet(true)}
            className="p-2 rounded-xl hover:bg-[var(--surface)] text-[var(--text-secondary)]"
          >
            {isMe ? <Settings className="w-5 h-5" /> : <MoreHorizontal className="w-5 h-5" />}
          </button>
        </div>

        {/* Profile Header */}
        <div className="px-4 py-6 text-center">
          <img src={user.avatar} alt={user.displayName} className="w-20 h-20 rounded-full object-cover mx-auto mb-3 border-4 border-[var(--card)]" />
          <div className="flex items-center justify-center gap-2 mb-1">
            <h2 className="text-lg font-bold text-[var(--text-primary)]">{user.displayName}</h2>
          </div>
          <p className="text-sm text-[var(--text-tertiary)] mb-2">@{user.username}</p>
          <BadgeIcon badge={user.badge} />
          {user.bio && (
            <p className="text-sm text-[var(--text-secondary)] mt-3 max-w-sm mx-auto leading-relaxed">{user.bio}</p>
          )}

          {/* Stats */}
          <div className="flex items-center justify-center gap-8 mt-4">
            <div className="text-center">
              <p className="font-bold text-[var(--text-primary)] tabular-nums">{user.postsCount}</p>
              <p className="text-xs text-[var(--text-tertiary)]">Bài viết</p>
            </div>
            <button onClick={() => navigate(`/community/profile/${user.id}/followers`)} className="text-center">
              <p className="font-bold text-[var(--text-primary)] tabular-nums">{user.followersCount.toLocaleString()}</p>
              <p className="text-xs text-[var(--text-tertiary)]">Người theo dõi</p>
            </button>
            <button onClick={() => navigate(`/community/profile/${user.id}/following`)} className="text-center">
              <p className="font-bold text-[var(--text-primary)] tabular-nums">{user.followingCount}</p>
              <p className="text-xs text-[var(--text-tertiary)]">Đang theo dõi</p>
            </button>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-center gap-3 mt-4">
            {isMe ? (
              <>
                <button
                  onClick={() => navigate('/community/create')}
                  className="flex items-center gap-2 px-6 py-2.5 bg-[var(--primary)] text-white rounded-2xl font-semibold text-sm hover:bg-[var(--primary-hover)] transition-colors"
                >
                  <PenSquare className="w-4 h-4" />
                  Tạo bài viết
                </button>
                <button
                  onClick={() => navigate('/community/saved')}
                  className="flex items-center gap-2 px-4 py-2.5 bg-[var(--surface)] text-[var(--text-secondary)] rounded-2xl font-semibold text-sm hover:bg-[var(--border)] transition-colors"
                >
                  <Bookmark className="w-4 h-4" />
                  Đã lưu
                </button>
              </>
            ) : (
              <button
                onClick={() => toggleFollow(user.id)}
                className={`px-8 py-2.5 rounded-2xl font-semibold text-sm transition-colors ${
                  user.isFollowing
                    ? 'bg-[var(--surface)] text-[var(--text-secondary)] hover:bg-[var(--danger-light)] hover:text-[var(--danger)]'
                    : 'bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)]'
                }`}
              >
                {user.isFollowing ? 'Đang theo dõi' : 'Theo dõi'}
              </button>
            )}
          </div>

          {/* Topic Tags */}
          {user.topicTags.length > 0 && (
            <div className="flex flex-wrap justify-center gap-2 mt-4">
              {user.topicTags.map(tag => (
                <TopicChip key={tag} label={tag} size="sm" onClick={() => navigate(`/community/topic/${tag}`)} />
              ))}
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="border-b border-[var(--border)]">
          <div className="flex">
            {tabs.filter(t => t.show).map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.key
                    ? 'border-[var(--primary)] text-[var(--primary)]'
                    : 'border-transparent text-[var(--text-tertiary)]'
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
          {currentPosts.length === 0 ? (
            <SocialEmptyState
              icon={activeTab === 'saved' ? <Bookmark className="w-8 h-8" /> : <Award className="w-8 h-8" />}
              title={emptyConfig[activeTab].title}
              description={emptyConfig[activeTab].desc}
              action={emptyConfig[activeTab].action}
            />
          ) : (
            currentPosts.map(post => (
              <PostCard key={post.id} post={post} onPostClick={(pid) => navigate(`/community/post/${pid}`)} onAuthorClick={(uid) => navigate(`/community/profile/${uid}`)} />
            ))
          )}
        </div>

        {/* Visitor Action Sheet */}
        {!isMe && (
          <BottomSheetActions
            open={showActionSheet}
            onClose={() => setShowActionSheet(false)}
            title="Tùy chọn"
            subtitle={`Hồ sơ của ${user.displayName}`}
            actions={visitorActions}
          />
        )}
      </div>
    </div>
  );
}

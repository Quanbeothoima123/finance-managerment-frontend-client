import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { ChevronLeft, Heart, MessageCircle, Bookmark, Share2, MoreHorizontal, Send, Flag, EyeOff, Ban, Award, CheckCircle, Shield, Trash2 } from 'lucide-react';
import { useSocialData } from '../contexts/SocialDataContext';
import { FinanceRecapCard } from '../components/social/FinanceRecapCard';
import { TopicChip } from '../components/social/TopicChip';
import { PostCard } from '../components/social/PostCard';
import { AudienceBadge } from '../components/social/AudienceBadge';
import { RestrictedContent } from '../components/social/RestrictedContent';
import { BottomSheetActions, type BottomSheetAction } from '../components/social/BottomSheetActions';
import { useToast } from '../contexts/ToastContext';

function formatTimeAgo(dateStr: string): string {
  const now = new Date('2026-03-17T12:00:00');
  const date = new Date(dateStr);
  const diff = now.getTime() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins} phút trước`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  return `${days} ngày trước`;
}

function BadgeIcon({ badge }: { badge?: string }) {
  if (!badge) return null;
  const map: Record<string, { icon: React.ReactNode; color: string }> = {
    verified: { icon: <CheckCircle className="w-3.5 h-3.5" />, color: 'text-[var(--primary)]' },
    expert: { icon: <Award className="w-3.5 h-3.5" />, color: 'text-[var(--warning)]' },
    mentor: { icon: <Shield className="w-3.5 h-3.5" />, color: 'text-[var(--success)]' },
  };
  const b = map[badge];
  if (!b) return null;
  return <span className={`inline-flex ${b.color}`}>{b.icon}</span>;
}

export default function PostDetail() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const {
    posts, users, getUserById, toggleLike, toggleSave,
    addComment, toggleCommentLike, currentUser,
    hidePost, reportPost, blockUser, deletePost,
  } = useSocialData();
  const toast = useToast();

  const post = posts.find(p => p.id === id);
  const [commentText, setCommentText] = useState('');
  const [showActionSheet, setShowActionSheet] = useState(false);

  if (!post) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex flex-col items-center justify-center px-6">
        <div className="w-16 h-16 rounded-2xl bg-[var(--surface)] flex items-center justify-center mb-4">
          <MessageCircle className="w-8 h-8 text-[var(--text-tertiary)]" />
        </div>
        <h3 className="font-semibold text-[var(--text-primary)] mb-2">Bài viết không tồn tại</h3>
        <p className="text-sm text-[var(--text-secondary)] text-center mb-6">Bài viết này có thể đã bị xóa hoặc không khả dụng.</p>
        <button onClick={() => navigate(-1)} className="px-6 py-2.5 bg-[var(--primary)] text-white rounded-2xl font-semibold text-sm">
          Quay lại
        </button>
      </div>
    );
  }

  const author = getUserById(post.authorId);
  if (!author) return null;

  const isOwnPost = post.authorId === currentUser.id;

  // Check access restrictions
  if (!isOwnPost) {
    if (post.audience === 'private') {
      return (
        <div className="min-h-screen bg-[var(--background)]">
          <div className="max-w-2xl mx-auto">
            <div className="sticky top-0 z-20 bg-[var(--background)]/95 backdrop-blur-sm border-b border-[var(--border)] px-4 py-3 flex items-center gap-3">
              <button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-[var(--surface)] text-[var(--text-secondary)]">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <h1 className="font-semibold text-[var(--text-primary)]">Bài viết</h1>
            </div>
            <RestrictedContent audience="private" authorName={author.displayName} onGoBack={() => navigate(-1)} />
          </div>
        </div>
      );
    }
    if (post.audience === 'followers' && !author.isFollowing) {
      return (
        <div className="min-h-screen bg-[var(--background)]">
          <div className="max-w-2xl mx-auto">
            <div className="sticky top-0 z-20 bg-[var(--background)]/95 backdrop-blur-sm border-b border-[var(--border)] px-4 py-3 flex items-center gap-3">
              <button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-[var(--surface)] text-[var(--text-secondary)]">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <h1 className="font-semibold text-[var(--text-primary)]">Bài viết</h1>
            </div>
            <RestrictedContent audience="followers" authorName={author.displayName} onGoBack={() => navigate(-1)} />
          </div>
        </div>
      );
    }
  }

  const relatedPosts = posts.filter(p => p.id !== post.id && p.audience === 'public' && p.topics.some(t => post.topics.includes(t))).slice(0, 2);

  const handleSendComment = () => {
    if (!commentText.trim()) return;
    addComment(post.id, commentText.trim());
    setCommentText('');
    toast.success('Đã gửi bình luận');
  };

  const moreActions: BottomSheetAction[] = isOwnPost
    ? [
        { icon: <Trash2 className="w-5 h-5" />, label: 'Xóa bài viết', description: 'Bài viết sẽ bị xóa vĩnh viễn', destructive: true, onClick: () => { deletePost(post.id); toast.success('Đã xóa bài viết'); navigate(-1); } },
      ]
    : [
        { icon: <Flag className="w-5 h-5" />, label: 'Báo cáo bài viết', description: 'Bài viết vi phạm quy tắc cộng đồng', destructive: true, onClick: () => { reportPost(post.id, 'spam'); toast.info('Đã gửi báo cáo. Cảm ơn bạn!'); } },
        { icon: <EyeOff className="w-5 h-5" />, label: 'Ẩn bài viết này', description: 'Bạn sẽ không thấy bài viết này nữa', onClick: () => { hidePost(post.id); toast.success('Đã ẩn bài viết'); navigate(-1); } },
        { icon: <Ban className="w-5 h-5" />, label: `Chặn ${author.displayName}`, description: 'Bạn sẽ không thấy nội dung từ người này', destructive: true, onClick: () => { blockUser(author.id); toast.success(`Đã chặn ${author.displayName}`); navigate(-1); } },
      ];

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="sticky top-0 z-20 bg-[var(--background)]/95 backdrop-blur-sm border-b border-[var(--border)] px-4 py-3 flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-[var(--surface)] text-[var(--text-secondary)]">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h1 className="font-semibold text-[var(--text-primary)]">Bài viết</h1>
          <button onClick={() => setShowActionSheet(true)} className="p-2 rounded-xl hover:bg-[var(--surface)] text-[var(--text-secondary)]">
            <MoreHorizontal className="w-5 h-5" />
          </button>
        </div>

        <div className="pb-24">
          {/* Post Content */}
          <div className="px-4 pt-4 pb-3">
            {/* Author */}
            <div className="flex items-center gap-3 mb-4">
              <button onClick={() => navigate(`/community/profile/${author.id}`)}>
                <img src={author.avatar} alt={author.displayName} className="w-12 h-12 rounded-full object-cover" />
              </button>
              <div className="flex-1">
                <div className="flex items-center gap-1.5">
                  <button onClick={() => navigate(`/community/profile/${author.id}`)} className="font-semibold text-[var(--text-primary)] hover:underline">
                    {author.displayName}
                  </button>
                  <BadgeIcon badge={author.badge} />
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <p className="text-xs text-[var(--text-tertiary)]">@{author.username} · {formatTimeAgo(post.createdAt)}</p>
                  <AudienceBadge audience={post.audience} />
                </div>
              </div>
            </div>

            {/* Content */}
            <p className="text-[var(--text-primary)] whitespace-pre-wrap leading-relaxed mb-4">{post.content}</p>

            {/* Recap Card */}
            {post.recapData && (
              <div className="mb-4">
                <FinanceRecapCard data={post.recapData} large showPrivacyHint />
              </div>
            )}

            {/* Topics */}
            {post.topics.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {post.topics.map(t => (
                  <TopicChip key={t} label={t} onClick={() => navigate(`/community/topic/${t}`)} />
                ))}
              </div>
            )}

            {/* Stats */}
            <div className="flex items-center gap-4 py-3 border-t border-b border-[var(--divider)] text-sm text-[var(--text-tertiary)]">
              <span className="tabular-nums">{post.likes} lượt thích</span>
              <span className="tabular-nums">{post.commentsCount} bình luận</span>
              <span className="tabular-nums">{post.saves} đã lưu</span>
              <span className="tabular-nums">{post.shares} chia sẻ</span>
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-around py-2 border-b border-[var(--divider)]">
              <button onClick={() => toggleLike(post.id)} className={`flex items-center gap-2 py-2 px-3 rounded-xl transition-colors ${post.isLiked ? 'text-[var(--danger)]' : 'text-[var(--text-secondary)] hover:text-[var(--danger)]'}`}>
                <Heart className={`w-5 h-5 ${post.isLiked ? 'fill-current' : ''}`} />
                <span className="text-sm">Thích</span>
              </button>
              <button className="flex items-center gap-2 py-2 px-3 rounded-xl text-[var(--text-secondary)]">
                <MessageCircle className="w-5 h-5" />
                <span className="text-sm">Bình luận</span>
              </button>
              <button onClick={() => toggleSave(post.id)} className={`flex items-center gap-2 py-2 px-3 rounded-xl transition-colors ${post.isSaved ? 'text-[var(--warning)]' : 'text-[var(--text-secondary)] hover:text-[var(--warning)]'}`}>
                <Bookmark className={`w-5 h-5 ${post.isSaved ? 'fill-current' : ''}`} />
                <span className="text-sm">Lưu</span>
              </button>
              <button className="flex items-center gap-2 py-2 px-3 rounded-xl text-[var(--text-secondary)] hover:text-[var(--primary)]">
                <Share2 className="w-5 h-5" />
                <span className="text-sm">Chia sẻ</span>
              </button>
            </div>
          </div>

          {/* Comments */}
          <div className="px-4 py-3">
            <h3 className="font-semibold text-sm text-[var(--text-primary)] mb-3">Bình luận ({post.commentsCount})</h3>
            {post.comments.length === 0 ? (
              <div className="text-center py-8">
                <MessageCircle className="w-8 h-8 text-[var(--text-tertiary)] mx-auto mb-2" />
                <p className="text-sm text-[var(--text-tertiary)]">Chưa có bình luận nào</p>
                <p className="text-xs text-[var(--text-tertiary)] mt-1">Hãy là người đầu tiên chia sẻ ý kiến!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {post.comments.map(comment => {
                  const commentUser = getUserById(comment.userId);
                  if (!commentUser) return null;
                  return (
                    <div key={comment.id}>
                      <div className="flex gap-3">
                        <button onClick={() => navigate(`/community/profile/${commentUser.id}`)}>
                          <img src={commentUser.avatar} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                        </button>
                        <div className="flex-1">
                          <div className="bg-[var(--surface)] rounded-2xl px-3.5 py-2.5">
                            <div className="flex items-center gap-1.5">
                              <p className="font-semibold text-xs text-[var(--text-primary)]">{commentUser.displayName}</p>
                              <BadgeIcon badge={commentUser.badge} />
                            </div>
                            <p className="text-sm text-[var(--text-primary)] mt-0.5">{comment.content}</p>
                          </div>
                          <div className="flex items-center gap-3 mt-1 px-2">
                            <span className="text-xs text-[var(--text-tertiary)]">{formatTimeAgo(comment.createdAt)}</span>
                            <button
                              onClick={() => toggleCommentLike(post.id, comment.id)}
                              className={`text-xs font-medium ${comment.isLiked ? 'text-[var(--danger)]' : 'text-[var(--text-tertiary)]'}`}
                            >
                              Thích {comment.likes > 0 && `(${comment.likes})`}
                            </button>
                            <button className="text-xs font-medium text-[var(--text-tertiary)]">Trả lời</button>
                          </div>

                          {/* Replies */}
                          {comment.replies && comment.replies.map(reply => {
                            const replyUser = getUserById(reply.userId);
                            if (!replyUser) return null;
                            return (
                              <div key={reply.id} className="flex gap-2.5 mt-3 ml-4">
                                <img src={replyUser.avatar} alt="" className="w-6 h-6 rounded-full object-cover flex-shrink-0" />
                                <div className="flex-1">
                                  <div className="bg-[var(--surface)] rounded-xl px-3 py-2">
                                    <div className="flex items-center gap-1">
                                      <p className="font-semibold text-xs text-[var(--text-primary)]">{replyUser.displayName}</p>
                                      <BadgeIcon badge={replyUser.badge} />
                                    </div>
                                    <p className="text-xs text-[var(--text-primary)] mt-0.5">{reply.content}</p>
                                  </div>
                                  <div className="flex items-center gap-3 mt-1 px-2">
                                    <span className="text-xs text-[var(--text-tertiary)]">{formatTimeAgo(reply.createdAt)}</span>
                                    <button className="text-xs font-medium text-[var(--text-tertiary)]">Thích</button>
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

          {/* Related Posts */}
          {relatedPosts.length > 0 && (
            <div className="px-4 py-4 border-t border-[var(--divider)]">
              <h3 className="font-semibold text-sm text-[var(--text-primary)] mb-3">Bài viết liên quan</h3>
              <div className="space-y-3">
                {relatedPosts.map(rp => (
                  <PostCard key={rp.id} post={rp} compact onPostClick={(pid) => navigate(`/community/post/${pid}`)} onAuthorClick={(uid) => navigate(`/community/profile/${uid}`)} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sticky Comment Input */}
        <div className="fixed bottom-0 left-0 right-0 bg-[var(--card)] border-t border-[var(--border)] px-4 py-3 z-30 safe-area-inset-bottom">
          <div className="max-w-2xl mx-auto flex items-center gap-3">
            <img src={currentUser.avatar} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
            <input
              type="text"
              placeholder="Viết bình luận..."
              value={commentText}
              onChange={e => setCommentText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSendComment()}
              className="flex-1 bg-[var(--surface)] rounded-xl px-4 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none focus:ring-2 focus:ring-[var(--primary)]"
            />
            <button
              onClick={handleSendComment}
              disabled={!commentText.trim()}
              className={`p-2.5 rounded-xl transition-colors ${commentText.trim() ? 'bg-[var(--primary)] text-white' : 'bg-[var(--surface)] text-[var(--text-tertiary)]'}`}
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Action Sheet */}
        <BottomSheetActions
          open={showActionSheet}
          onClose={() => setShowActionSheet(false)}
          title={isOwnPost ? 'Bài viết của bạn' : 'Tùy chọn'}
          subtitle={isOwnPost ? undefined : `Bài viết bởi ${author.displayName}`}
          actions={moreActions}
        />
      </div>
    </div>
  );
}

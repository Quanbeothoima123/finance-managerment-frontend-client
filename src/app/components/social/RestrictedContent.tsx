import React from 'react';
import { Lock, Users, ShieldOff } from 'lucide-react';
import type { Audience } from '../../contexts/SocialDataContext';

interface RestrictedContentProps {
  audience: Audience;
  authorName?: string;
  onGoBack?: () => void;
}

export function RestrictedContent({ audience, authorName, onGoBack }: RestrictedContentProps) {
  const isFollowersOnly = audience === 'followers';

  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-5 ${
        isFollowersOnly ? 'bg-[var(--primary-light)]' : 'bg-[var(--surface)]'
      }`}>
        {isFollowersOnly ? (
          <Users className="w-8 h-8 text-[var(--primary)]" />
        ) : audience === 'private' ? (
          <Lock className="w-8 h-8 text-[var(--text-tertiary)]" />
        ) : (
          <ShieldOff className="w-8 h-8 text-[var(--text-tertiary)]" />
        )}
      </div>
      <h3 className="font-semibold text-lg text-[var(--text-primary)] mb-2">
        {isFollowersOnly
          ? 'Chỉ người theo dõi mới xem được'
          : audience === 'private'
            ? 'Bài viết riêng tư'
            : 'Bài viết không khả dụng'}
      </h3>
      <p className="text-sm text-[var(--text-secondary)] max-w-xs mb-6 leading-relaxed">
        {isFollowersOnly
          ? `Theo dõi ${authorName || 'người dùng này'} để xem bài viết này và các nội dung khác của họ.`
          : audience === 'private'
            ? 'Bài viết này được đặt ở chế độ riêng tư và chỉ hiển thị cho tác giả.'
            : 'Bài viết này hiện không khả dụng với bạn.'}
      </p>
      {isFollowersOnly && (
        <button className="px-6 py-2.5 bg-[var(--primary)] text-white rounded-2xl font-semibold text-sm hover:bg-[var(--primary-hover)] transition-colors">
          Theo dõi
        </button>
      )}
      {onGoBack && (
        <button
          onClick={onGoBack}
          className="mt-3 px-6 py-2.5 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
        >
          Quay lại
        </button>
      )}
    </div>
  );
}

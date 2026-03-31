import React from 'react';
import { ShieldAlert } from 'lucide-react';

interface SensitiveInfoBannerProps {
  variant?: 'warning' | 'info';
  title?: string;
  description?: string;
}

export function SensitiveInfoBanner({
  variant = 'warning',
  title = 'Kiểm tra trước khi đăng',
  description = 'Đảm bảo bài viết không chứa thông tin tài chính nhạy cảm như số tài khoản, mật khẩu, số dư chính xác hoặc thông tin cá nhân.',
}: SensitiveInfoBannerProps) {
  const isWarning = variant === 'warning';

  return (
    <div className={`flex items-start gap-3 p-4 rounded-2xl border ${
      isWarning
        ? 'bg-[var(--warning-light)] border-[var(--warning)]/20'
        : 'bg-[var(--info-light)] border-[var(--info)]/20'
    }`}>
      <ShieldAlert className={`w-5 h-5 flex-shrink-0 mt-0.5 ${isWarning ? 'text-[var(--warning)]' : 'text-[var(--info)]'}`} />
      <div>
        <p className="text-sm font-medium text-[var(--text-primary)] mb-0.5">{title}</p>
        <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

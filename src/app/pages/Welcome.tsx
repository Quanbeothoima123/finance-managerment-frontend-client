import React from 'react';
import { useNavigate } from 'react-router';
import { Button } from '../components/Button';
import { ThemeSwitcher } from '../components/ThemeSwitcher';
import { ArrowLeft, LogIn, UserPlus } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export default function Welcome() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  return (
    <div className="min-h-screen bg-[var(--background)] flex flex-col">
      <div className="flex items-center justify-between p-6 border-b border-[var(--border)]">
        <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
          <ArrowLeft className="w-4 h-4" />
          Trở lại
        </Button>
        <ThemeSwitcher />
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-lg text-center space-y-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[var(--primary-light)] mb-4">
            <svg className="w-8 h-8 text-[var(--primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
              />
            </svg>
          </div>

          <h1 className="text-3xl font-semibold text-[var(--text-primary)]">
            Chào mừng đến với ứng dụng quản lý tài chính
          </h1>

          <p className="text-[var(--text-secondary)] leading-relaxed">
            Theo dõi chi tiêu, thiết lập ví ban đầu và bắt đầu hành trình quản lý tài chính cá nhân chỉ trong vài bước.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
            {isAuthenticated ? (
              <Button variant="primary" onClick={() => navigate('/')}>
                Tiếp tục với {user?.displayName || 'tài khoản hiện tại'}
              </Button>
            ) : (
              <>
                <Button variant="primary" onClick={() => navigate('/auth/login')}>
                  <LogIn className="w-4 h-4" />
                  Đăng nhập
                </Button>
                <Button variant="secondary" onClick={() => navigate('/auth/register')}>
                  <UserPlus className="w-4 h-4" />
                  Tạo tài khoản
                </Button>
              </>
            )}
          </div>

          <div className="pt-8 space-y-2">
            <p className="text-sm text-[var(--text-tertiary)]">Bạn sẽ được thiết lập theo thứ tự:</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {['Tiền tệ mặc định', 'Ngày bắt đầu theo dõi', 'Ví ban đầu', 'Preset danh mục'].map((feature) => (
                <span
                  key={feature}
                  className="px-3 py-1 rounded-full bg-[var(--surface)] text-xs text-[var(--text-secondary)] border border-[var(--border)]"
                >
                  {feature}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

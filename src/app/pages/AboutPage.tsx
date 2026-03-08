import React from 'react';
import { ArrowLeft, ExternalLink, Mail, Shield, FileText, Heart } from 'lucide-react';
import { Card } from '../components/Card';
import { useAppNavigation } from '../hooks/useAppNavigation';
import { useToast } from '../contexts/ToastContext';

export default function AboutPage() {
  const nav = useAppNavigation();
  const toast = useToast();

  const handleBack = () => {
    nav.goBack();
  };

  const handleLink = (link: string) => {
    toast.info('Đang mở liên kết...');
  };

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="max-w-3xl mx-auto p-4 md:p-6 pb-20 md:pb-6 space-y-6">
        {/* Header */}
        <div>
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Quay lại</span>
          </button>

          <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Giới thiệu</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Thông tin về ứng dụng và điều khoản
          </p>
        </div>

        {/* App Info Card */}
        <Card className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-[var(--primary)] to-[var(--info)] rounded-[var(--radius-xl)] mb-4">
            <span className="text-4xl">💰</span>
          </div>

          <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-1">
            Quản lý Tài chính
          </h2>
          <p className="text-sm text-[var(--text-secondary)] mb-4">
            Ứng dụng quản lý tài chính cá nhân thông minh
          </p>

          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--surface)] rounded-[var(--radius-lg)]">
            <span className="text-sm font-medium text-[var(--text-secondary)]">Phiên bản</span>
            <span className="text-sm font-bold text-[var(--primary)] tabular-nums">1.0.0</span>
          </div>

          <div className="mt-6 pt-6 border-t border-[var(--divider)]">
            <p className="text-xs text-[var(--text-secondary)]">
              Build 2026.02.12 • Made with{' '}
              <Heart className="w-3 h-3 inline text-[var(--danger)]" /> in Vietnam
            </p>
          </div>
        </Card>

        {/* Links Section */}
        <Card>
          <h3 className="font-semibold text-[var(--text-primary)] mb-4">Thông tin pháp lý</h3>

          <div className="space-y-1">
            <button
              onClick={() => handleLink('privacy')}
              className="flex items-center justify-between w-full px-4 py-3 hover:bg-[var(--surface)] rounded-[var(--radius-lg)] transition-colors"
            >
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-[var(--text-secondary)]" />
                <span className="text-sm font-medium text-[var(--text-primary)]">
                  Chính sách bảo mật
                </span>
              </div>
              <ExternalLink className="w-4 h-4 text-[var(--text-secondary)]" />
            </button>

            <button
              onClick={() => handleLink('terms')}
              className="flex items-center justify-between w-full px-4 py-3 hover:bg-[var(--surface)] rounded-[var(--radius-lg)] transition-colors"
            >
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-[var(--text-secondary)]" />
                <span className="text-sm font-medium text-[var(--text-primary)]">
                  Điều khoản sử dụng
                </span>
              </div>
              <ExternalLink className="w-4 h-4 text-[var(--text-secondary)]" />
            </button>

            <button
              onClick={() => handleLink('licenses')}
              className="flex items-center justify-between w-full px-4 py-3 hover:bg-[var(--surface)] rounded-[var(--radius-lg)] transition-colors"
            >
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-[var(--text-secondary)]" />
                <span className="text-sm font-medium text-[var(--text-primary)]">
                  Giấy phép mã nguồn mở
                </span>
              </div>
              <ExternalLink className="w-4 h-4 text-[var(--text-secondary)]" />
            </button>
          </div>
        </Card>

        {/* Contact Section */}
        <Card>
          <h3 className="font-semibold text-[var(--text-primary)] mb-4">Liên hệ & Hỗ trợ</h3>

          <div className="space-y-1">
            <button
              onClick={() => handleLink('support')}
              className="flex items-center justify-between w-full px-4 py-3 hover:bg-[var(--surface)] rounded-[var(--radius-lg)] transition-colors"
            >
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-[var(--text-secondary)]" />
                <div className="text-left">
                  <p className="text-sm font-medium text-[var(--text-primary)]">Email hỗ trợ</p>
                  <p className="text-xs text-[var(--text-secondary)]">
                    support@quanlytaichinh.vn
                  </p>
                </div>
              </div>
              <ExternalLink className="w-4 h-4 text-[var(--text-secondary)]" />
            </button>

            <button
              onClick={() => handleLink('feedback')}
              className="flex items-center justify-between w-full px-4 py-3 hover:bg-[var(--surface)] rounded-[var(--radius-lg)] transition-colors"
            >
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-[var(--text-secondary)]" />
                <div className="text-left">
                  <p className="text-sm font-medium text-[var(--text-primary)]">Gửi phản hồi</p>
                  <p className="text-xs text-[var(--text-secondary)]">
                    Giúp chúng tôi cải thiện ứng dụng
                  </p>
                </div>
              </div>
              <ExternalLink className="w-4 h-4 text-[var(--text-secondary)]" />
            </button>
          </div>
        </Card>

        {/* Technical Info */}
        <Card className="bg-[var(--surface)]">
          <h3 className="font-semibold text-[var(--text-primary)] mb-4">Thông tin kỹ thuật</h3>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-[var(--text-secondary)]">Phiên bản ứng dụng</span>
              <span className="font-mono font-semibold text-[var(--text-primary)]">1.0.0</span>
            </div>

            <div className="flex justify-between">
              <span className="text-[var(--text-secondary)]">Build number</span>
              <span className="font-mono font-semibold text-[var(--text-primary)]">
                2026.02.12
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-[var(--text-secondary)]">Framework</span>
              <span className="font-semibold text-[var(--text-primary)]">React 18.3.1</span>
            </div>

            <div className="flex justify-between">
              <span className="text-[var(--text-secondary)]">Dung lượng</span>
              <span className="font-semibold text-[var(--text-primary)]">14.8 MB</span>
            </div>
          </div>
        </Card>

        {/* Credits */}
        <Card>
          <h3 className="font-semibold text-[var(--text-primary)] mb-4">Thư viện & Công nghệ</h3>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="p-3 bg-[var(--surface)] rounded-[var(--radius-lg)]">
              <p className="font-semibold text-[var(--text-primary)] mb-1">React Router</p>
              <p className="text-xs text-[var(--text-secondary)]">v7.13.0</p>
            </div>

            <div className="p-3 bg-[var(--surface)] rounded-[var(--radius-lg)]">
              <p className="font-semibold text-[var(--text-primary)] mb-1">Tailwind CSS</p>
              <p className="text-xs text-[var(--text-secondary)]">v4.1.12</p>
            </div>

            <div className="p-3 bg-[var(--surface)] rounded-[var(--radius-lg)]">
              <p className="font-semibold text-[var(--text-primary)] mb-1">Recharts</p>
              <p className="text-xs text-[var(--text-secondary)]">v2.15.2</p>
            </div>

            <div className="p-3 bg-[var(--surface)] rounded-[var(--radius-lg)]">
              <p className="font-semibold text-[var(--text-primary)] mb-1">Lucide React</p>
              <p className="text-xs text-[var(--text-secondary)]">v0.487.0</p>
            </div>
          </div>

          <button
            onClick={() => handleLink('all-licenses')}
            className="mt-4 w-full text-center text-sm text-[var(--primary)] hover:text-[var(--primary-hover)] font-medium transition-colors"
          >
            Xem tất cả giấy phép →
          </button>
        </Card>

        {/* Copyright */}
        <div className="text-center py-6">
          <p className="text-sm text-[var(--text-secondary)]">
            © 2026 Quản lý Tài chính. Đã đăng ký Bản quyền.
          </p>
          <p className="text-xs text-[var(--text-tertiary)] mt-1">
            Được phát triển tại Việt Nam 🇻🇳
          </p>
        </div>
      </div>
    </div>
  );
}
import {
  User,
  Globe,
  Shield,
  Database,
  Info,
  ChevronRight,
  Calendar,
  DollarSign,
  Rocket,
  Eye,
  Bell,
  SlidersHorizontal,
  Crown,
  Paperclip,
  LogIn,
} from 'lucide-react';
import { Card } from '../components/Card';
import { useAppNavigation } from '../hooks/useAppNavigation';
import { useToast } from '../contexts/ToastContext';
import { useDemoData } from '../contexts/DemoDataContext';
import { useNavigate } from 'react-router';

interface SettingItemProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
}

function SettingItem({ icon, title, description, onClick }: SettingItemProps) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-4 p-4 hover:bg-[var(--surface)] rounded-[var(--radius-lg)] transition-colors w-full text-left"
    >
      <div className="flex-shrink-0 w-12 h-12 bg-[var(--primary-light)] text-[var(--primary)] rounded-[var(--radius-lg)] flex items-center justify-center">
        {icon}
      </div>

      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-[var(--text-primary)]">{title}</h3>
        <p className="text-sm text-[var(--text-secondary)]">{description}</p>
      </div>

      <ChevronRight className="w-5 h-5 text-[var(--text-secondary)] flex-shrink-0" />
    </button>
  );
}

export default function SettingsHome() {
  const nav = useAppNavigation();
  const toast = useToast();
  const navigate = useNavigate();
  const { isPro, setIsPro } = useDemoData();

  const handleNavigation = (section: string) => {
    switch (section) {
      case 'profile':
        toast.info('Đang mở hồ sơ cá nhân');
        break;
      case 'currency':
        nav.goGeneralSettings();
        break;
      case 'security':
        nav.goSecuritySettings();
        break;
      case 'notifications':
        nav.goNotificationSettings();
        break;
      case 'data':
        nav.goBackupSettings();
        break;
      case 'about':
        nav.goAbout();
        break;
      default:
        break;
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Desktop: Two Column Layout */}
      <div className="hidden md:flex h-screen">
        {/* Left Menu */}
        <div className="w-80 bg-[var(--card)] border-r border-[var(--divider)] p-6 overflow-y-auto">
          <h1 className="text-2xl font-semibold text-[var(--text-primary)] mb-6">Cài đặt</h1>

          <nav className="space-y-2">
            <button
              onClick={() => handleNavigation('profile')}
              className="flex items-center gap-3 w-full px-4 py-3 hover:bg-[var(--surface)] rounded-[var(--radius-lg)] transition-colors text-left bg-[var(--primary-light)] border border-[var(--primary)]"
            >
              <User className="w-5 h-5 text-[var(--primary)]" />
              <span className="font-medium text-[var(--text-primary)]">Hồ sơ</span>
            </button>

            <button
              onClick={() => handleNavigation('currency')}
              className="flex items-center gap-3 w-full px-4 py-3 hover:bg-[var(--surface)] rounded-[var(--radius-lg)] transition-colors text-left"
            >
              <Globe className="w-5 h-5 text-[var(--text-secondary)]" />
              <span className="font-medium text-[var(--text-primary)]">Tiền tệ & Tuần</span>
            </button>

            <button
              onClick={() => handleNavigation('security')}
              className="flex items-center gap-3 w-full px-4 py-3 hover:bg-[var(--surface)] rounded-[var(--radius-lg)] transition-colors text-left"
            >
              <Shield className="w-5 h-5 text-[var(--text-secondary)]" />
              <span className="font-medium text-[var(--text-primary)]">Bảo mật</span>
            </button>

            <button
              onClick={() => handleNavigation('notifications')}
              className="flex items-center gap-3 w-full px-4 py-3 hover:bg-[var(--surface)] rounded-[var(--radius-lg)] transition-colors text-left"
            >
              <Bell className="w-5 h-5 text-[var(--text-secondary)]" />
              <span className="font-medium text-[var(--text-primary)]">Thông báo</span>
            </button>

            <button
              onClick={() => handleNavigation('data')}
              className="flex items-center gap-3 w-full px-4 py-3 hover:bg-[var(--surface)] rounded-[var(--radius-lg)] transition-colors text-left"
            >
              <Database className="w-5 h-5 text-[var(--text-secondary)]" />
              <span className="font-medium text-[var(--text-primary)]">Dữ liệu & Sao lưu</span>
            </button>

            <button
              onClick={() => nav.goAttachments()}
              className="flex items-center gap-3 w-full px-4 py-3 hover:bg-[var(--surface)] rounded-[var(--radius-lg)] transition-colors text-left"
            >
              <Paperclip className="w-5 h-5 text-[var(--text-secondary)]" />
              <span className="font-medium text-[var(--text-primary)]">Thư viện đính kèm</span>
            </button>

            <button
              onClick={() => handleNavigation('about')}
              className="flex items-center gap-3 w-full px-4 py-3 hover:bg-[var(--surface)] rounded-[var(--radius-lg)] transition-colors text-left"
            >
              <Info className="w-5 h-5 text-[var(--text-secondary)]" />
              <span className="font-medium text-[var(--text-primary)]">Giới thiệu</span>
            </button>

            {/* Demo Section Divider */}
            <div className="pt-4 mt-4 border-t border-[var(--divider)]">
              <p className="px-4 mb-2 text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">Demo</p>
              {/* Pro Toggle */}
              <div className="flex items-center gap-3 w-full px-4 py-3">
                <Crown className={`w-5 h-5 ${isPro ? 'text-amber-500' : 'text-[var(--text-secondary)]'}`} />
                <span className="font-medium text-[var(--text-primary)] flex-1">Pro</span>
                {isPro && (
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-amber-100 text-amber-700">ON</span>
                )}
                <button
                  onClick={() => {
                    setIsPro(!isPro);
                    toast.success(isPro ? 'Đã huỷ Pro (Demo)' : 'Đã kích hoạt Pro! (Demo)');
                  }}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${isPro ? 'bg-amber-500' : 'bg-[var(--border)]'}`}
                >
                  <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${isPro ? 'translate-x-[18px]' : 'translate-x-[3px]'}`} />
                </button>
              </div>
              <button
                onClick={() => navigate('/demo/hub')}
                className="flex items-center gap-3 w-full px-4 py-3 hover:bg-[var(--surface)] rounded-[var(--radius-lg)] transition-colors text-left"
              >
                <Eye className="w-5 h-5 text-[var(--text-secondary)]" />
                <span className="font-medium text-[var(--text-primary)]">Demo Hub</span>
              </button>
              <button
                onClick={() => navigate('/demo/empty-home')}
                className="flex items-center gap-3 w-full px-4 py-3 hover:bg-[var(--surface)] rounded-[var(--radius-lg)] transition-colors text-left"
              >
                <Rocket className="w-5 h-5 text-[var(--text-secondary)]" />
                <span className="font-medium text-[var(--text-primary)]">Preview Empty Home</span>
              </button>
              <button
                onClick={() => navigate('/auth/login')}
                className="flex items-center gap-3 w-full px-4 py-3 hover:bg-[var(--surface)] rounded-[var(--radius-lg)] transition-colors text-left"
              >
                <LogIn className="w-5 h-5 text-[var(--text-secondary)]" />
                <span className="font-medium text-[var(--text-primary)]">Đăng nhập / Đăng ký</span>
              </button>
              <button
                onClick={() => navigate('/auth/forgot-password')}
                className="flex items-center gap-3 w-full px-4 py-3 hover:bg-[var(--surface)] rounded-[var(--radius-lg)] transition-colors text-left"
              >
                <LogIn className="w-5 h-5 text-[var(--text-secondary)]" />
                <span className="font-medium text-[var(--text-primary)]">Quên mật khẩu</span>
              </button>
              <button
                onClick={() => navigate('/auth/verify-otp?purpose=email-verification&email=demo@finance.app')}
                className="flex items-center gap-3 w-full px-4 py-3 hover:bg-[var(--surface)] rounded-[var(--radius-lg)] transition-colors text-left"
              >
                <LogIn className="w-5 h-5 text-[var(--text-secondary)]" />
                <span className="font-medium text-[var(--text-primary)]">Xác minh OTP</span>
              </button>
            </div>
          </nav>
        </div>

        {/* Right Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-3xl space-y-6">
            <div>
              <h2 className="text-2xl font-semibold text-[var(--text-primary)] mb-2">Hồ sơ</h2>
              <p className="text-sm text-[var(--text-secondary)]">
                Quản lý thông tin cá nhân của bạn
              </p>
            </div>

            <Card>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-[var(--primary)] to-[var(--info)] rounded-full flex items-center justify-center text-white text-2xl font-bold">
                  NV
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-[var(--text-primary)]">
                    Nguyễn Văn A
                  </h3>
                  <p className="text-sm text-[var(--text-secondary)]">nguyenvana@example.com</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                    Họ và tên
                  </label>
                  <input
                    type="text"
                    defaultValue="Nguyễn Văn A"
                    className="w-full px-4 py-2.5 bg-[var(--input-background)] border border-[var(--border)] rounded-[var(--radius-lg)] text-[var(--text-primary)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    defaultValue="nguyenvana@example.com"
                    className="w-full px-4 py-2.5 bg-[var(--input-background)] border border-[var(--border)] rounded-[var(--radius-lg)] text-[var(--text-primary)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]"
                  />
                </div>

                <button className="w-full md:w-auto px-6 py-2.5 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white rounded-[var(--radius-lg)] font-medium transition-colors"
                  onClick={() => toast.success('Đã lưu thông tin hồ sơ')}
                >
                  Lưu thay đổi
                </button>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Mobile: Stacked Cards */}
      <div className="md:hidden p-4 pb-20 space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Cài đặt</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Quản lý tài khoản và tuỳ chọn
          </p>
        </div>

        {/* Profile Card */}
        <Card>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-[var(--primary)] to-[var(--info)] rounded-full flex items-center justify-center text-white text-xl font-bold">
              NV
            </div>
            <div>
              <h3 className="font-semibold text-[var(--text-primary)]">Nguyễn Văn A</h3>
              <p className="text-sm text-[var(--text-secondary)]">nguyenvana@example.com</p>
            </div>
          </div>
          <button
            onClick={() => handleNavigation('profile')}
            className="flex items-center justify-between w-full px-4 py-3 bg-[var(--surface)] hover:bg-[var(--border)] rounded-[var(--radius-lg)] transition-colors"
          >
            <span className="text-sm font-medium text-[var(--text-primary)]">Chỉnh sửa hồ sơ</span>
            <ChevronRight className="w-5 h-5 text-[var(--text-secondary)]" />
          </button>
        </Card>

        {/* Settings Sections */}
        <Card>
          <h3 className="font-semibold text-[var(--text-primary)] mb-4">Cài đặt chung</h3>

          <div className="space-y-1">
            <SettingItem
              icon={<SlidersHorizontal className="w-6 h-6" />}
              title="Chung (Tiền tệ & định dạng)"
              description="Currency, định dạng số/ngày, timezone"
              onClick={() => handleNavigation('currency')}
            />
          </div>
        </Card>

        <Card>
          <h3 className="font-semibold text-[var(--text-primary)] mb-4">Bảo mật & Dữ liệu</h3>

          <div className="space-y-1">
            <SettingItem
              icon={<Shield className="w-6 h-6" />}
              title="Bảo mật"
              description="PIN, sinh trắc học, chế độ riêng tư"
              onClick={() => handleNavigation('security')}
            />

            <SettingItem
              icon={<Bell className="w-6 h-6" />}
              title="Thông báo"
              description="Nhắc nhở, cảnh báo, giờ yên lặng"
              onClick={() => handleNavigation('notifications')}
            />

            <SettingItem
              icon={<Database className="w-6 h-6" />}
              title="Dữ liệu & Sao lưu"
              description="Nhập, xuất, khôi phục dữ liệu"
              onClick={() => handleNavigation('data')}
            />

            <SettingItem
              icon={<Paperclip className="w-6 h-6" />}
              title="Thư viện đính kèm"
              description="Quản lý và xem các tệp đính kèm"
              onClick={() => nav.goAttachments()}
            />
          </div>
        </Card>

        <Card>
          <h3 className="font-semibold text-[var(--text-primary)] mb-4">Thông tin</h3>

          <div className="space-y-1">
            <SettingItem
              icon={<Info className="w-6 h-6" />}
              title="Giới thiệu"
              description="Phiên bản, điều khoản, chính sách"
              onClick={() => handleNavigation('about')}
            />
          </div>
        </Card>

        {/* Demo Section */}
        <Card>
          <h3 className="font-semibold text-[var(--text-primary)] mb-4">Demo & Preview</h3>

          <div className="space-y-1">
            {/* Pro Toggle */}
            <div className="flex items-center gap-4 p-4 rounded-[var(--radius-lg)]">
              <div className={`flex-shrink-0 w-12 h-12 rounded-[var(--radius-lg)] flex items-center justify-center ${isPro ? 'bg-gradient-to-br from-amber-400 to-orange-500' : 'bg-amber-50'}`}>
                <Crown className={`w-6 h-6 ${isPro ? 'text-white' : 'text-amber-500'}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-[var(--text-primary)]">Tài khoản Pro</h3>
                  {isPro && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-700">ACTIVE</span>
                  )}
                </div>
                <p className="text-sm text-[var(--text-secondary)]">Bật/tắt tính năng Pro (demo)</p>
              </div>
              <button
                onClick={() => {
                  setIsPro(!isPro);
                  toast.success(isPro ? 'Đã huỷ Pro (Demo)' : 'Đã kích hoạt Pro! (Demo)');
                }}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isPro ? 'bg-amber-500' : 'bg-[var(--border)]'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isPro ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>

            <SettingItem
              icon={<Eye className="w-6 h-6" />}
              title="Demo Hub"
              description="Truy cập nhanh tất cả màn hình"
              onClick={() => navigate('/demo/hub')}
            />

            <SettingItem
              icon={<Rocket className="w-6 h-6" />}
              title="Preview Empty Home"
              description="Xem trước màn hình first-run"
              onClick={() => navigate('/demo/empty-home')}
            />

            <SettingItem
              icon={<LogIn className="w-6 h-6" />}
              title="Đăng nhập / Đăng ký"
              description="Truy cập tài khoản của bạn"
              onClick={() => navigate('/auth/login')}
            />
            <SettingItem
              icon={<LogIn className="w-6 h-6" />}
              title="Quên mật khẩu"
              description="Khôi phục mật khẩu của bạn"
              onClick={() => navigate('/auth/forgot-password')}
            />
            <SettingItem
              icon={<LogIn className="w-6 h-6" />}
              title="Xác minh OTP"
              description="Xác minh tài khoản của bạn"
              onClick={() => navigate('/auth/verify-otp?purpose=email-verification&email=demo@finance.app')}
            />
          </div>
        </Card>
      </div>
    </div>
  );
}
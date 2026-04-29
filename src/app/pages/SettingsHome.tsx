import React, { useRef, useState } from "react";
import {
  User,
  Globe,
  Shield,
  Database,
  Info,
  ChevronRight,
  Bell,
  SlidersHorizontal,
  Crown,
  Paperclip,
  LogIn,
  Eye,
  Rocket,
  Camera,
} from "lucide-react";
import { Card } from "../components/Card";
import { useAppNavigation } from "../hooks/useAppNavigation";
import { useToast } from "../contexts/ToastContext";
import { useAppData } from "../contexts/AppDataContext";
import { useNavigate } from "react-router";
import { useAuth } from "../hooks/useAuth";
import { authService } from "../services/authService";
import { useTranslation } from "react-i18next";

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
  const { isPro, setIsPro } = useAppData();
  const { user, setSession, accessToken } = useAuth();
  const { t } = useTranslation("settings");

  const [displayName, setDisplayName] = useState(user?.displayName ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarLightboxOpen, setAvatarLightboxOpen] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const initials = user?.displayName
    ? user.displayName
        .split(" ")
        .map((w) => w[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "?";

  const handleSaveProfile = async () => {
    if (!displayName.trim()) {
      toast.error(t("home.toast.display_name_empty"));
      return;
    }
    setIsSaving(true);
    try {
      const updated = await authService.updateProfile({
        displayName: displayName.trim(),
      });
      if (updated) {
        setSession({
          accessToken: accessToken ?? "",
          user: updated,
          rememberMe: true,
        });
      }
      toast.success(t("home.toast.profile_saved"));
    } catch (err: any) {
      toast.error(err?.message ?? t("home.toast.profile_save_failed"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingAvatar(true);
    try {
      await authService.uploadAvatar(file);
      toast.success(t("home.toast.avatar_updated"));
      // reload user
      const updated = await authService.me();
      if (updated) {
        setSession({
          accessToken: accessToken ?? "",
          user: updated,
          rememberMe: true,
        });
      }
    } catch (err: any) {
      toast.error(err?.message ?? t("home.toast.avatar_failed"));
    } finally {
      setIsUploadingAvatar(false);
      if (avatarInputRef.current) avatarInputRef.current.value = "";
    }
  };

  const handleNavigation = (section: string) => {
    switch (section) {
      case "profile":
        toast.info(t("home.toast.open_profile"));
        break;
      case "currency":
        nav.goGeneralSettings();
        break;
      case "security":
        nav.goSecuritySettings();
        break;
      case "notifications":
        nav.goNotificationSettings();
        break;
      case "data":
        nav.goBackupSettings();
        break;
      case "about":
        nav.goAbout();
        break;
      default:
        break;
    }
  };

  return (
    <>
      <div className="min-h-screen bg-[var(--background)]">
        {/* Desktop: Two Column Layout */}
        <div className="hidden md:flex h-screen">
          {/* Left Menu */}
          <div className="w-80 bg-[var(--card)] border-r border-[var(--divider)] p-6 overflow-y-auto">
            <h1 className="text-2xl font-semibold text-[var(--text-primary)] mb-6">
              {t("home.title")}
            </h1>

            <nav className="space-y-2">
              <button
                onClick={() => handleNavigation("profile")}
                className="flex items-center gap-3 w-full px-4 py-3 hover:bg-[var(--surface)] rounded-[var(--radius-lg)] transition-colors text-left bg-[var(--primary-light)] border border-[var(--primary)]"
              >
                <User className="w-5 h-5 text-[var(--primary)]" />
                <span className="font-medium text-[var(--text-primary)]">
                  {t("home.profile.nav_label")}
                </span>
              </button>

              <button
                onClick={() => handleNavigation("currency")}
                className="flex items-center gap-3 w-full px-4 py-3 hover:bg-[var(--surface)] rounded-[var(--radius-lg)] transition-colors text-left"
              >
                <Globe className="w-5 h-5 text-[var(--text-secondary)]" />
                <span className="font-medium text-[var(--text-primary)]">
                  {t("home.menu_items.general.title")}
                </span>
              </button>

              <button
                onClick={() => handleNavigation("security")}
                className="flex items-center gap-3 w-full px-4 py-3 hover:bg-[var(--surface)] rounded-[var(--radius-lg)] transition-colors text-left"
              >
                <Shield className="w-5 h-5 text-[var(--text-secondary)]" />
                <span className="font-medium text-[var(--text-primary)]">
                  {t("home.menu_items.security.title")}
                </span>
              </button>

              <button
                onClick={() => handleNavigation("notifications")}
                className="flex items-center gap-3 w-full px-4 py-3 hover:bg-[var(--surface)] rounded-[var(--radius-lg)] transition-colors text-left"
              >
                <Bell className="w-5 h-5 text-[var(--text-secondary)]" />
                <span className="font-medium text-[var(--text-primary)]">
                  {t("home.menu_items.notifications.title")}
                </span>
              </button>

              <button
                onClick={() => handleNavigation("data")}
                className="flex items-center gap-3 w-full px-4 py-3 hover:bg-[var(--surface)] rounded-[var(--radius-lg)] transition-colors text-left"
              >
                <Database className="w-5 h-5 text-[var(--text-secondary)]" />
                <span className="font-medium text-[var(--text-primary)]">
                  {t("home.menu_items.data_backup.title")}
                </span>
              </button>

              <button
                onClick={() => nav.goAttachments()}
                className="flex items-center gap-3 w-full px-4 py-3 hover:bg-[var(--surface)] rounded-[var(--radius-lg)] transition-colors text-left"
              >
                <Paperclip className="w-5 h-5 text-[var(--text-secondary)]" />
                <span className="font-medium text-[var(--text-primary)]">
                  {t("home.menu_items.attachment_library.title")}
                </span>
              </button>

              <button
                onClick={() => handleNavigation("about")}
                className="flex items-center gap-3 w-full px-4 py-3 hover:bg-[var(--surface)] rounded-[var(--radius-lg)] transition-colors text-left"
              >
                <Info className="w-5 h-5 text-[var(--text-secondary)]" />
                <span className="font-medium text-[var(--text-primary)]">
                  {t("home.menu_items.about.title")}
                </span>
              </button>

              {/* Demo Section Divider */}
              <div className="pt-4 mt-4 border-t border-[var(--divider)]">
                <p className="px-4 mb-2 text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">
                  Demo
                </p>
                {/* Pro Toggle */}
                <div className="flex items-center gap-3 w-full px-4 py-3">
                  <Crown
                    className={`w-5 h-5 ${isPro ? "text-amber-500" : "text-[var(--text-secondary)]"}`}
                  />
                  <span className="font-medium text-[var(--text-primary)] flex-1">
                    Pro
                  </span>
                  {isPro && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-amber-100 text-amber-700">
                      ON
                    </span>
                  )}
                  <button
                    onClick={() => {
                      setIsPro(!isPro);
                      toast.success(
                        isPro
                          ? "Đã huỷ Pro (Demo)"
                          : "Đã kích hoạt Pro! (Demo)",
                      );
                    }}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${isPro ? "bg-amber-500" : "bg-[var(--border)]"}`}
                  >
                    <span
                      className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${isPro ? "translate-x-[18px]" : "translate-x-[3px]"}`}
                    />
                  </button>
                </div>
                <button
                  onClick={() => navigate("/demo/hub")}
                  className="flex items-center gap-3 w-full px-4 py-3 hover:bg-[var(--surface)] rounded-[var(--radius-lg)] transition-colors text-left"
                >
                  <Eye className="w-5 h-5 text-[var(--text-secondary)]" />
                  <span className="font-medium text-[var(--text-primary)]">
                    Demo Hub
                  </span>
                </button>
                <button
                  onClick={() => navigate("/demo/empty-home")}
                  className="flex items-center gap-3 w-full px-4 py-3 hover:bg-[var(--surface)] rounded-[var(--radius-lg)] transition-colors text-left"
                >
                  <Rocket className="w-5 h-5 text-[var(--text-secondary)]" />
                  <span className="font-medium text-[var(--text-primary)]">
                    Preview Empty Home
                  </span>
                </button>
                <button
                  onClick={() => navigate("/auth/login")}
                  className="flex items-center gap-3 w-full px-4 py-3 hover:bg-[var(--surface)] rounded-[var(--radius-lg)] transition-colors text-left"
                >
                  <LogIn className="w-5 h-5 text-[var(--text-secondary)]" />
                  <span className="font-medium text-[var(--text-primary)]">
                    Đăng nhập / Đăng ký
                  </span>
                </button>
                <button
                  onClick={() => navigate("/auth/forgot-password")}
                  className="flex items-center gap-3 w-full px-4 py-3 hover:bg-[var(--surface)] rounded-[var(--radius-lg)] transition-colors text-left"
                >
                  <LogIn className="w-5 h-5 text-[var(--text-secondary)]" />
                  <span className="font-medium text-[var(--text-primary)]">
                    Quên mật khẩu
                  </span>
                </button>
                <button
                  onClick={() =>
                    navigate(
                      "/auth/verify-otp?purpose=email-verification&email=demo@finance.app",
                    )
                  }
                  className="flex items-center gap-3 w-full px-4 py-3 hover:bg-[var(--surface)] rounded-[var(--radius-lg)] transition-colors text-left"
                >
                  <LogIn className="w-5 h-5 text-[var(--text-secondary)]" />
                  <span className="font-medium text-[var(--text-primary)]">
                    Xác minh OTP
                  </span>
                </button>
              </div>
            </nav>
          </div>

          {/* Right Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-3xl space-y-6">
              <div>
                <h2 className="text-2xl font-semibold text-[var(--text-primary)] mb-2">
                  {t("home.profile.title")}
                </h2>
                <p className="text-sm text-[var(--text-secondary)]">
                  {t("home.profile.subtitle")}
                </p>
              </div>

              <Card>
                {/* Avatar */}
                <div className="flex items-center gap-4 mb-6">
                  <div className="relative">
                    {user?.avatarUrl ? (
                      <img
                        src={user.avatarUrl}
                        alt={user.displayName}
                        onClick={() => setAvatarLightboxOpen(true)}
                        className="w-20 h-20 rounded-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                      />
                    ) : (
                      <div className="w-20 h-20 bg-gradient-to-br from-[var(--primary)] to-[var(--info)] rounded-full flex items-center justify-center text-white text-2xl font-bold">
                        {initials}
                      </div>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        avatarInputRef.current?.click();
                      }}
                      disabled={isUploadingAvatar}
                      className="absolute -bottom-1 -right-1 w-7 h-7 bg-[var(--card)] border-2 border-[var(--border)] rounded-full flex items-center justify-center hover:bg-[var(--surface-elevated)] transition-colors disabled:opacity-60"
                      title={t("home.profile.change_avatar_title")}
                    >
                      <Camera className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
                    </button>
                    <input
                      ref={avatarInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarChange}
                    />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-[var(--text-primary)]">
                      {user?.displayName ?? "—"}
                    </h3>
                    <p className="text-sm text-[var(--text-secondary)]">
                      {user?.email ?? "—"}
                    </p>
                    {isUploadingAvatar && (
                      <p className="text-xs text-[var(--text-tertiary)] mt-1">
                        {t("home.profile.uploading")}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                      {t("home.profile.name_label")}
                    </label>
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="w-full px-4 py-2.5 bg-[var(--input-background)] border border-[var(--border)] rounded-[var(--radius-lg)] text-[var(--text-primary)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                      {t("home.profile.email_label")}
                    </label>
                    <input
                      type="email"
                      value={user?.email ?? ""}
                      readOnly
                      className="w-full px-4 py-2.5 bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-lg)] text-[var(--text-secondary)] cursor-not-allowed"
                    />
                  </div>

                  <button
                    disabled={isSaving}
                    className="w-full md:w-auto px-6 py-2.5 bg-[var(--primary)] hover:bg-[var(--primary-hover)] disabled:opacity-60 text-white rounded-[var(--radius-lg)] font-medium transition-colors"
                    onClick={handleSaveProfile}
                  >
                    {isSaving
                      ? t("home.profile.saving")
                      : t("home.profile.save_button")}
                  </button>
                </div>
              </Card>
            </div>
          </div>
        </div>

        {/* Mobile: Stacked Cards */}
        <div className="md:hidden p-4 pb-20 space-y-6">
          <div>
            <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
              {t("home.title")}
            </h1>
            <p className="text-sm text-[var(--text-secondary)] mt-1">
              {t("home.subtitle")}
            </p>
          </div>

          {/* Profile Card */}
          <Card>
            <div className="flex items-center gap-4 mb-4">
              <div className="relative">
                {user?.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.displayName}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 bg-gradient-to-br from-[var(--primary)] to-[var(--info)] rounded-full flex items-center justify-center text-white text-xl font-bold">
                    {initials}
                  </div>
                )}
              </div>
              <div>
                <h3 className="font-semibold text-[var(--text-primary)]">
                  {user?.displayName ?? "—"}
                </h3>
                <p className="text-sm text-[var(--text-secondary)]">
                  {user?.email ?? "—"}
                </p>
              </div>
            </div>
            <button
              onClick={() => handleNavigation("profile")}
              className="flex items-center justify-between w-full px-4 py-3 bg-[var(--surface)] hover:bg-[var(--border)] rounded-[var(--radius-lg)] transition-colors"
            >
              <span className="text-sm font-medium text-[var(--text-primary)]">
                {t("home.profile.edit_button")}
              </span>
              <ChevronRight className="w-5 h-5 text-[var(--text-secondary)]" />
            </button>
          </Card>

          {/* Settings Sections */}
          <Card>
            <h3 className="font-semibold text-[var(--text-primary)] mb-4">
              {t("home.sections.general")}
            </h3>

            <div className="space-y-1">
              <SettingItem
                icon={<SlidersHorizontal className="w-6 h-6" />}
                title={t("home.menu_items.general.title")}
                description={t("home.menu_items.general.description")}
                onClick={() => handleNavigation("currency")}
              />
            </div>
          </Card>

          <Card>
            <h3 className="font-semibold text-[var(--text-primary)] mb-4">
              {t("home.sections.security_data")}
            </h3>

            <div className="space-y-1">
              <SettingItem
                icon={<Shield className="w-6 h-6" />}
                title={t("home.menu_items.security.title")}
                description={t("home.menu_items.security.description")}
                onClick={() => handleNavigation("security")}
              />

              <SettingItem
                icon={<Bell className="w-6 h-6" />}
                title={t("home.menu_items.notifications.title")}
                description={t("home.menu_items.notifications.description")}
                onClick={() => handleNavigation("notifications")}
              />

              <SettingItem
                icon={<Database className="w-6 h-6" />}
                title={t("home.menu_items.data_backup.title")}
                description={t("home.menu_items.data_backup.description")}
                onClick={() => handleNavigation("data")}
              />

              <SettingItem
                icon={<Paperclip className="w-6 h-6" />}
                title={t("home.menu_items.attachment_library.title")}
                description={t(
                  "home.menu_items.attachment_library.description",
                )}
                onClick={() => nav.goAttachments()}
              />
            </div>
          </Card>

          <Card>
            <h3 className="font-semibold text-[var(--text-primary)] mb-4">
              {t("home.sections.info")}
            </h3>

            <div className="space-y-1">
              <SettingItem
                icon={<Info className="w-6 h-6" />}
                title={t("home.menu_items.about.title")}
                description={t("home.menu_items.about.description")}
                onClick={() => handleNavigation("about")}
              />
            </div>
          </Card>

          {/* Demo Section */}
          <Card>
            <h3 className="font-semibold text-[var(--text-primary)] mb-4">
              Demo & Preview
            </h3>

            <div className="space-y-1">
              {/* Pro Toggle */}
              <div className="flex items-center gap-4 p-4 rounded-[var(--radius-lg)]">
                <div
                  className={`flex-shrink-0 w-12 h-12 rounded-[var(--radius-lg)] flex items-center justify-center ${isPro ? "bg-gradient-to-br from-amber-400 to-orange-500" : "bg-amber-50"}`}
                >
                  <Crown
                    className={`w-6 h-6 ${isPro ? "text-white" : "text-amber-500"}`}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-[var(--text-primary)]">
                      Tài khoản Pro
                    </h3>
                    {isPro && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-700">
                        ACTIVE
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-[var(--text-secondary)]">
                    Bật/tắt tính năng Pro (demo)
                  </p>
                </div>
                <button
                  onClick={() => {
                    setIsPro(!isPro);
                    toast.success(
                      isPro ? "Đã huỷ Pro (Demo)" : "Đã kích hoạt Pro! (Demo)",
                    );
                  }}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isPro ? "bg-amber-500" : "bg-[var(--border)]"}`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isPro ? "translate-x-6" : "translate-x-1"}`}
                  />
                </button>
              </div>

              <SettingItem
                icon={<Eye className="w-6 h-6" />}
                title="Demo Hub"
                description="Truy cập nhanh tất cả màn hình"
                onClick={() => navigate("/demo/hub")}
              />

              <SettingItem
                icon={<Rocket className="w-6 h-6" />}
                title="Preview Empty Home"
                description="Xem trước màn hình first-run"
                onClick={() => navigate("/demo/empty-home")}
              />

              <SettingItem
                icon={<LogIn className="w-6 h-6" />}
                title="Đăng nhập / Đăng ký"
                description="Truy cập tài khoản của bạn"
                onClick={() => navigate("/auth/login")}
              />
              <SettingItem
                icon={<LogIn className="w-6 h-6" />}
                title="Quên mật khẩu"
                description="Khôi phục mật khẩu của bạn"
                onClick={() => navigate("/auth/forgot-password")}
              />
              <SettingItem
                icon={<LogIn className="w-6 h-6" />}
                title="Xác minh OTP"
                description="Xác minh tài khoản của bạn"
                onClick={() =>
                  navigate(
                    "/auth/verify-otp?purpose=email-verification&email=demo@finance.app",
                  )
                }
              />
            </div>
          </Card>
        </div>
      </div>

      {/* Avatar lightbox */}
      {avatarLightboxOpen && user?.avatarUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
          onClick={() => setAvatarLightboxOpen(false)}
        >
          <img
            src={user.avatarUrl ?? undefined}
            alt={user.displayName ?? undefined}
            onClick={(e) => e.stopPropagation()}
            className="max-w-[90vw] max-h-[90vh] rounded-2xl object-contain shadow-2xl"
          />
        </div>
      )}
    </>
  );
}

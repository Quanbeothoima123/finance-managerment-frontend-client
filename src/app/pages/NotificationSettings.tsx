import React from "react";
import {
  ArrowLeft,
  Bell,
  BellOff,
  Moon,
  RefreshCw,
  BarChart3,
  Target,
  Mail,
  Volume2,
  Vibrate,
  Smartphone,
} from "lucide-react";
import { Card } from "../components/Card";
import { Button } from "../components/Button";
import { useAppNavigation } from "../hooks/useAppNavigation";
import { useNotifications } from "../contexts/NotificationContext";
import { useToast } from "../contexts/ToastContext";

// ── Toggle Row ────────────────────────────────────────────────────────────────

interface ToggleRowProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  enabled: boolean;
  onChange: (val: boolean) => void;
  disabled?: boolean;
  badge?: string;
}

function ToggleRow({
  icon,
  title,
  description,
  enabled,
  onChange,
  disabled,
  badge,
}: ToggleRowProps) {
  return (
    <div
      className={`flex items-center gap-4 py-4 ${disabled ? "opacity-50" : ""}`}
    >
      <div className="flex-shrink-0 w-10 h-10 rounded-[var(--radius-lg)] bg-[var(--primary-light)] text-[var(--primary)] flex items-center justify-center">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-[var(--text-primary)]">
            {title}
          </span>
          {badge && (
            <span className="px-2 py-0.5 rounded-full bg-[var(--surface)] text-[var(--text-tertiary)] text-xs font-medium">
              {badge}
            </span>
          )}
        </div>
        <p className="text-xs text-[var(--text-secondary)] mt-0.5">
          {description}
        </p>
      </div>
      <button
        onClick={() => !disabled && onChange(!enabled)}
        disabled={disabled}
        className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${
          enabled ? "bg-[var(--success)]" : "bg-[var(--border)]"
        } ${disabled ? "cursor-not-allowed" : "cursor-pointer"}`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform shadow-sm ${
            enabled ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function NotificationSettings() {
  const nav = useAppNavigation();
  const toast = useToast();
  const { settings, updateSettings } = useNotifications();

  const handleSave = () => {
    toast.success("Đã lưu cài đặt thông báo");
  };

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="max-w-3xl mx-auto p-4 md:p-6 pb-20 md:pb-6 space-y-6">
        {/* Header */}
        <div>
          <button
            onClick={() => nav.goBack()}
            className="flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Quay lại</span>
          </button>
          <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
            Thông báo
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Quản lý cách ứng dụng thông báo cho bạn.
          </p>
        </div>

        {/* ─── Section A: OS Permissions (UI-only) ────────────────── */}
        <Card>
          <h3 className="font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
            <Bell className="w-5 h-5 text-[var(--primary)]" />
            Quyền hệ thống
          </h3>

          <div className="flex items-center gap-4 p-4 bg-[var(--surface)] rounded-[var(--radius-lg)]">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-[var(--text-primary)]">
                  System Permissions
                </span>
                <span className="px-2 py-0.5 rounded-full bg-[var(--success-light)] text-[var(--success)] text-xs font-semibold">
                  Enabled
                </span>
              </div>
              <p className="text-xs text-[var(--text-secondary)]">
                Nếu bị tắt, nhắc nhở vẫn xuất hiện trong Hộp thư ứng dụng.
              </p>
            </div>
            <Button
              variant="secondary"
              onClick={() => toast.info("Mở cài đặt hệ thống (UI-only)")}
              className="text-sm flex-shrink-0"
            >
              Mở cài đặt
            </Button>
          </div>
        </Card>

        {/* ─── Section B: Notification Types ──────────────────────── */}
        <Card>
          <h3 className="font-semibold text-[var(--text-primary)] mb-2">
            Loại thông báo
          </h3>
          <p className="text-xs text-[var(--text-tertiary)] mb-4">
            Bật hoặc tắt từng loại thông báo riêng biệt.
          </p>

          <div className="divide-y divide-[var(--divider)]">
            <ToggleRow
              icon={<RefreshCw className="w-5 h-5" />}
              title="Nhắc nhở giao dịch định kỳ"
              description="Thông báo khi có giao dịch định kỳ đến hạn."
              enabled={settings.recurringReminders}
              onChange={(val) => updateSettings({ recurringReminders: val })}
            />
            <ToggleRow
              icon={<BarChart3 className="w-5 h-5" />}
              title="Cảnh báo vượt ngân sách"
              description="Nhắc khi chi tiêu gần hoặc vượt giới hạn ngân sách."
              enabled={settings.budgetAlerts}
              onChange={(val) => updateSettings({ budgetAlerts: val })}
            />
            <ToggleRow
              icon={<Target className="w-5 h-5" />}
              title="Nhắc nhở mục tiêu tiết kiệm"
              description="Nhắc đóng góp cho mục tiêu tiết kiệm."
              enabled={settings.goalReminders}
              onChange={(val) => updateSettings({ goalReminders: val })}
            />
            <ToggleRow
              icon={<Mail className="w-5 h-5" />}
              title="Tổng kết tuần"
              description="Nhận báo cáo tóm tắt chi tiêu hàng tuần."
              enabled={settings.weeklyRecap}
              onChange={() => {}}
              disabled
              badge="Sắp ra mắt"
            />
          </div>
        </Card>

        {/* ─── Section C: Sound & Vibration ───────────────────────── */}
        <Card>
          <h3 className="font-semibold text-[var(--text-primary)] mb-2 flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-[var(--primary)]" />
            Âm thanh & Rung
          </h3>
          <p className="text-xs text-[var(--text-tertiary)] mb-4">
            Tuỳ chỉnh phản hồi khi nhận thông báo mới.
          </p>

          <div className="divide-y divide-[var(--divider)]">
            <ToggleRow
              icon={<Volume2 className="w-5 h-5" />}
              title="Âm thanh thông báo"
              description="Phát âm thanh khi có thông báo mới."
              enabled={settings.soundEnabled}
              onChange={(val) => updateSettings({ soundEnabled: val })}
            />
            <ToggleRow
              icon={<Vibrate className="w-5 h-5" />}
              title="Rung"
              description="Rung khi nhận thông báo (trên thiết bị hỗ trợ)."
              enabled={settings.vibrationEnabled}
              onChange={(val) => updateSettings({ vibrationEnabled: val })}
            />
          </div>
        </Card>

        {/* ─── Section D: Quiet Hours ─────────────────────────────── */}
        <Card>
          <h3 className="font-semibold text-[var(--text-primary)] mb-2 flex items-center gap-2">
            <Moon className="w-5 h-5 text-[var(--primary)]" />
            Giờ yên lặng
          </h3>
          <p className="text-xs text-[var(--text-tertiary)] mb-4">
            Thông báo hệ thống sẽ bị tắt tiếng trong khoảng thời gian này; các
            mục vẫn vào Hộp thư.
          </p>

          {/* Toggle */}
          <div className="flex items-center justify-between py-3">
            <span className="font-medium text-[var(--text-primary)]">
              Bật Giờ yên lặng
            </span>
            <button
              onClick={() =>
                updateSettings({
                  quietHoursEnabled: !settings.quietHoursEnabled,
                })
              }
              className={`relative w-11 h-6 rounded-full transition-colors ${
                settings.quietHoursEnabled
                  ? "bg-[var(--success)]"
                  : "bg-[var(--border)]"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform shadow-sm ${
                  settings.quietHoursEnabled ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* Time Range Picker */}
          {settings.quietHoursEnabled && (
            <div className="mt-3 p-4 bg-[var(--surface)] rounded-[var(--radius-lg)] space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">
                    Từ
                  </label>
                  <input
                    type="time"
                    value={settings.quietHoursFrom}
                    onChange={(e) =>
                      updateSettings({ quietHoursFrom: e.target.value })
                    }
                    className="w-full px-3 py-2.5 bg-[var(--input-background)] border border-[var(--border)] rounded-[var(--radius-lg)] text-[var(--text-primary)] text-center focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">
                    Đến
                  </label>
                  <input
                    type="time"
                    value={settings.quietHoursTo}
                    onChange={(e) =>
                      updateSettings({ quietHoursTo: e.target.value })
                    }
                    className="w-full px-3 py-2.5 bg-[var(--input-background)] border border-[var(--border)] rounded-[var(--radius-lg)] text-[var(--text-primary)] text-center focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]"
                  />
                </div>
              </div>
              <p className="text-xs text-[var(--text-tertiary)]">
                {settings.quietHoursEnabled
                  ? `Yên lặng từ ${settings.quietHoursFrom} đến ${settings.quietHoursTo}.`
                  : ""}
              </p>
            </div>
          )}
        </Card>

        {/* ─── Save ───────────────────────────────────────────────── */}
        <div className="flex flex-col-reverse md:flex-row gap-3">
          <Button
            variant="secondary"
            onClick={() => nav.goBack()}
            className="flex-1 md:flex-initial"
          >
            Huỷ
          </Button>
          <Button onClick={handleSave} className="flex-1 md:flex-initial">
            Lưu cài đặt
          </Button>
        </div>
      </div>
    </div>
  );
}

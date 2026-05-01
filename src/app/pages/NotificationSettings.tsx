import React, { useState, useEffect, useCallback, useRef } from "react";
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
  Send,
  CheckCircle,
  XCircle,
  ExternalLink,
  Link2,
  Link2Off,
  Loader2,
  DollarSign,
  TrendingUp,
  Zap,
  CalendarClock,
  Copy,
  Check,
  Clock,
} from "lucide-react";
import { Card } from "../components/Card";
import { Button } from "../components/Button";
import { useAppNavigation } from "../hooks/useAppNavigation";
import { useNotifications } from "../contexts/NotificationContext";
import { useToast } from "../contexts/ToastContext";
import { useTranslation } from "react-i18next";
import {
  telegramService,
  type TelegramStatus,
  type TelegramNotificationSettings,
  type TelegramConnectLink,
} from "../services/telegramService";
import {
  emailNotificationsService,
  type EmailNotificationPreferences,
  type EmailNotificationSettings,
} from "../services/emailNotificationsService";

// ── Types ─────────────────────────────────────────────────────────────────────

type ActiveTab = "inapp" | "telegram" | "email";

// ── Toggle Row ────────────────────────────────────────────────────────────────

interface ToggleRowProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  enabled: boolean;
  onChange: (val: boolean) => void;
  disabled?: boolean;
  badge?: string;
  loading?: boolean;
}

function ToggleRow({
  icon,
  title,
  description,
  enabled,
  onChange,
  disabled,
  badge,
  loading,
}: ToggleRowProps) {
  return (
    <div
      className={`flex items-center gap-4 py-4 ${disabled || loading ? "opacity-50" : ""}`}
    >
      <div className="flex-shrink-0 w-10 h-10 rounded-[var(--radius-lg)] bg-[var(--primary-light)] text-[var(--primary)] flex items-center justify-center">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-[var(--text-primary)]">{title}</span>
          {badge && (
            <span className="px-2 py-0.5 rounded-full bg-[var(--surface)] text-[var(--text-tertiary)] text-xs font-medium">
              {badge}
            </span>
          )}
        </div>
        <p className="text-xs text-[var(--text-secondary)] mt-0.5">{description}</p>
      </div>
      <button
        onClick={() => !disabled && !loading && onChange(!enabled)}
        disabled={disabled || loading}
        className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${
          enabled ? "bg-[var(--success)]" : "bg-[var(--border)]"
        } ${disabled || loading ? "cursor-not-allowed" : "cursor-pointer"}`}
      >
        {loading ? (
          <span className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="w-3 h-3 text-white animate-spin" />
          </span>
        ) : (
          <span
            className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform shadow-sm ${
              enabled ? "translate-x-5" : "translate-x-0"
            }`}
          />
        )}
      </button>
    </div>
  );
}

// ── Tabs ──────────────────────────────────────────────────────────────────────

const NOTIFICATION_SETTING_LABELS: Record<keyof TelegramNotificationSettings, { icon: React.ReactNode; title: string; description: string }> = {
  notifyRecurringDue: {
    icon: <CalendarClock className="w-5 h-5" />,
    title: "Giao dịch định kỳ đến hạn",
    description: "Nhắc nhở khi giao dịch lặp lại sắp đến hạn thực hiện",
  },
  notifyTransactionAdded: {
    icon: <DollarSign className="w-5 h-5" />,
    title: "Giao dịch mới",
    description: "Thông báo khi có giao dịch mới được ghi nhận",
  },
  notifyBudgetAlert: {
    icon: <BarChart3 className="w-5 h-5" />,
    title: "Cảnh báo ngân sách",
    description: "Thông báo khi ngân sách đạt mốc quan trọng hoặc vượt giới hạn",
  },
  notifyGoalMilestone: {
    icon: <Target className="w-5 h-5" />,
    title: "Đạt mục tiêu",
    description: "Thông báo khi mục tiêu tài chính đạt được cột mốc",
  },
  notifyGoalReminder: {
    icon: <Zap className="w-5 h-5" />,
    title: "Nhắc nhở mục tiêu",
    description: "Nhắc nhở để tiếp tục đóng góp cho mục tiêu tài chính",
  },
  notifyWeeklyRecap: {
    icon: <TrendingUp className="w-5 h-5" />,
    title: "Tổng kết tuần",
    description: "Báo cáo tổng hợp thu chi hàng tuần qua Telegram",
  },
  notifyGeneral: {
    icon: <Bell className="w-5 h-5" />,
    title: "Thông báo chung",
    description: "Các thông báo hệ thống và cập nhật quan trọng khác",
  },
};

// ── Telegram Connect Card ─────────────────────────────────────────────────────

const EXPIRE_SECONDS = 15 * 60; // 15 phút

function extractStartCommand(connectUrl: string): string {
  try {
    const token = new URL(connectUrl).searchParams.get("start") ?? "";
    return `/start ${token}`;
  } catch {
    return "/start";
  }
}

function formatCountdown(seconds: number): string {
  const m = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

interface TelegramConnectCardProps {
  connectLink: TelegramConnectLink;
  onConnected: () => void;
  onCancel: () => void;
}

function TelegramConnectCard({ connectLink, onConnected, onCancel }: TelegramConnectCardProps) {
  const toast = useToast();
  const [copied, setCopied] = useState(false);
  const [countdown, setCountdown] = useState(EXPIRE_SECONDS);
  const [expired, setExpired] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startCommand = extractStartCommand(connectLink.connectUrl);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(startCommand);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Không thể sao chép, hãy copy thủ công");
    }
  };

  // Auto-poll trạng thái mỗi 5 giây
  useEffect(() => {
    pollRef.current = setInterval(async () => {
      try {
        const data = await telegramService.getStatus();
        if (data?.telegramChatId) {
          clearInterval(pollRef.current!);
          clearInterval(countdownRef.current!);
          onConnected();
        }
      } catch {
        // silent — user will see if connected when they interact
      }
    }, 5000);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [onConnected]);

  // Đếm ngược
  useEffect(() => {
    countdownRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownRef.current!);
          clearInterval(pollRef.current!);
          setExpired(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, []);

  return (
    <Card>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[#229ED9] flex items-center justify-center">
            <Send className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-[var(--text-primary)]">Kết nối Telegram</h3>
            <p className="text-xs text-[var(--text-secondary)]">
              Làm theo 2 bước bên dưới để liên kết tài khoản
            </p>
          </div>
        </div>
        <button
          onClick={onCancel}
          className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors p-1"
        >
          <XCircle className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-4">
        {/* Bước 1 */}
        <div className="flex gap-3">
          <span className="flex-shrink-0 w-7 h-7 rounded-full bg-[var(--primary)] text-white text-sm flex items-center justify-center font-bold">
            1
          </span>
          <div className="flex-1">
            <p className="font-medium text-[var(--text-primary)] mb-2">Mở bot Telegram</p>
            <a
              href={connectLink.botUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full px-4 py-2.5 border border-[var(--border)] rounded-[var(--radius-lg)] text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--surface)] transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              Mở @{connectLink.botUsername}
            </a>
          </div>
        </div>

        {/* Bước 2 */}
        <div className="flex gap-3">
          <span className="flex-shrink-0 w-7 h-7 rounded-full bg-[var(--primary)] text-white text-sm flex items-center justify-center font-bold">
            2
          </span>
          <div className="flex-1">
            <p className="font-medium text-[var(--text-primary)] mb-2">Copy và gửi lệnh này vào chat với bot</p>

            {/* Command box — nổi bật với dashed border */}
            <div className="flex items-stretch gap-2 p-3 border-2 border-dashed border-[var(--primary)] rounded-[var(--radius-lg)] bg-[var(--primary-light)]">
              <code className="flex-1 text-sm text-[var(--primary)] font-mono font-semibold break-all select-all">
                {startCommand}
              </code>
              <button
                onClick={handleCopy}
                className={`flex-shrink-0 p-1.5 rounded-[var(--radius-md)] transition-colors ${
                  copied
                    ? "text-[var(--success)] bg-[var(--success-light)]"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--border)]"
                }`}
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ⚠️ Fallback warning — quan trọng */}
      <div className="mt-4 p-3 rounded-[var(--radius-lg)] border border-amber-200 space-y-1.5" style={{ backgroundColor: "rgba(251, 191, 36, 0.08)" }}>
        <p className="text-xs font-semibold text-amber-700 flex items-center gap-1.5">
          <span className="text-base leading-none">⚠️</span>
          Lưu ý quan trọng
        </p>
        <p className="text-xs text-amber-700 leading-relaxed" style={{ opacity: 0.85 }}>
          Nếu bấm mở link mà Telegram <strong>không tự gửi tin nhắn</strong>, hãy làm thủ công:
        </p>
        <ol className="text-xs text-amber-700 space-y-0.5 ml-4 list-decimal" style={{ opacity: 0.85 }}>
          <li>Bấm nút copy lệnh ở bước 2</li>
          <li>Mở Telegram → tìm <strong>@{connectLink.botUsername}</strong></li>
          <li>Dán lệnh vào hộp chat và nhấn Gửi</li>
        </ol>
      </div>

      {/* Waiting status */}
      <div className="mt-4 p-4 rounded-[var(--radius-lg)] bg-[var(--surface)] border border-[var(--border)]">
        {expired ? (
          <div className="flex items-center gap-3">
            <XCircle className="w-5 h-5 text-[var(--error)] flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-[var(--text-primary)]">Liên kết đã hết hạn</p>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                Nhấn "Thử lại" để tạo liên kết mới
              </p>
            </div>
            <Button variant="secondary" onClick={onCancel} className="text-xs py-1.5 px-3 flex-shrink-0">
              Thử lại
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Loader2 className="w-5 h-5 text-[var(--primary)] animate-spin flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-[var(--text-primary)]">
                Đang chờ xác nhận...
              </p>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                Trang sẽ tự cập nhật khi kết nối thành công. Hết hạn sau:{" "}
                <span className="font-semibold text-[var(--text-primary)]">
                  {formatCountdown(countdown)}
                </span>
              </p>
            </div>
            <div className="flex items-center gap-1 text-xs text-[var(--text-tertiary)] flex-shrink-0">
              <Clock className="w-3.5 h-3.5" />
              {formatCountdown(countdown)}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}

// ── Telegram Tab ──────────────────────────────────────────────────────────────

function TelegramTab() {
  const toast = useToast();
  const [status, setStatus] = useState<TelegramStatus | null>(null);
  const [connectLink, setConnectLink] = useState<TelegramConnectLink | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [loadingLink, setLoadingLink] = useState(false);
  const [loadingToggle, setLoadingToggle] = useState(false);
  const [loadingUnlink, setLoadingUnlink] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [localSettings, setLocalSettings] = useState<TelegramNotificationSettings | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  const fetchStatus = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoadingStatus(true);
      const data = await telegramService.getStatus();
      setStatus(data);
      if (data?.settings) setLocalSettings(data.settings);
      return data;
    } catch {
      if (!silent) toast.error("Không thể tải trạng thái Telegram");
      return null;
    } finally {
      if (!silent) setLoadingStatus(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const handleGetConnectLink = async () => {
    try {
      setLoadingLink(true);
      const link = await telegramService.getConnectLink();
      setConnectLink(link);
      setIsConnecting(true);
    } catch {
      toast.error("Không thể tạo liên kết kết nối");
    } finally {
      setLoadingLink(false);
    }
  };

  const handleConnected = useCallback(async () => {
    setIsConnecting(false);
    setConnectLink(null);
    const data = await fetchStatus();
    if (data?.telegramChatId) {
      toast.success("Kết nối Telegram thành công!");
    }
  }, [fetchStatus, toast]);

  const handleCancelConnect = () => {
    setIsConnecting(false);
    setConnectLink(null);
  };

  const handleToggle = async (enabled: boolean) => {
    if (!status) return;
    try {
      setLoadingToggle(true);
      await telegramService.toggle(enabled);
      setStatus((prev) => (prev ? { ...prev, telegramEnabled: enabled } : prev));
      toast.success(enabled ? "Đã bật thông báo Telegram" : "Đã tắt thông báo Telegram");
    } catch {
      toast.error("Không thể thay đổi trạng thái");
    } finally {
      setLoadingToggle(false);
    }
  };

  const handleUnlink = async () => {
    try {
      setLoadingUnlink(true);
      await telegramService.unlink();
      setStatus((prev) =>
        prev
          ? { ...prev, telegramChatId: null, telegramEnabled: false, telegramLinkedAt: null }
          : prev,
      );
      setIsConnecting(false);
      setConnectLink(null);
      toast.success("Đã huỷ liên kết Telegram");
    } catch {
      toast.error("Không thể huỷ liên kết");
    } finally {
      setLoadingUnlink(false);
    }
  };

  const handleSettingChange = (key: keyof TelegramNotificationSettings, value: boolean) => {
    setLocalSettings((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const handleSaveSettings = async () => {
    if (!localSettings) return;
    try {
      setSavingSettings(true);
      await telegramService.updateSettings(localSettings);
      toast.success("Đã lưu cài đặt thông báo Telegram");
    } catch {
      toast.error("Không thể lưu cài đặt");
    } finally {
      setSavingSettings(false);
    }
  };

  if (loadingStatus) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]" />
        <span className="text-sm text-[var(--text-secondary)]">Đang tải...</span>
      </div>
    );
  }

  const isLinked = Boolean(status?.telegramChatId);

  return (
    <div className="space-y-6">
      {/* Status Card */}
      <Card>
        <h3 className="font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
          <Send className="w-5 h-5 text-[var(--primary)]" />
          Trạng thái kết nối
        </h3>

        <div className="flex items-center gap-4 p-4 rounded-[var(--radius-lg)] bg-[var(--surface)]">
          <div
            className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${
              isLinked
                ? "bg-[var(--success-light)] text-[var(--success)]"
                : "bg-[var(--border)] text-[var(--text-tertiary)]"
            }`}
          >
            {isLinked ? <CheckCircle className="w-6 h-6" /> : <XCircle className="w-6 h-6" />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-[var(--text-primary)]">
              {isLinked ? "Đã kết nối Telegram" : "Chưa kết nối"}
            </p>
            {isLinked && status?.telegramLinkedAt && (
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                Liên kết từ{" "}
                {new Date(status.telegramLinkedAt).toLocaleDateString("vi-VN", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                })}
              </p>
            )}
            {!isLinked && (
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                Kết nối để nhận thông báo tài chính qua Telegram
              </p>
            )}
          </div>
          {isLinked ? (
            <Button
              variant="danger"
              onClick={handleUnlink}
              disabled={loadingUnlink}
              className="flex-shrink-0 flex items-center gap-1.5 text-sm"
            >
              {loadingUnlink ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Link2Off className="w-4 h-4" />
              )}
              Huỷ liên kết
            </Button>
          ) : (
            <Button
              onClick={handleGetConnectLink}
              disabled={loadingLink || isConnecting}
              className="flex-shrink-0 flex items-center gap-1.5 text-sm"
            >
              {loadingLink ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Link2 className="w-4 h-4" />
              )}
              Kết nối
            </Button>
          )}
        </div>

        {/* Enable/Disable toggle (only when linked) */}
        {isLinked && (
          <div className="mt-4 pt-4 border-t border-[var(--divider)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-[var(--text-primary)]">Bật thông báo Telegram</p>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                  Tắt để tạm dừng tất cả thông báo mà không huỷ liên kết
                </p>
              </div>
              <button
                onClick={() => handleToggle(!status?.telegramEnabled)}
                disabled={loadingToggle}
                className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${
                  status?.telegramEnabled ? "bg-[var(--success)]" : "bg-[var(--border)]"
                } ${loadingToggle ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
              >
                {loadingToggle ? (
                  <span className="absolute inset-0 flex items-center justify-center">
                    <Loader2 className="w-3 h-3 text-white animate-spin" />
                  </span>
                ) : (
                  <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform shadow-sm ${
                      status?.telegramEnabled ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                )}
              </button>
            </div>
          </div>
        )}
      </Card>

      {/* Connect flow card (2 bước + đếm ngược) */}
      {isConnecting && connectLink && !isLinked && (
        <TelegramConnectCard
          connectLink={connectLink}
          onConnected={handleConnected}
          onCancel={handleCancelConnect}
        />
      )}

      {/* Notification Preferences (only when linked) */}
      {isLinked && localSettings && (
        <Card>
          <h3 className="font-semibold text-[var(--text-primary)] mb-2">
            Loại thông báo qua Telegram
          </h3>
          <p className="text-xs text-[var(--text-tertiary)] mb-4">
            Chọn loại thông báo bạn muốn nhận qua Telegram.
          </p>

          <div className="divide-y divide-[var(--divider)]">
            {(Object.keys(localSettings) as Array<keyof TelegramNotificationSettings>).map((key) => {
              const meta = NOTIFICATION_SETTING_LABELS[key];
              return (
                <ToggleRow
                  key={key}
                  icon={meta.icon}
                  title={meta.title}
                  description={meta.description}
                  enabled={localSettings[key]}
                  onChange={(val) => handleSettingChange(key, val)}
                  disabled={!status?.telegramEnabled}
                />
              );
            })}
          </div>

          <div className="mt-4 pt-4 border-t border-[var(--divider)]">
            {!status?.telegramEnabled && (
              <p className="text-xs text-[var(--warning)] flex items-center gap-1.5 mb-3">
                <BellOff className="w-3.5 h-3.5" />
                Bật thông báo Telegram ở trên để chỉnh sửa cài đặt
              </p>
            )}
            <Button
              onClick={handleSaveSettings}
              disabled={savingSettings || !status?.telegramEnabled}
              className="w-full flex items-center justify-center gap-2"
            >
              {savingSettings && <Loader2 className="w-4 h-4 animate-spin" />}
              Lưu cài đặt Telegram
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}

// ── Email Tab ─────────────────────────────────────────────────────────────────

function EmailTab() {
  const toast = useToast();
  const [data, setData] = useState<EmailNotificationSettings | null>(null);
  const [localSettings, setLocalSettings] = useState<EmailNotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const result = await emailNotificationsService.getSettings();
        setData(result);
        if (result?.settings) {
          const { id, userId, createdAt, updatedAt, ...prefs } = result.settings;
          void id; void userId; void createdAt; void updatedAt;
          setLocalSettings(prefs);
        }
      } catch {
        toast.error("Không thể tải cài đặt email");
      } finally {
        setLoading(false);
      }
    })();
  }, [toast]);

  const handleChange = (key: keyof EmailNotificationPreferences, val: boolean) => {
    setLocalSettings((prev) => (prev ? { ...prev, [key]: val } : prev));
  };

  const handleSave = async () => {
    if (!localSettings) return;
    try {
      setSaving(true);
      const result = await emailNotificationsService.updateSettings(localSettings);
      setData(result);
      toast.success("Đã lưu cài đặt thông báo email");
    } catch {
      toast.error("Không thể lưu cài đặt");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]" />
        <span className="text-sm text-[var(--text-secondary)]">Đang tải...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Email info */}
      <Card>
        <h3 className="font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
          <Mail className="w-5 h-5 text-[var(--primary)]" />
          Địa chỉ email nhận thông báo
        </h3>
        <div className="flex items-center gap-3 p-4 bg-[var(--surface)] rounded-[var(--radius-lg)]">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[var(--primary-light)] text-[var(--primary)] flex items-center justify-center">
            <Mail className="w-5 h-5" />
          </div>
          <div>
            <p className="font-medium text-[var(--text-primary)]">{data?.email || "—"}</p>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              Thông báo sẽ được gửi đến địa chỉ này
            </p>
          </div>
        </div>
      </Card>

      {/* Preferences */}
      {localSettings && (
        <Card>
          <h3 className="font-semibold text-[var(--text-primary)] mb-2">
            Loại thông báo qua Email
          </h3>
          <p className="text-xs text-[var(--text-tertiary)] mb-4">
            Chọn loại thông báo bạn muốn nhận qua email.
          </p>

          <div className="divide-y divide-[var(--divider)]">
            {(Object.keys(localSettings) as Array<keyof EmailNotificationPreferences>).map(
              (key) => {
                const meta = NOTIFICATION_SETTING_LABELS[key];
                return (
                  <ToggleRow
                    key={key}
                    icon={meta.icon}
                    title={meta.title}
                    description={meta.description}
                    enabled={localSettings[key]}
                    onChange={(val) => handleChange(key, val)}
                  />
                );
              },
            )}
          </div>

          <div className="mt-4 pt-4 border-t border-[var(--divider)]">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="w-full flex items-center justify-center gap-2"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              Lưu cài đặt Email
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}

// ── In-App Tab ────────────────────────────────────────────────────────────────

function InAppTab() {
  const toast = useToast();
  const { settings, updateSettings } = useNotifications();
  const { t } = useTranslation("settings");

  const handleSave = () => {
    toast.success(t("notifications.toast.saved"));
  };

  return (
    <div className="space-y-6">
      {/* OS Permissions */}
      <Card>
        <h3 className="font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
          <Bell className="w-5 h-5 text-[var(--primary)]" />
          {t("notifications.sections.system")}
        </h3>
        <div className="flex items-center gap-4 p-4 bg-[var(--surface)] rounded-[var(--radius-lg)]">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium text-[var(--text-primary)]">System Permissions</span>
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

      {/* Notification Types */}
      <Card>
        <h3 className="font-semibold text-[var(--text-primary)] mb-2">
          {t("notifications.sections.types")}
        </h3>
        <p className="text-xs text-[var(--text-tertiary)] mb-4">
          Bật hoặc tắt từng loại thông báo riêng biệt.
        </p>
        <div className="divide-y divide-[var(--divider)]">
          <ToggleRow
            icon={<RefreshCw className="w-5 h-5" />}
            title={t("notifications.items.recurring_reminder.title")}
            description={t("notifications.items.recurring_reminder.description")}
            enabled={settings.recurringReminders}
            onChange={(val) => updateSettings({ recurringReminders: val })}
          />
          <ToggleRow
            icon={<BarChart3 className="w-5 h-5" />}
            title={t("notifications.items.budget_warning.title")}
            description={t("notifications.items.budget_warning.description")}
            enabled={settings.budgetAlerts}
            onChange={(val) => updateSettings({ budgetAlerts: val })}
          />
          <ToggleRow
            icon={<Target className="w-5 h-5" />}
            title={t("notifications.items.goal_reminder.title")}
            description={t("notifications.items.goal_reminder.description")}
            enabled={settings.goalReminders}
            onChange={(val) => updateSettings({ goalReminders: val })}
          />
          <ToggleRow
            icon={<Mail className="w-5 h-5" />}
            title={t("notifications.items.weekly_summary.title")}
            description={t("notifications.items.weekly_summary.description")}
            enabled={settings.weeklyRecap}
            onChange={() => {}}
            disabled
            badge={t("notifications.items.weekly_summary.badge_coming_soon")}
          />
        </div>
      </Card>

      {/* Sound & Vibration */}
      <Card>
        <h3 className="font-semibold text-[var(--text-primary)] mb-2 flex items-center gap-2">
          <Smartphone className="w-5 h-5 text-[var(--primary)]" />
          {t("notifications.sections.sound_vibration")}
        </h3>
        <p className="text-xs text-[var(--text-tertiary)] mb-4">
          Tuỳ chỉnh phản hồi khi nhận thông báo mới.
        </p>
        <div className="divide-y divide-[var(--divider)]">
          <ToggleRow
            icon={<Volume2 className="w-5 h-5" />}
            title={t("notifications.items.sound.title")}
            description={t("notifications.items.sound.description")}
            enabled={settings.soundEnabled}
            onChange={(val) => updateSettings({ soundEnabled: val })}
          />
          <ToggleRow
            icon={<Vibrate className="w-5 h-5" />}
            title={t("notifications.items.vibration.title")}
            description={t("notifications.items.vibration.description")}
            enabled={settings.vibrationEnabled}
            onChange={(val) => updateSettings({ vibrationEnabled: val })}
          />
        </div>
      </Card>

      {/* Quiet Hours */}
      <Card>
        <h3 className="font-semibold text-[var(--text-primary)] mb-2 flex items-center gap-2">
          <Moon className="w-5 h-5 text-[var(--primary)]" />
          {t("notifications.sections.quiet_hours")}
        </h3>
        <p className="text-xs text-[var(--text-tertiary)] mb-4">
          Thông báo hệ thống sẽ bị tắt tiếng trong khoảng thời gian này; các mục vẫn vào Hộp thư.
        </p>

        <div className="flex items-center justify-between py-3">
          <span className="font-medium text-[var(--text-primary)]">
            {t("notifications.quiet_hours.enable_label")}
          </span>
          <button
            onClick={() =>
              updateSettings({ quietHoursEnabled: !settings.quietHoursEnabled })
            }
            className={`relative w-11 h-6 rounded-full transition-colors ${
              settings.quietHoursEnabled ? "bg-[var(--success)]" : "bg-[var(--border)]"
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform shadow-sm ${
                settings.quietHoursEnabled ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        {settings.quietHoursEnabled && (
          <div className="mt-3 p-4 bg-[var(--surface)] rounded-[var(--radius-lg)] space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">
                  {t("notifications.quiet_hours.from_label")}
                </label>
                <input
                  type="time"
                  value={settings.quietHoursFrom}
                  onChange={(e) => updateSettings({ quietHoursFrom: e.target.value })}
                  className="w-full px-3 py-2.5 bg-[var(--input-background)] border border-[var(--border)] rounded-[var(--radius-lg)] text-[var(--text-primary)] text-center focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">
                  {t("notifications.quiet_hours.to_label")}
                </label>
                <input
                  type="time"
                  value={settings.quietHoursTo}
                  onChange={(e) => updateSettings({ quietHoursTo: e.target.value })}
                  className="w-full px-3 py-2.5 bg-[var(--input-background)] border border-[var(--border)] rounded-[var(--radius-lg)] text-[var(--text-primary)] text-center focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]"
                />
              </div>
            </div>
            <p className="text-xs text-[var(--text-tertiary)]">
              {`Yên lặng từ ${settings.quietHoursFrom} đến ${settings.quietHoursTo}.`}
            </p>
          </div>
        )}
      </Card>

      <div className="flex flex-col-reverse md:flex-row gap-3">
        <Button onClick={handleSave} className="flex-1">
          {t("notifications.actions.save")}
        </Button>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function NotificationSettings() {
  const nav = useAppNavigation();
  const { t } = useTranslation("settings");
  const [activeTab, setActiveTab] = useState<ActiveTab>("inapp");

  const tabs: { id: ActiveTab; label: string; icon: React.ReactNode }[] = [
    { id: "inapp", label: "Trong ứng dụng", icon: <Bell className="w-4 h-4" /> },
    { id: "telegram", label: "Telegram", icon: <Send className="w-4 h-4" /> },
    { id: "email", label: "Email", icon: <Mail className="w-4 h-4" /> },
  ];

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
            <span className="font-medium">{t("notifications.actions.back")}</span>
          </button>
          <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
            {t("notifications.title")}
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Quản lý cách ứng dụng thông báo cho bạn qua nhiều kênh khác nhau.
          </p>
        </div>

        {/* Tab Bar */}
        <div className="flex gap-1 p-1 bg-[var(--surface)] rounded-[var(--radius-lg)]">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-[var(--radius-md)] text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? "bg-[var(--background)] text-[var(--text-primary)] shadow-sm"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              {tab.icon}
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === "inapp" && <InAppTab />}
        {activeTab === "telegram" && <TelegramTab />}
        {activeTab === "email" && <EmailTab />}
      </div>
    </div>
  );
}

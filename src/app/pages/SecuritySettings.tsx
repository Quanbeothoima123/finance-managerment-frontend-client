import React, { useState } from "react";
import {
  ArrowLeft,
  Shield,
  Lock,
  Eye,
  EyeOff,
  Fingerprint,
  CreditCard,
} from "lucide-react";
import { Card } from "../components/Card";
import { Button } from "../components/Button";
import { useAppNavigation } from "../hooks/useAppNavigation";
import { useToast } from "../contexts/ToastContext";

export default function SecuritySettings() {
  const nav = useAppNavigation();
  const toast = useToast();

  const [hideAccountNumbers, setHideAccountNumbers] = useState(() => {
    try {
      return localStorage.getItem("finance-hide-account-numbers") === "true";
    } catch {
      return false;
    }
  });

  const toggleHideAccountNumbers = (value: boolean) => {
    setHideAccountNumbers(value);
    try {
      localStorage.setItem("finance-hide-account-numbers", String(value));
    } catch {}
  };
  const [pinEnabled, setPinEnabled] = useState(false);
  const [biometricsEnabled, setBiometricsEnabled] = useState(false);
  const [privacyMode, setPrivacyMode] = useState(false);
  const [showPinSetup, setShowPinSetup] = useState(false);

  const handleBack = () => {
    nav.goBack();
  };

  const handleSave = () => {
    toast.success("Đã lưu cài đặt bảo mật");
    nav.goSettings();
  };

  const handleEnablePin = () => {
    if (!pinEnabled) {
      setShowPinSetup(true);
    } else {
      setPinEnabled(false);
    }
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

          <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
            Bảo mật
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Bảo vệ dữ liệu tài chính của bạn
          </p>
        </div>

        {/* PIN Lock */}
        <Card>
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-12 h-12 bg-[var(--primary-light)] text-[var(--primary)] rounded-[var(--radius-lg)] flex items-center justify-center">
              <Lock className="w-6 h-6" />
            </div>

            <div className="flex-1">
              <div className="flex items-start justify-between gap-4 mb-2">
                <div>
                  <h3 className="font-semibold text-[var(--text-primary)] mb-1">
                    Khoá bằng mã PIN
                  </h3>
                  <p className="text-sm text-[var(--text-secondary)]">
                    Yêu cầu nhập mã PIN 6 số khi mở ứng dụng
                  </p>
                </div>

                <button
                  onClick={handleEnablePin}
                  className={`flex-shrink-0 relative w-12 h-6 rounded-full transition-colors ${
                    pinEnabled ? "bg-[var(--success)]" : "bg-[var(--border)]"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                      pinEnabled ? "translate-x-6" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {pinEnabled && (
                <button
                  onClick={() => setShowPinSetup(true)}
                  className="mt-3 text-sm text-[var(--primary)] hover:text-[var(--primary-hover)] font-medium transition-colors"
                >
                  Thay đổi mã PIN
                </button>
              )}
            </div>
          </div>
        </Card>

        {/* PIN Setup Flow (shown when enabled) */}
        {showPinSetup && (
          <Card className="bg-[var(--info-light)] border-[var(--info)]">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-[var(--info)] rounded-full flex items-center justify-center flex-shrink-0">
                  <Lock className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-[var(--text-primary)] mb-1">
                    Thiết lập mã PIN
                  </h4>
                  <p className="text-sm text-[var(--text-secondary)]">
                    Nhập mã PIN 6 số để bảo vệ ứng dụng
                  </p>
                </div>
              </div>

              {/* PIN Input (placeholder) */}
              <div className="flex justify-center gap-3">
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className="w-12 h-12 bg-[var(--input-background)] border-2 border-[var(--border)] rounded-[var(--radius-lg)] flex items-center justify-center text-xl font-bold text-[var(--text-primary)]"
                  >
                    •
                  </div>
                ))}
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => {
                    setPinEnabled(true);
                    setShowPinSetup(false);
                  }}
                  className="flex-1"
                >
                  Xác nhận
                </Button>
                <Button
                  onClick={() => {
                    setShowPinSetup(false);
                    if (!pinEnabled) setPinEnabled(false);
                  }}
                  variant="secondary"
                  className="flex-1"
                >
                  Huỷ
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Biometrics */}
        <Card>
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-12 h-12 bg-[var(--success-light)] text-[var(--success)] rounded-[var(--radius-lg)] flex items-center justify-center">
              <Fingerprint className="w-6 h-6" />
            </div>

            <div className="flex-1">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-semibold text-[var(--text-primary)] mb-1">
                    Sinh trắc học
                  </h3>
                  <p className="text-sm text-[var(--text-secondary)]">
                    Sử dụng vân tay hoặc Face ID để mở khoá nhanh
                  </p>
                </div>

                <button
                  onClick={() => setBiometricsEnabled(!biometricsEnabled)}
                  className={`flex-shrink-0 relative w-12 h-6 rounded-full transition-colors ${
                    biometricsEnabled
                      ? "bg-[var(--success)]"
                      : "bg-[var(--border)]"
                  }`}
                  disabled={!pinEnabled}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                      biometricsEnabled ? "translate-x-6" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {!pinEnabled && (
                <p className="mt-2 text-xs text-[var(--text-tertiary)]">
                  Cần bật mã PIN trước
                </p>
              )}
            </div>
          </div>
        </Card>

        {/* Privacy Mode */}
        <Card>
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-12 h-12 bg-[var(--warning-light)] text-[var(--warning)] rounded-[var(--radius-lg)] flex items-center justify-center">
              {privacyMode ? (
                <EyeOff className="w-6 h-6" />
              ) : (
                <Eye className="w-6 h-6" />
              )}
            </div>

            <div className="flex-1">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-semibold text-[var(--text-primary)] mb-1">
                    Chế độ riêng tư
                  </h3>
                  <p className="text-sm text-[var(--text-secondary)]">
                    Ẩn số tiền trên màn hình chính và thông báo
                  </p>
                  {privacyMode && (
                    <p className="text-xs text-[var(--warning)] mt-1">
                      Số tiền sẽ hiển thị dạng: ***,***₫
                    </p>
                  )}
                </div>

                <button
                  onClick={() => setPrivacyMode(!privacyMode)}
                  className={`flex-shrink-0 relative w-12 h-6 rounded-full transition-colors ${
                    privacyMode ? "bg-[var(--warning)]" : "bg-[var(--border)]"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                      privacyMode ? "translate-x-6" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        </Card>

        {/* Hide Account Numbers */}
        <Card>
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-12 h-12 bg-[var(--warning-light)] text-[var(--warning)] rounded-[var(--radius-lg)] flex items-center justify-center">
              {hideAccountNumbers ? (
                <CreditCard className="w-6 h-6" />
              ) : (
                <CreditCard className="w-6 h-6" />
              )}
            </div>

            <div className="flex-1">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-semibold text-[var(--text-primary)] mb-1">
                    Ẩn số tài khoản
                  </h3>
                  <p className="text-sm text-[var(--text-secondary)]">
                    Ẩn số tài khoản trên màn hình chính và thông báo
                  </p>
                  {hideAccountNumbers && (
                    <p className="text-xs text-[var(--warning)] mt-1">
                      Số tài khoản sẽ hiển thị dạng: ************
                    </p>
                  )}
                </div>

                <button
                  onClick={() => toggleHideAccountNumbers(!hideAccountNumbers)}
                  className={`flex-shrink-0 relative w-12 h-6 rounded-full transition-colors ${
                    hideAccountNumbers
                      ? "bg-[var(--warning)]"
                      : "bg-[var(--border)]"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                      hideAccountNumbers ? "translate-x-6" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        </Card>

        {/* Preview */}
        <Card className="bg-[var(--surface)]">
          <h3 className="font-semibold text-[var(--text-primary)] mb-4">
            Xem trước chế độ riêng tư
          </h3>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-[var(--card)] rounded-[var(--radius-lg)] border border-[var(--border)]">
              <p className="text-xs text-[var(--text-secondary)] mb-1">
                Bình thường
              </p>
              <p className="text-xl font-bold text-[var(--text-primary)] tabular-nums">
                98,500,000₫
              </p>
            </div>

            <div className="p-4 bg-[var(--card)] rounded-[var(--radius-lg)] border border-[var(--border)]">
              <p className="text-xs text-[var(--text-secondary)] mb-1">
                Riêng tư
              </p>
              <p className="text-xl font-bold text-[var(--text-primary)] tabular-nums">
                ***,***,***₫
              </p>
            </div>
          </div>
        </Card>

        {/* Info Card */}
        <Card className="bg-[var(--info-light)] border-[var(--info)]">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-[var(--info)] rounded-full flex items-center justify-center flex-shrink-0">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-[var(--text-primary)] mb-1">
                Bảo mật dữ liệu
              </h4>
              <p className="text-sm text-[var(--text-secondary)]">
                Mã PIN và dữ liệu sinh trắc học được lưu trữ an toàn trên thiết
                bị của bạn. Chúng tôi không có quyền truy cập vào thông tin này.
              </p>
            </div>
          </div>
        </Card>

        {/* Save Button */}
        <div className="flex flex-col-reverse md:flex-row gap-3">
          <Button
            onClick={handleBack}
            variant="secondary"
            className="flex-1 md:flex-initial"
          >
            Huỷ
          </Button>
          <Button onClick={handleSave} className="flex-1 md:flex-initial">
            Lưu thay đổi
          </Button>
        </div>
      </div>
    </div>
  );
}

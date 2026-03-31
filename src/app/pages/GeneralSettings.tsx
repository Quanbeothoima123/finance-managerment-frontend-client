import React, { useState, useEffect, useMemo } from "react";
import { ArrowLeft, RotateCcw } from "lucide-react";
import { Card } from "../components/Card";
import { useAppNavigation } from "../hooks/useAppNavigation";
import { useDemoData } from "../contexts/DemoDataContext";
import { useToast } from "../contexts/ToastContext";

// ── Storage helpers ──
const STORAGE_KEYS = {
  decimals: "finance-number-decimals",
  thousandsSep: "finance-thousands-separator",
  symbolPosition: "finance-symbol-position",
  dateFormat: "finance-date-format",
  showDayOfWeek: "finance-show-day-of-week",
  autoTimezone: "finance-auto-timezone",
  timezone: "finance-timezone",
};

function load<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(key);
    if (v === null) return fallback;
    return JSON.parse(v) as T;
  } catch {
    return fallback;
  }
}

function save(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

// ── Currencies ──
const CURRENCIES = [
  { code: "VND", symbol: "₫", name: "Đồng Việt Nam" },
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "EUR", symbol: "€", name: "Euro" },
];

// ── Timezones ──
const TIMEZONES = [
  { value: "Asia/Ho_Chi_Minh", label: "Asia/Ho_Chi_Minh (GMT+7)" },
  { value: "Asia/Singapore", label: "Asia/Singapore (GMT+8)" },
  { value: "Europe/London", label: "Europe/London (GMT+0)" },
  { value: "America/New_York", label: "America/New_York (GMT-5)" },
];

// ── Date formats ──
const DATE_FORMATS = [
  { value: "dd/mm/yyyy", label: "dd/mm/yyyy", example: "06/03/2026" },
  { value: "mm/dd/yyyy", label: "mm/dd/yyyy", example: "03/06/2026" },
  { value: "yyyy-mm-dd", label: "yyyy-mm-dd", example: "2026-03-06" },
];

// ── Defaults ──
const DEFAULTS = {
  decimals: 0,
  thousandsSep: true,
  symbolPosition: "after" as "before" | "after",
  dateFormat: "dd/mm/yyyy",
  showDayOfWeek: false,
  autoTimezone: true,
  timezone: "Asia/Ho_Chi_Minh",
};

// ═══════════════════════════════════════════════════════════════════════════
export default function GeneralSettings() {
  const nav = useAppNavigation();
  const toast = useToast();
  const { selectedCurrency, setSelectedCurrency } = useDemoData();

  // Local state for all settings
  const [decimals, setDecimals] = useState(() =>
    load<number>(STORAGE_KEYS.decimals, DEFAULTS.decimals),
  );
  const [thousandsSep, setThousandsSep] = useState(() =>
    load<boolean>(STORAGE_KEYS.thousandsSep, DEFAULTS.thousandsSep),
  );
  const [symbolPosition, setSymbolPosition] = useState<"before" | "after">(() =>
    load(STORAGE_KEYS.symbolPosition, DEFAULTS.symbolPosition),
  );
  const [dateFormat, setDateFormat] = useState(() =>
    load<string>(STORAGE_KEYS.dateFormat, DEFAULTS.dateFormat),
  );
  const [showDayOfWeek, setShowDayOfWeek] = useState(() =>
    load<boolean>(STORAGE_KEYS.showDayOfWeek, DEFAULTS.showDayOfWeek),
  );
  const [autoTimezone, setAutoTimezone] = useState(() =>
    load<boolean>(STORAGE_KEYS.autoTimezone, DEFAULTS.autoTimezone),
  );
  const [timezone, setTimezone] = useState(() =>
    load<string>(STORAGE_KEYS.timezone, DEFAULTS.timezone),
  );

  const currencyObj =
    CURRENCIES.find((c) => c.code === selectedCurrency) || CURRENCIES[0];

  // ── Preview ──
  const previewAmount = useMemo(() => {
    const num = 1234567.89;
    const opts: Intl.NumberFormatOptions = {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
      useGrouping: thousandsSep,
    };
    const formatted = new Intl.NumberFormat("en-US", opts)
      .format(num)
      // Replace commas with dots for VND style if needed
      .replace(/,/g, thousandsSep ? "," : "");

    if (symbolPosition === "before") {
      return `${currencyObj.symbol}${formatted}`;
    }
    return `${formatted} ${currencyObj.symbol}`;
  }, [decimals, thousandsSep, symbolPosition, currencyObj]);

  const previewDate = useMemo(() => {
    const d = new Date(2026, 2, 6); // March 6, 2026
    const dd = "06",
      mm = "03",
      yyyy = "2026";
    const dayNames = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
    const dayOfWeek = dayNames[d.getDay()]; // Friday = T6

    let formatted = "";
    switch (dateFormat) {
      case "dd/mm/yyyy":
        formatted = `${dd}/${mm}/${yyyy}`;
        break;
      case "mm/dd/yyyy":
        formatted = `${mm}/${dd}/${yyyy}`;
        break;
      case "yyyy-mm-dd":
        formatted = `${yyyy}-${mm}-${dd}`;
        break;
      default:
        formatted = `${dd}/${mm}/${yyyy}`;
    }
    if (showDayOfWeek) formatted = `${dayOfWeek}, ${formatted}`;
    return formatted;
  }, [dateFormat, showDayOfWeek]);

  // ── Save ──
  const handleSave = () => {
    save(STORAGE_KEYS.decimals, decimals);
    save(STORAGE_KEYS.thousandsSep, thousandsSep);
    save(STORAGE_KEYS.symbolPosition, symbolPosition);
    save(STORAGE_KEYS.dateFormat, dateFormat);
    save(STORAGE_KEYS.showDayOfWeek, showDayOfWeek);
    save(STORAGE_KEYS.autoTimezone, autoTimezone);
    save(STORAGE_KEYS.timezone, timezone);

    toast.success("Đã lưu cài đặt");
  };

  const handleCurrencyChange = (code: string) => {
    setSelectedCurrency(code);
    // Auto-set decimals based on currency
    if (code === "VND") {
      setDecimals(0);
      setSymbolPosition("after");
    } else {
      setDecimals(2);
      setSymbolPosition("before");
    }
    toast.warning("Chỉ áp dụng cho giao dịch mới.");
  };

  const handleRestoreDefaults = () => {
    setSelectedCurrency("VND");
    setDecimals(DEFAULTS.decimals);
    setThousandsSep(DEFAULTS.thousandsSep);
    setSymbolPosition(DEFAULTS.symbolPosition);
    setDateFormat(DEFAULTS.dateFormat);
    setShowDayOfWeek(DEFAULTS.showDayOfWeek);
    setAutoTimezone(DEFAULTS.autoTimezone);
    setTimezone(DEFAULTS.timezone);

    Object.values(STORAGE_KEYS).forEach((k) => {
      try {
        localStorage.removeItem(k);
      } catch {}
    });
    toast.success("Đã khôi phục cài đặt mặc định");
  };

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="max-w-3xl mx-auto p-4 md:p-6 pb-28 md:pb-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => nav.goBack()}
            className="p-2 rounded-[var(--radius-lg)] hover:bg-[var(--surface)] transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-[var(--text-secondary)]" />
          </button>
          <div>
            <h1 className="text-xl font-semibold text-[var(--text-primary)]">
              Cài đặt chung
            </h1>
            <p className="text-sm text-[var(--text-secondary)]">
              Currency, định dạng số/ngày, timezone
            </p>
          </div>
        </div>

        {/* B2: Currency */}
        <Card>
          <h3 className="font-semibold text-[var(--text-primary)] mb-4">
            Tiền tệ
          </h3>
          <select
            value={selectedCurrency}
            onChange={(e) => handleCurrencyChange(e.target.value)}
            className="w-full px-4 py-2.5 bg-[var(--input-background)] border border-[var(--border)] rounded-[var(--radius-lg)] text-[var(--text-primary)] appearance-none cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]"
          >
            {CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.symbol} {c.code} — {c.name}
              </option>
            ))}
          </select>
          <p className="text-xs text-[var(--text-tertiary)] mt-2">
            Áp dụng cho giao dịch mới. Giao dịch cũ giữ nguyên tiền tệ đã lưu.
          </p>
        </Card>

        {/* B3: Numeric Format */}
        <Card>
          <h3 className="font-semibold text-[var(--text-primary)] mb-4">
            Định dạng số
          </h3>

          {/* Decimals */}
          <div className="mb-4">
            <label className="block text-sm text-[var(--text-secondary)] mb-2">
              Số thập phân
            </label>
            <div className="flex gap-2">
              {[0, 2].map((d) => (
                <button
                  key={d}
                  onClick={() => setDecimals(d)}
                  className={`flex-1 px-4 py-2.5 rounded-[var(--radius-lg)] text-sm font-medium border transition-colors ${
                    decimals === d
                      ? "border-[var(--primary)] bg-[var(--primary-light)] text-[var(--primary)]"
                      : "border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--text-tertiary)]"
                  }`}
                >
                  {d} decimals{" "}
                  {d === 0 && selectedCurrency === "VND"
                    ? "(mặc định VND)"
                    : d === 2 && selectedCurrency !== "VND"
                      ? `(mặc định ${selectedCurrency})`
                      : ""}
                </button>
              ))}
            </div>
          </div>

          {/* Thousands separator */}
          <div className="flex items-center justify-between py-3 border-t border-[var(--divider)]">
            <div>
              <p className="text-sm font-medium text-[var(--text-primary)]">
                Dấu phân cách hàng nghìn
              </p>
              <p className="text-xs text-[var(--text-tertiary)]">
                {thousandsSep ? "1,234,567" : "1234567"}
              </p>
            </div>
            <button
              onClick={() => setThousandsSep(!thousandsSep)}
              className={`relative w-12 h-7 rounded-full transition-colors ${thousandsSep ? "bg-[var(--primary)]" : "bg-[var(--border)]"}`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white shadow transition-transform ${thousandsSep ? "translate-x-5" : "translate-x-0"}`}
              />
            </button>
          </div>

          {/* Symbol position */}
          <div className="pt-3 border-t border-[var(--divider)]">
            <label className="block text-sm text-[var(--text-secondary)] mb-2">
              Vị trí ký hiệu tiền
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setSymbolPosition("before")}
                className={`flex-1 px-4 py-2.5 rounded-[var(--radius-lg)] text-sm font-medium border transition-colors ${
                  symbolPosition === "before"
                    ? "border-[var(--primary)] bg-[var(--primary-light)] text-[var(--primary)]"
                    : "border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--text-tertiary)]"
                }`}
              >
                Trước số ({currencyObj.symbol}1,000)
              </button>
              <button
                onClick={() => setSymbolPosition("after")}
                className={`flex-1 px-4 py-2.5 rounded-[var(--radius-lg)] text-sm font-medium border transition-colors ${
                  symbolPosition === "after"
                    ? "border-[var(--primary)] bg-[var(--primary-light)] text-[var(--primary)]"
                    : "border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--text-tertiary)]"
                }`}
              >
                Sau số (1,000 {currencyObj.symbol})
              </button>
            </div>
          </div>
        </Card>

        {/* B4: Date Format */}
        <Card>
          <h3 className="font-semibold text-[var(--text-primary)] mb-4">
            Ngày tháng
          </h3>

          <div className="space-y-2 mb-4">
            {DATE_FORMATS.map((f) => (
              <label
                key={f.value}
                className="flex items-center gap-3 p-3 rounded-[var(--radius-lg)] border border-[var(--border)] cursor-pointer hover:bg-[var(--surface)] transition-colors"
                style={
                  dateFormat === f.value
                    ? {
                        borderColor: "var(--primary)",
                        backgroundColor: "var(--primary-light)",
                      }
                    : {}
                }
              >
                <input
                  type="radio"
                  name="dateFormat"
                  value={f.value}
                  checked={dateFormat === f.value}
                  onChange={(e) => setDateFormat(e.target.value)}
                  className="w-4 h-4 text-[var(--primary)] border-[var(--border)] focus:ring-[var(--focus-ring)]"
                />
                <div className="flex-1 flex items-center justify-between">
                  <span className="text-sm font-medium text-[var(--text-primary)]">
                    {f.label}
                  </span>
                  <span className="text-xs text-[var(--text-tertiary)] tabular-nums">
                    {f.example}
                  </span>
                </div>
              </label>
            ))}
          </div>

          {/* Show day of week */}
          <div className="flex items-center justify-between pt-3 border-t border-[var(--divider)]">
            <div>
              <p className="text-sm font-medium text-[var(--text-primary)]">
                Hiển thị tên thứ
              </p>
              <p className="text-xs text-[var(--text-tertiary)]">
                VD: T6, 06/03/2026
              </p>
            </div>
            <button
              onClick={() => setShowDayOfWeek(!showDayOfWeek)}
              className={`relative w-12 h-7 rounded-full transition-colors ${showDayOfWeek ? "bg-[var(--primary)]" : "bg-[var(--border)]"}`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white shadow transition-transform ${showDayOfWeek ? "translate-x-5" : "translate-x-0"}`}
              />
            </button>
          </div>
        </Card>

        {/* B5: Timezone */}
        <Card>
          <h3 className="font-semibold text-[var(--text-primary)] mb-4">
            Múi giờ
          </h3>

          {/* Auto toggle */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-[var(--text-primary)]">
                Tự động theo thiết bị
              </p>
              <p className="text-xs text-[var(--text-tertiary)]">
                {autoTimezone
                  ? Intl.DateTimeFormat().resolvedOptions().timeZone
                  : "Tắt"}
              </p>
            </div>
            <button
              onClick={() => setAutoTimezone(!autoTimezone)}
              className={`relative w-12 h-7 rounded-full transition-colors ${autoTimezone ? "bg-[var(--primary)]" : "bg-[var(--border)]"}`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white shadow transition-transform ${autoTimezone ? "translate-x-5" : "translate-x-0"}`}
              />
            </button>
          </div>

          {/* Manual selection */}
          {!autoTimezone && (
            <div className="pt-3 border-t border-[var(--divider)]">
              <label className="block text-sm text-[var(--text-secondary)] mb-2">
                Chọn múi giờ
              </label>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full px-4 py-2.5 bg-[var(--input-background)] border border-[var(--border)] rounded-[var(--radius-lg)] text-[var(--text-primary)] appearance-none cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]"
              >
                {TIMEZONES.map((tz) => (
                  <option key={tz.value} value={tz.value}>
                    {tz.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          <p className="text-xs text-[var(--text-tertiary)] mt-3">
            Recurring và recap dùng múi giờ này.
          </p>
        </Card>

        {/* B6: Preview */}
        <Card className="bg-[var(--surface)] border-l-4 border-l-[var(--primary)]">
          <h3 className="font-semibold text-[var(--text-primary)] mb-4">
            Xem trước
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-[var(--card)] rounded-[var(--radius-lg)]">
              <span className="text-sm text-[var(--text-secondary)]">
                Số tiền
              </span>
              <span className="text-sm font-semibold text-[var(--text-primary)] tabular-nums">
                {previewAmount}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-[var(--card)] rounded-[var(--radius-lg)]">
              <span className="text-sm text-[var(--text-secondary)]">Ngày</span>
              <span className="text-sm font-semibold text-[var(--text-primary)] tabular-nums">
                {previewDate}
              </span>
            </div>
          </div>
        </Card>

        {/* B7: Footer Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleSave}
            className="flex-1 px-6 py-3 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white rounded-[var(--radius-lg)] font-medium transition-colors"
          >
            Lưu thay đổi
          </button>
          <button
            onClick={handleRestoreDefaults}
            className="flex items-center justify-center gap-2 px-6 py-3 border border-[var(--border)] text-[var(--text-secondary)] rounded-[var(--radius-lg)] font-medium hover:bg-[var(--surface)] transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Khôi phục mặc định</span>
          </button>
        </div>
      </div>
    </div>
  );
}

import React, { useState, useMemo } from "react";
import {
  Download,
  FileText,
  File,
  Calendar,
  Filter,
  CheckCircle,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { Card } from "../components/Card";
import { Button } from "../components/Button";
import { Input } from "../components/Input";
import { useToast } from "../contexts/ToastContext";
import { useTransactionsList } from "../hooks/useTransactionsList";
import { useAccountsOverview } from "../hooks/useAccountsOverview";
import { useAppNavigation } from "../hooks/useAppNavigation";
import { useTranslation } from "react-i18next";

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob(["\uFEFF" + content], {
    type: `${mimeType};charset=utf-8`,
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function escapeCSV(val: string): string {
  if (val.includes(",") || val.includes('"') || val.includes("\n")) {
    return `"${val.replace(/"/g, '""')}"`;
  }
  return val;
}

const minor = (s: string | null | undefined) => parseInt(s || "0", 10) || 0;

export default function ExportCenter() {
  const toast = useToast();
  const nav = useAppNavigation();
  const { t, i18n } = useTranslation("settings");
  const locale = i18n.language === "vi" ? "vi-VN" : "en-US";

  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const thisMonthStart = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-01`;
  const thisMonthEnd = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate())}`;

  const [exportType, setExportType] = useState<"csv" | "pdf">("csv");
  const [startDate, setStartDate] = useState(thisMonthStart);
  const [endDate, setEndDate] = useState(thisMonthEnd);
  const [selectedAccount, setSelectedAccount] = useState("all");
  const [includeAttachments, setIncludeAttachments] = useState(false);
  const [includeCategories, setIncludeCategories] = useState(true);
  const [includeTags, setIncludeTags] = useState(true);
  const [exported, setExported] = useState(false);

  const { data: accData, loading: accLoading } = useAccountsOverview();
  const {
    data: txnData,
    loading: txnLoading,
    error: txnError,
    reload: reloadTxn,
  } = useTransactionsList({
    startDate,
    endDate,
    accountId: selectedAccount !== "all" ? selectedAccount : undefined,
    limit: 100,
  });

  const accounts = accData?.accounts ?? [];
  const filteredTransactions = txnData?.items ?? [];
  const loading = accLoading || txnLoading;
  const isTruncated =
    (txnData?.pagination?.total ?? 0) > (txnData?.items?.length ?? 0);

  const accountOptions = useMemo(() => {
    return [
      { id: "all", name: t("export.filters.account_all") },
      ...accounts.map((a: any) => ({ id: a.id, name: a.name })),
    ];
  }, [accounts, t]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(locale).format(amount);
  };

  const totalIncome = filteredTransactions
    .filter((t: any) => t.type === "income")
    .reduce(
      (sum: number, t: any) => sum + Math.abs(minor(t.totalAmountMinor)),
      0,
    );

  const totalExpense = filteredTransactions
    .filter((t: any) => t.type === "expense")
    .reduce(
      (sum: number, t: any) => sum + Math.abs(minor(t.totalAmountMinor)),
      0,
    );

  const handleExport = () => {
    if (exportType === "csv") {
      generateCSV();
    } else {
      generateTextReport();
    }
  };

  const generateCSV = () => {
    const headerParts = [
      t("export.csv_headers.date"),
      t("export.csv_headers.type"),
      t("export.csv_headers.description"),
      t("export.csv_headers.amount"),
      t("export.csv_headers.account"),
    ];
    if (includeCategories) headerParts.push(t("export.csv_headers.category"));
    if (includeTags) headerParts.push(t("export.csv_headers.tags"));
    if (includeAttachments)
      headerParts.push(t("export.csv_headers.attachment"));
    headerParts.push(t("export.csv_headers.merchant"));

    const rows = filteredTransactions.map((txn: any) => {
      const parts = [
        escapeCSV(txn.date || txn.occurredAt?.split("T")[0] || ""),
        escapeCSV(
          txn.type === "income"
            ? t("export.filters.type_income")
            : txn.type === "expense"
              ? t("export.filters.type_expense")
              : t("export.filters.type_transfer"),
        ),
        escapeCSV(txn.description || ""),
        String(minor(txn.totalAmountMinor)),
        escapeCSV(txn.account?.name || ""),
      ];
      if (includeCategories) parts.push(escapeCSV(txn.category?.name || ""));
      if (includeTags)
        parts.push(
          escapeCSV((txn.tags || []).map((t: any) => t.name).join("; ")),
        );
      if (includeAttachments)
        parts.push(
          txn.imageUrl
            ? t("export.csv_headers.attachment_yes")
            : t("export.csv_headers.attachment_no"),
        );
      parts.push(escapeCSV(txn.merchant?.name || ""));
      return parts.join(",");
    });

    const csv = [headerParts.join(","), ...rows].join("\n");
    const dateStr = `${startDate}_${endDate}`.replace(/-/g, "");
    downloadFile(csv, `giao-dich_${dateStr}.csv`, "text/csv");
    toast.success(t("export.toast.success"));
    setExported(true);
    setTimeout(() => setExported(false), 3000);
  };

  const generateTextReport = () => {
    const lines: string[] = [];
    lines.push("══════════════════════════════════════");
    lines.push(`         ${t("export.txt_headers.report_title")}`);
    lines.push("═══════════════════════════════════════");
    lines.push("");
    lines.push(`Khoảng thời gian: ${startDate} → ${endDate}`);
    lines.push(
      `Tài khoản: ${selectedAccount === "all" ? t("export.filters.account_all") : accounts.find((a: any) => a.id === selectedAccount)?.name || selectedAccount}`,
    );
    lines.push(`Ngày xuất: ${new Date().toLocaleDateString(locale)}`);
    lines.push("");
    lines.push("───────────────────────────────────────");
    lines.push(`  ${t("export.txt_headers.summary")}`);
    lines.push("───────────────────────────────────────");
    lines.push(`  Tổng thu nhập:   +${formatCurrency(totalIncome)}₫`);
    lines.push(`  Tổng chi tiêu:   -${formatCurrency(totalExpense)}₫`);
    lines.push(
      `  Cân đối:         ${formatCurrency(totalIncome - totalExpense)}₫`,
    );
    lines.push(`  Số giao dịch:    ${filteredTransactions.length}`);
    lines.push("");
    lines.push("───────────────────────────────────────");
    lines.push(`  ${t("export.txt_headers.details")}`);
    lines.push("───────────────────────────────────────");
    lines.push("");

    filteredTransactions
      .sort((a: any, b: any) =>
        (a.date || a.occurredAt || "").localeCompare(
          b.date || b.occurredAt || "",
        ),
      )
      .forEach((txn: any, idx: number) => {
        const sign =
          txn.type === "income" ? "+" : txn.type === "expense" ? "-" : "↔";
        lines.push(
          `  ${idx + 1}. [${txn.date || txn.occurredAt?.split("T")[0] || ""}] ${txn.description || ""}`,
        );
        lines.push(
          `     ${sign}${formatCurrency(Math.abs(minor(txn.totalAmountMinor)))}₫ | ${txn.account?.name || ""}${txn.category?.name ? ` | ${txn.category.name}` : ""}`,
        );
        lines.push("");
      });

    lines.push("═══════════════════════════════════════");
    lines.push(`  ${t("export.txt_headers.footer")}`);
    lines.push("═══════════════════════════════════════");

    const report = lines.join("\n");
    const dateStr = `${startDate}_${endDate}`.replace(/-/g, "");
    downloadFile(report, `bao-cao_${dateStr}.txt`, "text/plain");
    toast.success(t("export.toast.success"));
    setExported(true);
    setTimeout(() => setExported(false), 3000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]" />
      </div>
    );
  }

  if (txnError) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center p-4">
        <div className="text-center">
          <AlertTriangle className="w-10 h-10 text-[var(--danger)] mx-auto mb-3" />
          <p className="text-[var(--text-primary)] font-medium mb-1">
            Không thể tải dữ liệu
          </p>
          <p className="text-sm text-[var(--text-secondary)] mb-4">
            {txnError}
          </p>
          <button
            onClick={reloadTxn}
            className="px-4 py-2 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white rounded-[var(--radius-lg)] text-sm font-medium transition-colors"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="max-w-4xl mx-auto p-4 md:p-6 pb-20 md:pb-6 space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
            Trung tâm xuất dữ liệu
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Xuất giao dịch và báo cáo theo định dạng mong muốn
          </p>
        </div>

        {/* Truncation warning */}
        {isTruncated && (
          <div className="flex items-center gap-2 px-4 py-2.5 bg-[var(--warning-light)] border border-[var(--warning)] text-[var(--warning)] rounded-[var(--radius-lg)] text-sm">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>
              Đang hiển thị {txnData?.items?.length}/
              {txnData?.pagination?.total} giao dịch. File xuất có thể chưa đầy
              đủ.
            </span>
          </div>
        )}

        {/* Monthly Summary Card */}
        <Card className="border-l-4 border-l-[var(--primary)]">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-12 h-12 rounded-[var(--radius-lg)] bg-gradient-to-br from-[var(--primary)] to-[var(--primary-hover)] flex items-center justify-center">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-[var(--text-primary)]">
                Monthly Summary (1 trang)
              </h3>
              <p className="text-sm text-[var(--text-secondary)] mt-0.5">
                Ảnh/PDF đẹp để chia sẻ
              </p>
            </div>
            <button
              onClick={() => nav.goMonthlySummary()}
              className="flex items-center gap-2 px-4 py-2.5 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white rounded-[var(--radius-lg)] font-medium transition-colors text-sm flex-shrink-0"
            >
              Tạo summary
            </button>
          </div>
        </Card>

        {/* Export Type Selection */}
        <Card>
          <h3 className="font-semibold text-[var(--text-primary)] mb-4">
            Định dạng xuất
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => setExportType("csv")}
              className={`p-6 rounded-[var(--radius-lg)] border-2 transition-all ${
                exportType === "csv"
                  ? "bg-[var(--primary-light)] border-[var(--primary)]"
                  : "bg-[var(--surface)] border-[var(--border)] hover:bg-[var(--border)]"
              }`}
            >
              <div className="flex items-start gap-4">
                <div
                  className={`flex-shrink-0 w-12 h-12 rounded-[var(--radius-lg)] flex items-center justify-center ${
                    exportType === "csv"
                      ? "bg-[var(--primary)] text-white"
                      : "bg-[var(--surface)] text-[var(--text-secondary)]"
                  }`}
                >
                  <FileText className="w-6 h-6" />
                </div>
                <div className="flex-1 text-left">
                  <h4 className="font-semibold text-[var(--text-primary)] mb-1">
                    Xuất CSV
                  </h4>
                  <p className="text-sm text-[var(--text-secondary)]">
                    Xuất danh sách giao dịch dạng bảng để phân tích trong Excel
                    hoặc Google Sheets
                  </p>
                </div>
              </div>
            </button>

            <button
              onClick={() => setExportType("pdf")}
              className={`p-6 rounded-[var(--radius-lg)] border-2 transition-all ${
                exportType === "pdf"
                  ? "bg-[var(--primary-light)] border-[var(--primary)]"
                  : "bg-[var(--surface)] border-[var(--border)] hover:bg-[var(--border)]"
              }`}
            >
              <div className="flex items-start gap-4">
                <div
                  className={`flex-shrink-0 w-12 h-12 rounded-[var(--radius-lg)] flex items-center justify-center ${
                    exportType === "pdf"
                      ? "bg-[var(--primary)] text-white"
                      : "bg-[var(--surface)] text-[var(--text-secondary)]"
                  }`}
                >
                  <File className="w-6 h-6" />
                </div>
                <div className="flex-1 text-left">
                  <h4 className="font-semibold text-[var(--text-primary)] mb-1">
                    Xuất báo cáo văn bản
                  </h4>
                  <p className="text-sm text-[var(--text-secondary)]">
                    Xuất báo cáo tháng với tổng quan thu chi và danh sách giao
                    dịch chi tiết
                  </p>
                </div>
              </div>
            </button>
          </div>
        </Card>

        {/* Date Range */}
        <Card>
          <h3 className="font-semibold text-[var(--text-primary)] mb-4">
            <Calendar className="w-5 h-5 inline mr-2" />
            Khoảng thời gian
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                Từ ngày
              </label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                Đến ngày
              </label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          {/* Quick Date Presets */}
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              onClick={() => {
                setStartDate(thisMonthStart);
                setEndDate(thisMonthEnd);
              }}
              className="px-3 py-1.5 bg-[var(--surface)] hover:bg-[var(--border)] rounded-[var(--radius-md)] text-sm font-medium text-[var(--text-primary)] transition-colors"
            >
              {t("export.date_ranges.this_month")}
            </button>
            <button
              onClick={() => {
                const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                const prevEnd = new Date(now.getFullYear(), now.getMonth(), 0);
                setStartDate(
                  `${prev.getFullYear()}-${pad(prev.getMonth() + 1)}-01`,
                );
                setEndDate(
                  `${prevEnd.getFullYear()}-${pad(prevEnd.getMonth() + 1)}-${pad(prevEnd.getDate())}`,
                );
              }}
              className="px-3 py-1.5 bg-[var(--surface)] hover:bg-[var(--border)] rounded-[var(--radius-md)] text-sm font-medium text-[var(--text-primary)] transition-colors"
            >
              {t("export.date_ranges.last_month")}
            </button>
            <button
              onClick={() => {
                setStartDate(`${now.getFullYear()}-01-01`);
                setEndDate(`${now.getFullYear()}-12-31`);
              }}
              className="px-3 py-1.5 bg-[var(--surface)] hover:bg-[var(--border)] rounded-[var(--radius-md)] text-sm font-medium text-[var(--text-primary)] transition-colors"
            >
              {t("export.date_ranges.this_year")}
            </button>
            <button
              onClick={() => {
                const now = new Date();
                const threeMonthsAgo = new Date(now);
                threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
                setStartDate(threeMonthsAgo.toISOString().split("T")[0]);
                setEndDate(now.toISOString().split("T")[0]);
              }}
              className="px-3 py-1.5 bg-[var(--surface)] hover:bg-[var(--border)] rounded-[var(--radius-md)] text-sm font-medium text-[var(--text-primary)] transition-colors"
            >
              {t("export.date_ranges.last_3_months")}
            </button>
          </div>
        </Card>

        {/* Filters */}
        <Card>
          <h3 className="font-semibold text-[var(--text-primary)] mb-4">
            <Filter className="w-5 h-5 inline mr-2" />
            Bộ lọc
          </h3>

          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
              Tài khoản
            </label>
            <select
              value={selectedAccount}
              onChange={(e) => setSelectedAccount(e.target.value)}
              className="w-full px-4 py-2.5 bg-[var(--input-background)] border border-[var(--border)] rounded-[var(--radius-lg)] text-[var(--text-primary)] appearance-none cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]"
            >
              {accountOptions.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
            </select>
          </div>
        </Card>

        {/* Export Options */}
        <Card>
          <h3 className="font-semibold text-[var(--text-primary)] mb-4">
            Tuỳ chọn xuất
          </h3>

          <div className="space-y-4">
            {exportType === "csv" && (
              <>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeCategories}
                    onChange={(e) => setIncludeCategories(e.target.checked)}
                    className="w-5 h-5 rounded border-[var(--border)] text-[var(--primary)] focus:ring-[var(--focus-ring)]"
                  />
                  <div className="flex-1">
                    <span className="text-sm font-medium text-[var(--text-primary)] block">
                      Bao gồm danh mục
                    </span>
                    <span className="text-xs text-[var(--text-secondary)]">
                      Thêm cột danh mục cho mỗi giao dịch
                    </span>
                  </div>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeTags}
                    onChange={(e) => setIncludeTags(e.target.checked)}
                    className="w-5 h-5 rounded border-[var(--border)] text-[var(--primary)] focus:ring-[var(--focus-ring)]"
                  />
                  <div className="flex-1">
                    <span className="text-sm font-medium text-[var(--text-primary)] block">
                      Bao gồm tags
                    </span>
                    <span className="text-xs text-[var(--text-secondary)]">
                      Thêm cột tags cho mỗi giao dịch
                    </span>
                  </div>
                </label>
              </>
            )}

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={includeAttachments}
                onChange={(e) => setIncludeAttachments(e.target.checked)}
                className="w-5 h-5 rounded border-[var(--border)] text-[var(--primary)] focus:ring-[var(--focus-ring)]"
              />
              <div className="flex-1">
                <span className="text-sm font-medium text-[var(--text-primary)] block">
                  Bao gồm hoá đơn đính kèm
                </span>
                <span className="text-xs text-[var(--text-secondary)]">
                  {exportType === "csv"
                    ? "Thêm cột đánh dấu giao dịch có đính kèm"
                    : "Ghi chú giao dịch có đính kèm trong báo cáo"}
                </span>
              </div>
            </label>
          </div>
        </Card>

        {/* Preview Summary */}
        <Card className="bg-[var(--surface)]">
          <h3 className="font-semibold text-[var(--text-primary)] mb-4">
            Xem trước xuất
          </h3>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-[var(--text-secondary)] mb-1">
                Định dạng
              </p>
              <p className="text-sm font-semibold text-[var(--text-primary)]">
                {exportType === "csv" ? "CSV" : "Báo cáo TXT"}
              </p>
            </div>

            <div>
              <p className="text-xs text-[var(--text-secondary)] mb-1">
                Số giao dịch
              </p>
              <p className="text-sm font-semibold text-[var(--primary)] tabular-nums">
                {filteredTransactions.length}
              </p>
            </div>

            <div>
              <p className="text-xs text-[var(--text-secondary)] mb-1">
                Tổng thu
              </p>
              <p className="text-sm font-semibold text-[var(--success)] tabular-nums">
                +{formatCurrency(totalIncome)}₫
              </p>
            </div>

            <div>
              <p className="text-xs text-[var(--text-secondary)] mb-1">
                Tổng chi
              </p>
              <p className="text-sm font-semibold text-[var(--danger)] tabular-nums">
                -{formatCurrency(totalExpense)}₫
              </p>
            </div>
          </div>
        </Card>

        {/* Export Button */}
        <div className="flex flex-col md:flex-row gap-3">
          <Button
            onClick={handleExport}
            disabled={filteredTransactions.length === 0}
            className={`flex-1 md:flex-initial ${filteredTransactions.length === 0 ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            {exported ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <Download className="w-5 h-5" />
            )}
            {exported
              ? t("export.toast.success")
              : `${t("export.export_button")} (${filteredTransactions.length})`}
          </Button>

          <p className="text-sm text-[var(--text-secondary)] md:self-center">
            {filteredTransactions.length === 0
              ? t("export.empty")
              : t("export.footer_hint")}
          </p>
        </div>

        {/* Info Card */}
        <Card className="bg-[var(--info-light)] border-[var(--info)]">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-[var(--info)] rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white text-lg font-semibold">💡</span>
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-[var(--text-primary)] mb-1">
                Mẹo sử dụng
              </h4>
              <ul className="text-sm text-[var(--text-secondary)] space-y-1">
                <li>• File CSV có thể mở bằng Excel, Google Sheets, Numbers</li>
                <li>• Báo cáo văn bản thích hợp để xem nhanh hoặc chia sẻ</li>
                <li>• Dữ liệu xuất là bản sao, không ảnh hưởng dữ liệu gốc</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

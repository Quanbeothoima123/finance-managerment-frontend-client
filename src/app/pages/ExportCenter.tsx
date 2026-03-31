import React, { useState, useMemo } from "react";
import {
  Download,
  FileText,
  File,
  Calendar,
  Filter,
  CheckCircle,
} from "lucide-react";
import { Card } from "../components/Card";
import { Button } from "../components/Button";
import { Input } from "../components/Input";
import { useToast } from "../contexts/ToastContext";
import { useDemoData } from "../contexts/DemoDataContext";
import { useAppNavigation } from "../hooks/useAppNavigation";

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

export default function ExportCenter() {
  const toast = useToast();
  const { transactions, accounts } = useDemoData();
  const nav = useAppNavigation();
  const [exportType, setExportType] = useState<"csv" | "pdf">("csv");
  const [startDate, setStartDate] = useState("2026-02-01");
  const [endDate, setEndDate] = useState("2026-02-28");
  const [selectedAccount, setSelectedAccount] = useState("all");
  const [includeAttachments, setIncludeAttachments] = useState(false);
  const [includeCategories, setIncludeCategories] = useState(true);
  const [includeTags, setIncludeTags] = useState(true);
  const [exported, setExported] = useState(false);

  const accountOptions = useMemo(() => {
    return [
      { id: "all", name: "Tất cả tài khoản" },
      ...accounts.map((a) => ({ id: a.id, name: a.name })),
    ];
  }, [accounts]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter((txn) => {
      const txnDate = txn.date;
      if (txnDate < startDate || txnDate > endDate) return false;
      if (selectedAccount !== "all" && txn.accountId !== selectedAccount)
        return false;
      return true;
    });
  }, [transactions, startDate, endDate, selectedAccount]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN").format(amount);
  };

  const totalIncome = filteredTransactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const totalExpense = filteredTransactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const handleExport = () => {
    if (exportType === "csv") {
      generateCSV();
    } else {
      generateTextReport();
    }
  };

  const generateCSV = () => {
    const headerParts = ["Ngày", "Loại", "Mô tả", "Số tiền", "Tài khoản"];
    if (includeCategories) headerParts.push("Danh mục");
    if (includeTags) headerParts.push("Nhãn");
    if (includeAttachments) headerParts.push("Đính kèm");
    headerParts.push("Nhà cung cấp");

    const rows = filteredTransactions.map((txn) => {
      const parts = [
        escapeCSV(txn.date),
        escapeCSV(
          txn.type === "income"
            ? "Thu nhập"
            : txn.type === "expense"
              ? "Chi tiêu"
              : "Chuyển khoản",
        ),
        escapeCSV(txn.description),
        String(txn.amount),
        escapeCSV(txn.account),
      ];
      if (includeCategories) parts.push(escapeCSV(txn.category || ""));
      if (includeTags) parts.push(escapeCSV((txn.tags || []).join("; ")));
      if (includeAttachments) parts.push(txn.attachment ? "Có" : "Không");
      parts.push(escapeCSV(txn.merchant || ""));
      return parts.join(",");
    });

    const csv = [headerParts.join(","), ...rows].join("\n");
    const dateStr = `${startDate}_${endDate}`.replace(/-/g, "");
    downloadFile(csv, `giao-dich_${dateStr}.csv`, "text/csv");
    toast.success(
      `Đã xuất ${filteredTransactions.length} giao dịch ra file CSV`,
    );
    setExported(true);
    setTimeout(() => setExported(false), 3000);
  };

  const generateTextReport = () => {
    const lines: string[] = [];
    lines.push("══════════════════════════════════════");
    lines.push("         BÁO CÁO TÀI CHÍNH");
    lines.push("═══════════════════════════════════════");
    lines.push("");
    lines.push(`Khoảng thời gian: ${startDate} → ${endDate}`);
    lines.push(
      `Tài khoản: ${selectedAccount === "all" ? "Tất cả" : accounts.find((a) => a.id === selectedAccount)?.name || selectedAccount}`,
    );
    lines.push(`Ngày xuất: ${new Date().toLocaleDateString("vi-VN")}`);
    lines.push("");
    lines.push("───────────────────────────────────────");
    lines.push("  TỔNG QUAN");
    lines.push("───────────────────────────────────────");
    lines.push(`  Tổng thu nhập:   +${formatCurrency(totalIncome)}₫`);
    lines.push(`  Tổng chi tiêu:   -${formatCurrency(totalExpense)}₫`);
    lines.push(
      `  Cân đối:         ${formatCurrency(totalIncome - totalExpense)}₫`,
    );
    lines.push(`  Số giao dịch:    ${filteredTransactions.length}`);
    lines.push("");
    lines.push("───────────────────────────────────────");
    lines.push("  CHI TIẾT GIAO DỊCH");
    lines.push("───────────────────────────────────────");
    lines.push("");

    filteredTransactions
      .sort((a, b) => a.date.localeCompare(b.date))
      .forEach((txn, idx) => {
        const sign =
          txn.type === "income" ? "+" : txn.type === "expense" ? "-" : "↔";
        lines.push(`  ${idx + 1}. [${txn.date}] ${txn.description}`);
        lines.push(
          `     ${sign}${formatCurrency(Math.abs(txn.amount))}₫ | ${txn.account}${txn.category ? ` | ${txn.category}` : ""}`,
        );
        lines.push("");
      });

    lines.push("═══════════════════════════════════════");
    lines.push("  Xuất bởi FinanceApp");
    lines.push("═══════════════════════════════════════");

    const report = lines.join("\n");
    const dateStr = `${startDate}_${endDate}`.replace(/-/g, "");
    downloadFile(report, `bao-cao_${dateStr}.txt`, "text/plain");
    toast.success(`Đã xuất báo cáo ${filteredTransactions.length} giao dịch`);
    setExported(true);
    setTimeout(() => setExported(false), 3000);
  };

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="max-w-4xl mx-auto p-4 md:p-6 pb-20 md:pb-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
            Trung tâm xuất dữ liệu
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Xuất giao dịch và báo cáo theo định dạng mong muốn
          </p>
        </div>

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
                setStartDate("2026-02-01");
                setEndDate("2026-02-28");
              }}
              className="px-3 py-1.5 bg-[var(--surface)] hover:bg-[var(--border)] rounded-[var(--radius-md)] text-sm font-medium text-[var(--text-primary)] transition-colors"
            >
              Tháng này
            </button>
            <button
              onClick={() => {
                setStartDate("2026-01-01");
                setEndDate("2026-01-31");
              }}
              className="px-3 py-1.5 bg-[var(--surface)] hover:bg-[var(--border)] rounded-[var(--radius-md)] text-sm font-medium text-[var(--text-primary)] transition-colors"
            >
              Tháng trước
            </button>
            <button
              onClick={() => {
                setStartDate("2026-01-01");
                setEndDate("2026-12-31");
              }}
              className="px-3 py-1.5 bg-[var(--surface)] hover:bg-[var(--border)] rounded-[var(--radius-md)] text-sm font-medium text-[var(--text-primary)] transition-colors"
            >
              Năm nay
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
              3 tháng gần nhất
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
              ? "Đã xuất thành công!"
              : `Xuất ${filteredTransactions.length} giao dịch`}
          </Button>

          <p className="text-sm text-[var(--text-secondary)] md:self-center">
            {filteredTransactions.length === 0
              ? "Không có giao dịch nào trong khoảng thời gian này"
              : "File sẽ được tải về máy của bạn"}
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

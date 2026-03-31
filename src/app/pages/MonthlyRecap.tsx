import React, { useMemo } from "react";
import {
  Share2,
  Download,
  TrendingUp,
  TrendingDown,
  Target,
  ShoppingBag,
  DollarSign,
  Calendar,
  FileText,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { Card } from "../components/Card";
import { useToast } from "../contexts/ToastContext";
import { useAppNavigation } from "../hooks/useAppNavigation";
import { useTransactionsList } from "../hooks/useTransactionsList";
import { useCategoriesList } from "../hooks/useCategoriesList";
import { useBudgetsList } from "../hooks/useBudgetsList";
import { useGoalsList } from "../hooks/useGoalsList";

export default function MonthlyRecap() {
  const toast = useToast();
  const nav = useAppNavigation();

  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const currentMonthKey = `${now.getFullYear()}-${pad(now.getMonth() + 1)}`;
  const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevMonthKey = `${prevMonthDate.getFullYear()}-${pad(prevMonthDate.getMonth() + 1)}`;

  // Current month transactions
  const curStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const curEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const {
    data: curTxnData,
    loading: curLoading,
    error: curError,
    reload: reloadCur,
  } = useTransactionsList({
    startDate: `${curStart.getFullYear()}-${pad(curStart.getMonth() + 1)}-01`,
    endDate: `${curEnd.getFullYear()}-${pad(curEnd.getMonth() + 1)}-${pad(curEnd.getDate())}`,
    limit: 100,
    sortBy: "date",
    sortOrder: "desc",
  });
  const currentTxns = curTxnData?.items ?? [];
  const isTruncated =
    (curTxnData?.pagination?.total ?? 0) > (curTxnData?.items?.length ?? 0);

  // Previous month transactions
  const prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevEnd = new Date(now.getFullYear(), now.getMonth(), 0);
  const { data: prevTxnData, loading: prevLoading } = useTransactionsList({
    startDate: `${prevStart.getFullYear()}-${pad(prevStart.getMonth() + 1)}-01`,
    endDate: `${prevEnd.getFullYear()}-${pad(prevEnd.getMonth() + 1)}-${pad(prevEnd.getDate())}`,
    limit: 100,
    sortBy: "date",
    sortOrder: "desc",
  });
  const prevTxns = prevTxnData?.items ?? [];

  const { data: catData } = useCategoriesList();
  const { data: budgetData, loading: budLoading } = useBudgetsList({
    month: currentMonthKey,
  });
  const { data: goalData, loading: goalLoading } = useGoalsList();

  const minor = (s: string | null | undefined) => parseInt(s || "0", 10) || 0;

  const isLoading = curLoading || prevLoading || budLoading || goalLoading;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN").format(amount);
  };

  const monthLabel = now.toLocaleDateString("vi-VN", {
    month: "long",
    year: "numeric",
  });

  // Compute all recap data from real APIs
  const recapData = useMemo(() => {
    // Income & expense totals
    const totalIncome = currentTxns
      .filter((t) => t.type === "income")
      .reduce((s, t) => s + minor(t.totalAmountMinor), 0);
    const totalExpense = currentTxns
      .filter((t) => t.type === "expense")
      .reduce((s, t) => s + minor(t.totalAmountMinor), 0);
    const prevIncome = prevTxns
      .filter((t) => t.type === "income")
      .reduce((s, t) => s + minor(t.totalAmountMinor), 0);
    const prevExpense = prevTxns
      .filter((t) => t.type === "expense")
      .reduce((s, t) => s + minor(t.totalAmountMinor), 0);

    const savings = totalIncome - totalExpense;
    const savingsRate = totalIncome > 0 ? (savings / totalIncome) * 100 : 0;

    // Category lookup
    const catLookup: Record<string, string> = {};
    (catData?.items ?? []).forEach((c) => {
      catLookup[c.id] = c.name;
    });

    // Top category
    const catSpend: Record<string, number> = {};
    currentTxns
      .filter((t) => t.type === "expense")
      .forEach((t) => {
        const key = t.category?.id || "unknown";
        catSpend[key] = (catSpend[key] || 0) + minor(t.totalAmountMinor);
      });
    const sortedCats = Object.entries(catSpend).sort((a, b) => b[1] - a[1]);
    const topCat = sortedCats[0];
    const topCatPercentage =
      topCat && totalExpense > 0
        ? Math.round((topCat[1] / totalExpense) * 100)
        : 0;

    // Biggest purchase
    const expenses = currentTxns
      .filter((t) => t.type === "expense")
      .sort((a, b) => minor(b.totalAmountMinor) - minor(a.totalAmountMinor));
    const biggest = expenses[0];

    // Budget status (derived from progressPercent)
    const budgets = budgetData?.items ?? [];
    const onTrack = budgets.filter((b) => b.progressPercent <= 80).length;
    const exceeded = budgets.filter((b) => b.progressPercent > 100).length;

    // Goal progress (using uiStatus)
    const goals = goalData?.items ?? [];
    const goalsOnTrack = goals.filter((g) => g.uiStatus === "on-track").length;
    const goalsAtRisk = goals.filter((g) => g.uiStatus === "behind").length;
    const goalsCompleted = goals.filter(
      (g) => g.uiStatus === "achieved",
    ).length;

    // Comparisons
    const incomeDiff =
      prevIncome > 0 ? ((totalIncome - prevIncome) / prevIncome) * 100 : 0;
    const expenseDiff =
      prevExpense > 0 ? ((totalExpense - prevExpense) / prevExpense) * 100 : 0;
    const prevSavings = prevIncome - prevExpense;
    const savingsDiff =
      prevSavings !== 0
        ? ((savings - prevSavings) / Math.abs(prevSavings)) * 100
        : 0;

    return {
      month: monthLabel,
      totalIncome,
      totalExpense,
      savings,
      savingsRate: Number(savingsRate.toFixed(1)),
      topCategory: {
        name: topCat
          ? catLookup[topCat[0]] ||
            currentTxns.find((t) => t.category?.id === topCat[0])?.category
              ?.name ||
            topCat[0]
          : "N/A",
        amount: topCat ? topCat[1] : 0,
        percentage: topCatPercentage,
      },
      biggestPurchase: biggest
        ? {
            description:
              biggest.description || biggest.category?.name || "Giao dịch",
            amount: minor(biggest.totalAmountMinor),
            date: new Date(
              biggest.date || biggest.occurredAt,
            ).toLocaleDateString("vi-VN"),
            category: biggest.category?.name || "",
          }
        : {
            description: "Chưa có dữ liệu",
            amount: 0,
            date: "",
            category: "",
          },
      budgetStatus: {
        total: budgets.length,
        onTrack,
        exceeded,
        underUsed: budgets.length - onTrack - exceeded,
      },
      goalProgress: {
        total: goals.length,
        onTrack: goalsOnTrack,
        atRisk: goalsAtRisk,
        completed: goalsCompleted,
      },
      comparison: {
        incomeDiff: Number(incomeDiff.toFixed(1)),
        expenseDiff: Number(expenseDiff.toFixed(1)),
        savingsDiff: Number(savingsDiff.toFixed(1)),
      },
    };
  }, [currentTxns, prevTxns, catData, budgetData, goalData, monthLabel]);

  // Generate summary message
  const summaryMessage = useMemo(() => {
    if (recapData.comparison.expenseDiff > 0) {
      return `Tháng này chi tiêu của bạn tăng ${recapData.comparison.expenseDiff}% so với tháng trước. Hãy chú ý kiểm soát chi tiêu để đạt mục tiêu tiết kiệm.`;
    } else if (recapData.comparison.expenseDiff < 0) {
      return `Tuyệt vời! Chi tiêu tháng này giảm ${Math.abs(recapData.comparison.expenseDiff)}% so với tháng trước. Hãy tiếp tục duy trì thói quen tốt này!`;
    }
    return "Chi tiêu tháng này ổn định so với tháng trước. Hãy tiếp tục theo dõi để đạt mục tiêu tài chính.";
  }, [recapData]);

  const handleShare = () => {
    const text = `Tổng kết ${recapData.month}\nThu nhập: ${formatCurrency(recapData.totalIncome)}₫\nChi tiêu: ${formatCurrency(recapData.totalExpense)}₫\nTiết kiệm: ${formatCurrency(recapData.savings)}₫ (${recapData.savingsRate}%)`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
    }
    toast.success("Đã sao chép tổng kết tháng vào clipboard");
  };

  const handleExport = () => {
    const content = [
      `TỔNG KẾT ${recapData.month.toUpperCase()}`,
      `=====================================`,
      ``,
      `THU NHẬP: ${formatCurrency(recapData.totalIncome)}₫`,
      `CHI TIÊU: ${formatCurrency(recapData.totalExpense)}₫`,
      `TIẾT KIỆM: ${formatCurrency(recapData.savings)}₫ (${recapData.savingsRate}%)`,
      ``,
      `DANH MỤC CHI NHIỀU NHẤT: ${recapData.topCategory.name} - ${formatCurrency(recapData.topCategory.amount)}₫ (${recapData.topCategory.percentage}%)`,
      `KHOẢN CHI LỚN NHẤT: ${recapData.biggestPurchase.description} - ${formatCurrency(recapData.biggestPurchase.amount)}₫`,
      ``,
      `NGÂN SÁCH: ${recapData.budgetStatus.onTrack} đúng mức, ${recapData.budgetStatus.exceeded} vượt mức`,
      `MỤC TIÊU: ${recapData.goalProgress.completed} hoàn thành, ${recapData.goalProgress.onTrack} đúng tiến độ`,
    ].join("\n");

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tong-ket-${currentMonthKey}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Đã xuất báo cáo tổng kết tháng");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[var(--primary)] to-[var(--primary-hover)] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-white animate-spin" />
      </div>
    );
  }

  if (curError) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center p-4">
        <div className="text-center">
          <AlertTriangle className="w-10 h-10 text-[var(--danger)] mx-auto mb-3" />
          <p className="text-[var(--text-primary)] font-medium mb-1">
            Không thể tải dữ liệu
          </p>
          <p className="text-sm text-[var(--text-secondary)] mb-4">
            {curError}
          </p>
          <button
            onClick={reloadCur}
            className="px-4 py-2 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white rounded-[var(--radius-lg)] text-sm font-medium transition-colors"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--primary)] to-[var(--primary-hover)]">
      <div className="max-w-4xl mx-auto p-4 md:p-6 pb-20 md:pb-6">
        {/* Action Buttons */}
        <div className="flex justify-end gap-3 mb-6">
          <button
            onClick={() => nav.goMonthlySummary()}
            className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-[var(--radius-lg)] font-medium transition-colors backdrop-blur-sm"
          >
            <FileText className="w-5 h-5" />
            <span>Xuất 1 trang</span>
          </button>
          <button
            onClick={handleShare}
            className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-[var(--radius-lg)] font-medium transition-colors backdrop-blur-sm"
          >
            <Share2 className="w-5 h-5" />
            <span>Chia sẻ</span>
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-[var(--radius-lg)] font-medium transition-colors backdrop-blur-sm"
          >
            <Download className="w-5 h-5" />
            <span>Xuất file</span>
          </button>
        </div>

        {/* Truncation warning */}
        {isTruncated && (
          <div className="flex items-center gap-2 px-4 py-2.5 mb-4 bg-yellow-500/20 border border-yellow-400/50 text-yellow-200 rounded-[var(--radius-lg)] text-sm">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>
              Đang hiển thị {curTxnData?.items?.length}/{curTxnData?.pagination?.total} giao
              dịch. Số liệu có thể chưa đầy đủ.
            </span>
          </div>
        )}

        {/* Main Card */}
        <div className="bg-[var(--card)] rounded-[var(--radius-xl)] shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-br from-[var(--primary)] to-[var(--primary-hover)] p-8 text-center text-white">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-4">
              <Calendar className="w-8 h-8" />
            </div>
            <h1 className="text-3xl font-bold mb-2">Tổng kết tháng</h1>
            <p className="text-xl text-white/90">{recapData.month}</p>
          </div>

          <div className="p-6 md:p-8 space-y-6">
            {/* Income & Expense Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Total Income */}
              <div className="bg-[var(--success-light)] rounded-[var(--radius-lg)] p-6 border-2 border-[var(--success)]">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-[var(--success)] rounded-[var(--radius-md)] flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-sm font-medium text-[var(--text-secondary)]">
                    Thu nhập
                  </span>
                </div>
                <p className="text-2xl font-bold text-[var(--text-primary)] tabular-nums mb-1">
                  {formatCurrency(recapData.totalIncome)}₫
                </p>
                {recapData.comparison.incomeDiff !== 0 && (
                  <p className="text-xs text-[var(--text-secondary)]">
                    {recapData.comparison.incomeDiff >= 0 ? "+" : ""}
                    {recapData.comparison.incomeDiff}% so với tháng trước
                  </p>
                )}
              </div>

              {/* Total Expense */}
              <div className="bg-[var(--danger-light)] rounded-[var(--radius-lg)] p-6 border-2 border-[var(--danger)]">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-[var(--danger)] rounded-[var(--radius-md)] flex items-center justify-center">
                    <TrendingDown className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-sm font-medium text-[var(--text-secondary)]">
                    Chi tiêu
                  </span>
                </div>
                <p className="text-2xl font-bold text-[var(--text-primary)] tabular-nums mb-1">
                  {formatCurrency(recapData.totalExpense)}₫
                </p>
                {recapData.comparison.expenseDiff !== 0 && (
                  <p className="text-xs text-[var(--text-secondary)]">
                    {recapData.comparison.expenseDiff >= 0 ? "+" : ""}
                    {recapData.comparison.expenseDiff}% so với tháng trước
                  </p>
                )}
              </div>

              {/* Savings */}
              <div className="bg-[var(--primary-light)] rounded-[var(--radius-lg)] p-6 border-2 border-[var(--primary)]">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-[var(--primary)] rounded-[var(--radius-md)] flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-sm font-medium text-[var(--text-secondary)]">
                    {recapData.savings >= 0 ? "Tiết kiệm" : "Vượt chi"}
                  </span>
                </div>
                <p className="text-2xl font-bold text-[var(--text-primary)] tabular-nums mb-1">
                  {formatCurrency(Math.abs(recapData.savings))}₫
                </p>
                <p className="text-xs text-[var(--text-secondary)]">
                  Tỷ lệ: {recapData.savingsRate}%
                </p>
              </div>
            </div>

            {/* Top Category */}
            <Card className="bg-[var(--surface)]">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-[var(--text-primary)]">
                  Danh mục chi nhiều nhất
                </h3>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-[var(--card)] rounded-[var(--radius-lg)] flex items-center justify-center text-3xl">
                  <ShoppingBag className="w-8 h-8 text-[var(--primary)]" />
                </div>
                <div className="flex-1">
                  <p className="text-lg font-semibold text-[var(--text-primary)]">
                    {recapData.topCategory.name}
                  </p>
                  <p className="text-sm text-[var(--text-secondary)]">
                    {recapData.topCategory.percentage}% tổng chi tiêu
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-[var(--text-primary)] tabular-nums">
                    {formatCurrency(recapData.topCategory.amount)}₫
                  </p>
                </div>
              </div>
            </Card>

            {/* Biggest Purchase */}
            <Card className="bg-[var(--surface)]">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-[var(--text-primary)]">
                  Khoản chi lớn nhất
                </h3>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-[var(--warning-light)] rounded-[var(--radius-lg)] flex items-center justify-center">
                  <ShoppingBag className="w-8 h-8 text-[var(--warning)]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-lg font-semibold text-[var(--text-primary)] truncate">
                    {recapData.biggestPurchase.description}
                  </p>
                  <p className="text-sm text-[var(--text-secondary)]">
                    {recapData.biggestPurchase.category}
                    {recapData.biggestPurchase.date
                      ? ` \u2022 ${recapData.biggestPurchase.date}`
                      : ""}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xl font-bold text-[var(--danger)] tabular-nums">
                    {formatCurrency(recapData.biggestPurchase.amount)}₫
                  </p>
                </div>
              </div>
            </Card>

            {/* Budget Status */}
            <Card className="bg-[var(--surface)]">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-[var(--text-primary)]">
                  Tình trạng ngân sách
                </h3>
                <span className="text-sm text-[var(--text-secondary)]">
                  {recapData.budgetStatus.total} ngân sách
                </span>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="w-12 h-12 bg-[var(--success-light)] rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-xl font-bold text-[var(--success)] tabular-nums">
                      {recapData.budgetStatus.onTrack}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--text-secondary)]">
                    Đúng mức
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-[var(--danger-light)] rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-xl font-bold text-[var(--danger)] tabular-nums">
                      {recapData.budgetStatus.exceeded}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--text-secondary)]">
                    Vượt mức
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-[var(--info-light)] rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-xl font-bold text-[var(--info)] tabular-nums">
                      {recapData.budgetStatus.underUsed}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--text-secondary)]">
                    Tiết kiệm
                  </p>
                </div>
              </div>
            </Card>

            {/* Goal Progress */}
            <Card className="bg-[var(--surface)]">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-[var(--text-primary)]">
                  Tiến độ mục tiêu
                </h3>
                <span className="text-sm text-[var(--text-secondary)]">
                  {recapData.goalProgress.total} mục tiêu
                </span>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="w-12 h-12 bg-[var(--primary-light)] rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-xl font-bold text-[var(--primary)] tabular-nums">
                      {recapData.goalProgress.onTrack}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--text-secondary)]">
                    Đúng tiến độ
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-[var(--warning-light)] rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-xl font-bold text-[var(--warning)] tabular-nums">
                      {recapData.goalProgress.atRisk}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--text-secondary)]">
                    Cần tăng tốc
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-[var(--success-light)] rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-xl font-bold text-[var(--success)] tabular-nums">
                      {recapData.goalProgress.completed}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--text-secondary)]">
                    Hoàn thành
                  </p>
                </div>
              </div>
            </Card>

            {/* Summary Message */}
            <Card className="bg-gradient-to-br from-[var(--primary-light)] to-[var(--info-light)] border-[var(--primary)]">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-[var(--primary)] rounded-full mb-3">
                  <Target className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold text-[var(--text-primary)] mb-2">
                  Nhận xét chung
                </h3>
                <p className="text-sm text-[var(--text-secondary)] mb-4">
                  {summaryMessage}
                </p>
                <div className="flex items-center justify-center gap-2">
                  <span className="text-xs text-[var(--text-tertiary)]">
                    Tạo bởi Quản lý tài chính
                  </span>
                  <span className="text-xs text-[var(--text-tertiary)]">
                    &bull;
                  </span>
                  <span className="text-xs text-[var(--text-tertiary)]">
                    {now.toLocaleDateString("vi-VN")}
                  </span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

import React, { useState, useMemo } from "react";
import {
  ArrowLeft,
  PieChart as PieChartIcon,
  BarChart3,
  ChevronDown,
} from "lucide-react";
import { Card } from "../components/Card";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useAppNavigation } from "../hooks/useAppNavigation";
import { useDemoData } from "../contexts/DemoDataContext";
import {
  TagFilterDropdown,
  TagFilterBadge,
  filterByTags,
} from "../components/TagFilterDropdown";

const FALLBACK_COLORS = [
  "#ef4444",
  "#8b5cf6",
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ec4899",
  "#6366f1",
  "#14b8a6",
  "#f97316",
  "#06b6d4",
];

interface CategoryItemProps {
  category: {
    id: string;
    name: string;
    amount: number;
    percentage: number;
    color: string;
    transactions: number;
  };
  rank: number;
}

function CategoryItem({ category, rank }: CategoryItemProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN").format(amount);
  };

  return (
    <div className="flex items-center gap-4 py-4 border-b border-[var(--divider)] last:border-0">
      <div className="flex items-center gap-3 flex-1">
        <div className="w-8 h-8 rounded-full bg-[var(--surface)] flex items-center justify-center text-sm font-semibold text-[var(--text-secondary)]">
          {rank}
        </div>
        <div
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: category.color }}
        />
        <div className="flex-1">
          <p className="text-sm font-medium text-[var(--text-primary)]">
            {category.name}
          </p>
          <p className="text-xs text-[var(--text-secondary)]">
            {category.transactions} giao dịch
          </p>
        </div>
      </div>
      <div className="text-right">
        <p className="text-sm font-semibold text-[var(--text-primary)] tabular-nums">
          {formatCurrency(category.amount)}₫
        </p>
        <p className="text-xs text-[var(--text-secondary)] tabular-nums">
          {category.percentage}%
        </p>
      </div>
    </div>
  );
}

export default function CategoryBreakdown() {
  const [chartType, setChartType] = useState<"pie" | "bar">("pie");
  const [selectedMonth, setSelectedMonth] = useState("2026-02");
  const [selectedAccount, setSelectedAccount] = useState("all");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [tagFilterMode, setTagFilterMode] = useState<"AND" | "OR">("OR");
  const nav = useAppNavigation();
  const { transactions, categories, accounts, tags } = useDemoData();

  const handleBack = () => {
    nav.goBack();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN").format(amount);
  };

  // Build month options from transactions
  const months = useMemo(() => {
    const monthSet = new Set<string>();
    transactions.forEach((t) => {
      const d = new Date(t.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      monthSet.add(key);
    });
    return [...monthSet]
      .sort((a, b) => b.localeCompare(a))
      .slice(0, 12)
      .map((key) => {
        const [y, m] = key.split("-");
        return { id: key, name: `Tháng ${parseInt(m)}, ${y}` };
      });
  }, [transactions]);

  // Build account options
  const accountOptions = useMemo(
    () => [
      { id: "all", name: "Tất cả tài khoản" },
      ...accounts.map((a) => ({ id: a.id, name: a.name })),
    ],
    [accounts],
  );

  // Build category data from real transactions
  const categoryData = useMemo(() => {
    const [yearStr, monthStr] = selectedMonth.split("-");
    const year = parseInt(yearStr);
    const month = parseInt(monthStr) - 1;

    const catLookup: Record<string, { name: string; color: string }> = {};
    categories.forEach((c) => {
      catLookup[c.id] = { name: c.name, color: c.color };
    });

    const catMap: Record<string, { amount: number; transactions: number }> = {};

    transactions
      .filter((t) => {
        if (t.type !== "expense") return false;
        const d = new Date(t.date);
        if (d.getFullYear() !== year || d.getMonth() !== month) return false;
        if (selectedAccount !== "all" && t.accountId !== selectedAccount)
          return false;
        if (
          selectedTags.length > 0 &&
          !filterByTags(t.tags, selectedTags, tagFilterMode)
        )
          return false;
        return true;
      })
      .forEach((t) => {
        const key = t.categoryId || t.category;
        if (!catMap[key]) catMap[key] = { amount: 0, transactions: 0 };
        catMap[key].amount += Math.abs(t.amount);
        catMap[key].transactions += 1;
      });

    const total = Object.values(catMap).reduce((s, v) => s + v.amount, 0) || 1;

    return Object.entries(catMap)
      .map(([key, val], idx) => ({
        id: key,
        name: catLookup[key]?.name || key,
        amount: val.amount,
        percentage: Math.round((val.amount / total) * 100),
        color:
          catLookup[key]?.color ||
          FALLBACK_COLORS[idx % FALLBACK_COLORS.length],
        transactions: val.transactions,
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [
    transactions,
    categories,
    selectedMonth,
    selectedAccount,
    selectedTags,
    tagFilterMode,
  ]);

  const totalAmount = categoryData.reduce((sum, cat) => sum + cat.amount, 0);
  const totalTransactions = categoryData.reduce(
    (sum, cat) => sum + cat.transactions,
    0,
  );
  const avgPerTransaction =
    totalTransactions > 0 ? totalAmount / totalTransactions : 0;

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="max-w-6xl mx-auto p-4 md:p-6 pb-20 md:pb-6 space-y-6">
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
            Phân tích danh mục
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Chi tiết chi tiêu theo từng danh mục
          </p>
        </div>

        {/* Filters */}
        <Card>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Month Filter */}
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                Thời gian
              </label>
              <div className="relative">
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[var(--input-background)] border border-[var(--border)] rounded-[var(--radius-lg)] text-[var(--text-primary)] appearance-none cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]"
                >
                  {months.map((month) => (
                    <option key={month.id} value={month.id}>
                      {month.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-secondary)] pointer-events-none" />
              </div>
            </div>

            {/* Account Filter */}
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                Tài khoản
              </label>
              <div className="relative">
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
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-secondary)] pointer-events-none" />
              </div>
            </div>

            {/* Chart Type Toggle */}
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                Loại biểu đồ
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setChartType("pie")}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-[var(--radius-lg)] font-medium transition-all ${
                    chartType === "pie"
                      ? "bg-[var(--primary)] text-white shadow-[var(--shadow-sm)]"
                      : "bg-[var(--surface)] text-[var(--text-secondary)] hover:bg-[var(--border)]"
                  }`}
                >
                  <PieChartIcon className="w-4 h-4" />
                  <span className="text-sm">Tròn</span>
                </button>
                <button
                  onClick={() => setChartType("bar")}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-[var(--radius-lg)] font-medium transition-all ${
                    chartType === "bar"
                      ? "bg-[var(--primary)] text-white shadow-[var(--shadow-sm)]"
                      : "bg-[var(--surface)] text-[var(--text-secondary)] hover:bg-[var(--border)]"
                  }`}
                >
                  <BarChart3 className="w-4 h-4" />
                  <span className="text-sm">Cột</span>
                </button>
              </div>
            </div>
          </div>
        </Card>

        {/* Tag Filter */}
        {tags.length > 0 && (
          <Card>
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-sm font-medium text-[var(--text-primary)]">
                  Lọc theo tag
                </span>
                <TagFilterDropdown
                  tags={tags}
                  selectedTags={selectedTags}
                  onSelectedTagsChange={setSelectedTags}
                  tagFilterMode={tagFilterMode}
                  onTagFilterModeChange={setTagFilterMode}
                />
              </div>
              {selectedTags.length > 0 && (
                <TagFilterBadge
                  tags={tags}
                  selectedTags={selectedTags}
                  tagFilterMode={tagFilterMode}
                  onClear={() => setSelectedTags([])}
                />
              )}
            </div>
          </Card>
        )}

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <p className="text-sm text-[var(--text-secondary)] mb-2">
              Tổng chi tiêu
            </p>
            <p className="text-2xl font-bold text-[var(--text-primary)] tabular-nums">
              {formatCurrency(totalAmount)}₫
            </p>
          </Card>

          <Card>
            <p className="text-sm text-[var(--text-secondary)] mb-2">
              Số giao dịch
            </p>
            <p className="text-2xl font-bold text-[var(--text-primary)] tabular-nums">
              {totalTransactions}
            </p>
          </Card>

          <Card>
            <p className="text-sm text-[var(--text-secondary)] mb-2">
              Trung bình/giao dịch
            </p>
            <p className="text-2xl font-bold text-[var(--text-primary)] tabular-nums">
              {formatCurrency(Math.round(avgPerTransaction))}₫
            </p>
          </Card>
        </div>

        {/* Chart */}
        <Card>
          {categoryData.length === 0 ? (
            <div className="h-80 flex items-center justify-center">
              <p className="text-sm text-[var(--text-tertiary)]">
                Không có dữ liệu cho khoảng thời gian này
              </p>
            </div>
          ) : chartType === "pie" ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percentage }) => `${name} ${percentage}%`}
                      outerRadius={120}
                      dataKey="amount"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "var(--card)",
                        border: "1px solid var(--border)",
                        borderRadius: "var(--radius-lg)",
                        fontSize: "12px",
                      }}
                      formatter={(value: number) => [
                        `${formatCurrency(value)}₫`,
                        "Chi tiêu",
                      ]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="flex flex-col justify-center space-y-3">
                {categoryData.map((category) => (
                  <div key={category.id} className="flex items-center gap-3">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: category.color }}
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-[var(--text-primary)]">
                        {category.name}
                      </p>
                      <p className="text-xs text-[var(--text-secondary)]">
                        {category.transactions} giao dịch
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-[var(--text-primary)] tabular-nums">
                        {formatCurrency(category.amount)}₫
                      </p>
                      <p className="text-xs text-[var(--text-secondary)] tabular-nums">
                        {category.percentage}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData} layout="vertical">
                  <XAxis
                    type="number"
                    tick={{ fill: "var(--text-tertiary)", fontSize: 12 }}
                    tickLine={false}
                    axisLine={{ stroke: "var(--divider)" }}
                    tickFormatter={(value) =>
                      `${(value / 1000000).toFixed(0)}M`
                    }
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fill: "var(--text-tertiary)", fontSize: 12 }}
                    tickLine={false}
                    axisLine={{ stroke: "var(--divider)" }}
                    width={100}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--card)",
                      border: "1px solid var(--border)",
                      borderRadius: "var(--radius-lg)",
                      fontSize: "12px",
                    }}
                    formatter={(value: number) => [
                      `${formatCurrency(value)}₫`,
                      "Chi tiêu",
                    ]}
                  />
                  <Bar dataKey="amount" radius={[0, 8, 8, 0]}>
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        {/* Category List */}
        {categoryData.length > 0 && (
          <Card>
            <h3 className="font-semibold text-[var(--text-primary)] mb-4">
              Danh sách chi tiết ({categoryData.length} danh mục)
            </h3>
            <div className="space-y-0">
              {categoryData.map((category, index) => (
                <CategoryItem
                  key={category.id}
                  category={category}
                  rank={index + 1}
                />
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

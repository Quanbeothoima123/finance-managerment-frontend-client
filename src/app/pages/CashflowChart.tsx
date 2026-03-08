import React, { useState, useMemo } from 'react';
import { ArrowLeft, TrendingUp, Calendar, ChevronDown } from 'lucide-react';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid } from 'recharts';
import { useAppNavigation } from '../hooks/useAppNavigation';
import { useDemoData } from '../contexts/DemoDataContext';
import { TagFilterDropdown, TagFilterBadge, filterByTags } from '../components/TagFilterDropdown';

export default function CashflowChart() {
  const [viewType, setViewType] = useState<'balance' | 'netflow'>('balance');
  const [selectedAccount, setSelectedAccount] = useState('all');
  const [startDate, setStartDate] = useState('2026-02-01');
  const [endDate, setEndDate] = useState('2026-02-23');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [tagFilterMode, setTagFilterMode] = useState<'AND' | 'OR'>('OR');
  const nav = useAppNavigation();
  const { transactions, accounts, tags } = useDemoData();

  const handleBack = () => {
    nav.goBack();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN').format(amount);
  };

  // Build account filter options from real data
  const accountOptions = useMemo(() => {
    return [
      { id: 'all', name: 'Tất cả tài khoản' },
      ...accounts.map(a => ({ id: a.id, name: a.name })),
    ];
  }, [accounts]);

  // Build balance/netflow data from real transactions
  const balanceData = useMemo(() => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) return [];

    // Filter transactions in the date range and by account
    const filtered = transactions.filter(t => {
      const d = new Date(t.date);
      if (d < start || d > end) return false;
      if (selectedAccount !== 'all' && t.accountId !== selectedAccount) return false;
      if (selectedTags.length > 0 && !filterByTags(t.tags, selectedTags, tagFilterMode)) return false;
      return true;
    });

    // Group by day
    const dailyNet: Record<string, number> = {};
    filtered.forEach(t => {
      const key = t.date.substring(0, 10); // YYYY-MM-DD
      const amount = t.type === 'income' ? Math.abs(t.amount) : t.type === 'expense' ? -Math.abs(t.amount) : 0;
      dailyNet[key] = (dailyNet[key] || 0) + amount;
    });

    // Starting balance: sum of all selected account balances
    let runningBalance: number;
    if (selectedAccount === 'all') {
      runningBalance = accounts.reduce((s, a) => s + a.balance, 0);
    } else {
      const acc = accounts.find(a => a.id === selectedAccount);
      runningBalance = acc ? acc.balance : 0;
    }

    // Walk backwards from the last transaction date to approximate start balance
    // Actually, we compute the "end balance" as the current balance, and walk backwards
    // Transactions AFTER the end date affect current balance but shouldn't be in our chart
    // So we subtract all transactions after endDate to get end-of-period balance, then walk backwards
    const txnsAfterEnd = transactions.filter(t => {
      const d = new Date(t.date);
      if (d > end) {
        if (selectedAccount !== 'all' && t.accountId !== selectedAccount) return false;
        return true;
      }
      return false;
    });
    const afterEndNet = txnsAfterEnd.reduce((s, t) => {
      return s + (t.type === 'income' ? Math.abs(t.amount) : t.type === 'expense' ? -Math.abs(t.amount) : 0);
    }, 0);
    const endPeriodBalance = runningBalance - afterEndNet;

    // Build the data array
    const result: { date: string; balance: number; netFlow: number }[] = [];
    const dayCount = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const maxDays = Math.min(dayCount, 60);

    // First pass: collect all days
    const allDays: { key: string; label: string; netFlow: number }[] = [];
    for (let i = 0; i < maxDays; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      const key = d.toISOString().substring(0, 10);
      const label = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
      allDays.push({ key, label, netFlow: dailyNet[key] || 0 });
    }

    // Compute cumulative balance from the end
    let bal = endPeriodBalance;
    // Sum all net flows in our range
    const totalNet = allDays.reduce((s, d) => s + d.netFlow, 0);
    let cumulativeBal = endPeriodBalance - totalNet; // start balance

    for (const day of allDays) {
      cumulativeBal += day.netFlow;
      result.push({
        date: day.label,
        balance: Math.round(cumulativeBal),
        netFlow: Math.round(day.netFlow),
      });
    }

    return result;
  }, [transactions, accounts, selectedAccount, startDate, endDate, selectedTags, tagFilterMode]);

  const startBalance = balanceData.length > 0 ? balanceData[0].balance : 0;
  const endBalance = balanceData.length > 0 ? balanceData[balanceData.length - 1].balance : 0;
  const balanceChange = endBalance - startBalance;
  const percentageChange = startBalance !== 0 ? (balanceChange / Math.abs(startBalance)) * 100 : 0;

  const totalInflow = balanceData.reduce((sum, item) => {
    return item.netFlow > 0 ? sum + item.netFlow : sum;
  }, 0);

  const totalOutflow = balanceData.reduce((sum, item) => {
    return item.netFlow < 0 ? sum + Math.abs(item.netFlow) : sum;
  }, 0);

  const netFlow = totalInflow - totalOutflow;

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
            Biểu đồ dòng tiền
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Theo dõi số dư và dòng tiền hàng ngày
          </p>
        </div>

        {/* Filters */}
        <Card>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* View Type Toggle */}
            <div className="md:col-span-4">
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                Chế độ xem
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setViewType('balance')}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-[var(--radius-lg)] font-medium transition-all ${
                    viewType === 'balance'
                      ? 'bg-[var(--primary)] text-white shadow-[var(--shadow-sm)]'
                      : 'bg-[var(--surface)] text-[var(--text-secondary)] hover:bg-[var(--border)]'
                  }`}
                >
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-sm">Số dư</span>
                </button>
                <button
                  onClick={() => setViewType('netflow')}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-[var(--radius-lg)] font-medium transition-all ${
                    viewType === 'netflow'
                      ? 'bg-[var(--primary)] text-white shadow-[var(--shadow-sm)]'
                      : 'bg-[var(--surface)] text-[var(--text-secondary)] hover:bg-[var(--border)]'
                  }`}
                >
                  <Calendar className="w-4 h-4" />
                  <span className="text-sm">Dòng tiền ròng</span>
                </button>
              </div>
            </div>

            {/* Date Range */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                Từ ngày
              </label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                Đến ngày
              </label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>

            {/* Account Filter */}
            <div className="md:col-span-4">
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

            {/* Tag Filter */}
            {tags.length > 0 && (
              <div className="md:col-span-4">
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                  Thẻ
                </label>
                <div className="flex items-center gap-3 flex-wrap">
                  <TagFilterDropdown
                    tags={tags}
                    selectedTags={selectedTags}
                    onSelectedTagsChange={setSelectedTags}
                    tagFilterMode={tagFilterMode}
                    onTagFilterModeChange={setTagFilterMode}
                  />
                  {selectedTags.length > 0 && (
                    <TagFilterBadge
                      tags={tags}
                      selectedTags={selectedTags}
                      tagFilterMode={tagFilterMode}
                      onClear={() => setSelectedTags([])}
                    />
                  )}
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Summary Stats */}
        {viewType === 'balance' ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <p className="text-sm text-[var(--text-secondary)] mb-2">Số dư đầu kỳ</p>
              <p className="text-2xl font-bold text-[var(--text-primary)] tabular-nums">
                {formatCurrency(startBalance)}₫
              </p>
            </Card>

            <Card>
              <p className="text-sm text-[var(--text-secondary)] mb-2">Số dư cuối kỳ</p>
              <p className="text-2xl font-bold text-[var(--text-primary)] tabular-nums">
                {formatCurrency(endBalance)}₫
              </p>
            </Card>

            <Card>
              <p className="text-sm text-[var(--text-secondary)] mb-2">Thay đổi</p>
              <p
                className={`text-2xl font-bold tabular-nums ${
                  balanceChange >= 0 ? 'text-[var(--success)]' : 'text-[var(--danger)]'
                }`}
              >
                {balanceChange >= 0 ? '+' : ''}
                {formatCurrency(balanceChange)}₫
              </p>
              <p
                className={`text-xs mt-1 ${
                  balanceChange >= 0 ? 'text-[var(--success)]' : 'text-[var(--danger)]'
                }`}
              >
                {balanceChange >= 0 ? '+' : ''}
                {percentageChange.toFixed(2)}%
              </p>
            </Card>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <p className="text-sm text-[var(--text-secondary)] mb-2">Tổng tiền vào</p>
              <p className="text-2xl font-bold text-[var(--success)] tabular-nums">
                +{formatCurrency(totalInflow)}₫
              </p>
            </Card>

            <Card>
              <p className="text-sm text-[var(--text-secondary)] mb-2">Tổng tiền ra</p>
              <p className="text-2xl font-bold text-[var(--danger)] tabular-nums">
                -{formatCurrency(totalOutflow)}₫
              </p>
            </Card>

            <Card>
              <p className="text-sm text-[var(--text-secondary)] mb-2">Dòng tiền ròng</p>
              <p
                className={`text-2xl font-bold tabular-nums ${
                  netFlow >= 0 ? 'text-[var(--success)]' : 'text-[var(--danger)]'
                }`}
              >
                {netFlow >= 0 ? '+' : ''}
                {formatCurrency(netFlow)}₫
              </p>
            </Card>
          </div>
        )}

        {/* Chart */}
        <Card>
          <div className="mb-4">
            <h3 className="font-semibold text-[var(--text-primary)]">
              {viewType === 'balance' ? 'Biến động số dư' : 'Dòng tiền ròng hàng ngày'}
            </h3>
            <p className="text-sm text-[var(--text-secondary)] mt-1">
              {viewType === 'balance'
                ? 'Theo dõi số dư tài khoản theo thời gian'
                : 'Phân tích luồng tiền vào ra hàng ngày'}
            </p>
          </div>

          {balanceData.length > 0 ? (
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={balanceData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--divider)" />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: 'var(--text-tertiary)', fontSize: 12 }}
                    tickLine={false}
                    axisLine={{ stroke: 'var(--divider)' }}
                    interval={Math.max(0, Math.floor(balanceData.length / 8))}
                  />
                  <YAxis
                    tick={{ fill: 'var(--text-tertiary)', fontSize: 12 }}
                    tickLine={false}
                    axisLine={{ stroke: 'var(--divider)' }}
                    tickFormatter={(value) => {
                      if (Math.abs(value) >= 1000000) {
                        return `${(value / 1000000).toFixed(0)}M`;
                      }
                      return `${(value / 1000).toFixed(0)}k`;
                    }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--card)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-lg)',
                      fontSize: '12px',
                    }}
                    formatter={(value: number) => [
                      `${value >= 0 ? '+' : ''}${formatCurrency(value)}₫`,
                      viewType === 'balance' ? 'Số dư' : 'Dòng tiền',
                    ]}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: '12px' }}
                    formatter={() => (viewType === 'balance' ? 'Số dư' : 'Dòng tiền ròng')}
                  />
                  {viewType === 'balance' ? (
                    <Line
                      type="monotone"
                      dataKey="balance"
                      stroke="var(--primary)"
                      strokeWidth={3}
                      dot={{ fill: 'var(--primary)', r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  ) : (
                    <Line
                      type="monotone"
                      dataKey="netFlow"
                      stroke="var(--success)"
                      strokeWidth={3}
                      dot={(props: any) => {
                        const { cx, cy, payload } = props;
                        const color = payload.netFlow >= 0 ? 'var(--success)' : 'var(--danger)';
                        return <circle cx={cx} cy={cy} r={4} fill={color} />;
                      }}
                      activeDot={{ r: 6 }}
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-96 flex items-center justify-center">
              <p className="text-sm text-[var(--text-tertiary)]">Không có dữ liệu trong khoảng thời gian này</p>
            </div>
          )}
        </Card>

        {/* Insights */}
        <Card className="bg-[var(--info-light)] border-[var(--info)]">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-[var(--info)] rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white text-lg font-semibold">&#128161;</span>
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-[var(--text-primary)] mb-1">Phân tích</h4>
              {viewType === 'balance' ? (
                <div className="space-y-2 text-sm text-[var(--text-secondary)]">
                  <p>
                    Số dư của bạn đã {balanceChange >= 0 ? 'tăng' : 'giảm'}{' '}
                    <span className="font-semibold text-[var(--text-primary)]">
                      {formatCurrency(Math.abs(balanceChange))}₫
                    </span>{' '}
                    ({Math.abs(percentageChange).toFixed(2)}%) trong khoảng thời gian này.
                  </p>
                  {balanceChange < 0 && (
                    <p>
                      Hãy xem xét chi tiêu của bạn để duy trì tài chính ổn định.
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-2 text-sm text-[var(--text-secondary)]">
                  <p>
                    Dòng tiền ròng của bạn là{' '}
                    <span
                      className={`font-semibold ${
                        netFlow >= 0 ? 'text-[var(--success)]' : 'text-[var(--danger)]'
                      }`}
                    >
                      {netFlow >= 0 ? '+' : ''}
                      {formatCurrency(netFlow)}₫
                    </span>
                    .
                  </p>
                  {netFlow >= 0 ? (
                    <p>Tốt lắm! Bạn đang có dòng tiền dương trong kỳ này.</p>
                  ) : (
                    <p>Chi tiêu đang cao hơn thu nhập. Hãy xem xét điều chỉnh ngân sách.</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
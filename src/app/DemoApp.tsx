import React, { useState } from 'react';
import { ThemeProvider } from './contexts/ThemeContext';
import { 
  Plus, 
  ShoppingBag, 
  Home as HomeIcon, 
  Utensils, 
  Car,
  Briefcase,
  Gift,
  Calendar,
  Download
} from 'lucide-react';
import { Button } from './components/Button';
import { Input } from './components/Input';
import { Select } from './components/Select';
import { Card, CardHeader, CardTitle, CardContent } from './components/Card';
import { Chip } from './components/Chip';
import { ProgressBar } from './components/ProgressBar';
import { SegmentedControl } from './components/SegmentedControl';
import { Modal } from './components/Modal';
import { TransactionList } from './components/TransactionList';
import { StatCard } from './components/StatCard';
import { AmountDisplay } from './components/AmountDisplay';
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Sidebar } from './components/Sidebar';
import { Topbar } from './components/Topbar';
import { BottomNavigation } from './components/BottomNavigation';

function DesignSystemShowcase() {
  const [activePath, setActivePath] = useState('/');
  const [period, setPeriod] = useState('month');
  const [showModal, setShowModal] = useState(false);

  // Mock data
  const transactions = [
    {
      id: '1',
      description: 'Lương tháng 2',
      amount: 15000000,
      type: 'income' as const,
      category: 'Lương',
      date: '05/02/2026',
      icon: <Briefcase className="w-5 h-5 text-[var(--success)]" />,
    },
    {
      id: '2',
      description: 'Siêu thị Vinmart',
      amount: 850000,
      type: 'expense' as const,
      category: 'Mua sắm',
      date: '10/02/2026',
      icon: <ShoppingBag className="w-5 h-5 text-[var(--danger)]" />,
    },
    {
      id: '3',
      description: 'Nhà hàng Phố',
      amount: 450000,
      type: 'expense' as const,
      category: 'Ăn uống',
      date: '11/02/2026',
      icon: <Utensils className="w-5 h-5 text-[var(--danger)]" />,
    },
    {
      id: '4',
      description: 'Tiền thuê nhà',
      amount: 5000000,
      type: 'expense' as const,
      category: 'Nhà ở',
      date: '01/02/2026',
      icon: <HomeIcon className="w-5 h-5 text-[var(--danger)]" />,
    },
  ];

  const chartData = [
    { month: 'T1', income: 14000000, expense: 8500000 },
    { month: 'T2', income: 15000000, expense: 9200000 },
    { month: 'T3', income: 15500000, expense: 8800000 },
    { month: 'T4', income: 14500000, expense: 9500000 },
    { month: 'T5', income: 16000000, expense: 9000000 },
    { month: 'T6', income: 15000000, expense: 8700000 },
  ];

  const pieData = [
    { name: 'Ăn uống', value: 3500000, color: 'var(--chart-1)' },
    { name: 'Mua sắm', value: 2800000, color: 'var(--chart-2)' },
    { name: 'Nhà ở', value: 5000000, color: 'var(--chart-3)' },
    { name: 'Đi lại', value: 1200000, color: 'var(--chart-4)' },
    { name: 'Giải trí', value: 1500000, color: 'var(--chart-5)' },
  ];

  const budgets = [
    { category: 'Ăn uống', spent: 3500000, limit: 4000000, color: 'primary' as const },
    { category: 'Mua sắm', spent: 2800000, limit: 3000000, color: 'warning' as const },
    { category: 'Giải trí', spent: 1800000, limit: 1500000, color: 'danger' as const },
  ];

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Desktop Layout */}
      <div className="hidden md:flex">
        <Sidebar activePath={activePath} onNavigate={setActivePath} />
        
        <div className="flex-1 flex flex-col">
          <Topbar title="Hệ thống thiết kế - Quản lý tài chính cá nhân" />
          
          <main className="flex-1 overflow-auto p-6 space-y-8">
            {/* Stats Overview */}
            <section>
              <h2 className="text-2xl font-semibold text-[var(--text-primary)] mb-4">
                Tổng quan tài chính
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard
                  title="Tổng thu nhập"
                  amount={15000000}
                  type="income"
                  trend={{ value: 8.2, isPositive: true }}
                />
                <StatCard
                  title="Tổng chi tiêu"
                  amount={8700000}
                  type="expense"
                  trend={{ value: 3.5, isPositive: false }}
                />
                <StatCard
                  title="Số dư hiện tại"
                  amount={24500000}
                  type="neutral"
                  trend={{ value: 12.4, isPositive: true }}
                />
              </div>
            </section>

            {/* Charts Section */}
            <section>
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Biểu đồ thu chi</CardTitle>
                    <SegmentedControl
                      options={[
                        { value: 'week', label: 'Tuần' },
                        { value: 'month', label: 'Tháng' },
                        { value: 'year', label: 'Năm' },
                      ]}
                      value={period}
                      onChange={setPeriod}
                    />
                  </div>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--chart-2)" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="var(--chart-2)" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--chart-3)" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="var(--chart-3)" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid 
                        strokeDasharray="3 3" 
                        stroke="var(--divider)" 
                        vertical={false}
                      />
                      <XAxis 
                        dataKey="month" 
                        stroke="var(--text-tertiary)"
                        style={{ fontSize: '12px' }}
                      />
                      <YAxis 
                        stroke="var(--text-tertiary)"
                        style={{ fontSize: '12px' }}
                        tickFormatter={(value) => `${value / 1000000}M`}
                      />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: 'var(--surface-elevated)',
                          border: '1px solid var(--border)',
                          borderRadius: 'var(--radius-lg)',
                          color: 'var(--text-primary)',
                        }}
                        formatter={(value: number) => [`${new Intl.NumberFormat('vi-VN').format(value)}₫`, '']}
                      />
                      <Legend 
                        wrapperStyle={{ 
                          fontSize: '14px',
                          color: 'var(--text-secondary)'
                        }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="income" 
                        stroke="var(--chart-2)" 
                        fillOpacity={1}
                        fill="url(#colorIncome)"
                        name="Thu nhập"
                      />
                      <Area 
                        type="monotone" 
                        dataKey="expense" 
                        stroke="var(--chart-3)" 
                        fillOpacity={1}
                        fill="url(#colorExpense)"
                        name="Chi tiêu"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </section>

            {/* Budget & Category Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Ngân sách tháng này</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {budgets.map((budget) => {
                      const percentage = (budget.spent / budget.limit) * 100;
                      return (
                        <div key={budget.category}>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-[var(--text-primary)]">
                              {budget.category}
                            </span>
                            <span className="text-sm text-[var(--text-secondary)] tabular-nums">
                              <AmountDisplay amount={budget.spent} type="neutral" /> / <AmountDisplay amount={budget.limit} type="neutral" />
                            </span>
                          </div>
                          <ProgressBar 
                            value={budget.spent} 
                            max={budget.limit} 
                            variant={budget.color}
                          />
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Chi tiêu theo danh mục</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: 'var(--surface-elevated)',
                          border: '1px solid var(--border)',
                          borderRadius: 'var(--radius-lg)',
                          color: 'var(--text-primary)',
                        }}
                        formatter={(value: number) => `${new Intl.NumberFormat('vi-VN').format(value)}₫`}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="grid grid-cols-2 gap-2 mt-4">
                    {pieData.map((item) => (
                      <div key={item.name} className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-sm" 
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-xs text-[var(--text-secondary)]">
                          {item.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Transactions */}
            <section>
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Giao dịch gần đây</CardTitle>
                    <Button variant="ghost" size="sm">
                      Xem tất cả
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <TransactionList transactions={transactions} />
                </CardContent>
              </Card>
            </section>

            {/* Components Showcase */}
            <section>
              <h2 className="text-2xl font-semibold text-[var(--text-primary)] mb-4">
                Bộ thành phần giao diện
              </h2>

              {/* Buttons */}
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Buttons (Nút bấm)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-3">
                    <Button variant="primary">
                      <Plus className="w-4 h-4" />
                      Thêm giao dịch
                    </Button>
                    <Button variant="secondary">
                      <Download className="w-4 h-4" />
                      Xuất báo cáo
                    </Button>
                    <Button variant="ghost">
                      Hủy bỏ
                    </Button>
                    <Button variant="danger">
                      Xóa
                    </Button>
                    <Button variant="primary" disabled>
                      Đã vô hiệu
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Form Elements */}
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Form Elements (Biểu mẫu)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input 
                      label="Mô tả giao dịch" 
                      placeholder="Nhập mô tả..." 
                    />
                    <Input 
                      label="Số tiền" 
                      placeholder="0" 
                      type="number"
                    />
                    <Select
                      label="Danh mục"
                      options={[
                        { value: 'food', label: 'Ăn uống' },
                        { value: 'shopping', label: 'Mua sắm' },
                        { value: 'housing', label: 'Nhà ở' },
                        { value: 'transport', label: 'Đi lại' },
                      ]}
                    />
                    <Input 
                      label="Ngày giao dịch" 
                      type="date"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Chips & Tags */}
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Chips & Tags (Nhãn)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    <Chip label="Ăn uống" variant="default" />
                    <Chip label="Thu nhập" variant="success" />
                    <Chip label="Chi tiêu" variant="danger" />
                    <Chip label="Cảnh báo" variant="warning" />
                    <Chip label="Thông tin" variant="info" />
                    <Chip label="Có thể xóa" variant="default" onRemove={() => {}} />
                  </div>
                </CardContent>
              </Card>

              {/* Modal Demo */}
              <Card>
                <CardHeader>
                  <CardTitle>Modal (Hộp thoại)</CardTitle>
                </CardHeader>
                <CardContent>
                  <Button variant="primary" onClick={() => setShowModal(true)}>
                    Mở Modal
                  </Button>
                  
                  <Modal 
                    isOpen={showModal} 
                    onClose={() => setShowModal(false)}
                    title="Thêm giao dịch mới"
                  >
                    <div className="space-y-4">
                      <Input label="Mô tả" placeholder="Nhập mô tả..." />
                      <Input label="Số tiền" placeholder="0" type="number" />
                      <Select
                        label="Loại"
                        options={[
                          { value: 'income', label: 'Thu nhập' },
                          { value: 'expense', label: 'Chi tiêu' },
                        ]}
                      />
                      <div className="flex gap-3 pt-4">
                        <Button variant="primary" className="flex-1">
                          Lưu
                        </Button>
                        <Button 
                          variant="secondary" 
                          className="flex-1"
                          onClick={() => setShowModal(false)}
                        >
                          Hủy
                        </Button>
                      </div>
                    </div>
                  </Modal>
                </CardContent>
              </Card>
            </section>
          </main>
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="md:hidden">
        <Topbar title="Tài chính" />
        
        <main className="pb-20 px-4 pt-6 space-y-6">
          <div className="grid grid-cols-1 gap-4">
            <StatCard
              title="Tổng thu nhập"
              amount={15000000}
              type="income"
            />
            <StatCard
              title="Tổng chi tiêu"
              amount={8700000}
              type="expense"
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Giao dịch gần đây</CardTitle>
            </CardHeader>
            <CardContent>
              <TransactionList transactions={transactions.slice(0, 3)} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Ngân sách</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {budgets.slice(0, 2).map((budget) => (
                  <div key={budget.category}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-[var(--text-primary)]">
                        {budget.category}
                      </span>
                    </div>
                    <ProgressBar 
                      value={budget.spent} 
                      max={budget.limit} 
                      variant={budget.color}
                      showLabel
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </main>

        <BottomNavigation activePath={activePath} onNavigate={setActivePath} />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <DesignSystemShowcase />
    </ThemeProvider>
  );
}
// Mock data for demo purposes
export interface Transaction {
  id: string;
  type: 'income' | 'expense' | 'transfer';
  amount: number;
  category: string;
  categoryId: string;
  account: string;
  accountId: string;
  toAccount?: string;
  toAccountId?: string;
  merchant?: string;
  merchantId?: string;
  description: string;
  date: string;
  tags: string[];
  attachment?: boolean;
  recurring?: boolean;
}

export interface Account {
  id: string;
  name: string;
  type: 'bank' | 'cash' | 'credit' | 'investment' | 'savings';
  balance: number;
  currency: string;
  color: string;
  icon: string;
  lastUpdated: string;
}

export interface Category {
  id: string;
  name: string;
  type: 'income' | 'expense';
  icon: string;
  color: string;
  budget?: number;
  spent?: number;
  parentId?: string;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
  count: number;
}

export interface Merchant {
  id: string;
  name: string;
  category: string;
  totalSpent: number;
  transactionCount: number;
  lastTransaction: string;
  icon?: string;
}

export interface Budget {
  id: string;
  name: string;
  period: 'monthly' | 'weekly' | 'yearly' | 'custom';
  amount: number;
  spent: number;
  categories: string[];
  startDate: string;
  endDate: string;
  status: 'on-track' | 'warning' | 'exceeded';
}

export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
  icon: string;
  color: string;
  priority: 'high' | 'medium' | 'low';
  status: 'on-track' | 'behind' | 'achieved';
}

export interface AutoRule {
  id: string;
  name: string;
  trigger: string;
  action: string;
  enabled: boolean;
  lastRun?: string;
}

export interface RecurringRule {
  id: string;
  name: string;
  amount: number;
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  nextDate: string;
  category: string;
  account: string;
  enabled: boolean;
}

// Mock data
export const mockAccounts: Account[] = [
  {
    id: '1',
    name: 'Techcombank',
    type: 'bank',
    balance: 45230000,
    currency: 'VND',
    color: '#3B82F6',
    icon: 'building',
    lastUpdated: '2026-02-12',
  },
  {
    id: '2',
    name: 'Ví tiền mặt',
    type: 'cash',
    balance: 2500000,
    currency: 'VND',
    color: '#10B981',
    icon: 'wallet',
    lastUpdated: '2026-02-12',
  },
  {
    id: '3',
    name: 'Vietcombank',
    type: 'bank',
    balance: 23450000,
    currency: 'VND',
    color: '#8B5CF6',
    icon: 'building',
    lastUpdated: '2026-02-11',
  },
  {
    id: '4',
    name: 'Thẻ tín dụng Visa',
    type: 'credit',
    balance: -3200000,
    currency: 'VND',
    color: '#EF4444',
    icon: 'credit-card',
    lastUpdated: '2026-02-12',
  },
];

export const mockCategories: Category[] = [
  // Income
  { id: '1', name: 'Lương', type: 'income', icon: 'briefcase', color: '#10B981' },
  { id: '2', name: 'Thưởng', type: 'income', icon: 'gift', color: '#059669' },
  { id: '3', name: 'Đầu tư', type: 'income', icon: 'trending-up', color: '#0EA5E9' },
  
  // Expense
  { id: '4', name: 'Ăn uống', type: 'expense', icon: 'utensils', color: '#F59E0B' },
  { id: '5', name: 'Di chuyển', type: 'expense', icon: 'car', color: '#8B5CF6' },
  { id: '6', name: 'Mua sắm', type: 'expense', icon: 'shopping-bag', color: '#EC4899' },
  { id: '7', name: 'Nhà ở', type: 'expense', icon: 'home', color: '#3B82F6' },
  { id: '8', name: 'Y tế', type: 'expense', icon: 'heart', color: '#EF4444' },
  { id: '9', name: 'Giải trí', type: 'expense', icon: 'smile', color: '#F97316' },
  { id: '10', name: 'Giáo dục', type: 'expense', icon: 'book', color: '#6366F1' },
];

export const mockTags: Tag[] = [
  { id: '1', name: 'Cần thiết', color: '#EF4444', count: 45 },
  { id: '2', name: 'Công việc', color: '#3B82F6', count: 23 },
  { id: '3', name: 'Gia đình', color: '#10B981', count: 38 },
  { id: '4', name: 'Cá nhân', color: '#8B5CF6', count: 67 },
  { id: '5', name: 'Tiết kiệm', color: '#F59E0B', count: 12 },
];

export const mockMerchants: Merchant[] = [
  {
    id: '1',
    name: 'Grab',
    category: 'Di chuyển',
    totalSpent: 2340000,
    transactionCount: 23,
    lastTransaction: '2026-02-11',
  },
  {
    id: '2',
    name: 'Circle K',
    category: 'Mua sắm',
    totalSpent: 1250000,
    transactionCount: 15,
    lastTransaction: '2026-02-10',
  },
  {
    id: '3',
    name: 'Highlands Coffee',
    category: 'Ăn uống',
    totalSpent: 890000,
    transactionCount: 12,
    lastTransaction: '2026-02-12',
  },
  {
    id: '4',
    name: 'Shopee',
    category: 'Mua sắm',
    totalSpent: 3450000,
    transactionCount: 8,
    lastTransaction: '2026-02-09',
  },
];

export const mockTransactions: Transaction[] = [
  {
    id: '1',
    type: 'income',
    amount: 15000000,
    category: 'Lương',
    categoryId: '1',
    account: 'Techcombank',
    accountId: '1',
    description: 'Lương tháng 2',
    date: '2026-02-01',
    tags: ['Công việc'],
  },
  {
    id: '2',
    type: 'expense',
    amount: -350000,
    category: 'Ăn uống',
    categoryId: '4',
    account: 'Ví tiền mặt',
    accountId: '2',
    merchant: 'Highlands Coffee',
    merchantId: '3',
    description: 'Cà phê với đối tác',
    date: '2026-02-12',
    tags: ['Công việc'],
    attachment: true,
  },
  {
    id: '3',
    type: 'expense',
    amount: -450000,
    category: 'Di chuyển',
    categoryId: '5',
    account: 'Techcombank',
    accountId: '1',
    merchant: 'Grab',
    merchantId: '1',
    description: 'Grab đi làm',
    date: '2026-02-12',
    tags: ['Công việc'],
  },
  {
    id: '4',
    type: 'expense',
    amount: -1200000,
    category: 'Mua sắm',
    categoryId: '6',
    account: 'Thẻ tín dụng Visa',
    accountId: '4',
    merchant: 'Shopee',
    merchantId: '4',
    description: 'Mua quần áo',
    date: '2026-02-11',
    tags: ['Cá nhân'],
  },
  {
    id: '5',
    type: 'transfer',
    amount: 5000000,
    category: 'Chuyển tiền',
    categoryId: '0',
    account: 'Techcombank',
    accountId: '1',
    toAccount: 'Vietcombank',
    toAccountId: '3',
    description: 'Chuyển tiết kiệm',
    date: '2026-02-10',
    tags: ['Tiết kiệm'],
  },
  {
    id: '6',
    type: 'expense',
    amount: -2500000,
    category: 'Nhà ở',
    categoryId: '7',
    account: 'Techcombank',
    accountId: '1',
    description: 'Tiền thuê nhà tháng 2',
    date: '2026-02-05',
    tags: ['Cần thiết'],
    recurring: true,
  },
  {
    id: '7',
    type: 'expense',
    amount: -180000,
    category: 'Ăn uống',
    categoryId: '4',
    account: 'Ví tiền mặt',
    accountId: '2',
    description: 'Ăn trưa',
    date: '2026-02-12',
    tags: ['Cá nhân'],
  },
  {
    id: '8',
    type: 'income',
    amount: 2000000,
    category: 'Thưởng',
    categoryId: '2',
    account: 'Techcombank',
    accountId: '1',
    description: 'Thưởng dự án',
    date: '2026-02-08',
    tags: ['Công việc'],
  },
];

export const mockBudgets: Budget[] = [
  {
    id: '1',
    name: 'Ngân sách tháng 2',
    period: 'monthly',
    amount: 10000000,
    spent: 6780000,
    categories: ['4', '5', '6', '9'],
    startDate: '2026-02-01',
    endDate: '2026-02-29',
    status: 'on-track',
  },
  {
    id: '2',
    name: 'Chi tiêu ăn uống',
    period: 'monthly',
    amount: 3000000,
    spent: 2890000,
    categories: ['4'],
    startDate: '2026-02-01',
    endDate: '2026-02-29',
    status: 'warning',
  },
  {
    id: '3',
    name: 'Di chuyển',
    period: 'monthly',
    amount: 2000000,
    spent: 2340000,
    categories: ['5'],
    startDate: '2026-02-01',
    endDate: '2026-02-29',
    status: 'exceeded',
  },
];

export const mockGoals: Goal[] = [
  {
    id: '1',
    name: 'Mua iPhone mới',
    targetAmount: 25000000,
    currentAmount: 18500000,
    deadline: '2026-06-30',
    icon: 'smartphone',
    color: '#3B82F6',
    priority: 'high',
    status: 'on-track',
  },
  {
    id: '2',
    name: 'Du lịch Nhật Bản',
    targetAmount: 50000000,
    currentAmount: 32000000,
    deadline: '2026-12-31',
    icon: 'plane',
    color: '#EC4899',
    priority: 'medium',
    status: 'on-track',
  },
  {
    id: '3',
    name: 'Quỹ khẩn cấp',
    targetAmount: 100000000,
    currentAmount: 45000000,
    deadline: '2027-12-31',
    icon: 'shield',
    color: '#10B981',
    priority: 'high',
    status: 'behind',
  },
];

export const mockAutoRules: AutoRule[] = [
  {
    id: '1',
    name: 'Phân loại Grab tự động',
    trigger: 'Merchant = "Grab"',
    action: 'Category = "Di chuyển"',
    enabled: true,
    lastRun: '2026-02-12',
  },
  {
    id: '2',
    name: 'Tag giao dịch công việc',
    trigger: 'Description contains "công việc"',
    action: 'Add tag "Công việc"',
    enabled: true,
    lastRun: '2026-02-11',
  },
  {
    id: '3',
    name: 'Chuyển vào tiết kiệm',
    trigger: 'Income > 15,000,000',
    action: 'Transfer 20% to Savings',
    enabled: false,
  },
];

export const mockRecurringRules: RecurringRule[] = [
  {
    id: '1',
    name: 'Tiền thuê nhà',
    amount: -2500000,
    frequency: 'monthly',
    nextDate: '2026-03-05',
    category: 'Nhà ở',
    account: 'Techcombank',
    enabled: true,
  },
  {
    id: '2',
    name: 'Lương tháng',
    amount: 15000000,
    frequency: 'monthly',
    nextDate: '2026-03-01',
    category: 'Lương',
    account: 'Techcombank',
    enabled: true,
  },
  {
    id: '3',
    name: 'Netflix',
    amount: -260000,
    frequency: 'monthly',
    nextDate: '2026-02-20',
    category: 'Giải trí',
    account: 'Thẻ tín dụng Visa',
    enabled: true,
  },
];

// Helper functions
export function getTransactionById(id: string): Transaction | undefined {
  return mockTransactions.find(t => t.id === id);
}

export function getAccountById(id: string): Account | undefined {
  return mockAccounts.find(a => a.id === id);
}

export function getCategoryById(id: string): Category | undefined {
  return mockCategories.find(c => c.id === id);
}

export function getTagById(id: string): Tag | undefined {
  return mockTags.find(t => t.id === id);
}

export function getMerchantById(id: string): Merchant | undefined {
  return mockMerchants.find(m => m.id === id);
}

export function getBudgetById(id: string): Budget | undefined {
  return mockBudgets.find(b => b.id === id);
}

export function getGoalById(id: string): Goal | undefined {
  return mockGoals.find(g => g.id === id);
}

export function getAutoRuleById(id: string): AutoRule | undefined {
  return mockAutoRules.find(r => r.id === id);
}

export function getRecurringRuleById(id: string): RecurringRule | undefined {
  return mockRecurringRules.find(r => r.id === id);
}

export function getTransactionsByType(type: 'income' | 'expense' | 'transfer'): Transaction[] {
  return mockTransactions.filter(t => t.type === type);
}

export function getTransactionsByAccount(accountId: string): Transaction[] {
  return mockTransactions.filter(
    t => t.accountId === accountId || t.toAccountId === accountId
  );
}

export function getTransactionsByCategory(categoryId: string): Transaction[] {
  return mockTransactions.filter(t => t.categoryId === categoryId);
}

export function getTransactionsByMerchant(merchantId: string): Transaction[] {
  return mockTransactions.filter(t => t.merchantId === merchantId);
}

// Summary calculations
export function getTotalIncome(transactions = mockTransactions): number {
  return transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
}

export function getTotalExpense(transactions = mockTransactions): number {
  return Math.abs(
    transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0)
  );
}

export function getTotalBalance(transactions = mockTransactions): number {
  return mockAccounts.reduce((sum, a) => sum + a.balance, 0);
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('vi-VN').format(Math.abs(amount));
}

export function formatNumber(amount: number): string {
  return new Intl.NumberFormat('vi-VN').format(amount);
}
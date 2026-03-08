import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

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
  serviceFee?: number;
  linkedTransactionId?: string;
  description: string;
  date: string;
  tags: string[];
  attachment?: boolean;
  attachments?: CloudAttachment[];
  recurring?: boolean;
  notes?: string;
  isSplit?: boolean;
  splitItems?: SplitItem[];
}

export interface CloudAttachment {
  id: string;
  name: string;
  type: 'image' | 'pdf';
  size: number; // bytes
  url: string; // secure URL (Cloudinary or mock)
  publicId?: string; // Cloudinary public_id
  uploadedAt: string; // ISO date
}

export interface SplitItem {
  id: string;
  categoryId: string;
  category: string;
  amount: number;
  note?: string;
}

export interface Account {
  id: string;
  name: string;
  type: 'bank' | 'cash' | 'credit' | 'investment' | 'savings';
  balance: number;
  openingBalance: number;
  currency: string;
  color: string;
  icon: string;
  lastUpdated: string;
  accountNumber?: string;
  accountOwnerName?: string;
  archived?: boolean;
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
  hidden?: boolean;
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
  defaultCategory?: string;
  categoryName?: string;
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
  items?: BudgetItem[];
  alertsEnabled?: boolean;
  alertThresholds?: number[]; // e.g. [50, 80, 100]
}

export interface BudgetItem {
  id: string;
  budgetId: string;
  categoryId: string;
  categoryName: string;
  amount: number;
  spent: number;
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
  contributions?: GoalContribution[];
  // Auto-contribution settings
  autoContributeEnabled?: boolean;
  autoContributeAmount?: number;
  autoContributeDay?: number; // day of month (1-28)
  autoContributeAccountId?: string;
  lastAutoContributeDate?: string; // YYYY-MM to track last auto-contribution month
  // Withdrawal protection
  withdrawalLimitType?: 'none' | 'percentage' | 'amount';
  withdrawalLimitValue?: number; // max % or max VND per withdrawal
  // Lock mode — block all withdrawals until date
  withdrawalLockEnabled?: boolean;
  withdrawalLockUntil?: string; // ISO date string
  // Approval flow — require 2-step confirmation for large withdrawals
  withdrawalApprovalEnabled?: boolean;
  withdrawalApprovalThreshold?: number; // amount threshold for 2-step
}

export interface GoalContribution {
  id: string;
  goalId: string;
  amount: number;
  date: string;
  transactionId?: string;
  notes?: string;
  type?: 'deposit' | 'withdrawal'; // default 'deposit' for backwards compat
}

export interface AutoRule {
  id: string;
  name: string;
  trigger: string;
  action: string;
  enabled: boolean;
  lastRun?: string;
  conditions: {
    field: 'description' | 'amount' | 'merchant';
    operator: 'contains' | 'equals' | 'greater_than' | 'less_than';
    value: string | number;
  }[];
  actions: {
    type: 'set_category' | 'add_tag' | 'set_merchant';
    value: string;
  }[];
}

export interface RecurringRule {
  id: string;
  name: string;
  amount: number;
  type: 'income' | 'expense';
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  nextDate: string;
  categoryId: string;
  category: string;
  accountId: string;
  account: string;
  enabled: boolean;
  description: string;
  // Advanced fields
  executionMode?: 'notify' | 'auto';
  // Daily specific
  dailyInterval?: number;
  // Weekly specific
  weeklyDays?: number[]; // 0=Sun, 1=Mon, ..., 6=Sat
  // Monthly specific
  monthlyMode?: 'specific' | 'last';
  monthlyDay?: number; // 1-31
  // Yearly specific
  yearlyMonth?: number; // 0-11
  yearlyDay?: number; // 1-31
  // Timeline
  startDate?: string;
  endCondition?: 'never' | 'on-date' | 'after-n';
  endDate?: string;
  endAfterOccurrences?: number;
  completedOccurrences?: number;
  // Optional template fields
  merchantId?: string;
  merchant?: string;
  tagIds?: string[];
  notes?: string;
  // Management fields
  nextSkipped?: boolean;
  executionHistory?: RecurringExecutionLog[];
  // Per-rule notification preference (default true)
  notifyEnabled?: boolean;
}

export interface RecurringExecutionLog {
  id: string;
  date: string; // ISO date-time
  status: 'created' | 'skipped' | 'failed';
  transactionId?: string; // if status === 'created'
  note?: string;
}

// ============================================================================
// CONTEXT TYPE
// ============================================================================

interface DemoDataContextType {
  // Data
  transactions: Transaction[];
  accounts: Account[];
  categories: Category[];
  tags: Tag[];
  merchants: Merchant[];
  budgets: Budget[];
  goals: Goal[];
  autoRules: AutoRule[];
  recurringRules: RecurringRule[];
  
  // Settings
  hideAccountNumbers: boolean;
  setHideAccountNumbers: (value: boolean) => void;
  selectedCurrency: string;
  setSelectedCurrency: (value: string) => void;
  isPro: boolean;
  setIsPro: (value: boolean) => void;
  
  // Transactions
  addTransaction: (transaction: Omit<Transaction, 'id'>) => Transaction;
  updateTransaction: (id: string, transaction: Partial<Transaction>) => void;
  deleteTransaction: (id: string, deleteLinked?: boolean) => void;
  restoreTransactions: (transactions: Transaction[]) => void;
  
  // Accounts
  addAccount: (account: Omit<Account, 'id' | 'lastUpdated'>) => Account;
  updateAccount: (id: string, account: Partial<Account>) => void;
  deleteAccount: (id: string) => void;
  
  // Categories
  addCategory: (category: Omit<Category, 'id'>) => Category;
  updateCategory: (id: string, category: Partial<Category>) => void;
  deleteCategory: (id: string) => void;
  reorderCategories: (orderedIds: string[]) => void;
  
  // Tags
  addTag: (tag: Omit<Tag, 'id' | 'count'>) => Tag;
  updateTag: (id: string, tag: Partial<Tag>) => void;
  deleteTag: (id: string) => void;
  
  // Merchants
  addMerchant: (merchant: Omit<Merchant, 'id'>) => Merchant;
  updateMerchant: (id: string, merchant: Partial<Merchant>) => void;
  deleteMerchant: (id: string) => void;
  
  // Budgets
  addBudget: (budget: Omit<Budget, 'id' | 'spent' | 'status'>) => Budget;
  updateBudget: (id: string, budget: Partial<Budget>) => void;
  deleteBudget: (id: string) => void;
  
  // Goals
  addGoal: (goal: Omit<Goal, 'id' | 'currentAmount' | 'status'>) => Goal;
  updateGoal: (id: string, goal: Partial<Goal>) => void;
  deleteGoal: (id: string) => void;
  addGoalContribution: (goalId: string, contribution: Omit<GoalContribution, 'id' | 'goalId'>) => void;
  withdrawFromGoal: (goalId: string, amount: number, notes?: string) => void;
  removeGoalContribution: (goalId: string, contributionId: string) => void;
  restoreGoals: (snapshot: Goal[]) => void;
  
  // Rules
  addAutoRule: (rule: Omit<AutoRule, 'id'>) => AutoRule;
  updateAutoRule: (id: string, rule: Partial<AutoRule>) => void;
  deleteAutoRule: (id: string) => void;
  reorderAutoRules: (orderedIds: string[]) => void;
  
  addRecurringRule: (rule: Omit<RecurringRule, 'id'>) => RecurringRule;
  updateRecurringRule: (id: string, rule: Partial<RecurringRule>) => void;
  deleteRecurringRule: (id: string) => void;
  generateRecurringTransaction: (ruleId: string) => Transaction;
  skipNextOccurrence: (ruleId: string) => void;
  duplicateRecurringRule: (ruleId: string) => RecurringRule | null;
  
  // Utilities
  resetData: () => void;
  restoreFullData: (backup: {
    transactions?: Transaction[];
    accounts?: Account[];
    categories?: Category[];
    tags?: Tag[];
    merchants?: Merchant[];
    budgets?: Budget[];
    goals?: Goal[];
    autoRules?: AutoRule[];
    recurringRules?: RecurringRule[];
  }, mode: 'replace' | 'merge') => void;
  generateRandomTransactions: (count: number) => void;
}

// ============================================================================
// INITIAL DATA
// ============================================================================

const INITIAL_ACCOUNTS: Account[] = [
  {
    id: '1',
    name: 'Techcombank',
    type: 'bank',
    balance: 45230000,
    openingBalance: 35730000, // 45230000 - (15M income + 2M income - 2.5M expense - 5M transfer_out)
    currency: 'VND',
    color: '#3B82F6',
    icon: 'building',
    lastUpdated: '2026-02-12',
    accountNumber: '19036699999999',
    accountOwnerName: 'Nguyễn Văn A',
  },
  {
    id: '2',
    name: 'Ví MoMo',
    type: 'cash',
    balance: 2500000,
    openingBalance: 3300000, // 2500000 + (350k + 450k expenses)
    currency: 'VND',
    color: '#D91C5C',
    icon: 'wallet',
    lastUpdated: '2026-02-12',
  },
  {
    id: '3',
    name: 'Vietcombank',
    type: 'bank',
    balance: 23450000,
    openingBalance: 18450000, // 23450000 - 5M transfer_in
    currency: 'VND',
    color: '#0E7C3A',
    icon: 'building',
    lastUpdated: '2026-02-11',
    accountNumber: '0011004xxxxxx',
    accountOwnerName: 'Trần Thị B',
  },
  {
    id: '4',
    name: 'Thẻ tín dụng Visa',
    type: 'credit',
    balance: -3200000,
    openingBalance: -2000000, // -3200000 + 1.2M expense
    currency: 'VND',
    color: '#EF4444',
    icon: 'credit-card',
    lastUpdated: '2026-02-12',
  },
  {
    id: '5',
    name: 'Tiền mặt',
    type: 'cash',
    balance: 1500000,
    openingBalance: 1680000, // 1500000 + 180k expense
    currency: 'VND',
    color: '#10B981',
    icon: 'banknote',
    lastUpdated: '2026-02-12',
  },
];

const INITIAL_CATEGORIES: Category[] = [
  // Income
  { id: 'cat-1', name: 'Lương', type: 'income', icon: 'briefcase', color: '#10B981' },
  { id: 'cat-2', name: 'Thưởng', type: 'income', icon: 'gift', color: '#059669' },
  { id: 'cat-3', name: 'Đầu tư', type: 'income', icon: 'trending-up', color: '#0EA5E9' },
  { id: 'cat-4', name: 'Thu nhập khác', type: 'income', icon: 'plus-circle', color: '#14B8A6' },
  
  // Expense
  { id: 'cat-5', name: 'Ăn uống', type: 'expense', icon: 'utensils', color: '#F59E0B' },
  { id: 'cat-6', name: 'Di chuyển', type: 'expense', icon: 'car', color: '#8B5CF6' },
  { id: 'cat-7', name: 'Mua sắm', type: 'expense', icon: 'shopping-bag', color: '#EC4899' },
  { id: 'cat-8', name: 'Nhà ở', type: 'expense', icon: 'home', color: '#3B82F6' },
  { id: 'cat-9', name: 'Y tế', type: 'expense', icon: 'heart', color: '#EF4444' },
  { id: 'cat-10', name: 'Giải trí', type: 'expense', icon: 'smile', color: '#F97316' },
  { id: 'cat-11', name: 'Giáo dục', type: 'expense', icon: 'book', color: '#6366F1' },
  { id: 'cat-12', name: 'Thể thao', type: 'expense', icon: 'dumbbell', color: '#8B5CF6' },
  { id: 'cat-13', name: 'Phí giao dịch', type: 'expense', icon: 'landmark', color: '#64748B' },
];

const INITIAL_TAGS: Tag[] = [
  { id: 'tag-1', name: 'Cần thiết', color: '#EF4444', count: 0 },
  { id: 'tag-2', name: 'Công việc', color: '#3B82F6', count: 0 },
  { id: 'tag-3', name: 'Gia đình', color: '#10B981', count: 0 },
  { id: 'tag-4', name: 'Cá nhân', color: '#8B5CF6', count: 0 },
  { id: 'tag-5', name: 'Tiết kiệm', color: '#F59E0B', count: 0 },
  { id: 'tag-6', name: 'Ăn ngoài', color: '#F97316', count: 0 },
  { id: 'tag-7', name: 'Đi học', color: '#6366F1', count: 0 },
  { id: 'tag-8', name: 'Dating', color: '#EC4899', count: 0 },
  { id: 'tag-9', name: 'Khẩn cấp', color: '#DC2626', count: 0 },
  { id: 'tag-10', name: 'Giải trí', color: '#14B8A6', count: 0 },
];

const INITIAL_MERCHANTS: Merchant[] = [
  {
    id: 'mer-1',
    name: 'Grab',
    defaultCategory: 'cat-6',
    categoryName: 'Di chuyển',
    totalSpent: 2340000,
    transactionCount: 23,
    lastTransaction: '2026-02-11',
  },
  {
    id: 'mer-2',
    name: 'Circle K',
    defaultCategory: 'cat-7',
    categoryName: 'Mua sắm',
    totalSpent: 1250000,
    transactionCount: 15,
    lastTransaction: '2026-02-10',
  },
  {
    id: 'mer-3',
    name: 'Highlands Coffee',
    defaultCategory: 'cat-5',
    categoryName: 'Ăn uống',
    totalSpent: 890000,
    transactionCount: 12,
    lastTransaction: '2026-02-12',
  },
  {
    id: 'mer-4',
    name: 'Shopee',
    defaultCategory: 'cat-7',
    categoryName: 'Mua sắm',
    totalSpent: 3450000,
    transactionCount: 8,
    lastTransaction: '2026-02-09',
  },
];

const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: 'txn-1',
    type: 'income',
    amount: 15000000,
    category: 'Lương',
    categoryId: 'cat-1',
    account: 'Techcombank',
    accountId: '1',
    description: 'Lương tháng 3/2026',
    date: '2026-03-01',
    tags: ['tag-2'],
  },
  {
    id: 'txn-2',
    type: 'expense',
    amount: -350000,
    category: 'Ăn uống',
    categoryId: 'cat-5',
    account: 'Ví MoMo',
    accountId: '2',
    merchant: 'Highlands Coffee',
    merchantId: 'mer-3',
    description: 'Cà phê với đối tác',
    date: '2026-03-02',
    tags: ['tag-2', 'tag-6'],
    attachment: true,
    attachments: [
      {
        id: 'att-demo-1',
        name: 'receipt-cafe.jpg',
        type: 'image',
        size: 245000,
        url: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=400&q=80',
        publicId: 'demo/receipt-cafe',
        uploadedAt: '2026-03-02T10:30:00Z',
      },
      {
        id: 'att-demo-2',
        name: 'invoice.pdf',
        type: 'pdf',
        size: 1200000,
        url: '#',
        publicId: 'demo/invoice',
        uploadedAt: '2026-03-02T10:35:00Z',
      },
    ],
  },
  {
    id: 'txn-3',
    type: 'expense',
    amount: -450000,
    category: 'Di chuyển',
    categoryId: 'cat-6',
    account: 'Ví MoMo',
    accountId: '2',
    merchant: 'Grab',
    merchantId: 'mer-1',
    description: 'Grab đi làm',
    date: '2026-03-03',
    tags: ['tag-2', 'tag-1'],
  },
  {
    id: 'txn-4',
    type: 'expense',
    amount: -1200000,
    category: 'Mua sắm',
    categoryId: 'cat-7',
    account: 'Thẻ tín dụng Visa',
    accountId: '4',
    merchant: 'Shopee',
    merchantId: 'mer-4',
    description: 'Mua quần áo online',
    date: '2026-03-02',
    tags: ['tag-4', 'tag-10'],
  },
  {
    id: 'txn-5',
    type: 'transfer',
    amount: 5000000,
    category: 'Chuyển tiền',
    categoryId: '0',
    account: 'Techcombank',
    accountId: '1',
    toAccount: 'Vietcombank',
    toAccountId: '3',
    description: 'Chuyển tiết kiệm',
    date: '2026-03-01',
    tags: ['tag-5'],
  },
  {
    id: 'txn-6',
    type: 'expense',
    amount: -2500000,
    category: 'Nhà ở',
    categoryId: 'cat-8',
    account: 'Techcombank',
    accountId: '1',
    description: 'Tiền thuê nhà tháng 3',
    date: '2026-03-01',
    tags: ['tag-1', 'tag-3'],
    recurring: true,
  },
  {
    id: 'txn-7',
    type: 'expense',
    amount: -180000,
    category: 'Ăn uống',
    categoryId: 'cat-5',
    account: 'Tiền mặt',
    accountId: '5',
    description: 'Ăn trưa văn phòng',
    date: '2026-03-03',
    tags: ['tag-2', 'tag-6'],
  },
  {
    id: 'txn-8',
    type: 'income',
    amount: 2000000,
    category: 'Thưởng',
    categoryId: 'cat-2',
    account: 'Techcombank',
    accountId: '1',
    description: 'Thưởng hoàn thành dự án',
    date: '2026-03-01',
    tags: ['tag-2'],
  },
];

const INITIAL_BUDGETS: Budget[] = [
  {
    id: 'bud-1',
    name: 'Ngân sách tháng 3',
    period: 'monthly',
    amount: 10000000,
    spent: 0,
    categories: ['cat-5', 'cat-6', 'cat-7', 'cat-10'],
    startDate: '2026-03-01',
    endDate: '2026-03-31',
    status: 'on-track',
    alertsEnabled: true,
    alertThresholds: [80, 100],
  },
  {
    id: 'bud-2',
    name: 'Chi tiêu ăn uống',
    period: 'monthly',
    amount: 3000000,
    spent: 0,
    categories: ['cat-5'],
    startDate: '2026-03-01',
    endDate: '2026-03-31',
    status: 'on-track',
    alertsEnabled: true,
    alertThresholds: [50, 80, 100],
  },
];

const INITIAL_GOALS: Goal[] = [
  {
    id: 'goal-1',
    name: 'Mua iPhone mới',
    targetAmount: 25000000,
    currentAmount: 18500000,
    deadline: '2026-06-30',
    icon: 'smartphone',
    color: '#3B82F6',
    priority: 'high',
    status: 'on-track',
    contributions: [
      { id: 'contrib-1', goalId: 'goal-1', amount: 5000000, date: '2026-01-10', notes: 'Tiết kiệm tháng 1' },
      { id: 'contrib-2', goalId: 'goal-1', amount: 5000000, date: '2026-02-05', notes: 'Tiết kiệm tháng 2' },
      { id: 'contrib-3', goalId: 'goal-1', amount: 3500000, date: '2026-02-20', notes: 'Thưởng Tết' },
      { id: 'contrib-4', goalId: 'goal-1', amount: 5000000, date: '2026-03-01', notes: 'Tiết kiệm tháng 3' },
    ],
  },
  {
    id: 'goal-2',
    name: 'Du lịch Nhật Bản',
    targetAmount: 50000000,
    currentAmount: 32000000,
    deadline: '2026-12-31',
    icon: 'plane',
    color: '#EC4899',
    priority: 'medium',
    status: 'on-track',
    contributions: [
      { id: 'contrib-5', goalId: 'goal-2', amount: 10000000, date: '2025-12-01', notes: 'Khởi đầu quỹ du lịch' },
      { id: 'contrib-6', goalId: 'goal-2', amount: 7000000, date: '2026-01-15', notes: 'Tiết kiệm tháng 1' },
      { id: 'contrib-7', goalId: 'goal-2', amount: 8000000, date: '2026-02-10', notes: 'Tiết kiệm tháng 2' },
      { id: 'contrib-8', goalId: 'goal-2', amount: 7000000, date: '2026-03-02', notes: 'Tiết kiệm tháng 3' },
    ],
  },
];

const INITIAL_AUTO_RULES: AutoRule[] = [
  {
    id: 'rule-1',
    name: 'Phân loại Grab tự động',
    trigger: 'Merchant = "Grab"',
    action: 'Category = "Di chuyển"',
    enabled: true,
    lastRun: '2026-02-12',
    conditions: [
      { field: 'merchant', operator: 'equals', value: 'Grab' },
    ],
    actions: [
      { type: 'set_category', value: 'cat-6' },
    ],
  },
  {
    id: 'rule-2',
    name: 'Cà phê → Ăn uống',
    trigger: 'Description contains "cà phê"',
    action: 'Category = "Ăn uống"',
    enabled: true,
    conditions: [
      { field: 'description', operator: 'contains', value: 'cà phê' },
    ],
    actions: [
      { type: 'set_category', value: 'cat-5' },
    ],
  },
  {
    id: 'rule-3',
    name: 'Lương → Thu nhập',
    trigger: 'Description contains "lương"',
    action: 'Category = "Lương"',
    enabled: true,
    conditions: [
      { field: 'description', operator: 'contains', value: 'lương' },
    ],
    actions: [
      { type: 'set_category', value: 'cat-1' },
    ],
  },
  {
    id: 'rule-4',
    name: 'Siêu thị → Mua sắm',
    trigger: 'Description contains "siêu thị"',
    action: 'Category = "Mua sắm"',
    enabled: true,
    conditions: [
      { field: 'description', operator: 'contains', value: 'siêu thị' },
    ],
    actions: [
      { type: 'set_category', value: 'cat-7' },
    ],
  },
  {
    id: 'rule-5',
    name: 'Chi tiêu lớn gắn tag',
    trigger: 'Amount > 5000000',
    action: 'Tag = "Quan trọng"',
    enabled: true,
    conditions: [
      { field: 'amount', operator: 'greater_than', value: 5000000 },
    ],
    actions: [
      { type: 'add_tag', value: 'tag-1' },
    ],
  },
];

const INITIAL_RECURRING_RULES: RecurringRule[] = [
  {
    id: 'rec-1',
    name: 'Tiền thuê nhà',
    amount: -2500000,
    type: 'expense',
    frequency: 'monthly',
    nextDate: '2026-03-05',
    categoryId: 'cat-8',
    category: 'Nhà ở',
    accountId: '1',
    account: 'Techcombank',
    enabled: true,
    description: 'Tiền thuê nhà hàng tháng',
    executionMode: 'auto',
    monthlyMode: 'specific',
    monthlyDay: 5,
    startDate: '2026-01-05',
    endCondition: 'never',
    completedOccurrences: 2,
    executionHistory: [
      { id: 'log-1', date: '2026-01-05T08:00:00.000Z', status: 'created', transactionId: 'txn-6', note: undefined },
      { id: 'log-2', date: '2026-02-05T08:00:00.000Z', status: 'created', transactionId: 'txn-6', note: undefined },
    ],
  },
  {
    id: 'rec-2',
    name: 'Lương tháng',
    amount: 15000000,
    type: 'income',
    frequency: 'monthly',
    nextDate: '2026-03-01',
    categoryId: 'cat-1',
    category: 'Lương',
    accountId: '1',
    account: 'Techcombank',
    enabled: true,
    description: 'Lương cố định hàng tháng',
    executionMode: 'notify',
    monthlyMode: 'specific',
    monthlyDay: 1,
    startDate: '2025-06-01',
    endCondition: 'never',
    tagIds: ['tag-2'],
    completedOccurrences: 9,
    executionHistory: [
      { id: 'log-3', date: '2026-01-01T08:00:00.000Z', status: 'created', transactionId: 'txn-1', note: undefined },
      { id: 'log-4', date: '2026-02-01T08:00:00.000Z', status: 'created', transactionId: 'txn-1', note: undefined },
      { id: 'log-5', date: '2025-12-01T08:00:00.000Z', status: 'skipped', note: 'Bỏ qua lần chạy 2025-12-01' },
    ],
  },
];

// ============================================================================
// CONTEXT
// ============================================================================

const DemoDataContext = createContext<DemoDataContextType | undefined>(undefined);

const STORAGE_KEY = 'finance-manager-demo-data';

// ============================================================================
// COMPUTED BALANCE HELPER
// ============================================================================

/**
 * Compute an account's balance from its openingBalance + all transactions.
 * For accounts loaded from older localStorage without openingBalance,
 * falls back to the stored `balance` field (treated as opening).
 */
function computeAccountBalance(
  accountId: string,
  openingBalance: number,
  transactions: Transaction[],
): number {
  let balance = openingBalance;
  for (const t of transactions) {
    if (t.type === 'income' && t.accountId === accountId) {
      // Income adds to account (amount is positive)
      balance += Math.abs(t.amount);
    } else if (t.type === 'expense' && t.accountId === accountId) {
      // Expense subtracts from account (amount is negative, but we subtract abs)
      balance -= Math.abs(t.amount);
    } else if (t.type === 'transfer') {
      // Transfer out from source account
      if (t.accountId === accountId) {
        balance -= Math.abs(t.amount);
        // Legacy: if serviceFee exists but NO linked expense, deduct fee here
        // New double-entry: if linkedTransactionId exists, fee is a separate expense tx
        if ((t.serviceFee || 0) > 0 && !t.linkedTransactionId) {
          balance -= t.serviceFee!;
        }
      }
      // Transfer in to destination account (only the amount, not the fee)
      if (t.toAccountId === accountId) {
        balance += Math.abs(t.amount);
      }
    }
  }
  return balance;
}

export function DemoDataProvider({ children }: { children: ReactNode }) {
  // Load from localStorage or use initial data
  const loadData = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Migration: if accounts don't have openingBalance, compute it
        // by reverse-engineering from the stored balance and transactions
        if (parsed.accounts && parsed.accounts.length > 0 && parsed.accounts[0].openingBalance === undefined) {
          parsed.accounts = parsed.accounts.map((account: any) => {
            // Reverse-compute: openingBalance = storedBalance - transaction_effects
            let txnEffect = 0;
            for (const t of (parsed.transactions || [])) {
              if (t.type === 'income' && t.accountId === account.id) {
                txnEffect += Math.abs(t.amount);
              } else if (t.type === 'expense' && t.accountId === account.id) {
                txnEffect -= Math.abs(t.amount);
              } else if (t.type === 'transfer') {
                if (t.accountId === account.id) txnEffect -= Math.abs(t.amount) + (t.serviceFee || 0);
                if (t.toAccountId === account.id) txnEffect += Math.abs(t.amount);
              }
            }
            return {
              ...account,
              openingBalance: account.balance - txnEffect,
            };
          });
        }
        // Migration: update Feb 2026 budgets to March 2026
        if (parsed.budgets && parsed.budgets.length > 0) {
          let migrated = false;
          parsed.budgets = parsed.budgets.map((b: any) => {
            if (b.startDate === '2026-02-01' && (b.endDate === '2026-02-28' || b.endDate === '2026-02-29')) {
              migrated = true;
              return { ...b, startDate: '2026-03-01', endDate: '2026-03-31', name: b.name.replace('tháng 2', 'tháng 3') };
            }
            return b;
          });
          // Also migrate old Feb transactions to March
          if (migrated && parsed.transactions) {
            parsed.transactions = parsed.transactions.map((t: any) => {
              if (t.date && t.date.startsWith('2026-02-')) {
                const day = t.date.slice(8);
                const newDay = Math.min(parseInt(day, 10), 31);
                return { ...t, date: `2026-03-${String(newDay).padStart(2, '0')}`, description: t.description.replace('tháng 2', 'tháng 3') };
              }
              return t;
            });
          }
        }
        return parsed;
      }
    } catch (error) {
      // Silently handle load errors
    }
    return {
      transactions: INITIAL_TRANSACTIONS,
      accounts: INITIAL_ACCOUNTS,
      categories: INITIAL_CATEGORIES,
      tags: INITIAL_TAGS,
      merchants: INITIAL_MERCHANTS,
      budgets: INITIAL_BUDGETS,
      goals: INITIAL_GOALS,
      autoRules: INITIAL_AUTO_RULES,
      recurringRules: INITIAL_RECURRING_RULES,
    };
  };

  const [data, setData] = useState(loadData);

  // Save to localStorage whenever data changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save data to localStorage:', error);
    }
  }, [data]);

  // Generate ID
  const generateId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // ============================================================================
  // TRANSACTIONS
  // ============================================================================

  const addTransaction = (transaction: Omit<Transaction, 'id'>): Transaction => {
    const newTransaction: Transaction = {
      ...transaction,
      id: generateId('txn'),
    };
    
    setData(prev => ({
      ...prev,
      transactions: [...prev.transactions, newTransaction],
    }));
    
    return newTransaction;
  };

  const updateTransaction = (id: string, updates: Partial<Transaction>) => {
    setData(prev => ({
      ...prev,
      transactions: prev.transactions.map(t => 
        t.id === id ? { ...t, ...updates } : t
      ),
    }));
  };

  const deleteTransaction = (id: string, deleteLinked?: boolean) => {
    setData(prev => {
      let txnsToRemove = new Set([id]);
      
      // If deleteLinked, also remove the linked transaction
      if (deleteLinked) {
        const txn = prev.transactions.find(t => t.id === id);
        if (txn?.linkedTransactionId) {
          txnsToRemove.add(txn.linkedTransactionId);
        }
      }
      
      return {
        ...prev,
        transactions: prev.transactions.filter(t => !txnsToRemove.has(t.id)),
      };
    });
  };

  const restoreTransactions = (transactions: Transaction[]) => {
    setData(prev => ({
      ...prev,
      transactions: transactions,
    }));
  };

  // ============================================================================
  // ACCOUNTS
  // ============================================================================

  const addAccount = (account: Omit<Account, 'id' | 'lastUpdated'>): Account => {
    const newAccount: Account = {
      ...account,
      id: generateId('acc'),
      lastUpdated: new Date().toISOString().split('T')[0],
    };
    
    setData(prev => ({
      ...prev,
      accounts: [...prev.accounts, newAccount],
    }));
    
    return newAccount;
  };

  const updateAccount = (id: string, updates: Partial<Account>) => {
    setData(prev => ({
      ...prev,
      accounts: prev.accounts.map(a => 
        a.id === id ? { ...a, ...updates, lastUpdated: new Date().toISOString().split('T')[0] } : a
      ),
    }));
  };

  const deleteAccount = (id: string) => {
    setData(prev => ({
      ...prev,
      accounts: prev.accounts.filter(a => a.id !== id),
    }));
  };

  // ============================================================================
  // CATEGORIES
  // ============================================================================

  const addCategory = (category: Omit<Category, 'id'>): Category => {
    const newCategory: Category = {
      ...category,
      id: generateId('cat'),
    };
    
    setData(prev => ({
      ...prev,
      categories: [...prev.categories, newCategory],
    }));
    
    return newCategory;
  };

  const updateCategory = (id: string, updates: Partial<Category>) => {
    setData(prev => ({
      ...prev,
      categories: prev.categories.map(c => 
        c.id === id ? { ...c, ...updates } : c
      ),
    }));
  };

  const deleteCategory = (id: string) => {
    setData(prev => ({
      ...prev,
      categories: prev.categories.filter(c => c.id !== id),
    }));
  };

  const reorderCategories = (orderedIds: string[]) => {
    setData(prev => ({
      ...prev,
      categories: orderedIds
        .map(id => prev.categories.find(c => c.id === id))
        .filter((c): c is Category => c !== undefined),
    }));
  };

  // ============================================================================
  // TAGS
  // ============================================================================

  const addTag = (tag: Omit<Tag, 'id' | 'count'>): Tag => {
    const newTag: Tag = {
      ...tag,
      id: generateId('tag'),
      count: 0,
    };
    
    setData(prev => ({
      ...prev,
      tags: [...prev.tags, newTag],
    }));
    
    return newTag;
  };

  const updateTag = (id: string, updates: Partial<Tag>) => {
    setData(prev => ({
      ...prev,
      tags: prev.tags.map(t => 
        t.id === id ? { ...t, ...updates } : t
      ),
    }));
  };

  const deleteTag = (id: string) => {
    setData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t.id !== id),
      // Also remove the tag from all transactions
      transactions: prev.transactions.map(t => ({
        ...t,
        tags: t.tags.filter(tagId => tagId !== id),
      })),
    }));
  };

  // ============================================================================
  // MERCHANTS
  // ============================================================================

  const addMerchant = (merchant: Omit<Merchant, 'id'>): Merchant => {
    const newMerchant: Merchant = {
      ...merchant,
      id: generateId('mer'),
    };
    
    setData(prev => ({
      ...prev,
      merchants: [...prev.merchants, newMerchant],
    }));
    
    return newMerchant;
  };

  const updateMerchant = (id: string, updates: Partial<Merchant>) => {
    setData(prev => ({
      ...prev,
      merchants: prev.merchants.map(m => 
        m.id === id ? { ...m, ...updates } : m
      ),
    }));
  };

  const deleteMerchant = (id: string) => {
    setData(prev => ({
      ...prev,
      merchants: prev.merchants.filter(m => m.id !== id),
    }));
  };

  // ============================================================================
  // BUDGETS
  // ============================================================================

  const addBudget = (budget: Omit<Budget, 'id' | 'spent' | 'status'>): Budget => {
    const newBudget: Budget = {
      ...budget,
      id: generateId('bud'),
      spent: 0,
      status: 'on-track',
    };
    
    setData(prev => ({
      ...prev,
      budgets: [...prev.budgets, newBudget],
    }));
    
    return newBudget;
  };

  const updateBudget = (id: string, updates: Partial<Budget>) => {
    setData(prev => ({
      ...prev,
      budgets: prev.budgets.map(b => 
        b.id === id ? { ...b, ...updates } : b
      ),
    }));
  };

  const deleteBudget = (id: string) => {
    setData(prev => ({
      ...prev,
      budgets: prev.budgets.filter(b => b.id !== id),
    }));
  };

  // ============================================================================
  // GOALS
  // ============================================================================

  const addGoal = (goal: Omit<Goal, 'id' | 'currentAmount' | 'status'>): Goal => {
    const newGoal: Goal = {
      ...goal,
      id: generateId('goal'),
      currentAmount: 0,
      status: 'on-track',
      contributions: [],
    };
    
    setData(prev => ({
      ...prev,
      goals: [...prev.goals, newGoal],
    }));
    
    return newGoal;
  };

  const updateGoal = (id: string, updates: Partial<Goal>) => {
    setData(prev => ({
      ...prev,
      goals: prev.goals.map(g => 
        g.id === id ? { ...g, ...updates } : g
      ),
    }));
  };

  const deleteGoal = (id: string) => {
    setData(prev => ({
      ...prev,
      goals: prev.goals.filter(g => g.id !== id),
    }));
  };

  const addGoalContribution = (goalId: string, contribution: Omit<GoalContribution, 'id' | 'goalId'>) => {
    setData(prev => {
      const goal = prev.goals.find(g => g.id === goalId);
      if (!goal) return prev;

      const newContribution: GoalContribution = {
        ...contribution,
        id: generateId('contrib'),
        goalId,
      };

      const updatedGoal = {
        ...goal,
        contributions: [...(goal.contributions || []), newContribution],
        currentAmount: goal.currentAmount + contribution.amount,
        status: (goal.currentAmount + contribution.amount >= goal.targetAmount)
          ? 'achieved' as const
          : goal.status,
      };

      return {
        ...prev,
        goals: prev.goals.map(g => g.id === goalId ? updatedGoal : g),
      };
    });
  };

  const withdrawFromGoal = (goalId: string, amount: number, notes?: string) => {
    setData(prev => {
      const goal = prev.goals.find(g => g.id === goalId);
      if (!goal) return prev;

      const newContribution: GoalContribution = {
        id: generateId('contrib'),
        goalId,
        amount: -amount,
        date: new Date().toISOString().split('T')[0],
        notes,
        type: 'withdrawal',
      };

      const updatedGoal = {
        ...goal,
        contributions: [...(goal.contributions || []), newContribution],
        currentAmount: goal.currentAmount - amount,
        status: (goal.currentAmount - amount < 0)
          ? 'behind' as const
          : goal.status,
      };

      return {
        ...prev,
        goals: prev.goals.map(g => g.id === goalId ? updatedGoal : g),
      };
    });
  };

  const removeGoalContribution = (goalId: string, contributionId: string) => {
    setData(prev => {
      const goal = prev.goals.find(g => g.id === goalId);
      if (!goal) return prev;

      const contributions = goal.contributions || [];
      const contributionIndex = contributions.findIndex(c => c.id === contributionId);
      if (contributionIndex < 0) return prev;

      const contribution = contributions[contributionIndex];
      const newCurrentAmount = goal.currentAmount - contribution.amount;
      let newStatus = goal.status;
      if (newCurrentAmount >= goal.targetAmount) {
        newStatus = 'achieved';
      } else if (newCurrentAmount < 0) {
        newStatus = 'behind';
      } else if (goal.status === 'achieved') {
        // Was achieved, but removal brought it below target
        newStatus = 'on-track';
      }

      const updatedGoal = {
        ...goal,
        contributions: [
          ...contributions.slice(0, contributionIndex),
          ...contributions.slice(contributionIndex + 1),
        ],
        currentAmount: Math.max(0, newCurrentAmount),
        status: newStatus,
      };

      return {
        ...prev,
        goals: prev.goals.map(g => g.id === goalId ? updatedGoal : g),
      };
    });
  };

  const restoreGoals = (snapshot: Goal[]) => {
    setData(prev => ({ ...prev, goals: snapshot }));
  };

  // ============================================================================
  // RULES
  // ============================================================================

  const addAutoRule = (rule: Omit<AutoRule, 'id'>): AutoRule => {
    const newRule: AutoRule = {
      ...rule,
      id: generateId('rule'),
    };
    
    setData(prev => ({
      ...prev,
      autoRules: [...prev.autoRules, newRule],
    }));
    
    return newRule;
  };

  const updateAutoRule = (id: string, updates: Partial<AutoRule>) => {
    setData(prev => ({
      ...prev,
      autoRules: prev.autoRules.map(r => 
        r.id === id ? { ...r, ...updates } : r
      ),
    }));
  };

  const deleteAutoRule = (id: string) => {
    setData(prev => ({
      ...prev,
      autoRules: prev.autoRules.filter(r => r.id !== id),
    }));
  };

  const reorderAutoRules = (orderedIds: string[]) => {
    setData(prev => ({
      ...prev,
      autoRules: orderedIds.map(id => prev.autoRules.find(r => r.id === id) as AutoRule),
    }));
  };

  const addRecurringRule = (rule: Omit<RecurringRule, 'id'>): RecurringRule => {
    const newRule: RecurringRule = {
      ...rule,
      id: generateId('rec'),
    };
    
    setData(prev => ({
      ...prev,
      recurringRules: [...prev.recurringRules, newRule],
    }));
    
    return newRule;
  };

  const updateRecurringRule = (id: string, updates: Partial<RecurringRule>) => {
    setData(prev => ({
      ...prev,
      recurringRules: prev.recurringRules.map(r => 
        r.id === id ? { ...r, ...updates } : r
      ),
    }));
  };

  const deleteRecurringRule = (id: string) => {
    setData(prev => ({
      ...prev,
      recurringRules: prev.recurringRules.filter(r => r.id !== id),
    }));
  };

  const generateRecurringTransaction = (ruleId: string): Transaction => {
    const rule = data.recurringRules.find(r => r.id === ruleId);
    if (!rule) throw new Error('Rule not found');

    const transaction = addTransaction({
      type: rule.type,
      amount: rule.amount,
      category: rule.category,
      categoryId: rule.categoryId,
      account: rule.account,
      accountId: rule.accountId,
      description: rule.description,
      date: new Date().toISOString().split('T')[0],
      tags: rule.tagIds || [],
      recurring: true,
    });

    // Add execution log
    const logEntry: RecurringExecutionLog = {
      id: generateId('log'),
      date: new Date().toISOString(),
      status: 'created',
      transactionId: transaction.id,
    };

    // Update next date
    const nextDate = new Date(rule.nextDate);
    switch (rule.frequency) {
      case 'daily':
        nextDate.setDate(nextDate.getDate() + (rule.dailyInterval || 1));
        break;
      case 'weekly':
        nextDate.setDate(nextDate.getDate() + 7);
        break;
      case 'monthly':
        nextDate.setMonth(nextDate.getMonth() + 1);
        break;
      case 'yearly':
        nextDate.setFullYear(nextDate.getFullYear() + 1);
        break;
    }

    updateRecurringRule(ruleId, {
      nextDate: nextDate.toISOString().split('T')[0],
      nextSkipped: false,
      completedOccurrences: (rule.completedOccurrences || 0) + 1,
      executionHistory: [...(rule.executionHistory || []), logEntry],
    });

    return transaction;
  };

  const skipNextOccurrence = (ruleId: string) => {
    const rule = data.recurringRules.find(r => r.id === ruleId);
    if (!rule) throw new Error('Rule not found');

    // Add skip log
    const logEntry: RecurringExecutionLog = {
      id: generateId('log'),
      date: new Date().toISOString(),
      status: 'skipped',
      note: `Bỏ qua lần chạy ${rule.nextDate}`,
    };

    // Update next date
    const nextDate = new Date(rule.nextDate);
    switch (rule.frequency) {
      case 'daily':
        nextDate.setDate(nextDate.getDate() + (rule.dailyInterval || 1));
        break;
      case 'weekly':
        nextDate.setDate(nextDate.getDate() + 7);
        break;
      case 'monthly':
        nextDate.setMonth(nextDate.getMonth() + 1);
        break;
      case 'yearly':
        nextDate.setFullYear(nextDate.getFullYear() + 1);
        break;
    }

    updateRecurringRule(ruleId, {
      nextDate: nextDate.toISOString().split('T')[0],
      nextSkipped: false,
      executionHistory: [...(rule.executionHistory || []), logEntry],
    });
  };

  const duplicateRecurringRule = (ruleId: string): RecurringRule | null => {
    const rule = data.recurringRules.find(r => r.id === ruleId);
    if (!rule) return null;

    const newRule: RecurringRule = {
      ...rule,
      id: generateId('rec'),
      name: `${rule.name} (Copy)`,
      completedOccurrences: 0,
      executionHistory: [],
      nextSkipped: false,
    };
    
    setData(prev => ({
      ...prev,
      recurringRules: [...prev.recurringRules, newRule],
    }));
    
    return newRule;
  };

  // ============================================================================
  // COMPUTED ACCOUNTS WITH BALANCE
  // ============================================================================

  const accountsWithComputedBalance = useMemo(() => {
    return data.accounts.map((account: Account) => ({
      ...account,
      balance: computeAccountBalance(
        account.id,
        // Fallback for accounts loaded from older localStorage without openingBalance
        account.openingBalance ?? account.balance,
        data.transactions,
      ),
    }));
  }, [data.accounts, data.transactions]);

  // ============================================================================
  // SETTINGS
  // ============================================================================

  const [hideAccountNumbers, setHideAccountNumbers] = useState(() => {
    try {
      return localStorage.getItem('finance-hide-account-numbers') === 'true';
    } catch { return false; }
  });
  const [selectedCurrency, setSelectedCurrency] = useState(() => {
    try {
      return localStorage.getItem('finance-selected-currency') || 'VND';
    } catch { return 'VND'; }
  });
  const [isPro, setIsPro] = useState(() => {
    try {
      return localStorage.getItem('finance-is-pro') === 'true';
    } catch { return false; }
  });

  // Persist settings
  useEffect(() => {
    try {
      localStorage.setItem('finance-hide-account-numbers', String(hideAccountNumbers));
    } catch {}
  }, [hideAccountNumbers]);

  useEffect(() => {
    try {
      localStorage.setItem('finance-selected-currency', selectedCurrency);
    } catch {}
  }, [selectedCurrency]);

  useEffect(() => {
    try {
      localStorage.setItem('finance-is-pro', String(isPro));
    } catch {}
  }, [isPro]);

  // ============================================================================
  // UTILITIES
  // ============================================================================

  const resetData = () => {
    setData({
      transactions: INITIAL_TRANSACTIONS,
      accounts: INITIAL_ACCOUNTS,
      categories: INITIAL_CATEGORIES,
      tags: INITIAL_TAGS,
      merchants: INITIAL_MERCHANTS,
      budgets: INITIAL_BUDGETS,
      goals: INITIAL_GOALS,
      autoRules: INITIAL_AUTO_RULES,
      recurringRules: INITIAL_RECURRING_RULES,
    });
  };

  const restoreFullData = (backup: {
    transactions?: Transaction[];
    accounts?: Account[];
    categories?: Category[];
    tags?: Tag[];
    merchants?: Merchant[];
    budgets?: Budget[];
    goals?: Goal[];
    autoRules?: AutoRule[];
    recurringRules?: RecurringRule[];
  }, mode: 'replace' | 'merge') => {
    setData(prev => {
      if (mode === 'replace') {
        return {
          transactions: backup.transactions || [],
          accounts: backup.accounts || [],
          categories: backup.categories || [],
          tags: backup.tags || [],
          merchants: backup.merchants || [],
          budgets: backup.budgets || [],
          goals: backup.goals || [],
          autoRules: backup.autoRules || [],
          recurringRules: backup.recurringRules || [],
        };
      }
      // Merge: add new items, skip duplicates by id
      const existingIds = (arr: { id: string }[]) => new Set(arr.map(i => i.id));
      const mergeArr = <T extends { id: string }>(existing: T[], incoming: T[]) => {
        const ids = existingIds(existing);
        return [...existing, ...incoming.filter(i => !ids.has(i.id))];
      };
      return {
        transactions: mergeArr(prev.transactions, backup.transactions || []),
        accounts: mergeArr(prev.accounts, backup.accounts || []),
        categories: mergeArr(prev.categories, backup.categories || []),
        tags: mergeArr(prev.tags, backup.tags || []),
        merchants: mergeArr(prev.merchants, backup.merchants || []),
        budgets: mergeArr(prev.budgets, backup.budgets || []),
        goals: mergeArr(prev.goals, backup.goals || []),
        autoRules: mergeArr(prev.autoRules, backup.autoRules || []),
        recurringRules: mergeArr(prev.recurringRules, backup.recurringRules || []),
      };
    });
  };

  const generateRandomTransactions = (count: number) => {
    const randomCategory = () => {
      const expenseCategories = data.categories.filter(c => c.type === 'expense');
      return expenseCategories[Math.floor(Math.random() * expenseCategories.length)];
    };

    const randomAccount = () => {
      return data.accounts[Math.floor(Math.random() * data.accounts.length)];
    };

    const randomAmount = () => Math.floor(Math.random() * 500000) + 50000;

    for (let i = 0; i < count; i++) {
      const category = randomCategory();
      const account = randomAccount();
      const daysAgo = Math.floor(Math.random() * 30);
      const date = new Date();
      date.setDate(date.getDate() - daysAgo);

      addTransaction({
        type: 'expense',
        amount: -randomAmount(),
        category: category.name,
        categoryId: category.id,
        account: account.name,
        accountId: account.id,
        description: `Chi tiêu ngẫu nhiên ${i + 1}`,
        date: date.toISOString().split('T')[0],
        tags: [],
      });
    }
  };

  const value: DemoDataContextType = {
    // Data
    transactions: data.transactions,
    accounts: accountsWithComputedBalance,
    categories: data.categories,
    tags: data.tags,
    merchants: data.merchants,
    budgets: data.budgets,
    goals: data.goals,
    autoRules: data.autoRules,
    recurringRules: data.recurringRules,
    
    // Settings
    hideAccountNumbers,
    setHideAccountNumbers,
    selectedCurrency,
    setSelectedCurrency,
    isPro,
    setIsPro,
    
    // CRUD operations
    addTransaction,
    updateTransaction,
    deleteTransaction,
    restoreTransactions,
    addAccount,
    updateAccount,
    deleteAccount,
    addCategory,
    updateCategory,
    deleteCategory,
    reorderCategories,
    addTag,
    updateTag,
    deleteTag,
    addMerchant,
    updateMerchant,
    deleteMerchant,
    addBudget,
    updateBudget,
    deleteBudget,
    addGoal,
    updateGoal,
    deleteGoal,
    addGoalContribution,
    withdrawFromGoal,
    removeGoalContribution,
    restoreGoals,
    addAutoRule,
    updateAutoRule,
    deleteAutoRule,
    reorderAutoRules,
    addRecurringRule,
    updateRecurringRule,
    deleteRecurringRule,
    generateRecurringTransaction,
    skipNextOccurrence,
    duplicateRecurringRule,
    
    // Utilities
    resetData,
    restoreFullData,
    generateRandomTransactions,
  };

  return (
    <DemoDataContext.Provider value={value}>
      {children}
    </DemoDataContext.Provider>
  );
}

export function useDemoData() {
  const context = useContext(DemoDataContext);
  if (!context) {
    throw new Error('useDemoData must be used within DemoDataProvider');
  }
  return context;
}
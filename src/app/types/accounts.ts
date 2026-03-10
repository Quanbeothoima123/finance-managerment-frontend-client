export type AccountType =
  | "cash"
  | "bank"
  | "e_wallet"
  | "credit_card"
  | "savings"
  | "investment";

export interface AccountSummaryDto {
  id: string;
  ledgerId: string;
  name: string;
  accountType: AccountType;
  accountTypeLabel: string;
  providerName: string | null;
  accountNumber: string | null;
  maskedAccountNumber: string | null;
  accountOwnerName: string | null;
  currencyCode: string;
  openingBalanceMinor: string;
  currentBalanceMinor: string;
  iconKey: string | null;
  colorHex: string | null;
  status: "active" | "archived";
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
  transactionCount: number;
  reconciliationCount: number;
}

export interface LedgerTransactionDto {
  id: string;
  txnType: "income" | "expense" | "transfer" | "adjustment" | string;
  status: string;
  occurredAt: string;
  bookingDate: string | null;
  currencyCode: string;
  totalAmountMinor: string;
  signedAmountMinor: string;
  description: string | null;
  note: string | null;
  sourceType: string;
  merchant: { id: string; name: string } | null;
  category: {
    id: string;
    name: string;
    categoryType: "income" | "expense" | string;
  } | null;
  account: { id: string; name: string; accountType: AccountType } | null;
  toAccount: { id: string; name: string; accountType: AccountType } | null;
  tags: Array<{ id: string; name: string; colorHex: string | null }>;
}

export interface AccountsOverviewResponse {
  ledger: {
    id: string;
    name: string;
    baseCurrencyCode: string;
    timezone: string;
    weekStartsOn: number;
  };
  month: string;
  summary: {
    totalBalanceMinor: string;
    activeAccountCount: number;
    archivedAccountCount: number;
    transactionCount: number;
    incomeMinor: string;
    expenseMinor: string;
    netMinor: string;
    hasTransactions: boolean;
    isEmptyHome: boolean;
  };
  groupedBalances: Array<{
    type: AccountType;
    label: string;
    count: number;
    totalBalanceMinor: string;
  }>;
  accounts: AccountSummaryDto[];
  recentTransactions: LedgerTransactionDto[];
}

export interface AccountDetailResponse {
  account: AccountSummaryDto;
  stats: {
    transactionCount: number;
    incomeMinor: string;
    expenseMinor: string;
    netMinor: string;
    currentBalanceMinor: string;
    openingBalanceMinor: string;
  };
  balanceSeries: Array<{
    date: string | null;
    balanceMinor: string;
  }>;
  recentTransactions: LedgerTransactionDto[];
}

export interface AccountTransactionsResponse {
  account: {
    id: string;
    name: string;
  };
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  items: LedgerTransactionDto[];
}

export interface CreateAccountPayload {
  name: string;
  type: "cash" | "bank" | "ewallet" | "credit" | "savings" | "investment";
  institution?: string | null;
  accountNumber?: string | null;
  accountOwnerName?: string | null;
  currency?: string;
  openingBalance?: number | string;
  balance?: number | string;
  iconKey?: string | null;
  colorHex?: string | null;
  active?: boolean;
}

export interface UpdateAccountPayload extends Partial<CreateAccountPayload> {
  status?: "active" | "archived";
}

export interface ReconcileAccountPayload {
  actualBalanceMinor: number | string;
  reason?: string | null;
  note?: string | null;
  occurredAt?: string | null;
}

export interface ReconcileAccountResponse {
  account: AccountSummaryDto;
  reconciliation: {
    id: string;
    accountId: string;
    transactionId: string;
    expectedBalanceMinor: string;
    actualBalanceMinor: string;
    differenceMinor: string;
    note: string | null;
    createdAt: string;
  };
  transaction: LedgerTransactionDto;
}

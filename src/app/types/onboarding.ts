export type OnboardingStep =
  | "currency-date"
  | "wallet-balance"
  | "categories-setup"
  | "completed";

export interface BootstrapSummary {
  accountCount: number;
  categoryCount: number;
  transactionCount: number;
  hasTransactions: boolean;
}

export interface LedgerSummary {
  id: string;
  name: string;
  baseCurrencyCode: string;
  timezone: string;
  weekStartsOn: number;
  status?: string;
}

export interface OnboardingStateSummary {
  completed: boolean;
  currentStep: OnboardingStep;
  trackingStartDate: string | null;
  completedAt: string | null;
  counts: BootstrapSummary;
}

export interface OnboardingPreferences {
  defaultCurrencyCode: string;
  timezone: string;
  weekStartsOn: number;
  defaultAccountId?: string | null;
  defaultExpenseCategoryId?: string | null;
  defaultIncomeCategoryId?: string | null;
}

export interface AppBootstrapResponse {
  user: {
    id: string;
    publicId: string;
    displayName: string;
    email: string;
    status: string;
  };
  ledger: LedgerSummary;
  onboarding: OnboardingStateSummary;
  preferences: OnboardingPreferences;
  summary: BootstrapSummary;
  redirectTo: string;
}

export interface OnboardingStateResponse {
  ledger: LedgerSummary;
  onboarding: OnboardingStateSummary;
  preferences: OnboardingPreferences;
}

export interface SaveCurrencyDatePayload {
  baseCurrencyCode: string;
  trackingStartDate: string;
  timezone?: string;
  weekStartsOn?: number;
}

export interface SaveOnboardingAccountPayload {
  name: string;
  type: "cash" | "ewallet" | "bank";
  openingBalanceMinor: number;
  currencyCode?: string;
  providerName?: string | null;
  iconKey?: string | null;
  colorHex?: string | null;
  accountNumber?: string | null;
  accountOwnerName?: string | null;
}

export interface SaveOnboardingAccountsPayload {
  accounts: SaveOnboardingAccountPayload[];
}

export interface SaveOnboardingAccountsResponse {
  count: number;
  accounts: Array<{
    id: string;
    name: string;
    accountType: string;
    currencyCode: string;
    openingBalanceMinor: string;
    currentBalanceMinor: string | null;
  }>;
  nextStep: OnboardingStep;
}

export interface SaveOnboardingCategoriesPayload {
  preset?: "student" | "professional";
  groups?: string[];
}

export interface SaveOnboardingCategoriesResponse {
  count: number;
  categories: Array<{
    id: string;
    name: string;
    categoryType: "expense" | "income";
  }>;
  nextStep: OnboardingStep;
}

export interface CompleteOnboardingResponse {
  completed: boolean;
  redirectTo: string;
}

export function resolveOnboardingPath(step?: string | null) {
  switch (step) {
    case "currency-date":
      return "/onboarding/currency-date";
    case "wallet-balance":
      return "/onboarding/wallet-balance";
    case "categories-setup":
      return "/onboarding/categories-setup";
    default:
      return "/home";
  }
}

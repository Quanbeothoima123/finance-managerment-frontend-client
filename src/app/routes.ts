import { createBrowserRouter, RouteObject } from "react-router";
import { LucideIcon } from "lucide-react";
import {
  Home,
  Receipt,
  Wallet,
  Tag,
  Store,
  PiggyBank,
  Target,
  BarChart3,
  Zap,
  Calendar,
  Paperclip,
  Download,
  Settings,
  Info,
  Folder,
  Plus,
  Bell,
} from "lucide-react";

// Onboarding & Public Pages
import Splash from "./pages/Splash";
import Welcome from "./pages/Welcome";
import OnboardingCurrencyDate from "./pages/OnboardingCurrencyDate";
import OnboardingWalletBalance from "./pages/OnboardingWalletBalance";
import OnboardingCategoriesSetup from "./pages/OnboardingCategoriesSetup";

// Auth Pages
import AuthLogin from "./pages/AuthLogin";
import AuthRegister from "./pages/AuthRegister";
import AuthForgotPassword from "./pages/AuthForgotPassword";
import AuthVerifyOtp from "./pages/AuthVerifyOtp";

// Core Pages
import HomeWithLayout from "./pages/HomeWithLayout";

// Transactions
import TransactionsListWithLayout from "./pages/TransactionsListWithLayout";
import TransactionDetailWithLayout from "./pages/TransactionDetailWithLayout";
import AddEditTransactionWithLayout from "./pages/AddEditTransactionWithLayout";
import AddTransferWithLayout from "./pages/AddTransferWithLayout";

// Accounts
import AccountsOverviewWithLayout from "./pages/AccountsOverviewWithLayout";
import CreateAccountWithLayout from "./pages/CreateAccountWithLayout";
import AccountDetailWithLayout from "./pages/AccountDetailWithLayout";

// Categories, Tags, Merchants
import CategoriesListWithLayout from "./pages/CategoriesListWithLayout";
import CreateCategoryWithLayout from "./pages/CreateCategoryWithLayout";
import TagsListWithLayout from "./pages/TagsListWithLayout";
import CreateTagWithLayout from "./pages/CreateTagWithLayout";
import MerchantsListWithLayout from "./pages/MerchantsListWithLayout";
import MerchantDetailWithLayout from "./pages/MerchantDetailWithLayout";

// Edit pages
import EditAccountWithLayout from "./pages/EditAccountWithLayout";
import EditCategoryWithLayout from "./pages/EditCategoryWithLayout";
import EditTagWithLayout from "./pages/EditTagWithLayout";
import EditBudgetWithLayout from "./pages/EditBudgetWithLayout";
import EditGoalWithLayout from "./pages/EditGoalWithLayout";
import EditAutoRuleWithLayout from "./pages/EditAutoRuleWithLayout";
import EditRecurringRuleWithLayout from "./pages/EditRecurringRuleWithLayout";
import EditMerchantWithLayout from "./pages/EditMerchantWithLayout";
import CreateMerchantWithLayout from "./pages/CreateMerchantWithLayout";

// Budgets
import BudgetsOverviewWithLayout from "./pages/BudgetsOverviewWithLayout";
import BudgetDetailWithLayout from "./pages/BudgetDetailWithLayout";
import CreateBudgetWithLayout from "./pages/CreateBudgetWithLayout";
import AddBudgetItemWithLayout from "./pages/AddBudgetItemWithLayout";

// Goals
import GoalsOverviewWithLayout from "./pages/GoalsOverviewWithLayout";
import GoalDetailWithLayout from "./pages/GoalDetailWithLayout";
import CreateGoalWithLayout from "./pages/CreateGoalWithLayout";
import AddGoalContributionWithLayout from "./pages/AddGoalContributionWithLayout";

// Insights & Reports
import InsightsOverviewWithLayout from "./pages/InsightsOverviewWithLayout";
import CategoryBreakdownWithLayout from "./pages/CategoryBreakdownWithLayout";
import CashflowChartWithLayout from "./pages/CashflowChartWithLayout";
import AccountBreakdownWithLayout from "./pages/AccountBreakdownWithLayout";
import MonthlyRecapWithLayout from "./pages/MonthlyRecapWithLayout";
import MonthlySummaryReportWithLayout from "./pages/MonthlySummaryReportWithLayout";
import WeeklyRecapDetailWithLayout from "./pages/WeeklyRecapDetailWithLayout";

// Rules & Recurring
import AutoRulesListWithLayout from "./pages/AutoRulesListWithLayout";
import CreateAutoRuleWithLayout from "./pages/CreateAutoRuleWithLayout";
import RecurringRulesListWithLayout from "./pages/RecurringRulesListWithLayout";
import RecurringRuleDetailWithLayout from "./pages/RecurringRuleDetailWithLayout";
import CreateRecurringRuleWithLayout from "./pages/CreateRecurringRuleWithLayout";
import GeneratePreviewDemoWithLayout from "./pages/GeneratePreviewDemoWithLayout";

// Attachments & Export
import AttachmentsGalleryWithLayout from "./pages/AttachmentsGalleryWithLayout";
import AttachmentLibraryWithLayout from "./pages/AttachmentLibraryWithLayout";
import ExportCenterWithLayout from "./pages/ExportCenterWithLayout";

// Settings
import SecuritySettingsWithLayout from "./pages/SecuritySettingsWithLayout";
import GeneralSettingsWithLayout from "./pages/GeneralSettingsWithLayout";
import DataBackupSettingsWithLayout from "./pages/DataBackupSettingsWithLayout";
import RestoreDataWithLayout from "./pages/RestoreDataWithLayout";
import SettingsHomeWithLayout from "./pages/SettingsHomeWithLayout";
import NotificationSettingsWithLayout from "./pages/NotificationSettingsWithLayout";
import NotificationsInboxWithLayout from "./pages/NotificationsInboxWithLayout";
import AboutPageWithLayout from "./pages/AboutPageWithLayout";

// Showcase & Demo
import DemoApp from "./DemoApp";
import DemoHubWithLayout from "./pages/DemoHubWithLayout";
import NavigationDemo from "./pages/NavigationDemo";
import SplashShowcase from "./pages/SplashShowcase";
import HomeShowcase from "./pages/HomeShowcase";
import AccountsShowcase from "./pages/AccountsShowcase";
import CategoriesShowcase from "./pages/CategoriesShowcase";
import BudgetsShowcase from "./pages/BudgetsShowcase";
import GoalsShowcase from "./pages/GoalsShowcase";
import InsightsShowcase from "./pages/InsightsShowcase";
import RulesShowcase from "./pages/RulesShowcase";
import SettingsShowcase from "./pages/SettingsShowcase";
import StatesShowcase from "./pages/StatesShowcase";

// Empty Home Preview
import EmptyHomePreviewWithLayout from "./pages/EmptyHomePreviewWithLayout";

// Root Layout
import RootLayout from "./components/RootLayout";

// Not Found
import NotFoundPage from "./pages/NotFound";

export type RouteGroup =
  | "onboarding"
  | "core"
  | "accounts"
  | "categories"
  | "budgets"
  | "goals"
  | "insights"
  | "rules"
  | "settings"
  | "showcase";

export interface RouteConfig {
  path: string;
  Component: React.ComponentType<any>;
  label: string;
  icon?: LucideIcon;
  group: RouteGroup;
  showInSidebar: boolean;
  showInMobileNav?: boolean;
  isPublic?: boolean;
}

// Single source of truth for all routes
export const routeConfigs: RouteConfig[] = [
  // Onboarding & Public
  {
    path: "/",
    Component: Splash,
    label: "Splash",
    group: "onboarding",
    showInSidebar: false,
    isPublic: true,
  },
  {
    path: "/welcome",
    Component: Welcome,
    label: "Welcome",
    group: "onboarding",
    showInSidebar: false,
    isPublic: true,
  },
  {
    path: "/onboarding/currency-date",
    Component: OnboardingCurrencyDate,
    label: "Currency & Date",
    group: "onboarding",
    showInSidebar: false,
    isPublic: true,
  },
  {
    path: "/onboarding/wallet-balance",
    Component: OnboardingWalletBalance,
    label: "Wallet Balance",
    group: "onboarding",
    showInSidebar: false,
    isPublic: true,
  },
  {
    path: "/onboarding/categories-setup",
    Component: OnboardingCategoriesSetup,
    label: "Categories Setup",
    group: "onboarding",
    showInSidebar: false,
    isPublic: true,
  },

  // Auth
  {
    path: "/auth/login",
    Component: AuthLogin,
    label: "Login",
    group: "onboarding",
    showInSidebar: false,
    isPublic: true,
  },
  {
    path: "/auth/register",
    Component: AuthRegister,
    label: "Register",
    group: "onboarding",
    showInSidebar: false,
    isPublic: true,
  },
  {
    path: "/auth/forgot-password",
    Component: AuthForgotPassword,
    label: "Forgot Password",
    group: "onboarding",
    showInSidebar: false,
    isPublic: true,
  },
  {
    path: "/auth/verify-otp",
    Component: AuthVerifyOtp,
    label: "Verify OTP",
    group: "onboarding",
    showInSidebar: false,
    isPublic: true,
  },

  // Core
  {
    path: "/home",
    Component: HomeWithLayout,
    label: "Trang chủ",
    icon: Home,
    group: "core",
    showInSidebar: true,
    showInMobileNav: true,
  },

  // Transactions
  {
    path: "/transactions",
    Component: TransactionsListWithLayout,
    label: "Giao dịch",
    icon: Receipt,
    group: "core",
    showInSidebar: true,
    showInMobileNav: true,
  },
  {
    path: "/transactions/create",
    Component: AddEditTransactionWithLayout,
    label: "Thêm giao dịch",
    group: "core",
    showInSidebar: false,
  },
  {
    path: "/transactions/:id",
    Component: TransactionDetailWithLayout,
    label: "Chi tiết giao dịch",
    group: "core",
    showInSidebar: false,
  },
  {
    path: "/transactions/:id/edit",
    Component: AddEditTransactionWithLayout,
    label: "Chỉnh sửa giao dịch",
    group: "core",
    showInSidebar: false,
  },
  {
    path: "/transfer/create",
    Component: AddTransferWithLayout,
    label: "Chuyển tiền",
    group: "core",
    showInSidebar: false,
  },

  // Accounts
  {
    path: "/accounts",
    Component: AccountsOverviewWithLayout,
    label: "Tài khoản",
    icon: Wallet,
    group: "accounts",
    showInSidebar: true,
  },
  {
    path: "/accounts/create",
    Component: CreateAccountWithLayout,
    label: "Thêm tài khoản",
    group: "accounts",
    showInSidebar: false,
  },
  {
    path: "/accounts/:id",
    Component: AccountDetailWithLayout,
    label: "Chi tiết tài khoản",
    group: "accounts",
    showInSidebar: false,
  },
  {
    path: "/accounts/:id/edit",
    Component: EditAccountWithLayout,
    label: "Chỉnh sửa tài khoản",
    group: "accounts",
    showInSidebar: false,
  },

  // Categories
  {
    path: "/categories",
    Component: CategoriesListWithLayout,
    label: "Danh mục",
    icon: Folder,
    group: "categories",
    showInSidebar: true,
  },
  {
    path: "/categories/create",
    Component: CreateCategoryWithLayout,
    label: "Thêm danh mục",
    group: "categories",
    showInSidebar: false,
  },
  {
    path: "/categories/:id/edit",
    Component: EditCategoryWithLayout,
    label: "Chỉnh sửa danh mục",
    group: "categories",
    showInSidebar: false,
  },

  // Tags
  {
    path: "/tags",
    Component: TagsListWithLayout,
    label: "Tags",
    icon: Tag,
    group: "categories",
    showInSidebar: true,
  },
  {
    path: "/tags/create",
    Component: CreateTagWithLayout,
    label: "Thêm tag",
    group: "categories",
    showInSidebar: false,
  },
  {
    path: "/tags/:id/edit",
    Component: EditTagWithLayout,
    label: "Chỉnh sửa tag",
    group: "categories",
    showInSidebar: false,
  },

  // Merchants
  {
    path: "/merchants",
    Component: MerchantsListWithLayout,
    label: "Merchants",
    icon: Store,
    group: "categories",
    showInSidebar: true,
  },
  {
    path: "/merchants/create",
    Component: CreateMerchantWithLayout,
    label: "Thêm merchant",
    group: "categories",
    showInSidebar: false,
  },
  {
    path: "/merchants/:id",
    Component: MerchantDetailWithLayout,
    label: "Chi tiết merchant",
    group: "categories",
    showInSidebar: false,
  },
  {
    path: "/merchants/:id/edit",
    Component: EditMerchantWithLayout,
    label: "Chỉnh sửa merchant",
    group: "categories",
    showInSidebar: false,
  },

  // Budgets
  {
    path: "/budgets",
    Component: BudgetsOverviewWithLayout,
    label: "Ngân sách",
    icon: PiggyBank,
    group: "budgets",
    showInSidebar: true,
    showInMobileNav: true,
  },
  {
    path: "/budgets/create",
    Component: CreateBudgetWithLayout,
    label: "Tạo ngân sách",
    group: "budgets",
    showInSidebar: false,
  },
  {
    path: "/budgets/:id",
    Component: BudgetDetailWithLayout,
    label: "Chi tiết ngân sách",
    group: "budgets",
    showInSidebar: false,
  },
  {
    path: "/budgets/:id/add-item",
    Component: AddBudgetItemWithLayout,
    label: "Thêm hạng mục",
    group: "budgets",
    showInSidebar: false,
  },
  {
    path: "/budgets/:id/edit",
    Component: EditBudgetWithLayout,
    label: "Chỉnh sửa ngân sách",
    group: "budgets",
    showInSidebar: false,
  },

  // Goals
  {
    path: "/goals",
    Component: GoalsOverviewWithLayout,
    label: "Mục tiêu",
    icon: Target,
    group: "goals",
    showInSidebar: true,
  },
  {
    path: "/goals/create",
    Component: CreateGoalWithLayout,
    label: "Tạo mục tiêu",
    group: "goals",
    showInSidebar: false,
  },
  {
    path: "/goals/:id",
    Component: GoalDetailWithLayout,
    label: "Chi tiết mục tiêu",
    group: "goals",
    showInSidebar: false,
  },
  {
    path: "/goals/:id/add-contribution",
    Component: AddGoalContributionWithLayout,
    label: "Đóng góp",
    group: "goals",
    showInSidebar: false,
  },
  {
    path: "/goals/:id/edit",
    Component: EditGoalWithLayout,
    label: "Chỉnh sửa mục tiêu",
    group: "goals",
    showInSidebar: false,
  },

  // Insights
  {
    path: "/insights",
    Component: InsightsOverviewWithLayout,
    label: "Báo cáo",
    icon: BarChart3,
    group: "insights",
    showInSidebar: true,
  },
  {
    path: "/insights/category-breakdown",
    Component: CategoryBreakdownWithLayout,
    label: "Phân tích danh mục",
    group: "insights",
    showInSidebar: false,
  },
  {
    path: "/insights/cashflow",
    Component: CashflowChartWithLayout,
    label: "Biểu đồ dòng tiền",
    group: "insights",
    showInSidebar: false,
  },
  {
    path: "/insights/account-breakdown",
    Component: AccountBreakdownWithLayout,
    label: "Phân tích tài khoản",
    group: "insights",
    showInSidebar: false,
  },
  {
    path: "/insights/monthly-recap",
    Component: MonthlyRecapWithLayout,
    label: "Tổng kết tháng",
    group: "insights",
    showInSidebar: false,
  },
  {
    path: "/insights/weekly-recap",
    Component: WeeklyRecapDetailWithLayout,
    label: "Recap tuần",
    group: "insights",
    showInSidebar: false,
  },

  // Rules
  {
    path: "/rules/auto",
    Component: AutoRulesListWithLayout,
    label: "Quy tắc tự động",
    icon: Zap,
    group: "rules",
    showInSidebar: true,
  },
  {
    path: "/rules/auto/create",
    Component: CreateAutoRuleWithLayout,
    label: "Tạo quy tắc",
    group: "rules",
    showInSidebar: false,
  },
  {
    path: "/rules/auto/:id/edit",
    Component: EditAutoRuleWithLayout,
    label: "Chỉnh sửa quy tắc",
    group: "rules",
    showInSidebar: false,
  },
  {
    path: "/rules/recurring",
    Component: RecurringRulesListWithLayout,
    label: "Giao dịch định kỳ",
    icon: Calendar,
    group: "rules",
    showInSidebar: true,
  },
  {
    path: "/rules/recurring/create",
    Component: CreateRecurringRuleWithLayout,
    label: "Tạo giao dịch định kỳ",
    group: "rules",
    showInSidebar: false,
  },
  {
    path: "/rules/recurring/:id/edit",
    Component: EditRecurringRuleWithLayout,
    label: "Chỉnh sửa giao dịch định kỳ",
    group: "rules",
    showInSidebar: false,
  },
  {
    path: "/rules/recurring/:id",
    Component: RecurringRuleDetailWithLayout,
    label: "Chi tiết giao dịch định kỳ",
    group: "rules",
    showInSidebar: false,
  },
  {
    path: "/rules/generate-preview",
    Component: GeneratePreviewDemoWithLayout,
    label: "Tạo giao dịch preview",
    group: "rules",
    showInSidebar: false,
  },

  // Attachments & Export
  {
    path: "/attachments",
    Component: AttachmentLibraryWithLayout,
    label: "Đính kèm",
    icon: Paperclip,
    group: "settings",
    showInSidebar: true,
  },
  {
    path: "/attachments/showcase",
    Component: AttachmentsGalleryWithLayout,
    label: "Hoá đơn (Showcase)",
    icon: Paperclip,
    group: "showcase",
    showInSidebar: false,
  },
  {
    path: "/export",
    Component: ExportCenterWithLayout,
    label: "Xuất dữ liệu",
    icon: Download,
    group: "settings",
    showInSidebar: true,
  },
  {
    path: "/export/monthly-summary",
    Component: MonthlySummaryReportWithLayout,
    label: "Monthly Summary",
    group: "settings",
    showInSidebar: false,
  },

  // Settings
  {
    path: "/settings",
    Component: SettingsHomeWithLayout,
    label: "Cài đặt",
    icon: Settings,
    group: "settings",
    showInSidebar: true,
    showInMobileNav: true,
  },
  {
    path: "/settings/general",
    Component: GeneralSettingsWithLayout,
    label: "Cài đặt chung",
    group: "settings",
    showInSidebar: false,
  },
  {
    path: "/settings/security",
    Component: SecuritySettingsWithLayout,
    label: "Bảo mật",
    group: "settings",
    showInSidebar: false,
  },
  {
    path: "/settings/backup",
    Component: DataBackupSettingsWithLayout,
    label: "Sao lưu",
    group: "settings",
    showInSidebar: false,
  },
  {
    path: "/settings/restore",
    Component: RestoreDataWithLayout,
    label: "Khôi phục",
    group: "settings",
    showInSidebar: false,
  },
  {
    path: "/about",
    Component: AboutPageWithLayout,
    label: "Về ứng dụng",
    icon: Info,
    group: "settings",
    showInSidebar: true,
  },
  {
    path: "/settings/notifications",
    Component: NotificationSettingsWithLayout,
    label: "Thông báo",
    group: "settings",
    showInSidebar: false,
  },
  {
    path: "/notifications",
    Component: NotificationsInboxWithLayout,
    label: "Hộp thư thông báo",
    group: "settings",
    showInSidebar: false,
  },

  // Demo & Showcase
  {
    path: "/demo",
    Component: DemoApp,
    label: "Demo App",
    group: "showcase",
    showInSidebar: false,
  },
  {
    path: "/demo/navigation",
    Component: NavigationDemo,
    label: "Navigation Demo",
    group: "showcase",
    showInSidebar: false,
  },
  {
    path: "/demo/hub",
    Component: DemoHubWithLayout,
    label: "Demo Hub",
    group: "showcase",
    showInSidebar: false,
  },
  {
    path: "/showcase",
    Component: SplashShowcase,
    label: "Splash Showcase",
    group: "showcase",
    showInSidebar: false,
  },
  {
    path: "/showcase-home",
    Component: HomeShowcase,
    label: "Home Showcase",
    group: "showcase",
    showInSidebar: false,
  },
  {
    path: "/showcase-accounts",
    Component: AccountsShowcase,
    label: "Accounts Showcase",
    group: "showcase",
    showInSidebar: false,
  },
  {
    path: "/showcase-categories",
    Component: CategoriesShowcase,
    label: "Categories Showcase",
    group: "showcase",
    showInSidebar: false,
  },
  {
    path: "/showcase-budgets",
    Component: BudgetsShowcase,
    label: "Budgets Showcase",
    group: "showcase",
    showInSidebar: false,
  },
  {
    path: "/showcase-goals",
    Component: GoalsShowcase,
    label: "Goals Showcase",
    group: "showcase",
    showInSidebar: false,
  },
  {
    path: "/showcase-insights",
    Component: InsightsShowcase,
    label: "Insights Showcase",
    group: "showcase",
    showInSidebar: false,
  },
  {
    path: "/showcase-rules",
    Component: RulesShowcase,
    label: "Rules Showcase",
    group: "showcase",
    showInSidebar: false,
  },
  {
    path: "/showcase-settings",
    Component: SettingsShowcase,
    label: "Settings Showcase",
    group: "showcase",
    showInSidebar: false,
  },
  {
    path: "/showcase-states",
    Component: StatesShowcase,
    label: "States Showcase",
    group: "showcase",
    showInSidebar: false,
  },
  {
    path: "/demo/empty-home",
    Component: EmptyHomePreviewWithLayout,
    label: "Preview Empty Home",
    group: "showcase",
    showInSidebar: false,
  },
];

// Helper functions
export function getRoutesByGroup(group: RouteGroup): RouteConfig[] {
  return routeConfigs.filter((route) => route.group === group);
}

export function getSidebarRoutes(): RouteConfig[] {
  return routeConfigs.filter((route) => route.showInSidebar);
}

export function getMobileNavRoutes(): RouteConfig[] {
  return routeConfigs.filter((route) => route.showInMobileNav);
}

export function getRouteByPath(path: string): RouteConfig | undefined {
  return routeConfigs.find((route) => route.path === path);
}

// Convert route configs to React Router routes
const routes: RouteObject[] = [
  {
    path: "/",
    Component: RootLayout,
    children: [
      ...routeConfigs.map((config) => ({
        path: config.path === "/" ? undefined : config.path,
        index: config.path === "/" ? true : undefined,
        Component: config.Component,
      })),
      {
        path: "*",
        Component: NotFoundPage,
      },
    ],
  },
];

export const router = createBrowserRouter(routes);
import React from "react";
import { useNavigate } from "react-router";
import { Home, ArrowRight } from "lucide-react";
import { Button } from "../components/Button";
import { useAppNavigation } from "../hooks";

export default function NavigationDemo() {
  const navigate = useNavigate();
  const nav = useAppNavigation();

  return (
    <div className="min-h-screen bg-[var(--background)] p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">
            Navigation Demo
          </h1>
          <p className="text-[var(--text-secondary)]">
            Test navigation between all screens. Click sidebar items or bottom
            navigation to navigate.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Core */}
          <div className="bg-[var(--card)] p-6 rounded-[var(--radius-lg)] border border-[var(--border)]">
            <h3 className="font-semibold text-[var(--text-primary)] mb-4">
              Core
            </h3>
            <div className="space-y-2">
              <Button
                onClick={nav.goHome}
                variant="secondary"
                className="w-full justify-between"
              >
                Trang chủ
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Accounts */}
          <div className="bg-[var(--card)] p-6 rounded-[var(--radius-lg)] border border-[var(--border)]">
            <h3 className="font-semibold text-[var(--text-primary)] mb-4">
              Accounts
            </h3>
            <div className="space-y-2">
              <Button
                onClick={nav.goAccounts}
                variant="secondary"
                className="w-full justify-between"
              >
                Tài khoản
                <ArrowRight className="w-4 h-4" />
              </Button>
              <Button
                onClick={nav.goCreateAccount}
                variant="secondary"
                className="w-full justify-between"
              >
                Thêm tài khoản
                <ArrowRight className="w-4 h-4" />
              </Button>
              <Button
                onClick={() => nav.goAccountDetail("1")}
                variant="secondary"
                className="w-full justify-between"
              >
                Chi tiết tài khoản
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Categories */}
          <div className="bg-[var(--card)] p-6 rounded-[var(--radius-lg)] border border-[var(--border)]">
            <h3 className="font-semibold text-[var(--text-primary)] mb-4">
              Categories & Tags
            </h3>
            <div className="space-y-2">
              <Button
                onClick={nav.goCategories}
                variant="secondary"
                className="w-full justify-between"
              >
                Danh mục
                <ArrowRight className="w-4 h-4" />
              </Button>
              <Button
                onClick={nav.goTags}
                variant="secondary"
                className="w-full justify-between"
              >
                Tags
                <ArrowRight className="w-4 h-4" />
              </Button>
              <Button
                onClick={nav.goMerchants}
                variant="secondary"
                className="w-full justify-between"
              >
                Merchants
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Budgets */}
          <div className="bg-[var(--card)] p-6 rounded-[var(--radius-lg)] border border-[var(--border)]">
            <h3 className="font-semibold text-[var(--text-primary)] mb-4">
              Budgets
            </h3>
            <div className="space-y-2">
              <Button
                onClick={nav.goBudgets}
                variant="secondary"
                className="w-full justify-between"
              >
                Ngân sách
                <ArrowRight className="w-4 h-4" />
              </Button>
              <Button
                onClick={nav.goCreateBudget}
                variant="secondary"
                className="w-full justify-between"
              >
                Tạo ngân sách
                <ArrowRight className="w-4 h-4" />
              </Button>
              <Button
                onClick={() => nav.goBudgetDetail("1")}
                variant="secondary"
                className="w-full justify-between"
              >
                Chi tiết ngân sách
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Goals */}
          <div className="bg-[var(--card)] p-6 rounded-[var(--radius-lg)] border border-[var(--border)]">
            <h3 className="font-semibold text-[var(--text-primary)] mb-4">
              Goals
            </h3>
            <div className="space-y-2">
              <Button
                onClick={nav.goGoals}
                variant="secondary"
                className="w-full justify-between"
              >
                Mục tiêu
                <ArrowRight className="w-4 h-4" />
              </Button>
              <Button
                onClick={nav.goCreateGoal}
                variant="secondary"
                className="w-full justify-between"
              >
                Tạo mục tiêu
                <ArrowRight className="w-4 h-4" />
              </Button>
              <Button
                onClick={() => nav.goGoalDetail("goal-1")}
                variant="secondary"
                className="w-full justify-between"
              >
                Chi tiết mục tiêu
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Insights */}
          <div className="bg-[var(--card)] p-6 rounded-[var(--radius-lg)] border border-[var(--border)]">
            <h3 className="font-semibold text-[var(--text-primary)] mb-4">
              Insights
            </h3>
            <div className="space-y-2">
              <Button
                onClick={nav.goInsights}
                variant="secondary"
                className="w-full justify-between"
              >
                Báo cáo
                <ArrowRight className="w-4 h-4" />
              </Button>
              <Button
                onClick={nav.goCategoryBreakdown}
                variant="secondary"
                className="w-full justify-between"
              >
                Phân tích danh mục
                <ArrowRight className="w-4 h-4" />
              </Button>
              <Button
                onClick={nav.goCashflow}
                variant="secondary"
                className="w-full justify-between"
              >
                Dòng tiền
                <ArrowRight className="w-4 h-4" />
              </Button>
              <Button
                onClick={nav.goMonthlyRecap}
                variant="secondary"
                className="w-full justify-between"
              >
                Tổng kết tháng
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Rules */}
          <div className="bg-[var(--card)] p-6 rounded-[var(--radius-lg)] border border-[var(--border)]">
            <h3 className="font-semibold text-[var(--text-primary)] mb-4">
              Rules
            </h3>
            <div className="space-y-2">
              <Button
                onClick={nav.goAutoRules}
                variant="secondary"
                className="w-full justify-between"
              >
                Quy tắc tự động
                <ArrowRight className="w-4 h-4" />
              </Button>
              <Button
                onClick={nav.goRecurringRules}
                variant="secondary"
                className="w-full justify-between"
              >
                Giao dịch định kỳ
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Settings */}
          <div className="bg-[var(--card)] p-6 rounded-[var(--radius-lg)] border border-[var(--border)]">
            <h3 className="font-semibold text-[var(--text-primary)] mb-4">
              Settings
            </h3>
            <div className="space-y-2">
              <Button
                onClick={nav.goSettings}
                variant="secondary"
                className="w-full justify-between"
              >
                Cài đặt
                <ArrowRight className="w-4 h-4" />
              </Button>
              <Button
                onClick={nav.goAttachments}
                variant="secondary"
                className="w-full justify-between"
              >
                Hoá đơn
                <ArrowRight className="w-4 h-4" />
              </Button>
              <Button
                onClick={nav.goExport}
                variant="secondary"
                className="w-full justify-between"
              >
                Xuất dữ liệu
                <ArrowRight className="w-4 h-4" />
              </Button>
              <Button
                onClick={nav.goAbout}
                variant="secondary"
                className="w-full justify-between"
              >
                Về ứng dụng
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="mt-8 p-6 bg-[var(--info-light)] border border-[var(--info)] rounded-[var(--radius-lg)]">
          <h3 className="font-semibold text-[var(--text-primary)] mb-2">
            Navigation Tips
          </h3>
          <ul className="text-sm text-[var(--text-secondary)] space-y-1">
            <li>• Desktop: Use the left sidebar to navigate</li>
            <li>• Mobile: Use the bottom navigation (5 tabs)</li>
            <li>
              • Mobile: Tap "Thêm" (More) in bottom nav to see all options
            </li>
            <li>• All routes are now fully wired with React Router</li>
            <li>• Active states work automatically</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

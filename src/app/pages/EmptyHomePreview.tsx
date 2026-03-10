import React from "react";
import {
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpRight,
  Building2,
  CreditCard,
  Plus,
  Wallet,
} from "lucide-react";
import { useNavigate } from "react-router";
import { Card } from "../components/Card";
import { Button } from "../components/Button";
import { useAccountsOverview } from "../hooks/useAccountsOverview";
import {
  getAccountSubtitle,
  normalizeFrontendAccountType,
} from "../utils/accountHelpers";

function formatMoney(value?: string | number | null) {
  const amount = Number(value || 0);
  return new Intl.NumberFormat("vi-VN").format(amount);
}

function formatMonthLabel(value: string) {
  const [year, month] = value.split("-").map(Number);
  return new Intl.DateTimeFormat("vi-VN", {
    month: "long",
    year: "numeric",
  }).format(new Date(year, month - 1, 1));
}

function getAccountIcon(type: string) {
  const normalized = normalizeFrontendAccountType(type);
  switch (normalized) {
    case "bank":
      return Building2;
    case "credit":
      return CreditCard;
    case "ewallet":
      return Wallet;
    default:
      return Wallet;
  }
}

export default function EmptyHomePreview() {
  const navigate = useNavigate();
  const { data, loading, error, month } = useAccountsOverview();

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--background)] p-4 md:p-6">
        <Card>
          <p className="text-sm text-[var(--text-secondary)]">
            Đang tải dữ liệu trang chủ...
          </p>
        </Card>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[var(--background)] p-4 md:p-6">
        <Card>
          <p className="text-sm text-[var(--danger)]">
            {error || "Không thể tải dữ liệu trang chủ"}
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-6 pb-20 md:pb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
              Home (Empty State)
            </h1>
            <p className="text-sm text-[var(--text-secondary)] mt-1 capitalize">
              {formatMonthLabel(month)}
            </p>
          </div>
          <Button onClick={() => navigate("/transactions/create")}>
            <Plus className="w-4 h-4" />
            Thêm giao dịch đầu tiên
          </Button>
        </div>

        <Card>
          <div className="text-center py-2">
            <p className="text-sm text-[var(--text-secondary)] mb-2">
              Tổng số dư
            </p>
            <p className="text-4xl font-bold text-[var(--text-primary)] tabular-nums">
              {formatMoney(data.summary.totalBalanceMinor)} ₫
            </p>
            <p className="text-sm text-[var(--text-tertiary)] mt-2">
              {data.summary.activeAccountCount} tài khoản đang hoạt động
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-6">
            <div className="rounded-[var(--radius-lg)] bg-[var(--success-light)] p-4">
              <p className="text-sm text-[var(--text-secondary)] mb-1 flex items-center justify-center gap-2">
                <ArrowDownLeft className="w-4 h-4 text-[var(--success)]" />
                Thu
              </p>
              <p className="text-lg font-semibold text-[var(--success)] text-center">
                {formatMoney(data.summary.incomeMinor)} ₫
              </p>
            </div>

            <div className="rounded-[var(--radius-lg)] bg-[var(--danger-light)] p-4">
              <p className="text-sm text-[var(--text-secondary)] mb-1 flex items-center justify-center gap-2">
                <ArrowUpRight className="w-4 h-4 text-[var(--danger)]" />
                Chi
              </p>
              <p className="text-lg font-semibold text-[var(--danger)] text-center">
                {formatMoney(data.summary.expenseMinor)} ₫
              </p>
            </div>

            <div className="rounded-[var(--radius-lg)] bg-[var(--surface)] p-4 border border-[var(--border)]">
              <p className="text-sm text-[var(--text-secondary)] mb-1 flex items-center justify-center gap-2">
                <ArrowLeftRight className="w-4 h-4 text-[var(--primary)]" />
                Chênh lệch
              </p>
              <p className="text-lg font-semibold text-[var(--text-primary)] text-center">
                {formatMoney(data.summary.netMinor)} ₫
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <h2 className="font-semibold text-[var(--text-primary)] mb-4">
            Nhập nhanh
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Button
              variant="danger"
              onClick={() => navigate("/transactions/create?type=expense")}
            >
              <ArrowUpRight className="w-4 h-4" />
              Chi tiêu
            </Button>

            <Button
              onClick={() => navigate("/transactions/create?type=income")}
              className="bg-[var(--success)] hover:bg-[var(--success)]/90"
            >
              <ArrowDownLeft className="w-4 h-4" />
              Thu nhập
            </Button>

            <Button
              variant="secondary"
              onClick={() => navigate("/transfer/create")}
            >
              <ArrowLeftRight className="w-4 h-4" />
              Chuyển
            </Button>
          </div>

          <p className="text-xs text-[var(--text-tertiary)] mt-3">
            Ở bước này bạn đã có tài khoản nhưng chưa có giao dịch. Hãy thêm
            giao dịch đầu tiên để bắt đầu thống kê.
          </p>
        </Card>

        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-[var(--text-primary)]">
              Tài khoản
            </h2>
            <button
              onClick={() => navigate("/accounts")}
              className="text-sm font-medium text-[var(--primary)] hover:underline"
            >
              Xem tất cả
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {data.accounts
              .filter((item) => item.status === "active")
              .slice(0, 6)
              .map((account) => {
                const Icon = getAccountIcon(account.accountType);
                return (
                  <Card
                    key={account.id}
                    className="cursor-pointer hover:shadow-[var(--shadow-lg)] transition-shadow"
                    onClick={() => navigate(`/accounts/${account.id}`)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-[var(--primary-light)] flex items-center justify-center text-[var(--primary)]">
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-[var(--text-primary)] truncate">
                          {account.name}
                        </p>
                        <p className="text-xs text-[var(--text-tertiary)] mt-1 truncate">
                          {getAccountSubtitle({
                            providerName: account.providerName,
                            accountNumber: account.accountNumber,
                            accountType: account.accountType,
                          }) || account.accountTypeLabel}
                        </p>
                        <p className="text-base font-semibold text-[var(--success)] mt-2 tabular-nums">
                          {formatMoney(account.currentBalanceMinor)} ₫
                        </p>
                      </div>
                    </div>
                  </Card>
                );
              })}
          </div>
        </div>

        <Card>
          <div className="text-center py-10">
            <div className="w-14 h-14 rounded-full bg-[var(--surface)] border border-[var(--border)] mx-auto flex items-center justify-center mb-4">
              <Plus className="w-6 h-6 text-[var(--text-tertiary)]" />
            </div>
            <h3 className="text-lg font-semibold text-[var(--text-primary)]">
              Chưa có giao dịch nào
            </h3>
            <p className="text-sm text-[var(--text-secondary)] mt-2 mb-5">
              Thêm giao dịch đầu tiên để app bắt đầu thống kê và đưa bạn sang
              màn hình Home đầy đủ.
            </p>
            <Button onClick={() => navigate("/transactions/create")}>
              <Plus className="w-4 h-4" />
              Thêm giao dịch đầu tiên
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}

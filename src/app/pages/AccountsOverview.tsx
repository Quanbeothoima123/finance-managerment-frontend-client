import React, { useMemo, useState } from "react";
import {
  Building2,
  ChevronRight,
  MoreHorizontal,
  Plus,
  Search,
  Wallet,
} from "lucide-react";
import { useNavigate } from "react-router";
import { Card } from "../components/Card";
import { Button } from "../components/Button";
import { ConfirmationModal } from "../components/ConfirmationModals";
import { useToast } from "../contexts/ToastContext";
import { useAccountsOverview } from "../hooks/useAccountsOverview";
import { accountsService } from "../services/accountsService";
import { ApiError } from "../services/apiClient";
import type { AccountSummaryDto } from "../types/accounts";
import {
  getAccountSubtitle,
  normalizeFrontendAccountType,
} from "../utils/accountHelpers";

function formatMoney(value?: string | number | null) {
  return new Intl.NumberFormat("vi-VN").format(Number(value || 0));
}

function getAccountIcon(type: string) {
  switch (normalizeFrontendAccountType(type)) {
    case "bank":
      return Building2;
    default:
      return Wallet;
  }
}

function ActionMenu({
  account,
  onView,
  onEdit,
  onReconcile,
  onArchiveToggle,
  onDelete,
}: {
  account: AccountSummaryDto;
  onView: () => void;
  onEdit: () => void;
  onReconcile: () => void;
  onArchiveToggle: () => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative" onClick={(event) => event.stopPropagation()}>
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="p-2 rounded-[var(--radius-md)] hover:bg-[var(--surface)] transition-colors"
      >
        <MoreHorizontal className="w-4 h-4 text-[var(--text-secondary)]" />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-52 bg-[var(--surface-elevated)] border border-[var(--border)] rounded-[var(--radius-lg)] shadow-[var(--shadow-lg)] overflow-hidden z-20">
          <button
            onClick={() => {
              setOpen(false);
              onView();
            }}
            className="w-full px-4 py-3 text-left text-sm text-[var(--text-primary)] hover:bg-[var(--surface)] transition-colors"
          >
            Xem chi tiết
          </button>

          <button
            onClick={() => {
              setOpen(false);
              onEdit();
            }}
            className="w-full px-4 py-3 text-left text-sm text-[var(--text-primary)] hover:bg-[var(--surface)] transition-colors"
          >
            Chỉnh sửa
          </button>

          {account.status === "active" && (
            <button
              onClick={() => {
                setOpen(false);
                onReconcile();
              }}
              className="w-full px-4 py-3 text-left text-sm text-[var(--text-primary)] hover:bg-[var(--surface)] transition-colors"
            >
              Điều chỉnh số dư
            </button>
          )}

          <button
            onClick={() => {
              setOpen(false);
              onArchiveToggle();
            }}
            className="w-full px-4 py-3 text-left text-sm text-[var(--text-primary)] hover:bg-[var(--surface)] transition-colors"
          >
            {account.status === "active" ? "Lưu trữ" : "Khôi phục"}
          </button>

          <button
            onClick={() => {
              setOpen(false);
              onDelete();
            }}
            className="w-full px-4 py-3 text-left text-sm text-[var(--danger)] hover:bg-[var(--danger-light)] transition-colors"
          >
            Xoá tài khoản
          </button>
        </div>
      )}
    </div>
  );
}

function ReconcileModal({
  account,
  onClose,
  onSubmit,
  pending,
}: {
  account: AccountSummaryDto;
  onClose: () => void;
  onSubmit: (payload: {
    actualBalanceMinor: number;
    reason?: string;
    note?: string;
  }) => Promise<void>;
  pending: boolean;
}) {
  const [actualBalance, setActualBalance] = useState("");
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");

  const currentBalance = Number(account.currentBalanceMinor || 0);
  const actualValue = Number(actualBalance || 0);
  const difference = actualValue - currentBalance;
  const isDisabled = !actualBalance || difference === 0 || pending;

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-[var(--card)] rounded-[var(--radius-xl)] p-6"
        onClick={(event) => event.stopPropagation()}
      >
        <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
          Điều chỉnh số dư
        </h3>

        <div className="space-y-4">
          <div className="rounded-[var(--radius-lg)] bg-[var(--surface)] p-4 border border-[var(--border)]">
            <p className="text-xs text-[var(--text-tertiary)]">
              {account.name}
            </p>
            <p className="text-sm font-semibold text-[var(--text-primary)] mt-1">
              Số dư hiện tại: {formatMoney(account.currentBalanceMinor)} ₫
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
              Số dư thực tế
            </label>
            <input
              type="number"
              value={actualBalance}
              onChange={(event) => setActualBalance(event.target.value)}
              className="w-full px-4 py-3 bg-[var(--input-background)] border border-[var(--border)] rounded-[var(--radius-lg)]"
              placeholder="Nhập số dư thực tế"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
              Lý do
            </label>
            <select
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              className="w-full px-4 py-3 bg-[var(--input-background)] border border-[var(--border)] rounded-[var(--radius-lg)]"
            >
              <option value="">Chọn lý do (tuỳ chọn)</option>
              <option value="data-entry">Nhập liệu sai</option>
              <option value="forgot-txn">Quên ghi giao dịch</option>
              <option value="bank-fees">Phí ngân hàng</option>
              <option value="other">Khác</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
              Ghi chú
            </label>
            <input
              type="text"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              className="w-full px-4 py-3 bg-[var(--input-background)] border border-[var(--border)] rounded-[var(--radius-lg)]"
              placeholder="Ví dụ: đối chiếu sao kê ngân hàng"
            />
          </div>
        </div>

        {actualBalance && (
          <div
            className={`mt-4 p-3 rounded-[var(--radius-lg)] ${
              difference > 0
                ? "bg-[var(--success-light)]"
                : difference < 0
                  ? "bg-[var(--danger-light)]"
                  : "bg-[var(--surface)]"
            }`}
          >
            <p className="text-sm text-[var(--text-secondary)]">
              Chênh lệch:{" "}
              <span
                className={
                  difference >= 0
                    ? "text-[var(--success)] font-semibold"
                    : "text-[var(--danger)] font-semibold"
                }
              >
                {difference >= 0 ? "+" : "-"}
                {formatMoney(Math.abs(difference))} ₫
              </span>
            </p>
          </div>
        )}

        <div className="flex gap-3 mt-6">
          <Button
            variant="secondary"
            className="flex-1"
            onClick={onClose}
            disabled={pending}
          >
            Huỷ
          </Button>
          <Button
            className="flex-1"
            disabled={isDisabled}
            onClick={() =>
              onSubmit({
                actualBalanceMinor: actualValue,
                reason: reason || undefined,
                note: note || undefined,
              })
            }
          >
            {pending ? "Đang xử lý..." : "Xác nhận"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function AccountsOverview() {
  const navigate = useNavigate();
  const toast = useToast();
  const { data, loading, error, reload } = useAccountsOverview();

  const [search, setSearch] = useState("");
  const [statusTab, setStatusTab] = useState<"active" | "archived">("active");
  const [pendingAccountId, setPendingAccountId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AccountSummaryDto | null>(
    null,
  );
  const [reconcileTarget, setReconcileTarget] =
    useState<AccountSummaryDto | null>(null);

  const filteredAccounts = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    const source = (data?.accounts || []).filter(
      (item) => item.status === statusTab,
    );

    if (!keyword) return source;

    return source.filter((account) =>
      [
        account.name,
        account.providerName || "",
        account.accountNumber || "",
        account.accountOwnerName || "",
        account.accountTypeLabel,
      ]
        .join(" ")
        .toLowerCase()
        .includes(keyword),
    );
  }, [data?.accounts, search, statusTab]);

  const handleArchiveToggle = async (account: AccountSummaryDto) => {
    try {
      setPendingAccountId(account.id);
      const archived = account.status === "active";
      await accountsService.archiveAccount(account.id, archived);
      toast.success(
        archived ? "Đã lưu trữ tài khoản" : "Đã khôi phục tài khoản",
      );
      await reload();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Không thể cập nhật trạng thái tài khoản",
      );
    } finally {
      setPendingAccountId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    try {
      setPendingAccountId(deleteTarget.id);
      await accountsService.deleteAccount(deleteTarget.id);
      toast.success("Đã xoá tài khoản");
      setDeleteTarget(null);
      await reload();
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        toast.error(
          "Tài khoản đã phát sinh dữ liệu hoặc đang được tham chiếu, không thể xoá",
        );
      } else {
        toast.error(
          error instanceof Error ? error.message : "Không thể xoá tài khoản",
        );
      }
    } finally {
      setPendingAccountId(null);
    }
  };

  const handleReconcile = async (payload: {
    actualBalanceMinor: number;
    reason?: string;
    note?: string;
  }) => {
    if (!reconcileTarget) return;

    try {
      setPendingAccountId(reconcileTarget.id);
      await accountsService.reconcileAccount(reconcileTarget.id, payload);
      toast.success("Đã điều chỉnh số dư");
      setReconcileTarget(null);
      await reload();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Không thể điều chỉnh số dư",
      );
    } finally {
      setPendingAccountId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--background)] p-4 md:p-6">
        <Card>
          <p className="text-sm text-[var(--text-secondary)]">
            Đang tải danh sách tài khoản...
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
            {error || "Không thể tải danh sách tài khoản"}
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6 pb-20 md:pb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="text-sm text-[var(--text-secondary)]">Tổng tài sản</p>
            <h1 className="text-4xl font-bold text-[var(--primary)] tabular-nums mt-1">
              {formatMoney(data.summary.totalBalanceMinor)} ₫
            </h1>
          </div>

          <Button onClick={() => navigate("/accounts/create")}>
            <Plus className="w-4 h-4" />
            Tạo tài khoản
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {data.groupedBalances.map((group) => (
            <Card key={group.type}>
              <p className="text-sm text-[var(--text-secondary)]">
                {group.label}
              </p>
              <p className="text-2xl font-semibold text-[var(--text-primary)] mt-2 tabular-nums">
                {formatMoney(group.totalBalanceMinor)} ₫
              </p>
              <p className="text-xs text-[var(--text-tertiary)] mt-1">
                {group.count} tài khoản
              </p>
            </Card>
          ))}
        </div>

        <Card>
          <div className="flex flex-col md:flex-row md:items-center gap-4 md:justify-between">
            <div className="flex items-center gap-2 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--input-background)] px-3 py-2 w-full md:max-w-md">
              <Search className="w-4 h-4 text-[var(--text-tertiary)]" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Tìm kiếm tài khoản..."
                className="w-full bg-transparent outline-none text-sm text-[var(--text-primary)]"
              />
            </div>

            <div className="inline-flex rounded-[var(--radius-lg)] border border-[var(--border)] overflow-hidden">
              <button
                onClick={() => setStatusTab("active")}
                className={`px-4 py-2 text-sm font-medium ${
                  statusTab === "active"
                    ? "bg-[var(--primary)] text-white"
                    : "bg-transparent text-[var(--text-secondary)]"
                }`}
              >
                Đang dùng ({data.summary.activeAccountCount})
              </button>
              <button
                onClick={() => setStatusTab("archived")}
                className={`px-4 py-2 text-sm font-medium ${
                  statusTab === "archived"
                    ? "bg-[var(--primary)] text-white"
                    : "bg-transparent text-[var(--text-secondary)]"
                }`}
              >
                Đã lưu trữ ({data.summary.archivedAccountCount})
              </button>
            </div>
          </div>
        </Card>

        <div className="space-y-3">
          {filteredAccounts.map((account) => {
            const Icon = getAccountIcon(account.accountType);
            const isPending = pendingAccountId === account.id;
            const canDelete =
              account.transactionCount === 0 &&
              account.reconciliationCount === 0;

            return (
              <Card
                key={account.id}
                className="cursor-pointer hover:shadow-[var(--shadow-lg)] transition-shadow"
                onClick={() => navigate(`/accounts/${account.id}`)}
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-11 h-11 rounded-full bg-[var(--primary-light)] text-[var(--primary)] flex items-center justify-center flex-shrink-0">
                      <Icon className="w-5 h-5" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-[var(--text-primary)] truncate">
                          {account.name}
                        </p>
                        {account.status === "archived" && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--surface)] text-[var(--text-tertiary)] border border-[var(--border)]">
                            Đã lưu trữ
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-[var(--text-tertiary)] truncate mt-1">
                        {getAccountSubtitle({
                          providerName: account.providerName,
                          accountNumber: account.accountNumber,
                          accountType: account.accountType,
                        }) || account.accountTypeLabel}
                      </p>

                      <p className="text-sm text-[var(--text-secondary)] mt-1">
                        {account.transactionCount} giao dịch •{" "}
                        {account.reconciliationCount} lần đối soát
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right hidden sm:block">
                      <p className="text-lg font-semibold text-[var(--success)] tabular-nums">
                        {formatMoney(account.currentBalanceMinor)} ₫
                      </p>
                      <p className="text-xs text-[var(--text-tertiary)]">
                        {account.currencyCode}
                      </p>
                    </div>

                    <ActionMenu
                      account={account}
                      onView={() => navigate(`/accounts/${account.id}`)}
                      onEdit={() => navigate(`/accounts/${account.id}/edit`)}
                      onReconcile={() => setReconcileTarget(account)}
                      onArchiveToggle={() => void handleArchiveToggle(account)}
                      onDelete={() => {
                        if (!canDelete) {
                          toast.error(
                            "Tài khoản đã phát sinh dữ liệu hoặc đang được tham chiếu, không thể xoá",
                          );
                          return;
                        }
                        setDeleteTarget(account);
                      }}
                    />

                    <ChevronRight className="w-5 h-5 text-[var(--text-tertiary)]" />
                  </div>
                </div>

                <div className="sm:hidden mt-3 pt-3 border-t border-[var(--divider)] flex items-center justify-between">
                  <p className="text-lg font-semibold text-[var(--success)] tabular-nums">
                    {formatMoney(account.currentBalanceMinor)} ₫
                  </p>
                  {isPending && (
                    <p className="text-xs text-[var(--text-tertiary)]">
                      Đang xử lý...
                    </p>
                  )}
                </div>
              </Card>
            );
          })}

          {filteredAccounts.length === 0 && (
            <Card>
              <p className="text-sm text-[var(--text-secondary)] text-center py-6">
                Không có tài khoản nào phù hợp.
              </p>
            </Card>
          )}
        </div>
      </div>

      <ConfirmationModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => void handleDelete()}
        title="Xoá tài khoản?"
        description={`Bạn có chắc muốn xoá tài khoản "${deleteTarget?.name || ""}"? Hành động này không thể hoàn tác.`}
        confirmLabel="Xoá"
        cancelLabel="Huỷ"
        isDangerous
      />

      {reconcileTarget && (
        <ReconcileModal
          account={reconcileTarget}
          onClose={() => setReconcileTarget(null)}
          onSubmit={handleReconcile}
          pending={pendingAccountId === reconcileTarget.id}
        />
      )}
    </div>
  );
}

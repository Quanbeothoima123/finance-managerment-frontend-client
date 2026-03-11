import React, { useState } from "react";
import { useParams } from "react-router";
import {
  AlertTriangle,
  ArrowLeft,
  Edit2,
  Store,
  Tag,
  Trash2,
} from "lucide-react";
import { Card } from "../components/Card";
import { Button } from "../components/Button";
import { ConfirmationModal } from "../components/ConfirmationModals";
import { useAppNavigation } from "../hooks/useAppNavigation";
import { useToast } from "../contexts/ToastContext";
import { useMerchantDetail } from "../hooks/useMerchantDetail";
import { merchantsService } from "../services/merchantsService";

function formatMoney(value?: string | number | null) {
  return new Intl.NumberFormat("vi-VN").format(Number(value || 0));
}

function formatDate(value?: string | null) {
  if (!value) return "Chưa có";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export default function MerchantDetail() {
  const { id } = useParams<{ id: string }>();
  const nav = useAppNavigation();
  const toast = useToast();
  const { data, loading, error } = useMerchantDetail(id);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!data?.merchant) return;

    try {
      setDeleting(true);
      await merchantsService.deleteMerchant(data.merchant.id);
      toast.success(`Đã xoá merchant "${data.merchant.name}"`);
      nav.goMerchants();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Không thể xoá merchant",
      );
    } finally {
      setDeleting(false);
      setDeleteModalOpen(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--background)] p-4 md:p-6">
        <Card>
          <p className="text-sm text-[var(--text-secondary)]">
            Đang tải chi tiết merchant...
          </p>
        </Card>
      </div>
    );
  }

  if (error || !data?.merchant) {
    return (
      <div className="min-h-screen bg-[var(--background)]">
        <div className="max-w-6xl mx-auto p-4 md:p-6 pb-20 md:pb-6 space-y-6">
          <button
            onClick={nav.goBack}
            className="flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Quay lại</span>
          </button>

          <Card>
            <div className="text-center py-10">
              <div className="w-16 h-16 bg-[var(--warning-light)] rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-[var(--warning)]" />
              </div>
              <h3 className="font-semibold text-[var(--text-primary)] mb-2">
                Không tìm thấy merchant
              </h3>
              <p className="text-sm text-[var(--text-secondary)] mb-6">
                {error || "Merchant này có thể đã bị xoá hoặc không tồn tại."}
              </p>
              <Button onClick={nav.goMerchants}>Về danh sách merchant</Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  const merchant = data.merchant;
  const stats = data.stats;
  const avgTransaction =
    stats.transactionCount > 0
      ? Math.round(Number(stats.totalSpentMinor || 0) / stats.transactionCount)
      : 0;

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="max-w-6xl mx-auto p-4 md:p-6 pb-20 md:pb-6 space-y-6">
        <div>
          <button
            onClick={nav.goMerchants}
            className="flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Quay lại</span>
          </button>

          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-[var(--surface)] rounded-[var(--radius-lg)] flex items-center justify-center flex-shrink-0">
              <Store className="w-8 h-8 text-[var(--text-secondary)]" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-semibold text-[var(--text-primary)] truncate">
                  {merchant.name}
                </h1>
                {merchant.isHidden && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--surface)] border border-[var(--border)] text-[var(--text-tertiary)]">
                    Đã ẩn
                  </span>
                )}
              </div>
              <p className="text-sm text-[var(--text-secondary)] mt-1">
                Chi tiết merchant
              </p>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <Button
                variant="secondary"
                onClick={() => nav.goEditMerchant(merchant.id)}
              >
                <Edit2 className="w-4 h-4" />
                <span className="hidden md:inline">Chỉnh sửa</span>
              </Button>

              <Button variant="danger" onClick={() => setDeleteModalOpen(true)}>
                <Trash2 className="w-4 h-4" />
                <span className="hidden md:inline">Xoá</span>
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <p className="text-sm text-[var(--text-secondary)] mb-1">
              Tổng chi
            </p>
            <p className="text-2xl font-semibold text-[var(--text-primary)] tabular-nums">
              {formatMoney(stats.totalSpentMinor)}₫
            </p>
          </Card>

          <Card>
            <p className="text-sm text-[var(--text-secondary)] mb-1">
              Giao dịch
            </p>
            <p className="text-2xl font-semibold text-[var(--text-primary)] tabular-nums">
              {stats.transactionCount}
            </p>
          </Card>

          <Card>
            <p className="text-sm text-[var(--text-secondary)] mb-1">
              Recurring rules
            </p>
            <p className="text-2xl font-semibold text-[var(--text-primary)] tabular-nums">
              {stats.recurringRuleCount}
            </p>
          </Card>

          <Card>
            <p className="text-sm text-[var(--text-secondary)] mb-1">
              Trung bình / giao dịch
            </p>
            <p className="text-2xl font-semibold text-[var(--text-primary)] tabular-nums">
              {formatMoney(avgTransaction)}₫
            </p>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-6">
            <Card>
              <h3 className="font-semibold text-[var(--text-primary)] mb-4">
                Thông tin
              </h3>

              <div className="space-y-4">
                <div>
                  <p className="text-sm text-[var(--text-secondary)] mb-1">
                    Tên merchant
                  </p>
                  <p className="font-medium text-[var(--text-primary)]">
                    {merchant.name}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-[var(--text-secondary)] mb-1">
                    Danh mục mặc định
                  </p>
                  {merchant.defaultCategoryInfo ? (
                    <div className="flex items-center gap-2">
                      <Tag className="w-4 h-4 text-[var(--primary)]" />
                      <p className="font-medium text-[var(--text-primary)]">
                        {merchant.defaultCategoryInfo.name}
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-[var(--text-tertiary)] italic">
                      Chưa đặt danh mục mặc định
                    </p>
                  )}
                </div>

                <div>
                  <p className="text-sm text-[var(--text-secondary)] mb-1">
                    Giao dịch gần nhất
                  </p>
                  <p className="font-medium text-[var(--text-primary)]">
                    {formatDate(stats.lastTransactionAt)}
                  </p>
                </div>

                {merchant.note && (
                  <div>
                    <p className="text-sm text-[var(--text-secondary)] mb-1">
                      Ghi chú
                    </p>
                    <p className="font-medium text-[var(--text-primary)] whitespace-pre-wrap">
                      {merchant.note}
                    </p>
                  </div>
                )}
              </div>
            </Card>
          </div>

          <Card>
            <h3 className="font-semibold text-[var(--text-primary)] mb-4">
              Giao dịch gần đây
            </h3>

            <div className="space-y-3">
              {data.recentTransactions.length === 0 ? (
                <p className="text-sm text-[var(--text-secondary)]">
                  Chưa có giao dịch nào gắn merchant này.
                </p>
              ) : (
                data.recentTransactions.map((transaction) => (
                  <button
                    key={transaction.id}
                    onClick={() => nav.goTransactionDetail(transaction.id)}
                    className="w-full p-3 rounded-[var(--radius-lg)] bg-[var(--surface)] hover:bg-[var(--border)] transition-colors text-left"
                  >
                    <div className="flex items-start justify-between gap-3 mb-1">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                          {transaction.description || "Giao dịch"}
                        </p>
                        <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                          {transaction.category?.name || "--"}
                        </p>
                      </div>

                      <span
                        className={`text-sm font-semibold tabular-nums ${
                          transaction.txnType === "income"
                            ? "text-[var(--success)]"
                            : transaction.txnType === "expense"
                              ? "text-[var(--danger)]"
                              : "text-[var(--info)]"
                        }`}
                      >
                        {transaction.txnType === "income"
                          ? "+"
                          : transaction.txnType === "expense"
                            ? "-"
                            : ""}
                        {formatMoney(
                          transaction.txnType === "transfer"
                            ? transaction.totalAmountMinor
                            : Math.abs(
                                Number(transaction.signedAmountMinor || 0),
                              ),
                        )}
                        ₫
                      </span>
                    </div>

                    <p className="text-xs text-[var(--text-tertiary)]">
                      {formatDate(transaction.occurredAt)}
                    </p>
                  </button>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>

      <ConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={() => void handleDelete()}
        title="Xoá merchant?"
        description={`Bạn có chắc muốn xoá merchant "${merchant.name}"?`}
        confirmLabel={deleting ? "Đang xoá..." : "Xoá"}
        cancelLabel="Huỷ"
        isDangerous
      />
    </div>
  );
}

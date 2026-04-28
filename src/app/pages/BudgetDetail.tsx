import React, { useMemo, useState } from "react";
import { useParams } from "react-router";
import {
  ArrowLeft,
  Edit2,
  PiggyBank,
  Plus,
  Trash2,
  Tag,
  Store,
  Save,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Card } from "../components/Card";
import { Button } from "../components/Button";
import {
  ConfirmationModal,
  DeleteBudgetModal,
} from "../components/ConfirmationModals";
import { TagChip } from "../components/TagChip";
import { useAppNavigation } from "../hooks/useAppNavigation";
import { useToast } from "../contexts/ToastContext";
import { useBudgetDetail } from "../hooks/useBudgetDetail";
import { budgetsService } from "../services/budgetsService";
import type { BudgetItemDetail } from "../types/budgets";

function formatMoney(value?: string | number | null) {
  return new Intl.NumberFormat("vi-VN").format(Number(value || 0));
}

function formatDate(value?: string | null) {
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function getStatusStyles(progressPercent: number) {
  if (progressPercent > 100) {
    return {
      text: "text-[var(--danger)]",
      bg: "bg-[var(--danger-light)]",
      bar: "var(--danger)",
      status: "over",
    };
  }
  if (progressPercent >= 80) {
    return {
      text: "text-[var(--warning)]",
      bg: "bg-[var(--warning-light)]",
      bar: "var(--warning)",
      status: "warning",
    };
  }
  return {
    text: "text-[var(--success)]",
    bg: "bg-[var(--success-light)]",
    bar: "var(--success)",
    status: "on_track",
  };
}

export default function BudgetDetail() {
  const { id } = useParams<{ id: string }>();
  const nav = useAppNavigation();
  const toast = useToast();
  const { t } = useTranslation("budgets");

  const { data, loading, error, reload } = useBudgetDetail(id);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingBudget, setDeletingBudget] = useState(false);

  const [deleteItemTarget, setDeleteItemTarget] =
    useState<BudgetItemDetail | null>(null);
  const [deletingItem, setDeletingItem] = useState(false);

  const [editItemTarget, setEditItemTarget] = useState<BudgetItemDetail | null>(
    null,
  );
  const [editingItemLimit, setEditingItemLimit] = useState("");
  const [editingItemThresholds, setEditingItemThresholds] = useState<number[]>(
    [],
  );
  const [savingItem, setSavingItem] = useState(false);

  const stats = useMemo(() => {
    const items = data?.items || [];
    return {
      safe: items.filter((item) => item.progressPercent < 80).length,
      warning: items.filter(
        (item) => item.progressPercent >= 80 && item.progressPercent <= 100,
      ).length,
      over: items.filter((item) => item.progressPercent > 100).length,
    };
  }, [data?.items]);

  const handleDeleteBudget = async () => {
    if (!data?.budget) return;

    try {
      setDeletingBudget(true);
      await budgetsService.deleteBudget(data.budget.id);
      toast.success(t("detail.delete_budget_modal.success"));
      nav.goBudgets();
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : t("detail.delete_budget_modal.failed"),
      );
    } finally {
      setDeletingBudget(false);
      setDeleteModalOpen(false);
    }
  };

  const handleDeleteItem = async () => {
    if (!data?.budget || !deleteItemTarget) return;

    try {
      setDeletingItem(true);
      await budgetsService.deleteBudgetItem(
        data.budget.id,
        deleteItemTarget.id,
      );
      toast.success(t("detail.delete_item_modal.success"));
      setDeleteItemTarget(null);
      await reload();
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : t("detail.delete_item_modal.failed"),
      );
    } finally {
      setDeletingItem(false);
    }
  };

  const openEditItem = (item: BudgetItemDetail) => {
    setEditItemTarget(item);
    setEditingItemLimit(item.limitAmountMinor);
    setEditingItemThresholds(
      item.alertThresholds?.length ? item.alertThresholds : [80, 100],
    );
  };

  const handleSaveItem = async () => {
    if (!data?.budget || !editItemTarget) return;
    if (!editingItemLimit || Number(editingItemLimit) <= 0) {
      toast.error(t("detail.edit_item_modal.invalid_limit"));
      return;
    }

    try {
      setSavingItem(true);
      await budgetsService.updateBudgetItem(data.budget.id, editItemTarget.id, {
        limitAmountMinor: Number(editingItemLimit),
        alertThresholds: editingItemThresholds,
      });
      toast.success(t("detail.edit_item_modal.success"));
      setEditItemTarget(null);
      await reload();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : t("detail.edit_item_modal.failed"),
      );
    } finally {
      setSavingItem(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--background)] p-4 md:p-6">
        <Card>
          <p className="text-sm text-[var(--text-secondary)]">
            {t("detail.loading")}
          </p>
        </Card>
      </div>
    );
  }

  if (error || !data?.budget) {
    return (
      <div className="min-h-screen bg-[var(--background)] p-4 md:p-6">
        <Card>
          <p className="text-sm text-[var(--danger)]">
            {error || t("detail.not_found")}
          </p>
        </Card>
      </div>
    );
  }

  const budget = data.budget;
  const budgetStatus = getStatusStyles(budget.progressPercent);

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="max-w-6xl mx-auto p-4 md:p-6 pb-20 md:pb-6 space-y-6">
        <div>
          <button
            onClick={nav.goBudgets}
            className="flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">{t("detail.back")}</span>
          </button>

          <div className="flex items-center gap-4">
            <div
              className="w-16 h-16 rounded-[var(--radius-lg)] flex items-center justify-center flex-shrink-0"
              style={{
                backgroundColor: `${budget.itemsPreview[0]?.category?.colorHex || "#64748b"}20`,
              }}
            >
              <PiggyBank
                className="w-8 h-8"
                style={{
                  color:
                    budget.itemsPreview[0]?.category?.colorHex || "#64748b",
                }}
              />
            </div>

            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-semibold text-[var(--text-primary)] truncate">
                {budget.name}
              </h1>
              <p className="text-sm text-[var(--text-secondary)] mt-1">
                {formatDate(budget.startDate)} - {formatDate(budget.endDate)}
              </p>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <Button
                variant="secondary"
                onClick={() => nav.goAddBudgetItem(budget.id)}
              >
                <Plus className="w-4 h-4" />
                <span className="hidden md:inline">{t("detail.add_item")}</span>
              </Button>

              <Button
                variant="secondary"
                onClick={() => nav.goEditBudget(budget.id)}
              >
                <Edit2 className="w-4 h-4" />
                <span className="hidden md:inline">{t("detail.edit")}</span>
              </Button>

              <Button variant="danger" onClick={() => setDeleteModalOpen(true)}>
                <Trash2 className="w-4 h-4" />
                <span className="hidden md:inline">{t("detail.delete")}</span>
              </Button>
            </div>
          </div>
        </div>

        <Card>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start">
            <div>
              <p className="text-sm text-[var(--text-secondary)] mb-1">
                {t("detail.summary.total_limit")}
              </p>
              <p className="text-2xl font-semibold text-[var(--text-primary)] tabular-nums">
                {formatMoney(data.summary.totalLimitMinor)}₫
              </p>
            </div>

            <div>
              <p className="text-sm text-[var(--text-secondary)] mb-1">
                {t("detail.summary.spent")}
              </p>
              <p className="text-2xl font-semibold text-[var(--text-primary)] tabular-nums">
                {formatMoney(data.summary.spentMinor)}₫
              </p>
            </div>

            <div>
              <p className="text-sm text-[var(--text-secondary)] mb-1">
                {t("detail.summary.remaining")}
              </p>
              <p className="text-2xl font-semibold text-[var(--text-primary)] tabular-nums">
                {formatMoney(data.summary.remainingMinor)}₫
              </p>
            </div>

            <div>
              <p className="text-sm text-[var(--text-secondary)] mb-1">
                {t("detail.summary.status")}
              </p>
              <div
                className={`inline-flex px-3 py-1.5 rounded-full text-sm font-medium ${budgetStatus.bg} ${budgetStatus.text}`}
              >
                {t(`overview.card.status.${budgetStatus.status}`)}
              </div>
            </div>
          </div>

          <div className="mt-5">
            <div className="h-3 bg-[var(--surface)] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${Math.min(budget.progressPercent, 100)}%`,
                  backgroundColor: budgetStatus.bar,
                }}
              />
            </div>
            <div className="mt-2 flex items-center justify-between text-sm">
              <span className="text-[var(--text-secondary)]">
                {Math.round(budget.progressPercent)}%
              </span>
              <span className="text-[var(--text-secondary)]">
                {t("overview.stats.safe", { count: stats.safe })} ·{" "}
                {t("overview.stats.warning", { count: stats.warning })} ·{" "}
                {t("overview.stats.over", { count: stats.over })}
              </span>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
          <div className="xl:col-span-3">
            <Card>
              <div className="flex items-center justify-between gap-3 mb-4">
                <h3 className="font-semibold text-[var(--text-primary)]">
                  {t("detail.items_section")}
                </h3>
                <span className="text-sm text-[var(--text-secondary)]">
                  {t("detail.items_count", { count: data.items.length })}
                </span>
              </div>

              {data.items.length === 0 ? (
                <p className="text-sm text-[var(--text-secondary)]">
                  {t("detail.items_empty")}
                </p>
              ) : (
                <div className="space-y-3">
                  {data.items.map((item) => {
                    const itemStatus = getStatusStyles(item.progressPercent);

                    return (
                      <div
                        key={item.id}
                        className="p-4 rounded-[var(--radius-lg)] bg-[var(--surface)]"
                      >
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="min-w-0">
                            {item.category?.id ? (
                              <button
                                onClick={() =>
                                  nav.goTransactionsByCategory(
                                    item.category!.id,
                                  )
                                }
                                className="font-medium text-[var(--primary)] hover:underline text-left"
                              >
                                {item.category?.name ||
                                  item.categoryName ||
                                  t("detail.item_card.default_category")}
                              </button>
                            ) : (
                              <p className="font-medium text-[var(--text-primary)]">
                                {item.category?.name ||
                                  item.categoryName ||
                                  t("detail.item_card.default_category")}
                              </p>
                            )}

                            <p className="text-xs text-[var(--text-secondary)] mt-1">
                              {t("detail.item_card.transaction_count", {
                                count: item.transactionCount,
                              })}
                            </p>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => openEditItem(item)}
                              className="p-2 rounded-[var(--radius-md)] hover:bg-[var(--card)] transition-colors"
                            >
                              <Edit2 className="w-4 h-4 text-[var(--text-secondary)]" />
                            </button>

                            <button
                              onClick={() => setDeleteItemTarget(item)}
                              className="p-2 rounded-[var(--radius-md)] hover:bg-[var(--danger-light)] transition-colors"
                            >
                              <Trash2 className="w-4 h-4 text-[var(--danger)]" />
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-3 text-sm mb-3">
                          <div>
                            <p className="text-[var(--text-secondary)] mb-1">
                              {t("detail.item_card.limit")}
                            </p>
                            <p className="font-semibold text-[var(--text-primary)] tabular-nums">
                              {formatMoney(item.limitAmountMinor)}₫
                            </p>
                          </div>
                          <div>
                            <p className="text-[var(--text-secondary)] mb-1">
                              {t("detail.item_card.spent")}
                            </p>
                            <p className="font-semibold text-[var(--text-primary)] tabular-nums">
                              {formatMoney(item.spentMinor)}₫
                            </p>
                          </div>
                          <div>
                            <p className="text-[var(--text-secondary)] mb-1">
                              {t("detail.item_card.remaining")}
                            </p>
                            <p className="font-semibold text-[var(--text-primary)] tabular-nums">
                              {formatMoney(item.remainingMinor)}₫
                            </p>
                          </div>
                        </div>

                        <div className="h-2.5 bg-[var(--card)] rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${Math.min(item.progressPercent, 100)}%`,
                              backgroundColor: itemStatus.bar,
                            }}
                          />
                        </div>

                        <div className="flex items-center justify-between mt-2 text-xs">
                          <span className={`${itemStatus.text} font-medium`}>
                            {t(`overview.card.status.${itemStatus.status}`)}
                          </span>

                          <div className="flex items-center gap-2">
                            {item.alertThresholds.map((threshold) => (
                              <span
                                key={threshold}
                                className="px-2 py-0.5 rounded-full bg-[var(--card)] text-[var(--text-secondary)]"
                              >
                                {threshold}%
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          </div>

          <div className="xl:col-span-2">
            <Card>
              <div className="flex items-center justify-between gap-3 mb-4">
                <h3 className="font-semibold text-[var(--text-primary)]">
                  {t("detail.recent_transactions")}
                </h3>

                <button
                  onClick={() =>
                    nav.goTransactionsWithFilters({
                      tagIds: [],
                      startDate: budget.startDate?.slice(0, 10),
                      endDate: budget.endDate?.slice(0, 10) || undefined,
                    })
                  }
                  className="text-sm font-medium text-[var(--primary)] hover:underline"
                >
                  {t("detail.see_more")}
                </button>
              </div>

              {data.recentTransactions.length === 0 ? (
                <p className="text-sm text-[var(--text-secondary)]">
                  {t("detail.transactions_empty")}
                </p>
              ) : (
                <div className="space-y-3">
                  {data.recentTransactions.map((transaction) => (
                    <button
                      key={transaction.id}
                      onClick={() => nav.goTransactionDetail(transaction.id)}
                      className="w-full p-3 rounded-[var(--radius-lg)] bg-[var(--surface)] hover:bg-[var(--border)] transition-colors text-left"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                            {transaction.description ||
                              t("detail.transaction_default")}
                          </p>

                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            <span className="text-xs text-[var(--text-tertiary)]">
                              {formatDate(transaction.occurredAt)}
                            </span>

                            {transaction.category?.id && (
                              <button
                                onClick={(event) => {
                                  event.stopPropagation();
                                  nav.goTransactionsByCategory(
                                    transaction.category!.id,
                                  );
                                }}
                                className="text-xs text-[var(--primary)] hover:underline"
                              >
                                {transaction.category.name}
                              </button>
                            )}

                            {transaction.merchant?.id && (
                              <button
                                onClick={(event) => {
                                  event.stopPropagation();
                                  nav.goTransactionsByMerchant(
                                    transaction.merchant!.id,
                                  );
                                }}
                                className="inline-flex items-center gap-1 text-xs text-[var(--primary)] hover:underline"
                              >
                                <Store className="w-3 h-3" />
                                {transaction.merchant.name}
                              </button>
                            )}
                          </div>

                          {transaction.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2">
                              {transaction.tags.map((tag) => (
                                <button
                                  key={tag.id}
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    nav.goTransactionsByTag(tag.id);
                                  }}
                                  className="rounded-[var(--radius-md)]"
                                >
                                  <TagChip
                                    name={tag.name}
                                    color={tag.colorHex || "#64748b"}
                                    className="hover:scale-[1.02] transition-transform"
                                  />
                                </button>
                              ))}
                            </div>
                          )}
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
                    </button>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>

      <DeleteBudgetModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={() => void handleDeleteBudget()}
        budgetName={budget.name}
      />

      <ConfirmationModal
        isOpen={Boolean(deleteItemTarget)}
        onClose={() => setDeleteItemTarget(null)}
        onConfirm={() => void handleDeleteItem()}
        title={t("detail.delete_item_modal.title")}
        description={
          deleteItemTarget
            ? t("detail.delete_item_modal.description", {
                name:
                  deleteItemTarget.category?.name ||
                  deleteItemTarget.categoryName ||
                  t("detail.item_card.default_category"),
              })
            : ""
        }
        confirmLabel={
          deletingItem
            ? t("detail.delete_item_modal.deleting")
            : t("detail.delete_item_modal.confirm")
        }
        cancelLabel={t("common:actions.cancel")}
        isDangerous
      />

      <ConfirmationModal
        isOpen={Boolean(editItemTarget)}
        onClose={() => setEditItemTarget(null)}
        onConfirm={() => void handleSaveItem()}
        title={t("detail.edit_item_modal.title")}
        description={
          editItemTarget
            ? t("detail.edit_item_modal.description", {
                name:
                  editItemTarget.category?.name ||
                  editItemTarget.categoryName ||
                  t("detail.item_card.default_category"),
              })
            : ""
        }
        confirmLabel={
          savingItem
            ? t("detail.edit_item_modal.saving")
            : t("detail.edit_item_modal.confirm")
        }
        cancelLabel={t("common:actions.cancel")}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
              {t("detail.edit_item_modal.limit_label")}
            </label>
            <input
              type="number"
              min="0"
              value={editingItemLimit}
              onChange={(event) => setEditingItemLimit(event.target.value)}
              className="w-full px-4 py-2.5 bg-[var(--input-background)] border border-[var(--border)] rounded-[var(--radius-lg)]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
              {t("detail.edit_item_modal.threshold_label")}
            </label>
            <div className="flex flex-wrap gap-2">
              {[50, 80, 100].map((threshold) => {
                const active = editingItemThresholds.includes(threshold);
                return (
                  <button
                    key={threshold}
                    type="button"
                    onClick={() =>
                      setEditingItemThresholds((prev) => {
                        if (prev.includes(threshold)) {
                          const next = prev.filter(
                            (item) => item !== threshold,
                          );
                          return next.length ? next : [100];
                        }
                        return [...prev, threshold].sort((a, b) => a - b);
                      })
                    }
                    className={`px-3 py-2 rounded-[var(--radius-lg)] text-sm font-medium border transition-colors ${
                      active
                        ? "bg-[var(--warning-light)] text-[var(--warning)] border-[var(--warning)]/20"
                        : "bg-[var(--surface)] text-[var(--text-secondary)] border-[var(--border)]"
                    }`}
                  >
                    {threshold}%
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </ConfirmationModal>
    </div>
  );
}

import React, { useState } from "react";
import { useParams } from "react-router";
import {
  AlertTriangle,
  ArrowLeft,
  Edit2,
  Store,
  Tag,
  Trash2,
  ListFilter,
} from "lucide-react";
import { useTranslation } from "react-i18next";
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

function formatDateValue(value: string, locale: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export default function MerchantDetail() {
  const { t, i18n } = useTranslation('merchants');
  const locale = i18n.language === 'vi' ? 'vi-VN' : 'en-US';
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
      toast.success(t('detail.toast.deleted', { name: data.merchant.name }));
      nav.goMerchants();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : t('detail.toast.delete_failed'),
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
            {t('detail.loading')}
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
            <span className="font-medium">{t('detail.back')}</span>
          </button>

          <Card>
            <div className="text-center py-10">
              <div className="w-16 h-16 bg-[var(--warning-light)] rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-[var(--warning)]" />
              </div>
              <h3 className="font-semibold text-[var(--text-primary)] mb-2">
                {t('detail.not_found.title')}
              </h3>
              <p className="text-sm text-[var(--text-secondary)] mb-6">
                {error || t('detail.not_found.description')}
              </p>
              <Button onClick={nav.goMerchants}>{t('detail.not_found.back_button')}</Button>
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
            <span className="font-medium">{t('detail.back_to_list')}</span>
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
                    {t('detail.badge_hidden')}
                  </span>
                )}
              </div>
              <p className="text-sm text-[var(--text-secondary)] mt-1">
                {t('detail.subtitle')}
              </p>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <Button
                variant="secondary"
                onClick={() => nav.goEditMerchant(merchant.id)}
              >
                <Edit2 className="w-4 h-4" />
                <span className="hidden md:inline">{t('detail.actions.edit')}</span>
              </Button>

              <Button
                variant="secondary"
                onClick={() => nav.goTransactionsByMerchant(merchant.id)}
              >
                <ListFilter className="w-4 h-4" />
                <span className="hidden md:inline">{t('detail.actions.view_transactions')}</span>
              </Button>

              <Button variant="danger" onClick={() => setDeleteModalOpen(true)}>
                <Trash2 className="w-4 h-4" />
                <span className="hidden md:inline">{t('detail.actions.delete')}</span>
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <p className="text-sm text-[var(--text-secondary)] mb-1">
              {t('detail.stats.total_spent')}
            </p>
            <p className="text-2xl font-semibold text-[var(--text-primary)] tabular-nums">
              {formatMoney(stats.totalSpentMinor)}₫
            </p>
          </Card>

          <Card>
            <p className="text-sm text-[var(--text-secondary)] mb-1">
              {t('detail.stats.transaction_count')}
            </p>
            <p className="text-2xl font-semibold text-[var(--text-primary)] tabular-nums">
              {stats.transactionCount}
            </p>
          </Card>

          <Card>
            <p className="text-sm text-[var(--text-secondary)] mb-1">
              {t('detail.stats.recurring_rules')}
            </p>
            <p className="text-2xl font-semibold text-[var(--text-primary)] tabular-nums">
              {stats.recurringRuleCount}
            </p>
          </Card>

          <Card>
            <p className="text-sm text-[var(--text-secondary)] mb-1">
              {t('detail.stats.avg_per_transaction')}
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
                {t('detail.info_section.title')}
              </h3>

              <div className="space-y-4">
                <div>
                  <p className="text-sm text-[var(--text-secondary)] mb-1">
                    {t('detail.info_section.name_label')}
                  </p>
                  <p className="font-medium text-[var(--text-primary)]">
                    {merchant.name}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-[var(--text-secondary)] mb-1">
                    {t('detail.info_section.default_category_label')}
                  </p>
                  {merchant.defaultCategoryInfo ? (
                    <button
                      onClick={() =>
                        nav.goTransactionsByCategory(
                          merchant.defaultCategoryInfo!.id,
                        )
                      }
                      className="inline-flex items-center gap-2 font-medium text-[var(--primary)] hover:underline"
                    >
                      <Tag className="w-4 h-4" />
                      {merchant.defaultCategoryInfo.name}
                    </button>
                  ) : (
                    <p className="text-sm text-[var(--text-tertiary)] italic">
                      {t('detail.info_section.no_default_category')}
                    </p>
                  )}
                </div>

                <div>
                  <p className="text-sm text-[var(--text-secondary)] mb-1">
                    {t('detail.info_section.last_transaction_label')}
                  </p>
                  <p className="font-medium text-[var(--text-primary)]">
                    {stats.lastTransactionAt
                      ? formatDateValue(stats.lastTransactionAt, locale)
                      : t('detail.info_section.date_never')}
                  </p>
                </div>

                {merchant.note && (
                  <div>
                    <p className="text-sm text-[var(--text-secondary)] mb-1">
                      {t('detail.info_section.note_label')}
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
            <div className="flex items-center justify-between gap-3 mb-4">
              <h3 className="font-semibold text-[var(--text-primary)]">
                {t('detail.recent_transactions.title')}
              </h3>

              <button
                onClick={() => nav.goTransactionsByMerchant(merchant.id)}
                className="text-sm font-medium text-[var(--primary)] hover:underline"
              >
                {t('detail.recent_transactions.view_all')}
              </button>
            </div>

            <div className="space-y-3">
              {data.recentTransactions.length === 0 ? (
                <p className="text-sm text-[var(--text-secondary)]">
                  {t('detail.recent_transactions.empty')}
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
                          {transaction.description || t('detail.recent_transactions.fallback_name')}
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
                      {formatDateValue(transaction.occurredAt, locale)}
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
        title={t('detail.delete_modal.title')}
        description={t('detail.delete_modal.description', { name: merchant.name })}
        confirmLabel={deleting ? t('detail.delete_modal.confirm_deleting') : t('detail.delete_modal.confirm')}
        cancelLabel={t('detail.delete_modal.cancel')}
        isDangerous
      />
    </div>
  );
}

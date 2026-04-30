import React, { useMemo, useState } from "react";
import { ChevronRight, Edit2, Plus, Search, Store, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useLocalizedName } from "../utils/localizedName";
import { Card } from "../components/Card";
import { Button } from "../components/Button";
import { ConfirmationModal } from "../components/ConfirmationModals";
import { useAppNavigation } from "../hooks/useAppNavigation";
import { useToast } from "../contexts/ToastContext";
import { useMerchantsList } from "../hooks/useMerchantsList";
import { useMerchantsMeta } from "../hooks/useMerchantsMeta";
import { merchantsService } from "../services/merchantsService";
import type { MerchantItem } from "../types/merchants";

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
  }).format(date);
}

function MerchantCard({
  merchant,
  onView,
  onEdit,
  onDelete,
  onViewTransactions,
}: {
  merchant: MerchantItem;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onViewTransactions: () => void;
}) {
  const { t, i18n } = useTranslation('merchants');
  const localName = useLocalizedName();
  const locale = i18n.language === 'vi' ? 'vi-VN' : 'en-US';

  return (
    <Card
      className="cursor-pointer hover:shadow-[var(--shadow-lg)] transition-shadow"
      onClick={onView}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="w-11 h-11 rounded-[var(--radius-lg)] bg-[var(--surface)] flex items-center justify-center flex-shrink-0">
            <Store className="w-5 h-5 text-[var(--text-secondary)]" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-medium text-[var(--text-primary)] truncate">
                {merchant.name}
              </p>
              {merchant.isHidden && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--surface)] border border-[var(--border)] text-[var(--text-tertiary)]">
                  {t('list.card.badge_hidden')}
                </span>
              )}
            </div>
            <p className="text-xs text-[var(--text-secondary)] mt-1 truncate">
              {merchant.categoryName || t('list.card.no_default_category')}
            </p>
          </div>
        </div>

        <ChevronRight className="w-5 h-5 text-[var(--text-tertiary)] flex-shrink-0" />
      </div>

      <div className="grid grid-cols-3 gap-3 text-center mb-3">
        <div>
          <p className="text-xs text-[var(--text-tertiary)]">{t('list.card.stat_usage')}</p>
          <p className="text-sm font-semibold text-[var(--text-primary)] tabular-nums mt-1">
            {merchant.transactionCount}
          </p>
        </div>
        <div>
          <p className="text-xs text-[var(--text-tertiary)]">{t('list.card.stat_total_spent')}</p>
          <p className="text-sm font-semibold text-[var(--text-primary)] tabular-nums mt-1">
            {formatMoney(merchant.totalSpentMinor)}₫
          </p>
        </div>
        <div>
          <p className="text-xs text-[var(--text-tertiary)]">{t('list.card.stat_last_used')}</p>
          <p className="text-sm font-semibold text-[var(--text-primary)] mt-1">
            {merchant.lastTransactionAt
              ? formatDateValue(merchant.lastTransactionAt, locale)
              : t('list.card.date_never')}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2">
        <button
          onClick={(event) => {
            event.stopPropagation();
            onViewTransactions();
          }}
          className="text-sm font-medium text-[var(--primary)] hover:underline"
        >
          {t('list.card.view_transactions')}
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={(event) => {
              event.stopPropagation();
              onEdit();
            }}
            className="p-2 rounded-[var(--radius-md)] hover:bg-[var(--surface)] transition-colors"
          >
            <Edit2 className="w-4 h-4 text-[var(--text-secondary)]" />
          </button>
          <button
            onClick={(event) => {
              event.stopPropagation();
              onDelete();
            }}
            className="p-2 rounded-[var(--radius-md)] hover:bg-[var(--danger-light)] transition-colors"
          >
            <Trash2 className="w-4 h-4 text-[var(--danger)]" />
          </button>
        </div>
      </div>
    </Card>
  );
}

export default function MerchantsList() {
  const { t } = useTranslation('merchants');
  const localName = useLocalizedName();
  const nav = useAppNavigation();
  const toast = useToast();

  const [searchQuery, setSearchQuery] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [hiddenFilter, setHiddenFilter] = useState<
    "all" | "visible" | "hidden"
  >("visible");
  const [sortBy, setSortBy] = useState<
    "name" | "usage" | "spent" | "recent" | "createdAt"
  >("usage");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [deleteTarget, setDeleteTarget] = useState<MerchantItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const { data: metaData } = useMerchantsMeta();
  const { data, loading, error, reload } = useMerchantsList({
    search: searchQuery.trim() || undefined,
    categoryId: categoryId || undefined,
    hidden: hiddenFilter,
    sortBy,
    sortOrder,
  });

  const summary = useMemo(() => {
    return {
      total: data?.summary.total || 0,
      totalUsage: data?.summary.totalUsage || 0,
      totalSpentMinor: data?.summary.totalSpentMinor || "0",
      noDefaultCategoryCount: data?.summary.noDefaultCategoryCount || 0,
    };
  }, [data]);

  const handleDelete = async () => {
    if (!deleteTarget) return;

    try {
      setDeleting(true);
      await merchantsService.deleteMerchant(deleteTarget.id);
      toast.success(t('list.toast.deleted', { name: deleteTarget.name }));
      setDeleteTarget(null);
      await reload();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : t('list.toast.delete_failed'),
      );
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="max-w-6xl mx-auto p-4 md:p-6 pb-20 md:pb-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
              {t('list.title')}
            </h1>
            <p className="text-sm text-[var(--text-secondary)] mt-1">
              {t('list.subtitle')}
            </p>
          </div>

          <Button onClick={nav.goCreateMerchant}>
            <Plus className="w-4 h-4" />
            {t('list.add_button')}
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <p className="text-sm text-[var(--text-secondary)] mb-1">
              {t('list.summary.total')}
            </p>
            <p className="text-2xl font-semibold text-[var(--text-primary)] tabular-nums">
              {summary.total}
            </p>
          </Card>

          <Card>
            <p className="text-sm text-[var(--text-secondary)] mb-1">
              {t('list.summary.total_usage')}
            </p>
            <p className="text-2xl font-semibold text-[var(--text-primary)] tabular-nums">
              {summary.totalUsage}
            </p>
          </Card>

          <Card>
            <p className="text-sm text-[var(--text-secondary)] mb-1">
              {t('list.summary.total_spent')}
            </p>
            <p className="text-2xl font-semibold text-[var(--text-primary)] tabular-nums">
              {formatMoney(summary.totalSpentMinor)}₫
            </p>
          </Card>

          <Card>
            <p className="text-sm text-[var(--text-secondary)] mb-1">
              {t('list.summary.no_default_category')}
            </p>
            <p className="text-2xl font-semibold text-[var(--text-primary)] tabular-nums">
              {summary.noDefaultCategoryCount}
            </p>
          </Card>
        </div>

        <Card>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            <div className="lg:col-span-2 relative">
              <Search className="w-4 h-4 text-[var(--text-tertiary)] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={t('list.filters.search_placeholder')}
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-[var(--input-background)] border border-[var(--border)] rounded-[var(--radius-lg)]"
              />
            </div>

            <div>
              <select
                value={categoryId}
                onChange={(event) => setCategoryId(event.target.value)}
                className="w-full px-4 py-2.5 bg-[var(--input-background)] border border-[var(--border)] rounded-[var(--radius-lg)]"
              >
                <option value="">{t('list.filters.category_all')}</option>
                {(metaData?.categories || []).map((category) => (
                  <option key={category.id} value={category.id}>
                    {localName(category)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <select
                value={hiddenFilter}
                onChange={(event) =>
                  setHiddenFilter(
                    event.target.value as "all" | "visible" | "hidden",
                  )
                }
                className="w-full px-4 py-2.5 bg-[var(--input-background)] border border-[var(--border)] rounded-[var(--radius-lg)]"
              >
                <option value="visible">{t('list.filters.visibility_visible')}</option>
                <option value="hidden">{t('list.filters.visibility_hidden')}</option>
                <option value="all">{t('list.filters.visibility_all')}</option>
              </select>
            </div>
          </div>

          <div className="mt-4">
            <select
              value={`${sortBy}:${sortOrder}`}
              onChange={(event) => {
                const [nextSortBy, nextSortOrder] = event.target.value.split(
                  ":",
                ) as [
                  "name" | "usage" | "spent" | "recent" | "createdAt",
                  "asc" | "desc",
                ];
                setSortBy(nextSortBy);
                setSortOrder(nextSortOrder);
              }}
              className="w-full md:w-auto px-4 py-2.5 bg-[var(--input-background)] border border-[var(--border)] rounded-[var(--radius-lg)]"
            >
              <option value="usage:desc">{t('list.filters.sort_usage_desc')}</option>
              <option value="spent:desc">{t('list.filters.sort_spent_desc')}</option>
              <option value="recent:desc">{t('list.filters.sort_recent_desc')}</option>
              <option value="name:asc">{t('list.filters.sort_name_asc')}</option>
              <option value="createdAt:desc">{t('list.filters.sort_created_desc')}</option>
            </select>
          </div>
        </Card>

        {loading && (
          <Card>
            <p className="text-sm text-[var(--text-secondary)]">
              {t('list.loading')}
            </p>
          </Card>
        )}

        {!loading && error && (
          <Card>
            <p className="text-sm text-[var(--danger)]">{error}</p>
          </Card>
        )}

        {!loading && !error && (data?.items || []).length === 0 && (
          <Card>
            <div className="text-center py-10">
              <div className="w-14 h-14 rounded-full bg-[var(--surface)] mx-auto flex items-center justify-center mb-4">
                <Store className="w-6 h-6 text-[var(--text-tertiary)]" />
              </div>
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                {t('list.empty.title')}
              </h3>
              <p className="text-sm text-[var(--text-secondary)] mt-2 mb-5">
                {t('list.empty.subtitle')}
              </p>
              <Button onClick={nav.goCreateMerchant}>
                <Plus className="w-4 h-4" />
                {t('list.empty.create_button')}
              </Button>
            </div>
          </Card>
        )}

        {!loading && !error && (data?.items || []).length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {(data?.items || []).map((merchant) => (
              <MerchantCard
                key={merchant.id}
                merchant={merchant}
                onView={() => nav.goMerchantDetail(merchant.id)}
                onEdit={() => nav.goEditMerchant(merchant.id)}
                onDelete={() => setDeleteTarget(merchant)}
                onViewTransactions={() =>
                  nav.goTransactionsByMerchant(merchant.id)
                }
              />
            ))}
          </div>
        )}
      </div>

      <ConfirmationModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => void handleDelete()}
        title={t('list.delete_modal.title')}
        description={t('list.delete_modal.description', { name: deleteTarget?.name || "" })}
        confirmLabel={deleting ? t('list.delete_modal.confirm_deleting') : t('list.delete_modal.confirm')}
        cancelLabel={t('list.delete_modal.cancel')}
        isDangerous
      />
    </div>
  );
}

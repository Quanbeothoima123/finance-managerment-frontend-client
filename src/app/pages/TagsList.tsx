import React, { useMemo, useState } from "react";
import {
  ArrowUpDown,
  Edit2,
  Hash,
  Palette,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Card } from "../components/Card";
import { Button } from "../components/Button";
import { ConfirmationModal } from "../components/ConfirmationModals";
import { useAppNavigation } from "../hooks/useAppNavigation";
import { useToast } from "../contexts/ToastContext";
import { useTagsList } from "../hooks/useTagsList";
import { tagsService } from "../services/tagsService";
import type { TagItem } from "../types/tags";

function ensureColor(color?: string | null) {
  return color || "#64748b";
}

function TagCard({
  tag,
  onEdit,
  onDelete,
  onViewTransactions,
}: {
  tag: TagItem;
  onEdit: () => void;
  onDelete: () => void;
  onViewTransactions: () => void;
}) {
  const { t } = useTranslation("tags-rules");
  const color = ensureColor(tag.colorHex || tag.color);

  return (
    <Card
      className="group cursor-pointer hover:shadow-[var(--shadow-lg)] transition-shadow"
      onClick={onEdit}
    >
      <div
        className="rounded-[var(--radius-lg)] p-4"
        style={{
          backgroundColor: `${color}14`,
          borderLeft: `4px solid ${color}`,
        }}
      >
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-10 h-10 rounded-[var(--radius-lg)] flex items-center justify-center"
              style={{ backgroundColor: `${color}22` }}
            >
              <Hash className="w-5 h-5" style={{ color }} />
            </div>

            <div className="min-w-0">
              <p className="font-medium text-[var(--text-primary)] truncate">
                {tag.name}
              </p>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                {t("tags.list.card.stats", {
                  txnCount: tag.transactionCount,
                  ruleCount: tag.recurringRuleCount,
                })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
            <button
              onClick={(event) => {
                event.stopPropagation();
                onEdit();
              }}
              className="p-2 rounded-[var(--radius-md)] hover:bg-[var(--surface)] transition-colors"
              title={t("tags.list.card.tooltip_edit")}
            >
              <Edit2 className="w-4 h-4 text-[var(--text-secondary)]" />
            </button>

            <button
              onClick={(event) => {
                event.stopPropagation();
                onDelete();
              }}
              className="p-2 rounded-[var(--radius-md)] hover:bg-[var(--danger-light)] transition-colors"
              title={t("tags.list.card.tooltip_delete")}
            >
              <Trash2 className="w-4 h-4 text-[var(--danger)]" />
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3">
          <span
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
            style={{
              backgroundColor: `${color}24`,
              color,
              border: `1px solid ${color}30`,
            }}
          >
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: color }}
            />
            {tag.name}
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onViewTransactions();
              }}
              className="text-xs font-medium text-[var(--primary)] hover:underline"
            >
              {t("tags.list.card.view_transactions")}
            </button>

            <span className="text-sm font-semibold text-[var(--text-primary)] tabular-nums">
              {tag.usageCount}
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}

export default function TagsList() {
  const { t } = useTranslation("tags-rules");
  const nav = useAppNavigation();
  const toast = useToast();

  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"usage" | "name" | "createdAt">("usage");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [deleteTarget, setDeleteTarget] = useState<TagItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const { data, loading, error, reload } = useTagsList({
    search: searchQuery.trim() || undefined,
    sortBy,
    sortOrder,
  });

  const tags = data?.items || [];

  const summary = useMemo(() => {
    return {
      total: data?.summary.total || 0,
      totalUsage: data?.summary.totalUsage || 0,
      avgUsage:
        data?.summary.total && data.summary.total > 0
          ? Math.round(data.summary.totalUsage / data.summary.total)
          : 0,
    };
  }, [data]);

  const handleDelete = async () => {
    if (!deleteTarget) return;

    try {
      setDeleting(true);
      await tagsService.deleteTag(deleteTarget.id);
      toast.success(t("tags.list.toast.deleted", { name: deleteTarget.name }));
      setDeleteTarget(null);
      await reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("tags.list.toast.delete_failed"));
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
              {t("tags.list.title")}
            </h1>
            <p className="text-sm text-[var(--text-secondary)] mt-1">
              {t("tags.list.subtitle")}
            </p>
          </div>

          <Button onClick={nav.goCreateTag}>
            <Plus className="w-4 h-4" />
            {t("tags.list.add_button")}
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <p className="text-sm text-[var(--text-secondary)] mb-1">
              {t("tags.list.summary.total")}
            </p>
            <p className="text-2xl font-semibold text-[var(--text-primary)] tabular-nums">
              {summary.total}
            </p>
          </Card>

          <Card>
            <p className="text-sm text-[var(--text-secondary)] mb-1">
              {t("tags.list.summary.total_usage")}
            </p>
            <p className="text-2xl font-semibold text-[var(--text-primary)] tabular-nums">
              {summary.totalUsage}
            </p>
          </Card>

          <Card>
            <p className="text-sm text-[var(--text-secondary)] mb-1">
              {t("tags.list.summary.avg_usage")}
            </p>
            <p className="text-2xl font-semibold text-[var(--text-primary)] tabular-nums">
              {summary.avgUsage}
            </p>
          </Card>
        </div>

        <Card>
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="w-4 h-4 text-[var(--text-tertiary)] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={t("tags.list.filters.search_placeholder")}
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-[var(--input-background)] border border-[var(--border)] rounded-[var(--radius-lg)]"
              />
            </div>

            <div className="flex gap-3">
              <div className="relative min-w-[180px]">
                <ArrowUpDown className="w-4 h-4 text-[var(--text-tertiary)] absolute left-3 top-1/2 -translate-y-1/2" />
                <select
                  value={`${sortBy}:${sortOrder}`}
                  onChange={(event) => {
                    const [nextSortBy, nextSortOrder] =
                      event.target.value.split(":") as [
                        "usage" | "name" | "createdAt",
                        "asc" | "desc",
                      ];
                    setSortBy(nextSortBy);
                    setSortOrder(nextSortOrder);
                  }}
                  className="w-full pl-10 pr-4 py-2.5 bg-[var(--input-background)] border border-[var(--border)] rounded-[var(--radius-lg)]"
                >
                  <option value="usage:desc">{t("tags.list.filters.sort_usage_desc")}</option>
                  <option value="usage:asc">{t("tags.list.filters.sort_usage_asc")}</option>
                  <option value="name:asc">{t("tags.list.filters.sort_name_asc")}</option>
                  <option value="name:desc">{t("tags.list.filters.sort_name_desc")}</option>
                  <option value="createdAt:desc">{t("tags.list.filters.sort_created_desc")}</option>
                  <option value="createdAt:asc">{t("tags.list.filters.sort_created_asc")}</option>
                </select>
              </div>
            </div>
          </div>
        </Card>

        {loading && (
          <Card>
            <p className="text-sm text-[var(--text-secondary)]">
              {t("tags.list.loading")}
            </p>
          </Card>
        )}

        {!loading && error && (
          <Card>
            <p className="text-sm text-[var(--danger)]">{error}</p>
          </Card>
        )}

        {!loading && !error && tags.length === 0 && (
          <Card>
            <div className="text-center py-10">
              <div className="w-14 h-14 rounded-full bg-[var(--surface)] mx-auto flex items-center justify-center mb-4">
                <Palette className="w-6 h-6 text-[var(--text-tertiary)]" />
              </div>
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                {t("tags.list.empty.title")}
              </h3>
              <p className="text-sm text-[var(--text-secondary)] mt-2 mb-5">
                {t("tags.list.empty.subtitle")}
              </p>
              <Button onClick={nav.goCreateTag}>
                <Plus className="w-4 h-4" />
                {t("tags.list.empty.create_button")}
              </Button>
            </div>
          </Card>
        )}

        {!loading && !error && tags.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {tags.map((tag) => (
              <TagCard
                key={tag.id}
                tag={tag}
                onEdit={() => nav.goEditTag(tag.id)}
                onDelete={() => setDeleteTarget(tag)}
                onViewTransactions={() => nav.goTransactionsByTag(tag.id)}
              />
            ))}
          </div>
        )}
      </div>

      <ConfirmationModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => void handleDelete()}
        title={t("tags.list.delete_modal.title")}
        description={t("tags.list.delete_modal.description", { name: deleteTarget?.name || "" })}
        confirmLabel={deleting ? t("tags.list.delete_modal.confirm_deleting") : t("tags.list.delete_modal.confirm")}
        cancelLabel={t("tags.list.delete_modal.cancel")}
        isDangerous
      />
    </div>
  );
}

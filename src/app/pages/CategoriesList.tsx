import React, { useEffect, useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Edit2,
  Eye,
  EyeOff,
  Folder,
  Home,
  Car,
  Utensils,
  Coffee,
  Shirt,
  Heart,
  Briefcase,
  DollarSign,
  Gift,
  TrendingUp,
  Smartphone,
  Plane,
  Book,
  Music,
  Film,
  Dumbbell,
  PawPrint,
  Baby,
  Wrench,
  Lightbulb,
  Newspaper,
  Package,
  Search,
  Plus,
  Merge,
  Trash2,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useLocalizedName } from "../utils/localizedName";
import { Card } from "../components/Card";
import { Button } from "../components/Button";
import { ConfirmationModal } from "../components/ConfirmationModals";
import { useAppNavigation } from "../hooks/useAppNavigation";
import { useToast } from "../contexts/ToastContext";
import { useCategoriesList } from "../hooks/useCategoriesList";
import { categoriesService } from "../services/categoriesService";
import type {
  CategoryDetailResponse,
  CategoryItem,
  CategoryTreeNode,
} from "../types/categories";

const iconMap: Record<
  string,
  React.ComponentType<{ className?: string; style?: React.CSSProperties }>
> = {
  shopping: Package,
  home: Home,
  car: Car,
  food: Utensils,
  coffee: Coffee,
  shirt: Shirt,
  health: Heart,
  work: Briefcase,
  salary: DollarSign,
  gift: Gift,
  investment: TrendingUp,
  phone: Smartphone,
  travel: Plane,
  education: Book,
  entertainment: Music,
  movie: Film,
  fitness: Dumbbell,
  pet: PawPrint,
  baby: Baby,
  maintenance: Wrench,
  utility: Lightbulb,
  subscription: Newspaper,
  delivery: Package,
};

function getCategoryIcon(iconKey?: string | null) {
  if (!iconKey) return Folder;
  return iconMap[iconKey] || Folder;
}

function formatNumber(value?: number | string | null) {
  return new Intl.NumberFormat("vi-VN").format(Number(value || 0));
}

function CategoryRow({
  category,
  level,
  expandedIds,
  toggleExpanded,
  onEdit,
  onToggleVisibility,
  onOpenMerge,
  onOpenDelete,
  onViewTransactions,
}: {
  category: CategoryTreeNode;
  level: number;
  expandedIds: Set<string>;
  toggleExpanded: (id: string) => void;
  onEdit: (id: string) => void;
  onToggleVisibility: (category: CategoryTreeNode) => void;
  onOpenMerge: (category: CategoryTreeNode) => void;
  onOpenDelete: (category: CategoryTreeNode) => void;
  onViewTransactions: (category: CategoryTreeNode) => void;
}) {
  const { t } = useTranslation('categories');
  const localName = useLocalizedName();
  const Icon = getCategoryIcon(category.iconKey || category.icon);
  const hasChildren = category.children.length > 0;
  const isExpanded = expandedIds.has(category.id);

  return (
    <>
      <div
        className={`rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card)] p-4 ${
          category.isHidden ? "opacity-75" : ""
        }`}
        style={{ marginLeft: `${level * 20}px` }}
      >
        <div className="flex items-start gap-3">
          <button
            type="button"
            disabled={!hasChildren}
            onClick={() => hasChildren && toggleExpanded(category.id)}
            className={`mt-2 flex-shrink-0 ${
              hasChildren
                ? "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                : "text-transparent cursor-default"
            }`}
          >
            {hasChildren ? (
              isExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>

          <div
            className="w-11 h-11 rounded-[var(--radius-lg)] flex items-center justify-center flex-shrink-0"
            style={{
              backgroundColor: `${category.colorHex || "#64748b"}20`,
            }}
          >
            <Icon
              className="w-5 h-5"
              style={{ color: category.colorHex || "#64748b" }}
            />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-medium text-[var(--text-primary)] truncate">
                {localName(category)}
              </p>

              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--surface)] border border-[var(--border)] text-[var(--text-tertiary)]">
                {category.categoryType === 'expense'
                  ? t('list.type_labels.expense')
                  : category.categoryType === 'income'
                    ? t('list.type_labels.income')
                    : t('list.type_labels.both')}
              </span>

              {category.isHidden && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--warning-light)] text-[var(--warning)] border border-[var(--warning)]/20">
                  {t('list.row.badge_hidden')}
                </span>
              )}

              {category.childCount > 0 && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--info-light)] text-[var(--info)] border border-[var(--info)]/20">
                  {t('list.row.badge_children', { count: category.childCount })}
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-[var(--text-secondary)]">
              <span>
                {t('list.row.direct_txns', { count: formatNumber(category.transactionCount) })}
              </span>
              <span>
                {t('list.row.total_txns', { count: formatNumber(category.totalTransactionCount) })}
              </span>
              <span>{t('list.row.usage_count', { count: formatNumber(category.usageCount) })}</span>
            </div>
          </div>

          <div className="flex flex-wrap justify-end gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => onViewTransactions(category)}
            >
              <Search className="w-4 h-4" />
            </Button>

            <Button
              size="sm"
              variant="secondary"
              onClick={() => onEdit(category.id)}
            >
              <Edit2 className="w-4 h-4" />
            </Button>

            <Button
              size="sm"
              variant="secondary"
              onClick={() => onToggleVisibility(category)}
            >
              {category.isHidden ? (
                <Eye className="w-4 h-4" />
              ) : (
                <EyeOff className="w-4 h-4" />
              )}
            </Button>

            <Button
              size="sm"
              variant="secondary"
              onClick={() => onOpenMerge(category)}
            >
              <Merge className="w-4 h-4" />
            </Button>

            <Button
              size="sm"
              variant="danger"
              onClick={() => onOpenDelete(category)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {hasChildren && isExpanded && (
        <div className="space-y-2 mt-2">
          {category.children.map((child) => (
            <CategoryRow
              key={child.id}
              category={child}
              level={level + 1}
              expandedIds={expandedIds}
              toggleExpanded={toggleExpanded}
              onEdit={onEdit}
              onToggleVisibility={onToggleVisibility}
              onOpenMerge={onOpenMerge}
              onOpenDelete={onOpenDelete}
              onViewTransactions={onViewTransactions}
            />
          ))}
        </div>
      )}
    </>
  );
}

export default function CategoriesList() {
  const { t } = useTranslation('categories');
  const nav = useAppNavigation();
  const toast = useToast();

  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<
    "all" | "expense" | "income" | "both"
  >("all");
  const [visibilityFilter, setVisibilityFilter] = useState<
    "all" | "active" | "hidden" | "archived"
  >("all");
  const [sortBy, setSortBy] = useState<
    "sortOrder" | "name" | "usage" | "createdAt"
  >("sortOrder");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const [deleteTarget, setDeleteTarget] = useState<CategoryTreeNode | null>(
    null,
  );
  const [cascadeChildren, setCascadeChildren] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [visibilityTarget, setVisibilityTarget] =
    useState<CategoryTreeNode | null>(null);
  const [togglingVisibility, setTogglingVisibility] = useState(false);

  const [mergeTarget, setMergeTarget] = useState<CategoryTreeNode | null>(null);
  const [mergeDetail, setMergeDetail] = useState<CategoryDetailResponse | null>(
    null,
  );
  const [mergeDestinationId, setMergeDestinationId] = useState("");
  const [loadingMergeDetail, setLoadingMergeDetail] = useState(false);
  const [merging, setMerging] = useState(false);

  const { data, loading, error, reload } = useCategoriesList({
    search: searchQuery.trim() || undefined,
    type: typeFilter,
    visibility: visibilityFilter,
    sortBy,
    sortOrder,
    view: "tree",
  });

  useEffect(() => {
    if (!data?.tree?.length) return;

    setExpandedIds((prev) => {
      if (prev.size > 0) return prev;
      const next = new Set<string>();
      data.tree.forEach((node) => {
        if (node.children.length > 0) {
          next.add(node.id);
        }
      });
      return next;
    });
  }, [data?.tree]);

  const summary = data?.summary;

  const toggleExpanded = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    try {
      setDeleting(true);
      await categoriesService.deleteCategory(deleteTarget.id, cascadeChildren);
      toast.success(t('list.toast.deleted', { name: deleteTarget.name }));
      setDeleteTarget(null);
      setCascadeChildren(false);
      await reload();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : t('list.toast.delete_failed'),
      );
    } finally {
      setDeleting(false);
    }
  };

  const openMerge = async (category: CategoryTreeNode) => {
    try {
      setMergeTarget(category);
      setMergeDestinationId("");
      setMergeDetail(null);
      setLoadingMergeDetail(true);

      const detail = await categoriesService.getCategoryDetail(category.id);
      setMergeDetail(detail);
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : t('list.toast.merge_load_failed'),
      );
      setMergeTarget(null);
    } finally {
      setLoadingMergeDetail(false);
    }
  };

  const handleMerge = async () => {
    if (!mergeTarget || !mergeDestinationId) return;

    try {
      setMerging(true);
      await categoriesService.mergeCategory(mergeTarget.id, {
        targetCategoryId: mergeDestinationId,
        includeChildren: true,
      });

      toast.success(t('list.toast.merged', { name: mergeTarget.name }));
      setMergeTarget(null);
      setMergeDetail(null);
      setMergeDestinationId("");
      await reload();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : t('list.toast.merge_failed'),
      );
    } finally {
      setMerging(false);
    }
  };

  const handleToggleVisibility = async () => {
    if (!visibilityTarget) return;

    try {
      setTogglingVisibility(true);
      await categoriesService.updateVisibility(visibilityTarget.id, {
        hidden: !visibilityTarget.isHidden,
        cascadeChildren: true,
      });

      toast.success(
        visibilityTarget.isHidden
          ? t('list.toast.shown', { name: visibilityTarget.name })
          : t('list.toast.hidden', { name: visibilityTarget.name }),
      );
      setVisibilityTarget(null);
      await reload();
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : t('list.toast.visibility_failed'),
      );
    } finally {
      setTogglingVisibility(false);
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

          <Button onClick={nav.goCreateCategory}>
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
              {summary?.total || 0}
            </p>
          </Card>

          <Card>
            <p className="text-sm text-[var(--text-secondary)] mb-1">
              {t('list.summary.active')}
            </p>
            <p className="text-2xl font-semibold text-[var(--text-primary)] tabular-nums">
              {summary?.activeCount || 0}
            </p>
          </Card>

          <Card>
            <p className="text-sm text-[var(--text-secondary)] mb-1">{t('list.summary.hidden')}</p>
            <p className="text-2xl font-semibold text-[var(--text-primary)] tabular-nums">
              {summary?.hiddenCount || 0}
            </p>
          </Card>

          <Card>
            <p className="text-sm text-[var(--text-secondary)] mb-1">
              {t('list.summary.transactions')}
            </p>
            <p className="text-2xl font-semibold text-[var(--text-primary)] tabular-nums">
              {formatNumber(summary?.totalTransactionCount || 0)}
            </p>
          </Card>
        </div>

        <Card>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <div className="lg:col-span-4 relative">
              <Search className="w-4 h-4 text-[var(--text-tertiary)] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={t('list.filters.search_placeholder')}
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-[var(--input-background)] border border-[var(--border)] rounded-[var(--radius-lg)]"
              />
            </div>

            <div className="lg:col-span-2">
              <select
                value={typeFilter}
                onChange={(event) =>
                  setTypeFilter(
                    event.target.value as "all" | "expense" | "income" | "both",
                  )
                }
                className="w-full px-4 py-2.5 bg-[var(--input-background)] border border-[var(--border)] rounded-[var(--radius-lg)]"
              >
                <option value="all">{t('list.filters.type_all')}</option>
                <option value="expense">{t('list.filters.type_expense')}</option>
                <option value="income">{t('list.filters.type_income')}</option>
                <option value="both">{t('list.filters.type_both')}</option>
              </select>
            </div>

            <div className="lg:col-span-2">
              <select
                value={visibilityFilter}
                onChange={(event) =>
                  setVisibilityFilter(
                    event.target.value as
                      | "all"
                      | "active"
                      | "hidden"
                      | "archived",
                  )
                }
                className="w-full px-4 py-2.5 bg-[var(--input-background)] border border-[var(--border)] rounded-[var(--radius-lg)]"
              >
                <option value="all">{t('list.filters.visibility_all')}</option>
                <option value="active">{t('list.filters.visibility_active')}</option>
                <option value="hidden">{t('list.filters.visibility_hidden')}</option>
                <option value="archived">{t('list.filters.visibility_archived')}</option>
              </select>
            </div>

            <div className="lg:col-span-2">
              <select
                value={sortBy}
                onChange={(event) =>
                  setSortBy(
                    event.target.value as
                      | "sortOrder"
                      | "name"
                      | "usage"
                      | "createdAt",
                  )
                }
                className="w-full px-4 py-2.5 bg-[var(--input-background)] border border-[var(--border)] rounded-[var(--radius-lg)]"
              >
                <option value="sortOrder">{t('list.filters.sort_sort_order')}</option>
                <option value="name">{t('list.filters.sort_name')}</option>
                <option value="usage">{t('list.filters.sort_usage')}</option>
                <option value="createdAt">{t('list.filters.sort_created_at')}</option>
              </select>
            </div>

            <div className="lg:col-span-2">
              <select
                value={sortOrder}
                onChange={(event) =>
                  setSortOrder(event.target.value as "asc" | "desc")
                }
                className="w-full px-4 py-2.5 bg-[var(--input-background)] border border-[var(--border)] rounded-[var(--radius-lg)]"
              >
                <option value="asc">{t('list.filters.order_asc')}</option>
                <option value="desc">{t('list.filters.order_desc')}</option>
              </select>
            </div>
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

        {!loading && !error && (!data?.tree || data.tree.length === 0) && (
          <Card>
            <div className="text-center py-10">
              <div className="w-14 h-14 rounded-full bg-[var(--surface)] mx-auto flex items-center justify-center mb-4">
                <Folder className="w-6 h-6 text-[var(--text-tertiary)]" />
              </div>
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                {t('list.empty.title')}
              </h3>
              <p className="text-sm text-[var(--text-secondary)] mt-2 mb-5">
                {t('list.empty.subtitle')}
              </p>
              <Button onClick={nav.goCreateCategory}>
                <Plus className="w-4 h-4" />
                {t('list.empty.create_button')}
              </Button>
            </div>
          </Card>
        )}

        {!loading && !error && data?.tree && data.tree.length > 0 && (
          <div className="space-y-3">
            {data.tree.map((category) => (
              <CategoryRow
                key={category.id}
                category={category}
                level={0}
                expandedIds={expandedIds}
                toggleExpanded={toggleExpanded}
                onEdit={nav.goEditCategory}
                onToggleVisibility={(item) => setVisibilityTarget(item)}
                onOpenMerge={openMerge}
                onOpenDelete={(item) => {
                  setDeleteTarget(item);
                  setCascadeChildren(false);
                }}
                onViewTransactions={(item) =>
                  nav.goTransactionsByCategory(item.id)
                }
              />
            ))}
          </div>
        )}
      </div>

      <ConfirmationModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => {
          setDeleteTarget(null);
          setCascadeChildren(false);
        }}
        onConfirm={() => void handleDelete()}
        title={t('list.delete_modal.title')}
        description={
          deleteTarget
            ? t('list.delete_modal.description', { name: deleteTarget.name })
            : ""
        }
        confirmLabel={deleting ? t('list.delete_modal.confirm_deleting') : t('list.delete_modal.confirm')}
        cancelLabel={t('list.delete_modal.cancel')}
        isDangerous
      >
        {deleteTarget?.childCount ? (
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={cascadeChildren}
              onChange={(event) => setCascadeChildren(event.target.checked)}
              className="w-4 h-4"
            />
            <span className="text-sm text-[var(--text-primary)]">
              {t('list.delete_modal.cascade_label', { count: deleteTarget.childCount })}
            </span>
          </label>
        ) : null}
      </ConfirmationModal>

      <ConfirmationModal
        isOpen={Boolean(visibilityTarget)}
        onClose={() => setVisibilityTarget(null)}
        onConfirm={() => void handleToggleVisibility()}
        title={visibilityTarget?.isHidden ? t('list.visibility_modal.show_title') : t('list.visibility_modal.hide_title')}
        description={
          visibilityTarget
            ? visibilityTarget.isHidden
              ? t('list.visibility_modal.show_description', { name: visibilityTarget.name })
              : t('list.visibility_modal.hide_description', { name: visibilityTarget.name })
            : ""
        }
        confirmLabel={togglingVisibility ? t('list.visibility_modal.confirm_updating') : t('list.visibility_modal.confirm')}
        cancelLabel={t('list.visibility_modal.cancel')}
      />

      <ConfirmationModal
        isOpen={Boolean(mergeTarget)}
        onClose={() => {
          setMergeTarget(null);
          setMergeDetail(null);
          setMergeDestinationId("");
        }}
        onConfirm={() => void handleMerge()}
        title={t('list.merge_modal.title')}
        description={
          mergeTarget
            ? t('list.merge_modal.description', { name: mergeTarget.name })
            : ""
        }
        confirmLabel={merging ? t('list.merge_modal.confirm_merging') : t('list.merge_modal.confirm')}
        cancelLabel={t('list.merge_modal.cancel')}
        isDangerous={false}
      >
        {loadingMergeDetail ? (
          <p className="text-sm text-[var(--text-secondary)]">
            {t('list.merge_modal.loading_targets')}
          </p>
        ) : (
          <div className="space-y-3">
            <select
              value={mergeDestinationId}
              onChange={(event) => setMergeDestinationId(event.target.value)}
              className="w-full px-4 py-2.5 bg-[var(--input-background)] border border-[var(--border)] rounded-[var(--radius-lg)]"
            >
              <option value="">{t('list.merge_modal.destination_placeholder')}</option>
              {(mergeDetail?.mergeTargets || []).map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} · {item.categoryType === 'expense'
                    ? t('list.type_labels.expense')
                    : item.categoryType === 'income'
                      ? t('list.type_labels.income')
                      : t('list.type_labels.both')}
                </option>
              ))}
            </select>

            {mergeDetail?.children.length ? (
              <p className="text-xs text-[var(--text-tertiary)]">
                {t('list.merge_modal.cascade_note')}
              </p>
            ) : null}
          </div>
        )}
      </ConfirmationModal>
    </div>
  );
}

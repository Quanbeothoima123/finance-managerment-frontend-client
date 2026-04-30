import React, { useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  PiggyBank,
  Plus,
  Search,
  Edit2,
  Trash2,
  Folder,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Card } from "../components/Card";
import { Button } from "../components/Button";
import { DeleteBudgetModal } from "../components/ConfirmationModals";
import { useAppNavigation } from "../hooks/useAppNavigation";
import { useToast } from "../contexts/ToastContext";
import { useBudgetsList } from "../hooks/useBudgetsList";
import { budgetsService } from "../services/budgetsService";
import type { BudgetSummaryItem } from "../types/budgets";

function getCurrentMonthKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function addMonth(monthKey: string, delta: number) {
  const [year, month] = monthKey.split("-").map(Number);
  const next = new Date(year, month - 1 + delta, 1);
  return `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}`;
}

function formatMonthLabel(value: string, locale: string) {
  const [year, month] = value.split("-").map(Number);
  return new Intl.DateTimeFormat(locale, {
    month: "long",
    year: "numeric",
  }).format(new Date(year, month - 1, 1));
}

function formatMoney(value?: string | number | null) {
  return new Intl.NumberFormat("vi-VN").format(Number(value || 0));
}

function getBudgetStatus(item: BudgetSummaryItem) {
  if (item.progressPercent > 100) return "over";
  if (item.progressPercent >= 80) return "warning";
  return "safe";
}

function getStatusStyles(item: BudgetSummaryItem) {
  const status = getBudgetStatus(item);
  if (status === "over") {
    return {
      text: "text-[var(--danger)]",
      bg: "bg-[var(--danger-light)]",
      bar: "var(--danger)",
      Icon: AlertTriangle,
    };
  }
  if (status === "warning") {
    return {
      text: "text-[var(--warning)]",
      bg: "bg-[var(--warning-light)]",
      bar: "var(--warning)",
      Icon: AlertTriangle,
    };
  }
  return {
    text: "text-[var(--success)]",
    bg: "bg-[var(--success-light)]",
    bar: "var(--success)",
    Icon: CheckCircle2,
  };
}

function BudgetCard({
  item,
  onOpen,
  onEdit,
  onDelete,
}: {
  item: BudgetSummaryItem;
  onOpen: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { t } = useTranslation("budgets");
  const previewCategory = item.itemsPreview[0]?.category || null;
  const styles = getStatusStyles(item);
  const Icon = styles.Icon;

  const getStatusText = (item: BudgetSummaryItem) => {
    const status = getBudgetStatus(item);
    return t(`overview.card.status.${status}`);
  };

  return (
    <Card
      className="cursor-pointer hover:shadow-[var(--shadow-md)] transition-all"
      onClick={onOpen}
    >
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-12 h-12 rounded-[var(--radius-lg)] flex items-center justify-center flex-shrink-0"
            style={{
              backgroundColor: `${previewCategory?.colorHex || "#64748b"}20`,
            }}
          >
            <PiggyBank
              className="w-6 h-6"
              style={{ color: previewCategory?.colorHex || "#64748b" }}
            />
          </div>

          <div className="min-w-0">
            <p className="font-semibold text-[var(--text-primary)] truncate">
              {item.name}
            </p>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              {t("overview.item_count", { count: item.itemCount })}
            </p>
          </div>
        </div>

        <div
          className={`px-2.5 py-1 rounded-[var(--radius-md)] text-xs font-semibold ${styles.bg} ${styles.text}`}
        >
          {Math.round(item.progressPercent)}%
        </div>
      </div>

      <div className="mb-3">
        <div className="h-3 bg-[var(--surface)] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${Math.min(item.progressPercent, 100)}%`,
              backgroundColor: styles.bar,
            }}
          />
        </div>
      </div>

      <div className="flex items-center justify-between text-sm mb-3">
        <span className="text-[var(--text-secondary)]">
          <span className="font-semibold text-[var(--text-primary)] tabular-nums">
            {formatMoney(item.spentMinor)}₫
          </span>{" "}
          / {formatMoney(item.totalLimitMinor)}₫
        </span>
        <span className={`text-xs font-medium ${styles.text}`}>
          {getStatusText(item)}
        </span>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-[var(--divider)]">
        <div className="flex items-center gap-2 text-xs text-[var(--text-tertiary)]">
          <Icon className={`w-4 h-4 ${styles.text}`} />
          <span>
            {formatMoney(item.remainingMinor)}₫ {t("overview.remaining_label")}
          </span>
        </div>

        <div className="flex items-center gap-1">
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

export default function BudgetsOverview() {
  const nav = useAppNavigation();
  const toast = useToast();
  const { t, i18n } = useTranslation("budgets");

  const [month, setMonth] = useState(getCurrentMonthKey());
  const [status, setStatus] = useState<
    "all" | "active" | "inactive" | "archived"
  >("active");
  const [sortBy, setSortBy] = useState<
    "startDate" | "createdAt" | "name" | "spent" | "progress"
  >("progress");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [search, setSearch] = useState("");

  const [deleteTarget, setDeleteTarget] = useState<BudgetSummaryItem | null>(
    null,
  );
  const [deleting, setDeleting] = useState(false);

  const { data, loading, error, reload } = useBudgetsList({
    month,
    status,
    sortBy,
    sortOrder,
  });

  const filteredItems = useMemo(() => {
    const items = data?.items || [];
    if (!search.trim()) return items;
    const normalized = search.trim().toLowerCase();
    return items.filter((item) => item.name.toLowerCase().includes(normalized));
  }, [data?.items, search]);

  const stats = useMemo(() => {
    const items = filteredItems;
    return {
      safe: items.filter((item) => getBudgetStatus(item) === "safe").length,
      warning: items.filter((item) => getBudgetStatus(item) === "warning")
        .length,
      over: items.filter((item) => getBudgetStatus(item) === "over").length,
    };
  }, [filteredItems]);

  const handleDelete = async () => {
    if (!deleteTarget) return;

    try {
      setDeleting(true);
      await budgetsService.deleteBudget(deleteTarget.id);
      toast.success(t("overview.delete_modal.success"));
      setDeleteTarget(null);
      await reload();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : t("overview.delete_modal.failed"),
      );
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="max-w-6xl mx-auto p-4 md:p-6 pb-20 md:pb-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMonth(addMonth(month, -1))}
              className="p-2 rounded-[var(--radius-lg)] hover:bg-[var(--surface)] transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-[var(--text-secondary)]" />
            </button>

            <div>
              <h1 className="text-2xl font-semibold text-[var(--text-primary)] capitalize">
                {formatMonthLabel(month, i18n.language)}
              </h1>
              <p className="text-sm text-[var(--text-secondary)] mt-1">
                {t("overview.budget_subtitle")}
              </p>
            </div>

            <button
              onClick={() => setMonth(addMonth(month, 1))}
              className="p-2 rounded-[var(--radius-lg)] hover:bg-[var(--surface)] transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-[var(--text-secondary)]" />
            </button>
          </div>

          <Button onClick={nav.goCreateBudget}>
            <Plus className="w-4 h-4" />
            {t("overview.create_button")}
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <p className="text-sm text-[var(--text-secondary)] mb-1">
              {t("overview.total_budget")}
            </p>
            <p className="text-2xl font-semibold text-[var(--text-primary)] tabular-nums">
              {formatMoney(data?.summary.totalLimitMinor || 0)}₫
            </p>
          </Card>

          <Card>
            <p className="text-sm text-[var(--text-secondary)] mb-1">
              {t("overview.spent")}
            </p>
            <p className="text-2xl font-semibold text-[var(--text-primary)] tabular-nums">
              {formatMoney(data?.summary.spentMinor || 0)}₫
            </p>
          </Card>

          <Card>
            <p className="text-sm text-[var(--text-secondary)] mb-1">
              {t("overview.remaining")}
            </p>
            <p className="text-2xl font-semibold text-[var(--text-primary)] tabular-nums">
              {formatMoney(data?.summary.remainingMinor || 0)}₫
            </p>
          </Card>

          <Card>
            <p className="text-sm text-[var(--text-secondary)] mb-1">
              {t("overview.status_label")}
            </p>
            <div className="flex items-center gap-3 mt-2 text-sm">
              <span className="text-[var(--success)] font-medium">
                {t("overview.stats.safe", { count: stats.safe })}
              </span>
              <span className="text-[var(--warning)] font-medium">
                {t("overview.stats.warning", { count: stats.warning })}
              </span>
              <span className="text-[var(--danger)] font-medium">
                {t("overview.stats.over", { count: stats.over })}
              </span>
            </div>
          </Card>
        </div>

        <Card>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <div className="lg:col-span-4 relative">
              <Search className="w-4 h-4 text-[var(--text-tertiary)] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={t("overview.search_placeholder")}
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-[var(--input-background)] border border-[var(--border)] rounded-[var(--radius-lg)]"
              />
            </div>

            <div className="lg:col-span-3">
              <select
                value={status}
                onChange={(event) =>
                  setStatus(
                    event.target.value as
                      | "all"
                      | "active"
                      | "inactive"
                      | "archived",
                  )
                }
                className="w-full px-4 py-2.5 bg-[var(--input-background)] border border-[var(--border)] rounded-[var(--radius-lg)]"
              >
                <option value="active">
                  {t("overview.status_filter.active")}
                </option>
                <option value="inactive">
                  {t("overview.status_filter.inactive")}
                </option>
                <option value="archived">
                  {t("overview.status_filter.archived")}
                </option>
                <option value="all">{t("overview.status_filter.all")}</option>
              </select>
            </div>

            <div className="lg:col-span-3">
              <select
                value={sortBy}
                onChange={(event) =>
                  setSortBy(
                    event.target.value as
                      | "startDate"
                      | "createdAt"
                      | "name"
                      | "spent"
                      | "progress",
                  )
                }
                className="w-full px-4 py-2.5 bg-[var(--input-background)] border border-[var(--border)] rounded-[var(--radius-lg)]"
              >
                <option value="progress">
                  {t("overview.sort.by_progress")}
                </option>
                <option value="spent">{t("overview.sort.by_spent")}</option>
                <option value="name">{t("overview.sort.by_name")}</option>
                <option value="startDate">
                  {t("overview.sort.by_date_start")}
                </option>
                <option value="createdAt">
                  {t("overview.sort.by_date_created")}
                </option>
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
                <option value="desc">{t("overview.sort.desc")}</option>
                <option value="asc">{t("overview.sort.asc")}</option>
              </select>
            </div>
          </div>
        </Card>

        {loading && (
          <Card>
            <p className="text-sm text-[var(--text-secondary)]">
              {t("overview.loading")}
            </p>
          </Card>
        )}

        {!loading && error && (
          <Card>
            <p className="text-sm text-[var(--danger)]">{error}</p>
          </Card>
        )}

        {!loading && !error && filteredItems.length === 0 && (
          <Card>
            <div className="text-center py-10">
              <div className="w-14 h-14 rounded-full bg-[var(--surface)] mx-auto flex items-center justify-center mb-4">
                <PiggyBank className="w-6 h-6 text-[var(--text-tertiary)]" />
              </div>
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                {t("overview.empty.title")}
              </h3>
              <p className="text-sm text-[var(--text-secondary)] mt-2 mb-5">
                {t("overview.empty.description")}
              </p>
              <Button onClick={nav.goCreateBudget}>
                <Plus className="w-4 h-4" />
                {t("overview.empty.create_button")}
              </Button>
            </div>
          </Card>
        )}

        {!loading && !error && filteredItems.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredItems.map((item) => (
              <BudgetCard
                key={item.id}
                item={item}
                onOpen={() => nav.goBudgetDetail(item.id)}
                onEdit={() => nav.goEditBudget(item.id)}
                onDelete={() => setDeleteTarget(item)}
              />
            ))}
          </div>
        )}
      </div>

      <DeleteBudgetModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => void handleDelete()}
        budgetName={deleteTarget?.name}
      />
    </div>
  );
}

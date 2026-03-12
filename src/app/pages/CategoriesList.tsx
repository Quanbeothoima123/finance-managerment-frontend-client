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

function getTypeLabel(type: string) {
  if (type === "expense") return "Chi tiêu";
  if (type === "income") return "Thu nhập";
  return "Cả hai";
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
}: {
  category: CategoryTreeNode;
  level: number;
  expandedIds: Set<string>;
  toggleExpanded: (id: string) => void;
  onEdit: (id: string) => void;
  onToggleVisibility: (category: CategoryTreeNode) => void;
  onOpenMerge: (category: CategoryTreeNode) => void;
  onOpenDelete: (category: CategoryTreeNode) => void;
}) {
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
                {category.name}
              </p>

              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--surface)] border border-[var(--border)] text-[var(--text-tertiary)]">
                {getTypeLabel(category.categoryType)}
              </span>

              {category.isHidden && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--warning-light)] text-[var(--warning)] border border-[var(--warning)]/20">
                  Đã ẩn
                </span>
              )}

              {category.childCount > 0 && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--info-light)] text-[var(--info)] border border-[var(--info)]/20">
                  {category.childCount} mục con
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-[var(--text-secondary)]">
              <span>
                {formatNumber(category.transactionCount)} giao dịch trực tiếp
              </span>
              <span>
                {formatNumber(category.totalTransactionCount)} giao dịch toàn
                cây
              </span>
              <span>{formatNumber(category.usageCount)} liên kết</span>
            </div>
          </div>

          <div className="flex flex-wrap justify-end gap-2">
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
            />
          ))}
        </div>
      )}
    </>
  );
}

export default function CategoriesList() {
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
      toast.success(`Đã xoá danh mục "${deleteTarget.name}"`);
      setDeleteTarget(null);
      setCascadeChildren(false);
      await reload();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Không thể xoá danh mục",
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
          : "Không thể tải dữ liệu gộp danh mục",
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

      toast.success(`Đã gộp danh mục "${mergeTarget.name}"`);
      setMergeTarget(null);
      setMergeDetail(null);
      setMergeDestinationId("");
      await reload();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Không thể gộp danh mục",
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
          ? `Đã hiện danh mục "${visibilityTarget.name}"`
          : `Đã ẩn danh mục "${visibilityTarget.name}"`,
      );
      setVisibilityTarget(null);
      await reload();
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Không thể cập nhật trạng thái danh mục",
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
              Danh mục
            </h1>
            <p className="text-sm text-[var(--text-secondary)] mt-1">
              Quản lý cây danh mục, trạng thái hiển thị và gộp danh mục bằng dữ
              liệu thật từ backend.
            </p>
          </div>

          <Button onClick={nav.goCreateCategory}>
            <Plus className="w-4 h-4" />
            Thêm danh mục
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <p className="text-sm text-[var(--text-secondary)] mb-1">
              Tổng danh mục
            </p>
            <p className="text-2xl font-semibold text-[var(--text-primary)] tabular-nums">
              {summary?.total || 0}
            </p>
          </Card>

          <Card>
            <p className="text-sm text-[var(--text-secondary)] mb-1">
              Đang hiển thị
            </p>
            <p className="text-2xl font-semibold text-[var(--text-primary)] tabular-nums">
              {summary?.activeCount || 0}
            </p>
          </Card>

          <Card>
            <p className="text-sm text-[var(--text-secondary)] mb-1">Đã ẩn</p>
            <p className="text-2xl font-semibold text-[var(--text-primary)] tabular-nums">
              {summary?.hiddenCount || 0}
            </p>
          </Card>

          <Card>
            <p className="text-sm text-[var(--text-secondary)] mb-1">
              Giao dịch
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
                placeholder="Tìm theo tên danh mục..."
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
                <option value="all">Tất cả loại</option>
                <option value="expense">Chi tiêu</option>
                <option value="income">Thu nhập</option>
                <option value="both">Cả hai</option>
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
                <option value="all">Tất cả trạng thái</option>
                <option value="active">Đang hiển thị</option>
                <option value="hidden">Đã ẩn</option>
                <option value="archived">Đã lưu trữ</option>
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
                <option value="sortOrder">Theo thứ tự</option>
                <option value="name">Theo tên</option>
                <option value="usage">Theo usage</option>
                <option value="createdAt">Theo ngày tạo</option>
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
                <option value="asc">Tăng dần</option>
                <option value="desc">Giảm dần</option>
              </select>
            </div>
          </div>
        </Card>

        {loading && (
          <Card>
            <p className="text-sm text-[var(--text-secondary)]">
              Đang tải danh sách danh mục...
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
                Chưa có danh mục nào
              </h3>
              <p className="text-sm text-[var(--text-secondary)] mt-2 mb-5">
                Tạo danh mục đầu tiên để bắt đầu phân loại giao dịch.
              </p>
              <Button onClick={nav.goCreateCategory}>
                <Plus className="w-4 h-4" />
                Tạo danh mục
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
        title="Xoá danh mục?"
        description={
          deleteTarget
            ? `Bạn có chắc muốn xoá danh mục "${deleteTarget.name}"?`
            : ""
        }
        confirmLabel={deleting ? "Đang xoá..." : "Xoá"}
        cancelLabel="Huỷ"
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
              Xoá kèm {deleteTarget.childCount} danh mục con
            </span>
          </label>
        ) : null}
      </ConfirmationModal>

      <ConfirmationModal
        isOpen={Boolean(visibilityTarget)}
        onClose={() => setVisibilityTarget(null)}
        onConfirm={() => void handleToggleVisibility()}
        title={visibilityTarget?.isHidden ? "Hiện danh mục?" : "Ẩn danh mục?"}
        description={
          visibilityTarget
            ? visibilityTarget.isHidden
              ? `Bạn có chắc muốn hiện lại "${visibilityTarget.name}"?`
              : `Bạn có chắc muốn ẩn "${visibilityTarget.name}"?`
            : ""
        }
        confirmLabel={togglingVisibility ? "Đang cập nhật..." : "Xác nhận"}
        cancelLabel="Huỷ"
      />

      <ConfirmationModal
        isOpen={Boolean(mergeTarget)}
        onClose={() => {
          setMergeTarget(null);
          setMergeDetail(null);
          setMergeDestinationId("");
        }}
        onConfirm={() => void handleMerge()}
        title="Gộp danh mục"
        description={
          mergeTarget
            ? `Chọn danh mục đích để gộp "${mergeTarget.name}" vào.`
            : ""
        }
        confirmLabel={merging ? "Đang gộp..." : "Gộp"}
        cancelLabel="Huỷ"
        isDangerous={false}
      >
        {loadingMergeDetail ? (
          <p className="text-sm text-[var(--text-secondary)]">
            Đang tải danh sách danh mục đích...
          </p>
        ) : (
          <div className="space-y-3">
            <select
              value={mergeDestinationId}
              onChange={(event) => setMergeDestinationId(event.target.value)}
              className="w-full px-4 py-2.5 bg-[var(--input-background)] border border-[var(--border)] rounded-[var(--radius-lg)]"
            >
              <option value="">Chọn danh mục đích</option>
              {(mergeDetail?.mergeTargets || []).map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} · {getTypeLabel(item.categoryType)}
                </option>
              ))}
            </select>

            {mergeDetail?.children.length ? (
              <p className="text-xs text-[var(--text-tertiary)]">
                Hệ thống sẽ gộp cả danh mục con của mục nguồn.
              </p>
            ) : null}
          </div>
        )}
      </ConfirmationModal>
    </div>
  );
}

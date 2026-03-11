import React, { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import {
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpRight,
  Calendar,
  Copy,
  Edit2,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { ConfirmationModal } from "../components/ConfirmationModals";
import { TagChip } from "../components/TagChip";
import { useToast } from "../contexts/ToastContext";
import { useTransactionsList } from "../hooks/useTransactionsList";
import { useTransactionsMeta } from "../hooks/useTransactionsMeta";
import { transactionsService } from "../services/transactionsService";
import type {
  TransactionListItem,
  TransactionType,
} from "../types/transactions";

const FILTER_OPTIONS: Array<{ value: "all" | TransactionType; label: string }> =
  [
    { value: "all", label: "Tất cả" },
    { value: "income", label: "Thu nhập" },
    { value: "expense", label: "Chi tiêu" },
    { value: "transfer", label: "Chuyển tiền" },
  ];

function formatMoney(value?: string | number | null) {
  return new Intl.NumberFormat("vi-VN").format(Number(value || 0));
}

function formatDateLabel(dateString: string) {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return "Hôm nay";
  if (date.toDateString() === yesterday.toDateString()) return "Hôm qua";

  return new Intl.DateTimeFormat("vi-VN", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function formatSubDate(dateString: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
  }).format(new Date(dateString));
}

function getTransactionIcon(type: string) {
  if (type === "income")
    return <ArrowUpRight className="w-5 h-5 text-[var(--success)]" />;
  if (type === "expense")
    return <ArrowDownLeft className="w-5 h-5 text-[var(--danger)]" />;
  return <ArrowLeftRight className="w-5 h-5 text-[var(--info)]" />;
}

function getTransactionAmountColor(type: string) {
  if (type === "income") return "text-[var(--success)]";
  if (type === "expense") return "text-[var(--danger)]";
  return "text-[var(--info)]";
}

function getSignedDisplay(item: TransactionListItem) {
  const signed = Number(item.signedAmountMinor || 0);
  if (item.txnType === "income") return `+${formatMoney(Math.abs(signed))}`;
  if (item.txnType === "expense") return `-${formatMoney(Math.abs(signed))}`;
  return `${formatMoney(Math.abs(Number(item.totalAmountMinor || 0)))}`;
}

export default function TransactionsList() {
  const navigate = useNavigate();
  const toast = useToast();
  const [searchParams] = useSearchParams();

  const initialType =
    (searchParams.get("type") as "all" | TransactionType | null) || "all";

  const [search, setSearch] = useState("");
  const [type, setType] = useState<"all" | TransactionType>(initialType);
  const [accountId, setAccountId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [tagMode, setTagMode] = useState<"and" | "or">("or");
  const [sortBy, setSortBy] = useState<"date" | "amount" | "createdAt">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<TransactionListItem | null>(
    null,
  );
  const [deleting, setDeleting] = useState(false);

  const { data: metaData, loading: metaLoading } = useTransactionsMeta();

  const query = useMemo(
    () => ({
      page,
      limit: 20,
      type: type === "all" ? undefined : type,
      accountId: accountId || undefined,
      categoryId: categoryId || undefined,
      tagIds: selectedTagIds.length ? selectedTagIds : undefined,
      tagMode,
      search: search.trim() || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      sortBy,
      sortOrder,
    }),
    [
      page,
      type,
      accountId,
      categoryId,
      selectedTagIds,
      tagMode,
      search,
      startDate,
      endDate,
      sortBy,
      sortOrder,
    ],
  );

  const { data, loading, error, reload } = useTransactionsList(query);

  const groupedItems = useMemo(() => {
    const groups: Record<string, TransactionListItem[]> = {};

    (data?.items || []).forEach((item) => {
      const key = item.date || item.occurredAt.slice(0, 10);
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
    });

    return Object.entries(groups);
  }, [data?.items]);

  const totals = useMemo(() => {
    return (data?.items || []).reduce(
      (accumulator, item) => {
        if (item.txnType === "income") {
          accumulator.income += Number(item.totalAmountMinor || 0);
        }
        if (item.txnType === "expense") {
          accumulator.expense += Number(item.totalAmountMinor || 0);
        }
        return accumulator;
      },
      { income: 0, expense: 0 },
    );
  }, [data?.items]);

  const handleResetFilters = () => {
    setSearch("");
    setType("all");
    setAccountId("");
    setCategoryId("");
    setSelectedTagIds([]);
    setTagMode("or");
    setSortBy("date");
    setSortOrder("desc");
    setStartDate("");
    setEndDate("");
    setPage(1);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    try {
      setDeleting(true);
      await transactionsService.deleteTransaction(deleteTarget.id);
      toast.success("Đã xoá giao dịch");
      setDeleteTarget(null);
      await reload();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Không thể xoá giao dịch",
      );
    } finally {
      setDeleting(false);
    }
  };

  const goEdit = (item: TransactionListItem) => {
    if (item.txnType === "transfer") {
      navigate(`/transfer/create?editId=${item.id}`);
      return;
    }

    navigate(`/transactions/${item.id}/edit`);
  };

  const goDuplicate = (item: TransactionListItem) => {
    if (item.txnType === "transfer") {
      navigate(`/transfer/create?duplicateFrom=${item.id}`);
      return;
    }

    navigate(`/transactions/create?duplicateFrom=${item.id}`);
  };

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
              Giao dịch
            </h1>
            <p className="text-sm text-[var(--text-secondary)] mt-1">
              Quản lý danh sách giao dịch, lọc theo tài khoản, danh mục và thẻ.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              variant="secondary"
              onClick={() => navigate("/transfer/create")}
            >
              <ArrowLeftRight className="w-4 h-4" />
              Chuyển tiền
            </Button>
            <Button onClick={() => navigate("/transactions/create")}>
              <Plus className="w-4 h-4" />
              Thêm giao dịch
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <p className="text-sm text-[var(--text-secondary)]">Tổng thu</p>
            <p className="mt-2 text-2xl font-semibold text-[var(--success)] tabular-nums">
              +{formatMoney(totals.income)} ₫
            </p>
          </Card>
          <Card>
            <p className="text-sm text-[var(--text-secondary)]">Tổng chi</p>
            <p className="mt-2 text-2xl font-semibold text-[var(--danger)] tabular-nums">
              -{formatMoney(totals.expense)} ₫
            </p>
          </Card>
          <Card>
            <p className="text-sm text-[var(--text-secondary)]">Số lượng</p>
            <p className="mt-2 text-2xl font-semibold text-[var(--text-primary)] tabular-nums">
              {data?.pagination.total || 0}
            </p>
          </Card>
        </div>

        <Card>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <div className="lg:col-span-4">
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                Tìm kiếm
              </label>
              <div className="flex items-center gap-2 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--input-background)] px-3 py-2.5">
                <Search className="w-4 h-4 text-[var(--text-tertiary)]" />
                <input
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value);
                    setPage(1);
                  }}
                  placeholder="Mô tả, merchant, tài khoản..."
                  className="w-full bg-transparent outline-none text-sm text-[var(--text-primary)]"
                />
              </div>
            </div>

            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                Tài khoản
              </label>
              <select
                value={accountId}
                onChange={(event) => {
                  setAccountId(event.target.value);
                  setPage(1);
                }}
                className="w-full px-4 py-2.5 bg-[var(--input-background)] border border-[var(--border)] rounded-[var(--radius-lg)]"
              >
                <option value="">Tất cả</option>
                {(metaData?.accounts || []).map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                Danh mục
              </label>
              <select
                value={categoryId}
                onChange={(event) => {
                  setCategoryId(event.target.value);
                  setPage(1);
                }}
                className="w-full px-4 py-2.5 bg-[var(--input-background)] border border-[var(--border)] rounded-[var(--radius-lg)]"
              >
                <option value="">Tất cả</option>
                {(metaData?.categories || []).map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                Sắp xếp
              </label>
              <select
                value={`${sortBy}:${sortOrder}`}
                onChange={(event) => {
                  const [nextSortBy, nextSortOrder] = event.target.value.split(
                    ":",
                  ) as ["date" | "amount" | "createdAt", "asc" | "desc"];
                  setSortBy(nextSortBy);
                  setSortOrder(nextSortOrder);
                  setPage(1);
                }}
                className="w-full px-4 py-2.5 bg-[var(--input-background)] border border-[var(--border)] rounded-[var(--radius-lg)]"
              >
                <option value="date:desc">Mới nhất</option>
                <option value="date:asc">Cũ nhất</option>
                <option value="amount:desc">Số tiền giảm dần</option>
                <option value="amount:asc">Số tiền tăng dần</option>
              </select>
            </div>

            <div className="lg:col-span-2 flex items-end">
              <Button
                variant="secondary"
                className="w-full"
                onClick={handleResetFilters}
              >
                Đặt lại lọc
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                Từ ngày
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-[var(--text-tertiary)] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="date"
                  value={startDate}
                  onChange={(event) => {
                    setStartDate(event.target.value);
                    setPage(1);
                  }}
                  className="w-full pl-10 pr-4 py-2.5 bg-[var(--input-background)] border border-[var(--border)] rounded-[var(--radius-lg)]"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                Đến ngày
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-[var(--text-tertiary)] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="date"
                  value={endDate}
                  onChange={(event) => {
                    setEndDate(event.target.value);
                    setPage(1);
                  }}
                  className="w-full pl-10 pr-4 py-2.5 bg-[var(--input-background)] border border-[var(--border)] rounded-[var(--radius-lg)]"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mt-4">
            {FILTER_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  setType(option.value);
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                  type === option.value
                    ? "bg-[var(--primary)] text-white border-[var(--primary)]"
                    : "bg-[var(--surface)] text-[var(--text-secondary)] border-[var(--border)] hover:bg-[var(--surface-elevated)]"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          {!!metaData?.tags.length && (
            <div className="mt-4">
              <div className="flex items-center justify-between gap-3 mb-2">
                <p className="text-sm font-medium text-[var(--text-primary)]">
                  Lọc theo thẻ
                </p>
                <button
                  onClick={() =>
                    setTagMode((prev) => (prev === "or" ? "and" : "or"))
                  }
                  className="text-xs px-2 py-1 rounded-full border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--surface)]"
                >
                  Chế độ: {tagMode === "or" ? "OR" : "AND"}
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {metaData.tags.map((tag) => {
                  const active = selectedTagIds.includes(tag.id);
                  return (
                    <button
                      key={tag.id}
                      onClick={() => {
                        setSelectedTagIds((prev) =>
                          prev.includes(tag.id)
                            ? prev.filter((item) => item !== tag.id)
                            : [...prev, tag.id],
                        );
                        setPage(1);
                      }}
                      className={`transition-transform ${active ? "scale-[1.02]" : ""}`}
                    >
                      <TagChip
                        name={tag.name}
                        color={tag.colorHex || "#64748b"}
                        className={
                          active ? "ring-2 ring-[var(--primary)]/25" : ""
                        }
                      />
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </Card>

        {(loading || metaLoading) && (
          <Card>
            <p className="text-sm text-[var(--text-secondary)]">
              Đang tải dữ liệu giao dịch...
            </p>
          </Card>
        )}

        {error && !loading && (
          <Card>
            <p className="text-sm text-[var(--danger)]">{error}</p>
          </Card>
        )}

        {!loading && !error && groupedItems.length === 0 && (
          <Card>
            <p className="text-sm text-[var(--text-secondary)] text-center py-8">
              Không có giao dịch nào phù hợp với bộ lọc hiện tại.
            </p>
          </Card>
        )}

        {!loading && !error && groupedItems.length > 0 && (
          <div className="space-y-6">
            {groupedItems.map(([dateKey, items]) => (
              <div key={dateKey} className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
                    {formatDateLabel(dateKey)}
                  </h2>
                  <span className="text-xs text-[var(--text-tertiary)]">
                    {items.length} giao dịch
                  </span>
                </div>

                <div className="space-y-2">
                  {items.map((item) => (
                    <Card key={item.id} className="p-4">
                      <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                        <button
                          onClick={() => navigate(`/transactions/${item.id}`)}
                          className="flex items-start gap-3 flex-1 text-left"
                        >
                          <div className="w-11 h-11 rounded-full bg-[var(--surface-elevated)] flex items-center justify-center flex-shrink-0">
                            {getTransactionIcon(item.txnType)}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-medium text-[var(--text-primary)] truncate">
                                {item.description ||
                                  item.category?.name ||
                                  "Giao dịch"}
                              </p>
                              {item.isSplit && (
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--info-light)] text-[var(--info)] border border-[var(--info)]/20">
                                  Split {item.splitCount}
                                </span>
                              )}
                            </div>

                            <p className="text-sm text-[var(--text-secondary)] mt-1 truncate">
                              {[
                                item.account?.name,
                                item.toAccount?.name
                                  ? `→ ${item.toAccount.name}`
                                  : null,
                                item.category?.name,
                                item.merchant?.name,
                              ]
                                .filter(Boolean)
                                .join(" • ")}
                            </p>

                            <p className="text-xs text-[var(--text-tertiary)] mt-1">
                              {formatSubDate(item.occurredAt)}
                            </p>

                            {!!item.tags.length && (
                              <div className="flex flex-wrap gap-2 mt-2">
                                {item.tags.map((tag) => (
                                  <TagChip
                                    key={tag.id}
                                    name={tag.name}
                                    color={tag.colorHex || "#64748b"}
                                  />
                                ))}
                              </div>
                            )}
                          </div>
                        </button>

                        <div className="flex items-center gap-3 lg:gap-2 lg:flex-col lg:items-end">
                          <div
                            className={`text-lg font-semibold tabular-nums ${getTransactionAmountColor(item.txnType)}`}
                          >
                            {getSignedDisplay(item)} ₫
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => goDuplicate(item)}
                            >
                              <Copy className="w-4 h-4" />
                              Nhân bản
                            </Button>
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => goEdit(item)}
                            >
                              <Edit2 className="w-4 h-4" />
                              Sửa
                            </Button>
                            <Button
                              size="sm"
                              variant="danger"
                              onClick={() => setDeleteTarget(item)}
                            >
                              <Trash2 className="w-4 h-4" />
                              Xoá
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {!!data && data.pagination.totalPages > 1 && (
          <Card className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-sm text-[var(--text-secondary)]">
              Trang {data.pagination.page} / {data.pagination.totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                disabled={data.pagination.page <= 1}
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              >
                Trang trước
              </Button>
              <Button
                variant="secondary"
                disabled={data.pagination.page >= data.pagination.totalPages}
                onClick={() =>
                  setPage((prev) =>
                    Math.min(data.pagination.totalPages, prev + 1),
                  )
                }
              >
                Trang sau
              </Button>
            </div>
          </Card>
        )}
      </div>

      <ConfirmationModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => void handleDelete()}
        title="Xoá giao dịch?"
        description={`Bạn có chắc muốn xoá "${deleteTarget?.description || "giao dịch này"}"? Hành động này không thể hoàn tác.`}
        confirmLabel={deleting ? "Đang xoá..." : "Xoá"}
        cancelLabel="Huỷ"
        isDangerous
      />
    </div>
  );
}

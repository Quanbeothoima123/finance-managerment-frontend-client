import React, { useState, useMemo } from "react";
import {
  Search,
  Filter,
  X,
  Cloud,
  Crown,
  Paperclip,
  FileText,
  Image as ImageIcon,
  ExternalLink,
  Download,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  Calendar,
  Files,
  Loader2,
} from "lucide-react";
import { useTransactionsList } from "../hooks/useTransactionsList";
import { useAccountsOverview } from "../hooks/useAccountsOverview";
import { useAppNavigation } from "../hooks/useAppNavigation";
import { Button } from "../components/Button";
import { useTranslation } from "react-i18next";

interface GalleryItem {
  imageUrl: string;
  transactionId: string;
  transactionDescription: string;
  transactionDate: string;
  transactionAmount: number;
  transactionType: string;
  transactionCategory: string;
  transactionAccount: string;
}

type QuickFilter = "all" | "image";

const minor = (s: string | null | undefined) => parseInt(s || "0", 10) || 0;

export default function AttachmentLibrary() {
  const { data: txnData, loading: txnLoading } = useTransactionsList({
    limit: 100,
  });
  const { data: accData, loading: accLoading } = useAccountsOverview();
  const { goTransactionDetail, goCreateTransaction } = useAppNavigation();
  const { t } = useTranslation("settings");
  const loading = txnLoading || accLoading;

  // State
  const [searchQuery, setSearchQuery] = useState("");
  const [quickFilter, setQuickFilter] = useState<QuickFilter>("all");
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [lightboxState, setLightboxState] = useState<{
    items: GalleryItem[];
    index: number;
  } | null>(null);

  // Advanced filters
  const [filterDateStart, setFilterDateStart] = useState("");
  const [filterDateEnd, setFilterDateEnd] = useState("");
  const [filterAccounts, setFilterAccounts] = useState<string[]>([]);

  const transactions = txnData?.items ?? [];

  // Aggregate all attachments from transactions that have imageUrl
  const allItems: GalleryItem[] = useMemo(() => {
    const items: GalleryItem[] = [];
    transactions.forEach((txn: any) => {
      if (txn.imageUrl) {
        items.push({
          imageUrl: txn.imageUrl,
          transactionId: txn.id,
          transactionDescription: txn.description || "",
          transactionDate: txn.date || txn.occurredAt?.split("T")[0] || "",
          transactionAmount: minor(txn.totalAmountMinor),
          transactionType: txn.type,
          transactionCategory: txn.category?.name || "",
          transactionAccount: txn.account?.name || "",
        });
      }
    });
    // Sort by date descending
    items.sort((a, b) => b.transactionDate.localeCompare(a.transactionDate));
    return items;
  }, [transactions]);

  // Apply filters
  const filteredItems = useMemo(() => {
    return allItems.filter((item) => {
      // Search
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchTxn = item.transactionDescription.toLowerCase().includes(q);
        const matchCat = item.transactionCategory.toLowerCase().includes(q);
        if (!matchTxn && !matchCat) return false;
      }

      // Advanced: date range
      if (filterDateStart && item.transactionDate < filterDateStart)
        return false;
      if (filterDateEnd && item.transactionDate > filterDateEnd) return false;

      // Advanced: accounts
      if (
        filterAccounts.length > 0 &&
        !filterAccounts.includes(item.transactionAccount)
      )
        return false;

      return true;
    });
  }, [allItems, searchQuery, filterDateStart, filterDateEnd, filterAccounts]);

  // Group by month
  const groupedByMonth = useMemo(() => {
    const groups: Record<string, GalleryItem[]> = {};
    filteredItems.forEach((item) => {
      const monthKey = item.transactionDate.substring(0, 7); // "2026-03"
      if (!groups[monthKey]) groups[monthKey] = [];
      groups[monthKey].push(item);
    });
    // Sort months descending
    return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
  }, [filteredItems]);

  // Stats
  const imageCount = allItems.length;

  const formatMonthHeader = (monthKey: string) => {
    const [year, month] = monthKey.split("-");
    return t("attachments.month.header", {
      month: parseInt(month, 10).toString().padStart(2, "0"),
      year,
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatTotalSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const hasAdvancedFilters =
    filterDateStart || filterDateEnd || filterAccounts.length > 0;

  const clearAdvancedFilters = () => {
    setFilterDateStart("");
    setFilterDateEnd("");
    setFilterAccounts([]);
  };

  const openLightbox = (item: GalleryItem, allVisible: GalleryItem[]) => {
    const idx = allVisible.indexOf(item);
    setLightboxState({ items: allVisible, index: idx >= 0 ? idx : 0 });
  };

  // Quick filter chips config
  const quickFilters: { key: QuickFilter; label: string; show: boolean }[] = [
    { key: "all", label: t("attachments.filters.type_all"), show: true },
    { key: "image", label: t("attachments.filters.type_image"), show: true },
  ];

  // Unique accounts that have attachments
  const accountsWithAttachments = useMemo(() => {
    const set = new Set(allItems.map((i) => i.transactionAccount));
    return Array.from(set);
  }, [allItems]);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-[var(--background)]">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden bg-[var(--background)]">
      {/* Header */}
      <div className="flex-shrink-0 bg-[var(--card)] border-b border-[var(--border)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between mb-1">
            <div>
              <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
                {t("attachments.title")}
              </h1>
              <p className="text-sm text-[var(--text-tertiary)] mt-0.5">
                {t("attachments.subtitle")}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setFilterSheetOpen(true)}
                className={`p-2.5 rounded-[var(--radius-lg)] border transition-colors ${
                  hasAdvancedFilters
                    ? "bg-[var(--primary-light)] border-[var(--primary)] text-[var(--primary)]"
                    : "border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--surface)]"
                }`}
                title={t("attachments.filters.open_advanced")}
              >
                <Filter className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="relative mt-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-tertiary)]" />
            <input
              type="text"
              placeholder={t("attachments.filters.search_placeholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-[var(--input-background)] border border-[var(--border)] rounded-[var(--radius-lg)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]"
            />
          </div>

          {/* Quick Filter Chips */}
          <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
            {quickFilters
              .filter((f) => f.show)
              .map((f) => (
                <button
                  key={f.key}
                  onClick={() => setQuickFilter(f.key)}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    quickFilter === f.key
                      ? "bg-[var(--primary)] text-white"
                      : "bg-[var(--surface)] text-[var(--text-secondary)] hover:bg-[var(--border)]"
                  }`}
                >
                  {f.label}
                  {f.key === "all" && (
                    <span className="ml-1 opacity-70">{allItems.length}</span>
                  )}
                  {f.key === "image" && (
                    <span className="ml-1 opacity-70">{imageCount}</span>
                  )}
                </button>
              ))}
          </div>

          {/* Stats bar */}
          <div className="flex items-center gap-4 mt-3 text-xs text-[var(--text-tertiary)]">
            <span className="flex items-center gap-1">
              <Files className="w-3.5 h-3.5" />
              {t("attachments.stats.image_count", {
                count: filteredItems.length,
              })}
            </span>
            {hasAdvancedFilters && (
              <button
                onClick={clearAdvancedFilters}
                className="text-[var(--danger)] font-medium hover:underline ml-auto"
              >
                {t("attachments.filters.clear")}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Gallery Content */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-20 md:pb-6">
          {filteredItems.length === 0 ? (
            /* Empty State */
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-20 h-20 rounded-full bg-[var(--surface)] flex items-center justify-center mb-4">
                <Paperclip className="w-10 h-10 text-[var(--text-tertiary)]" />
              </div>
              <h3 className="font-semibold text-[var(--text-primary)] mb-2">
                {t("attachments.empty.title")}
              </h3>
              <p className="text-sm text-[var(--text-tertiary)] max-w-xs mb-6">
                {allItems.length === 0
                  ? t("attachments.empty.no_attachments")
                  : t("attachments.empty.no_results")}
              </p>
              {allItems.length === 0 && (
                <Button onClick={() => goCreateTransaction()}>
                  {t("attachments.empty.add_from_transaction")}
                </Button>
              )}
            </div>
          ) : (
            /* Grouped by Month */
            <div className="space-y-8">
              {groupedByMonth.map(([monthKey, items]) => (
                <div key={monthKey}>
                  {/* Sticky month header */}
                  <div className="sticky top-0 z-10 bg-[var(--background)] pb-2 pt-1">
                    <h2 className="text-sm font-semibold text-[var(--text-secondary)] flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      {formatMonthHeader(monthKey)}
                      <span className="text-[var(--text-tertiary)] font-normal">
                        {t("attachments.month.file_count", {
                          count: items.length,
                        })}
                      </span>
                    </h2>
                  </div>

                  {/* Grid */}
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
                    {items.map((item) => (
                      <button
                        key={`${item.transactionId}`}
                        onClick={() => {
                          openLightbox(item, filteredItems);
                        }}
                        className="group relative aspect-square rounded-[var(--radius-lg)] overflow-hidden bg-[var(--surface)] border border-[var(--border)] hover:ring-2 hover:ring-[var(--primary)] transition-all focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]"
                      >
                        {/* Thumbnail */}
                        <img
                          src={item.imageUrl}
                          alt={item.transactionDescription}
                          className="w-full h-full object-cover transition-transform group-hover:scale-105"
                          loading="lazy"
                        />

                        {/* Overlay gradient */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                        {/* Hover info overlay */}
                        <div className="absolute bottom-0 left-0 right-0 p-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <p className="text-[10px] text-white truncate font-medium drop-shadow">
                            {item.transactionDescription}
                          </p>
                          <p className="text-[9px] text-white/70 truncate">
                            {item.transactionDate}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* File names below tiles (visible on mobile without hover) */}
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 mt-1 md:hidden">
                    {items.map((item) => (
                      <div
                        key={`label-${item.transactionId}`}
                        className="min-w-0"
                      >
                        <p className="text-[10px] text-[var(--text-secondary)] truncate">
                          {item.transactionDescription}
                        </p>
                        <p className="text-[9px] text-[var(--text-tertiary)]">
                          {item.transactionDate}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Filter Bottom Sheet */}
      {filterSheetOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center"
          onClick={() => setFilterSheetOpen(false)}
        >
          <div
            className="bg-[var(--card)] w-full max-w-lg rounded-t-[var(--radius-xl)] sm:rounded-[var(--radius-xl)] max-h-[80vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Sheet header */}
            <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
              <h3 className="font-semibold text-[var(--text-primary)]">
                {t("attachments.filters.open_advanced")}
              </h3>
              <button
                onClick={() => setFilterSheetOpen(false)}
                className="p-1 rounded-[var(--radius-md)] hover:bg-[var(--surface)]"
              >
                <X className="w-5 h-5 text-[var(--text-tertiary)]" />
              </button>
            </div>

            <div className="overflow-y-auto max-h-[60vh] p-4 space-y-5">
              {/* Date Range */}
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                  {t("attachments.filters.date_range")}
                </label>
                <div className="flex gap-2 mb-2">
                  {[
                    {
                      label: t("attachments.filters.presets.last_30_days"),
                      start: (() => {
                        const d = new Date();
                        d.setDate(d.getDate() - 30);
                        return d.toISOString().split("T")[0];
                      })(),
                      end: new Date().toISOString().split("T")[0],
                    },
                    {
                      label: t("attachments.filters.presets.this_month"),
                      start: (() => {
                        const d = new Date();
                        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
                      })(),
                      end: new Date().toISOString().split("T")[0],
                    },
                    {
                      label: t("attachments.filters.presets.last_month"),
                      start: (() => {
                        const d = new Date();
                        d.setMonth(d.getMonth() - 1);
                        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
                      })(),
                      end: (() => {
                        const d = new Date();
                        d.setDate(0);
                        return d.toISOString().split("T")[0];
                      })(),
                    },
                  ].map((preset) => (
                    <button
                      key={preset.label}
                      onClick={() => {
                        setFilterDateStart(preset.start);
                        setFilterDateEnd(preset.end);
                      }}
                      className={`px-3 py-1.5 rounded-[var(--radius-md)] text-xs font-medium border transition-colors ${
                        filterDateStart === preset.start &&
                        filterDateEnd === preset.end
                          ? "bg-[var(--primary-light)] border-[var(--primary)] text-[var(--primary)]"
                          : "border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--surface)]"
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="date"
                    value={filterDateStart}
                    onChange={(e) => setFilterDateStart(e.target.value)}
                    className="w-full px-3 py-2 bg-[var(--input-background)] border border-[var(--border)] rounded-[var(--radius-md)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]"
                  />
                  <input
                    type="date"
                    value={filterDateEnd}
                    onChange={(e) => setFilterDateEnd(e.target.value)}
                    className="w-full px-3 py-2 bg-[var(--input-background)] border border-[var(--border)] rounded-[var(--radius-md)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]"
                  />
                </div>
              </div>

              {/* Account filter */}
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                  {t("attachments.filters.account")}
                </label>
                <div className="flex flex-wrap gap-2">
                  {accountsWithAttachments.map((acc) => {
                    const selected = filterAccounts.includes(acc);
                    return (
                      <button
                        key={acc}
                        onClick={() => {
                          setFilterAccounts(
                            selected
                              ? filterAccounts.filter((a) => a !== acc)
                              : [...filterAccounts, acc],
                          );
                        }}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                          selected
                            ? "bg-[var(--primary)] border-[var(--primary)] text-white"
                            : "border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--surface)]"
                        }`}
                      >
                        {acc}
                      </button>
                    );
                  })}
                  {accountsWithAttachments.length === 0 && (
                    <p className="text-xs text-[var(--text-tertiary)]">
                      {t("attachments.filters.no_accounts")}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Sheet footer */}
            <div className="flex gap-3 p-4 border-t border-[var(--border)]">
              <button
                onClick={() => {
                  clearAdvancedFilters();
                  setFilterSheetOpen(false);
                }}
                className="flex-1 px-4 py-2.5 rounded-[var(--radius-lg)] border border-[var(--border)] text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--surface)] transition-colors"
              >
                {t("attachments.filters.clear")}
              </button>
              <button
                onClick={() => setFilterSheetOpen(false)}
                className="flex-1 px-4 py-2.5 rounded-[var(--radius-lg)] bg-[var(--primary)] text-white text-sm font-medium hover:opacity-90 transition-opacity"
              >
                {t("attachments.filters.apply")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox */}
      {lightboxState &&
        (() => {
          const currentItem = lightboxState.items[lightboxState.index];
          return (
            <div
              className="fixed inset-0 bg-black/90 flex flex-col z-[60]"
              onClick={() => setLightboxState(null)}
            >
              {/* Top bar */}
              <div
                className="flex-shrink-0 flex items-center justify-between px-4 py-3"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center gap-3">
                  <span className="px-2.5 py-1 rounded-full bg-white/15 text-white text-xs font-medium tabular-nums">
                    {lightboxState.index + 1} / {lightboxState.items.length}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={currentItem.imageUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
                    title={t("attachments.item.open_in_browser")}
                  >
                    <ExternalLink className="w-5 h-5" />
                  </a>
                  <a
                    href={currentItem.imageUrl}
                    download
                    className="p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
                    title={t("attachments.item.download")}
                  >
                    <Download className="w-5 h-5" />
                  </a>
                  <button
                    onClick={() => setLightboxState(null)}
                    className="p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Image area */}
              <div
                className="flex-1 relative flex items-center justify-center overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                <img
                  src={currentItem.imageUrl}
                  alt={currentItem.transactionDescription}
                  className="max-w-full max-h-full object-contain px-4"
                />

                {/* Navigation arrows */}
                {lightboxState.items.length > 1 && (
                  <>
                    <button
                      onClick={() =>
                        setLightboxState((prev) =>
                          prev
                            ? {
                                ...prev,
                                index:
                                  (prev.index - 1 + prev.items.length) %
                                  prev.items.length,
                              }
                            : null,
                        )
                      }
                      className="absolute left-2 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
                    >
                      <ChevronLeft className="w-6 h-6" />
                    </button>
                    <button
                      onClick={() =>
                        setLightboxState((prev) =>
                          prev
                            ? {
                                ...prev,
                                index: (prev.index + 1) % prev.items.length,
                              }
                            : null,
                        )
                      }
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
                    >
                      <ChevronRight className="w-6 h-6" />
                    </button>
                  </>
                )}
              </div>

              {/* Bottom info bar */}
              <div
                className="flex-shrink-0 bg-black/60 backdrop-blur-sm"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="max-w-2xl mx-auto px-4 py-3">
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        {currentItem.transactionDescription}
                      </p>
                      <p className="text-xs text-white/60 mt-0.5">
                        {currentItem.transactionDate}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setLightboxState(null);
                        goTransactionDetail(currentItem.transactionId);
                      }}
                      className="flex-shrink-0 px-4 py-2 bg-white text-black rounded-[var(--radius-lg)] text-sm font-medium hover:bg-white/90 transition-colors"
                    >
                      {t("attachments.item.view_transaction")}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}
    </div>
  );
}

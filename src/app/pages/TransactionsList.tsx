import { Plus, Search, ArrowUpRight, ArrowDownLeft, ArrowLeftRight, Edit2, Trash2, CheckSquare, Square, X, Calendar, ChevronDown, ChevronUp, Tag, Copy, Paperclip, Cloud, Crown, Eye, ExternalLink, Download, FileText, Upload, Lock, CheckCircle, AlertCircle } from 'lucide-react';
import { useDemoData, type CloudAttachment } from '../contexts/DemoDataContext';
import { useAppNavigation } from '../hooks/useAppNavigation';
import { useToast } from '../contexts/ToastContext';
import { useTransactionUndoDelete } from '../hooks/useTransactionUndoDelete';
import { Button } from '../components/Button';
import { ConfirmationModal } from '../components/ConfirmationModals';
import { SwipeableRow } from '../components/SwipeableRow';
import { TagChip } from '../components/TagChip';
import { maskAccountNumber } from '../utils/accountHelpers';
import { AttachmentUploadSheet } from '../components/AttachmentUploadSheet';

type FilterType = 'all' | 'income' | 'expense' | 'transfer';
type TagFilterMode = 'AND' | 'OR';

export default function TransactionsList() {
  const { transactions, accounts, categories, tags, hideAccountNumbers } = useDemoData();
  const { goTransactionDetail, goCreateTransaction, goEditTransaction, goDuplicateTransaction, goAttachments } = useAppNavigation();
  const toast = useToast();
  const { softDelete, softBulkDelete } = useTransactionUndoDelete();
  const [searchParams] = useSearchParams();

  // Read initial filter from URL query param (?type=income)
  const initialFilter = (searchParams.get('type') as FilterType) || 'all';

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<FilterType>(initialFilter);
  const [filterAccount, setFilterAccount] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterTags, setFilterTags] = useState<string[]>([]);
  const [tagFilterMode, setTagFilterMode] = useState<TagFilterMode>('OR');
  const [tagDropdownOpen, setTagDropdownOpen] = useState(false);
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [txnToDelete, setTxnToDelete] = useState<{ id: string; description: string } | null>(null);

  // Bulk selection
  const [bulkMode, setBulkMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleteModalOpen, setBulkDeleteModalOpen] = useState(false);

  // Date range filter
  const [dateRangeOpen, setDateRangeOpen] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const hasDateFilter = startDate !== '' || endDate !== '';

  // Attachment filter & preview
  const [filterAttachmentOnly, setFilterAttachmentOnly] = useState(false);
  const [attachmentSheet, setAttachmentSheet] = useState<{ txnId: string; attachments: CloudAttachment[]; description: string } | null>(null);
  const [lightboxState, setLightboxState] = useState<{ attachments: CloudAttachment[]; index: number } | null>(null);

  const clearDateFilter = () => {
    setStartDate('');
    setEndDate('');
  };

  const applyQuickDateRange = (start: string, end: string) => {
    setStartDate(start);
    setEndDate(end);
  };

  // Helper to get tag by id
  const getTagById = (id: string) => tags.find(t => t.id === id);

  // Filter and sort transactions
  const filteredTransactions = transactions
    .filter(txn => {
      if (filterType !== 'all' && txn.type !== filterType) return false;
      if (filterAccount !== 'all' && txn.account !== filterAccount) return false;
      if (filterCategory !== 'all' && txn.category !== filterCategory) return false;
      if (filterAttachmentOnly && !(txn.attachments && txn.attachments.length > 0)) return false;
      if (filterTags.length > 0) {
        const txnTags = txn.tags || [];
        if (tagFilterMode === 'AND') {
          if (!filterTags.every(tagId => txnTags.includes(tagId))) return false;
        } else {
          if (!filterTags.some(tagId => txnTags.includes(tagId))) return false;
        }
      }
      if (startDate && txn.date < startDate) return false;
      if (endDate && txn.date > endDate) return false;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return txn.description.toLowerCase().includes(query) ||
               txn.category.toLowerCase().includes(query) ||
               txn.account.toLowerCase().includes(query);
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'date') {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      }
      return Math.abs(b.amount) - Math.abs(a.amount);
    });

  // Group by date
  const groupedTransactions = filteredTransactions.reduce((groups, txn) => {
    const date = txn.date;
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(txn);
    return groups;
  }, {} as Record<string, typeof transactions>);

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(Math.abs(amount));
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Hôm nay';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Hôm qua';
    }

    return date.toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long' });
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'income':
        return <ArrowUpRight className="w-5 h-5 text-[var(--success)]" />;
      case 'expense':
        return <ArrowDownLeft className="w-5 h-5 text-[var(--danger)]" />;
      case 'transfer':
        return <ArrowLeftRight className="w-5 h-5 text-[var(--info)]" />;
      default:
        return null;
    }
  };

  const getAmountColor = (type: string) => {
    switch (type) {
      case 'income':
        return 'text-[var(--success)]';
      case 'expense':
        return 'text-[var(--danger)]';
      case 'transfer':
        return 'text-[var(--info)]';
      default:
        return 'text-[var(--text-primary)]';
    }
  };

  // Calculate totals for current filter
  const totals = filteredTransactions.reduce((acc, txn) => {
    if (txn.type === 'income') acc.income += txn.amount;
    if (txn.type === 'expense') acc.expense += Math.abs(txn.amount);
    return acc;
  }, { income: 0, expense: 0 });

  const handleDelete = (txn: { id: string; description: string }) => {
    setTxnToDelete(txn);
    setDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (txnToDelete) {
      // Also delete linked fee transaction if exists
      const txn = transactions.find(t => t.id === txnToDelete.id);
      const hasLinked = txn?.linkedTransactionId && transactions.some(t => t.id === txn.linkedTransactionId);
      softDelete(txnToDelete.id, { deleteLinked: !!hasLinked });
      setDeleteModalOpen(false);
      setTxnToDelete(null);
    }
  };

  const handleBulkDelete = () => {
    setBulkDeleteModalOpen(true);
  };

  const confirmBulkDelete = () => {
    softBulkDelete(Array.from(selectedIds));
    setBulkDeleteModalOpen(false);
    setBulkMode(false);
    setSelectedIds(new Set());
  };

  const toggleBulkMode = () => {
    setBulkMode(!bulkMode);
    setSelectedIds(new Set());
  };

  const toggleSelection = (id: string) => {
    const newSelectedIds = new Set(selectedIds);
    if (newSelectedIds.has(id)) {
      newSelectedIds.delete(id);
    } else {
      newSelectedIds.add(id);
    }
    setSelectedIds(newSelectedIds);
  };

  return (
    <div className="h-full flex flex-col overflow-hidden bg-[var(--background)]">
      {/* Header - fixed at top, never scrolls */}
      <div className="flex-shrink-0 z-10 bg-[var(--card)] border-b border-[var(--border)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Giao dịch</h1>
            <div className="flex items-center gap-2">
              {!bulkMode && (
                <button
                  onClick={goAttachments}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-[var(--radius-lg)] text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--surface)] transition-colors"
                  title="Xem thư viện đính kèm"
                >
                  <Paperclip className="w-4 h-4" />
                  <span className="hidden sm:inline">Đính kèm</span>
                </button>
              )}
              {filteredTransactions.length > 0 && (
                <button
                  onClick={toggleBulkMode}
                  className={`flex items-center gap-2 px-3 py-2 rounded-[var(--radius-lg)] text-sm font-medium transition-colors ${
                    bulkMode
                      ? 'bg-[var(--primary-light)] text-[var(--primary)]'
                      : 'text-[var(--text-secondary)] hover:bg-[var(--surface)]'
                  }`}
                >
                  {bulkMode ? (
                    <>
                      <X className="w-4 h-4" />
                      <span className="hidden sm:inline">Huỷ chọn</span>
                    </>
                  ) : (
                    <>
                      <CheckSquare className="w-4 h-4" />
                      <span className="hidden sm:inline">Chọn</span>
                    </>
                  )}
                </button>
              )}
              {!bulkMode && (
                <Button onClick={goCreateTransaction}>
                  <Plus className="w-5 h-5 mr-2" />
                  <span className="hidden sm:inline">Thêm giao dịch</span>
                  <span className="sm:hidden">Thêm</span>
                </Button>
              )}
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-tertiary)]" />
              <input
                type="text"
                placeholder="Tìm kiếm giao dịch..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-[var(--input-background)] border border-[var(--border)] rounded-[var(--radius-lg)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]"
              />
            </div>

            <div className="flex gap-2 flex-wrap">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as FilterType)}
                className="px-4 py-2.5 bg-[var(--input-background)] border border-[var(--border)] rounded-[var(--radius-lg)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]"
              >
                <option value="all">Tất cả</option>
                <option value="income">Thu nhập</option>
                <option value="expense">Chi tiêu</option>
                <option value="transfer">Chuyển tiền</option>
              </select>

              <select
                value={filterAccount}
                onChange={(e) => setFilterAccount(e.target.value)}
                className="px-4 py-2.5 bg-[var(--input-background)] border border-[var(--border)] rounded-[var(--radius-lg)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]"
              >
                <option value="all">Tất cả TK</option>
                {accounts.map(account => (
                  <option key={account.id} value={account.name}>{account.name}</option>
                ))}
              </select>

              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-4 py-2.5 bg-[var(--input-background)] border border-[var(--border)] rounded-[var(--radius-lg)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]"
              >
                <option value="all">Tất cả DM</option>
                {categories.map(category => (
                  <option key={category.id} value={category.name}>{category.name}</option>
                ))}
              </select>

              <div className="relative">
                <button
                  onClick={() => setTagDropdownOpen(!tagDropdownOpen)}
                  className={`flex items-center gap-1.5 px-4 py-2.5 border rounded-[var(--radius-lg)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)] transition-colors ${
                    filterTags.length > 0
                      ? 'bg-[var(--warning-light)] border-[var(--warning)] text-[var(--warning)] font-medium'
                      : 'bg-[var(--input-background)] border-[var(--border)] text-[var(--text-primary)]'
                  }`}
                >
                  <Tag className="w-4 h-4" />
                  <span className="hidden sm:inline max-w-[120px] truncate">
                    {filterTags.length > 0
                      ? `${filterTags.length} tag`
                      : 'Tag'}
                  </span>
                  {tagDropdownOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>

                {tagDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-20" onClick={() => setTagDropdownOpen(false)} />
                    <div className="absolute top-full right-0 mt-1 z-30 w-72 bg-[var(--card)] border border-[var(--border)] rounded-[var(--radius-lg)] shadow-[var(--shadow-lg)] overflow-hidden">
                      <div className="p-3">
                        {/* Header with AND/OR toggle */}
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs font-medium text-[var(--text-secondary)]">Lọc theo tag</span>
                          <div className="flex items-center gap-1 bg-[var(--surface)] rounded-[var(--radius-md)] p-0.5">
                            <button
                              onClick={() => setTagFilterMode('OR')}
                              className={`px-2.5 py-1 rounded-[var(--radius-sm)] text-xs font-medium transition-colors ${
                                tagFilterMode === 'OR'
                                  ? 'bg-[var(--card)] text-[var(--primary)] shadow-[var(--shadow-sm)]'
                                  : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
                              }`}
                            >
                              HOẶC
                            </button>
                            <button
                              onClick={() => setTagFilterMode('AND')}
                              className={`px-2.5 py-1 rounded-[var(--radius-sm)] text-xs font-medium transition-colors ${
                                tagFilterMode === 'AND'
                                  ? 'bg-[var(--card)] text-[var(--primary)] shadow-[var(--shadow-sm)]'
                                  : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
                              }`}
                            >
                              VÀ
                            </button>
                          </div>
                        </div>

                        {/* Tag chips */}
                        <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto">
                          {tags.map(tag => {
                            const isActive = filterTags.includes(tag.id);
                            return (
                              <button
                                key={tag.id}
                                onClick={() => {
                                  setFilterTags(isActive
                                    ? filterTags.filter(id => id !== tag.id)
                                    : [...filterTags, tag.id]
                                  );
                                }}
                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
                                  isActive
                                    ? 'border-transparent text-white'
                                    : 'border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--text-tertiary)] bg-[var(--background)]'
                                }`}
                                style={isActive ? { backgroundColor: tag.color } : undefined}
                              >
                                <span
                                  className="w-2 h-2 rounded-full flex-shrink-0"
                                  style={{ backgroundColor: isActive ? 'rgba(255,255,255,0.5)' : tag.color }}
                                />
                                {tag.name}
                                {isActive && <X className="w-3 h-3 ml-0.5" />}
                              </button>
                            );
                          })}
                          {tags.length === 0 && (
                            <p className="text-xs text-[var(--text-tertiary)] py-2">Chưa có tag nào</p>
                          )}
                        </div>

                        {/* Footer */}
                        {filterTags.length > 0 && (
                          <div className="mt-3 pt-2 border-t border-[var(--border)] flex items-center justify-between">
                            <span className="text-[10px] text-[var(--text-tertiary)]">
                              {filterTags.length} tag • Chế độ {tagFilterMode === 'AND' ? 'VÀ' : 'HOẶC'}
                            </span>
                            <button
                              onClick={() => setFilterTags([])}
                              className="text-xs text-[var(--danger)] hover:text-[var(--danger)]/80 font-medium"
                            >
                              Xoá tất cả
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'date' | 'amount')}
                className="px-4 py-2.5 bg-[var(--input-background)] border border-[var(--border)] rounded-[var(--radius-lg)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]"
              >
                <option value="date">Ngày</option>
                <option value="amount">Số tiền</option>
              </select>

              <button
                onClick={() => setDateRangeOpen(!dateRangeOpen)}
                className={`flex items-center gap-1.5 px-3 py-2.5 border rounded-[var(--radius-lg)] text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)] ${
                  hasDateFilter
                    ? 'bg-[var(--primary-light)] border-[var(--primary)] text-[var(--primary)]'
                    : 'bg-[var(--input-background)] border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--surface)]'
                }`}
              >
                <Calendar className="w-4 h-4" />
                {hasDateFilter ? (
                  <span className="hidden sm:inline">Lọc ngày</span>
                ) : (
                  <span className="hidden sm:inline">Ngày</span>
                )}
                {dateRangeOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>

              {/* Attachment filter toggle */}
              <button
                onClick={() => setFilterAttachmentOnly(!filterAttachmentOnly)}
                className={`flex items-center gap-1.5 px-3 py-2.5 border rounded-[var(--radius-lg)] text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)] ${
                  filterAttachmentOnly
                    ? 'bg-amber-50 border-amber-400 text-amber-700'
                    : 'bg-[var(--input-background)] border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--surface)]'
                }`}
                title="Chỉ giao dịch có đính kèm"
              >
                <Paperclip className="w-4 h-4" />
                <span className="hidden sm:inline">{filterAttachmentOnly ? 'Có đính kèm' : 'Đính kèm'}</span>
              </button>
            </div>
          </div>

          {/* Active Filter Badges */}
          {(filterType !== 'all' || filterAccount !== 'all' || filterCategory !== 'all' || filterTags.length > 0 || hasDateFilter || filterAttachmentOnly) && (
            <div className="mt-3 flex items-center gap-2 flex-wrap">
              {filterType !== 'all' && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[var(--primary-light)] text-[var(--primary)] rounded-[var(--radius-md)] text-xs font-medium">
                  {filterType === 'income' ? 'Thu nhập' : filterType === 'expense' ? 'Chi tiêu' : 'Chuyển tiền'}
                  <button onClick={() => setFilterType('all')} className="ml-0.5 hover:text-[var(--danger)]">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {filterAccount !== 'all' && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[var(--info-light)] text-[var(--info)] rounded-[var(--radius-md)] text-xs font-medium">
                  TK: {filterAccount}
                  <button onClick={() => setFilterAccount('all')} className="ml-0.5 hover:text-[var(--danger)]">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {filterCategory !== 'all' && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[var(--success-light)] text-[var(--success)] rounded-[var(--radius-md)] text-xs font-medium">
                  DM: {filterCategory}
                  <button onClick={() => setFilterCategory('all')} className="ml-0.5 hover:text-[var(--danger)]">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {filterTags.length > 0 && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[var(--warning-light)] text-[var(--warning)] rounded-[var(--radius-md)] text-xs font-medium">
                  Tag ({tagFilterMode === 'AND' ? 'VÀ' : 'HOẶC'}): {filterTags.map(id => getTagById(id)?.name || '?').join(tagFilterMode === 'AND' ? ' + ' : ' | ')}
                  <button onClick={() => setFilterTags([])} className="ml-0.5 hover:text-[var(--danger)]">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {hasDateFilter && !dateRangeOpen && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[var(--primary-light)] text-[var(--primary)] rounded-[var(--radius-md)] text-xs font-medium">
                  <Calendar className="w-3 h-3" />
                  {startDate && endDate
                    ? `${new Date(startDate).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })} — ${new Date(endDate).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}`
                    : startDate
                      ? `Từ ${new Date(startDate).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}`
                      : `Đến ${new Date(endDate).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}`
                  }
                  <button onClick={clearDateFilter} className="ml-0.5 hover:text-[var(--danger)]">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {filterAttachmentOnly && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-[var(--radius-md)] text-xs font-medium">
                  <Paperclip className="w-3 h-3" />
                  Chỉ có đính kèm
                  <button onClick={() => setFilterAttachmentOnly(false)} className="ml-0.5 hover:text-[var(--danger)]">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              <button
                onClick={() => {
                  setFilterType('all');
                  setFilterAccount('all');
                  setFilterCategory('all');
                  setFilterTags([]);
                  setFilterAttachmentOnly(false);
                  clearDateFilter();
                  setSearchQuery('');
                }}
                className="text-xs font-medium text-[var(--danger)] hover:text-[var(--danger)]/80 transition-colors"
              >
                Xoá tất cả bộ lọc
              </button>
              <span className="ml-auto text-xs text-[var(--text-tertiary)] tabular-nums">
                {filteredTransactions.length} kết quả
              </span>
            </div>
          )}

          {/* Date Range Picker */}
          {dateRangeOpen && (
            <div className="mt-3 p-3 bg-[var(--surface)] rounded-[var(--radius-lg)] border border-[var(--border)]">
              <div className="flex flex-col sm:flex-row gap-3 mb-3">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Từ ngày</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 bg-[var(--input-background)] border border-[var(--border)] rounded-[var(--radius-md)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Đến ngày</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 bg-[var(--input-background)] border border-[var(--border)] rounded-[var(--radius-md)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]"
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => applyQuickDateRange('2026-02-01', '2026-02-28')}
                  className="px-2.5 py-1 bg-[var(--card)] hover:bg-[var(--border)] rounded-[var(--radius-md)] text-xs font-medium text-[var(--text-primary)] transition-colors"
                >
                  Tháng này
                </button>
                <button
                  onClick={() => applyQuickDateRange('2026-01-01', '2026-01-31')}
                  className="px-2.5 py-1 bg-[var(--card)] hover:bg-[var(--border)] rounded-[var(--radius-md)] text-xs font-medium text-[var(--text-primary)] transition-colors"
                >
                  Tháng trước
                </button>
                <button
                  onClick={() => {
                    const now = new Date();
                    const weekAgo = new Date(now);
                    weekAgo.setDate(weekAgo.getDate() - 7);
                    applyQuickDateRange(weekAgo.toISOString().split('T')[0], now.toISOString().split('T')[0]);
                  }}
                  className="px-2.5 py-1 bg-[var(--card)] hover:bg-[var(--border)] rounded-[var(--radius-md)] text-xs font-medium text-[var(--text-primary)] transition-colors"
                >
                  7 ngày
                </button>
                <button
                  onClick={() => applyQuickDateRange('2026-01-01', '2026-12-31')}
                  className="px-2.5 py-1 bg-[var(--card)] hover:bg-[var(--border)] rounded-[var(--radius-md)] text-xs font-medium text-[var(--text-primary)] transition-colors"
                >
                  Năm nay
                </button>
                {hasDateFilter && (
                  <button
                    onClick={clearDateFilter}
                    className="px-2.5 py-1 bg-[var(--danger-light)] hover:bg-[var(--danger-light)] text-[var(--danger)] rounded-[var(--radius-md)] text-xs font-medium transition-colors"
                  >
                    Xoá lọc
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Summary */}
          {filterType !== 'transfer' && (
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="p-3 bg-[var(--success-light)] rounded-[var(--radius-lg)]">
                <div className="text-xs text-[var(--text-secondary)] mb-1">Thu nhập</div>
                <div className="text-lg font-semibold text-[var(--success)]">
                  {formatAmount(totals.income)}
                </div>
              </div>
              <div className="p-3 bg-[var(--danger-light)] rounded-[var(--radius-lg)]">
                <div className="text-xs text-[var(--text-secondary)] mb-1">Chi tiêu</div>
                <div className="text-lg font-semibold text-[var(--danger)]">
                  {formatAmount(totals.expense)}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Transaction List - only this part scrolls */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-20 md:pb-6">
          {Object.keys(groupedTransactions).length === 0 ? (
            <div className="text-center py-12">
              <div className="text-[var(--text-tertiary)] mb-4">Không tìm thấy giao dịch</div>
              <Button onClick={goCreateTransaction}>
                <Plus className="w-5 h-5 mr-2" />
                Thêm giao dịch đầu tiên
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedTransactions).map(([date, txns]) => (
                <div key={date}>
                  <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-3 px-2">
                    {formatDate(date)}
                  </h3>
                  <div className="bg-[var(--card)] rounded-[var(--radius-xl)] border border-[var(--border)] divide-y divide-[var(--divider)]">
                    {txns.map((txn) => (
                      <SwipeableRow
                        key={txn.id}
                        disabled={bulkMode}
                        actions={[
                          {
                            icon: <Copy className="w-4 h-4" />,
                            label: 'Nhân bản',
                            color: 'white',
                            bgColor: 'var(--info)',
                            onClick: () => {
                              if (txn.type === 'transfer') {
                                toast.info('Chuyển khoản chưa hỗ trợ nhân bản.');
                              } else {
                                goDuplicateTransaction(txn.id);
                              }
                            },
                          },
                          {
                            icon: <Edit2 className="w-4 h-4" />,
                            label: 'Sửa',
                            color: 'white',
                            bgColor: 'var(--primary)',
                            onClick: () => goEditTransaction(txn.id),
                          },
                          {
                            icon: <Trash2 className="w-4 h-4" />,
                            label: 'Xoá',
                            color: 'white',
                            bgColor: 'var(--danger)',
                            onClick: () => handleDelete({ id: txn.id, description: txn.description }),
                          },
                        ]}
                      >
                        <div
                          onClick={() => {
                            if (bulkMode) {
                              toggleSelection(txn.id);
                            } else {
                              goTransactionDetail(txn.id);
                            }
                          }}
                          className={`p-4 hover:bg-[var(--surface)] transition-colors cursor-pointer group ${
                            bulkMode && selectedIds.has(txn.id) ? 'bg-[var(--primary-light)]' : ''
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            {bulkMode ? (
                              <div className="w-10 h-10 rounded-[var(--radius-lg)] flex items-center justify-center flex-shrink-0">
                                {selectedIds.has(txn.id) ? (
                                  <CheckSquare className="w-5 h-5 text-[var(--primary)]" />
                                ) : (
                                  <Square className="w-5 h-5 text-[var(--text-tertiary)]" />
                                )}
                              </div>
                            ) : (
                              <div className="w-10 h-10 rounded-[var(--radius-lg)] bg-[var(--surface)] flex items-center justify-center flex-shrink-0">
                                {getTypeIcon(txn.type)}
                              </div>
                            )}

                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <div className="font-medium text-[var(--text-primary)] truncate">
                                    {txn.description}
                                  </div>
                                  <div className="text-sm text-[var(--text-secondary)] mt-0.5">
                                    {(() => {
                                      // Category display: split vs single
                                      if (txn.isSplit && txn.splitItems && txn.splitItems.length > 0) {
                                        const cats = txn.splitItems.map(si => si.category);
                                        const uniqueCats = [...new Set(cats)];
                                        const shown = uniqueCats.slice(0, 2).join(', ');
                                        const extra = uniqueCats.length > 2 ? ` +${uniqueCats.length - 2}` : '';
                                        return `Phân chia • ${shown}${extra}`;
                                      }
                                      return txn.category;
                                    })()} • {(() => {
                                      const acc = accounts.find(a => a.id === txn.accountId);
                                      if (acc && acc.accountNumber && (acc.type === 'bank' || acc.type === 'cash')) {
                                        return `${txn.account} | ${maskAccountNumber(acc.accountNumber, acc.type, hideAccountNumbers)}`;
                                      }
                                      return txn.account;
                                    })()}
                                    {txn.merchant && ` • ${txn.merchant}`}
                                  </div>
                                </div>

                                <div className="flex items-center gap-2 flex-shrink-0">
                                  <div className="text-right">
                                    <div className={`font-semibold ${getAmountColor(txn.type)}`}>
                                      {txn.type === 'income' ? '+' : txn.type === 'transfer' ? '' : '-'}
                                      {formatAmount(Math.abs(txn.amount))}
                                    </div>

                                    {/* Attachment Indicator */}
                                    {txn.attachments && txn.attachments.length > 0 && (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          const atts = txn.attachments!;
                                          if (atts.length === 1) {
                                            // Single attachment: open lightbox directly
                                            if (atts[0].type === 'image') {
                                              setLightboxState({ attachments: atts, index: 0 });
                                            } else {
                                              window.open(atts[0].url, '_blank');
                                            }
                                          } else {
                                            // Multiple: open bottom sheet
                                            setAttachmentSheet({ txnId: txn.id, attachments: atts, description: txn.description });
                                          }
                                        }}
                                        className="inline-flex items-center gap-1 mt-1 px-1.5 py-0.5 rounded-[var(--radius-sm)] bg-amber-50 border border-amber-200 hover:bg-amber-100 transition-colors"
                                        title="Xem đính kèm"
                                      >
                                        <Cloud className="w-3 h-3 text-amber-600" />
                                        <span className="text-[10px] font-semibold text-amber-700 tabular-nums">{txn.attachments.length}</span>
                                        <span className="px-1 py-px rounded text-[8px] font-bold bg-amber-500 text-white leading-none">PRO</span>
                                      </button>
                                    )}

                                    {txn.tags && txn.tags.length > 0 && (
                                      <div className="flex flex-wrap gap-1 mt-1 justify-end">
                                        {txn.tags.slice(0, 2).map(tagId => {
                                          const tag = getTagById(tagId);
                                          if (!tag) return null;
                                          return (
                                            <TagChip
                                              key={tagId}
                                              name={tag.name}
                                              color={tag.color}
                                              size="sm"
                                            />
                                          );
                                        })}
                                        {txn.tags.length > 2 && (
                                          <span className="px-1.5 py-0.5 text-xs text-[var(--text-tertiary)] bg-[var(--surface)] rounded-[var(--radius-full)]">
                                            +{txn.tags.length - 2}
                                          </span>
                                        )}
                                      </div>
                                    )}
                                  </div>

                                  {/* Action buttons - desktop only, hidden in bulk mode */}
                                  {!bulkMode && (
                                    <div className="hidden md:flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          goEditTransaction(txn.id);
                                        }}
                                        className="p-1.5 rounded-[var(--radius-md)] hover:bg-[var(--border)] transition-colors"
                                        title="Chỉnh sửa"
                                      >
                                        <Edit2 className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
                                      </button>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleDelete({ id: txn.id, description: txn.description });
                                        }}
                                        className="p-1.5 rounded-[var(--radius-md)] hover:bg-[var(--danger-light)] transition-colors"
                                        title="Xoá"
                                      >
                                        <Trash2 className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </SwipeableRow>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bulk Action Bar */}
      {bulkMode && selectedIds.size > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-20 bg-[var(--card)] border-t border-[var(--border)] shadow-[0_-4px_12px_rgba(0,0,0,0.1)]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
            <span className="text-sm font-medium text-[var(--text-primary)]">
              Đã chọn <span className="text-[var(--primary)] tabular-nums">{selectedIds.size}</span> giao dịch
            </span>
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  const allIds = filteredTransactions.map(t => t.id);
                  if (selectedIds.size === allIds.length) {
                    setSelectedIds(new Set());
                  } else {
                    setSelectedIds(new Set(allIds));
                  }
                }}
                className="px-3 py-1.5 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
              >
                {selectedIds.size === filteredTransactions.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
              </button>
              <button
                onClick={handleBulkDelete}
                className="flex items-center gap-2 px-4 py-2 bg-[var(--danger)] hover:bg-[var(--danger)]/90 text-white rounded-[var(--radius-lg)] text-sm font-medium transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Xoá ({selectedIds.size})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => { setDeleteModalOpen(false); setTxnToDelete(null); }}
        onConfirm={confirmDelete}
        title="Xoá giao dịch?"
        description={`Bạn có chắc muốn xoá giao dịch "${txnToDelete?.description || ''}"? Bạn có thể hoàn tác trong vài giây.`}
        confirmLabel="Xoá"
        cancelLabel="Huỷ"
        isDangerous={true}
      />

      {/* Bulk Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={bulkDeleteModalOpen}
        onClose={() => { setBulkDeleteModalOpen(false); }}
        onConfirm={confirmBulkDelete}
        title="Xoá các giao dịch đã chọn?"
        description={`Bạn có chắc muốn xoá ${selectedIds.size} giao dịch đã chọn? Bạn có thể hoàn tác trong vài giây.`}
        confirmLabel="Xoá"
        cancelLabel="Huỷ"
        isDangerous={true}
      />

      {/* Attachment Bottom Sheet */}
      {attachmentSheet && (
        <AttachmentUploadSheet
          txnId={attachmentSheet.txnId}
          description={attachmentSheet.description}
          onClose={() => setAttachmentSheet(null)}
          onOpenLightbox={(atts, idx) => setLightboxState({ attachments: atts, index: idx })}
          onNavigateToDetail={goTransactionDetail}
        />
      )}

      {/* Lightbox Overlay */}
      {lightboxState && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[60]" onClick={() => setLightboxState(null)}>
          <div className="relative max-w-4xl max-h-[90vh] w-full mx-4" onClick={e => e.stopPropagation()}>
            <img
              src={lightboxState.attachments[lightboxState.index].url}
              alt={lightboxState.attachments[lightboxState.index].name}
              className="w-full h-full object-contain rounded-lg"
            />

            {/* Navigation arrows */}
            {lightboxState.attachments.length > 1 && (
              <>
                <button
                  onClick={() => setLightboxState(prev => prev ? ({
                    ...prev,
                    index: (prev.index - 1 + prev.attachments.length) % prev.attachments.length,
                  }) : null)}
                  className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
                >
                  <ChevronDown className="w-6 h-6 -rotate-90" />
                </button>
                <button
                  onClick={() => setLightboxState(prev => prev ? ({
                    ...prev,
                    index: (prev.index + 1) % prev.attachments.length,
                  }) : null)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
                >
                  <ChevronDown className="w-6 h-6 rotate-90" />
                </button>
              </>
            )}

            {/* Top bar */}
            <div className="absolute top-3 right-3 flex gap-2">
              <span className="px-2 py-1 rounded-full bg-black/60 text-white text-xs font-medium tabular-nums">
                {lightboxState.index + 1} / {lightboxState.attachments.length}
              </span>
              <a
                href={lightboxState.attachments[lightboxState.index].url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
                title="Mở trong trình duyệt"
              >
                <ExternalLink className="w-5 h-5" />
              </a>
              <a
                href={lightboxState.attachments[lightboxState.index].url}
                download={lightboxState.attachments[lightboxState.index].name}
                className="p-2 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
                title="Tải về"
              >
                <Download className="w-5 h-5" />
              </a>
              <button
                onClick={() => setLightboxState(null)}
                className="p-2 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* File info */}
            <div className="absolute bottom-3 left-3 px-3 py-1.5 rounded-full bg-black/60 text-white text-xs">
              {lightboxState.attachments[lightboxState.index].name}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
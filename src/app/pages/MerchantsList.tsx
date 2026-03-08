import React, { useState, useMemo } from 'react';
import { Search, X, Edit2, GitMerge, Store, ChevronRight, Plus, ArrowUpDown, Trash2, CheckSquare, Square, XCircle } from 'lucide-react';
import { Card } from '../components/Card';
import { useAppNavigation } from '../hooks/useAppNavigation';
import { useToast } from '../contexts/ToastContext';
import { useDemoData } from '../contexts/DemoDataContext';
import { ConfirmationModal } from '../components/ConfirmationModals';
import { SwipeableRow } from '../components/SwipeableRow';

interface DisplayMerchant {
  id: string;
  name: string;
  defaultCategory: string | null;
  categoryName: string | null;
  usageCount: number;
  lastUsed: string;
  lastUsedRaw: string;
}

interface MerchantRowProps {
  merchant: DisplayMerchant;
  onEdit: () => void;
  onMerge: () => void;
  onSetDefault: () => void;
  onView: () => void;
  onDelete: () => void;
}

// Desktop table row component
function MerchantTableRow({ merchant, onEdit, onMerge, onSetDefault, onView, onDelete }: MerchantRowProps) {
  return (
    <tr className="border-b border-[var(--divider)] hover:bg-[var(--surface)] transition-colors cursor-pointer group">
      <td className="px-6 py-4" onClick={onView}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[var(--surface)] rounded-[var(--radius-md)] flex items-center justify-center">
            <Store className="w-5 h-5 text-[var(--text-secondary)]" />
          </div>
          <div>
            <p className="font-medium text-[var(--text-primary)]">{merchant.name}</p>
            <p className="text-xs text-[var(--text-tertiary)]">
              Sử dụng lần cuối: {merchant.lastUsed}
            </p>
          </div>
        </div>
      </td>
      <td className="px-6 py-4" onClick={onView}>
        {merchant.categoryName ? (
          <span className="text-sm text-[var(--text-primary)]">
            {merchant.categoryName}
          </span>
        ) : (
          <span className="text-sm text-[var(--text-tertiary)] italic">
            Chưa đặt
          </span>
        )}
      </td>
      <td className="px-6 py-4 text-center" onClick={onView}>
        <span className="text-sm text-[var(--text-primary)] tabular-nums">
          {merchant.usageCount}
        </span>
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          {!merchant.defaultCategory && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSetDefault();
              }}
              className="px-3 py-1.5 text-xs font-medium bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white rounded-[var(--radius-md)] transition-colors"
            >
              Đặt mặc định
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            className="p-2 rounded-[var(--radius-md)] hover:bg-[var(--border)] transition-colors"
            title="Chỉnh sửa"
          >
            <Edit2 className="w-4 h-4 text-[var(--text-secondary)]" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onMerge();
            }}
            className="p-2 rounded-[var(--radius-md)] hover:bg-[var(--border)] transition-colors"
            title="Gộp"
          >
            <GitMerge className="w-4 h-4 text-[var(--text-secondary)]" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="p-2 rounded-[var(--radius-md)] hover:bg-[var(--danger-light)] transition-colors"
            title="Xoá"
          >
            <Trash2 className="w-4 h-4 text-[var(--text-secondary)]" />
          </button>
        </div>
      </td>
    </tr>
  );
}

// Mobile card component
function MerchantCard({ merchant, onView }: MerchantRowProps) {
  return (
    <Card onClick={onView}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3 flex-1">
          <div className="w-10 h-10 bg-[var(--surface)] rounded-[var(--radius-md)] flex items-center justify-center flex-shrink-0">
            <Store className="w-5 h-5 text-[var(--text-secondary)]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-[var(--text-primary)] truncate">
              {merchant.name}
            </p>
            <p className="text-xs text-[var(--text-secondary)]">
              {merchant.categoryName || (
                <span className="italic text-[var(--text-tertiary)]">Chưa đặt danh mục</span>
              )}
            </p>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-[var(--text-tertiary)] flex-shrink-0" />
      </div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-[var(--text-tertiary)]">
          Sử dụng lần cuối: {merchant.lastUsed}
        </span>
        <span className="text-[var(--text-secondary)] font-medium tabular-nums">
          {merchant.usageCount} lần
        </span>
      </div>
    </Card>
  );
}

export default function MerchantsList() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [merchantToDelete, setMerchantToDelete] = useState<DisplayMerchant | null>(null);
  const [mergeModalOpen, setMergeModalOpen] = useState(false);
  const [merchantToMerge, setMerchantToMerge] = useState<DisplayMerchant | null>(null);
  const [mergeTargetId, setMergeTargetId] = useState<string>('');
  const [sortBy, setSortBy] = useState<'name' | 'usage' | 'lastUsed'>('usage');
  const [selectedMerchants, setSelectedMerchants] = useState<Set<string>>(new Set());
  const [bulkDeleteModalOpen, setBulkDeleteModalOpen] = useState(false);

  const { merchants, categories, deleteMerchant, transactions, updateTransaction } = useDemoData();
  const nav = useAppNavigation();
  const toast = useToast();

  // Build category options for filter dropdown
  const categoryOptions = useMemo(() => {
    const expenseCats = categories.filter(c => c.type === 'expense' && !c.parentId);
    return expenseCats.map(c => ({ value: c.id, label: c.name }));
  }, [categories]);

  // Map DemoDataContext merchants to display merchants
  const displayMerchants: DisplayMerchant[] = useMemo(() => {
    return merchants.map(m => {
      const formattedDate = new Date(m.lastTransaction).toLocaleDateString('vi-VN', {
        day: '2-digit', month: '2-digit', year: 'numeric'
      });
      return {
        id: m.id,
        name: m.name,
        defaultCategory: m.defaultCategory || null,
        categoryName: m.categoryName || null,
        usageCount: m.transactionCount,
        lastUsed: formattedDate,
        lastUsedRaw: m.lastTransaction,
      };
    });
  }, [merchants]);

  const filteredMerchants = displayMerchants.filter((merchant) => {
    const matchesSearch = merchant.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      filterCategory === 'all' ||
      (filterCategory === 'no-default' && !merchant.defaultCategory) ||
      merchant.defaultCategory === filterCategory;
    return matchesSearch && matchesCategory;
  }).sort((a, b) => {
    if (sortBy === 'usage') return b.usageCount - a.usageCount;
    if (sortBy === 'lastUsed') return b.lastUsedRaw.localeCompare(a.lastUsedRaw);
    return a.name.localeCompare(b.name, 'vi');
  });

  const handleEdit = (id: string) => {
    nav.goEditMerchant(id);
  };

  const handleMerge = (id: string) => {
    const merchant = displayMerchants.find(m => m.id === id);
    if (merchant) {
      setMerchantToMerge(merchant);
      setMergeTargetId('');
      setMergeModalOpen(true);
    }
  };

  const confirmMerge = () => {
    if (!merchantToMerge || !mergeTargetId) {
      toast.error('Vui lòng chọn nhà cung cấp đích');
      return;
    }
    // Find all transactions belonging to source merchant and reassign
    const targetMerchant = displayMerchants.find(m => m.id === mergeTargetId);
    const sourceTxns = transactions.filter(t => t.merchantId === merchantToMerge.id);
    sourceTxns.forEach(txn => {
      updateTransaction(txn.id, { merchantId: mergeTargetId, merchant: targetMerchant?.name });
    });
    // Delete source merchant
    deleteMerchant(merchantToMerge.id);
    toast.success(`Đã gộp "${merchantToMerge.name}" vào "${targetMerchant?.name || ''}". ${sourceTxns.length} giao dịch đã được chuyển.`);
    setMergeModalOpen(false);
    setMerchantToMerge(null);
    setMergeTargetId('');
  };

  const handleSetDefault = (id: string) => {
    toast.success('Đã đặt danh mục mặc định cho nhà cung cấp');
  };

  const handleView = (id: string) => {
    nav.goMerchantDetail(id);
  };

  const handleDelete = (merchant: DisplayMerchant) => {
    setMerchantToDelete(merchant);
    setDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (merchantToDelete) {
      deleteMerchant(merchantToDelete.id);
      toast.success(`Đã xoá nhà cung cấp "${merchantToDelete.name}"`);
      setDeleteModalOpen(false);
      setMerchantToDelete(null);
    }
  };

  const handleBulkDelete = () => {
    setBulkDeleteModalOpen(true);
  };

  const confirmBulkDelete = () => {
    selectedMerchants.forEach(id => {
      deleteMerchant(id);
    });
    toast.success(`Đã xoá ${selectedMerchants.size} nhà cung cấp`);
    setBulkDeleteModalOpen(false);
    setSelectedMerchants(new Set());
  };

  const noDefaultCount = displayMerchants.filter((m) => !m.defaultCategory).length;
  const totalUsage = displayMerchants.reduce((sum, m) => sum + m.usageCount, 0);

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="max-w-7xl mx-auto p-4 md:p-6 pb-20 md:pb-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
              Nhà cung cấp
            </h1>
            <p className="text-sm text-[var(--text-secondary)] mt-1">
              Quản lý nhà cung cấp và danh mục mặc định
            </p>
          </div>
          <div className="flex items-center gap-2">
            {displayMerchants.length > 0 && (
              <button
                onClick={() => {
                  if (selectedMerchants.size > 0) {
                    setSelectedMerchants(new Set());
                  } else {
                    setSelectedMerchants(new Set(filteredMerchants.map(m => m.id)));
                  }
                }}
                className="flex items-center gap-2 px-3 py-2.5 border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--surface)] rounded-[var(--radius-lg)] transition-colors"
              >
                {selectedMerchants.size > 0 ? (
                  <XCircle className="w-4 h-4" />
                ) : (
                  <CheckSquare className="w-4 h-4" />
                )}
                <span className="text-sm font-medium hidden md:inline">
                  {selectedMerchants.size > 0 ? 'Bỏ chọn' : 'Chọn'}
                </span>
              </button>
            )}
            <button
              onClick={() => nav.goCreateMerchant()}
              className="flex items-center gap-2 px-4 py-2.5 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white rounded-[var(--radius-lg)] transition-colors shadow-[var(--shadow-sm)]"
            >
              <Plus className="w-5 h-5" />
              <span className="font-medium hidden md:inline">Thêm nhà cung cấp</span>
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <p className="text-sm text-[var(--text-secondary)] mb-1">
              Tổng số nhà cung cấp
            </p>
            <p className="text-2xl font-semibold text-[var(--text-primary)] tabular-nums">
              {displayMerchants.length}
            </p>
          </Card>
          <Card>
            <p className="text-sm text-[var(--text-secondary)] mb-1">
              Chưa đặt danh mục
            </p>
            <p className="text-2xl font-semibold text-[var(--warning)] tabular-nums">
              {noDefaultCount}
            </p>
          </Card>
          <Card>
            <p className="text-sm text-[var(--text-secondary)] mb-1">Tổng sử dụng</p>
            <p className="text-2xl font-semibold text-[var(--text-primary)] tabular-nums">
              {totalUsage}
            </p>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-tertiary)]" />
              <input
                type="text"
                placeholder="Tìm kiếm nhà cung cấp..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-10 py-2.5 bg-[var(--input-background)] border border-[var(--border)] rounded-[var(--radius-lg)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-[var(--radius-sm)] hover:bg-[var(--surface)] transition-colors"
                >
                  <X className="w-4 h-4 text-[var(--text-tertiary)]" />
                </button>
              )}
            </div>

            {/* Category Filter */}
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-4 py-2.5 bg-[var(--input-background)] border border-[var(--border)] rounded-[var(--radius-lg)] text-[var(--text-primary)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]"
            >
              <option value="all">Tất cả danh mục</option>
              <option value="no-default">Chưa đặt danh mục</option>
              {categoryOptions.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>

            {/* Sort */}
            <div className="relative flex-shrink-0">
              <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)] pointer-events-none" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="pl-9 pr-8 py-2.5 bg-[var(--input-background)] border border-[var(--border)] rounded-[var(--radius-lg)] text-sm text-[var(--text-primary)] appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]"
              >
                <option value="usage">Lượt dùng</option>
                <option value="name">Tên A-Z</option>
                <option value="lastUsed">Gần đây</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Merchants List */}
        {filteredMerchants.length > 0 ? (
          <>
            {/* Desktop Table */}
            <Card className="hidden md:block overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[var(--divider)]">
                      <th className="text-left px-6 py-3 text-sm font-medium text-[var(--text-secondary)]">
                        Nhà cung cấp
                      </th>
                      <th className="text-left px-6 py-3 text-sm font-medium text-[var(--text-secondary)]">
                        Danh mục mặc định
                      </th>
                      <th className="text-center px-6 py-3 text-sm font-medium text-[var(--text-secondary)]">
                        Sử dụng
                      </th>
                      <th className="text-right px-6 py-3 text-sm font-medium text-[var(--text-secondary)]">
                        Hành động
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMerchants.map((merchant) => (
                      <MerchantTableRow
                        key={merchant.id}
                        merchant={merchant}
                        onEdit={() => handleEdit(merchant.id)}
                        onMerge={() => handleMerge(merchant.id)}
                        onSetDefault={() => handleSetDefault(merchant.id)}
                        onView={() => handleView(merchant.id)}
                        onDelete={() => handleDelete(merchant)}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Mobile List */}
            <div className="md:hidden space-y-3">
              {filteredMerchants.map((merchant) => (
                <SwipeableRow
                  key={merchant.id}
                  actions={[
                    {
                      icon: <Edit2 className="w-4 h-4" />,
                      label: 'Sửa',
                      color: 'white',
                      bgColor: 'var(--primary)',
                      onClick: () => handleEdit(merchant.id),
                    },
                    {
                      icon: <GitMerge className="w-4 h-4" />,
                      label: 'Gộp',
                      color: 'white',
                      bgColor: 'var(--info)',
                      onClick: () => handleMerge(merchant.id),
                    },
                    {
                      icon: <Trash2 className="w-4 h-4" />,
                      label: 'Xoá',
                      color: 'white',
                      bgColor: 'var(--danger)',
                      onClick: () => handleDelete(merchant),
                    },
                  ]}
                >
                  <MerchantCard
                    merchant={merchant}
                    onEdit={() => handleEdit(merchant.id)}
                    onMerge={() => handleMerge(merchant.id)}
                    onSetDefault={() => handleSetDefault(merchant.id)}
                    onView={() => handleView(merchant.id)}
                    onDelete={() => handleDelete(merchant)}
                  />
                </SwipeableRow>
              ))}
            </div>
          </>
        ) : (
          <Card>
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-[var(--surface)] rounded-full flex items-center justify-center mx-auto mb-4">
                <Store className="w-8 h-8 text-[var(--text-tertiary)]" />
              </div>
              <h3 className="font-semibold text-[var(--text-primary)] mb-2">
                Không tìm thấy nhà cung cấp
              </h3>
              <p className="text-sm text-[var(--text-secondary)]">
                Thử tìm kiếm với từ khoá khác hoặc thay đổi bộ lọc
              </p>
            </div>
          </Card>
        )}

        {/* Floating Bulk Action Bar */}
        {selectedMerchants.size > 0 && (
          <div className="fixed bottom-24 md:bottom-8 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3 px-5 py-3 bg-[var(--card)] border border-[var(--border)] rounded-full shadow-[var(--shadow-lg)]">
            <span className="text-sm font-medium text-[var(--text-primary)] tabular-nums">
              {selectedMerchants.size} đã chọn
            </span>
            <div className="w-px h-5 bg-[var(--divider)]" />
            <button
              onClick={() => setSelectedMerchants(new Set(filteredMerchants.map(m => m.id)))}
              className="text-sm text-[var(--primary)] hover:text-[var(--primary-hover)] font-medium"
            >
              Chọn tất cả
            </button>
            <button
              onClick={() => setSelectedMerchants(new Set())}
              className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-medium"
            >
              Bỏ chọn
            </button>
            <div className="w-px h-5 bg-[var(--divider)]" />
            <button
              onClick={handleBulkDelete}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--danger)] hover:bg-[var(--danger)] text-white rounded-[var(--radius-lg)] text-sm font-medium transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Xoá
            </button>
          </div>
        )}

        <ConfirmationModal
          isOpen={deleteModalOpen}
          onClose={() => { setDeleteModalOpen(false); setMerchantToDelete(null); }}
          onConfirm={confirmDelete}
          title="Xoá nhà cung cấp?"
          description={`Bạn có chắc muốn xoá nhà cung cấp "${merchantToDelete?.name || ''}"? Hành động này không thể hoàn tác.`}
          confirmLabel="Xoá"
          cancelLabel="Huỷ"
          isDangerous={true}
        />

        <ConfirmationModal
          isOpen={mergeModalOpen}
          onClose={() => { setMergeModalOpen(false); setMerchantToMerge(null); setMergeTargetId(''); }}
          onConfirm={confirmMerge}
          title="Gộp nhà cung cấp?"
          description={`Bạn có chắc muốn gộp "${merchantToMerge?.name || ''}" vào nhà cung cấp khác? Hành động này không thể hoàn tác.`}
          confirmLabel="Gộp"
          cancelLabel="Huỷ"
          isDangerous={true}
        >
          <div className="flex flex-col gap-4">
            <p className="text-sm text-[var(--text-secondary)]">Chọn nhà cung cấp đích:</p>
            <select
              value={mergeTargetId}
              onChange={(e) => setMergeTargetId(e.target.value)}
              className="px-4 py-2.5 bg-[var(--input-background)] border border-[var(--border)] rounded-[var(--radius-lg)] text-[var(--text-primary)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]"
            >
              <option value="">Chọn nhà cung cấp</option>
              {displayMerchants.filter(m => m.id !== merchantToMerge?.id).map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>
        </ConfirmationModal>

        <ConfirmationModal
          isOpen={bulkDeleteModalOpen}
          onClose={() => { setBulkDeleteModalOpen(false); setSelectedMerchants(new Set()); }}
          onConfirm={confirmBulkDelete}
          title="Xoá nhiều nhà cung cấp?"
          description={`Bạn có chắc muốn xoá ${selectedMerchants.size} nhà cung cấp đã chọn? Hành động này không thể hoàn tác.`}
          confirmLabel="Xoá"
          cancelLabel="Huỷ"
          isDangerous={true}
        />
      </div>
    </div>
  );
}
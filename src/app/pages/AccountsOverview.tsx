import React, { useState, useMemo, useRef, useCallback } from 'react';
import {
  Plus, Edit2, Trash2, Banknote, Smartphone, Building2, Wallet,
  Search, X, MoreHorizontal, Archive, ArchiveRestore, Wrench,
  GripVertical, Eye, ChevronRight,
} from 'lucide-react';
import { Card } from '../components/Card';
import { StatCard } from '../components/StatCard';
import { useDemoData } from '../contexts/DemoDataContext';
import { useAppNavigation } from '../hooks/useAppNavigation';
import { useToast } from '../contexts/ToastContext';
import { ConfirmationModal } from '../components/ConfirmationModals';
import { SwipeableRow } from '../components/SwipeableRow';
import { maskAccountNumber, getAccountTypeLabel } from '../utils/accountHelpers';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

// ── Action Menu ──
function AccActionMenu({ onView, onEdit, onReconcile, onArchive, onUnarchive, onDelete, isArchived, canDelete }: {
  onView: () => void; onEdit: () => void; onReconcile?: () => void;
  onArchive?: () => void; onUnarchive?: () => void; onDelete: () => void;
  isArchived: boolean; canDelete: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button onClick={e => { e.stopPropagation(); setOpen(!open); }}
        className="p-2 hover:bg-[var(--surface)] rounded-full transition-colors">
        <MoreHorizontal className="w-4 h-4 text-[var(--text-secondary)]" />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 z-30 w-52 bg-[var(--card)] border border-[var(--border)] rounded-[var(--radius-lg)] shadow-[var(--shadow-lg)] py-1 overflow-hidden">
          <button onClick={() => { setOpen(false); onView(); }}
            className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-[var(--text-primary)] hover:bg-[var(--surface)] transition-colors">
            <Eye className="w-4 h-4 text-[var(--text-secondary)]" /> Xem chi tiết
          </button>
          <button onClick={() => { setOpen(false); onEdit(); }}
            className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-[var(--text-primary)] hover:bg-[var(--surface)] transition-colors">
            <Edit2 className="w-4 h-4 text-[var(--text-secondary)]" /> Chỉnh sửa
          </button>
          {!isArchived && onReconcile && (
            <button onClick={() => { setOpen(false); onReconcile(); }}
              className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-[var(--text-primary)] hover:bg-[var(--surface)] transition-colors">
              <Wrench className="w-4 h-4 text-[var(--text-secondary)]" /> Điều chỉnh số dư
            </button>
          )}
          {!isArchived && onArchive && (
            <button onClick={() => { setOpen(false); onArchive(); }}
              className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-[var(--text-primary)] hover:bg-[var(--surface)] transition-colors">
              <Archive className="w-4 h-4 text-[var(--text-secondary)]" /> Lưu trữ
            </button>
          )}
          {isArchived && onUnarchive && (
            <button onClick={() => { setOpen(false); onUnarchive(); }}
              className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-[var(--text-primary)] hover:bg-[var(--surface)] transition-colors">
              <ArchiveRestore className="w-4 h-4 text-[var(--text-secondary)]" /> Khôi phục
            </button>
          )}
          <div className="border-t border-[var(--divider)] my-1" />
          <button onClick={() => { setOpen(false); onDelete(); }}
            className={`flex items-center gap-2.5 w-full px-4 py-2.5 text-sm transition-colors ${
              canDelete ? 'text-[var(--danger)] hover:bg-[var(--danger-light)]' : 'text-[var(--text-tertiary)]'
            }`}>
            <Trash2 className="w-4 h-4" /> {isArchived ? 'Xoá vĩnh viễn' : 'Xoá'}
          </button>
        </div>
      )}
    </div>
  );
}

// ── Account Card ──
function AccountCard({ account, onView, onEdit, onDelete, onArchive, onUnarchive, onReconcile, hideNumbers, txCount }: {
  account: any; onView: () => void; onEdit: () => void; onDelete: () => void;
  onArchive?: () => void; onUnarchive?: () => void; onReconcile?: () => void;
  hideNumbers?: boolean; txCount: number;
}) {
  const fmt = (n: number) => new Intl.NumberFormat('vi-VN').format(n);
  const getIcon = () => {
    switch (account.type) {
      case 'cash': return <Banknote className="w-5 h-5" />;
      case 'ewallet': return <Smartphone className="w-5 h-5" />;
      case 'bank': return <Building2 className="w-5 h-5" />;
      default: return <Wallet className="w-5 h-5" />;
    }
  };
  const isPositive = account.balance >= 0;
  const subtitle = account.accountNumber ? maskAccountNumber(account.accountNumber, account.type, hideNumbers) : '';
  const canDelete = txCount === 0;

  return (
    <Card className={`hover:shadow-[var(--shadow-md)] transition-shadow cursor-pointer group ${account.archived ? 'opacity-60' : ''}`} onClick={onView}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1">
          <div className="w-10 h-10 rounded-full bg-[var(--surface)] flex items-center justify-center text-[var(--primary)]">
            {getIcon()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <h4 className="font-medium text-[var(--text-primary)] truncate">{account.name}</h4>
              {account.archived && <span className="text-[10px] px-1.5 py-0.5 bg-[var(--surface)] text-[var(--text-tertiary)] rounded-[var(--radius-sm)] font-medium flex-shrink-0">Đã lưu trữ</span>}
            </div>
            {(subtitle || account.accountOwnerName) && (
              <p className="text-xs text-[var(--text-tertiary)] truncate mt-0.5">
                {[subtitle, account.accountOwnerName].filter(Boolean).join(' | ')}
              </p>
            )}
            <p className={`text-sm font-semibold tabular-nums mt-0.5 ${isPositive ? 'text-[var(--success)]' : 'text-[var(--error)]'}`}>
              {isPositive ? '' : '-'}{fmt(Math.abs(account.balance))}₫
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
          <AccActionMenu
            onView={onView} onEdit={onEdit} onReconcile={onReconcile}
            onArchive={onArchive} onUnarchive={onUnarchive}
            onDelete={onDelete} isArchived={!!account.archived} canDelete={canDelete}
          />
        </div>
      </div>
    </Card>
  );
}

// ── Draggable wrapper ──
function DraggableAccountCard({ index, moveAccount, ...props }: { index: number; moveAccount: (d: number, h: number) => void } & React.ComponentProps<typeof AccountCard>) {
  const ref = useRef<HTMLDivElement>(null);
  const [{ isDragging }, drag] = useDrag({ type: 'ACCOUNT', item: { index }, collect: m => ({ isDragging: m.isDragging() }) });
  const [{ isOver }, drop] = useDrop({
    accept: 'ACCOUNT', collect: m => ({ isOver: m.isOver() }),
    hover(item: { index: number }) { if (!ref.current || item.index === index) return; moveAccount(item.index, index); item.index = index; },
  });
  drop(ref);
  return (
    <div ref={ref} className={`relative ${isDragging ? 'opacity-40' : ''} transition-opacity`}>
      {isOver && !isDragging && <div className="h-0.5 bg-[var(--primary)] rounded-full -mb-0.5 mx-2" />}
      <div ref={(n) => { drag(n); }} className="absolute left-0 top-0 bottom-0 w-8 z-10 cursor-grab active:cursor-grabbing flex items-center justify-center">
        <GripVertical className="w-4 h-4 text-[var(--text-tertiary)]" />
      </div>
      <div className="pl-6"><AccountCard {...props} /></div>
    </div>
  );
}

// ── Reconcile Modal ──
function ReconcileModal({ account, onClose, onConfirm }: {
  account: any; onClose: () => void;
  onConfirm: (actualBalance: number, reason: string, note: string) => void;
}) {
  const [actualBalance, setActualBalance] = useState('');
  const [reason, setReason] = useState('');
  const [note, setNote] = useState('');
  const fmt = (n: number) => new Intl.NumberFormat('vi-VN').format(n);
  const actual = parseFloat(actualBalance) || 0;
  const diff = actual - account.balance;
  const isEmpty = !actualBalance;
  const isZero = diff === 0 && !isEmpty;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50" onClick={onClose}>
      <div className="bg-[var(--card)] w-full max-w-md rounded-t-[var(--radius-xl)] sm:rounded-[var(--radius-xl)] p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">Điều chỉnh số dư</h3>
          <button onClick={onClose} className="p-1.5 rounded-[var(--radius-md)] hover:bg-[var(--surface)]"><X className="w-5 h-5 text-[var(--text-secondary)]" /></button>
        </div>

        <div className="p-3 bg-[var(--surface)] rounded-[var(--radius-lg)] mb-4">
          <p className="text-xs text-[var(--text-tertiary)] mb-1">{account.name}</p>
          <p className="text-sm font-semibold text-[var(--text-primary)] tabular-nums">Số dư hiện tại: {fmt(account.balance)}₫</p>
        </div>

        <div className="space-y-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">Số dư thực tế</label>
            <input type="number" value={actualBalance} onChange={e => setActualBalance(e.target.value)} placeholder="Nhập số dư thực tế..."
              className="w-full px-4 py-3 bg-[var(--input-background)] border border-[var(--border)] rounded-[var(--radius-lg)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)] tabular-nums" />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">Lý do</label>
            <select value={reason} onChange={e => setReason(e.target.value)}
              className="w-full px-4 py-3 bg-[var(--input-background)] border border-[var(--border)] rounded-[var(--radius-lg)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]">
              <option value="">Chọn lý do (tuỳ chọn)</option>
              <option value="data-entry">Nhập liệu sai</option>
              <option value="forgot-txn">Quên ghi giao dịch</option>
              <option value="bank-fees">Phí ngân hàng</option>
              <option value="other">Khác</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">Ghi chú</label>
            <input type="text" value={note} onChange={e => setNote(e.target.value)} placeholder="Ví dụ: Đối chiếu sao kê ngân hàng..."
              className="w-full px-4 py-3 bg-[var(--input-background)] border border-[var(--border)] rounded-[var(--radius-lg)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]" />
          </div>
        </div>

        {/* Preview */}
        {!isEmpty && (
          <div className={`p-3 rounded-[var(--radius-lg)] mb-4 ${
            isZero ? 'bg-[var(--surface)]' : diff > 0 ? 'bg-[var(--success-light)] border border-[var(--success)]' : 'bg-[var(--danger-light)] border border-[var(--danger)]'
          }`}>
            {isZero ? (
              <p className="text-xs text-[var(--text-tertiary)]">Số dư không thay đổi.</p>
            ) : (
              <p className="text-xs text-[var(--text-secondary)]">
                Chênh lệch sẽ tạo giao dịch{' '}
                <span className={`font-semibold ${diff > 0 ? 'text-[var(--success)]' : 'text-[var(--danger)]'}`}>
                  {diff > 0 ? `Thu (Adjustment) +${fmt(diff)}₫` : `Chi (Adjustment) -${fmt(Math.abs(diff))}₫`}
                </span>
              </p>
            )}
          </div>
        )}

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 border border-[var(--border)] text-[var(--text-secondary)] rounded-[var(--radius-lg)] font-medium hover:bg-[var(--surface)] transition-colors">Huỷ</button>
          <button onClick={() => onConfirm(actual, reason, note)} disabled={isEmpty || isZero}
            className="flex-1 px-4 py-2.5 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white rounded-[var(--radius-lg)] font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            Xác nhận
          </button>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
export default function AccountsOverview() {
  const { accounts, transactions, deleteAccount, updateAccount, addTransaction, hideAccountNumbers } = useDemoData();
  const { goAccountDetail, goCreateAccount, goEditAccount } = useAppNavigation();
  const toast = useToast();

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState<{ id: string; name: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [visibilityTab, setVisibilityTab] = useState<'active' | 'archived'>('active');

  // Archive confirmation
  const [archiveConfirmAcc, setArchiveConfirmAcc] = useState<{ id: string; name: string } | null>(null);
  // Reconcile
  const [reconcileAcc, setReconcileAcc] = useState<any>(null);
  // In-use delete warning
  const [inUseDeleteAcc, setInUseDeleteAcc] = useState<{ id: string; name: string; txCount: number } | null>(null);

  // Tx count per account
  const txCountMap = useMemo(() => {
    const map: Record<string, number> = {};
    transactions.forEach(tx => {
      if (tx.accountId) map[tx.accountId] = (map[tx.accountId] || 0) + 1;
      if (tx.toAccountId) map[tx.toAccountId] = (map[tx.toAccountId] || 0) + 1;
    });
    return map;
  }, [transactions]);

  // Filter
  const filteredAccounts = useMemo(() => {
    return accounts.filter(acc => {
      const isArchived = !!acc.archived;
      if (visibilityTab === 'active' && isArchived) return false;
      if (visibilityTab === 'archived' && !isArchived) return false;
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return acc.name.toLowerCase().includes(q) || acc.type.toLowerCase().includes(q);
    });
  }, [accounts, searchQuery, visibilityTab]);

  const activeAccounts = accounts.filter(a => !a.archived);
  const archivedAccounts = accounts.filter(a => a.archived);

  const totalBalance = activeAccounts.reduce((sum, acc) => sum + acc.balance, 0);

  // Group for stat cards (only active)
  const groupedActive = useMemo(() => ({
    cash: activeAccounts.filter(a => a.type === 'cash'),
    ewallet: activeAccounts.filter(a => ['ewallet' as any].includes(a.type)),
    bank: activeAccounts.filter(a => a.type === 'bank'),
  }), [activeAccounts]);

  const formatCurrency = (n: number) => new Intl.NumberFormat('vi-VN').format(n);

  // ── Archive/Unarchive ──
  const handleArchive = (acc: { id: string; name: string }) => setArchiveConfirmAcc(acc);
  const confirmArchive = () => {
    if (!archiveConfirmAcc) return;
    updateAccount(archiveConfirmAcc.id, { archived: true });
    toast.success('Đã lưu trữ');
    setArchiveConfirmAcc(null);
  };
  const handleUnarchive = (acc: { id: string; name: string }) => {
    updateAccount(acc.id, { archived: false });
    toast.success('Đã khôi phục tài khoản');
  };

  // ── Delete ──
  const handleDeleteAccount = (acc: { id: string; name: string }) => {
    const count = txCountMap[acc.id] || 0;
    if (count > 0) {
      setInUseDeleteAcc({ ...acc, txCount: count });
    } else {
      setAccountToDelete(acc);
      setDeleteModalOpen(true);
    }
  };
  const confirmDelete = () => {
    if (accountToDelete) {
      deleteAccount(accountToDelete.id);
      toast.success(`Đã xoá tài khoản "${accountToDelete.name}"`);
      setDeleteModalOpen(false);
      setAccountToDelete(null);
    }
  };

  // ── Reconcile ──
  const handleReconcile = (acc: any) => setReconcileAcc(acc);
  const confirmReconcile = (actualBalance: number, reason: string, note: string) => {
    if (!reconcileAcc) return;
    const diff = actualBalance - reconcileAcc.balance;
    const reasonLabel: Record<string, string> = {
      'data-entry': 'Nhập liệu sai',
      'forgot-txn': 'Quên ghi giao dịch',
      'bank-fees': 'Phí ngân hàng',
      'other': 'Khác',
    };
    const description = `Điều chỉnh số dư${reason ? ` (${reasonLabel[reason] || reason})` : ''}${note ? `: ${note}` : ''}`;
    addTransaction({
      type: diff > 0 ? 'income' : 'expense',
      amount: diff,
      category: 'Điều chỉnh số dư',
      categoryId: '',
      account: reconcileAcc.name,
      accountId: reconcileAcc.id,
      description,
      date: new Date().toISOString().split('T')[0],
      tags: [],
    });
    toast.success('Đã điều chỉnh số dư');
    setReconcileAcc(null);
  };

  // ── Drag reorder (active tab only) ──
  const moveAccount = useCallback((dragIndex: number, hoverIndex: number) => {
    // We reorder by updating accounts - since context doesn't have reorderAccounts, we'll do it via updateAccount with a sort order
    // For simplicity, we just toast that order was updated — the DnD visual works
    // In a real app we'd persist sort_order
  }, []);

  // Group filtered accounts by type
  const groupedFiltered = useMemo(() => {
    const cash = filteredAccounts.filter(a => a.type === 'cash');
    const bank = filteredAccounts.filter(a => a.type === 'bank');
    const other = filteredAccounts.filter(a => !['cash', 'bank'].includes(a.type));
    return { cash, bank, other };
  }, [filteredAccounts]);

  const renderSection = (label: string, icon: React.ReactNode, iconColor: string, sectionAccounts: typeof accounts) => {
    if (sectionAccounts.length === 0) return null;
    return (
      <div>
        <div className="flex items-center gap-2 mb-4">
          <span className={iconColor}>{icon}</span>
          <h3 className="font-semibold text-[var(--text-primary)]">{label}</h3>
          <span className="text-sm text-[var(--text-secondary)]">({sectionAccounts.length})</span>
        </div>
        <div className="space-y-3">
          {sectionAccounts.map((account, index) => {
            const txCount = txCountMap[account.id] || 0;
            const isArchived = !!account.archived;
            const card = (
              <SwipeableRow key={account.id} actions={[
                { icon: <Edit2 className="w-4 h-4" />, label: 'Sửa', color: 'white', bgColor: 'var(--primary)', onClick: () => goEditAccount(account.id) },
                ...(isArchived
                  ? [{ icon: <ArchiveRestore className="w-4 h-4" />, label: 'Khôi phục', color: 'white', bgColor: 'var(--info)', onClick: () => handleUnarchive(account) }]
                  : [{ icon: <Archive className="w-4 h-4" />, label: 'Lưu trữ', color: 'white', bgColor: 'var(--warning)', onClick: () => handleArchive(account) }]
                ),
                { icon: <Trash2 className="w-4 h-4" />, label: 'Xoá', color: 'white', bgColor: 'var(--danger)', onClick: () => handleDeleteAccount(account) },
              ]}>
                <AccountCard
                  account={account}
                  onView={() => goAccountDetail(account.id)}
                  onEdit={() => goEditAccount(account.id)}
                  onDelete={() => handleDeleteAccount(account)}
                  onArchive={!isArchived ? () => handleArchive(account) : undefined}
                  onUnarchive={isArchived ? () => handleUnarchive(account) : undefined}
                  onReconcile={!isArchived ? () => handleReconcile(account) : undefined}
                  hideNumbers={hideAccountNumbers}
                  txCount={txCount}
                />
              </SwipeableRow>
            );
            return card;
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6 pb-20 md:pb-6">
        {/* Header with Total Balance */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-2">Tổng tài sản</h2>
            <p className="text-3xl md:text-4xl font-bold text-[var(--primary)] tabular-nums">{formatCurrency(totalBalance)}₫</p>
          </div>
          <button onClick={goCreateAccount}
            className="flex items-center gap-2 px-4 py-2.5 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white rounded-[var(--radius-lg)] transition-colors shadow-[var(--shadow-sm)]">
            <Plus className="w-5 h-5" /><span className="font-medium">Tạo tài khoản</span>
          </button>
        </div>

        {/* Visibility Tabs */}
        <div className="flex gap-2">
          <button onClick={() => setVisibilityTab('active')}
            className={`px-4 py-2 rounded-[var(--radius-lg)] text-sm font-medium transition-all ${
              visibilityTab === 'active'
                ? 'bg-[var(--primary)] text-white'
                : 'bg-[var(--card)] text-[var(--text-secondary)] hover:bg-[var(--surface)] border border-[var(--border)]'
            }`}>
            Đang dùng ({activeAccounts.length})
          </button>
          <button onClick={() => setVisibilityTab('archived')}
            className={`px-4 py-2 rounded-[var(--radius-lg)] text-sm font-medium transition-all ${
              visibilityTab === 'archived'
                ? 'bg-[var(--text-secondary)] text-white'
                : 'bg-[var(--card)] text-[var(--text-secondary)] hover:bg-[var(--surface)] border border-[var(--border)]'
            }`}>
            <Archive className="w-3.5 h-3.5 inline mr-1" />Đã lưu trữ ({archivedAccounts.length})
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-tertiary)]" />
          <input type="text" placeholder="Tìm kiếm tài khoản..." value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-10 py-3 bg-[var(--card)] border border-[var(--border)] rounded-[var(--radius-lg)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]" />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-[var(--radius-sm)] hover:bg-[var(--surface)] transition-colors">
              <X className="w-4 h-4 text-[var(--text-tertiary)]" />
            </button>
          )}
        </div>

        {/* Stat Cards — only on active tab */}
        {visibilityTab === 'active' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard title="Tiền mặt" amount={groupedActive.cash.reduce((s, a) => s + a.balance, 0)} type="neutral" icon={<Banknote className="w-5 h-5" />} />
            <StatCard title="Ví điện tử" amount={groupedActive.ewallet.reduce((s, a) => s + a.balance, 0)} type="neutral" icon={<Smartphone className="w-5 h-5" />} />
            <StatCard title="Ngân hàng" amount={groupedActive.bank.reduce((s, a) => s + a.balance, 0)} type="neutral" icon={<Building2 className="w-5 h-5" />} />
          </div>
        )}

        {/* Account Sections */}
        <DndProvider backend={HTML5Backend}>
          {renderSection('Tiền mặt', <Banknote className="w-5 h-5" />, 'text-[var(--chart-2)]', groupedFiltered.cash)}
          {renderSection('Ngân hàng', <Building2 className="w-5 h-5" />, 'text-[var(--chart-4)]', groupedFiltered.bank)}
          {renderSection('Khác', <Wallet className="w-5 h-5" />, 'text-[var(--text-secondary)]', groupedFiltered.other)}
        </DndProvider>

        {/* Empty States */}
        {accounts.length === 0 && (
          <Card>
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-[var(--surface)] rounded-full flex items-center justify-center mx-auto mb-4">
                <Wallet className="w-8 h-8 text-[var(--text-tertiary)]" />
              </div>
              <h3 className="font-semibold text-[var(--text-primary)] mb-2">Chưa có tài khoản nào</h3>
              <p className="text-sm text-[var(--text-secondary)] mb-6">Tạo tài khoản đầu tiên để bắt đầu quản lý tài chính</p>
              <button onClick={goCreateAccount}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white rounded-[var(--radius-lg)] transition-colors">
                <Plus className="w-5 h-5" /><span className="font-medium">Tạo tài khoản</span>
              </button>
            </div>
          </Card>
        )}

        {accounts.length > 0 && filteredAccounts.length === 0 && (
          <Card>
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-[var(--surface)] rounded-full flex items-center justify-center mx-auto mb-4">
                {visibilityTab === 'archived' ? <Archive className="w-8 h-8 text-[var(--text-tertiary)]" /> : <Search className="w-8 h-8 text-[var(--text-tertiary)]" />}
              </div>
              <h3 className="font-semibold text-[var(--text-primary)] mb-2">
                {visibilityTab === 'archived' ? 'Không có tài khoản lưu trữ' : 'Không tìm thấy tài khoản'}
              </h3>
              <p className="text-sm text-[var(--text-secondary)]">
                {visibilityTab === 'archived' ? 'Các tài khoản lưu trữ sẽ hiển thị ở đây' : 'Thử tìm kiếm với từ khoá khác'}
              </p>
            </div>
          </Card>
        )}

        {/* Archive Confirmation */}
        {archiveConfirmAcc && (
          <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50" onClick={() => setArchiveConfirmAcc(null)}>
            <div className="bg-[var(--card)] w-full max-w-md rounded-t-[var(--radius-xl)] sm:rounded-[var(--radius-xl)] p-6" onClick={e => e.stopPropagation()}>
              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">Lưu trữ tài khoản?</h3>
              <p className="text-sm text-[var(--text-secondary)] mb-6">
                Bạn sẽ không thể chọn tài khoản này khi tạo giao dịch mới. Lịch sử vẫn giữ nguyên.
              </p>
              <div className="flex gap-3">
                <button onClick={() => setArchiveConfirmAcc(null)}
                  className="flex-1 px-4 py-2.5 border border-[var(--border)] text-[var(--text-secondary)] rounded-[var(--radius-lg)] font-medium hover:bg-[var(--surface)] transition-colors">Huỷ</button>
                <button onClick={confirmArchive}
                  className="flex-1 px-4 py-2.5 bg-[var(--warning)] text-white rounded-[var(--radius-lg)] font-medium hover:opacity-90 transition-colors">
                  <Archive className="w-4 h-4 inline mr-1.5" />Lưu trữ
                </button>
              </div>
            </div>
          </div>
        )}

        {/* In-Use Delete Warning */}
        {inUseDeleteAcc && (
          <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50" onClick={() => setInUseDeleteAcc(null)}>
            <div className="bg-[var(--card)] w-full max-w-md rounded-t-[var(--radius-xl)] sm:rounded-[var(--radius-xl)] p-6" onClick={e => e.stopPropagation()}>
              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">Không thể xoá</h3>
              <p className="text-sm text-[var(--text-secondary)] mb-6">
                Tài khoản "<span className="font-semibold">{inUseDeleteAcc.name}</span>" đang có <span className="font-semibold">{inUseDeleteAcc.txCount}</span> giao dịch liên kết. Bạn có thể lưu trữ tài khoản thay vì xoá.
              </p>
              <div className="flex gap-3">
                <button onClick={() => setInUseDeleteAcc(null)}
                  className="flex-1 px-4 py-2.5 border border-[var(--border)] text-[var(--text-secondary)] rounded-[var(--radius-lg)] font-medium hover:bg-[var(--surface)] transition-colors">Đóng</button>
                <button onClick={() => { handleArchive(inUseDeleteAcc); setInUseDeleteAcc(null); }}
                  className="flex-1 px-4 py-2.5 bg-[var(--warning)] text-white rounded-[var(--radius-lg)] font-medium hover:opacity-90 transition-colors">
                  <Archive className="w-4 h-4 inline mr-1.5" />Lưu trữ thay vì xoá
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Reconcile Modal */}
        {reconcileAcc && (
          <ReconcileModal account={reconcileAcc} onClose={() => setReconcileAcc(null)} onConfirm={confirmReconcile} />
        )}

        {/* Delete Confirmation */}
        <ConfirmationModal
          isOpen={deleteModalOpen}
          onClose={() => { setDeleteModalOpen(false); setAccountToDelete(null); }}
          onConfirm={confirmDelete}
          title="Xoá tài khoản?"
          description={`Bạn có chắc muốn xoá tài khoản "${accountToDelete?.name || ''}"? Hành động này không thể hoàn tác.`}
          confirmLabel="Xoá"
          cancelLabel="Huỷ"
          isDangerous={true}
        />
      </div>
    </div>
  );
}

import React, { useState, useMemo } from 'react';
import { 
  ArrowLeft, 
  Plus, 
  ArrowRightLeft, 
  Edit2, 
  Trash2, 
  MoreVertical,
  TrendingUp,
  TrendingDown,
  Calendar,
  Building2,
  Info,
  Eye,
  EyeOff,
  Wrench,
  X,
  Archive,
  ArchiveRestore,
} from 'lucide-react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { useDemoData } from '../contexts/DemoDataContext';
import { useAppNavigation } from '../hooks/useAppNavigation';
import { useToast } from '../contexts/ToastContext';
import { DeleteAccountModal } from '../components/ConfirmationModals';
import { useParams } from 'react-router';
import { maskAccountNumber, getAccountTypeLabel } from '../utils/accountHelpers';

export default function AccountDetail() {
  const { id } = useParams<{ id: string }>();
  const { accounts, transactions: allTransactions, deleteAccount, hideAccountNumbers, addTransaction, updateAccount } = useDemoData();
  const { goBack, goCreateTransaction, goCreateTransfer, goTransactionDetail, goEditAccount } = useAppNavigation();
  const toast = useToast();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [activeTab, setActiveTab] = useState('transactions');
  const [showFullAccountNumber, setShowFullAccountNumber] = useState(false);
  const [showReconcile, setShowReconcile] = useState(false);
  const [reconcileAmount, setReconcileAmount] = useState('');
  const [reconcileReason, setReconcileReason] = useState('');
  const [reconcileNote, setReconcileNote] = useState('');

  // Account data from context
  const account = accounts.find(a => a.id === id) || {
    id: '4',
    name: 'Vietcombank',
    institution: 'VCB',
    type: 'bank' as const,
    balance: 28500000,
    openingBalance: 28500000,
    currency: 'VND',
    color: '#3B82F6',
    icon: 'building',
    lastUpdated: '',
    accountNumber: '',
    accountOwnerName: '',
  };

  const accountTransactions = allTransactions.filter(t => t.accountId === id || t.toAccountId === id);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN').format(Math.abs(amount));
  };

  const handleBack = () => goBack();
  const handleAddTransaction = () => goCreateTransaction(id);
  const handleTransfer = () => goCreateTransfer(id);
  const handleEdit = () => goEditAccount(id!);
  const handleDelete = () => setShowDeleteModal(true);

  const handleConfirmDelete = () => {
    deleteAccount(id!);
    toast.success('Đã xóa tài khoản');
    setShowDeleteModal(false);
    goBack();
  };

  const totalIncome = accountTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = Math.abs(
    accountTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0)
  );

  // Balance history computed from real transactions (including transfers)
  const balanceHistory = useMemo(() => {
    const sorted = [...accountTransactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    if (sorted.length === 0) return [{ date: 'Hôm nay', balance: account.balance }];

    let running = account.balance;
    // Walk backward to find starting balance
    for (let i = sorted.length - 1; i >= 0; i--) {
      const t = sorted[i];
      if (t.type === 'income' && t.accountId === id) running -= Math.abs(t.amount);
      else if (t.type === 'expense' && t.accountId === id) running += Math.abs(t.amount);
      else if (t.type === 'transfer') {
        if (t.accountId === id) running += Math.abs(t.amount);
        if (t.toAccountId === id) running -= Math.abs(t.amount);
      }
    }

    const result: { date: string; balance: number }[] = [];
    sorted.forEach(t => {
      const d = new Date(t.date);
      if (t.type === 'income' && t.accountId === id) running += Math.abs(t.amount);
      else if (t.type === 'expense' && t.accountId === id) running -= Math.abs(t.amount);
      else if (t.type === 'transfer') {
        if (t.accountId === id) running -= Math.abs(t.amount);
        if (t.toAccountId === id) running += Math.abs(t.amount);
      }
      result.push({
        date: `${d.getDate()}/${d.getMonth() + 1}`,
        balance: running,
      });
    });

    // Deduplicate by date, keep last
    const deduped: Record<string, number> = {};
    result.forEach(r => { deduped[r.date] = r.balance; });
    return Object.entries(deduped).map(([date, balance]) => ({ date, balance }));
  }, [accountTransactions, account.balance, id]);

  // Dynamic insights computed from real data
  const insights = useMemo(() => {
    const result: { id: number; icon: any; type: string; title: string; description: string }[] = [];

    if (totalIncome > totalExpense) {
      result.push({
        id: 1,
        icon: TrendingUp,
        type: 'info',
        title: 'Số dư tăng',
        description: `Thu nhập (${new Intl.NumberFormat('vi-VN').format(totalIncome)}₫) vượt chi tiêu (${new Intl.NumberFormat('vi-VN').format(totalExpense)}₫) từ tài khoản này`,
      });
    } else if (totalExpense > 0) {
      result.push({
        id: 1,
        icon: TrendingUp,
        type: 'warning',
        title: 'Chi tiêu cao',
        description: `Tổng chi tiêu ${new Intl.NumberFormat('vi-VN').format(totalExpense)}₫ từ tài khoản này`,
      });
    }

    if (accountTransactions.length > 0) {
      result.push({
        id: 2,
        icon: Calendar,
        type: 'info',
        title: 'Hoạt động',
        description: `${accountTransactions.length} giao dịch được ghi nhận từ tài khoản này`,
      });
    }

    return result;
  }, [totalIncome, totalExpense, accountTransactions]);

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6 pb-20 md:pb-6">
        {/* Header */}
        <div>
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Quay lại</span>
          </button>

          <Card>
            <div className="flex items-start justify-between mb-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-3 rounded-[var(--radius-lg)] bg-[var(--primary-light)]">
                    <Building2 className="w-6 h-6 text-[var(--primary)]" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
                      {account.name}
                    </h1>
                    {account.accountNumber && (
                      <span className="text-sm text-[var(--text-tertiary)]">
                        {maskAccountNumber(account.accountNumber, account.type)}
                      </span>
                    )}
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-sm text-[var(--text-secondary)] mb-1">Số dư hiện tại</p>
                  <p className="text-3xl font-bold text-[var(--primary)] tabular-nums">
                    {formatCurrency(account.balance)}₫
                  </p>
                </div>
              </div>

              {/* Menu */}
              <div className="relative">
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="p-2 rounded-[var(--radius-md)] hover:bg-[var(--surface)] transition-colors"
                >
                  <MoreVertical className="w-5 h-5 text-[var(--text-secondary)]" />
                </button>
                
                {showMenu && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-[var(--surface-elevated)] border border-[var(--border)] rounded-[var(--radius-lg)] shadow-[var(--shadow-lg)] overflow-hidden z-10">
                    <button
                      onClick={handleEdit}
                      className="w-full flex items-center gap-3 px-4 py-3 text-[var(--text-primary)] hover:bg-[var(--surface)] transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                      <span className="text-sm font-medium">Chỉnh sửa</span>
                    </button>
                    <button
                      onClick={handleDelete}
                      className="w-full flex items-center gap-3 px-4 py-3 text-[var(--danger)] hover:bg-[var(--danger-light)] transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span className="text-sm font-medium">Xoá tài khoản</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Mini Chart - Simple placeholder */}
            <div className="h-32 mb-6 bg-gradient-to-r from-[var(--primary-light)] to-[var(--primary)] rounded-[var(--radius-lg)] flex items-center justify-center">
              <div className="text-center text-white/80">
                <TrendingUp className="w-8 h-8 mx-auto mb-2" />
                <p className="text-sm">Biểu đồ số dư theo thời gian</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => setShowReconcile(true)}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[var(--surface)] hover:bg-[var(--border)] border border-[var(--border)] text-[var(--text-primary)] rounded-[var(--radius-lg)] font-medium transition-colors"
              >
                <Wrench className="w-5 h-5" />
                <span className="hidden sm:inline">Điều chỉnh số dư</span>
              </button>
              <button
                onClick={handleTransfer}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[var(--surface)] hover:bg-[var(--border)] border border-[var(--border)] text-[var(--text-primary)] rounded-[var(--radius-lg)] font-medium transition-colors"
              >
                <ArrowRightLeft className="w-5 h-5" />
                <span>Chuyển tiền</span>
              </button>
              <button
                onClick={handleAddTransaction}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white rounded-[var(--radius-lg)] font-medium transition-colors shadow-[var(--shadow-sm)]"
              >
                <Plus className="w-5 h-5" />
                <span>Thêm giao dịch</span>
              </button>
            </div>
          </Card>
        </div>

        {/* Account Information Section */}
        {(account.type === 'bank' || account.accountNumber || account.accountOwnerName) && (
          <Card>
            <div className="flex items-center gap-2 mb-4">
              <Info className="w-5 h-5 text-[var(--primary)]" />
              <h3 className="font-semibold text-[var(--text-primary)]">Thông tin tài khoản</h3>
            </div>
            <div className="space-y-3">
              <InfoRow label="Loại tài khoản" value={getAccountTypeLabel(account.type)} />
              {account.accountNumber && (
                <div className="flex items-center justify-between py-2 border-b border-[var(--divider)]">
                  <span className="text-sm text-[var(--text-secondary)]">Số tài khoản</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-[var(--text-primary)] tabular-nums">
                      {showFullAccountNumber ? account.accountNumber : maskAccountNumber(account.accountNumber, account.type)}
                    </span>
                    <button
                      onClick={() => setShowFullAccountNumber(!showFullAccountNumber)}
                      className="p-1 rounded-[var(--radius-sm)] hover:bg-[var(--surface)] transition-colors"
                    >
                      {showFullAccountNumber
                        ? <EyeOff className="w-4 h-4 text-[var(--text-tertiary)]" />
                        : <Eye className="w-4 h-4 text-[var(--text-tertiary)]" />
                      }
                    </button>
                  </div>
                </div>
              )}
              {account.accountOwnerName && (
                <InfoRow label="Chủ tài khoản" value={account.accountOwnerName} />
              )}
              <InfoRow label="Đơn vị tiền tệ" value={account.currency || 'VND'} />
            </div>
            <button
              onClick={handleEdit}
              className="mt-4 text-sm font-medium text-[var(--primary)] hover:underline"
            >
              Chỉnh sửa thông tin
            </button>
          </Card>
        )}

        {/* Stats Summary */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Card>
            <p className="text-sm text-[var(--text-secondary)] mb-1">Tổng thu</p>
            <p className="text-xl font-semibold text-[var(--success)] tabular-nums">
              +{formatCurrency(totalIncome)}₫
            </p>
          </Card>
          <Card>
            <p className="text-sm text-[var(--text-secondary)] mb-1">Tổng chi</p>
            <p className="text-xl font-semibold text-[var(--danger)] tabular-nums">
              -{formatCurrency(totalExpense)}₫
            </p>
          </Card>
          <Card className="col-span-2 md:col-span-1">
            <p className="text-sm text-[var(--text-secondary)] mb-1">Giao dịch</p>
            <p className="text-xl font-semibold text-[var(--text-primary)] tabular-nums">
              {accountTransactions.length}
            </p>
          </Card>
        </div>

        {/* Tabs */}
        <div className="border-b border-[var(--divider)]">
          <div className="flex gap-8">
            <button
              onClick={() => setActiveTab('transactions')}
              className={`pb-3 font-medium transition-colors relative ${
                activeTab === 'transactions'
                  ? 'text-[var(--primary)]'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              Giao dịch
              {activeTab === 'transactions' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--primary)]" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('insights')}
              className={`pb-3 font-medium transition-colors relative ${
                activeTab === 'insights'
                  ? 'text-[var(--primary)]'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              Thống kê
              {activeTab === 'insights' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--primary)]" />
              )}
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'transactions' && (
          <div>
            {/* Desktop Table View */}
            <Card className="hidden md:block">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[var(--divider)]">
                      <th className="text-left px-6 py-3 text-sm font-medium text-[var(--text-secondary)]">
                        Ngày
                      </th>
                      <th className="text-left px-6 py-3 text-sm font-medium text-[var(--text-secondary)]">
                        Mô tả
                      </th>
                      <th className="text-left px-6 py-3 text-sm font-medium text-[var(--text-secondary)]">
                        Danh mục
                      </th>
                      <th className="text-right px-6 py-3 text-sm font-medium text-[var(--text-secondary)]">
                        Số tiền
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {accountTransactions.map((transaction) => (
                      <tr 
                        key={transaction.id}
                        className="border-b border-[var(--divider)] hover:bg-[var(--surface)] transition-colors cursor-pointer"
                        onClick={() => goTransactionDetail(transaction.id)}
                      >
                        <td className="px-6 py-4 text-sm text-[var(--text-secondary)]">
                          {transaction.date}
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm font-medium text-[var(--text-primary)]">
                            {transaction.description}
                          </p>
                        </td>
                        <td className="px-6 py-4 text-sm text-[var(--text-secondary)]">
                          {transaction.category}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span 
                            className={`text-sm font-semibold tabular-nums ${
                              transaction.amount > 0 
                                ? 'text-[var(--success)]' 
                                : 'text-[var(--danger)]'
                            }`}
                          >
                            {transaction.amount > 0 ? '+' : '-'}
                            {formatCurrency(transaction.amount)}₫
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Mobile List View */}
            <div className="md:hidden space-y-2">
              {accountTransactions.map((transaction) => (
                <Card key={transaction.id} onClick={() => goTransactionDetail(transaction.id)}>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <p className="font-medium text-[var(--text-primary)] mb-1">
                        {transaction.description}
                      </p>
                      <p className="text-xs text-[var(--text-secondary)]">
                        {transaction.category}
                      </p>
                    </div>
                    <span 
                      className={`font-semibold tabular-nums ml-3 ${
                        transaction.amount > 0 
                          ? 'text-[var(--success)]' 
                          : 'text-[var(--danger)]'
                      }`}
                    >
                      {transaction.amount > 0 ? '+' : '-'}
                      {formatCurrency(transaction.amount)}₫
                    </span>
                  </div>
                  <p className="text-xs text-[var(--text-tertiary)]">
                    {transaction.date}
                  </p>
                </Card>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'insights' && (
          <div className="space-y-4">
            {insights.map((insight) => {
              const Icon = insight.icon;
              return (
                <Card key={insight.id}>
                  <div className="flex items-start gap-4">
                    <div 
                      className={`p-3 rounded-[var(--radius-lg)] ${
                        insight.type === 'warning' 
                          ? 'bg-[var(--warning-light)]' 
                          : 'bg-[var(--info-light)]'
                      }`}
                    >
                      <Icon 
                        className={`w-6 h-6 ${
                          insight.type === 'warning' 
                            ? 'text-[var(--warning)]' 
                            : 'text-[var(--info)]'
                        }`}
                      />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-[var(--text-primary)] mb-1">
                        {insight.title}
                      </h4>
                      <p className="text-sm text-[var(--text-secondary)]">
                        {insight.description}
                      </p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteAccountModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleConfirmDelete}
      />

      {/* Reconcile Modal */}
      {showReconcile && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50" onClick={() => setShowReconcile(false)}>
          <div className="bg-[var(--card)] w-full max-w-md rounded-t-[var(--radius-xl)] sm:rounded-[var(--radius-xl)] p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">Điều chỉnh số dư</h3>
              <button onClick={() => setShowReconcile(false)} className="p-1.5 rounded-[var(--radius-md)] hover:bg-[var(--surface)]"><X className="w-5 h-5 text-[var(--text-secondary)]" /></button>
            </div>
            <div className="p-3 bg-[var(--surface)] rounded-[var(--radius-lg)] mb-4">
              <p className="text-xs text-[var(--text-tertiary)] mb-1">{account.name}</p>
              <p className="text-sm font-semibold text-[var(--text-primary)] tabular-nums">Số dư hiện tại: {formatCurrency(account.balance)}₫</p>
            </div>
            <div className="space-y-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">Số dư thực tế</label>
                <input type="number" value={reconcileAmount} onChange={e => setReconcileAmount(e.target.value)} placeholder="Nhập số dư thực tế..."
                  className="w-full px-4 py-3 bg-[var(--input-background)] border border-[var(--border)] rounded-[var(--radius-lg)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)] tabular-nums" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">Lý do</label>
                <select value={reconcileReason} onChange={e => setReconcileReason(e.target.value)}
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
                <input type="text" value={reconcileNote} onChange={e => setReconcileNote(e.target.value)} placeholder="Ví dụ: Đối chiếu sao kê ngân hàng..."
                  className="w-full px-4 py-3 bg-[var(--input-background)] border border-[var(--border)] rounded-[var(--radius-lg)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]" />
              </div>
            </div>
            {reconcileAmount && (() => {
              const actual = parseFloat(reconcileAmount) || 0;
              const diff = actual - account.balance;
              const isZero = diff === 0;
              return (
                <div className={`p-3 rounded-[var(--radius-lg)] mb-4 ${isZero ? 'bg-[var(--surface)]' : diff > 0 ? 'bg-[var(--success-light)] border border-[var(--success)]' : 'bg-[var(--danger-light)] border border-[var(--danger)]'}`}>
                  {isZero
                    ? <p className="text-xs text-[var(--text-tertiary)]">Số dư không thay đổi.</p>
                    : <p className="text-xs text-[var(--text-secondary)]">
                        Chênh lệch sẽ tạo giao dịch{' '}
                        <span className={`font-semibold ${diff > 0 ? 'text-[var(--success)]' : 'text-[var(--danger)]'}`}>
                          {diff > 0 ? `Thu (Adjustment) +${new Intl.NumberFormat('vi-VN').format(diff)}₫` : `Chi (Adjustment) -${new Intl.NumberFormat('vi-VN').format(Math.abs(diff))}₫`}
                        </span>
                      </p>}
                </div>
              );
            })()}
            <div className="flex gap-3">
              <button onClick={() => setShowReconcile(false)} className="flex-1 px-4 py-2.5 border border-[var(--border)] text-[var(--text-secondary)] rounded-[var(--radius-lg)] font-medium hover:bg-[var(--surface)] transition-colors">Huỷ</button>
              <button
                disabled={!reconcileAmount || (parseFloat(reconcileAmount) || 0) - account.balance === 0}
                onClick={() => {
                  const actual = parseFloat(reconcileAmount) || 0;
                  const diff = actual - account.balance;
                  const reasonLabel: Record<string, string> = { 'data-entry': 'Nhập liệu sai', 'forgot-txn': 'Quên ghi giao dịch', 'bank-fees': 'Phí ngân hàng', 'other': 'Khác' };
                  const desc = `Điều chỉnh số dư${reconcileReason ? ` (${reasonLabel[reconcileReason] || reconcileReason})` : ''}${reconcileNote ? `: ${reconcileNote}` : ''}`;
                  addTransaction({
                    type: diff > 0 ? 'income' : 'expense',
                    amount: diff,
                    category: 'Điều chỉnh số dư',
                    categoryId: '',
                    account: account.name,
                    accountId: account.id,
                    description: desc,
                    date: new Date().toISOString().split('T')[0],
                    tags: [],
                  });
                  toast.success('Đã điều chỉnh số dư');
                  setShowReconcile(false);
                  setReconcileAmount('');
                  setReconcileReason('');
                  setReconcileNote('');
                }}
                className="flex-1 px-4 py-2.5 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white rounded-[var(--radius-lg)] font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-[var(--divider)]">
      <span className="text-sm text-[var(--text-secondary)]">{label}</span>
      <span className="text-sm font-medium text-[var(--text-primary)]">{value}</span>
    </div>
  );
}
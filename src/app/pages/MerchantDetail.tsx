import React, { useState, useMemo } from 'react';
import { useParams } from 'react-router';
import { ArrowLeft, Edit2, Store, Trash2, AlertTriangle, Tag } from 'lucide-react';
import { Card } from '../components/Card';
import { useAppNavigation } from '../hooks/useAppNavigation';
import { useToast } from '../contexts/ToastContext';
import { useDemoData } from '../contexts/DemoDataContext';
import { ConfirmationModal } from '../components/ConfirmationModals';

export default function MerchantDetail() {
  const { id } = useParams<{ id: string }>();
  const nav = useAppNavigation();
  const toast = useToast();
  const { merchants, categories, transactions, deleteMerchant } = useDemoData();

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  // Find merchant by route param ID
  const merchant = merchants.find((m) => m.id === id);

  // Resolve category name from ID
  const defaultCategoryName = useMemo(() => {
    if (!merchant?.defaultCategory) return null;
    const cat = categories.find(c => c.id === merchant.defaultCategory);
    return cat?.name || merchant.categoryName || null;
  }, [merchant, categories]);

  // Filter transactions for this merchant
  const merchantTransactions = useMemo(() => {
    if (!merchant) return [];
    return transactions
      .filter((tx) => tx.merchantId === merchant.id)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10);
  }, [transactions, merchant]);

  // Not found state
  if (!merchant) {
    return (
      <div className="min-h-screen bg-[var(--background)]">
        <div className="max-w-6xl mx-auto p-4 md:p-6 pb-20 md:pb-6 space-y-6">
          <button
            onClick={() => nav.goBack()}
            className="flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Quay lại</span>
          </button>
          <Card>
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-[var(--warning-light)] rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-[var(--warning)]" />
              </div>
              <h3 className="font-semibold text-[var(--text-primary)] mb-2">
                Không tìm thấy nhà cung cấp
              </h3>
              <p className="text-sm text-[var(--text-secondary)] mb-6">
                Nhà cung cấp này có thể đã bị xoá hoặc không tồn tại.
              </p>
              <button
                onClick={() => nav.goMerchants()}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white rounded-[var(--radius-lg)] transition-colors"
              >
                <span className="font-medium">Về danh sách nhà cung cấp</span>
              </button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN').format(Math.abs(amount));
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }) +
      ' ' + d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  };

  const totalSpent = merchant.totalSpent;
  const txCount = merchant.transactionCount;
  const avgTransaction = txCount > 0 ? totalSpent / txCount : 0;

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="max-w-6xl mx-auto p-4 md:p-6 pb-20 md:pb-6 space-y-6">
        {/* Header */}
        <div>
          <button
            onClick={() => nav.goMerchants()}
            className="flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Quay lại</span>
          </button>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-[var(--surface)] rounded-[var(--radius-lg)] flex items-center justify-center flex-shrink-0">
              <Store className="w-8 h-8 text-[var(--text-secondary)]" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-semibold text-[var(--text-primary)] truncate">
                {merchant.name}
              </h1>
              <p className="text-sm text-[var(--text-secondary)] mt-1">
                Chi tiết nhà cung cấp
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => nav.goEditMerchant(merchant.id)}
                className="flex items-center gap-2 px-4 py-2.5 border border-[var(--border)] text-[var(--text-primary)] rounded-[var(--radius-lg)] font-medium hover:bg-[var(--surface)] transition-colors"
              >
                <Edit2 className="w-4 h-4" />
                <span className="hidden md:inline">Chỉnh sửa</span>
              </button>
              <button
                onClick={() => setDeleteModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 border border-[var(--danger)] text-[var(--danger)] rounded-[var(--radius-lg)] font-medium hover:bg-[var(--danger-light)] transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span className="hidden md:inline">Xoá</span>
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <p className="text-sm text-[var(--text-secondary)] mb-1">Tổng chi</p>
            <p className="text-2xl font-semibold text-[var(--text-primary)] tabular-nums">
              {formatCurrency(totalSpent)}₫
            </p>
          </Card>
          <Card>
            <p className="text-sm text-[var(--text-secondary)] mb-1">Giao dịch</p>
            <p className="text-2xl font-semibold text-[var(--text-primary)] tabular-nums">
              {txCount}
            </p>
          </Card>
          <Card>
            <p className="text-sm text-[var(--text-secondary)] mb-1">Trung bình</p>
            <p className="text-2xl font-semibold text-[var(--text-primary)] tabular-nums">
              {formatCurrency(avgTransaction)}₫
            </p>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column - Info */}
          <div className="space-y-6">
            <Card>
              <h3 className="font-semibold text-[var(--text-primary)] mb-4">
                Thông tin
              </h3>
              <div className="space-y-4">
                {/* Name */}
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-[var(--text-secondary)] mb-1">Tên nhà cung cấp</p>
                    <p className="font-medium text-[var(--text-primary)]">{merchant.name}</p>
                  </div>
                </div>

                {/* Default Category */}
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-[var(--text-secondary)] mb-1">Danh mục mặc định</p>
                    {defaultCategoryName ? (
                      <div className="flex items-center gap-2">
                        <Tag className="w-4 h-4 text-[var(--primary)]" />
                        <p className="font-medium text-[var(--text-primary)]">{defaultCategoryName}</p>
                      </div>
                    ) : (
                      <p className="text-sm text-[var(--text-tertiary)] italic">Chưa đặt danh mục mặc định</p>
                    )}
                  </div>
                </div>

                {/* Last Transaction */}
                <div>
                  <p className="text-sm text-[var(--text-secondary)] mb-1">Giao dịch gần nhất</p>
                  <p className="font-medium text-[var(--text-primary)]">
                    {new Date(merchant.lastTransaction).toLocaleDateString('vi-VN', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                    })}
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Right Column - Recent Transactions */}
          <div>
            <Card>
              <h3 className="font-semibold text-[var(--text-primary)] mb-4">
                Giao dịch gần đây
              </h3>
              <div className="space-y-3">
                {merchantTransactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="p-3 rounded-[var(--radius-lg)] bg-[var(--surface)] hover:bg-[var(--border)] transition-colors cursor-pointer"
                    onClick={() => nav.goTransactionDetail(transaction.id)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                          {transaction.description}
                        </p>
                        <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                          {transaction.category}
                        </p>
                      </div>
                      <span className={`text-sm font-semibold tabular-nums ml-3 ${
                        transaction.amount < 0 ? 'text-[var(--danger)]' : 'text-[var(--success)]'
                      }`}>
                        {transaction.amount < 0 ? '-' : '+'}{formatCurrency(transaction.amount)}₫
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-[var(--text-tertiary)]">
                      <span>{formatDate(transaction.date)}</span>
                      <span>{transaction.account}</span>
                    </div>
                  </div>
                ))}
              </div>

              {merchantTransactions.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-sm text-[var(--text-secondary)]">
                    Chưa có giao dịch nào
                  </p>
                </div>
              )}
            </Card>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        <ConfirmationModal
          isOpen={deleteModalOpen}
          onClose={() => setDeleteModalOpen(false)}
          onConfirm={() => {
            deleteMerchant(merchant.id);
            toast.success(`Đã xoá nhà cung cấp "${merchant.name}"`);
            setDeleteModalOpen(false);
            nav.goMerchants();
          }}
          title="Xoá nhà cung cấp?"
          description={`Bạn có chắc muốn xoá nhà cung cấp "${merchant.name}"? Hành động này không thể hoàn tác.`}
          confirmLabel="Xoá"
          cancelLabel="Huỷ"
          isDangerous={true}
        />
      </div>
    </div>
  );
}

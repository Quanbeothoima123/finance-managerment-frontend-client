import React, { useState } from 'react';
import { useParams } from 'react-router';
import { ChevronLeft, Edit, Trash2, Calendar, Tag, FileText, Paperclip, ArrowDownLeft, ArrowUpRight, ArrowLeftRight, MoreVertical, Link2, Landmark, SplitSquareHorizontal, Copy, ExternalLink, Download, X, Crown, Cloud } from 'lucide-react';
import { useDemoData } from '../contexts/DemoDataContext';
import { useToast } from '../contexts/ToastContext';
import { useAppNavigation } from '../hooks/useAppNavigation';
import { useTransactionUndoDelete } from '../hooks/useTransactionUndoDelete';
import { Button } from '../components/Button';
import { ConfirmationModal } from '../components/ConfirmationModals';
import { TagChip } from '../components/TagChip';

export default function TransactionDetail() {
  const { id } = useParams<{ id: string }>();
  const { transactions, tags: allTags, selectedCurrency } = useDemoData();
  const toast = useToast();
  const { goBack, goEditTransaction, goTransactionDetail, goDuplicateTransaction, goAttachments } = useAppNavigation();
  const { softDelete } = useTransactionUndoDelete();
  
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteLinkedToo, setDeleteLinkedToo] = useState(true);
  const [showMenu, setShowMenu] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  const transaction = transactions.find(t => t.id === id);
  const linkedTransaction = transaction?.linkedTransactionId
    ? transactions.find(t => t.id === transaction.linkedTransactionId)
    : null;

  const currencySymbol = selectedCurrency === 'VND' ? '₫' : selectedCurrency;

  if (!transaction) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-2">
            Không tìm thấy giao dịch
          </h2>
          <p className="text-[var(--text-secondary)] mb-6">
            Giao dịch này có th đã bị xóa hoặc không tồn tại.
          </p>
          <Button onClick={goBack} variant="secondary">
            <ChevronLeft className="w-5 h-5 mr-2" />
            Quay lại
          </Button>
        </div>
      </div>
    );
  }

  const handleDelete = () => {
    softDelete(transaction.id, { deleteLinked: linkedTransaction ? deleteLinkedToo : false });
    goBack();
  };

  const handleDuplicate = () => {
    if (transaction.type === 'transfer') {
      toast.info('Chuyển khoản chưa hỗ trợ nhân bản.');
      return;
    }
    goDuplicateTransaction(transaction.id);
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(Math.abs(amount));
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('vi-VN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'income':
        return <ArrowUpRight className="w-8 h-8 text-[var(--success)]" />;
      case 'expense':
        return <ArrowDownLeft className="w-8 h-8 text-[var(--danger)]" />;
      case 'transfer':
        return <ArrowLeftRight className="w-8 h-8 text-[var(--info)]" />;
      default:
        return null;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'income':
        return 'Thu nhập';
      case 'expense':
        return 'Chi tiêu';
      case 'transfer':
        return 'Chuyển tiền';
      default:
        return type;
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

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[var(--card)] border-b border-[var(--border)]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={goBack}
              className="p-2 -ml-2 rounded-[var(--radius-lg)] hover:bg-[var(--surface)] transition-colors"
            >
              <ChevronLeft className="w-6 h-6 text-[var(--text-primary)]" />
            </button>
            
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-2 rounded-[var(--radius-lg)] hover:bg-[var(--surface)] transition-colors"
              >
                <MoreVertical className="w-6 h-6 text-[var(--text-primary)]" />
              </button>
              
              {showMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-[var(--card)] border border-[var(--border)] rounded-[var(--radius-lg)] shadow-[var(--shadow-lg)] py-1 animate-scale-in">
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      goEditTransaction(transaction.id);
                    }}
                    className="w-full px-4 py-2 text-left text-[var(--text-primary)] hover:bg-[var(--surface)] transition-colors flex items-center gap-2"
                  >
                    <Edit className="w-4 h-4" />
                    Chỉnh sửa
                  </button>
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      handleDuplicate();
                    }}
                    className="w-full px-4 py-2 text-left text-[var(--text-primary)] hover:bg-[var(--surface)] transition-colors flex items-center gap-2"
                  >
                    <Copy className="w-4 h-4" />
                    Nhân bản
                  </button>
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      setShowDeleteModal(true);
                    }}
                    className="w-full px-4 py-2 text-left text-[var(--danger)] hover:bg-[var(--surface)] transition-colors flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Xóa
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Amount Card */}
        <div className="bg-[var(--card)] rounded-[var(--radius-xl)] border border-[var(--border)] p-6 mb-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-[var(--radius-xl)] bg-[var(--surface)] flex items-center justify-center flex-shrink-0">
              {getTypeIcon(transaction.type)}
            </div>
            
            <div className="flex-1">
              <div className="text-sm text-[var(--text-secondary)] mb-1">
                {getTypeLabel(transaction.type)}
              </div>
              <div className={`text-3xl font-bold ${getAmountColor(transaction.type)}`}>
                {transaction.type === 'income' ? '+' : transaction.type === 'transfer' ? '' : '-'}
                {formatAmount(Math.abs(transaction.amount))}
              </div>
              <div className="text-lg font-medium text-[var(--text-primary)] mt-2">
                {transaction.description}
              </div>
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="bg-[var(--card)] rounded-[var(--radius-xl)] border border-[var(--border)] divide-y divide-[var(--divider)]">
          {/* Date */}
          <div className="p-4 flex items-center gap-3">
            <Calendar className="w-5 h-5 text-[var(--text-tertiary)] flex-shrink-0" />
            <div className="flex-1">
              <div className="text-sm text-[var(--text-secondary)]">Ngày giao dịch</div>
              <div className="font-medium text-[var(--text-primary)] mt-0.5">
                {formatDate(transaction.date)}
              </div>
            </div>
          </div>

          {/* Category */}
          <div className="p-4 flex items-center gap-3">
            <Tag className="w-5 h-5 text-[var(--text-tertiary)] flex-shrink-0" />
            <div className="flex-1">
              <div className="text-sm text-[var(--text-secondary)]">Danh mục</div>
              <div className="font-medium text-[var(--text-primary)] mt-0.5">
                {transaction.isSplit ? (
                  <span className="inline-flex items-center gap-1.5">
                    <SplitSquareHorizontal className="w-4 h-4 text-[var(--primary)]" />
                    Phân chia ({transaction.splitItems?.length || 0} dòng)
                  </span>
                ) : (
                  transaction.category
                )}
              </div>
            </div>
          </div>

          {/* Account */}
          <div className="p-4 flex items-center gap-3">
            <FileText className="w-5 h-5 text-[var(--text-tertiary)] flex-shrink-0" />
            <div className="flex-1">
              <div className="text-sm text-[var(--text-secondary)]">
                {transaction.type === 'transfer' ? 'Từ tài khoản' : 'Tài khoản'}
              </div>
              <div className="font-medium text-[var(--text-primary)] mt-0.5">
                {transaction.account}
              </div>
            </div>
          </div>

          {/* To Account (for transfers) */}
          {transaction.type === 'transfer' && transaction.toAccount && (
            <div className="p-4 flex items-center gap-3">
              <FileText className="w-5 h-5 text-[var(--text-tertiary)] flex-shrink-0" />
              <div className="flex-1">
                <div className="text-sm text-[var(--text-secondary)]">Đến tài khoản</div>
                <div className="font-medium text-[var(--text-primary)] mt-0.5">
                  {transaction.toAccount}
                </div>
              </div>
            </div>
          )}

          {/* Service Fee (for transfers with fee) */}
          {transaction.type === 'transfer' && transaction.serviceFee && transaction.serviceFee > 0 && (
            <div className="p-4 flex items-center gap-3">
              <Landmark className="w-5 h-5 text-[var(--text-tertiary)] flex-shrink-0" />
              <div className="flex-1">
                <div className="text-sm text-[var(--text-secondary)]">Phí dịch vụ</div>
                <div className="font-medium text-[var(--warning)] mt-0.5">
                  {new Intl.NumberFormat('vi-VN').format(transaction.serviceFee)} {currencySymbol}
                </div>
              </div>
            </div>
          )}

          {/* Merchant */}
          {transaction.merchant && (
            <div className="p-4 flex items-center gap-3">
              <FileText className="w-5 h-5 text-[var(--text-tertiary)] flex-shrink-0" />
              <div className="flex-1">
                <div className="text-sm text-[var(--text-secondary)]">Merchant</div>
                <div className="font-medium text-[var(--text-primary)] mt-0.5">
                  {transaction.merchant}
                </div>
              </div>
            </div>
          )}

          {/* Tags */}
          {transaction.tags && transaction.tags.length > 0 && (
            <div className="p-4 flex items-start gap-3">
              <Tag className="w-5 h-5 text-[var(--text-tertiary)] flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="text-sm text-[var(--text-secondary)] mb-2">Nhãn</div>
                <div className="flex flex-wrap gap-2">
                  {transaction.tags.map((tagId) => {
                    const tag = allTags.find(t => t.id === tagId);
                    if (!tag) return null;
                    return (
                      <TagChip
                        key={tagId}
                        name={tag.name}
                        color={tag.color}
                        size="md"
                      />
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Notes */}
          {transaction.notes && (
            <div className="p-4 flex items-start gap-3">
              <FileText className="w-5 h-5 text-[var(--text-tertiary)] flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="text-sm text-[var(--text-secondary)] mb-1">Ghi chú</div>
                <div className="text-[var(--text-primary)]">
                  {transaction.notes}
                </div>
              </div>
            </div>
          )}

          {/* Attachment */}
          {(transaction.attachments && transaction.attachments.length > 0) ? (
            <div className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Paperclip className="w-5 h-5 text-[var(--text-tertiary)] flex-shrink-0" />
                <div className="text-sm text-[var(--text-secondary)]">Đính kèm</div>
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-700">
                  <Crown className="w-2.5 h-2.5" /> PRO
                </span>
                <span className="flex items-center gap-1 text-[10px] text-[var(--text-tertiary)] ml-auto">
                  <Cloud className="w-3 h-3" /> Đám mây
                </span>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {transaction.attachments.map(att => (
                  <div key={att.id} className="relative rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] overflow-hidden group">
                    {att.type === 'image' ? (
                      <button
                        onClick={() => setLightboxUrl(att.url)}
                        className="w-full aspect-square"
                      >
                        <img src={att.url} alt={att.name} className="w-full h-full object-cover" />
                      </button>
                    ) : (
                      <button
                        onClick={() => window.open(att.url, '_blank')}
                        className="w-full aspect-square flex flex-col items-center justify-center gap-1.5 p-2"
                      >
                        <FileText className="w-6 h-6 text-[var(--primary)]" />
                        <span className="text-[10px] text-[var(--text-secondary)] truncate w-full text-center">{att.name}</span>
                      </button>
                    )}
                    <div className="absolute bottom-0.5 left-0.5 px-1 py-0.5 rounded text-[9px] font-medium bg-black/60 text-white">
                      {att.size < 1024 * 1024 ? `${(att.size / 1024).toFixed(0)} KB` : `${(att.size / (1024 * 1024)).toFixed(1)} MB`}
                    </div>
                  </div>
                ))}
              </div>
              <button
                onClick={goAttachments}
                className="mt-3 w-full text-center text-xs font-medium text-[var(--primary)] hover:underline py-1"
              >
                Xem tất cả đính kèm
              </button>
            </div>
          ) : transaction.attachment ? (
            <div className="p-4 flex items-center gap-3">
              <Paperclip className="w-5 h-5 text-[var(--text-tertiary)] flex-shrink-0" />
              <div className="flex-1">
                <div className="text-sm text-[var(--text-secondary)]">Đính kèm</div>
                <div className="font-medium text-[var(--primary)] mt-0.5">
                  1 tệp đính kèm
                </div>
              </div>
            </div>
          ) : null}

          {/* Recurring */}
          {transaction.recurring && (
            <div className="p-4 flex items-center gap-3">
              <FileText className="w-5 h-5 text-[var(--text-tertiary)] flex-shrink-0" />
              <div className="flex-1">
                <div className="text-sm text-[var(--text-secondary)]">Loại</div>
                <div className="font-medium text-[var(--text-primary)] mt-0.5">
                  Giao dịch định kỳ
                </div>
              </div>
            </div>
          )}

          {/* Linked Transaction */}
          {linkedTransaction && (
            <div className="p-4 flex items-center gap-3">
              <Link2 className="w-5 h-5 text-[var(--text-tertiary)] flex-shrink-0" />
              <div className="flex-1">
                <div className="text-sm text-[var(--text-secondary)]">Giao dịch liên kết</div>
                <div className="font-medium text-[var(--text-primary)] mt-0.5">
                  <button
                    onClick={() => goTransactionDetail(linkedTransaction.id)}
                    className="underline hover:text-[var(--primary)]"
                  >
                    Xem giao dịch liên kết
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Split Breakdown */}
        {transaction.isSplit && transaction.splitItems && transaction.splitItems.length > 0 && (
          <div className="bg-[var(--card)] rounded-[var(--radius-xl)] border border-[var(--border)] mt-6 overflow-hidden">
            <div className="px-4 py-3 border-b border-[var(--divider)] flex items-center gap-2">
              <SplitSquareHorizontal className="w-5 h-5 text-[var(--primary)]" />
              <h3 className="font-medium text-[var(--text-primary)]">Chi tiết phân chia</h3>
            </div>
            <div className="divide-y divide-[var(--divider)]">
              {transaction.splitItems.map((item, idx) => (
                <div key={item.id} className="px-4 py-3 flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[var(--surface)] text-xs font-medium text-[var(--text-secondary)]">
                        {idx + 1}
                      </span>
                      <span className="font-medium text-[var(--text-primary)] truncate">
                        {item.category}
                      </span>
                    </div>
                    {item.note && (
                      <p className="mt-0.5 ml-7 text-xs text-[var(--text-tertiary)]">{item.note}</p>
                    )}
                  </div>
                  <span className="font-medium text-[var(--text-primary)] tabular-nums flex-shrink-0 ml-3">
                    {new Intl.NumberFormat('vi-VN').format(item.amount)} {currencySymbol}
                  </span>
                </div>
              ))}
            </div>
            <div className="px-4 py-3 border-t border-[var(--divider)] bg-[var(--surface)] flex items-center justify-between">
              <span className="text-sm font-medium text-[var(--text-secondary)]">Tổng cộng</span>
              <span className="font-medium text-[var(--text-primary)] tabular-nums">
                {formatAmount(Math.abs(transaction.amount))}
              </span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-6 grid grid-cols-2 gap-3">
          <Button variant="secondary" onClick={() => goEditTransaction(transaction.id)}>
            <Edit className="w-5 h-5 mr-2" />
            Chỉnh sửa
          </Button>
          <Button variant="danger" onClick={() => setShowDeleteModal(true)}>
            <Trash2 className="w-5 h-5 mr-2" />
            Xóa
          </Button>
          <Button variant="secondary" onClick={handleDuplicate}>
            <Copy className="w-5 h-5 mr-2" />
            Nhân bản
          </Button>
        </div>
      </div>

      {/* Lightbox */}
      {lightboxUrl && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50" onClick={() => setLightboxUrl(null)}>
          <div className="relative max-w-4xl max-h-[90vh] w-full mx-4" onClick={e => e.stopPropagation()}>
            <img src={lightboxUrl} alt="Preview" className="w-full h-full object-contain rounded-lg" />
            <div className="absolute top-3 right-3 flex gap-2">
              <a href={lightboxUrl} target="_blank" rel="noopener noreferrer"
                className="p-2 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors">
                <ExternalLink className="w-5 h-5" />
              </a>
              <a href={lightboxUrl} download
                className="p-2 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors">
                <Download className="w-5 h-5" />
              </a>
              <button onClick={() => setLightboxUrl(null)}
                className="p-2 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Xóa giao dịch"
        description={
          linkedTransaction
            ? 'Giao dịch này có phí dịch vụ liên kết. Bạn muốn xóa cả hai?'
            : 'Bạn có chắc chắn muốn xóa giao dịch này? Bạn có thể hoàn tác trong vài giây.'
        }
        confirmLabel="Xóa"
        cancelLabel="Hủy"
        isDangerous={true}
      >
        {linkedTransaction && (
          <div className="mt-3 p-3 bg-[var(--surface)] rounded-[var(--radius-lg)] border border-[var(--border)]">
            <div className="flex items-start gap-2 mb-2">
              <Link2 className="w-4 h-4 text-[var(--text-tertiary)] mt-0.5 flex-shrink-0" />
              <div className="text-sm text-[var(--text-secondary)]">
                <span className="font-medium text-[var(--text-primary)]">{linkedTransaction.description}</span>
                <span className="ml-1">
                  ({new Intl.NumberFormat('vi-VN').format(Math.abs(linkedTransaction.amount))} {currencySymbol})
                </span>
              </div>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={deleteLinkedToo}
                onChange={(e) => setDeleteLinkedToo(e.target.checked)}
                className="w-4 h-4 rounded border-[var(--border)] text-[var(--danger)] focus:ring-[var(--focus-ring)]"
              />
              <span className="text-sm text-[var(--text-primary)]">
                Xóa luôn phí dịch vụ liên kết
              </span>
            </label>
          </div>
        )}
      </ConfirmationModal>
    </div>
  );
}
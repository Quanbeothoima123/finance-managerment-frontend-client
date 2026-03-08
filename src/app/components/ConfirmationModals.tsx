import React, { useState } from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  consequences?: string[];
  confirmLabel?: string;
  cancelLabel?: string;
  isDangerous?: boolean;
  requireCheckbox?: boolean;
  checkboxLabel?: string;
  children?: React.ReactNode;
}

export function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  consequences,
  confirmLabel = 'Xác nhận',
  cancelLabel = 'Huỷ',
  isDangerous = false,
  requireCheckbox = false,
  checkboxLabel = 'Tôi hiểu',
  children,
}: ConfirmationModalProps) {
  const [isChecked, setIsChecked] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (requireCheckbox && !isChecked) return;
    onConfirm();
    setIsChecked(false);
  };

  const handleClose = () => {
    onClose();
    setIsChecked(false);
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        onClick={handleClose}
      >
        {/* Modal */}
        <div
          className="bg-[var(--card)] rounded-[var(--radius-xl)] shadow-2xl max-w-md w-full"
          onClick={(e) => e.stopPropagation()}
        >
          <Card>
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start gap-3">
                <div
                  className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${
                    isDangerous
                      ? 'bg-[var(--danger-light)]'
                      : 'bg-[var(--warning-light)]'
                  }`}
                >
                  <AlertTriangle
                    className={`w-6 h-6 ${
                      isDangerous ? 'text-[var(--danger)]' : 'text-[var(--warning)]'
                    }`}
                  />
                </div>

                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-1">
                    {title}
                  </h3>
                  <p className="text-sm text-[var(--text-secondary)]">{description}</p>
                </div>
              </div>

              <button
                onClick={handleClose}
                className="p-1 hover:bg-[var(--surface)] rounded-[var(--radius-md)] transition-colors"
              >
                <X className="w-5 h-5 text-[var(--text-secondary)]" />
              </button>
            </div>

            {consequences && consequences.length > 0 && (
              <div
                className={`p-4 rounded-[var(--radius-lg)] mb-4 ${
                  isDangerous
                    ? 'bg-[var(--danger-light)] border border-[var(--danger)]'
                    : 'bg-[var(--warning-light)] border border-[var(--warning)]'
                }`}
              >
                <p className="text-sm font-medium text-[var(--text-primary)] mb-2">
                  Hậu quả:
                </p>
                <ul className="text-sm text-[var(--text-secondary)] space-y-1">
                  {consequences.map((consequence, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-[var(--danger)] font-bold">•</span>
                      <span>{consequence}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {requireCheckbox && (
              <label className="flex items-center gap-3 mb-4 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={(e) => setIsChecked(e.target.checked)}
                  className="w-5 h-5 rounded border-[var(--border)] text-[var(--danger)] focus:ring-[var(--focus-ring)]"
                />
                <span className="text-sm font-medium text-[var(--text-primary)]">
                  {checkboxLabel}
                </span>
              </label>
            )}

            {children && (
              <div className="mb-4">
                {children}
              </div>
            )}

            <div className="flex flex-col-reverse sm:flex-row gap-3">
              <Button onClick={handleClose} variant="secondary" className="flex-1">
                {cancelLabel}
              </Button>
              <Button
                onClick={handleConfirm}
                disabled={requireCheckbox && !isChecked}
                className={`flex-1 ${
                  isDangerous
                    ? 'bg-[var(--danger)] hover:bg-[var(--danger)]/90'
                    : ''
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {confirmLabel}
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}

// Delete Transaction Confirmation
interface DeleteTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  transactionDescription?: string;
  transactionAmount?: string;
}

export function DeleteTransactionModal({
  isOpen,
  onClose,
  onConfirm,
  transactionDescription = 'giao dịch này',
  transactionAmount = '0₫',
}: DeleteTransactionModalProps) {
  return (
    <ConfirmationModal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      title="Xoá giao dịch?"
      description={`Bạn có chắc muốn xoá "${transactionDescription}" (${transactionAmount})? Hành động này không thể hoàn tác.`}
      confirmLabel="Xoá"
      cancelLabel="Huỷ"
      isDangerous={true}
    />
  );
}

// Delete Account Confirmation
interface DeleteAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  accountName?: string;
  accountBalance?: string;
  transactionCount?: number;
}

export function DeleteAccountModal({
  isOpen,
  onClose,
  onConfirm,
  accountName = 'tài khoản này',
  accountBalance = '0₫',
  transactionCount = 0,
}: DeleteAccountModalProps) {
  return (
    <ConfirmationModal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      title="Xoá tài khoản?"
      description={`Bạn có chắc muốn xoá tài khoản "${accountName}"? Đây là hành động nguy hiểm và không thể hoàn tác.`}
      consequences={[
        `Số dư hiện tại: ${accountBalance} sẽ bị xoá`,
        `${transactionCount} giao dịch liên quan sẽ bị xoá`,
        'Dữ liệu không thể khôi phục',
      ]}
      confirmLabel="Xoá tài khoản"
      cancelLabel="Huỷ"
      isDangerous={true}
      requireCheckbox={true}
      checkboxLabel="Tôi hiểu và chấp nhận hậu quả"
    />
  );
}

// Delete Budget Confirmation
interface DeleteBudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  budgetName?: string;
}

export function DeleteBudgetModal({
  isOpen,
  onClose,
  onConfirm,
  budgetName = 'ngân sách này',
}: DeleteBudgetModalProps) {
  return (
    <ConfirmationModal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      title="Xoá ngân sách?"
      description={`Bạn có chắc muốn xoá ngân sách "${budgetName}"? Lịch sử chi tiêu sẽ vẫn được giữ lại.`}
      confirmLabel="Xoá"
      cancelLabel="Huỷ"
      isDangerous={true}
    />
  );
}

// Delete Goal Confirmation
interface DeleteGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  goalName?: string;
  goalProgress?: string;
}

export function DeleteGoalModal({
  isOpen,
  onClose,
  onConfirm,
  goalName = 'mục tiêu này',
  goalProgress = '0%',
}: DeleteGoalModalProps) {
  return (
    <ConfirmationModal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      title="Xoá mục tiêu?"
      description={`Bạn có chắc muốn xoá mục tiêu "${goalName}"? Bạn đã hoàn thành ${goalProgress} tiến độ.`}
      consequences={[
        'Tất cả lịch sử đóng góp sẽ bị xoá',
        'Tiến độ hiện tại sẽ bị mất',
      ]}
      confirmLabel="Xoá"
      cancelLabel="Huỷ"
      isDangerous={true}
    />
  );
}

// Delete Category Confirmation
interface DeleteCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  categoryName?: string;
  transactionCount?: number;
}

export function DeleteCategoryModal({
  isOpen,
  onClose,
  onConfirm,
  categoryName = 'danh mục này',
  transactionCount = 0,
}: DeleteCategoryModalProps) {
  return (
    <ConfirmationModal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      title="Xoá danh mục?"
      description={`Bạn có chắc muốn xoá danh mục "${categoryName}"?`}
      consequences={[
        `${transactionCount} giao dịch sẽ chuyển về "Chưa phân loại"`,
        'Dữ liệu ngân sách liên quan sẽ bị ảnh hưởng',
      ]}
      confirmLabel="Xoá"
      cancelLabel="Huỷ"
      isDangerous={true}
      requireCheckbox={transactionCount > 50}
      checkboxLabel="Tôi hiểu và chấp nhận hậu quả"
    />
  );
}

// Logout Confirmation
interface LogoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function LogoutModal({ isOpen, onClose, onConfirm }: LogoutModalProps) {
  return (
    <ConfirmationModal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      title="Đăng xuất?"
      description="Bạn có chắc muốn đăng xuất khỏi ứng dụng?"
      confirmLabel="Đăng xuất"
      cancelLabel="Huỷ"
      isDangerous={false}
    />
  );
}

// Discard Changes Confirmation
interface DiscardChangesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function DiscardChangesModal({ isOpen, onClose, onConfirm }: DiscardChangesModalProps) {
  return (
    <ConfirmationModal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      title="Huỷ thay đổi?"
      description="Bạn có thay đổi chưa được lưu. Bạn có chắc muốn huỷ?"
      confirmLabel="Huỷ thay đổi"
      cancelLabel="Tiếp tục chỉnh sửa"
      isDangerous={false}
    />
  );
}
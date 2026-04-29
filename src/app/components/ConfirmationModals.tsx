import React, { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
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
  confirmLabel,
  cancelLabel,
  isDangerous = false,
  requireCheckbox = false,
  checkboxLabel,
  children,
}: ConfirmationModalProps) {
  const { t } = useTranslation('common');
  const [isChecked, setIsChecked] = useState(false);
  const resolvedConfirmLabel = confirmLabel ?? t('actions.confirm');
  const resolvedCancelLabel = cancelLabel ?? t('actions.cancel');
  const resolvedCheckboxLabel =
    checkboxLabel ?? t('confirmation_modals.defaults.checkbox_label');

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
                  {t('confirmation_modals.defaults.consequences_label')}
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
                  {resolvedCheckboxLabel}
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
                {resolvedCancelLabel}
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
                {resolvedConfirmLabel}
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
  transactionDescription,
  transactionAmount = '0₫',
}: DeleteTransactionModalProps) {
  const { t } = useTranslation('common');
  const resolvedDescription =
    transactionDescription ?? t('confirmation_modals.delete_transaction.fallback_name');

  return (
    <ConfirmationModal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      title={t('confirmation_modals.delete_transaction.title')}
      description={t('confirmation_modals.delete_transaction.description', {
        description: resolvedDescription,
        amount: transactionAmount,
      })}
      confirmLabel={t('actions.delete')}
      cancelLabel={t('actions.cancel')}
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
  accountName,
  accountBalance = '0₫',
  transactionCount = 0,
}: DeleteAccountModalProps) {
  const { t } = useTranslation('common');
  const resolvedAccountName =
    accountName ?? t('confirmation_modals.delete_account.fallback_name');

  return (
    <ConfirmationModal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      title={t('confirmation_modals.delete_account.title')}
      description={t('confirmation_modals.delete_account.description', {
        accountName: resolvedAccountName,
      })}
      consequences={[
        t('confirmation_modals.delete_account.consequences.balance', {
          balance: accountBalance,
        }),
        t('confirmation_modals.delete_account.consequences.transactions', {
          count: transactionCount,
        }),
        t('confirmation_modals.delete_account.consequences.data'),
      ]}
      confirmLabel={t('confirmation_modals.delete_account.confirm')}
      cancelLabel={t('actions.cancel')}
      isDangerous={true}
      requireCheckbox={true}
      checkboxLabel={t('confirmation_modals.defaults.accept_consequences')}
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
  budgetName,
}: DeleteBudgetModalProps) {
  const { t } = useTranslation('common');
  const resolvedBudgetName =
    budgetName ?? t('confirmation_modals.delete_budget.fallback_name');

  return (
    <ConfirmationModal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      title={t('confirmation_modals.delete_budget.title')}
      description={t('confirmation_modals.delete_budget.description', {
        budgetName: resolvedBudgetName,
      })}
      confirmLabel={t('actions.delete')}
      cancelLabel={t('actions.cancel')}
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
  goalName,
  goalProgress = '0%',
}: DeleteGoalModalProps) {
  const { t } = useTranslation('common');
  const resolvedGoalName =
    goalName ?? t('confirmation_modals.delete_goal.fallback_name');

  return (
    <ConfirmationModal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      title={t('confirmation_modals.delete_goal.title')}
      description={t('confirmation_modals.delete_goal.description', {
        goalName: resolvedGoalName,
        goalProgress,
      })}
      consequences={[
        t('confirmation_modals.delete_goal.consequences.contributions'),
        t('confirmation_modals.delete_goal.consequences.progress'),
      ]}
      confirmLabel={t('actions.delete')}
      cancelLabel={t('actions.cancel')}
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
  categoryName,
  transactionCount = 0,
}: DeleteCategoryModalProps) {
  const { t } = useTranslation('common');
  const resolvedCategoryName =
    categoryName ?? t('confirmation_modals.delete_category.fallback_name');

  return (
    <ConfirmationModal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      title={t('confirmation_modals.delete_category.title')}
      description={t('confirmation_modals.delete_category.description', {
        categoryName: resolvedCategoryName,
      })}
      consequences={[
        t('confirmation_modals.delete_category.consequences.transactions', {
          count: transactionCount,
        }),
        t('confirmation_modals.delete_category.consequences.budget_data'),
      ]}
      confirmLabel={t('actions.delete')}
      cancelLabel={t('actions.cancel')}
      isDangerous={true}
      requireCheckbox={transactionCount > 50}
      checkboxLabel={t('confirmation_modals.defaults.accept_consequences')}
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
  const { t } = useTranslation('common');

  return (
    <ConfirmationModal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      title={t('confirmation_modals.logout.title')}
      description={t('confirmation_modals.logout.description')}
      confirmLabel={t('sidebar.user_menu.logout')}
      cancelLabel={t('actions.cancel')}
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
  const { t } = useTranslation('common');

  return (
    <ConfirmationModal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      title={t('confirmation_modals.discard_changes.title')}
      description={t('confirmation_modals.discard_changes.description')}
      confirmLabel={t('confirmation_modals.discard_changes.confirm')}
      cancelLabel={t('confirmation_modals.discard_changes.cancel')}
      isDangerous={false}
    />
  );
}

import React from "react";
import { Home, Receipt, PiggyBank, Target, Plus, FileText } from "lucide-react";
import { Button } from "../components/Button";
import { useTranslation } from "react-i18next";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  primaryAction?: {
    label: string;
    onClick: () => void;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({
  icon,
  title,
  description,
  primaryAction,
  secondaryAction,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      {icon && (
        <div className="w-24 h-24 bg-[var(--surface)] rounded-full flex items-center justify-center mb-6">
          {icon}
        </div>
      )}

      <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-2">
        {title}
      </h3>
      <p className="text-sm text-[var(--text-secondary)] max-w-md mb-6">
        {description}
      </p>

      <div className="flex flex-col sm:flex-row gap-3">
        {primaryAction && (
          <Button onClick={primaryAction.onClick}>
            <Plus className="w-5 h-5" />
            {primaryAction.label}
          </Button>
        )}

        {secondaryAction && (
          <Button onClick={secondaryAction.onClick} variant="secondary">
            {secondaryAction.label}
          </Button>
        )}
      </div>
    </div>
  );
}

// Empty State: Home Dashboard (No Data)
export function EmptyStateHome() {
  const { t } = useTranslation("common");
  return (
    <EmptyState
      icon={<Home className="w-12 h-12 text-[var(--text-secondary)]" />}
      title={t("empty_states.home.title")}
      description={t("empty_states.home.description")}
      primaryAction={{
        label: t("empty_states.home.add_transaction"),
        onClick: () => console.log("Add transaction"),
      }}
      secondaryAction={{
        label: t("empty_states.home.setup_account"),
        onClick: () => console.log("Setup account"),
      }}
    />
  );
}

// Empty State: Transactions List
export function EmptyStateTransactions() {
  const { t } = useTranslation("common");
  return (
    <EmptyState
      icon={<Receipt className="w-12 h-12 text-[var(--text-secondary)]" />}
      title={t("empty_states.transactions.title")}
      description={t("empty_states.transactions.description")}
      primaryAction={{
        label: t("empty_states.transactions.add"),
        onClick: () => console.log("Add transaction"),
      }}
      secondaryAction={{
        label: t("empty_states.transactions.import"),
        onClick: () => console.log("Import transactions"),
      }}
    />
  );
}

// Empty State: Transactions List (Filtered - No Results)
export function EmptyStateTransactionsFiltered() {
  const { t } = useTranslation("common");
  return (
    <EmptyState
      icon={<Receipt className="w-12 h-12 text-[var(--text-secondary)]" />}
      title={t("empty_states.transactions_filtered.title")}
      description={t("empty_states.transactions_filtered.description")}
      secondaryAction={{
        label: t("empty_states.transactions_filtered.clear_filters"),
        onClick: () => console.log("Clear filters"),
      }}
    />
  );
}

// Empty State: Budgets
export function EmptyStateBudgets() {
  const { t } = useTranslation("common");
  return (
    <EmptyState
      icon={<PiggyBank className="w-12 h-12 text-[var(--text-secondary)]" />}
      title={t("empty_states.budgets.title")}
      description={t("empty_states.budgets.description")}
      primaryAction={{
        label: t("empty_states.budgets.create"),
        onClick: () => console.log("Create budget"),
      }}
      secondaryAction={{
        label: t("empty_states.budgets.learn"),
        onClick: () => console.log("Learn about budgets"),
      }}
    />
  );
}

// Empty State: Goals
export function EmptyStateGoals() {
  const { t } = useTranslation("common");
  return (
    <EmptyState
      icon={<Target className="w-12 h-12 text-[var(--text-secondary)]" />}
      title={t("empty_states.goals.title")}
      description={t("empty_states.goals.description")}
      primaryAction={{
        label: t("empty_states.goals.create"),
        onClick: () => console.log("Create goal"),
      }}
      secondaryAction={{
        label: t("empty_states.goals.examples"),
        onClick: () => console.log("View examples"),
      }}
    />
  );
}

// Empty State: Search Results
export function EmptyStateSearch() {
  const { t } = useTranslation("common");
  return (
    <EmptyState
      icon={<FileText className="w-12 h-12 text-[var(--text-secondary)]" />}
      title={t("empty_states.search.title")}
      description={t("empty_states.search.description")}
      secondaryAction={{
        label: t("empty_states.search.clear"),
        onClick: () => console.log("Clear search"),
      }}
    />
  );
}

// Empty State: Accounts
export function EmptyStateAccounts() {
  const { t } = useTranslation("common");
  return (
    <EmptyState
      icon={<div className="text-4xl">💳</div>}
      title={t("empty_states.accounts.title")}
      description={t("empty_states.accounts.description")}
      primaryAction={{
        label: t("empty_states.accounts.add"),
        onClick: () => console.log("Add account"),
      }}
    />
  );
}

// Empty State: Categories
export function EmptyStateCategories() {
  const { t } = useTranslation("common");
  return (
    <EmptyState
      icon={<div className="text-4xl">📁</div>}
      title={t("empty_states.categories.title")}
      description={t("empty_states.categories.description")}
      primaryAction={{
        label: t("empty_states.categories.create"),
        onClick: () => console.log("Add category"),
      }}
    />
  );
}

// Empty State: Tags
export function EmptyStateTags() {
  const { t } = useTranslation("common");
  return (
    <EmptyState
      icon={<div className="text-4xl">🏷️</div>}
      title={t("empty_states.tags.title")}
      description={t("empty_states.tags.description")}
      primaryAction={{
        label: t("empty_states.tags.create"),
        onClick: () => console.log("Add tag"),
      }}
    />
  );
}

// Empty State: Merchants
export function EmptyStateMerchants() {
  const { t } = useTranslation("common");
  return (
    <EmptyState
      icon={<div className="text-4xl">🏪</div>}
      title={t("empty_states.merchants.title")}
      description={t("empty_states.merchants.description")}
      secondaryAction={{
        label: t("empty_states.merchants.add_transaction"),
        onClick: () => console.log("Add transaction"),
      }}
    />
  );
}

// Empty State: Attachments
export function EmptyStateAttachments() {
  const { t } = useTranslation("common");
  return (
    <EmptyState
      icon={<div className="text-4xl">📷</div>}
      title={t("empty_states.attachments.title")}
      description={t("empty_states.attachments.description")}
      primaryAction={{
        label: t("empty_states.attachments.add"),
        onClick: () => console.log("Add attachment"),
      }}
    />
  );
}

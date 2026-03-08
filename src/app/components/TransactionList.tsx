import React from 'react';

interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  date: string;
  icon?: React.ReactNode;
}

interface TransactionListProps {
  transactions: Transaction[];
  onTransactionClick?: (transaction: Transaction) => void;
}

export function TransactionList({ transactions, onTransactionClick }: TransactionListProps) {
  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('vi-VN').format(amount);
  };

  return (
    <div className="space-y-2">
      {transactions.map((transaction) => (
        <button
          key={transaction.id}
          onClick={() => onTransactionClick?.(transaction)}
          className="w-full flex items-center gap-4 px-4 py-3 bg-[var(--surface)] hover:bg-[var(--surface-elevated)] border border-[var(--border)] rounded-[var(--radius-lg)] transition-colors text-left"
        >
          {transaction.icon && (
            <div className="w-10 h-10 rounded-[var(--radius-md)] bg-[var(--surface-elevated)] flex items-center justify-center flex-shrink-0">
              {transaction.icon}
            </div>
          )}
          
          <div className="flex-1 min-w-0">
            <p className="font-medium text-[var(--text-primary)] truncate">
              {transaction.description}
            </p>
            <p className="text-sm text-[var(--text-secondary)]">
              {transaction.category} • {transaction.date}
            </p>
          </div>

          <div className="text-right">
            <p className={`font-semibold tabular-nums ${
              transaction.type === 'income' ? 'text-[var(--success)]' : 'text-[var(--danger)]'
            }`}>
              {transaction.type === 'income' ? '+' : '-'}{formatAmount(transaction.amount)}₫
            </p>
          </div>
        </button>
      ))}
    </div>
  );
}

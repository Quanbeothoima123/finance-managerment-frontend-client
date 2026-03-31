import React, { useState } from "react";
import {
  X,
  Calendar,
  TrendingUp,
  TrendingDown,
  ArrowRightLeft,
} from "lucide-react";
import { Card } from "../components/Card";
import { Button } from "../components/Button";

interface PreviewTransaction {
  id: string;
  date: string;
  description: string;
  type: "income" | "expense" | "transfer";
  amount: number;
  account?: string;
  category?: string;
  fromAccount?: string;
  toAccount?: string;
}

interface GeneratePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  ruleName: string;
  transactions: PreviewTransaction[];
}

export default function GeneratePreviewModal({
  isOpen,
  onClose,
  onConfirm,
  ruleName,
  transactions,
}: GeneratePreviewModalProps) {
  const [selectedTransactions, setSelectedTransactions] = useState<Set<string>>(
    new Set(transactions.map((t) => t.id)),
  );

  if (!isOpen) return null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN").format(amount);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      weekday: "short",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "income":
        return <TrendingUp className="w-5 h-5" />;
      case "expense":
        return <TrendingDown className="w-5 h-5" />;
      case "transfer":
        return <ArrowRightLeft className="w-5 h-5" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "income":
        return "bg-[var(--success-light)] text-[var(--success)]";
      case "expense":
        return "bg-[var(--danger-light)] text-[var(--danger)]";
      case "transfer":
        return "bg-[var(--info-light)] text-[var(--info)]";
    }
  };

  const toggleTransaction = (id: string) => {
    const newSelected = new Set(selectedTransactions);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedTransactions(newSelected);
  };

  const handleConfirm = () => {
    const selected = transactions.filter((t) => selectedTransactions.has(t.id));
    onConfirm();
  };

  const totalAmount = transactions
    .filter((t) => selectedTransactions.has(t.id))
    .reduce((sum, t) => {
      if (t.type === "income") return sum + t.amount;
      if (t.type === "expense") return sum - t.amount;
      return sum;
    }, 0);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end md:items-center justify-center z-50 p-0 md:p-4">
      <div
        className="bg-[var(--card)] rounded-t-[var(--radius-xl)] md:rounded-[var(--radius-xl)] w-full md:max-w-3xl max-h-[90vh] md:max-h-[85vh] flex flex-col shadow-2xl animate-slide-up md:animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[var(--divider)]">
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-[var(--text-primary)]">
              Xem trước giao dịch
            </h2>
            <p className="text-sm text-[var(--text-secondary)] mt-1">
              {ruleName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[var(--surface)] rounded-[var(--radius-lg)] transition-colors"
          >
            <X className="w-6 h-6 text-[var(--text-secondary)]" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Summary Card */}
          <Card className="bg-[var(--surface)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[var(--text-secondary)] mb-1">
                  Sẽ tạo {selectedTransactions.size} giao dịch
                </p>
                <p className="text-sm text-[var(--text-secondary)]">
                  Từ {formatDate(transactions[0].date)} đến{" "}
                  {formatDate(transactions[transactions.length - 1].date)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-[var(--text-secondary)] mb-1">
                  Tổng ảnh hưởng
                </p>
                <p
                  className={`text-xl font-bold tabular-nums ${
                    totalAmount >= 0
                      ? "text-[var(--success)]"
                      : "text-[var(--danger)]"
                  }`}
                >
                  {totalAmount >= 0 ? "+" : ""}
                  {formatCurrency(totalAmount)}₫
                </p>
              </div>
            </div>
          </Card>

          {/* Transactions List */}
          <div className="space-y-3">
            {transactions.map((transaction) => {
              const isSelected = selectedTransactions.has(transaction.id);

              return (
                <Card
                  key={transaction.id}
                  className={`cursor-pointer transition-all ${
                    isSelected ? "ring-2 ring-[var(--primary)]" : "opacity-60"
                  }`}
                  onClick={() => toggleTransaction(transaction.id)}
                >
                  <div className="flex items-start gap-4">
                    {/* Checkbox */}
                    <div className="flex-shrink-0 pt-1">
                      <div
                        className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                          isSelected
                            ? "bg-[var(--primary)] border-[var(--primary)]"
                            : "border-[var(--border)]"
                        }`}
                      >
                        {isSelected && (
                          <svg
                            className="w-3 h-3 text-white"
                            fill="none"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path d="M5 13l4 4L19 7"></path>
                          </svg>
                        )}
                      </div>
                    </div>

                    {/* Icon */}
                    <div
                      className={`flex-shrink-0 w-12 h-12 rounded-[var(--radius-lg)] flex items-center justify-center ${getTypeColor(
                        transaction.type,
                      )}`}
                    >
                      {getTypeIcon(transaction.type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-1">
                        <div className="flex-1">
                          <h4 className="font-semibold text-[var(--text-primary)]">
                            {transaction.description}
                          </h4>
                          <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)] mt-1">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>{formatDate(transaction.date)}</span>
                          </div>
                        </div>

                        <p
                          className={`text-lg font-bold tabular-nums ${
                            transaction.type === "income"
                              ? "text-[var(--success)]"
                              : transaction.type === "expense"
                                ? "text-[var(--danger)]"
                                : "text-[var(--info)]"
                          }`}
                        >
                          {transaction.type === "income" && "+"}
                          {transaction.type === "expense" && "-"}
                          {formatCurrency(transaction.amount)}₫
                        </p>
                      </div>

                      {/* Details */}
                      <div className="flex flex-wrap gap-2">
                        {transaction.type === "transfer" ? (
                          <>
                            <span className="px-2 py-0.5 bg-[var(--surface)] rounded-[var(--radius-md)] text-xs text-[var(--text-secondary)]">
                              {transaction.fromAccount} →{" "}
                              {transaction.toAccount}
                            </span>
                          </>
                        ) : (
                          <>
                            {transaction.account && (
                              <span className="px-2 py-0.5 bg-[var(--surface)] rounded-[var(--radius-md)] text-xs text-[var(--text-secondary)]">
                                {transaction.account}
                              </span>
                            )}
                            {transaction.category && (
                              <span className="px-2 py-0.5 bg-[var(--primary-light)] text-[var(--primary)] rounded-[var(--radius-md)] text-xs font-medium">
                                {transaction.category}
                              </span>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-[var(--divider)] space-y-3">
          <div className="flex items-center justify-between text-sm text-[var(--text-secondary)]">
            <span>
              Đã chọn {selectedTransactions.size}/{transactions.length} giao
              dịch
            </span>
            {selectedTransactions.size < transactions.length && (
              <button
                onClick={() =>
                  setSelectedTransactions(
                    new Set(transactions.map((t) => t.id)),
                  )
                }
                className="text-[var(--primary)] hover:text-[var(--primary-hover)] font-medium"
              >
                Chọn tất cả
              </button>
            )}
          </div>

          <div className="flex flex-col-reverse md:flex-row gap-3">
            <Button
              onClick={onClose}
              variant="secondary"
              className="flex-1 md:flex-initial"
            >
              Huỷ
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={selectedTransactions.size === 0}
              className="flex-1 md:flex-initial"
            >
              Tạo {selectedTransactions.size} giao dịch
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

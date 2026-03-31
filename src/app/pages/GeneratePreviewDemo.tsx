import React, { useState } from "react";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import GeneratePreviewModal from "./GeneratePreviewModal";
import { useToast } from "../contexts/ToastContext";

// Mock upcoming transactions
const mockTransactions = [
  {
    id: "1",
    date: "2026-03-01",
    description: "Lương tháng 3",
    type: "income" as const,
    amount: 25000000,
    account: "Techcombank",
    category: "Lương",
  },
  {
    id: "2",
    date: "2026-03-01",
    description: "Chuyển tiết kiệm",
    type: "transfer" as const,
    amount: 3000000,
    fromAccount: "Techcombank",
    toAccount: "BIDV",
  },
  {
    id: "3",
    date: "2026-03-05",
    description: "Tiền nhà tháng 3",
    type: "expense" as const,
    amount: 5000000,
    account: "Vietcombank",
    category: "Nhà ở",
  },
  {
    id: "4",
    date: "2026-03-10",
    description: "Netflix",
    type: "expense" as const,
    amount: 260000,
    account: "Vietcombank",
    category: "Giải trí",
  },
  {
    id: "5",
    date: "2026-03-15",
    description: "Tiền điện tháng 3",
    type: "expense" as const,
    amount: 800000,
    account: "Techcombank",
    category: "Nhà ở",
  },
];

export default function GeneratePreviewDemo() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const toast = useToast();

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleConfirm = () => {
    toast.success("Đã xác nhận giao dịch");
    setIsModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="max-w-3xl mx-auto p-4 md:p-6 pb-20 md:pb-6 space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
            Generate Preview Demo
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Click button to preview upcoming recurring transactions
          </p>
        </div>

        <Card>
          <div className="text-center py-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-[var(--primary-light)] rounded-full mb-4">
              <span className="text-3xl">📅</span>
            </div>
            <h3 className="font-semibold text-[var(--text-primary)] mb-2">
              Giao dịch định kỳ tháng 3
            </h3>
            <p className="text-sm text-[var(--text-secondary)] mb-6">
              Có 5 giao dịch sắp được tạo tự động
            </p>
            <Button onClick={handleOpenModal}>Xem trước & Xác nhận</Button>
          </div>
        </Card>
      </div>

      <GeneratePreviewModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onConfirm={handleConfirm}
        ruleName="Giao dịch định kỳ tháng 3/2026"
        transactions={mockTransactions}
      />
    </div>
  );
}

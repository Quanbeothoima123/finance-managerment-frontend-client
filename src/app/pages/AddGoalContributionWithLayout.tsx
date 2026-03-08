import React from 'react';
import { useParams } from 'react-router';
import { Layout } from '../components/Layout';
import AddGoalContribution from './AddGoalContribution';
import { useDemoData } from '../contexts/DemoDataContext';
import { useAppNavigation } from '../hooks/useAppNavigation';
import { useToast } from '../contexts/ToastContext';

export default function AddGoalContributionWithLayout() {
  const { id } = useParams<{ id: string }>();
  const { goals, addGoalContribution } = useDemoData();
  const nav = useAppNavigation();
  const toast = useToast();

  const goal = goals.find(g => g.id === id);

  if (!goal) {
    return (
      <Layout title="Thêm đóng góp">
        <div className="min-h-screen bg-[var(--background)]">
          <div className="max-w-2xl mx-auto p-4 md:p-6 pb-20 md:pb-6">
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-[var(--warning-light)] rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">⚠️</span>
              </div>
              <h3 className="font-semibold text-[var(--text-primary)] mb-2">
                Không tìm thấy mục tiêu
              </h3>
              <p className="text-sm text-[var(--text-secondary)] mb-6">
                Mục tiêu này có thể đã bị xoá hoặc không tồn tại.
              </p>
              <button
                onClick={() => nav.goGoals()}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white rounded-[var(--radius-lg)] transition-colors"
              >
                <span className="font-medium">Về danh sách mục tiêu</span>
              </button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  const goalInfo = {
    name: goal.name,
    icon: goal.icon,
    color: goal.color,
    currentAmount: goal.currentAmount,
    targetAmount: goal.targetAmount,
  };

  const handleSave = (data: { amount: number; date: string; linkedTransactionId?: string | null; note?: string }) => {
    addGoalContribution(goal.id, {
      amount: data.amount,
      date: data.date,
      transactionId: data.linkedTransactionId || undefined,
      notes: data.note || undefined,
    });
    toast.success(`Đã thêm đóng góp ${new Intl.NumberFormat('vi-VN').format(data.amount)}₫ vào "${goal.name}"`);
    nav.goGoalDetail(goal.id);
  };

  const handleClose = () => {
    nav.goGoalDetail(goal.id);
  };

  return (
    <Layout title="Thêm đóng góp">
      <AddGoalContribution
        isModal={false}
        goalInfo={goalInfo}
        onSave={handleSave}
        onClose={handleClose}
      />
    </Layout>
  );
}

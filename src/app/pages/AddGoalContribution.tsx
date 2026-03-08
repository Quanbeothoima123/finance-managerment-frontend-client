import React, { useState, useMemo } from 'react';
import { X, Save, Link2, TrendingUp, Smartphone, Plane, ShieldCheck, Bike, BookOpen, Home, Car, Gift, Heart, Target } from 'lucide-react';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { useDemoData } from '../contexts/DemoDataContext';
import { AmountInput } from '../components/AmountInput';

// Icon mapping from goal icon string → lucide component
const goalIconMap: Record<string, React.ComponentType<any>> = {
  smartphone: Smartphone,
  plane: Plane,
  shield: ShieldCheck,
  bike: Bike,
  book: BookOpen,
  home: Home,
  car: Car,
  gift: Gift,
  heart: Heart,
  target: Target,
};

interface GoalInfo {
  name: string;
  icon: string;
  color: string;
  currentAmount: number;
  targetAmount: number;
}

interface AddGoalContributionProps {
  onClose?: () => void;
  onSave?: (data: any) => void;
  isModal?: boolean;
  goalInfo: GoalInfo;
}

export default function AddGoalContribution({
  onClose,
  onSave,
  isModal = true,
  goalInfo,
}: AddGoalContributionProps) {
  const { transactions } = useDemoData();

  const GoalIconComponent = goalIconMap[goalInfo.icon] || Target;

  // Build recent income transactions from context
  const recentTransactions = useMemo(() => {
    return transactions
      .filter(t => t.type === 'income')
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5)
      .map(t => ({
        id: t.id,
        description: t.description,
        amount: Math.abs(t.amount),
        date: t.date,
      }));
  }, [transactions]);

  const [formData, setFormData] = useState({
    amount: '',
    date: new Date().toISOString().split('T')[0],
    linkedTransactionId: '',
    note: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.amount) {
      newErrors.amount = 'Vui lòng nhập số tiền';
    } else if (isNaN(Number(formData.amount)) || Number(formData.amount) <= 0) {
      newErrors.amount = 'Số tiền phải lớn hơn 0';
    }

    if (!formData.date) {
      newErrors.date = 'Vui lòng chọn ngày';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (validateForm()) {
      const data = {
        amount: Number(formData.amount),
        date: formData.date,
        linkedTransactionId: formData.linkedTransactionId || null,
        note: formData.note,
      };
      onSave?.(data);
      // Only call onClose for modal mode (full-page mode handles navigation in onSave)
      if (isModal) {
        onClose?.();
      }
    }
  };

  const handleCancel = () => {
    onClose?.();
  };

  const handleLinkTransaction = (transactionId: string) => {
    const transaction = recentTransactions.find((t) => t.id === transactionId);
    if (transaction) {
      handleInputChange('linkedTransactionId', transactionId);
      handleInputChange('amount', transaction.amount.toString());
      if (!formData.note) {
        handleInputChange('note', `Từ: ${transaction.description}`);
      }
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN').format(amount);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const contributionAmount = Number(formData.amount) || 0;
  const newTotal = goalInfo.currentAmount + contributionAmount;
  const newPercentage = (newTotal / goalInfo.targetAmount) * 100;
  const remainingAfter = goalInfo.targetAmount - newTotal;

  const content = (
    <div className={isModal ? '' : 'min-h-screen bg-[var(--background)]'}>
      <div className={isModal ? '' : 'max-w-2xl mx-auto p-4 md:p-6 pb-20 md:pb-6'}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-[var(--text-primary)]">Thêm đóng góp</h2>
            <p className="text-sm text-[var(--text-secondary)] mt-1">
              Ghi nhận số tiền tiết kiệm vào mục tiêu
            </p>
          </div>
          {isModal && (
            <button
              onClick={handleCancel}
              className="p-2 rounded-[var(--radius-lg)] hover:bg-[var(--surface)] transition-colors"
            >
              <X className="w-5 h-5 text-[var(--text-secondary)]" />
            </button>
          )}
        </div>

        {/* Goal Info */}
        <div className="mb-6 p-4 rounded-[var(--radius-lg)] bg-[var(--surface)]">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-[var(--radius-lg)] flex items-center justify-center"
              style={{ backgroundColor: `${goalInfo.color}20` }}
            >
              <GoalIconComponent className="w-6 h-6" style={{ color: goalInfo.color }} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-[var(--text-primary)]">{goalInfo.name}</p>
              <p className="text-xs text-[var(--text-secondary)]">
                {formatCurrency(goalInfo.currentAmount)}₫ / {formatCurrency(goalInfo.targetAmount)}₫
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
              Số tiền đóng góp <span className="text-[var(--danger)]">*</span>
            </label>
            <AmountInput
              value={formData.amount}
              onChange={(value) => handleInputChange('amount', value)}
              error={errors.amount}
            />
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
              Ngày đóng góp <span className="text-[var(--danger)]">*</span>
            </label>
            <Input
              type="date"
              value={formData.date}
              onChange={(e) => handleInputChange('date', e.target.value)}
              error={errors.date}
            />
          </div>

          {/* Link Transaction */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
              Liên kết giao dịch (tuỳ chọn)
            </label>
            <div className="space-y-2">
              {recentTransactions.map((transaction) => {
                const isLinked = formData.linkedTransactionId === transaction.id;
                return (
                  <button
                    key={transaction.id}
                    type="button"
                    onClick={() => handleLinkTransaction(transaction.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-[var(--radius-lg)] border-2 transition-all text-left ${
                      isLinked
                        ? 'border-[var(--primary)] bg-[var(--primary-light)]'
                        : 'border-[var(--border)] hover:border-[var(--text-tertiary)]'
                    }`}
                  >
                    <div
                      className={`p-2 rounded-[var(--radius-md)] ${
                        isLinked ? 'bg-[var(--primary)]' : 'bg-[var(--surface)]'
                      }`}
                    >
                      <Link2
                        className={`w-4 h-4 ${
                          isLinked ? 'text-white' : 'text-[var(--text-tertiary)]'
                        }`}
                      />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-[var(--text-primary)]">
                        {transaction.description}
                      </p>
                      <p className="text-xs text-[var(--text-secondary)]">
                        {transaction.id} • {formatDate(transaction.date)}
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-[var(--success)] tabular-nums">
                      +{formatCurrency(transaction.amount)}₫
                    </p>
                  </button>
                );
              })}
            </div>
            {formData.linkedTransactionId && (
              <button
                type="button"
                onClick={() => handleInputChange('linkedTransactionId', '')}
                className="mt-2 text-xs text-[var(--danger)] hover:underline"
              >
                Bỏ liên kết
              </button>
            )}
          </div>

          {/* Note */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
              Ghi chú (tuỳ chọn)
            </label>
            <textarea
              placeholder="VD: Lương tháng 2, Thưởng dự án..."
              value={formData.note}
              onChange={(e) => handleInputChange('note', e.target.value)}
              rows={3}
              className="w-full px-4 py-2.5 bg-[var(--input-background)] border border-[var(--border)] rounded-[var(--radius-lg)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] resize-none transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]"
            />
          </div>

          {/* Preview After Contribution */}
          {contributionAmount > 0 && (
            <Card className="bg-[var(--surface)]">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-5 h-5 text-[var(--primary)]" />
                <h4 className="text-sm font-semibold text-[var(--text-primary)]">
                  Sau khi đóng góp
                </h4>
              </div>

              {/* Progress Bar */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-[var(--text-secondary)]">Tiến độ mới</span>
                  <span className="text-sm font-semibold text-[var(--primary)] tabular-nums">
                    {newPercentage.toFixed(1)}%
                  </span>
                </div>
                <div className="h-3 bg-[var(--border)] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[var(--primary)] rounded-full transition-all"
                    style={{ width: `${Math.min(newPercentage, 100)}%` }}
                  />
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-[var(--divider)]">
                <div>
                  <p className="text-xs text-[var(--text-secondary)] mb-1">Tổng mới</p>
                  <p className="text-sm font-semibold text-[var(--text-primary)] tabular-nums">
                    {formatCurrency(newTotal)}₫
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[var(--text-secondary)] mb-1">Mục tiêu</p>
                  <p className="text-sm font-semibold text-[var(--text-primary)] tabular-nums">
                    {formatCurrency(goalInfo.targetAmount)}₫
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[var(--text-secondary)] mb-1">Còn lại</p>
                  <p
                    className={`text-sm font-semibold tabular-nums ${
                      remainingAfter <= 0 ? 'text-[var(--success)]' : 'text-[var(--text-primary)]'
                    }`}
                  >
                    {remainingAfter <= 0 ? '0₫' : `${formatCurrency(remainingAfter)}₫`}
                  </p>
                </div>
              </div>

              {/* Goal Complete Message */}
              {newTotal >= goalInfo.targetAmount && (
                <div className="mt-4 p-3 rounded-[var(--radius-lg)] bg-[var(--success-light)]">
                  <p className="text-sm font-medium text-[var(--success)] text-center">
                    🎉 Chúc mừng! Bạn sẽ hoàn thành mục tiêu này!
                  </p>
                </div>
              )}
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col-reverse md:flex-row gap-3">
            <button
              type="button"
              onClick={handleCancel}
              className="flex-1 md:flex-none px-6 py-2.5 border border-[var(--border)] text-[var(--text-primary)] rounded-[var(--radius-lg)] font-medium hover:bg-[var(--surface)] transition-colors"
            >
              Huỷ
            </button>
            <button
              type="submit"
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white rounded-[var(--radius-lg)] font-medium transition-colors shadow-[var(--shadow-sm)]"
            >
              <Save className="w-5 h-5" />
              <span>Thêm đóng góp</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  if (isModal) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <div
          className="bg-[var(--card)] rounded-[var(--radius-xl)] p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {content}
        </div>
      </div>
    );
  }

  return content;
}
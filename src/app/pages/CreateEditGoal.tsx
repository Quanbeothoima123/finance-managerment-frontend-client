import React, { useState } from 'react';
import { ArrowLeft, Save } from 'lucide-react';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { useAppNavigation } from '../hooks/useAppNavigation';
import { useToast } from '../contexts/ToastContext';
import { useDemoData } from '../contexts/DemoDataContext';

const goalIcons = [
  { key: 'smartphone', label: '📱' },
  { key: 'plane', label: '✈️' },
  { key: 'home', label: '🏠' },
  { key: 'car', label: '🚗' },
  { key: 'bike', label: '🏍️' },
  { key: 'book', label: '📚' },
  { key: 'shield', label: '🛡️' },
  { key: 'target', label: '🎯' },
  { key: 'gift', label: '🎁' },
  { key: 'heart', label: '❤️' },
];
const goalColors = [
  '#3b82f6',
  '#8b5cf6',
  '#10b981',
  '#ef4444',
  '#f59e0b',
  '#06b6d4',
  '#ec4899',
  '#14b8a6',
];

interface CreateEditGoalProps {
  mode?: 'create' | 'edit';
  initialData?: {
    id?: string;
    name: string;
    icon: string;
    color: string;
    targetAmount: string;
    initialAmount: string;
    startDate: string;
    targetDate: string;
    linkedAccountId: string;
    note: string;
    priority: 'high' | 'medium' | 'low';
  };
}

export default function CreateEditGoal({ mode = 'create', initialData }: CreateEditGoalProps) {
  const nav = useAppNavigation();
  const toast = useToast();
  const { updateGoal, addGoal, addGoalContribution, accounts: ctxAccounts } = useDemoData();
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    icon: initialData?.icon || 'target',
    color: initialData?.color || '#3b82f6',
    targetAmount: initialData?.targetAmount || '',
    initialAmount: initialData?.initialAmount || '',
    startDate: initialData?.startDate || new Date().toISOString().split('T')[0],
    targetDate: initialData?.targetDate || '',
    linkedAccountId: initialData?.linkedAccountId || '',
    note: initialData?.note || '',
    priority: (initialData as any)?.priority || ('medium' as 'high' | 'medium' | 'low'),
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

    if (!formData.name.trim()) {
      newErrors.name = 'Vui lòng nhập tên mục tiêu';
    }

    if (!formData.targetAmount) {
      newErrors.targetAmount = 'Vui lòng nhập số tiền mục tiêu';
    } else if (isNaN(Number(formData.targetAmount)) || Number(formData.targetAmount) <= 0) {
      newErrors.targetAmount = 'Số tiền phải lớn hơn 0';
    }

    if (formData.initialAmount) {
      const initial = Number(formData.initialAmount);
      const target = Number(formData.targetAmount);
      if (isNaN(initial) || initial < 0) {
        newErrors.initialAmount = 'Số tiền không hợp lệ';
      } else if (initial > target) {
        newErrors.initialAmount = 'Số tiền ban đầu không thể lớn hơn mục tiêu';
      }
    }

    if (!formData.startDate) {
      newErrors.startDate = 'Vui lòng chọn ngày bắt đầu';
    }

    if (!formData.targetDate) {
      newErrors.targetDate = 'Vui lòng chọn ngày mục tiêu';
    }

    if (formData.startDate && formData.targetDate && formData.startDate >= formData.targetDate) {
      newErrors.targetDate = 'Ngày mục tiêu phải sau ngày bắt đầu';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (validateForm()) {
      if (mode === 'edit' && initialData?.id) {
        updateGoal(initialData.id, {
          name: formData.name,
          icon: formData.icon,
          color: formData.color,
          targetAmount: Number(formData.targetAmount),
          deadline: formData.targetDate,
          priority: formData.priority,
        });
        toast.success('Đã cập nhật mục tiêu');
      } else {
        const initialAmt = Number(formData.initialAmount) || 0;
        const newGoal = addGoal({
          name: formData.name,
          icon: formData.icon,
          color: formData.color,
          targetAmount: Number(formData.targetAmount),
          deadline: formData.targetDate,
          priority: formData.priority,
          contributions: [],
        });
        // If there's an initial amount, add it as first contribution
        if (initialAmt > 0) {
          addGoalContribution(newGoal.id, {
            amount: initialAmt,
            date: formData.startDate,
            notes: 'Số tiền ban đầu',
          });
        }
        toast.success('Đã tạo mục tiêu mới');
      }
      nav.goGoals();
    }
  };

  const handleCancel = () => {
    nav.goBack();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN').format(amount);
  };

  const targetAmount = Number(formData.targetAmount) || 0;
  const initialAmount = Number(formData.initialAmount) || 0;
  const remaining = targetAmount - initialAmount;
  const percentage = targetAmount > 0 ? (initialAmount / targetAmount) * 100 : 0;

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="max-w-4xl mx-auto p-4 md:p-6 pb-20 md:pb-6">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={handleCancel}
            className="flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Quay lại</span>
          </button>
          <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
            {mode === 'create' ? 'Tạo mục tiêu mới' : 'Chỉnh sửa mục tiêu'}
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            {mode === 'create'
              ? 'Đặt mục tiêu tiết kiệm cho những dự định của bạn'
              : 'Cập nhật thông tin mục tiêu'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <Card>
            <h3 className="font-semibold text-[var(--text-primary)] mb-4">Thông tin cơ bản</h3>
            <div className="space-y-4">
              {/* Icon & Color Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                    Biểu tượng
                  </label>
                  <div className="grid grid-cols-6 gap-2">
                    {goalIcons.map((icon) => {
                      const isSelected = formData.icon === icon.key;
                      return (
                        <button
                          key={icon.key}
                          type="button"
                          onClick={() => handleInputChange('icon', icon.key)}
                          className={`aspect-square rounded-[var(--radius-lg)] text-2xl flex items-center justify-center transition-all ${
                            isSelected
                              ? 'bg-[var(--primary-light)] ring-2 ring-[var(--primary)]'
                              : 'bg-[var(--surface)] hover:bg-[var(--border)]'
                          }`}
                        >
                          {icon.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                    Màu sắc
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {goalColors.map((color) => {
                      const isSelected = formData.color === color;
                      return (
                        <button
                          key={color}
                          type="button"
                          onClick={() => handleInputChange('color', color)}
                          className={`aspect-square rounded-[var(--radius-lg)] transition-all ${
                            isSelected ? 'ring-2 ring-offset-2 ring-[var(--text-primary)]' : ''
                          }`}
                          style={{ backgroundColor: color }}
                        />
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Preview */}
              <div className="flex items-center gap-3 p-4 rounded-[var(--radius-lg)] bg-[var(--surface)]">
                <div
                  className="w-14 h-14 rounded-[var(--radius-lg)] flex items-center justify-center text-3xl"
                  style={{ backgroundColor: `${formData.color}20` }}
                >
                  {goalIcons.find(i => i.key === formData.icon)?.label || '🎯'}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-[var(--text-primary)]">
                    {formData.name || 'Tên mục tiêu'}
                  </p>
                  <p className="text-xs text-[var(--text-secondary)]">Xem trước giao diện</p>
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                  Tên mục tiêu <span className="text-[var(--danger)]">*</span>
                </label>
                <Input
                  type="text"
                  placeholder="VD: Du lịch Nhật Bản, Mua laptop mới..."
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  error={errors.name}
                />
              </div>

              {/* Priority */}
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                  Mức ưu tiên
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {([
                    { value: 'high', label: 'Cao', color: 'var(--danger)' },
                    { value: 'medium', label: 'Trung bình', color: 'var(--warning)' },
                    { value: 'low', label: 'Thấp', color: 'var(--success)' },
                  ] as const).map((p) => (
                    <button
                      key={p.value}
                      type="button"
                      onClick={() => handleInputChange('priority', p.value)}
                      className={`px-4 py-2.5 rounded-[var(--radius-lg)] border-2 text-sm font-medium transition-all ${
                        formData.priority === p.value
                          ? 'text-white'
                          : 'border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--text-tertiary)]'
                      }`}
                      style={formData.priority === p.value ? { borderColor: p.color, backgroundColor: p.color } : undefined}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          {/* Financial Details */}
          <Card>
            <h3 className="font-semibold text-[var(--text-primary)] mb-4">Thông tin tài chính</h3>
            <div className="space-y-4">
              {/* Target Amount */}
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                  Số tiền mục tiêu <span className="text-[var(--danger)]">*</span>
                </label>
                <div className="relative">
                  <Input
                    type="text"
                    placeholder="0"
                    value={formData.targetAmount}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^\d]/g, '');
                      handleInputChange('targetAmount', value);
                    }}
                    error={errors.targetAmount}
                    className="pr-12"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]">
                    ₫
                  </span>
                </div>
                {formData.targetAmount && !errors.targetAmount && (
                  <p className="text-xs text-[var(--text-tertiary)] mt-1">
                    {formatCurrency(Number(formData.targetAmount))} đồng
                  </p>
                )}
              </div>

              {/* Initial Amount */}
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                  Số tiền ban đầu (tuỳ chọn)
                </label>
                <div className="relative">
                  <Input
                    type="text"
                    placeholder="0"
                    value={formData.initialAmount}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^\d]/g, '');
                      handleInputChange('initialAmount', value);
                    }}
                    error={errors.initialAmount}
                    className="pr-12"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]">
                    ₫
                  </span>
                </div>
                {formData.initialAmount && !errors.initialAmount && (
                  <p className="text-xs text-[var(--text-tertiary)] mt-1">
                    {formatCurrency(Number(formData.initialAmount))} đồng
                  </p>
                )}
              </div>

              {/* Progress Preview */}
              {targetAmount > 0 && (
                <div className="p-4 rounded-[var(--radius-lg)] bg-[var(--surface)]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-[var(--text-secondary)]">Tiến độ dự kiến</span>
                    <span className="text-sm font-semibold text-[var(--primary)] tabular-nums">
                      {percentage.toFixed(1)}%
                    </span>
                  </div>
                  <div className="h-3 bg-[var(--border)] rounded-full overflow-hidden mb-2">
                    <div
                      className="h-full bg-[var(--primary)] rounded-full transition-all"
                      style={{ width: `${Math.min(percentage, 100)}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs text-[var(--text-secondary)]">
                    <span>Còn lại: {formatCurrency(remaining)}₫</span>
                    <span>Đã có: {formatCurrency(initialAmount)}₫</span>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Timeline */}
          <Card>
            <h3 className="font-semibold text-[var(--text-primary)] mb-4">Thời gian</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                  Ngày bắt đầu <span className="text-[var(--danger)]">*</span>
                </label>
                <Input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => handleInputChange('startDate', e.target.value)}
                  error={errors.startDate}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                  Ngày mục tiêu <span className="text-[var(--danger)]">*</span>
                </label>
                <Input
                  type="date"
                  value={formData.targetDate}
                  onChange={(e) => handleInputChange('targetDate', e.target.value)}
                  error={errors.targetDate}
                />
              </div>
            </div>
          </Card>

          {/* Additional Info */}
          <Card>
            <h3 className="font-semibold text-[var(--text-primary)] mb-4">Thông tin bổ sung</h3>
            <div className="space-y-4">
              {/* Linked Account */}
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                  Liên kết tài khoản tiết kiệm (tuỳ chọn)
                </label>
                <select
                  value={formData.linkedAccountId}
                  onChange={(e) => handleInputChange('linkedAccountId', e.target.value)}
                  className="w-full px-4 py-2.5 bg-[var(--input-background)] border border-[var(--border)] rounded-[var(--radius-lg)] text-[var(--text-primary)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]"
                >
                  <option value="">Không liên kết</option>
                  {ctxAccounts.map(acc => (
                    <option key={acc.id} value={acc.id}>{acc.name}</option>
                  ))}
                </select>
                <p className="text-xs text-[var(--text-tertiary)] mt-1">
                  Liên kết với tài khoản để theo dõi số dư tự động
                </p>
              </div>

              {/* Note */}
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                  Ghi chú (tuỳ chọn)
                </label>
                <textarea
                  placeholder="VD: Tiết kiệm cho chuyến du lịch mùa hè..."
                  value={formData.note}
                  onChange={(e) => handleInputChange('note', e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2.5 bg-[var(--input-background)] border border-[var(--border)] rounded-[var(--radius-lg)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] resize-none transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]"
                />
              </div>
            </div>
          </Card>

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
              <span>{mode === 'create' ? 'Tạo mục tiêu' : 'Lưu thay đổi'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
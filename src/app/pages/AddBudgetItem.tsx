import React, { useState, useMemo } from 'react';
import { X, Save, Utensils, ShoppingCart, Home, Car, Heart, Gift, TrendingDown } from 'lucide-react';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { useDemoData } from '../contexts/DemoDataContext';

const iconMap: Record<string, any> = {
  food: Utensils,
  shopping: ShoppingCart,
  home: Home,
  car: Car,
  health: Heart,
  gift: Gift,
};

interface AddBudgetItemProps {
  onClose?: () => void;
  onSave?: (data: any) => void;
  isModal?: boolean;
}

export default function AddBudgetItem({ onClose, onSave, isModal = true }: AddBudgetItemProps) {
  const { categories: ctxCategories, transactions } = useDemoData();

  // Build category list from context with current month spending
  const categories = useMemo(() => {
    const now = new Date('2026-02-23');
    const year = now.getFullYear();
    const month = now.getMonth();

    return ctxCategories
      .filter(c => c.type === 'expense')
      .map(c => {
        const spent = transactions
          .filter(t => t.type === 'expense' && t.categoryId === c.id &&
            new Date(t.date).getFullYear() === year && new Date(t.date).getMonth() === month)
          .reduce((s, t) => s + Math.abs(t.amount), 0);
        return {
          id: c.id,
          name: c.name,
          icon: c.icon || 'gift',
          color: c.color,
          currentSpent: spent,
        };
      });
  }, [ctxCategories, transactions]);

  const [formData, setFormData] = useState({
    categoryId: '',
    limit: '',
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

    if (!formData.categoryId) {
      newErrors.categoryId = 'Vui lòng chọn danh mục';
    }

    if (!formData.limit) {
      newErrors.limit = 'Vui lòng nhập giới hạn';
    } else if (isNaN(Number(formData.limit)) || Number(formData.limit) <= 0) {
      newErrors.limit = 'Giới hạn phải là số dương';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (validateForm()) {
      const data = {
        categoryId: formData.categoryId,
        limit: Number(formData.limit),
        note: formData.note,
      };
      onSave?.(data);
      onClose?.();
    }
  };

  const handleCancel = () => {
    onClose?.();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN').format(amount);
  };

  const selectedCategory = categories.find((c) => c.id === formData.categoryId);
  const limitAmount = Number(formData.limit) || 0;
  const remaining = selectedCategory ? limitAmount - selectedCategory.currentSpent : 0;

  const content = (
    <div className={isModal ? '' : 'min-h-screen bg-[var(--background)]'}>
      <div className={isModal ? '' : 'max-w-2xl mx-auto p-4 md:p-6 pb-20 md:pb-6'}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-[var(--text-primary)]">
            Thêm danh mục ngân sách
          </h2>
          {isModal && (
            <button
              onClick={handleCancel}
              className="p-2 rounded-[var(--radius-lg)] hover:bg-[var(--surface)] transition-colors"
            >
              <X className="w-5 h-5 text-[var(--text-secondary)]" />
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Category Selection */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-3">
              Chọn danh mục <span className="text-[var(--danger)]">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              {categories.map((category) => {
                const Icon = iconMap[category.icon] || Gift;
                const isSelected = formData.categoryId === category.id;
                return (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => handleInputChange('categoryId', category.id)}
                    className={`flex items-center gap-3 p-3 rounded-[var(--radius-lg)] border-2 transition-all ${
                      isSelected
                        ? 'border-[var(--primary)] bg-[var(--primary-light)]'
                        : 'border-[var(--border)] hover:border-[var(--text-tertiary)]'
                    }`}
                  >
                    <div
                      className="p-2 rounded-[var(--radius-md)]"
                      style={{ backgroundColor: `${category.color}20` }}
                    >
                      <Icon className="w-5 h-5" style={{ color: category.color }} />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-sm font-medium text-[var(--text-primary)]">
                        {category.name}
                      </p>
                      <p className="text-xs text-[var(--text-tertiary)]">
                        Đã chi: {formatCurrency(category.currentSpent)}₫
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
            {errors.categoryId && (
              <p className="text-xs text-[var(--danger)] mt-2">{errors.categoryId}</p>
            )}
          </div>

          {/* Limit Amount */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
              Giới hạn chi tiêu <span className="text-[var(--danger)]">*</span>
            </label>
            <div className="relative">
              <Input
                type="text"
                placeholder="0"
                value={formData.limit}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^\d]/g, '');
                  handleInputChange('limit', value);
                }}
                error={errors.limit}
                className="pr-12"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]">
                ₫
              </span>
            </div>
            {formData.limit && !errors.limit && (
              <p className="text-xs text-[var(--text-tertiary)] mt-1">
                {formatCurrency(Number(formData.limit))} đồng
              </p>
            )}
          </div>

          {/* Note (Optional) */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
              Ghi chú (tuỳ chọn)
            </label>
            <textarea
              placeholder="VD: Tăng 20% so với tháng trước..."
              value={formData.note}
              onChange={(e) => handleInputChange('note', e.target.value)}
              rows={3}
              className="w-full px-4 py-2.5 bg-[var(--input-background)] border border-[var(--border)] rounded-[var(--radius-lg)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] resize-none transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]"
            />
          </div>

          {/* Current Spent Preview */}
          {selectedCategory && limitAmount > 0 && (
            <Card className="bg-[var(--surface)]">
              <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-3">
                Xem trước
              </h4>
              <div className="space-y-3">
                {/* Category Info */}
                <div className="flex items-center gap-3">
                  {(() => {
                    const Icon = iconMap[selectedCategory.icon] || Gift;
                    return (
                      <div
                        className="p-2.5 rounded-[var(--radius-lg)]"
                        style={{ backgroundColor: `${selectedCategory.color}20` }}
                      >
                        <Icon className="w-5 h-5" style={{ color: selectedCategory.color }} />
                      </div>
                    );
                  })()}
                  <div className="flex-1">
                    <p className="text-sm font-medium text-[var(--text-primary)]">
                      {selectedCategory.name}
                    </p>
                    <p className="text-xs text-[var(--text-secondary)]">
                      Đã chi: {formatCurrency(selectedCategory.currentSpent)}₫
                    </p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div>
                  <div className="h-3 bg-[var(--border)] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${Math.min((selectedCategory.currentSpent / limitAmount) * 100, 100)}%`,
                        backgroundColor:
                          selectedCategory.currentSpent > limitAmount
                            ? 'var(--danger)'
                            : selectedCategory.currentSpent > limitAmount * 0.8
                            ? 'var(--warning)'
                            : 'var(--success)',
                      }}
                    />
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 pt-3 border-t border-[var(--divider)]">
                  <div>
                    <p className="text-xs text-[var(--text-secondary)] mb-1">Giới hạn</p>
                    <p className="text-sm font-semibold text-[var(--text-primary)] tabular-nums">
                      {formatCurrency(limitAmount)}₫
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[var(--text-secondary)] mb-1">Đã chi</p>
                    <p className="text-sm font-semibold text-[var(--text-primary)] tabular-nums">
                      {formatCurrency(selectedCategory.currentSpent)}₫
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[var(--text-secondary)] mb-1">Còn lại</p>
                    <p
                      className={`text-sm font-semibold tabular-nums ${
                        remaining < 0 ? 'text-[var(--danger)]' : 'text-[var(--success)]'
                      }`}
                    >
                      {remaining < 0 ? '-' : ''}
                      {formatCurrency(Math.abs(remaining))}₫
                    </p>
                  </div>
                </div>

                {/* Warning */}
                {selectedCategory.currentSpent > limitAmount && (
                  <div className="flex items-start gap-2 p-3 rounded-[var(--radius-lg)] bg-[var(--danger-light)]">
                    <TrendingDown className="w-4 h-4 text-[var(--danger)] flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-[var(--danger)]">
                      Chi tiêu hiện tại đã vượt giới hạn bạn đặt. Xem xét tăng giới hạn hoặc giảm
                      chi tiêu.
                    </p>
                  </div>
                )}
              </div>
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
              <span>Thêm danh mục</span>
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
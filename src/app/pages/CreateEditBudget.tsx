import React, { useState } from 'react';
import {
  ArrowLeft, Save, Plus, X, Utensils, ShoppingCart, Home, Car, Heart, Gift,
  Bell, BellOff, Inbox, BookOpen, Briefcase, GripVertical, Check,
} from 'lucide-react';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { useAppNavigation } from '../hooks/useAppNavigation';
import { useToast } from '../contexts/ToastContext';
import { useDemoData } from '../contexts/DemoDataContext';

// ── Types ─────────────────────────────────────────────────────────────────────

interface BudgetItem {
  id: string;
  categoryId: string;
  categoryName: string;
  icon: string;
  color: string;
  limit: number;
}

const iconMap: Record<string, any> = {
  food: Utensils,
  shopping: ShoppingCart,
  home: Home,
  car: Car,
  health: Heart,
  gift: Gift,
};

// ── Template Definitions ──────────────────────────────────────────────────────

interface BudgetTemplate {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  items: { categoryName: string; categoryId: string; amount: number }[];
}

const BUDGET_TEMPLATES: BudgetTemplate[] = [
  {
    id: 'none',
    name: 'Không dùng template',
    description: 'Tạo ngân sách trống',
    icon: <Plus className="w-5 h-5" />,
    items: [],
  },
  {
    id: 'student',
    name: 'Sinh viên',
    description: 'Ngân sách cơ bản cho sinh viên',
    icon: <BookOpen className="w-5 h-5" />,
    items: [
      { categoryName: 'Ăn uống', categoryId: 'cat-5', amount: 2000000 },
      { categoryName: 'Mua sắm', categoryId: 'cat-7', amount: 500000 },
      { categoryName: 'Di chuyển', categoryId: 'cat-6', amount: 500000 },
      { categoryName: 'Giải trí', categoryId: 'cat-10', amount: 300000 },
    ],
  },
  {
    id: 'professional',
    name: 'Người mới đi làm',
    description: 'Ngân sách cho người đi làm',
    icon: <Briefcase className="w-5 h-5" />,
    items: [
      { categoryName: 'Ăn uống', categoryId: 'cat-5', amount: 3000000 },
      { categoryName: 'Mua sắm', categoryId: 'cat-7', amount: 1000000 },
      { categoryName: 'Di chuyển', categoryId: 'cat-6', amount: 1000000 },
      { categoryName: 'Y tế', categoryId: 'cat-9', amount: 500000 },
      { categoryName: 'Giải trí', categoryId: 'cat-10', amount: 500000 },
    ],
  },
];

// ── Threshold Chips ───────────────────────────────────────────────────────────

const AVAILABLE_THRESHOLDS = [50, 80, 100];

// ── Component ─────────────────────────────────────────────────────────────────

interface CreateEditBudgetProps {
  mode?: 'create' | 'edit';
  initialData?: {
    id?: string;
    name: string;
    periodType: 'monthly' | 'weekly' | 'custom';
    startDate: string;
    endDate: string;
    rollover: boolean;
    items?: BudgetItem[];
    alertsEnabled?: boolean;
    alertThresholds?: number[];
  };
}

export default function CreateEditBudget({ mode = 'create', initialData }: CreateEditBudgetProps) {
  const nav = useAppNavigation();
  const toast = useToast();
  const { updateBudget, addBudget, categories } = useDemoData();

  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    periodType: initialData?.periodType || ('monthly' as 'monthly' | 'weekly' | 'custom'),
    startDate: initialData?.startDate || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: initialData?.endDate || new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0],
    rollover: initialData?.rollover || false,
  });

  const [budgetItems, setBudgetItems] = useState<BudgetItem[]>(
    initialData?.items || []
  );

  // ── Alert state ─────────────────────────────────────────────────
  const [alertsEnabled, setAlertsEnabled] = useState(
    initialData?.alertsEnabled ?? true
  );
  const [alertThresholds, setAlertThresholds] = useState<number[]>(
    initialData?.alertThresholds ?? [80, 100]
  );

  // ── Template state (create mode only) ───────────────────────────
  const [selectedTemplate, setSelectedTemplate] = useState('none');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showAddItem, setShowAddItem] = useState(false);
  const [newItemCatId, setNewItemCatId] = useState('');
  const [newItemLimit, setNewItemLimit] = useState('');
  const [newItemError, setNewItemError] = useState('');

  // Inline edit state
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingLimitValue, setEditingLimitValue] = useState('');

  // Drag-to-reorder state
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Expense categories available (exclude already added ones)
  const availableCategories = categories.filter(
    c => c.type === 'expense' && !budgetItems.some(bi => bi.categoryId === c.id)
  );

  // ── Handlers ────────────────────────────────────────────────────

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const handlePeriodTypeChange = (type: 'monthly' | 'weekly' | 'custom') => {
    const today = new Date();
    let start = '';
    let end = '';

    if (type === 'monthly') {
      const year = today.getFullYear();
      const month = today.getMonth();
      start = new Date(year, month, 1).toISOString().split('T')[0];
      end = new Date(year, month + 1, 0).toISOString().split('T')[0];
    } else if (type === 'weekly') {
      const day = today.getDay();
      const diff = today.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(today.setDate(diff));
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      start = monday.toISOString().split('T')[0];
      end = sunday.toISOString().split('T')[0];
    }

    setFormData((prev) => ({
      ...prev,
      periodType: type,
      startDate: start || prev.startDate,
      endDate: end || prev.endDate,
    }));
  };

  const handleToggleThreshold = (threshold: number) => {
    setAlertThresholds(prev => {
      if (prev.includes(threshold)) {
        const next = prev.filter(t => t !== threshold);
        // Validation: if alertsEnabled and no thresholds selected, auto-select 100%
        if (alertsEnabled && next.length === 0) return [100];
        return next;
      }
      return [...prev, threshold].sort((a, b) => a - b);
    });
  };

  const handleToggleAlerts = (enabled: boolean) => {
    setAlertsEnabled(enabled);
    if (enabled && alertThresholds.length === 0) {
      setAlertThresholds([100]);
    }
  };

  const handleApplyTemplate = (template: BudgetTemplate) => {
    setSelectedTemplate(template.id);
    if (template.id === 'none') {
      setBudgetItems([]);
      return;
    }

    // Map template items to BudgetItems, matching categoryId from categories data
    const items: BudgetItem[] = template.items.map((item, idx) => {
      const cat = categories.find(c => c.id === item.categoryId);
      return {
        id: `tpl-${idx}`,
        categoryId: item.categoryId,
        categoryName: cat?.name || item.categoryName,
        icon: cat?.icon || 'folder',
        color: cat?.color || '#3B82F6',
        limit: item.amount,
      };
    });
    setBudgetItems(items);

    // Auto-fill name
    if (!formData.name) {
      const month = new Date().toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' });
      setFormData(prev => ({ ...prev, name: `Ngân sách ${template.name} - ${month}` }));
    }

    toast.success(`Đã áp dụng template "${template.name}"`);
  };

  const handleAddBudgetItem = () => {
    setShowAddItem(true);
  };

  const handleRemoveItem = (id: string) => {
    setBudgetItems((prev) => prev.filter((item) => item.id !== id));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = 'Vui lòng nhập tên ngân sách';
    if (!formData.startDate) newErrors.startDate = 'Vui lòng chọn ngày bắt đầu';
    if (!formData.endDate) newErrors.endDate = 'Vui lòng chọn ngày kết thúc';
    if (formData.startDate && formData.endDate && formData.startDate >= formData.endDate) {
      newErrors.endDate = 'Ngày kết thúc phải sau ngày bắt đầu';
    }
    if (budgetItems.length === 0) newErrors.items = 'Vui lòng thêm ít nhất một danh mục';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const budgetPayload = {
      name: formData.name,
      period: formData.periodType === 'custom' ? 'custom' as const : formData.periodType,
      startDate: formData.startDate,
      endDate: formData.endDate,
      amount: totalLimit,
      categories: budgetItems.map(i => i.categoryId),
      alertsEnabled,
      alertThresholds: alertsEnabled ? alertThresholds : [],
    };

    if (mode === 'edit' && initialData?.id) {
      updateBudget(initialData.id, budgetPayload);
    } else {
      addBudget(budgetPayload);
    }

    toast.success(mode === 'create' ? 'Đã tạo ngân sách mới' : 'Đã cập nhật ngân sách');
    nav.goBudgets();
  };

  const handleCancel = () => {
    nav.goBack();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN').format(amount);
  };

  const totalLimit = budgetItems.reduce((sum, item) => sum + item.limit, 0);

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
            {mode === 'create' ? 'Tạo ngân sách mới' : 'Chỉnh sửa ngân sách'}
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            {mode === 'create'
              ? 'Đặt giới hạn chi tiêu cho từng danh mục'
              : 'Cập nhật thông tin ngân sách'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* ─── Template Picker (create mode only) ──────────────── */}
          {mode === 'create' && (
            <Card>
              <h3 className="font-semibold text-[var(--text-primary)] mb-1">
                Template ngân sách
              </h3>
              <p className="text-xs text-[var(--text-tertiary)] mb-4">
                Chọn mẫu để bắt đầu nhanh hoặc tạo từ đầu.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {BUDGET_TEMPLATES.map(tpl => {
                  const isSelected = selectedTemplate === tpl.id;
                  return (
                    <button
                      key={tpl.id}
                      type="button"
                      onClick={() => handleApplyTemplate(tpl)}
                      className={`flex flex-col items-start gap-2 p-4 rounded-[var(--radius-lg)] border-2 text-left transition-all ${
                        isSelected
                          ? 'border-[var(--primary)] bg-[var(--primary-light)]'
                          : 'border-[var(--border)] hover:border-[var(--text-tertiary)]'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-[var(--radius-lg)] flex items-center justify-center ${
                        isSelected ? 'bg-[var(--primary)] text-white' : 'bg-[var(--surface)] text-[var(--text-secondary)]'
                      }`}>
                        {tpl.icon}
                      </div>
                      <div>
                        <p className={`font-medium text-sm ${isSelected ? 'text-[var(--primary)]' : 'text-[var(--text-primary)]'}`}>
                          {tpl.name}
                        </p>
                        <p className="text-xs text-[var(--text-tertiary)]">{tpl.description}</p>
                      </div>
                      {tpl.id !== 'none' && isSelected && (
                        <div className="w-full mt-2 pt-2 border-t border-[var(--border)] space-y-1">
                          {tpl.items.map((item, idx) => (
                            <div key={idx} className="flex justify-between text-xs text-[var(--text-secondary)]">
                              <span>{item.categoryName}</span>
                              <span className="tabular-nums">{formatCurrency(item.amount)}₫</span>
                            </div>
                          ))}
                          <div className="flex justify-between text-xs font-semibold text-[var(--primary)] pt-1">
                            <span>Tổng</span>
                            <span className="tabular-nums">
                              {formatCurrency(tpl.items.reduce((s, i) => s + i.amount, 0))}₫
                            </span>
                          </div>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </Card>
          )}

          {/* ─── Basic Info ──────────────────────────────────────── */}
          <Card>
            <h3 className="font-semibold text-[var(--text-primary)] mb-4">
              Thông tin cơ bản
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                  Tên ngân sách <span className="text-[var(--danger)]">*</span>
                </label>
                <Input
                  type="text"
                  placeholder="VD: Ngân sách tháng 2, Ngân sách du lịch..."
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  error={errors.name}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                  Loại kỳ hạn <span className="text-[var(--danger)]">*</span>
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: 'monthly', label: 'Hàng tháng' },
                    { value: 'weekly', label: 'Hàng tuần' },
                    { value: 'custom', label: 'Tuỳ chỉnh' },
                  ].map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => handlePeriodTypeChange(type.value as any)}
                      className={`px-4 py-3 rounded-[var(--radius-lg)] border-2 text-sm font-medium transition-all ${
                        formData.periodType === type.value
                          ? 'border-[var(--primary)] bg-[var(--primary-light)] text-[var(--primary)]'
                          : 'border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--text-tertiary)]'
                      }`}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>

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
                    Ngày kết thúc <span className="text-[var(--danger)]">*</span>
                  </label>
                  <Input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => handleInputChange('endDate', e.target.value)}
                    error={errors.endDate}
                  />
                </div>
              </div>

              {/* Rollover Toggle */}
              <div className="flex items-center justify-between p-4 rounded-[var(--radius-lg)] bg-[var(--surface)]">
                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                    Chuyển số dư sang kỳ sau
                  </label>
                  <p className="text-xs text-[var(--text-tertiary)]">
                    Số tiền còn lại sẽ được cộng vào ngân sách kỳ sau
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleInputChange('rollover', !formData.rollover)}
                  className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${
                    formData.rollover ? 'bg-[var(--primary)]' : 'bg-[var(--border)]'
                  }`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform shadow-sm ${
                    formData.rollover ? 'translate-x-5' : 'translate-x-0'
                  }`} />
                </button>
              </div>
            </div>
          </Card>

          {/* ─── Budget Items ────────────────────────────────────── */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-[var(--text-primary)]">
                  Danh mục ngân sách
                </h3>
                <p className="text-xs text-[var(--text-secondary)] mt-1">
                  Thêm giới hạn chi tiêu cho từng danh mục
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddBudgetItem}
                className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white rounded-[var(--radius-lg)] text-sm font-medium transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Thêm</span>
              </button>
            </div>

            {errors.items && (
              <div className="mb-4 p-3 rounded-[var(--radius-lg)] bg-[var(--danger-light)] text-[var(--danger)] text-sm">
                {errors.items}
              </div>
            )}

            {budgetItems.length > 0 ? (
              <div className="space-y-3">
                {budgetItems.map((item, idx) => {
                  const Icon = iconMap[item.icon] || Plus;
                  const isEditing = editingItemId === item.id;
                  const isDragging = dragIndex === idx;
                  const isDragOver = dragOverIndex === idx;

                  return (
                    <div
                      key={item.id}
                      draggable
                      onDragStart={() => setDragIndex(idx)}
                      onDragOver={(e) => { e.preventDefault(); setDragOverIndex(idx); }}
                      onDragEnd={() => {
                        if (dragIndex !== null && dragOverIndex !== null && dragIndex !== dragOverIndex) {
                          const reordered = [...budgetItems];
                          const [moved] = reordered.splice(dragIndex, 1);
                          reordered.splice(dragOverIndex, 0, moved);
                          setBudgetItems(reordered);
                        }
                        setDragIndex(null);
                        setDragOverIndex(null);
                      }}
                      onDragLeave={() => setDragOverIndex(null)}
                      className={`flex items-center gap-3 p-3 rounded-[var(--radius-lg)] transition-all group ${
                        isDragging ? 'opacity-50 scale-95' : ''
                      } ${isDragOver ? 'ring-2 ring-[var(--primary)] bg-[var(--primary-light)]' : 'bg-[var(--surface)] hover:bg-[var(--border)]'}`}
                    >
                      {/* Drag handle */}
                      <div className="cursor-grab active:cursor-grabbing text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] flex-shrink-0">
                        <GripVertical className="w-4 h-4" />
                      </div>

                      <div
                        className="p-2 rounded-[var(--radius-md)] flex-shrink-0"
                        style={{ backgroundColor: `${item.color}20` }}
                      >
                        <Icon className="w-4 h-4" style={{ color: item.color }} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[var(--text-primary)]">
                          {item.categoryName}
                        </p>
                        {isEditing ? (
                          <div className="flex items-center gap-2 mt-1">
                            <input
                              type="number"
                              autoFocus
                              value={editingLimitValue}
                              onChange={(e) => setEditingLimitValue(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  const val = parseInt(editingLimitValue, 10);
                                  if (val > 0) {
                                    setBudgetItems(prev => prev.map(bi => bi.id === item.id ? { ...bi, limit: val } : bi));
                                  }
                                  setEditingItemId(null);
                                } else if (e.key === 'Escape') {
                                  setEditingItemId(null);
                                }
                              }}
                              className="w-28 px-2 py-1 text-xs bg-[var(--card)] border border-[var(--primary)] rounded-[var(--radius-md)] text-[var(--text-primary)] tabular-nums focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                              placeholder="Nhập số tiền"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const val = parseInt(editingLimitValue, 10);
                                if (val > 0) {
                                  setBudgetItems(prev => prev.map(bi => bi.id === item.id ? { ...bi, limit: val } : bi));
                                }
                                setEditingItemId(null);
                              }}
                              className="p-1 rounded-[var(--radius-sm)] bg-[var(--primary)] text-white"
                            >
                              <Check className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => { setEditingItemId(item.id); setEditingLimitValue(String(item.limit)); }}
                            className="text-xs text-[var(--text-secondary)] hover:text-[var(--primary)] hover:underline transition-colors tabular-nums"
                          >
                            Giới hạn: {formatCurrency(item.limit)}₫
                          </button>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveItem(item.id)}
                        className="p-1.5 rounded-[var(--radius-md)] hover:bg-[var(--danger-light)] text-[var(--text-tertiary)] hover:text-[var(--danger)] transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}

                {budgetItems.length > 1 && (
                  <p className="text-xs text-[var(--text-tertiary)] text-center">
                    Kéo thả để sắp xếp thứ tự • Bấm vào giới hạn để chỉnh sửa
                  </p>
                )}

                <div className="pt-3 border-t border-[var(--divider)] flex items-center justify-between">
                  <span className="text-sm font-medium text-[var(--text-primary)]">
                    Tổng giới hạn:
                  </span>
                  <span className="text-lg font-bold text-[var(--text-primary)] tabular-nums">
                    {formatCurrency(totalLimit)}₫
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-12 h-12 bg-[var(--surface)] rounded-full flex items-center justify-center mx-auto mb-3">
                  <Plus className="w-6 h-6 text-[var(--text-tertiary)]" />
                </div>
                <p className="text-sm text-[var(--text-secondary)] mb-3">
                  Chưa có danh mục nào
                </p>
                <button
                  type="button"
                  onClick={handleAddBudgetItem}
                  className="text-sm text-[var(--primary)] hover:underline font-medium"
                >
                  Thêm danh mục đầu tiên
                </button>
              </div>
            )}
          </Card>

          {/* ─── Alert Thresholds ─────────────────────────────────── */}
          <Card>
            <h3 className="font-semibold text-[var(--text-primary)] mb-1 flex items-center gap-2">
              <Bell className="w-5 h-5 text-[var(--primary)]" />
              Cảnh báo
            </h3>
            <p className="text-xs text-[var(--text-tertiary)] mb-4">
              App sẽ thông báo khi chi tiêu đạt ngưỡng.
            </p>

            {/* Main toggle */}
            <div className="flex items-center justify-between py-3 mb-4">
              <div className="flex items-center gap-3">
                {alertsEnabled ? (
                  <Bell className="w-5 h-5 text-[var(--success)]" />
                ) : (
                  <BellOff className="w-5 h-5 text-[var(--text-tertiary)]" />
                )}
                <span className="font-medium text-[var(--text-primary)]">Bật cảnh báo</span>
              </div>
              <button
                type="button"
                onClick={() => handleToggleAlerts(!alertsEnabled)}
                className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${
                  alertsEnabled ? 'bg-[var(--success)]' : 'bg-[var(--border)]'
                }`}
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform shadow-sm ${
                  alertsEnabled ? 'translate-x-5' : 'translate-x-0'
                }`} />
              </button>
            </div>

            {/* Threshold chips */}
            {alertsEnabled && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                    Ngưỡng cảnh báo
                  </label>
                  <div className="flex gap-3">
                    {AVAILABLE_THRESHOLDS.map(threshold => {
                      const selected = alertThresholds.includes(threshold);
                      return (
                        <button
                          key={threshold}
                          type="button"
                          onClick={() => handleToggleThreshold(threshold)}
                          className={`px-4 py-2.5 rounded-[var(--radius-lg)] border-2 text-sm font-semibold transition-all tabular-nums ${
                            selected
                              ? threshold === 100
                                ? 'border-[var(--danger)] bg-[var(--danger-light)] text-[var(--danger)]'
                                : threshold === 80
                                  ? 'border-[var(--warning)] bg-[var(--warning-light)] text-[var(--warning)]'
                                  : 'border-[var(--info)] bg-[var(--info-light)] text-[var(--info)]'
                              : 'border-[var(--border)] text-[var(--text-tertiary)] hover:border-[var(--text-tertiary)]'
                          }`}
                        >
                          {threshold}%
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Alert channel (read-only) */}
                <div className="flex items-center gap-3 p-3 bg-[var(--surface)] rounded-[var(--radius-lg)]">
                  <Inbox className="w-5 h-5 text-[var(--text-secondary)]" />
                  <div className="flex-1">
                    <span className="text-sm text-[var(--text-primary)]">Channel: In-app Inbox</span>
                    <p className="text-xs text-[var(--text-tertiary)]">Luôn bật</p>
                  </div>
                  <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-[var(--success-light)] text-[var(--success)]">
                    Enabled
                  </span>
                </div>
              </div>
            )}
          </Card>

          {/* ─── Action Buttons ───────────────────────────────────── */}
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
              <span>{mode === 'create' ? 'Tạo ngân sách' : 'Lưu thay đổi'}</span>
            </button>
          </div>
        </form>

        {/* Add Budget Item Modal */}
        {showAddItem && (
          <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            onClick={() => { setShowAddItem(false); setNewItemCatId(''); setNewItemLimit(''); setNewItemError(''); }}
          >
            <div
              className="bg-[var(--card)] rounded-[var(--radius-xl)] p-6 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
                Thêm danh mục ngân sách
              </h3>

              {availableCategories.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-sm text-[var(--text-secondary)] mb-4">
                    Tất cả danh mục chi tiêu đã được thêm vào ngân sách.
                  </p>
                  <button
                    onClick={() => { setShowAddItem(false); setNewItemCatId(''); setNewItemLimit(''); setNewItemError(''); }}
                    className="w-full px-4 py-2.5 border border-[var(--border)] text-[var(--text-primary)] rounded-[var(--radius-lg)] font-medium hover:bg-[var(--surface)] transition-colors"
                  >
                    Đóng
                  </button>
                </div>
              ) : (
                <>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                        Danh mục chi tiêu <span className="text-[var(--danger)]">*</span>
                      </label>
                      {/* Category grid picker */}
                      <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                        {availableCategories.map(cat => {
                          const selected = newItemCatId === cat.id;
                          return (
                            <button
                              key={cat.id}
                              type="button"
                              onClick={() => setNewItemCatId(cat.id)}
                              className={`flex items-center gap-2 p-2.5 rounded-[var(--radius-lg)] border-2 text-left transition-all ${
                                selected
                                  ? 'border-[var(--primary)] bg-[var(--primary-light)]'
                                  : 'border-[var(--border)] hover:border-[var(--text-tertiary)]'
                              }`}
                            >
                              <div
                                className="w-8 h-8 rounded-[var(--radius-md)] flex items-center justify-center flex-shrink-0"
                                style={{ backgroundColor: `${cat.color}20` }}
                              >
                                <span className="text-xs" style={{ color: cat.color }}>●</span>
                              </div>
                              <span className={`text-sm font-medium truncate ${selected ? 'text-[var(--primary)]' : 'text-[var(--text-primary)]'}`}>
                                {cat.name}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                        Giới hạn chi tiêu (₫) <span className="text-[var(--danger)]">*</span>
                      </label>
                      <Input
                        type="number"
                        value={newItemLimit}
                        onChange={(e) => { setNewItemLimit(e.target.value); setNewItemError(''); }}
                        error={newItemError}
                        placeholder="VD: 1000000"
                      />
                    </div>
                  </div>
                  <div className="mt-6 flex gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        // Validate
                        if (!newItemCatId) { setNewItemError('Vui lòng chọn danh mục'); return; }
                        const limit = parseInt(newItemLimit, 10);
                        if (!limit || limit <= 0) { setNewItemError('Vui lòng nhập số tiền hợp lệ'); return; }
                        const cat = categories.find(c => c.id === newItemCatId);
                        if (!cat) return;
                        setBudgetItems(prev => [...prev, {
                          id: `bi-${Date.now()}`,
                          categoryId: cat.id,
                          categoryName: cat.name,
                          icon: cat.icon,
                          color: cat.color,
                          limit,
                        }]);
                        setShowAddItem(false);
                        setNewItemCatId('');
                        setNewItemLimit('');
                        setNewItemError('');
                        if (errors.items) setErrors(prev => ({ ...prev, items: '' }));
                      }}
                      className="flex-1 px-4 py-2.5 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white rounded-[var(--radius-lg)] font-medium transition-colors"
                    >
                      Thêm danh mục
                    </button>
                    <button
                      type="button"
                      onClick={() => { setShowAddItem(false); setNewItemCatId(''); setNewItemLimit(''); setNewItemError(''); }}
                      className="px-4 py-2.5 border border-[var(--border)] text-[var(--text-primary)] rounded-[var(--radius-lg)] font-medium hover:bg-[var(--surface)] transition-colors"
                    >
                      Huỷ
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
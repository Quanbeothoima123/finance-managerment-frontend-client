import React, { useState } from 'react';
import {
  ArrowLeft,
  Save,
  ShoppingCart,
  Home,
  Car,
  Utensils,
  Coffee,
  Shirt,
  Heart,
  Briefcase,
  DollarSign,
  Gift,
  TrendingUp,
  Smartphone,
  Plane,
  Book,
  Music,
  Film,
  Dumbbell,
  PawPrint,
  Baby,
  Wrench,
  Lightbulb,
  Newspaper,
  Package,
} from 'lucide-react';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { useAppNavigation } from '../hooks/useAppNavigation';
import { useToast } from '../contexts/ToastContext';
import { useDemoData } from '../contexts/DemoDataContext';

const availableIcons = [
  { value: 'shopping', label: 'Mua sắm', Icon: ShoppingCart },
  { value: 'home', label: 'Nhà ở', Icon: Home },
  { value: 'car', label: 'Xe cộ', Icon: Car },
  { value: 'food', label: 'Đồ ăn', Icon: Utensils },
  { value: 'coffee', label: 'Cà phê', Icon: Coffee },
  { value: 'shirt', label: 'Quần áo', Icon: Shirt },
  { value: 'health', label: 'Sức khỏe', Icon: Heart },
  { value: 'work', label: 'Công việc', Icon: Briefcase },
  { value: 'salary', label: 'Lương', Icon: DollarSign },
  { value: 'gift', label: 'Quà tặng', Icon: Gift },
  { value: 'investment', label: 'Đầu tư', Icon: TrendingUp },
  { value: 'phone', label: 'Điện thoại', Icon: Smartphone },
  { value: 'travel', label: 'Du lịch', Icon: Plane },
  { value: 'education', label: 'Giáo dục', Icon: Book },
  { value: 'entertainment', label: 'Giải trí', Icon: Music },
  { value: 'movie', label: 'Phim ảnh', Icon: Film },
  { value: 'fitness', label: 'Thể dục', Icon: Dumbbell },
  { value: 'pet', label: 'Thú cưng', Icon: PawPrint },
  { value: 'baby', label: 'Trẻ em', Icon: Baby },
  { value: 'maintenance', label: 'Bảo trì', Icon: Wrench },
  { value: 'utility', label: 'Tiện ích', Icon: Lightbulb },
  { value: 'subscription', label: 'Dịch vụ', Icon: Newspaper },
  { value: 'delivery', label: 'Giao hàng', Icon: Package },
];

const colorPalette = [
  '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16',
  '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9',
  '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef',
  '#ec4899', '#f43f5e', '#64748b', '#475569', '#1e293b',
];

interface CreateEditCategoryProps {
  mode?: 'create' | 'edit';
  initialData?: {
    id?: string;
    name: string;
    kind: 'expense' | 'income' | 'both';
    icon: string;
    color: string;
    parentId: string;
    active: boolean;
  };
}

export default function CreateEditCategory({
  mode = 'create',
  initialData,
}: CreateEditCategoryProps) {
  const nav = useAppNavigation();
  const toast = useToast();
  const { addCategory, updateCategory, categories } = useDemoData();

  // Build parent categories from DemoDataContext (root categories only, excluding current in edit mode)
  const parentCategoryOptions = React.useMemo(() => {
    // Collect all descendant IDs of the current category to prevent circular references
    const excludeIds = new Set<string>();
    if (mode === 'edit' && initialData?.id) {
      excludeIds.add(initialData.id);
      // Recursively collect all descendants
      const collectDescendants = (parentId: string) => {
        categories.forEach(cat => {
          if (cat.parentId === parentId && !excludeIds.has(cat.id)) {
            excludeIds.add(cat.id);
            collectDescendants(cat.id);
          }
        });
      };
      collectDescendants(initialData.id);
    }

    const rootCats = categories.filter(cat => !cat.parentId);
    const options = [{ value: '', label: 'Không có (danh mục gốc)' }];
    rootCats.forEach(cat => {
      if (excludeIds.has(cat.id)) return;
      options.push({ value: cat.id, label: cat.name });
    });
    return options;
  }, [categories, mode, initialData?.id]);

  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    kind: initialData?.kind || 'expense' as 'expense' | 'income' | 'both',
    icon: initialData?.icon || 'shopping',
    color: initialData?.color || '#ef4444',
    parentId: initialData?.parentId || '',
    active: initialData?.active !== undefined ? initialData.active : true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Vui lòng nhập tên danh mục';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (validateForm()) {
      if (mode === 'create') {
        addCategory({
          name: formData.name,
          type: formData.kind === 'both' ? 'expense' : formData.kind,
          icon: formData.icon,
          color: formData.color,
          parentId: formData.parentId || undefined,
        });
        toast.success('Đã tạo danh mục mới');
      } else {
        if (initialData?.id) {
          updateCategory(initialData.id, {
            name: formData.name,
            type: formData.kind === 'both' ? 'expense' : formData.kind,
            icon: formData.icon,
            color: formData.color,
            parentId: formData.parentId || undefined,
          });
          toast.success('Đã cập nhật danh mục');
        }
      }
      nav.goCategories();
    }
  };

  const handleCancel = () => {
    nav.goBack();
  };

  const selectedIconData = availableIcons.find((i) => i.value === formData.icon);
  const SelectedIcon = selectedIconData?.Icon || ShoppingCart;

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
            {mode === 'create' ? 'Tạo danh mục mới' : 'Chỉnh sửa danh mục'}
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            {mode === 'create'
              ? 'Thêm danh mục mới để phân loại giao dịch'
              : 'Cập nhật thông tin danh mục'}
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Basic Info */}
              <Card>
                <h3 className="font-semibold text-[var(--text-primary)] mb-4">
                  Thông tin cơ bản
                </h3>
                <div className="space-y-4">
                  {/* Name */}
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                      Tên danh mục <span className="text-[var(--danger)]">*</span>
                    </label>
                    <Input
                      type="text"
                      placeholder="VD: Ăn sáng, Mua sắm..."
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      error={errors.name}
                    />
                  </div>

                  {/* Kind */}
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                      Loại danh mục <span className="text-[var(--danger)]">*</span>
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { value: 'expense', label: 'Chi tiêu', color: 'danger' },
                        { value: 'income', label: 'Thu nhập', color: 'success' },
                        { value: 'both', label: 'Cả hai', color: 'info' },
                      ].map((kind) => {
                        const isSelected = formData.kind === kind.value;
                        return (
                          <button
                            key={kind.value}
                            type="button"
                            onClick={() => handleInputChange('kind', kind.value)}
                            className={`px-3 py-2.5 rounded-[var(--radius-lg)] border-2 text-sm font-medium transition-all ${
                              isSelected
                                ? `border-[var(--${kind.color})] bg-[var(--${kind.color}-light)] text-[var(--${kind.color})]`
                                : 'border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--text-tertiary)]'
                            }`}
                          >
                            {kind.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Parent Category */}
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                      Danh mục cha
                    </label>
                    <select
                      value={formData.parentId}
                      onChange={(e) => handleInputChange('parentId', e.target.value)}
                      className="w-full px-4 py-2.5 bg-[var(--input-background)] border border-[var(--border)] rounded-[var(--radius-lg)] text-[var(--text-primary)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]"
                    >
                      {parentCategoryOptions.map((cat) => (
                        <option key={cat.value} value={cat.value}>
                          {cat.label}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-[var(--text-tertiary)] mt-1">
                      Để trống nếu đây là danh mục gốc
                    </p>
                  </div>
                </div>
              </Card>

              {/* Active Status */}
              <Card>
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                      Trạng thái hoạt động
                    </label>
                    <p className="text-xs text-[var(--text-tertiary)]">
                      Danh mục có hiển thị khi chọn không
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.active}
                      onChange={(e) => handleInputChange('active', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-[var(--surface)] peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[var(--focus-ring)] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--primary)]"></div>
                  </label>
                </div>
              </Card>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Icon Picker */}
              <Card>
                <h3 className="font-semibold text-[var(--text-primary)] mb-4">
                  Biểu tượng
                </h3>
                <div className="space-y-4">
                  {/* Selected Icon Preview */}
                  <div className="flex items-center gap-4">
                    <div
                      className="p-4 rounded-[var(--radius-lg)]"
                      style={{ backgroundColor: `${formData.color}20` }}
                    >
                      <SelectedIcon className="w-8 h-8" style={{ color: formData.color }} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-[var(--text-primary)]">
                        {selectedIconData?.label || 'Chọn biểu tượng'}
                      </p>
                      <button
                        type="button"
                        onClick={() => setShowIconPicker(!showIconPicker)}
                        className="text-xs text-[var(--primary)] hover:underline"
                      >
                        {showIconPicker ? 'Ẩn' : 'Thay đổi biểu tượng'}
                      </button>
                    </div>
                  </div>

                  {/* Icon Grid */}
                  {showIconPicker && (
                    <div className="grid grid-cols-6 gap-2 p-3 rounded-[var(--radius-lg)] bg-[var(--surface)] max-h-[300px] overflow-y-auto">
                      {availableIcons.map((icon) => {
                        const Icon = icon.Icon;
                        const isSelected = formData.icon === icon.value;
                        return (
                          <button
                            key={icon.value}
                            type="button"
                            onClick={() => {
                              handleInputChange('icon', icon.value);
                              setShowIconPicker(false);
                            }}
                            className={`p-3 rounded-[var(--radius-md)] transition-colors ${
                              isSelected
                                ? 'bg-[var(--primary-light)] text-[var(--primary)]'
                                : 'hover:bg-[var(--border)] text-[var(--text-secondary)]'
                            }`}
                            title={icon.label}
                          >
                            <Icon className="w-5 h-5" />
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </Card>

              {/* Color Picker */}
              <Card>
                <h3 className="font-semibold text-[var(--text-primary)] mb-4">
                  Màu sắc
                </h3>
                <div className="space-y-4">
                  {/* Selected Color */}
                  <div className="flex items-center gap-4">
                    <div
                      className="w-16 h-16 rounded-[var(--radius-lg)] border-2 border-[var(--border)]"
                      style={{ backgroundColor: formData.color }}
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-[var(--text-primary)] uppercase">
                        {formData.color}
                      </p>
                      <button
                        type="button"
                        onClick={() => setShowColorPicker(!showColorPicker)}
                        className="text-xs text-[var(--primary)] hover:underline"
                      >
                        {showColorPicker ? 'Ẩn' : 'Thay đổi màu sắc'}
                      </button>
                    </div>
                  </div>

                  {/* Color Grid */}
                  {showColorPicker && (
                    <div className="grid grid-cols-10 gap-2 p-3 rounded-[var(--radius-lg)] bg-[var(--surface)]">
                      {colorPalette.map((color) => {
                        const isSelected = formData.color === color;
                        return (
                          <button
                            key={color}
                            type="button"
                            onClick={() => {
                              handleInputChange('color', color);
                              setShowColorPicker(false);
                            }}
                            className={`w-8 h-8 rounded-[var(--radius-md)] transition-all ${
                              isSelected
                                ? 'ring-2 ring-[var(--primary)] ring-offset-2 ring-offset-[var(--card)]'
                                : 'hover:scale-110'
                            }`}
                            style={{ backgroundColor: color }}
                            title={color}
                          />
                        );
                      })}
                    </div>
                  )}

                  {/* Custom Color Input */}
                  <div>
                    <label className="block text-xs font-medium text-[var(--text-secondary)] mb-2">
                      Hoặc nhập mã màu tuỳ chỉnh
                    </label>
                    <Input
                      type="text"
                      placeholder="#000000"
                      value={formData.color}
                      onChange={(e) => handleInputChange('color', e.target.value)}
                    />
                  </div>
                </div>
              </Card>

              {/* Preview */}
              <Card>
                <h3 className="font-semibold text-[var(--text-primary)] mb-4">
                  Xem trước
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 rounded-[var(--radius-lg)] bg-[var(--surface)]">
                    <div
                      className="p-2 rounded-[var(--radius-md)]"
                      style={{ backgroundColor: `${formData.color}20` }}
                    >
                      <SelectedIcon className="w-5 h-5" style={{ color: formData.color }} />
                    </div>
                    <span className="text-sm font-medium text-[var(--text-primary)]">
                      {formData.name || 'Tên danh mục'}
                    </span>
                    <span
                      className={`ml-auto text-xs px-2 py-1 rounded-[var(--radius-sm)] ${
                        formData.kind === 'income'
                          ? 'bg-[var(--success-light)] text-[var(--success)]'
                          : formData.kind === 'expense'
                          ? 'bg-[var(--danger-light)] text-[var(--danger)]'
                          : 'bg-[var(--info-light)] text-[var(--info)]'
                      }`}
                    >
                      {formData.kind === 'income'
                        ? 'Thu'
                        : formData.kind === 'expense'
                        ? 'Chi'
                        : 'Cả hai'}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--text-tertiary)] text-center">
                    Danh mục sẽ hiển thị như trên
                  </p>
                </div>
              </Card>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col-reverse md:flex-row gap-3 mt-6">
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
              <span>{mode === 'create' ? 'Tạo danh mục' : 'Lưu thay đổi'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
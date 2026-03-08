import React, { useState } from 'react';
import { ArrowLeft, Save, Hash } from 'lucide-react';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { useAppNavigation } from '../hooks/useAppNavigation';
import { useToast } from '../contexts/ToastContext';
import { useDemoData } from '../contexts/DemoDataContext';

const colorPalette = [
  '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16',
  '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9',
  '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef',
  '#ec4899', '#f43f5e', '#64748b', '#475569', '#1e293b',
];

interface CreateEditTagProps {
  mode?: 'create' | 'edit';
  initialData?: {
    id?: string;
    name: string;
    color: string;
  };
}

export default function CreateEditTag({
  mode = 'create',
  initialData,
}: CreateEditTagProps) {
  const nav = useAppNavigation();
  const toast = useToast();
  const { addTag, updateTag } = useDemoData();
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    color: initialData?.color || '#ef4444',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
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
      newErrors.name = 'Vui lòng nhập tên nhãn';
    }

    if (!/^#[0-9A-Fa-f]{6}$/i.test(formData.color)) {
      newErrors.color = 'Mã màu không hợp lệ (vd: #ff0000)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (validateForm()) {
      if (mode === 'create') {
        addTag({ name: formData.name, color: formData.color });
        toast.success('Đã tạo nhãn mới');
      } else {
        if (initialData?.id) {
          updateTag(initialData.id, { name: formData.name, color: formData.color });
          toast.success('Đã cập nhật nhãn');
        }
      }
      nav.goTags();
    }
  };

  const handleCancel = () => {
    nav.goBack();
  };

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="max-w-2xl mx-auto p-4 md:p-6 pb-20 md:pb-6">
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
            {mode === 'create' ? 'Tạo nhãn mới' : 'Chỉnh sửa nhãn'}
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            {mode === 'create'
              ? 'Thêm nhãn mới để gắn vào giao dịch'
              : 'Cập nhật thông tin nhãn'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name */}
          <Card>
            <h3 className="font-semibold text-[var(--text-primary)] mb-4">
              Tên nhãn
            </h3>
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                Tên <span className="text-[var(--danger)]">*</span>
              </label>
              <Input
                type="text"
                placeholder="VD: Cần thiết, Công việc..."
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                error={errors.name}
              />
              <p className="text-xs text-[var(--text-tertiary)] mt-1">
                Tên ngắn gọn, dễ nhớ
              </p>
            </div>
          </Card>

          {/* Color */}
          <Card>
            <h3 className="font-semibold text-[var(--text-primary)] mb-4">
              Màu sắc
            </h3>
            <div className="space-y-4">
              {/* Selected Color */}
              <div className="flex items-center gap-4">
                <div
                  className="w-20 h-20 rounded-[var(--radius-lg)] border-2 border-[var(--border)] flex items-center justify-center"
                  style={{ backgroundColor: formData.color }}
                >
                  <Hash className="w-8 h-8 text-white opacity-60" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-[var(--text-primary)] uppercase mb-1">
                    {formData.color}
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowColorPicker(!showColorPicker)}
                    className="text-xs text-[var(--primary)] hover:underline"
                  >
                    {showColorPicker ? 'Ẩn bảng màu' : 'Chọn từ bảng màu'}
                  </button>
                </div>
              </div>

              {/* Color Grid */}
              {showColorPicker && (
                <div className="grid grid-cols-10 gap-2 p-4 rounded-[var(--radius-lg)] bg-[var(--surface)]">
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
                        className={`w-10 h-10 rounded-[var(--radius-md)] transition-all ${
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
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                  Hoặc nhập mã màu HEX
                </label>
                <Input
                  type="text"
                  placeholder="#000000"
                  value={formData.color}
                  onChange={(e) => handleInputChange('color', e.target.value)}
                  error={errors.color}
                />
              </div>
            </div>
          </Card>

          {/* Preview */}
          <Card>
            <h3 className="font-semibold text-[var(--text-primary)] mb-4">
              Xem trước
            </h3>
            <div className="space-y-4">
              {/* Chip Preview - Large */}
              <div className="flex items-center justify-center">
                <div
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-[var(--radius-lg)] transition-all"
                  style={{
                    backgroundColor: `${formData.color}15`,
                    borderLeft: `4px solid ${formData.color}`,
                  }}
                >
                  <Hash className="w-5 h-5" style={{ color: formData.color }} />
                  <span
                    className="text-lg font-medium"
                    style={{ color: formData.color }}
                  >
                    {formData.name || 'Tên nhãn'}
                  </span>
                </div>
              </div>

              {/* Chip Preview - Small */}
              <div className="flex items-center justify-center gap-3">
                <div
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
                  style={{
                    backgroundColor: `${formData.color}20`,
                    color: formData.color,
                  }}
                >
                  <Hash className="w-3 h-3" />
                  <span>{formData.name || 'Tên nhãn'}</span>
                </div>

                <div
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-md)] text-sm font-medium border"
                  style={{
                    backgroundColor: 'var(--card)',
                    borderColor: formData.color,
                    color: formData.color,
                  }}
                >
                  <Hash className="w-3.5 h-3.5" />
                  <span>{formData.name || 'Tên nhãn'}</span>
                </div>
              </div>

              <p className="text-xs text-[var(--text-tertiary)] text-center">
                Nhãn sẽ hiển thị như trên trong giao dịch
              </p>
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
              <span>{mode === 'create' ? 'Tạo nhãn' : 'Lưu thay đổi'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
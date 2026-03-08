import React, { useState, useMemo } from 'react';
import {
  ArrowLeft,
  Save,
  Store,
} from 'lucide-react';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { useAppNavigation } from '../hooks/useAppNavigation';
import { useToast } from '../contexts/ToastContext';
import { useDemoData } from '../contexts/DemoDataContext';

interface CreateEditMerchantProps {
  mode?: 'create' | 'edit';
  initialData?: {
    id?: string;
    name: string;
    defaultCategory: string;
  };
}

export default function CreateEditMerchant({
  mode = 'create',
  initialData,
}: CreateEditMerchantProps) {
  const nav = useAppNavigation();
  const toast = useToast();
  const { categories, addMerchant, updateMerchant } = useDemoData();

  // Build category options from DemoDataContext
  const categoryOptions = useMemo(() => {
    const options = [{ value: '', label: 'Kh\u00f4ng \u0111\u1eb7t m\u1eb7c \u0111\u1ecbnh' }];
    const rootCats = categories.filter(c => !c.parentId);
    rootCats.forEach(cat => {
      options.push({ value: cat.id, label: cat.name });
      const children = categories.filter(c => c.parentId === cat.id);
      children.forEach(child => {
        options.push({ value: child.id, label: `  \u2192 ${child.name}` });
      });
    });
    return options;
  }, [categories]);

  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    defaultCategory: initialData?.defaultCategory || '',
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
      newErrors.name = 'Vui l\u00f2ng nh\u1eadp t\u00ean nh\u00e0 cung c\u1ea5p';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (validateForm()) {
      const selectedCat = categories.find(c => c.id === formData.defaultCategory);

      if (mode === 'create') {
        addMerchant({
          name: formData.name,
          defaultCategory: formData.defaultCategory || undefined,
          categoryName: selectedCat?.name,
          totalSpent: 0,
          transactionCount: 0,
          lastTransaction: new Date().toISOString(),
        });
        toast.success('\u0110\u00e3 t\u1ea1o nh\u00e0 cung c\u1ea5p m\u1edbi');
      } else {
        if (initialData?.id) {
          updateMerchant(initialData.id, {
            name: formData.name,
            defaultCategory: formData.defaultCategory || undefined,
            categoryName: selectedCat?.name,
          });
          toast.success('\u0110\u00e3 c\u1eadp nh\u1eadt nh\u00e0 cung c\u1ea5p');
        }
      }
      nav.goMerchants();
    }
  };

  const handleCancel = () => {
    nav.goBack();
  };

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
            <span className="font-medium">Quay l\u1ea1i</span>
          </button>
          <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
            {mode === 'create' ? 'Th\u00eam nh\u00e0 cung c\u1ea5p' : 'Ch\u1ec9nh s\u1eeda nh\u00e0 cung c\u1ea5p'}
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            {mode === 'create'
              ? 'Th\u00eam nh\u00e0 cung c\u1ea5p m\u1edbi \u0111\u1ec3 t\u1ef1 \u0111\u1ed9ng ph\u00e2n lo\u1ea1i giao d\u1ecbch'
              : 'C\u1eadp nh\u1eadt th\u00f4ng tin nh\u00e0 cung c\u1ea5p'}
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column - Form */}
            <div className="space-y-6">
              <Card>
                <h3 className="font-semibold text-[var(--text-primary)] mb-4">
                  Th\u00f4ng tin
                </h3>
                <div className="space-y-4">
                  {/* Name */}
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                      T\u00ean nh\u00e0 cung c\u1ea5p <span className="text-[var(--danger)]">*</span>
                    </label>
                    <Input
                      type="text"
                      placeholder="VD: Highlands Coffee"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      error={errors.name}
                    />
                    <p className="text-xs text-[var(--text-tertiary)] mt-1">
                      T\u00ean s\u1ebd \u0111\u01b0\u1ee3c d\u00f9ng \u0111\u1ec3 t\u1ef1 \u0111\u1ed9ng ph\u00e1t hi\u1ec7n trong giao d\u1ecbch
                    </p>
                  </div>

                  {/* Default Category */}
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                      Danh m\u1ee5c m\u1eb7c \u0111\u1ecbnh
                    </label>
                    <select
                      value={formData.defaultCategory}
                      onChange={(e) => handleInputChange('defaultCategory', e.target.value)}
                      className="w-full px-4 py-2.5 bg-[var(--input-background)] border border-[var(--border)] rounded-[var(--radius-lg)] text-[var(--text-primary)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]"
                    >
                      {categoryOptions.map((cat) => (
                        <option key={cat.value} value={cat.value}>
                          {cat.label}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-[var(--text-tertiary)] mt-1">
                      Giao d\u1ecbch t\u1eeb nh\u00e0 cung c\u1ea5p n\u00e0y s\u1ebd t\u1ef1 \u0111\u1ed9ng d\u00f9ng danh m\u1ee5c n\u00e0y
                    </p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Right Column - Preview */}
            <div className="space-y-6">
              <Card>
                <h3 className="font-semibold text-[var(--text-primary)] mb-4">
                  Xem tr\u01b0\u1edbc
                </h3>
                <div className="flex items-center gap-4 p-4 rounded-[var(--radius-lg)] bg-[var(--surface)]">
                  <div className="w-12 h-12 bg-[var(--background)] rounded-[var(--radius-lg)] flex items-center justify-center">
                    <Store className="w-6 h-6 text-[var(--text-secondary)]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-[var(--text-primary)] truncate">
                      {formData.name || 'T\u00ean nh\u00e0 cung c\u1ea5p'}
                    </p>
                    <p className="text-xs text-[var(--text-secondary)]">
                      {formData.defaultCategory
                        ? categoryOptions.find(c => c.value === formData.defaultCategory)?.label || 'Danh m\u1ee5c m\u1eb7c \u0111\u1ecbnh'
                        : 'Ch\u01b0a \u0111\u1eb7t danh m\u1ee5c m\u1eb7c \u0111\u1ecbnh'}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-[var(--text-tertiary)] text-center mt-3">
                  Nh\u00e0 cung c\u1ea5p s\u1ebd hi\u1ec3n th\u1ecb nh\u01b0 tr\u00ean
                </p>
              </Card>

              {mode === 'edit' && (
                <Card className="bg-[var(--info-light)] border-[var(--info)]">
                  <div className="flex items-start gap-3">
                    <Store className="w-5 h-5 text-[var(--info)] flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-[var(--text-primary)] mb-1">
                        L\u01b0u \u00fd khi ch\u1ec9nh s\u1eeda
                      </h4>
                      <p className="text-sm text-[var(--text-secondary)]">
                        Thay \u0111\u1ed5i t\u00ean nh\u00e0 cung c\u1ea5p s\u1ebd kh\u00f4ng \u1ea3nh h\u01b0\u1edfng \u0111\u1ebfn c\u00e1c giao d\u1ecbch hi\u1ec7n c\u00f3. Thay \u0111\u1ed5i danh m\u1ee5c m\u1eb7c \u0111\u1ecbnh ch\u1ec9 \u00e1p d\u1ee5ng cho giao d\u1ecbch m\u1edbi.
                      </p>
                    </div>
                  </div>
                </Card>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col-reverse md:flex-row gap-3 mt-6">
            <button
              type="button"
              onClick={handleCancel}
              className="flex-1 md:flex-none px-6 py-2.5 border border-[var(--border)] text-[var(--text-primary)] rounded-[var(--radius-lg)] font-medium hover:bg-[var(--surface)] transition-colors"
            >
              Hu\u1ef7
            </button>
            <button
              type="submit"
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white rounded-[var(--radius-lg)] font-medium transition-colors shadow-[var(--shadow-sm)]"
            >
              <Save className="w-5 h-5" />
              <span>{mode === 'create' ? 'T\u1ea1o nh\u00e0 cung c\u1ea5p' : 'L\u01b0u thay \u0111\u1ed5i'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

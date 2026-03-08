import React, { useState } from 'react';
import { ArrowLeft, Plus, X, Hash, Tag, Store, Play } from 'lucide-react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { useAppNavigation } from '../hooks/useAppNavigation';
import { useToast } from '../contexts/ToastContext';
import { useDemoData } from '../contexts/DemoDataContext';

interface CreateAutoRuleProps {
  mode?: 'create' | 'edit';
  initialData?: {
    id?: string;
    name: string;
    active: boolean;
    priority: string;
    matchField: string;
    matchType: string;
    pattern: string;
    selectedCategory: string;
    selectedMerchant: string;
    selectedTags: string[];
  };
}

export default function CreateAutoRule({ mode = 'create', initialData }: CreateAutoRuleProps) {
  const nav = useAppNavigation();
  const toast = useToast();
  const { updateAutoRule, categories: ctxCategories, merchants: ctxMerchants, tags: ctxTags } = useDemoData();
  const [name, setName] = useState(initialData?.name || '');
  const [active, setActive] = useState(initialData?.active ?? true);
  const [priority, setPriority] = useState(initialData?.priority || '1');
  const [matchField, setMatchField] = useState(initialData?.matchField || 'description');
  const [matchType, setMatchType] = useState(initialData?.matchType || 'contains');
  const [pattern, setPattern] = useState(initialData?.pattern || '');
  const [testDescription, setTestDescription] = useState('');
  const [testResult, setTestResult] = useState<{ matched: boolean; message: string } | null>(
    null
  );

  // Actions state
  const [selectedCategory, setSelectedCategory] = useState(initialData?.selectedCategory || '');
  const [selectedMerchant, setSelectedMerchant] = useState(initialData?.selectedMerchant || '');
  const [selectedTags, setSelectedTags] = useState<string[]>(initialData?.selectedTags || []);

  const handleBack = () => {
    nav.goBack();
  };

  const handleSave = () => {
    if (!name.trim()) {
      toast.error('Vui lòng nhập tên quy tắc');
      return;
    }
    if (!pattern.trim()) {
      toast.error('Vui lòng nhập mẫu khớp');
      return;
    }
    if (mode === 'edit' && initialData?.id) {
      updateAutoRule(initialData.id, {
        name,
        enabled: active,
      });
      toast.success('Đã cập nhật quy tắc tự động');
    } else {
      toast.success('Đã tạo quy tắc tự động mới');
    }
    nav.goAutoRules();
  };

  const handleTest = () => {
    if (!testDescription || !pattern) {
      setTestResult({ matched: false, message: 'Vui lòng nhập mô tả và mẫu để kiểm tra' });
      return;
    }

    let matched = false;
    const testText = testDescription.toLowerCase();
    const patternText = pattern.toLowerCase();

    try {
      if (matchType === 'contains') {
        matched = testText.includes(patternText);
      } else if (matchType === 'equals') {
        matched = testText === patternText;
      } else if (matchType === 'regex') {
        const regex = new RegExp(patternText, 'i');
        matched = regex.test(testText);
      }
    } catch (error) {
      setTestResult({ matched: false, message: 'Lỗi: Mẫu regex không hợp lệ' });
      return;
    }

    if (matched) {
      const actions = [];
      if (selectedCategory) actions.push(`Danh mục: ${selectedCategory}`);
      if (selectedMerchant) actions.push(`Merchant: ${selectedMerchant}`);
      if (selectedTags.length > 0) actions.push(`Tags: ${selectedTags.join(', ')}`);

      setTestResult({
        matched: true,
        message: actions.length > 0 ? `Khớp! Sẽ áp dụng: ${actions.join(' • ')}` : 'Khớp!',
      });
    } else {
      setTestResult({ matched: false, message: 'Không khớp với mẫu' });
    }
  };

  const handleAddTag = (tag: string) => {
    if (tag && !selectedTags.includes(tag)) {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleRemoveTag = (tag: string) => {
    setSelectedTags(selectedTags.filter((t) => t !== tag));
  };

  // Data from context
  const categories = ctxCategories.map(c => c.name);
  const merchants = ctxMerchants.map(m => m.name);
  const tags = ctxTags.map(t => t.name);

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="max-w-3xl mx-auto p-4 md:p-6 pb-20 md:pb-6 space-y-6">
        {/* Header */}
        <div>
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Quay lại</span>
          </button>

          <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
            {mode === 'create' ? 'Tạo quy tắc mới' : 'Chỉnh sửa quy tắc'}
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            {mode === 'create'
              ? 'Thiết lập quy tắc tự động phân loại giao dịch'
              : 'Cập nhật thông tin quy tắc tự động'}
          </p>
        </div>

        {/* Basic Info */}
        <Card>
          <h3 className="font-semibold text-[var(--text-primary)] mb-4">Thông tin cơ bản</h3>

          <div className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                Tên quy tắc <span className="text-[var(--danger)]">*</span>
              </label>
              <Input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="VD: Giao dịch Grab"
              />
            </div>

            {/* Active Toggle & Priority */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                  Trạng thái
                </label>
                <button
                  onClick={() => setActive(!active)}
                  className={`flex items-center gap-3 w-full px-4 py-3 rounded-[var(--radius-lg)] border transition-all ${
                    active
                      ? 'bg-[var(--success-light)] border-[var(--success)]'
                      : 'bg-[var(--surface)] border-[var(--border)]'
                  }`}
                >
                  <div
                    className={`relative w-12 h-6 rounded-full transition-colors ${
                      active ? 'bg-[var(--success)]' : 'bg-[var(--border)]'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                        active ? 'translate-x-6' : 'translate-x-0'
                      }`}
                    />
                  </div>
                  <span className="text-sm font-medium text-[var(--text-primary)]">
                    {active ? 'Đang hoạt động' : 'Tạm dừng'}
                  </span>
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                  Độ ưu tiên <span className="text-[var(--danger)]">*</span>
                </label>
                <Input
                  type="number"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  placeholder="1"
                  min="1"
                />
                <p className="text-xs text-[var(--text-secondary)] mt-1">
                  Số nhỏ = ưu tiên cao hơn
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Match Conditions */}
        <Card>
          <h3 className="font-semibold text-[var(--text-primary)] mb-4">Điều kiện khớp</h3>

          <div className="space-y-4">
            {/* Match Field */}
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                Trường dữ liệu <span className="text-[var(--danger)]">*</span>
              </label>
              <select
                value={matchField}
                onChange={(e) => setMatchField(e.target.value)}
                className="w-full px-4 py-2.5 bg-[var(--input-background)] border border-[var(--border)] rounded-[var(--radius-lg)] text-[var(--text-primary)] appearance-none cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]"
              >
                <option value="description">Mô tả giao dịch</option>
                <option value="merchant">Tên merchant</option>
                <option value="note">Ghi chú</option>
              </select>
            </div>

            {/* Match Type */}
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                Kiểu khớp <span className="text-[var(--danger)]">*</span>
              </label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => setMatchType('contains')}
                  className={`px-4 py-3 rounded-[var(--radius-lg)] border font-medium transition-all ${
                    matchType === 'contains'
                      ? 'bg-[var(--primary)] text-white border-[var(--primary)]'
                      : 'bg-[var(--surface)] text-[var(--text-secondary)] border-[var(--border)] hover:bg-[var(--border)]'
                  }`}
                >
                  Chứa
                </button>
                <button
                  onClick={() => setMatchType('equals')}
                  className={`px-4 py-3 rounded-[var(--radius-lg)] border font-medium transition-all ${
                    matchType === 'equals'
                      ? 'bg-[var(--primary)] text-white border-[var(--primary)]'
                      : 'bg-[var(--surface)] text-[var(--text-secondary)] border-[var(--border)] hover:bg-[var(--border)]'
                  }`}
                >
                  Bằng
                </button>
                <button
                  onClick={() => setMatchType('regex')}
                  className={`px-4 py-3 rounded-[var(--radius-lg)] border font-medium transition-all ${
                    matchType === 'regex'
                      ? 'bg-[var(--primary)] text-white border-[var(--primary)]'
                      : 'bg-[var(--surface)] text-[var(--text-secondary)] border-[var(--border)] hover:bg-[var(--border)]'
                  }`}
                >
                  Regex
                </button>
              </div>
            </div>

            {/* Pattern */}
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                Mẫu <span className="text-[var(--danger)]">*</span>
              </label>
              <Input
                type="text"
                value={pattern}
                onChange={(e) => setPattern(e.target.value)}
                placeholder={
                  matchType === 'regex' ? 'VD: (grab|gojek|be)' : 'VD: grab'
                }
              />
              {matchType === 'regex' && (
                <p className="text-xs text-[var(--text-secondary)] mt-1">
                  Sử dụng cú pháp JavaScript RegExp
                </p>
              )}
            </div>
          </div>
        </Card>

        {/* Actions */}
        <Card>
          <h3 className="font-semibold text-[var(--text-primary)] mb-4">Hành động</h3>

          <div className="space-y-4">
            {/* Set Category */}
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                <Hash className="w-4 h-4 inline mr-1" />
                Đặt danh mục
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-4 py-2.5 bg-[var(--input-background)] border border-[var(--border)] rounded-[var(--radius-lg)] text-[var(--text-primary)] appearance-none cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]"
              >
                <option value="">-- Không thay đổi --</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Set Merchant */}
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                <Store className="w-4 h-4 inline mr-1" />
                Đặt merchant
              </label>
              <select
                value={selectedMerchant}
                onChange={(e) => setSelectedMerchant(e.target.value)}
                className="w-full px-4 py-2.5 bg-[var(--input-background)] border border-[var(--border)] rounded-[var(--radius-lg)] text-[var(--text-primary)] appearance-none cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]"
              >
                <option value="">-- Không thay đổi --</option>
                {merchants.map((merchant) => (
                  <option key={merchant} value={merchant}>
                    {merchant}
                  </option>
                ))}
              </select>
            </div>

            {/* Add Tags */}
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                <Tag className="w-4 h-4 inline mr-1" />
                Thêm tags
              </label>
              <select
                value=""
                onChange={(e) => {
                  handleAddTag(e.target.value);
                  e.target.value = '';
                }}
                className="w-full px-4 py-2.5 bg-[var(--input-background)] border border-[var(--border)] rounded-[var(--radius-lg)] text-[var(--text-primary)] appearance-none cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]"
              >
                <option value="">-- Chọn tag --</option>
                {tags
                  .filter((tag) => !selectedTags.includes(tag))
                  .map((tag) => (
                    <option key={tag} value={tag}>
                      {tag}
                    </option>
                  ))}
              </select>

              {selectedTags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {selectedTags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[var(--info-light)] text-[var(--info)] rounded-[var(--radius-md)] text-sm"
                    >
                      {tag}
                      <button
                        onClick={() => handleRemoveTag(tag)}
                        className="hover:text-[var(--danger)] transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Test Preview */}
        <Card className="bg-[var(--surface)]">
          <h3 className="font-semibold text-[var(--text-primary)] mb-4">Kiểm tra quy tắc</h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                Thử với mô tả mẫu
              </label>
              <div className="flex gap-2">
                <Input
                  type="text"
                  value={testDescription}
                  onChange={(e) => setTestDescription(e.target.value)}
                  placeholder="VD: Grab - Di chuyển từ nhà đến công ty"
                  className="flex-1"
                />
                <Button onClick={handleTest} variant="secondary">
                  <Play className="w-5 h-5" />
                  Kiểm tra
                </Button>
              </div>
            </div>

            {testResult && (
              <div
                className={`p-4 rounded-[var(--radius-lg)] ${
                  testResult.matched
                    ? 'bg-[var(--success-light)] border border-[var(--success)]'
                    : 'bg-[var(--danger-light)] border border-[var(--danger)]'
                }`}
              >
                <p
                  className={`text-sm font-medium ${
                    testResult.matched ? 'text-[var(--success)]' : 'text-[var(--danger)]'
                  }`}
                >
                  {testResult.message}
                </p>
              </div>
            )}
          </div>
        </Card>

        {/* Actions */}
        <div className="flex flex-col-reverse md:flex-row gap-3">
          <Button onClick={handleBack} variant="secondary" className="flex-1 md:flex-initial">
            Huỷ
          </Button>
          <Button onClick={handleSave} className="flex-1 md:flex-initial">
            {mode === 'create' ? 'Lưu quy tắc' : 'Lưu thay đổi'}
          </Button>
        </div>
      </div>
    </div>
  );
}
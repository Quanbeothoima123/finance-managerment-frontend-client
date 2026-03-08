import React, { useState } from 'react';
import { 
  X,
  Banknote,
  Smartphone,
  Building2,
  Save,
  ArrowLeft
} from 'lucide-react';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { Select } from '../components/Select';
import { ConfirmationModal } from '../components/ConfirmationModals';

import { useAppNavigation } from '../hooks/useAppNavigation';
import { useToast } from '../contexts/ToastContext';
import { useDemoData } from '../contexts/DemoDataContext';

const accountTypes = [
  { value: 'cash', label: 'Tiền mặt', icon: Banknote },
  { value: 'ewallet', label: 'Ví điện tử', icon: Smartphone },
  { value: 'bank', label: 'Ngân hàng', icon: Building2 },
  { value: 'credit', label: 'Thẻ tín dụng', icon: Building2 },
  { value: 'investment', label: 'Đầu tư', icon: Building2 },
  { value: 'savings', label: 'Tiết kiệm', icon: Building2 },
];

const institutions = {
  ewallet: [
    { value: 'momo', label: 'MoMo' },
    { value: 'zalopay', label: 'ZaloPay' },
    { value: 'vnpay', label: 'VNPay' },
    { value: 'shopeepay', label: 'ShopeePay' },
    { value: 'viettelpay', label: 'ViettelPay' },
  ],
  bank: [
    { value: 'vcb', label: 'Vietcombank (VCB)' },
    { value: 'tcb', label: 'Techcombank (TCB)' },
    { value: 'acb', label: 'ACB' },
    { value: 'vib', label: 'VIB' },
    { value: 'mb', label: 'MBBank' },
    { value: 'vpbank', label: 'VPBank' },
    { value: 'bidv', label: 'BIDV' },
    { value: 'agribank', label: 'Agribank' },
    { value: 'scb', label: 'Sacombank (SCB)' },
    { value: 'hdbank', label: 'HDBank' },
  ],
};

const currencies = [
  { value: 'VND', label: 'VND (₫)' },
  { value: 'USD', label: 'USD ($)' },
  { value: 'EUR', label: 'EUR (€)' },
];

interface CreateEditAccountProps {
  mode?: 'create' | 'edit';
  initialData?: {
    id?: string;
    name: string;
    type: 'cash' | 'ewallet' | 'bank' | 'credit' | 'investment' | 'savings';
    institution: string;
    balance: number;
    openingBalance?: number;
    currency: string;
    note: string;
    active: boolean;
    accountNumber?: string;
    accountOwnerName?: string;
  };
}

export default function CreateEditAccount({ 
  mode = 'create',
  initialData 
}: CreateEditAccountProps) {
  const nav = useAppNavigation();
  const toast = useToast();
  const { addAccount, updateAccount } = useDemoData();
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    type: initialData?.type || 'cash' as 'cash' | 'ewallet' | 'bank' | 'credit' | 'investment' | 'savings',
    institution: initialData?.institution || '',
    balance: initialData?.balance || 0,
    openingBalance: initialData?.openingBalance || 0,
    currency: initialData?.currency || 'VND',
    note: initialData?.note || '',
    active: initialData?.active !== undefined ? initialData.active : true,
    accountNumber: initialData?.accountNumber || '',
    accountOwnerName: initialData?.accountOwnerName || '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showAccountNumberConfirm, setShowAccountNumberConfirm] = useState(false);
  const [pendingSubmit, setPendingSubmit] = useState(false);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user types
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleTypeChange = (type: 'cash' | 'ewallet' | 'bank' | 'credit' | 'investment' | 'savings') => {
    setFormData(prev => ({ 
      ...prev, 
      type,
      institution: '' // Reset institution when type changes
    }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Vui lòng nhập tên tài khoản';
    }

    if ((formData.type === 'ewallet' || formData.type === 'bank') && !formData.institution) {
      newErrors.institution = 'Vui lòng chọn tổ chức';
    }

    if (formData.balance < 0) {
      newErrors.balance = 'Số dư không thể âm';
    }

    // Bank type requires account number
    if (formData.type === 'bank' && !formData.accountNumber.trim()) {
      newErrors.accountNumber = 'Vui lòng nhập số tài khoản cho tài khoản ngân hàng';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const doSubmit = () => {
    if (mode === 'create') {
      addAccount({
        name: formData.name,
        type: formData.type as any,
        balance: Number(formData.balance),
        openingBalance: Number(formData.openingBalance),
        currency: formData.currency,
        color: '#3B82F6',
        icon: formData.type === 'bank' ? 'building' : formData.type === 'ewallet' ? 'wallet' : 'banknote',
        accountNumber: formData.accountNumber || undefined,
        accountOwnerName: formData.accountOwnerName || undefined,
      });
      toast.success('Đã tạo tài khoản mới');
    } else {
      if (initialData?.id) {
        updateAccount(initialData.id, {
          name: formData.name,
          type: formData.type as any,
          openingBalance: Number(formData.openingBalance),
          accountNumber: formData.accountNumber || undefined,
          accountOwnerName: formData.accountOwnerName || undefined,
        });
        toast.success('Đã cập nhật tài khoản');
      }
    }
    nav.goAccounts();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    // In edit mode, if account number changed, show confirmation
    if (
      mode === 'edit' &&
      initialData?.accountNumber &&
      formData.accountNumber !== initialData.accountNumber
    ) {
      setPendingSubmit(true);
      setShowAccountNumberConfirm(true);
      return;
    }

    doSubmit();
  };

  const handleCancel = () => {
    nav.goBack();
  };

  const needsInstitution = formData.type === 'ewallet' || formData.type === 'bank';
  const institutionOptions = formData.type === 'ewallet' 
    ? institutions.ewallet 
    : formData.type === 'bank'
    ? institutions.bank
    : [];

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
            {mode === 'create' ? 'Tạo tài khoản mới' : 'Chỉnh sửa tài khoản'}
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            {mode === 'create' 
              ? 'Thêm tài khoản mới để quản lý tài chính của bạn'
              : 'Cập nhật thông tin tài khoản'
            }
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Account Name */}
              <Card>
                <h3 className="font-semibold text-[var(--text-primary)] mb-4">
                  Thông tin cơ bản
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                      Tên tài khoản <span className="text-[var(--danger)]">*</span>
                    </label>
                    <Input
                      type="text"
                      placeholder="VD: Tiền mặt, Vietcombank..."
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      error={errors.name}
                    />
                  </div>

                  {/* Account Type */}
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                      Loại tài khoản <span className="text-[var(--danger)]">*</span>
                    </label>
                    <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                      {accountTypes.map((type) => {
                        const Icon = type.icon;
                        const isSelected = formData.type === type.value;
                        return (
                          <button
                            key={type.value}
                            type="button"
                            onClick={() => handleTypeChange(type.value as any)}
                            className={`flex flex-col items-center gap-2 p-3 rounded-[var(--radius-lg)] border-2 transition-all ${
                              isSelected
                                ? 'border-[var(--primary)] bg-[var(--primary-light)]'
                                : 'border-[var(--border)] hover:border-[var(--text-tertiary)]'
                            }`}
                          >
                            <Icon 
                              className={`w-6 h-6 ${
                                isSelected ? 'text-[var(--primary)]' : 'text-[var(--text-secondary)]'
                              }`}
                            />
                            <span 
                              className={`text-xs font-medium ${
                                isSelected ? 'text-[var(--primary)]' : 'text-[var(--text-secondary)]'
                              }`}
                            >
                              {type.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Institution Selector */}
                  {needsInstitution && (
                    <div>
                      <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                        {formData.type === 'ewallet' ? 'Ví điện tử' : 'Ngân hàng'} <span className="text-[var(--danger)]">*</span>
                      </label>
                      <select
                        value={formData.institution}
                        onChange={(e) => handleInputChange('institution', e.target.value)}
                        className={`w-full px-4 py-2.5 bg-[var(--input-background)] border rounded-[var(--radius-lg)] text-[var(--text-primary)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)] ${
                          errors.institution ? 'border-[var(--danger)]' : 'border-[var(--border)]'
                        }`}
                      >
                        <option value="">Chọn {formData.type === 'ewallet' ? 'ví điện tử' : 'ngân hàng'}</option>
                        {institutionOptions.map((inst) => (
                          <option key={inst.value} value={inst.value}>
                            {inst.label}
                          </option>
                        ))}
                      </select>
                      {errors.institution && (
                        <p className="text-xs text-[var(--danger)] mt-1">{errors.institution}</p>
                      )}
                    </div>
                  )}
                </div>
              </Card>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Balance & Currency */}
              <Card>
                <h3 className="font-semibold text-[var(--text-primary)] mb-4">
                  Số dư
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                      {mode === 'edit' ? 'Số dư mở đầu (Opening Balance)' : 'Số dư ban đầu'}
                    </label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={mode === 'edit' ? formData.openingBalance : formData.balance}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        if (mode === 'edit') {
                          handleInputChange('openingBalance', val);
                        } else {
                          handleInputChange('balance', val);
                          handleInputChange('openingBalance', val);
                        }
                      }}
                      error={errors.balance}
                    />
                    <p className="text-xs text-[var(--text-tertiary)] mt-1">
                      {mode === 'edit'
                        ? 'Thay đổi số dư mở đầu sẽ ảnh hưởng đến số dư tính toán'
                        : 'Nhập số dư hiện tại của tài khoản'}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                      Đơn vị tiền tệ
                    </label>
                    <select
                      value={formData.currency}
                      onChange={(e) => handleInputChange('currency', e.target.value)}
                      className="w-full px-4 py-2.5 bg-[var(--input-background)] border border-[var(--border)] rounded-[var(--radius-lg)] text-[var(--text-primary)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]"
                    >
                      {currencies.map((currency) => (
                        <option key={currency.value} value={currency.value}>
                          {currency.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </Card>

              {/* Note & Active Status */}
              <Card>
                <h3 className="font-semibold text-[var(--text-primary)] mb-4">
                  Thông tin thêm
                </h3>
                <div className="space-y-4">
                  {/* Account Number */}
                  {(formData.type === 'bank' || formData.type === 'ewallet') && (
                    <div>
                      <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                        Số tài khoản {formData.type === 'bank' && <span className="text-[var(--danger)]">*</span>}
                      </label>
                      <Input
                        type="text"
                        placeholder="Nhập số tài khoản"
                        value={formData.accountNumber}
                        onChange={(e) => handleInputChange('accountNumber', e.target.value)}
                        error={errors.accountNumber}
                      />
                      {mode === 'edit' && initialData?.accountNumber && formData.accountNumber !== initialData.accountNumber && (
                        <p className="text-xs text-[var(--warning)] mt-1">
                          ⚠ Bạn đang thay đổi số tài khoản. Sẽ cần xác nhận khi lưu.
                        </p>
                      )}
                    </div>
                  )}

                  {/* Account Owner */}
                  {(formData.type === 'bank' || formData.type === 'ewallet') && (
                    <div>
                      <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                        Chủ tài khoản
                      </label>
                      <Input
                        type="text"
                        placeholder="VD: Nguyen Van A"
                        value={formData.accountOwnerName}
                        onChange={(e) => handleInputChange('accountOwnerName', e.target.value)}
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                      Ghi chú
                    </label>
                    <textarea
                      placeholder="Thêm ghi chú về tài khoản..."
                      value={formData.note}
                      onChange={(e) => handleInputChange('note', e.target.value)}
                      rows={3}
                      className="w-full px-4 py-2.5 bg-[var(--input-background)] border border-[var(--border)] rounded-[var(--radius-lg)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)] resize-none"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                        Trạng thái hoạt động
                      </label>
                      <p className="text-xs text-[var(--text-tertiary)]">
                        Tài khoản đang sử dụng
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
              <span>{mode === 'create' ? 'Tạo tài khoản' : 'Lưu thay đổi'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Confirmation modal for account number change */}
      <ConfirmationModal
        isOpen={showAccountNumberConfirm}
        onClose={() => {
          setShowAccountNumberConfirm(false);
          setPendingSubmit(false);
        }}
        onConfirm={() => {
          setShowAccountNumberConfirm(false);
          setPendingSubmit(false);
          doSubmit();
        }}
        title="Thay đổi số tài khoản?"
        description={`Bạn đang thay đổi số tài khoản từ "${initialData?.accountNumber || ''}" sang "${formData.accountNumber}". Hành động này có thể ảnh hưởng đến việc nhận diện tài khoản. Bạn có chắc muốn tiếp tục?`}
        confirmLabel="Xác nhận thay đổi"
        cancelLabel="Huỷ"
        isDangerous={false}
      />
    </div>
  );
}

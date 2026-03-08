import React from 'react';
import { Home, Receipt, PiggyBank, Target, Plus, FileText } from 'lucide-react';
import { Button } from '../components/Button';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  primaryAction?: {
    label: string;
    onClick: () => void;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({
  icon,
  title,
  description,
  primaryAction,
  secondaryAction,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      {icon && (
        <div className="w-24 h-24 bg-[var(--surface)] rounded-full flex items-center justify-center mb-6">
          {icon}
        </div>
      )}

      <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-2">{title}</h3>
      <p className="text-sm text-[var(--text-secondary)] max-w-md mb-6">{description}</p>

      <div className="flex flex-col sm:flex-row gap-3">
        {primaryAction && (
          <Button onClick={primaryAction.onClick}>
            <Plus className="w-5 h-5" />
            {primaryAction.label}
          </Button>
        )}

        {secondaryAction && (
          <Button onClick={secondaryAction.onClick} variant="secondary">
            {secondaryAction.label}
          </Button>
        )}
      </div>
    </div>
  );
}

// Empty State: Home Dashboard (No Data)
export function EmptyStateHome() {
  return (
    <EmptyState
      icon={<Home className="w-12 h-12 text-[var(--text-secondary)]" />}
      title="Chào mừng đến với Quản lý Tài chính!"
      description="Bắt đầu theo dõi chi tiêu của bạn bằng cách thêm giao dịch đầu tiên hoặc thiết lập tài khoản."
      primaryAction={{
        label: 'Thêm giao dịch',
        onClick: () => console.log('Add transaction'),
      }}
      secondaryAction={{
        label: 'Thiết lập tài khoản',
        onClick: () => console.log('Setup account'),
      }}
    />
  );
}

// Empty State: Transactions List
export function EmptyStateTransactions() {
  return (
    <EmptyState
      icon={<Receipt className="w-12 h-12 text-[var(--text-secondary)]" />}
      title="Chưa có giao dịch nào"
      description="Giao dịch của bạn sẽ hiển thị ở đây. Thêm giao dịch đầu tiên để bắt đầu theo dõi chi tiêu."
      primaryAction={{
        label: 'Thêm giao dịch',
        onClick: () => console.log('Add transaction'),
      }}
      secondaryAction={{
        label: 'Nhập từ file',
        onClick: () => console.log('Import transactions'),
      }}
    />
  );
}

// Empty State: Transactions List (Filtered - No Results)
export function EmptyStateTransactionsFiltered() {
  return (
    <EmptyState
      icon={<Receipt className="w-12 h-12 text-[var(--text-secondary)]" />}
      title="Không tìm thấy giao dịch"
      description="Không có giao dịch nào khớp với bộ lọc hiện tại. Thử thay đổi bộ lọc hoặc tìm kiếm với từ khoá khác."
      secondaryAction={{
        label: 'Xoá bộ lọc',
        onClick: () => console.log('Clear filters'),
      }}
    />
  );
}

// Empty State: Budgets
export function EmptyStateBudgets() {
  return (
    <EmptyState
      icon={<PiggyBank className="w-12 h-12 text-[var(--text-secondary)]" />}
      title="Chưa có ngân sách nào"
      description="Tạo ngân sách để kiểm soát chi tiêu và đạt được mục tiêu tài chính của bạn."
      primaryAction={{
        label: 'Tạo ngân sách',
        onClick: () => console.log('Create budget'),
      }}
      secondaryAction={{
        label: 'Tìm hiểu về ngân sách',
        onClick: () => console.log('Learn about budgets'),
      }}
    />
  );
}

// Empty State: Goals
export function EmptyStateGoals() {
  return (
    <EmptyState
      icon={<Target className="w-12 h-12 text-[var(--text-secondary)]" />}
      title="Chưa có mục tiêu nào"
      description="Đặt mục tiêu tiết kiệm để theo dõi tiến độ và đạt được ước mơ tài chính của bạn."
      primaryAction={{
        label: 'Tạo mục tiêu',
        onClick: () => console.log('Create goal'),
      }}
      secondaryAction={{
        label: 'Xem ví dụ',
        onClick: () => console.log('View examples'),
      }}
    />
  );
}

// Empty State: Search Results
export function EmptyStateSearch() {
  return (
    <EmptyState
      icon={<FileText className="w-12 h-12 text-[var(--text-secondary)]" />}
      title="Không tìm thấy kết quả"
      description="Không tìm thấy kết quả nào cho từ khoá tìm kiếm. Thử với từ khoá khác."
      secondaryAction={{
        label: 'Xoá tìm kiếm',
        onClick: () => console.log('Clear search'),
      }}
    />
  );
}

// Empty State: Accounts
export function EmptyStateAccounts() {
  return (
    <EmptyState
      icon={
        <div className="text-4xl">💳</div>
      }
      title="Chưa có tài khoản nào"
      description="Thêm tài khoản ngân hàng, ví điện tử, hoặc tiền mặt để bắt đầu quản lý tài chính."
      primaryAction={{
        label: 'Thêm tài khoản',
        onClick: () => console.log('Add account'),
      }}
    />
  );
}

// Empty State: Categories
export function EmptyStateCategories() {
  return (
    <EmptyState
      icon={
        <div className="text-4xl">📁</div>
      }
      title="Chưa có danh mục nào"
      description="Tạo danh mục để phân loại và theo dõi chi tiêu của bạn."
      primaryAction={{
        label: 'Tạo danh mục',
        onClick: () => console.log('Add category'),
      }}
    />
  );
}

// Empty State: Tags
export function EmptyStateTags() {
  return (
    <EmptyState
      icon={
        <div className="text-4xl">🏷️</div>
      }
      title="Chưa có tag nào"
      description="Tạo tag để gắn nhãn và tổ chức giao dịch linh hoạt hơn."
      primaryAction={{
        label: 'Tạo tag',
        onClick: () => console.log('Add tag'),
      }}
    />
  );
}

// Empty State: Merchants
export function EmptyStateMerchants() {
  return (
    <EmptyState
      icon={
        <div className="text-4xl">🏪</div>
      }
      title="Chưa có merchant nào"
      description="Merchant sẽ được tự động tạo khi bạn thêm giao dịch."
      secondaryAction={{
        label: 'Thêm giao dịch',
        onClick: () => console.log('Add transaction'),
      }}
    />
  );
}

// Empty State: Attachments
export function EmptyStateAttachments() {
  return (
    <EmptyState
      icon={
        <div className="text-4xl">📷</div>
      }
      title="Chưa có hoá đơn nào"
      description="Thêm ảnh hoá đơn vào giao dịch để lưu trữ chứng từ."
      primaryAction={{
        label: 'Thêm hoá đơn',
        onClick: () => console.log('Add attachment'),
      }}
    />
  );
}

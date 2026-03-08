import React, { useState } from 'react';
import {
  ArrowLeft,
  Upload,
  Download,
  Trash2,
  AlertTriangle,
  Database,
  FileText,
  Clock,
  RotateCcw,
} from 'lucide-react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { useAppNavigation } from '../hooks/useAppNavigation';
import { useToast } from '../contexts/ToastContext';
import { useDemoData } from '../contexts/DemoDataContext';
import { CSVImportModal } from '../components/CSVImportModal';

export default function DataBackupSettings() {
  const nav = useAppNavigation();
  const toast = useToast();
  const {
    resetData,
    addTransaction,
    transactions,
    accounts,
    categories,
    tags,
    merchants,
    budgets,
    goals,
    autoRules,
    recurringRules,
  } = useDemoData();
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [csvImportOpen, setCSVImportOpen] = useState(false);
  const [lastBackup, setLastBackup] = useState<string | null>(() => {
    try { return localStorage.getItem('finance-last-backup-date'); } catch { return null; }
  });

  const handleBack = () => {
    nav.goBack();
  };

  const handleImportCSV = () => {
    setCSVImportOpen(true);
  };

  const handleCSVImport = (importedTransactions: Array<{
    type: 'income' | 'expense' | 'transfer';
    amount: number;
    category: string;
    account: string;
    description: string;
    date: string;
    merchant?: string;
    tags: string[];
  }>) => {
    let importedCount = 0;
    importedTransactions.forEach((txn) => {
      addTransaction({
        type: txn.type,
        amount: txn.type === 'expense' ? -Math.abs(txn.amount) : Math.abs(txn.amount),
        category: txn.category,
        categoryId: '',
        account: txn.account,
        accountId: '',
        description: txn.description,
        date: txn.date,
        tags: txn.tags,
        merchant: txn.merchant,
        merchantId: '',
      });
      importedCount++;
    });
    toast.success(`Đã nhập thành công ${importedCount} giao dịch từ CSV`);
  };

  const handleExportAll = () => {
    const backupData = {
      exportedAt: new Date().toISOString(),
      version: '1.0',
      data: {
        transactions,
        accounts,
        categories,
        tags,
        merchants,
        budgets,
        goals,
        autoRules,
        recurringRules,
      },
    };

    const json = JSON.stringify(backupData, null, 2);
    const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `finance-backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Đã xuất toàn bộ dữ liệu thành công');
    const now = new Date().toISOString();
    try { localStorage.setItem('finance-last-backup-date', now); } catch {}
    setLastBackup(now);
  };

  const handleResetData = () => {
    if (confirmText === 'XÓA DỮ LIỆU') {
      resetData();
      toast.success('Đã xoá toàn bộ dữ liệu và khôi phục mặc định');
      setShowResetConfirm(false);
      setConfirmText('');
    }
  };

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

          <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Dữ liệu & Sao lưu</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Quản lý và sao lưu dữ liệu của bạn
          </p>
        </div>

        {/* Storage Info */}
        {/* Backup Status Card */}
        <Card className="border-l-4 border-l-[var(--primary)]">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-12 h-12 bg-[var(--primary-light)] text-[var(--primary)] rounded-[var(--radius-lg)] flex items-center justify-center">
              <Clock className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-[var(--text-primary)] mb-0.5">Sao lưu gần nhất</h3>
              <p className="text-sm text-[var(--text-secondary)]">
                {lastBackup ? new Date(lastBackup).toLocaleString('vi-VN') : 'Chưa có bản sao lưu nào'}
              </p>
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <Button onClick={handleExportAll} className="flex-1">
              <Download className="w-4 h-4" />
              Tạo sao lưu
            </Button>
            <button onClick={() => nav.goRestoreData()}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border border-[var(--border)] text-[var(--text-primary)] rounded-[var(--radius-lg)] font-medium hover:bg-[var(--surface)] transition-colors">
              <RotateCcw className="w-4 h-4" />
              <span>Khôi phục</span>
            </button>
          </div>
        </Card>

        {/* Data Info */}
        <Card>
          <div className="flex items-start gap-4 mb-4">
            <div className="flex-shrink-0 w-12 h-12 bg-[var(--info-light)] text-[var(--info)] rounded-[var(--radius-lg)] flex items-center justify-center">
              <Database className="w-6 h-6" />
            </div>

            <div className="flex-1">
              <h3 className="font-semibold text-[var(--text-primary)] mb-1">
                Dung lượng sử dụng
              </h3>
              <p className="text-sm text-[var(--text-secondary)]">
                Dữ liệu được lưu trữ cục bộ trên thiết bị
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-[var(--text-secondary)]">Giao dịch</span>
              <span className="text-sm font-semibold text-[var(--text-primary)] tabular-nums">
                {new Intl.NumberFormat('vi-VN').format(transactions.length)} giao dịch
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm text-[var(--text-secondary)]">Tài khoản</span>
              <span className="text-sm font-semibold text-[var(--text-primary)] tabular-nums">
                {accounts.length} tài khoản
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm text-[var(--text-secondary)]">Danh mục / Nhãn / NCC</span>
              <span className="text-sm font-semibold text-[var(--text-primary)] tabular-nums">
                {categories.length} / {tags.length} / {merchants.length}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm text-[var(--text-secondary)]">Ngân sách & Mục tiêu</span>
              <span className="text-sm font-semibold text-[var(--primary)] tabular-nums">
                {budgets.length + goals.length} mục
              </span>
            </div>
          </div>
        </Card>

        {/* Import Data */}
        <Card>
          <div className="flex items-start gap-4 mb-4">
            <div className="flex-shrink-0 w-12 h-12 bg-[var(--success-light)] text-[var(--success)] rounded-[var(--radius-lg)] flex items-center justify-center">
              <Upload className="w-6 h-6" />
            </div>

            <div className="flex-1">
              <h3 className="font-semibold text-[var(--text-primary)] mb-1">Nhập dữ liệu</h3>
              <p className="text-sm text-[var(--text-secondary)]">
                Nhập giao dịch từ file CSV hoặc sao lưu trước đó
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleImportCSV}
              className="flex items-center justify-between w-full px-4 py-3 bg-[var(--surface)] hover:bg-[var(--border)] rounded-[var(--radius-lg)] transition-colors"
            >
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-[var(--text-secondary)]" />
                <span className="text-sm font-medium text-[var(--text-primary)]">
                  Nhập file CSV
                </span>
              </div>
              <Upload className="w-4 h-4 text-[var(--text-secondary)]" />
            </button>

            <button
              onClick={() => nav.goRestoreData()}
              className="flex items-center justify-between w-full px-4 py-3 bg-[var(--surface)] hover:bg-[var(--border)] rounded-[var(--radius-lg)] transition-colors"
            >
              <div className="flex items-center gap-3">
                <Database className="w-5 h-5 text-[var(--text-secondary)]" />
                <span className="text-sm font-medium text-[var(--text-primary)]">
                  Khôi phục từ sao lưu
                </span>
              </div>
              <RotateCcw className="w-4 h-4 text-[var(--text-secondary)]" />
            </button>
          </div>

          <div className="mt-4 p-3 bg-[var(--warning-light)] border border-[var(--warning)] rounded-[var(--radius-lg)]">
            <p className="text-xs text-[var(--text-secondary)]">
              <AlertTriangle className="w-3.5 h-3.5 inline mr-1 text-[var(--warning)]" />
              Dữ liệu hiện tại sẽ không bị ghi đè. Giao dịch trùng lặp sẽ được bỏ qua.
            </p>
          </div>
        </Card>

        {/* Export Data */}
        <Card>
          <div className="flex items-start gap-4 mb-4">
            <div className="flex-shrink-0 w-12 h-12 bg-[var(--primary-light)] text-[var(--primary)] rounded-[var(--radius-lg)] flex items-center justify-center">
              <Download className="w-6 h-6" />
            </div>

            <div className="flex-1">
              <h3 className="font-semibold text-[var(--text-primary)] mb-1">Xuất dữ liệu</h3>
              <p className="text-sm text-[var(--text-secondary)]">
                Tạo bản sao lưu hoặc xuất dữ liệu để chuyển sang thiết bị khác
              </p>
            </div>
          </div>

          <Button onClick={handleExportAll} variant="secondary" className="w-full">
            <Download className="w-5 h-5" />
            Xuất toàn bộ dữ liệu
          </Button>

          <div className="mt-4 p-3 bg-[var(--info-light)] border border-[var(--info)] rounded-[var(--radius-lg)]">
            <p className="text-xs text-[var(--text-secondary)]">
              Dữ liệu sẽ được xuất dạng file ZIP bao gồm: giao dịch (CSV), tài khoản, danh mục,
              và tất cả hoá đơn đính kèm.
            </p>
          </div>
        </Card>

        {/* Danger Zone */}
        <Card className="border-2 border-[var(--danger)]">
          <div className="flex items-start gap-4 mb-4">
            <div className="flex-shrink-0 w-12 h-12 bg-[var(--danger-light)] text-[var(--danger)] rounded-[var(--radius-lg)] flex items-center justify-center">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="flex-1">
              <h3 className="font-semibold text-[var(--danger)] mb-1">Vùng nguy hiểm</h3>
              <p className="text-sm text-[var(--text-secondary)]">
                Các hành động không thể hoàn tác
              </p>
            </div>
          </div>

          {!showResetConfirm ? (
            <Button
              onClick={() => setShowResetConfirm(true)}
              className="w-full bg-[var(--danger)] hover:bg-[var(--danger)]/90"
            >
              <Trash2 className="w-5 h-5" />
              Xoá toàn bộ dữ liệu
            </Button>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-[var(--danger-light)] rounded-[var(--radius-lg)]">
                <div className="flex items-start gap-3 mb-3">
                  <AlertTriangle className="w-5 h-5 text-[var(--danger)] flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-[var(--danger)] mb-1">
                      Cảnh báo nghiêm trọng!
                    </h4>
                    <p className="text-sm text-[var(--text-secondary)]">
                      Hành động này sẽ xoá vĩnh viễn:
                    </p>
                    <ul className="text-sm text-[var(--text-secondary)] list-disc list-inside mt-2 space-y-1">
                      <li>Tất cả giao dịch</li>
                      <li>Tất cả tài khoản</li>
                      <li>Tất cả danh mục, tags, merchants</li>
                      <li>Tất cả ngân sách và mục tiêu</li>
                      <li>Tất cả hoá đơn đính kèm</li>
                      <li>Tất cả cài đặt</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                  Để xác nhận, gõ:{' '}
                  <span className="font-mono font-bold text-[var(--danger)]">XÓA DỮ LIỆU</span>
                </label>
                <input
                  type="text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder="XÓA DỮ LIỆU"
                  className="w-full px-4 py-2.5 bg-[var(--input-background)] border-2 border-[var(--danger)] rounded-[var(--radius-lg)] text-[var(--text-primary)] font-mono transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--danger)]"
                />
              </div>

              <div className="flex flex-col-reverse md:flex-row gap-3">
                <Button
                  onClick={() => {
                    setShowResetConfirm(false);
                    setConfirmText('');
                  }}
                  variant="secondary"
                  className="flex-1"
                >
                  Huỷ
                </Button>
                <Button
                  onClick={handleResetData}
                  disabled={confirmText !== 'XÓA DỮ LIỆU'}
                  className="flex-1 bg-[var(--danger)] hover:bg-[var(--danger)]/90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Trash2 className="w-5 h-5" />
                  Xác nhận xoá
                </Button>
              </div>
            </div>
          )}
        </Card>

        {/* Info Card */}
        <Card className="bg-[var(--info-light)] border-[var(--info)]">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-[var(--info)] rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white text-lg font-semibold">💡</span>
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-[var(--text-primary)] mb-1">Khuyến nghị</h4>
              <p className="text-sm text-[var(--text-secondary)]">
                Nên xuất dữ liệu định kỳ để tạo bản sao lưu. File sao lưu có thể được lưu trữ trên
                Google Drive, iCloud hoặc thiết bị lưu trữ khác.
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* CSV Import Modal */}
      <CSVImportModal
        isOpen={csvImportOpen}
        onClose={() => setCSVImportOpen(false)}
        onImport={handleCSVImport}
      />
    </div>
  );
}
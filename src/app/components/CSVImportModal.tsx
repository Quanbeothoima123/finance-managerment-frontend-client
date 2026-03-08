import React, { useState, useRef, useCallback } from 'react';
import {
  X,
  Upload,
  FileText,
  AlertTriangle,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
} from 'lucide-react';
import { Button } from './Button';

interface ParsedTransaction {
  type: 'income' | 'expense' | 'transfer';
  amount: number;
  category: string;
  account: string;
  description: string;
  date: string;
  merchant?: string;
  tags: string[];
  valid: boolean;
  errors: string[];
}

interface CSVImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (transactions: Omit<ParsedTransaction, 'valid' | 'errors'>[]) => void;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

function parseCSV(csvText: string): { headers: string[]; rows: string[][] } {
  const lines = csvText.split(/\r?\n/).filter((line) => line.trim() !== '');
  if (lines.length === 0) return { headers: [], rows: [] };

  const headers = parseCSVLine(lines[0]).map((h) => h.toLowerCase().trim());
  const rows = lines.slice(1).map(parseCSVLine);
  return { headers, rows };
}

function mapRowToTransaction(
  row: string[],
  headers: string[],
  columnMapping: Record<string, number>
): ParsedTransaction {
  const errors: string[] = [];

  const get = (field: string): string => {
    const idx = columnMapping[field];
    if (idx === undefined || idx < 0 || idx >= row.length) return '';
    return row[idx].trim();
  };

  // Parse type
  const rawType = get('type').toLowerCase();
  let type: 'income' | 'expense' | 'transfer' = 'expense';
  if (['income', 'thu', 'thu nhập', 'thu nhap'].includes(rawType)) {
    type = 'income';
  } else if (['transfer', 'chuyển', 'chuyen', 'chuyển khoản'].includes(rawType)) {
    type = 'transfer';
  } else if (['expense', 'chi', 'chi tiêu', 'chi tieu'].includes(rawType)) {
    type = 'expense';
  }

  // Parse amount
  const rawAmount = get('amount').replace(/[^\d.-]/g, '');
  const amount = parseFloat(rawAmount);
  if (isNaN(amount) || amount <= 0) {
    errors.push('Số tiền không hợp lệ');
  }

  // Parse date
  let date = get('date');
  if (!date) {
    date = new Date().toISOString().split('T')[0];
    errors.push('Thiếu ngày, sẽ dùng ngày hôm nay');
  } else {
    // Try to parse various date formats
    const parsed = new Date(date);
    if (isNaN(parsed.getTime())) {
      // Try DD/MM/YYYY
      const parts = date.split(/[\/\-\.]/);
      if (parts.length === 3) {
        const d = parseInt(parts[0]);
        const m = parseInt(parts[1]) - 1;
        const y = parseInt(parts[2]);
        const constructed = new Date(y, m, d);
        if (!isNaN(constructed.getTime())) {
          date = constructed.toISOString().split('T')[0];
        } else {
          date = new Date().toISOString().split('T')[0];
          errors.push('Định dạng ngày không hợp lệ');
        }
      } else {
        date = new Date().toISOString().split('T')[0];
        errors.push('Định dạng ngày không hợp lệ');
      }
    } else {
      date = parsed.toISOString().split('T')[0];
    }
  }

  const description = get('description') || get('note') || 'Giao dịch nhập từ CSV';
  const category = get('category') || 'Khác';
  const account = get('account') || 'Ví chính';
  const merchant = get('merchant') || undefined;
  const tagsStr = get('tags');
  const tags = tagsStr ? tagsStr.split(/[;|,]/).map((t) => t.trim()).filter(Boolean) : [];

  if (!get('description') && !get('note')) {
    errors.push('Thiếu mô tả');
  }

  return {
    type,
    amount: isNaN(amount) ? 0 : Math.abs(amount),
    category,
    account,
    description,
    date,
    merchant,
    tags,
    valid: errors.filter((e) => e !== 'Thiếu ngày, sẽ dùng ngày hôm nay' && e !== 'Thiếu mô tả').length === 0,
    errors,
  };
}

const EXPECTED_FIELDS = ['type', 'amount', 'date', 'description', 'category', 'account', 'merchant', 'tags', 'note'];

function autoMapColumns(headers: string[]): Record<string, number> {
  const mapping: Record<string, number> = {};
  const aliases: Record<string, string[]> = {
    type: ['type', 'loại', 'loai', 'kiểu', 'kieu'],
    amount: ['amount', 'số tiền', 'so tien', 'tiền', 'tien', 'giá trị', 'gia tri'],
    date: ['date', 'ngày', 'ngay', 'thời gian', 'thoi gian'],
    description: ['description', 'mô tả', 'mo ta', 'diễn giải', 'dien giai', 'nội dung', 'noi dung'],
    category: ['category', 'danh mục', 'danh muc', 'loại chi', 'loai chi'],
    account: ['account', 'tài khoản', 'tai khoan', 'ví', 'vi'],
    merchant: ['merchant', 'nhà cung cấp', 'nha cung cap', 'cửa hàng', 'cua hang'],
    tags: ['tags', 'nhãn', 'nhan', 'tag'],
    note: ['note', 'ghi chú', 'ghi chu'],
  };

  headers.forEach((header, idx) => {
    const h = header.toLowerCase().trim();
    for (const [field, fieldAliases] of Object.entries(aliases)) {
      if (fieldAliases.includes(h) && mapping[field] === undefined) {
        mapping[field] = idx;
        break;
      }
    }
  });

  return mapping;
}

export function CSVImportModal({ isOpen, onClose, onImport }: CSVImportModalProps) {
  const [step, setStep] = useState<'upload' | 'mapping' | 'preview'>('upload');
  const [rawCSV, setRawCSV] = useState('');
  const [fileName, setFileName] = useState('');
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<string[][]>([]);
  const [columnMapping, setColumnMapping] = useState<Record<string, number>>({});
  const [parsedTransactions, setParsedTransactions] = useState<ParsedTransaction[]>([]);
  const [showErrors, setShowErrors] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setStep('upload');
    setRawCSV('');
    setFileName('');
    setHeaders([]);
    setRows([]);
    setColumnMapping({});
    setParsedTransactions([]);
    setShowErrors(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleFileDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const processFile = (file: File) => {
    if (!file.name.endsWith('.csv') && !file.type.includes('csv') && !file.type.includes('text')) {
      return;
    }
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setRawCSV(text);
      const { headers: h, rows: r } = parseCSV(text);
      setHeaders(h);
      setRows(r);
      const autoMapping = autoMapColumns(h);
      setColumnMapping(autoMapping);
      setStep('mapping');
    };
    reader.readAsText(file);
  };

  const handleProceedToPreview = () => {
    const parsed = rows.map((row) => mapRowToTransaction(row, headers, columnMapping));
    setParsedTransactions(parsed);
    setStep('preview');
  };

  const validCount = parsedTransactions.filter((t) => t.valid).length;
  const invalidCount = parsedTransactions.filter((t) => !t.valid).length;

  const handleImport = () => {
    const validTransactions = parsedTransactions
      .filter((t) => t.valid)
      .map(({ valid, errors, ...rest }) => rest);
    onImport(validTransactions);
    handleClose();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN').format(amount);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'income':
        return <ArrowUpRight className="w-4 h-4 text-[var(--success)]" />;
      case 'expense':
        return <ArrowDownLeft className="w-4 h-4 text-[var(--danger)]" />;
      case 'transfer':
        return <ArrowLeftRight className="w-4 h-4 text-[var(--info)]" />;
      default:
        return null;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={handleClose} />

      {/* Modal */}
      <div className="relative bg-[var(--card)] rounded-[var(--radius-xl)] shadow-[var(--shadow-xl)] w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[var(--border)]">
          <div>
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">
              Nhập file CSV
            </h2>
            <p className="text-sm text-[var(--text-secondary)] mt-0.5">
              {step === 'upload' && 'Chọn file CSV chứa giao dịch'}
              {step === 'mapping' && 'Ánh xạ cột dữ liệu'}
              {step === 'preview' && `Xem trước ${validCount} giao dịch`}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-[var(--radius-md)] hover:bg-[var(--surface)] transition-colors"
          >
            <X className="w-5 h-5 text-[var(--text-secondary)]" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {/* Step 1: Upload */}
          {step === 'upload' && (
            <div className="space-y-4">
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleFileDrop}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-[var(--border)] rounded-[var(--radius-xl)] p-10 text-center cursor-pointer hover:border-[var(--primary)] hover:bg-[var(--primary-light)] transition-all"
              >
                <div className="w-16 h-16 bg-[var(--surface)] rounded-full flex items-center justify-center mx-auto mb-4">
                  <Upload className="w-8 h-8 text-[var(--text-tertiary)]" />
                </div>
                <p className="font-medium text-[var(--text-primary)] mb-1">
                  Kéo thả file CSV vào đây
                </p>
                <p className="text-sm text-[var(--text-secondary)]">
                  hoặc nhấn để chọn file
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,text/csv"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>

              {/* CSV Format Guide */}
              <div className="p-4 bg-[var(--surface)] rounded-[var(--radius-lg)]">
                <h4 className="font-medium text-[var(--text-primary)] mb-2">
                  Định dạng CSV được hỗ trợ
                </h4>
                <p className="text-sm text-[var(--text-secondary)] mb-3">
                  File CSV cần có hàng đầu tiên làm tiêu đề cột. Các cột sau được nhận dạng tự động:
                </p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-2 p-2 bg-[var(--card)] rounded-[var(--radius-md)]">
                    <span className="font-mono font-semibold text-[var(--primary)]">type</span>
                    <span className="text-[var(--text-secondary)]">Thu/Chi/Chuyển</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-[var(--card)] rounded-[var(--radius-md)]">
                    <span className="font-mono font-semibold text-[var(--primary)]">amount</span>
                    <span className="text-[var(--text-secondary)]">Số tiền</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-[var(--card)] rounded-[var(--radius-md)]">
                    <span className="font-mono font-semibold text-[var(--primary)]">date</span>
                    <span className="text-[var(--text-secondary)]">Ngày (DD/MM/YYYY)</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-[var(--card)] rounded-[var(--radius-md)]">
                    <span className="font-mono font-semibold text-[var(--primary)]">description</span>
                    <span className="text-[var(--text-secondary)]">Mô tả</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-[var(--card)] rounded-[var(--radius-md)]">
                    <span className="font-mono font-semibold text-[var(--primary)]">category</span>
                    <span className="text-[var(--text-secondary)]">Danh mục</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-[var(--card)] rounded-[var(--radius-md)]">
                    <span className="font-mono font-semibold text-[var(--primary)]">account</span>
                    <span className="text-[var(--text-secondary)]">Tài khoản</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Column Mapping */}
          {step === 'mapping' && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-[var(--success-light)] rounded-[var(--radius-lg)]">
                <FileText className="w-5 h-5 text-[var(--success)]" />
                <div className="flex-1">
                  <span className="text-sm font-medium text-[var(--text-primary)]">{fileName}</span>
                  <span className="text-sm text-[var(--text-secondary)] ml-2">
                    ({rows.length} dòng, {headers.length} cột)
                  </span>
                </div>
              </div>

              <div>
                <h3 className="font-medium text-[var(--text-primary)] mb-3">
                  Ánh xạ cột
                </h3>
                <p className="text-sm text-[var(--text-secondary)] mb-4">
                  Kiểm tra và điều chỉnh ánh xạ giữa cột CSV và trường dữ liệu:
                </p>
                <div className="space-y-3">
                  {EXPECTED_FIELDS.map((field) => (
                    <div key={field} className="flex items-center gap-3">
                      <label className="w-28 text-sm font-medium text-[var(--text-primary)] capitalize">
                        {field === 'type' ? 'Loại' :
                         field === 'amount' ? 'Số tiền' :
                         field === 'date' ? 'Ngày' :
                         field === 'description' ? 'Mô tả' :
                         field === 'category' ? 'Danh mục' :
                         field === 'account' ? 'Tài khoản' :
                         field === 'merchant' ? 'NCC' :
                         field === 'tags' ? 'Nhãn' :
                         field === 'note' ? 'Ghi chú' : field}
                      </label>
                      <select
                        value={columnMapping[field] ?? -1}
                        onChange={(e) => {
                          const val = parseInt(e.target.value);
                          setColumnMapping((prev) => ({
                            ...prev,
                            [field]: val,
                          }));
                        }}
                        className="flex-1 px-3 py-2 bg-[var(--input-background)] border border-[var(--border)] rounded-[var(--radius-lg)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]"
                      >
                        <option value={-1}>— Bỏ qua —</option>
                        {headers.map((h, idx) => (
                          <option key={idx} value={idx}>
                            {h} {rows[0] && rows[0][idx] ? `(VD: ${rows[0][idx].substring(0, 20)})` : ''}
                          </option>
                        ))}
                      </select>
                      {['type', 'amount'].includes(field) && columnMapping[field] === undefined && (
                        <AlertTriangle className="w-4 h-4 text-[var(--warning)] flex-shrink-0" />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Preview first row */}
              {rows.length > 0 && (
                <div className="p-3 bg-[var(--surface)] rounded-[var(--radius-lg)]">
                  <h4 className="text-sm font-medium text-[var(--text-primary)] mb-2">
                    Dòng đầu tiên (mẫu):
                  </h4>
                  <div className="text-xs text-[var(--text-secondary)] font-mono break-all">
                    {rows[0].join(' | ')}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Preview */}
          {step === 'preview' && (
            <div className="space-y-4">
              {/* Stats */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-[var(--surface)] rounded-[var(--radius-lg)] text-center">
                  <p className="text-2xl font-bold text-[var(--text-primary)] tabular-nums">
                    {parsedTransactions.length}
                  </p>
                  <p className="text-xs text-[var(--text-secondary)]">Tổng dòng</p>
                </div>
                <div className="p-3 bg-[var(--success-light)] rounded-[var(--radius-lg)] text-center">
                  <p className="text-2xl font-bold text-[var(--success)] tabular-nums">
                    {validCount}
                  </p>
                  <p className="text-xs text-[var(--text-secondary)]">Hợp lệ</p>
                </div>
                <div className="p-3 bg-[var(--danger-light)] rounded-[var(--radius-lg)] text-center">
                  <p className="text-2xl font-bold text-[var(--danger)] tabular-nums">
                    {invalidCount}
                  </p>
                  <p className="text-xs text-[var(--text-secondary)]">Lỗi</p>
                </div>
              </div>

              {/* Errors */}
              {invalidCount > 0 && (
                <div className="border border-[var(--warning)] rounded-[var(--radius-lg)] overflow-hidden">
                  <button
                    onClick={() => setShowErrors(!showErrors)}
                    className="w-full flex items-center justify-between p-3 bg-[var(--warning-light)] text-left"
                  >
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-[var(--warning)]" />
                      <span className="text-sm font-medium text-[var(--text-primary)]">
                        {invalidCount} dòng có lỗi (sẽ bị bỏ qua)
                      </span>
                    </div>
                    {showErrors ? (
                      <ChevronUp className="w-4 h-4 text-[var(--text-secondary)]" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-[var(--text-secondary)]" />
                    )}
                  </button>
                  {showErrors && (
                    <div className="p-3 max-h-40 overflow-y-auto space-y-2">
                      {parsedTransactions
                        .map((t, i) => ({ ...t, rowIndex: i }))
                        .filter((t) => !t.valid)
                        .slice(0, 20)
                        .map((t) => (
                          <div key={t.rowIndex} className="text-xs">
                            <span className="font-medium text-[var(--text-primary)]">
                              Dòng {t.rowIndex + 2}:
                            </span>{' '}
                            <span className="text-[var(--danger)]">
                              {t.errors.join(', ')}
                            </span>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              )}

              {/* Preview Table */}
              <div className="border border-[var(--border)] rounded-[var(--radius-lg)] overflow-hidden">
                <div className="overflow-x-auto max-h-64 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-[var(--surface)] sticky top-0">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-[var(--text-secondary)]">
                          #
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-[var(--text-secondary)]">
                          Loại
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-[var(--text-secondary)]">
                          Mô tả
                        </th>
                        <th className="px-3 py-2 text-right text-xs font-medium text-[var(--text-secondary)]">
                          Số tiền
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-[var(--text-secondary)]">
                          Ngày
                        </th>
                        <th className="px-3 py-2 text-center text-xs font-medium text-[var(--text-secondary)]">
                          Trạng thái
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--divider)]">
                      {parsedTransactions.slice(0, 50).map((t, i) => (
                        <tr
                          key={i}
                          className={!t.valid ? 'bg-[var(--danger-light)]/50' : ''}
                        >
                          <td className="px-3 py-2 text-xs text-[var(--text-tertiary)] tabular-nums">
                            {i + 1}
                          </td>
                          <td className="px-3 py-2">
                            <div className="flex items-center gap-1.5">
                              {getTypeIcon(t.type)}
                              <span className="text-xs">
                                {t.type === 'income' ? 'Thu' : t.type === 'transfer' ? 'Chuyển' : 'Chi'}
                              </span>
                            </div>
                          </td>
                          <td className="px-3 py-2 text-[var(--text-primary)] max-w-[200px] truncate">
                            {t.description}
                          </td>
                          <td className={`px-3 py-2 text-right font-medium tabular-nums ${
                            t.type === 'income' ? 'text-[var(--success)]' : 'text-[var(--danger)]'
                          }`}>
                            {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                          </td>
                          <td className="px-3 py-2 text-xs text-[var(--text-secondary)] tabular-nums">
                            {t.date}
                          </td>
                          <td className="px-3 py-2 text-center">
                            {t.valid ? (
                              <CheckCircle className="w-4 h-4 text-[var(--success)] mx-auto" />
                            ) : (
                              <AlertTriangle className="w-4 h-4 text-[var(--danger)] mx-auto" />
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {parsedTransactions.length > 50 && (
                  <div className="text-center py-2 text-xs text-[var(--text-tertiary)] bg-[var(--surface)]">
                    Hiển thị 50/{parsedTransactions.length} dòng
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-5 border-t border-[var(--border)]">
          <div>
            {step !== 'upload' && (
              <button
                onClick={() => {
                  if (step === 'preview') setStep('mapping');
                  else if (step === 'mapping') {
                    reset();
                  }
                }}
                className="text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
              >
                {step === 'mapping' ? 'Chọn lại file' : 'Quay lại'}
              </button>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
              Huỷ
            </button>
            {step === 'mapping' && (
              <Button onClick={handleProceedToPreview}>
                Xem trước ({rows.length} dòng)
              </Button>
            )}
            {step === 'preview' && validCount > 0 && (
              <Button onClick={handleImport}>
                <CheckCircle className="w-4 h-4 mr-2" />
                Nhập {validCount} giao dịch
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
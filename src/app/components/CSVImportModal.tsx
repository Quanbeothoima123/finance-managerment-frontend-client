import React, { useState, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
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
import i18n from '../../i18n';
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
  const ns = 'transactions:csv_import';

  const get = (field: string): string => {
    const idx = columnMapping[field];
    if (idx === undefined || idx < 0 || idx >= row.length) return '';
    return row[idx].trim();
  };

  const rawType = get('type').toLowerCase();
  let type: 'income' | 'expense' | 'transfer' = 'expense';
  if (['income', 'thu', 'thu nhập', 'thu nhap'].includes(rawType)) {
    type = 'income';
  } else if (['transfer', 'chuyển', 'chuyen', 'chuyển khoản'].includes(rawType)) {
    type = 'transfer';
  } else if (['expense', 'chi', 'chi tiêu', 'chi tieu'].includes(rawType)) {
    type = 'expense';
  }

  const rawAmount = get('amount').replace(/[^\d.-]/g, '');
  const amount = parseFloat(rawAmount);
  if (isNaN(amount) || amount <= 0) {
    errors.push(i18n.t(`${ns}.errors.invalid_amount`));
  }

  let date = get('date');
  if (!date) {
    date = new Date().toISOString().split('T')[0];
    errors.push(i18n.t(`${ns}.errors.missing_date`));
  } else {
    const parsed = new Date(date);
    if (isNaN(parsed.getTime())) {
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
          errors.push(i18n.t(`${ns}.date_format_error`));
        }
      } else {
        date = new Date().toISOString().split('T')[0];
        errors.push(i18n.t(`${ns}.date_format_error`));
      }
    } else {
      date = parsed.toISOString().split('T')[0];
    }
  }

  const description =
    get('description') || get('note') || i18n.t(`${ns}.default_description`);
  const category = get('category') || i18n.t(`${ns}.default_category`);
  const account = get('account') || i18n.t(`${ns}.default_account`);
  const merchant = get('merchant') || undefined;
  const tagsStr = get('tags');
  const tags = tagsStr
    ? tagsStr.split(/[;|,]/).map((t) => t.trim()).filter(Boolean)
    : [];

  if (!get('description') && !get('note')) {
    errors.push(i18n.t(`${ns}.errors.missing_description`));
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
    valid:
      errors.filter(
        (e) =>
          e !== i18n.t(`${ns}.errors.missing_date`) &&
          e !== i18n.t(`${ns}.errors.missing_description`)
      ).length === 0,
    errors,
  };
}

const EXPECTED_FIELDS = [
  'type', 'amount', 'date', 'description', 'category', 'account', 'merchant', 'tags', 'note',
];

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
  const { t } = useTranslation('transactions');
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
    if (
      !file.name.endsWith('.csv') &&
      !file.type.includes('csv') &&
      !file.type.includes('text')
    ) {
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

  const getTypeShort = (type: string) => {
    if (type === 'income') return t('csv_import.preview.type_income');
    if (type === 'transfer') return t('csv_import.preview.type_transfer');
    return t('csv_import.preview.type_expense');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={handleClose} />

      <div className="relative bg-[var(--card)] rounded-[var(--radius-xl)] shadow-[var(--shadow-xl)] w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-[var(--border)]">
          <div>
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">
              {t('csv_import.modal_title')}
            </h2>
            <p className="text-sm text-[var(--text-secondary)] mt-0.5">
              {step === 'upload' && t('csv_import.steps.upload')}
              {step === 'mapping' && t('csv_import.steps.mapping')}
              {step === 'preview' &&
                t('csv_import.steps.preview', { count: validCount })}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-[var(--radius-md)] hover:bg-[var(--surface)] transition-colors"
          >
            <X className="w-5 h-5 text-[var(--text-secondary)]" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
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
                  {t('csv_import.upload.drop_hint')}
                </p>
                <p className="text-sm text-[var(--text-secondary)]">
                  {t('csv_import.upload.click_hint')}
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,text/csv"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>

              <div className="p-4 bg-[var(--surface)] rounded-[var(--radius-lg)]">
                <h4 className="font-medium text-[var(--text-primary)] mb-2">
                  {t('csv_import.upload.format_guide_title')}
                </h4>
                <p className="text-sm text-[var(--text-secondary)] mb-3">
                  {t('csv_import.upload.format_guide_body')}
                </p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {(['type', 'amount', 'date', 'description', 'category', 'account'] as const).map(
                    (field) => (
                      <div
                        key={field}
                        className="flex items-center gap-2 p-2 bg-[var(--card)] rounded-[var(--radius-md)]"
                      >
                        <span className="font-mono font-semibold text-[var(--primary)]">
                          {field}
                        </span>
                        <span className="text-[var(--text-secondary)]">
                          {t(`csv_import.mapping.fields.${field}`)}
                        </span>
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>
          )}

          {step === 'mapping' && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-[var(--success-light)] rounded-[var(--radius-lg)]">
                <FileText className="w-5 h-5 text-[var(--success)]" />
                <div className="flex-1">
                  <span className="text-sm font-medium text-[var(--text-primary)]">
                    {fileName}
                  </span>
                  <span className="text-sm text-[var(--text-secondary)] ml-2">
                    ({t('csv_import.mapping.file_info', {
                      rows: rows.length,
                      cols: headers.length,
                    })})
                  </span>
                </div>
              </div>

              <div>
                <h3 className="font-medium text-[var(--text-primary)] mb-3">
                  {t('csv_import.mapping.title')}
                </h3>
                <p className="text-sm text-[var(--text-secondary)] mb-4">
                  {t('csv_import.mapping.description')}
                </p>
                <div className="space-y-3">
                  {EXPECTED_FIELDS.map((field) => (
                    <div key={field} className="flex items-center gap-3">
                      <label className="w-28 text-sm font-medium text-[var(--text-primary)] capitalize">
                        {t(`csv_import.mapping.fields.${field}`, { defaultValue: field })}
                      </label>
                      <select
                        value={columnMapping[field] ?? -1}
                        onChange={(e) => {
                          const val = parseInt(e.target.value);
                          setColumnMapping((prev) => ({ ...prev, [field]: val }));
                        }}
                        className="flex-1 px-3 py-2 bg-[var(--input-background)] border border-[var(--border)] rounded-[var(--radius-lg)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]"
                      >
                        <option value={-1}>{t('csv_import.mapping.skip_option')}</option>
                        {headers.map((h, idx) => (
                          <option key={idx} value={idx}>
                            {h}{' '}
                            {rows[0] && rows[0][idx]
                              ? `(${rows[0][idx].substring(0, 20)})`
                              : ''}
                          </option>
                        ))}
                      </select>
                      {['type', 'amount'].includes(field) &&
                        columnMapping[field] === undefined && (
                          <AlertTriangle className="w-4 h-4 text-[var(--warning)] flex-shrink-0" />
                        )}
                    </div>
                  ))}
                </div>
              </div>

              {rows.length > 0 && (
                <div className="p-3 bg-[var(--surface)] rounded-[var(--radius-lg)]">
                  <h4 className="text-sm font-medium text-[var(--text-primary)] mb-2">
                    {t('csv_import.mapping.first_row_preview')}
                  </h4>
                  <div className="text-xs text-[var(--text-secondary)] font-mono break-all">
                    {rows[0].join(' | ')}
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 'preview' && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-[var(--surface)] rounded-[var(--radius-lg)] text-center">
                  <p className="text-2xl font-bold text-[var(--text-primary)] tabular-nums">
                    {parsedTransactions.length}
                  </p>
                  <p className="text-xs text-[var(--text-secondary)]">
                    {t('csv_import.mapping.total')}
                  </p>
                </div>
                <div className="p-3 bg-[var(--success-light)] rounded-[var(--radius-lg)] text-center">
                  <p className="text-2xl font-bold text-[var(--success)] tabular-nums">
                    {validCount}
                  </p>
                  <p className="text-xs text-[var(--text-secondary)]">
                    {t('csv_import.mapping.valid')}
                  </p>
                </div>
                <div className="p-3 bg-[var(--danger-light)] rounded-[var(--radius-lg)] text-center">
                  <p className="text-2xl font-bold text-[var(--danger)] tabular-nums">
                    {invalidCount}
                  </p>
                  <p className="text-xs text-[var(--text-secondary)]">
                    {t('csv_import.mapping.invalid')}
                  </p>
                </div>
              </div>

              {invalidCount > 0 && (
                <div className="border border-[var(--warning)] rounded-[var(--radius-lg)] overflow-hidden">
                  <button
                    onClick={() => setShowErrors(!showErrors)}
                    className="w-full flex items-center justify-between p-3 bg-[var(--warning-light)] text-left"
                  >
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-[var(--warning)]" />
                      <span className="text-sm font-medium text-[var(--text-primary)]">
                        {t('csv_import.mapping.invalid_rows', { count: invalidCount })}
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
                        .map((txn) => (
                          <div key={txn.rowIndex} className="text-xs">
                            <span className="font-medium text-[var(--text-primary)]">
                              {t('csv_import.preview.row_num', { n: txn.rowIndex + 2 })}:
                            </span>{' '}
                            <span className="text-[var(--danger)]">
                              {txn.errors.join(', ')}
                            </span>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              )}

              <div className="border border-[var(--border)] rounded-[var(--radius-lg)] overflow-hidden">
                <div className="overflow-x-auto max-h-64 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-[var(--surface)] sticky top-0">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-[var(--text-secondary)]">
                          {t('csv_import.preview.col_num')}
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-[var(--text-secondary)]">
                          {t('csv_import.preview.col_type')}
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-[var(--text-secondary)]">
                          {t('csv_import.preview.col_description')}
                        </th>
                        <th className="px-3 py-2 text-right text-xs font-medium text-[var(--text-secondary)]">
                          {t('csv_import.preview.col_amount')}
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-[var(--text-secondary)]">
                          {t('csv_import.preview.col_date')}
                        </th>
                        <th className="px-3 py-2 text-center text-xs font-medium text-[var(--text-secondary)]">
                          {t('csv_import.preview.col_status')}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--divider)]">
                      {parsedTransactions.slice(0, 50).map((txn, i) => (
                        <tr
                          key={i}
                          className={!txn.valid ? 'bg-[var(--danger-light)]/50' : ''}
                        >
                          <td className="px-3 py-2 text-xs text-[var(--text-tertiary)] tabular-nums">
                            {i + 1}
                          </td>
                          <td className="px-3 py-2">
                            <div className="flex items-center gap-1.5">
                              {getTypeIcon(txn.type)}
                              <span className="text-xs">{getTypeShort(txn.type)}</span>
                            </div>
                          </td>
                          <td className="px-3 py-2 text-[var(--text-primary)] max-w-[200px] truncate">
                            {txn.description}
                          </td>
                          <td
                            className={`px-3 py-2 text-right font-medium tabular-nums ${
                              txn.type === 'income'
                                ? 'text-[var(--success)]'
                                : 'text-[var(--danger)]'
                            }`}
                          >
                            {txn.type === 'income' ? '+' : '-'}
                            {new Intl.NumberFormat(
                              i18n.language === 'en' ? 'en-US' : 'vi-VN'
                            ).format(txn.amount)}
                          </td>
                          <td className="px-3 py-2 text-xs text-[var(--text-secondary)] tabular-nums">
                            {txn.date}
                          </td>
                          <td className="px-3 py-2 text-center">
                            {txn.valid ? (
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
                    {t('csv_import.preview.show_limit', {
                      total: parsedTransactions.length,
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between p-5 border-t border-[var(--border)]">
          <div>
            {step !== 'upload' && (
              <button
                onClick={() => {
                  if (step === 'preview') setStep('mapping');
                  else if (step === 'mapping') reset();
                }}
                className="text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
              >
                {step === 'mapping'
                  ? t('csv_import.footer_choose_again')
                  : t('csv_import.footer_back')}
              </button>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
              {t('common:actions.cancel')}
            </button>
            {step === 'mapping' && (
              <Button onClick={handleProceedToPreview}>
                {t('csv_import.preview.title', { count: rows.length })}
              </Button>
            )}
            {step === 'preview' && validCount > 0 && (
              <Button onClick={handleImport}>
                <CheckCircle className="w-4 h-4 mr-2" />
                {t('csv_import.preview.submit', { count: validCount })}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

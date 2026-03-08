import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Sparkles, X, HelpCircle, ChevronRight, AlertTriangle, Check,
} from 'lucide-react';
import { useDemoData, type Account, type Category } from '../contexts/DemoDataContext';
import { useToast } from '../contexts/ToastContext';
import { useAppNavigation } from '../hooks/useAppNavigation';
import { useAutoRules } from '../hooks/useAutoRules';
import { AmountInput } from './AmountInput';

// ── Account alias map ────────────────────────────────────────────────────────
const ACCOUNT_ALIASES: Record<string, string[]> = {
  // Map alias → possible account name substrings (lowercased)
  momo: ['momo'],
  vcb: ['vietcombank'],
  vietcombank: ['vietcombank'],
  tcb: ['techcombank'],
  techcombank: ['techcombank'],
  mb: ['mbbank', 'mb bank'],
  cash: ['tiền mặt'],
  'tiền mặt': ['tiền mặt'],
  tienmat: ['tiền mặt'],
  visa: ['visa', 'thẻ tín dụng'],
};

// ── Income keywords ──────────────────────────────────────────────────────────
const INCOME_KEYWORDS = ['salary', 'income', 'lương', 'thu', 'nhận', 'thưởng', 'bonus', 'hoàn tiền'];

// ── Amount parsing ───────────────────────────────────────────────────────────
function parseAmount(text: string): { amount: number; remaining: string } | null {
  // Try patterns: 1.2tr, 1.2m, 45k, 120000, 120.000
  const patterns = [
    // 1.2tr or 1,2tr
    { regex: /(\+?)(\d+[.,]\d+)\s*(?:tr|triệu)/i, multiplier: 1_000_000, decimal: true },
    // 8tr or 8m
    { regex: /(\+?)(\d+)\s*(?:tr|triệu|m(?!o))/i, multiplier: 1_000_000, decimal: false },
    // 45k or 45ng or 45nghìn
    { regex: /(\+?)(\d+[.,]?\d*)\s*(?:k|ng|nghìn|ngàn)/i, multiplier: 1_000, decimal: true },
    // Plain number with dots as thousand separator: 120.000 or 1.200.000
    { regex: /(\+?)(\d{1,3}(?:\.\d{3})+)(?!\w)/i, multiplier: 1, decimal: false, dotThousand: true },
    // Plain number: 120000
    { regex: /(\+?)(\d{4,})(?!\w)/i, multiplier: 1, decimal: false },
  ];

  for (const pat of patterns) {
    const match = text.match(pat.regex);
    if (match) {
      let numStr = match[2];
      if ((pat as any).dotThousand) {
        numStr = numStr.replace(/\./g, '');
      } else {
        numStr = numStr.replace(',', '.');
      }
      const num = parseFloat(numStr) * pat.multiplier;
      if (!isNaN(num) && num > 0) {
        const remaining = text.replace(match[0], '').trim();
        return { amount: Math.round(num), remaining };
      }
    }
  }
  return null;
}

// ── Account matching ─────────────────────────────────────────────────────────
function matchAccount(text: string, accounts: Account[]): { account: Account | null; matches: Account[]; remaining: string } {
  const lower = text.toLowerCase();
  const tokens = lower.split(/\s+/);
  let bestMatches: Account[] = [];
  let matchedToken = '';

  for (const token of tokens) {
    // Check aliases
    const aliasNames = ACCOUNT_ALIASES[token];
    if (aliasNames) {
      const found = accounts.filter(a =>
        aliasNames.some(alias => a.name.toLowerCase().includes(alias))
      );
      if (found.length > bestMatches.length || (found.length > 0 && bestMatches.length === 0)) {
        bestMatches = found;
        matchedToken = token;
      }
    }
    // Direct name match
    const directMatch = accounts.filter(a =>
      a.name.toLowerCase().includes(token) && token.length >= 2
    );
    if (directMatch.length > 0 && (bestMatches.length === 0 || directMatch.length < bestMatches.length)) {
      bestMatches = directMatch;
      matchedToken = token;
    }
  }

  const remaining = matchedToken ? text.replace(new RegExp(matchedToken, 'i'), '').trim() : text;

  if (bestMatches.length === 1) {
    return { account: bestMatches[0], matches: bestMatches, remaining };
  }
  return { account: null, matches: bestMatches, remaining };
}

// ── Type detection ───────────────────────────────────────────────────────────
function detectType(text: string, amountText: string): 'income' | 'expense' {
  const lower = text.toLowerCase();
  if (amountText.startsWith('+')) return 'income';
  for (const kw of INCOME_KEYWORDS) {
    if (lower.includes(kw)) return 'income';
  }
  return 'expense';
}

// ── Parse result ─────────────────────────────────────────────────────────────
interface ParseResult {
  amount: number;
  type: 'income' | 'expense';
  accountId: string;
  accountName: string;
  accountMatches: Account[];
  categoryId: string;
  merchantId: string;
  description: string;
  confidence: string[];
  errors: string[];
}

function parseTransaction(text: string, accounts: Account[], evaluateRules: any): ParseResult {
  const result: ParseResult = {
    amount: 0, type: 'expense', accountId: '', accountName: '',
    accountMatches: [], categoryId: '', merchantId: '',
    description: '', confidence: [], errors: [],
  };

  // 1. Parse amount
  const amountResult = parseAmount(text);
  if (amountResult) {
    result.amount = amountResult.amount;
    result.confidence.push(`Số tiền = ${new Intl.NumberFormat('vi-VN').format(amountResult.amount)}đ`);
    text = amountResult.remaining;
  } else {
    result.errors.push('Không tìm thấy số tiền.');
  }

  // 2. Detect type
  result.type = detectType(text, text);
  if (result.type === 'income') {
    result.confidence.push('Loại = Thu nhập');
  }

  // 3. Match account (only non-archived)
  const activeAccounts = accounts.filter(a => !a.archived);
  const accResult = matchAccount(text, activeAccounts);
  if (accResult.account) {
    result.accountId = accResult.account.id;
    result.accountName = accResult.account.name;
    result.confidence.push(`Tài khoản = ${accResult.account.name}`);
    text = accResult.remaining;
  } else if (accResult.matches.length > 1) {
    result.accountMatches = accResult.matches;
    result.errors.push('Có ' + accResult.matches.length + ' tài khoản khớp — vui lòng chọn.');
    text = accResult.remaining;
  } else {
    result.errors.push('Chưa nhận diện được tài khoản — vui lòng chọn.');
  }

  // 4. Category via auto-rules
  const ruleMatch = evaluateRules({
    description: text,
    merchantId: '',
    accountId: result.accountId,
    amount: String(result.amount),
    type: result.type,
  });
  if (ruleMatch?.fieldsSet.categoryId) {
    result.categoryId = ruleMatch.fieldsSet.categoryId;
  }
  if (ruleMatch?.fieldsSet.merchantId) {
    result.merchantId = ruleMatch.fieldsSet.merchantId;
  }

  // 5. Description = remaining text
  result.description = text.replace(/\s+/g, ' ').trim();

  return result;
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════════════════════════
export function ChatTransactionParser({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { accounts, categories, addTransaction } = useDemoData();
  const toast = useToast();
  const nav = useAppNavigation();
  const { evaluateRules } = useAutoRules();

  const [inputText, setInputText] = useState('');
  const [parsed, setParsed] = useState<ParseResult | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Editable preview state
  const [editType, setEditType] = useState<'income' | 'expense'>('expense');
  const [editAmount, setEditAmount] = useState('');
  const [editAccountId, setEditAccountId] = useState('');
  const [editCategoryId, setEditCategoryId] = useState('');
  const [editDescription, setEditDescription] = useState('');

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setInputText('');
      setParsed(null);
    }
  }, [isOpen]);

  // Sync parsed → editable fields
  useEffect(() => {
    if (parsed) {
      setEditType(parsed.type);
      setEditAmount(String(parsed.amount));
      setEditAccountId(parsed.accountId);
      setEditCategoryId(parsed.categoryId);
      setEditDescription(parsed.description);
    }
  }, [parsed]);

  const handleParse = () => {
    const trimmed = inputText.trim();
    if (!trimmed) return;
    const result = parseTransaction(trimmed, accounts, evaluateRules);
    if (result.errors.length > 0 && result.amount === 0) {
      toast.warning('Chưa hiểu nội dung, thử lại: "cafe 45k momo"');
    }
    setParsed(result);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleParse();
    }
  };

  const filteredCategories = useMemo(() => {
    return categories.filter(c => {
      if (c.hidden) return false;
      if (editType === 'income') return c.type === 'income';
      if (editType === 'expense') return c.type === 'expense';
      return true;
    });
  }, [categories, editType]);

  const handleSave = () => {
    const amount = parseInt(editAmount, 10) || 0;
    if (amount <= 0) {
      toast.error('Vui lòng nhập số tiền hợp lệ');
      return;
    }
    if (!editAccountId) {
      toast.error('Vui lòng chọn tài khoản');
      return;
    }

    const selectedAccount = accounts.find(a => a.id === editAccountId);
    const selectedCategory = categories.find(c => c.id === editCategoryId);
    const finalAmount = editType === 'expense' ? -Math.abs(amount) : Math.abs(amount);

    addTransaction({
      type: editType,
      amount: finalAmount,
      category: selectedCategory?.name || '',
      categoryId: editCategoryId,
      account: selectedAccount?.name || '',
      accountId: editAccountId,
      description: editDescription || inputText.trim(),
      date: new Date().toISOString().split('T')[0],
      tags: [],
    });

    toast.success('Đã lưu giao dịch');
    onClose();
  };

  const handleEditDetails = () => {
    // Navigate to full form with pre-filled data
    onClose();
    nav.goCreateTransaction(editAccountId || undefined);
  };

  const fmt = (n: number) => new Intl.NumberFormat('vi-VN').format(n);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-[var(--card)] w-full max-w-lg rounded-t-[var(--radius-xl)] sm:rounded-[var(--radius-xl)] max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--divider)]">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[var(--primary)]" />
            <h3 className="text-lg font-semibold text-[var(--text-primary)]">Nhập nhanh</h3>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowHelp(true)} className="p-1.5 rounded-[var(--radius-md)] hover:bg-[var(--surface)] transition-colors">
              <HelpCircle className="w-5 h-5 text-[var(--text-tertiary)]" />
            </button>
            <button onClick={onClose} className="p-1.5 rounded-[var(--radius-md)] hover:bg-[var(--surface)] transition-colors">
              <X className="w-5 h-5 text-[var(--text-secondary)]" />
            </button>
          </div>
        </div>

        {/* Input */}
        <div className="p-4">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <input
                ref={inputRef}
                type="text"
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder='e.g., cafe 45k momo'
                className="w-full px-4 py-3 bg-[var(--input-background)] border border-[var(--border)] rounded-[var(--radius-lg)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)] pr-10"
              />
              <Sparkles className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]" />
            </div>
            <button
              onClick={handleParse}
              disabled={!inputText.trim()}
              className="px-4 py-3 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white rounded-[var(--radius-lg)] font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Preview Card */}
        {parsed && (
          <div className="px-4 pb-4 space-y-4">
            <h4 className="text-sm font-semibold text-[var(--text-primary)]">Xem trước giao dịch</h4>

            {/* Confidence hints */}
            {parsed.confidence.length > 0 && (
              <div className="p-3 bg-[var(--success-light)] border border-[var(--success)] rounded-[var(--radius-lg)]">
                <p className="text-xs text-[var(--text-secondary)]">
                  <Check className="w-3.5 h-3.5 inline mr-1 text-[var(--success)]" />
                  Auto-detected: {parsed.confidence.join(', ')}
                </p>
              </div>
            )}

            {/* Errors */}
            {parsed.errors.length > 0 && (
              <div className="p-3 bg-[var(--warning-light)] border border-[var(--warning)] rounded-[var(--radius-lg)]">
                {parsed.errors.map((err, i) => (
                  <p key={i} className="text-xs text-[var(--text-secondary)]">
                    <AlertTriangle className="w-3.5 h-3.5 inline mr-1 text-[var(--warning)]" />
                    {err}
                  </p>
                ))}
              </div>
            )}

            {/* Editable fields */}
            <div className="space-y-3">
              {/* Type toggle */}
              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">Loại</label>
                <div className="flex gap-2">
                  {[
                    { value: 'expense' as const, label: 'Chi tiêu', color: 'var(--danger)' },
                    { value: 'income' as const, label: 'Thu nhập', color: 'var(--success)' },
                  ].map(opt => (
                    <button key={opt.value} type="button"
                      onClick={() => setEditType(opt.value)}
                      className={`flex-1 py-2 rounded-[var(--radius-lg)] text-sm font-medium border-2 transition-all ${
                        editType === opt.value
                          ? 'border-current bg-opacity-10'
                          : 'border-[var(--border)] text-[var(--text-secondary)]'
                      }`}
                      style={editType === opt.value ? { color: opt.color, borderColor: opt.color, backgroundColor: opt.color + '15' } : {}}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">Số tiền</label>
                <AmountInput value={editAmount} onChange={setEditAmount} compact />
              </div>

              {/* Account */}
              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">Tài khoản</label>
                <select value={editAccountId} onChange={e => setEditAccountId(e.target.value)}
                  className={`w-full px-3 py-2.5 text-sm bg-[var(--input-background)] border rounded-[var(--radius-lg)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)] ${
                    !editAccountId ? 'border-[var(--warning)]' : 'border-[var(--border)]'
                  }`}>
                  <option value="">Chọn tài khoản</option>
                  {accounts.filter(a => !a.archived).map(a => (
                    <option key={a.id} value={a.id}>{a.name} — {fmt(a.balance)}₫</option>
                  ))}
                </select>
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">Danh mục</label>
                <select value={editCategoryId} onChange={e => setEditCategoryId(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm bg-[var(--input-background)] border border-[var(--border)] rounded-[var(--radius-lg)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]">
                  <option value="">Chọn danh mục</option>
                  {filteredCategories.map(c => (
                    <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">Mô tả</label>
                <input type="text" value={editDescription} onChange={e => setEditDescription(e.target.value)}
                  placeholder="Mô tả giao dịch..."
                  className="w-full px-3 py-2.5 text-sm bg-[var(--input-background)] border border-[var(--border)] rounded-[var(--radius-lg)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]" />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button onClick={handleEditDetails}
                className="flex-1 px-4 py-2.5 border border-[var(--border)] text-[var(--text-secondary)] rounded-[var(--radius-lg)] font-medium hover:bg-[var(--surface)] transition-colors text-sm">
                Sửa chi tiết
              </button>
              <button onClick={handleSave}
                className="flex-1 px-4 py-2.5 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white rounded-[var(--radius-lg)] font-medium transition-colors shadow-[var(--shadow-sm)] text-sm">
                Lưu
              </button>
            </div>
          </div>
        )}

        {/* Empty state before parse */}
        {!parsed && (
          <div className="px-4 pb-6 text-center">
            <p className="text-sm text-[var(--text-tertiary)]">
              Nhập mô tả giao dịch bằng ngôn ngữ tự nhiên và nhấn Enter
            </p>
            <div className="mt-3 flex flex-wrap justify-center gap-2">
              {['cafe 45k momo', 'lương 8m tcb', 'grab 120k cash'].map(ex => (
                <button key={ex} type="button"
                  onClick={() => { setInputText(ex); }}
                  className="px-3 py-1.5 text-xs bg-[var(--surface)] border border-[var(--border)] rounded-full text-[var(--text-secondary)] hover:border-[var(--primary)] hover:text-[var(--primary)] transition-colors">
                  "{ex}"
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Help Modal */}
        {showHelp && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]" onClick={() => setShowHelp(false)}>
            <div className="bg-[var(--card)] w-full max-w-sm rounded-[var(--radius-xl)] p-6 mx-4" onClick={e => e.stopPropagation()}>
              <h4 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Ví dụ nhập nhanh</h4>
              <div className="space-y-3">
                {[
                  { input: 'lunch 45k cash', desc: 'Chi 45.000đ tiền mặt' },
                  { input: 'salary 8m vcb', desc: 'Nhận lương 8 triệu Vietcombank' },
                  { input: 'grab 120k momo', desc: 'Grab 120.000đ qua MoMo' },
                  { input: 'cà phê 35k', desc: 'Cà phê 35.000đ (chọn TK sau)' },
                  { input: '+2tr tcb thưởng', desc: 'Nhận thưởng 2 triệu Techcombank' },
                  { input: 'siêu thị 450k visa', desc: 'Siêu thị 450.000đ qua Visa' },
                ].map((ex, i) => (
                  <div key={i} className="p-3 bg-[var(--surface)] rounded-[var(--radius-lg)]">
                    <p className="text-sm font-medium text-[var(--primary)] font-mono">"{ex.input}"</p>
                    <p className="text-xs text-[var(--text-tertiary)] mt-0.5">{ex.desc}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 space-y-2 text-xs text-[var(--text-tertiary)]">
                <p><span className="font-semibold text-[var(--text-secondary)]">Số tiền:</span> 45k = 45.000 | 8tr/8m = 8.000.000 | 1.2tr = 1.200.000</p>
                <p><span className="font-semibold text-[var(--text-secondary)]">Tài khoản:</span> momo, vcb, tcb, cash, visa</p>
                <p><span className="font-semibold text-[var(--text-secondary)]">Thu nhập:</span> lương, thu, nhận, thưởng, +</p>
              </div>
              <button onClick={() => setShowHelp(false)}
                className="w-full mt-4 px-4 py-2.5 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white rounded-[var(--radius-lg)] font-medium transition-colors">
                Đã hiểu
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

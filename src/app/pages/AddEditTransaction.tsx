import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useParams, useSearchParams } from 'react-router';
import { ChevronLeft, Calendar as CalendarIcon, AlertTriangle, X as XIcon, Plus, Trash2, SplitSquareHorizontal, Shuffle, ArrowDownToLine, Zap, Undo2, Sparkles, Copy } from 'lucide-react';
import { useDemoData, SplitItem } from '../contexts/DemoDataContext';
import { useToast } from '../contexts/ToastContext';
import { useAppNavigation } from '../hooks/useAppNavigation';
import { Button } from '../components/Button';
import { AmountInput } from '../components/AmountInput';
import { TagPickerModal } from '../components/TagPickerModal';
import { TagChip } from '../components/TagChip';
import { maskAccountNumber } from '../utils/accountHelpers';
import { useAutoRules, type AutoRuleMatch, type HistorySuggestion } from '../hooks/useAutoRules';
import { ChatTransactionParser } from '../components/ChatTransactionParser';
import { CloudAttachmentSection } from '../components/CloudAttachmentSection';
import { type CloudAttachment } from '../contexts/DemoDataContext';

// ─── Split Line Item ────────────────────────────────────────────────────────
interface SplitLineState {
  id: string;
  categoryId: string;
  amount: string; // raw string for input
  note: string;
}

const newSplitLine = (amount = ''): SplitLineState => ({
  id: `split-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
  categoryId: '',
  amount,
  note: '',
});

// ─── Main Component ─────────────────────────────────────────────────────────
export default function AddEditTransaction() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const preselectedAccountId = searchParams.get('accountId') || '';
  const { accounts, categories, transactions, merchants, tags, addTransaction, updateTransaction, selectedCurrency, autoRules, updateAutoRule } = useDemoData();
  const toast = useToast();
  const nav = useAppNavigation();

  const existingTransaction = id ? transactions.find(t => t.id === id) : null;
  const mode = existingTransaction ? 'edit' : 'create';

  const currencySymbol = selectedCurrency === 'VND' ? '₫' : selectedCurrency;

  // ── Duplicate mode ─────────────────────────────────────────────────────
  const duplicateFromId = searchParams.get('duplicateFrom') || '';
  const sourceTransaction = duplicateFromId ? transactions.find(t => t.id === duplicateFromId) : null;
  const isDuplicateMode = !!sourceTransaction && mode === 'create';
  const [keepOriginalDate, setKeepOriginalDate] = useState(false);
  const [duplicateBannerVisible, setDuplicateBannerVisible] = useState(!!sourceTransaction);
  const duplicateToastShown = useRef(false);

  // Show toast on first load in duplicate mode
  useEffect(() => {
    if (isDuplicateMode && !duplicateToastShown.current) {
      duplicateToastShown.current = true;
      toast.info('Đã điền sẵn thông tin từ giao dịch trước.');
    }
  }, [isDuplicateMode]);

  // ── Form state ──────────────────────────────────────────────────────────
  const [formData, setFormData] = useState(() => {
    // Prefill from duplicate source
    if (sourceTransaction && !id) {
      return {
        type: sourceTransaction.type as 'income' | 'expense' | 'transfer',
        amount: String(Math.abs(sourceTransaction.amount)),
        categoryId: sourceTransaction.categoryId || '',
        accountId: sourceTransaction.accountId || '',
        description: sourceTransaction.description || '',
        date: new Date().toISOString().split('T')[0], // default to today
        merchantId: sourceTransaction.merchantId || '',
        notes: sourceTransaction.notes || '',
        tagIds: sourceTransaction.tags ? [...sourceTransaction.tags] : [] as string[],
      };
    }
    return {
      type: existingTransaction?.type || 'expense' as 'income' | 'expense' | 'transfer',
      amount: existingTransaction ? String(Math.abs(existingTransaction.amount)) : '',
      categoryId: existingTransaction?.categoryId || '',
      accountId: existingTransaction?.accountId || preselectedAccountId,
      description: existingTransaction?.description || '',
      date: existingTransaction?.date || new Date().toISOString().split('T')[0],
      merchantId: existingTransaction?.merchantId || '',
      notes: existingTransaction?.notes || '',
      tagIds: existingTransaction?.tags || [] as string[],
    };
  });

  // ── Split state ─────────────────────────────────────────────────────────
  const [isSplit, setIsSplit] = useState(() => {
    if (sourceTransaction?.isSplit) return true;
    return existingTransaction?.isSplit || false;
  });
  const [splitLines, setSplitLines] = useState<SplitLineState[]>(() => {
    // Duplicate source split
    if (sourceTransaction?.isSplit && sourceTransaction.splitItems?.length) {
      return sourceTransaction.splitItems.map(si => ({
        id: `split-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        categoryId: si.categoryId,
        amount: String(Math.abs(si.amount)),
        note: si.note || '',
      }));
    }
    if (existingTransaction?.isSplit && existingTransaction.splitItems?.length) {
      return existingTransaction.splitItems.map(si => ({
        id: si.id,
        categoryId: si.categoryId,
        amount: String(Math.abs(si.amount)),
        note: si.note || '',
      }));
    }
    return [newSplitLine(), newSplitLine()];
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [splitErrors, setSplitErrors] = useState<Record<string, Record<string, string>>>({});
  const [showTagPicker, setShowTagPicker] = useState(false);
  const [showChatParser, setShowChatParser] = useState(false);
  const [formAttachments, setFormAttachments] = useState<CloudAttachment[]>(() => {
    if (sourceTransaction?.attachments?.length) return [...sourceTransaction.attachments];
    if (existingTransaction?.attachments?.length) return [...existingTransaction.attachments];
    return [];
  });

  // ── Derived ─────────────────────────────────────────────────────────────
  const totalAmount = parseInt(formData.amount, 10) || 0;
  const allocated = splitLines.reduce((sum, l) => sum + (parseInt(l.amount, 10) || 0), 0);
  const remaining = totalAmount - allocated;

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // When type changes to transfer, turn off split
  useEffect(() => {
    if (formData.type === 'transfer' && isSplit) {
      setIsSplit(false);
    }
  }, [formData.type]);

  // Filter categories by type, exclude hidden (unless editing a transaction with a hidden category)
  const filteredCategories = categories.filter(c => {
    // Exclude hidden categories from the picker
    if (c.hidden) return false;
    if (formData.type === 'income') return c.type === 'income';
    if (formData.type === 'expense') return c.type === 'expense';
    return true;
  });

  // ── Split helpers ───────────────────────────────────────────────────────
  const updateSplitLine = useCallback((lineId: string, field: keyof SplitLineState, value: string) => {
    setSplitLines(prev => prev.map(l => l.id === lineId ? { ...l, [field]: value } : l));
    // Clear error
    setSplitErrors(prev => {
      const lineErrors = { ...(prev[lineId] || {}) };
      delete lineErrors[field];
      return { ...prev, [lineId]: lineErrors };
    });
  }, []);

  const addSplitLine = useCallback(() => {
    const fillAmount = remaining > 0 ? String(remaining) : '';
    setSplitLines(prev => [...prev, newSplitLine(fillAmount)]);
  }, [remaining]);

  const removeSplitLine = useCallback((lineId: string) => {
    setSplitLines(prev => prev.filter(l => l.id !== lineId));
  }, []);

  const distributeEvenly = useCallback(() => {
    if (totalAmount <= 0 || splitLines.length === 0) return;
    const base = Math.floor(totalAmount / splitLines.length);
    const remainder = totalAmount - base * splitLines.length;
    setSplitLines(prev =>
      prev.map((l, i) => ({
        ...l,
        amount: String(base + (i < remainder ? 1 : 0)),
      })),
    );
  }, [totalAmount, splitLines.length]);

  const autoFillRemaining = useCallback(() => {
    if (remaining <= 0) return;
    // Find first line with amount = 0 or empty
    setSplitLines(prev => {
      let filled = false;
      return prev.map(l => {
        if (!filled && (!l.amount || l.amount === '0')) {
          filled = true;
          return { ...l, amount: String(remaining) };
        }
        return l;
      });
    });
  }, [remaining]);

  // ── Validation ──────────────────────────────────────────────────────────
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.amount || formData.amount === '0') {
      newErrors.amount = 'Vui lòng nhập số tiền';
    }

    if (!isSplit && !formData.categoryId) {
      newErrors.categoryId = 'Vui lòng chọn danh mục';
    }

    if (!formData.accountId) {
      newErrors.accountId = 'Vui lòng chọn tài khoản';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Vui lòng nhập mô tả';
    }

    // Split-specific validation
    if (isSplit) {
      const sErrors: Record<string, Record<string, string>> = {};
      let hasLineError = false;

      splitLines.forEach(line => {
        const le: Record<string, string> = {};
        if (!line.categoryId) {
          le.categoryId = 'Chọn danh mục';
          hasLineError = true;
        }
        if (!line.amount || parseInt(line.amount, 10) <= 0) {
          le.amount = 'Số tiền > 0';
          hasLineError = true;
        }
        if (Object.keys(le).length) sErrors[line.id] = le;
      });

      if (remaining !== 0) {
        newErrors._split = 'Tổng phân chia phải bằng số tiền giao dịch';
      }
      if (hasLineError) {
        newErrors._splitLines = 'Vui lòng kiểm tra các dòng phân chia';
      }

      setSplitErrors(sErrors);
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ── Submit ──────────────────────────────────────────────────────────────
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const amount = parseInt(formData.amount, 10) || 0;
    const finalAmount = formData.type === 'expense' ? -Math.abs(amount) : Math.abs(amount);

    const selectedAccount = accounts.find(a => a.id === formData.accountId);
    const selectedMerchant = merchants.find(m => m.id === formData.merchantId);

    // Build split items if split is on
    let splitItems: SplitItem[] | undefined;
    let primaryCategoryId = formData.categoryId;
    let primaryCategory = categories.find(c => c.id === formData.categoryId)?.name || '';

    if (isSplit && splitLines.length > 0) {
      splitItems = splitLines.map(l => {
        const cat = categories.find(c => c.id === l.categoryId);
        return {
          id: l.id,
          categoryId: l.categoryId,
          category: cat?.name || '',
          amount: parseInt(l.amount, 10) || 0,
          note: l.note || undefined,
        };
      });
      // Use first split category as primary
      primaryCategoryId = splitLines[0].categoryId;
      primaryCategory = categories.find(c => c.id === primaryCategoryId)?.name || '';
    }

    const txnData = {
      type: formData.type,
      amount: finalAmount,
      category: primaryCategory,
      categoryId: primaryCategoryId,
      account: selectedAccount?.name || '',
      accountId: formData.accountId,
      description: formData.description.trim(),
      date: formData.date,
      merchant: selectedMerchant?.name || '',
      merchantId: formData.merchantId,
      notes: formData.notes,
      tags: formData.tagIds,
      isSplit: isSplit && (splitItems?.length || 0) > 0 ? true : undefined,
      splitItems: isSplit && splitItems?.length ? splitItems : undefined,
      attachments: formAttachments.length ? formAttachments : undefined,
      attachment: formAttachments.length > 0 ? true : undefined,
    };

    if (mode === 'edit' && id) {
      updateTransaction(id, txnData);
      toast.success('Đã cập nhật giao dịch');
    } else {
      addTransaction(txnData);
      toast.success(
        isDuplicateMode
          ? 'Đã tạo giao dịch từ bản nhân bản'
          : isSplit
            ? 'Đã thêm giao dịch phân chia'
            : 'Đã thêm giao dịch mới'
      );
    }
    nav.goBack();
  };

  // ── Duplicate detection ─────────────────────────────────────────────────
  const duplicateWarning = useMemo(() => {
    if (mode === 'edit' || !formData.amount || !formData.categoryId || !formData.date) return null;
    const amt = parseInt(formData.amount, 10) || 0;
    const dup = transactions.find(t =>
      t.id !== id &&
      Math.abs(t.amount) === amt &&
      t.categoryId === formData.categoryId &&
      t.date === formData.date &&
      t.accountId === formData.accountId
    );
    return dup ? `Giao dịch tương tự đã tồn tại: "${dup.description}" (${dup.date})` : null;
  }, [formData.amount, formData.categoryId, formData.date, formData.accountId, transactions, id, mode]);

  const selectedTagObjects = tags.filter(t => formData.tagIds.includes(t.id));

  // Can split?
  const canSplit = formData.type !== 'transfer';

  // Is save disabled?
  const isSaveDisabled = isSplit && (
    totalAmount <= 0 ||
    remaining !== 0 ||
    splitLines.some(l => !l.categoryId || !l.amount || parseInt(l.amount, 10) <= 0)
  );

  // ── Auto Rules ──────────────────────────────────────────────────────────
  const { evaluateRules, getSuggestions } = useAutoRules();

  // Track which fields were auto-set by a rule
  const [autoSetFields, setAutoSetFields] = useState<Set<string>>(new Set());
  const [appliedRuleMatch, setAppliedRuleMatch] = useState<AutoRuleMatch | null>(null);
  const [preAutoValues, setPreAutoValues] = useState<Record<string, any>>({});
  const [ruleBannerVisible, setRuleBannerVisible] = useState(false);
  const ruleBannerTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Rule update suggestion on override
  const [overridePrompt, setOverridePrompt] = useState<{
    field: string; oldLabel: string; newLabel: string; ruleId: string; ruleName: string; actionType: string; newValue: string;
  } | null>(null);

  // History-based suggestions
  const categorySuggestions = useMemo(() => {
    if (mode === 'edit') return [];
    return getSuggestions({ description: formData.description, merchantId: formData.merchantId, type: formData.type })
      .filter(s => s.type === 'category');
  }, [formData.description, formData.merchantId, formData.type, mode, getSuggestions]);

  const tagSuggestions = useMemo(() => {
    if (mode === 'edit') return [];
    return getSuggestions({ description: formData.description, merchantId: formData.merchantId, type: formData.type })
      .filter(s => s.type === 'tag' && !formData.tagIds.includes(s.id));
  }, [formData.description, formData.merchantId, formData.type, formData.tagIds, mode, getSuggestions]);

  // Auto-evaluate rules when description/merchant/amount change (create mode only, debounced)
  const evalTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (mode === 'edit') return;
    if (evalTimer.current) clearTimeout(evalTimer.current);
    evalTimer.current = setTimeout(() => {
      if (!formData.description && !formData.merchantId && !formData.amount) return;
      const match = evaluateRules({
        description: formData.description,
        merchantId: formData.merchantId,
        accountId: formData.accountId,
        amount: formData.amount,
        type: formData.type,
      });
      if (match && (!appliedRuleMatch || match.rule.id !== appliedRuleMatch.rule.id)) {
        // Save pre-auto values for undo
        const preVals: Record<string, any> = {};
        const newAutoFields = new Set<string>();

        if (match.fieldsSet.categoryId && !autoSetFields.has('categoryId')) {
          preVals.categoryId = formData.categoryId;
          newAutoFields.add('categoryId');
        }
        if (match.fieldsSet.merchantId && !autoSetFields.has('merchantId')) {
          preVals.merchantId = formData.merchantId;
          newAutoFields.add('merchantId');
        }
        if (match.fieldsSet.tagIds && match.fieldsSet.tagIds.length > 0) {
          preVals.tagIds = [...formData.tagIds];
          newAutoFields.add('tagIds');
        }

        if (newAutoFields.size > 0) {
          setPreAutoValues(preVals);
          setAutoSetFields(newAutoFields);
          setAppliedRuleMatch(match);

          // Apply the rule's values
          setFormData(prev => {
            const updated = { ...prev };
            if (match.fieldsSet.categoryId) updated.categoryId = match.fieldsSet.categoryId;
            if (match.fieldsSet.merchantId) updated.merchantId = match.fieldsSet.merchantId;
            if (match.fieldsSet.tagIds) {
              const merged = new Set([...prev.tagIds, ...match.fieldsSet.tagIds]);
              updated.tagIds = Array.from(merged);
            }
            return updated;
          });

          // Show banner
          setRuleBannerVisible(true);
          if (ruleBannerTimer.current) clearTimeout(ruleBannerTimer.current);
          ruleBannerTimer.current = setTimeout(() => setRuleBannerVisible(false), 6000);
        }
      }
    }, 500);
    return () => { if (evalTimer.current) clearTimeout(evalTimer.current); };
  }, [formData.description, formData.merchantId, formData.amount]);

  // When user manually changes an auto-set field → remove chip, possibly show override prompt
  const handleManualOverride = useCallback((field: string, newValue: any) => {
    if (autoSetFields.has(field) && appliedRuleMatch) {
      const newFields = new Set(autoSetFields);
      newFields.delete(field);
      setAutoSetFields(newFields);

      // Show update rule suggestion
      const action = appliedRuleMatch.rule.actions.find(a => {
        if (field === 'categoryId') return a.type === 'set_category';
        if (field === 'merchantId') return a.type === 'set_merchant';
        if (field === 'tagIds') return a.type === 'add_tag';
        return false;
      });
      if (action && field === 'categoryId') {
        const oldCat = categories.find(c => c.id === action.value);
        const newCat = categories.find(c => c.id === newValue);
        if (oldCat && newCat && oldCat.id !== newCat.id) {
          setOverridePrompt({
            field,
            oldLabel: oldCat.name,
            newLabel: newCat.name,
            ruleId: appliedRuleMatch.rule.id,
            ruleName: appliedRuleMatch.rule.name,
            actionType: 'set_category',
            newValue,
          });
        }
      }

      if (newFields.size === 0) {
        setAppliedRuleMatch(null);
        setRuleBannerVisible(false);
      }
    }
    handleChange(field, newValue);
  }, [autoSetFields, appliedRuleMatch, categories, handleChange]);

  // Undo auto-applied rule
  const undoAutoRule = useCallback(() => {
    setFormData(prev => ({
      ...prev,
      ...(preAutoValues.categoryId !== undefined ? { categoryId: preAutoValues.categoryId } : {}),
      ...(preAutoValues.merchantId !== undefined ? { merchantId: preAutoValues.merchantId } : {}),
      ...(preAutoValues.tagIds !== undefined ? { tagIds: preAutoValues.tagIds } : {}),
    }));
    setAutoSetFields(new Set());
    setAppliedRuleMatch(null);
    setRuleBannerVisible(false);
    setPreAutoValues({});
  }, [preAutoValues]);

  // Discard auto-set on a single field
  const discardAutoField = useCallback((field: string) => {
    const newFields = new Set(autoSetFields);
    newFields.delete(field);
    setAutoSetFields(newFields);
    if (preAutoValues[field] !== undefined) {
      handleChange(field, preAutoValues[field]);
    }
    if (newFields.size === 0) {
      setAppliedRuleMatch(null);
      setRuleBannerVisible(false);
    }
  }, [autoSetFields, preAutoValues, handleChange]);

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="max-w-3xl mx-auto p-4 md:p-6 pb-20 md:pb-6">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => nav.goBack()}
            className="flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] mb-4 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
            <span className="font-medium">Quay lại</span>
          </button>
          <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
            {mode === 'edit' ? 'Chỉnh sửa giao dịch' : 'Thêm giao dịch'}
          </h1>
          {mode === 'create' && (
            <button
              type="button"
              onClick={() => setShowChatParser(true)}
              className="mt-2 inline-flex items-center gap-1.5 text-sm text-[var(--primary)] hover:underline font-medium"
            >
              <Sparkles className="w-4 h-4" />
              Nhập nhanh (chat)
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Duplicate Mode Banner */}
          {isDuplicateMode && duplicateBannerVisible && (
            <div className="flex items-start gap-3 p-4 rounded-[var(--radius-lg)] bg-[var(--info-light)] border border-[var(--info)]">
              <Copy className="w-5 h-5 text-[var(--info)] flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-[var(--text-primary)]">
                  Đang nhân bản giao dịch. Kiểm tra lại số tiền và ngày.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    // Clear prefill
                    setFormData({
                      type: 'expense',
                      amount: '',
                      categoryId: '',
                      accountId: '',
                      description: '',
                      date: new Date().toISOString().split('T')[0],
                      merchantId: '',
                      notes: '',
                      tagIds: [],
                    });
                    setIsSplit(false);
                    setSplitLines([newSplitLine(), newSplitLine()]);
                    setDuplicateBannerVisible(false);
                    setKeepOriginalDate(false);
                    toast.info('Đã xoá thông tin nhân bản');
                  }}
                  className="mt-1 text-xs font-medium text-[var(--info)] hover:underline"
                >
                  Xoá prefill
                </button>
              </div>
              <button type="button" onClick={() => setDuplicateBannerVisible(false)} className="p-0.5 flex-shrink-0">
                <XIcon className="w-4 h-4 text-[var(--text-tertiary)]" />
              </button>
            </div>
          )}

          {/* Transaction Type */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
              Loại giao dịch
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: 'expense', label: 'Chi tiêu', color: 'var(--danger)' },
                { value: 'income', label: 'Thu nhập', color: 'var(--success)' },
                { value: 'transfer', label: 'Chuyển khoản', color: 'var(--info)' },
              ].map(option => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleChange('type', option.value)}
                  className={`py-2.5 rounded-[var(--radius-lg)] text-sm font-medium border-2 transition-all ${
                    formData.type === option.value
                      ? 'border-current bg-opacity-10'
                      : 'border-[var(--border)] text-[var(--text-secondary)]'
                  }`}
                  style={formData.type === option.value ? { color: option.color, borderColor: option.color, backgroundColor: option.color + '15' } : {}}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Amount */}
          <div>
            <AmountInput
              value={formData.amount}
              onChange={(raw) => handleChange('amount', raw)}
              error={errors.amount}
            />
          </div>

          {/* Duplicate Warning */}
          {duplicateWarning && (
            <div className="flex items-start gap-2 p-3 rounded-[var(--radius-lg)] bg-[var(--warning-light)] border border-[var(--warning)]">
              <AlertTriangle className="w-5 h-5 text-[var(--warning)] flex-shrink-0 mt-0.5" />
              <p className="text-sm text-[var(--text-primary)]">{duplicateWarning}</p>
            </div>
          )}

          {/* Account */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2" htmlFor="accountId">
              Tài khoản <span className="text-[var(--danger)]">*</span>
            </label>
            <select
              id="accountId"
              value={formData.accountId}
              onChange={(e) => handleChange('accountId', e.target.value)}
              className={`w-full px-4 py-3 bg-[var(--input-background)] border rounded-[var(--radius-lg)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)] ${
                errors.accountId ? 'border-[var(--danger)]' : 'border-[var(--border)]'
              }`}
            >
              <option value="">Chọn tài khoản</option>
              {accounts.filter(acc => !acc.archived).map(acc => {
                const masked = acc.accountNumber ? ` | ${maskAccountNumber(acc.accountNumber, acc.type)}` : '';
                return (
                  <option key={acc.id} value={acc.id}>
                    {acc.name}{masked} - {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(acc.balance)}
                  </option>
                );
              })}
            </select>
            {errors.accountId && (
              <p className="mt-1 text-sm text-[var(--danger)]">{errors.accountId}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2" htmlFor="description">
              Mô tả <span className="text-[var(--danger)]">*</span>
            </label>
            <input
              id="description"
              type="text"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="VD: Ăn trưa, Lương tháng 3..."
              className={`w-full px-4 py-3 bg-[var(--input-background)] border rounded-[var(--radius-lg)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)] ${
                errors.description ? 'border-[var(--danger)]' : 'border-[var(--border)]'
              }`}
            />
            {errors.description && (
              <p className="mt-1 text-sm text-[var(--danger)]">{errors.description}</p>
            )}
          </div>

          {/* ── Auto-Set Banner ─────────────────────────────────────── */}
          {ruleBannerVisible && appliedRuleMatch && (
            <div className="flex items-center gap-2 p-3 rounded-[var(--radius-lg)] bg-[var(--info-light)] border border-[var(--info)] animate-in fade-in duration-300">
              <Zap className="w-4 h-4 text-[var(--info)] flex-shrink-0" />
              <p className="text-xs text-[var(--text-secondary)] flex-1">
                Đã áp dụng rule: "<span className="font-semibold">{appliedRuleMatch.rule.name}</span>"
                {appliedRuleMatch.fieldsSet.categoryId && (() => {
                  const cat = categories.find(c => c.id === appliedRuleMatch.fieldsSet.categoryId);
                  return cat ? ` → ${cat.name}` : '';
                })()}
              </p>
              <button type="button" onClick={undoAutoRule}
                className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-[var(--info)] hover:bg-[var(--info)]  hover:bg-opacity-20 rounded-[var(--radius-sm)] transition-colors">
                <Undo2 className="w-3 h-3" /> Hoàn tác
              </button>
              <button type="button" onClick={() => setRuleBannerVisible(false)} className="p-0.5">
                <XIcon className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
              </button>
            </div>
          )}

          {/* ── Category / Split Section ────────────────────────────────── */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <label className="block text-sm font-medium text-[var(--text-primary)]" htmlFor="categoryId">
                  Danh mục <span className="text-[var(--danger)]">*</span>
                </label>
                {autoSetFields.has('categoryId') && (
                  <AutoChip onDiscard={() => discardAutoField('categoryId')} />
                )}
              </div>
              {canSplit && (
                <button
                  type="button"
                  onClick={() => {
                    setIsSplit(!isSplit);
                    if (!isSplit) {
                      // Turn on: init 2 lines
                      setSplitLines(prev => prev.length >= 2 ? prev : [newSplitLine(), newSplitLine()]);
                    }
                  }}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all border ${
                    isSplit
                      ? 'bg-[var(--primary)] text-white border-[var(--primary)]'
                      : 'bg-[var(--surface)] text-[var(--text-secondary)] border-[var(--border)] hover:border-[var(--primary)] hover:text-[var(--primary)]'
                  }`}
                >
                  <SplitSquareHorizontal className="w-3.5 h-3.5" />
                  Phân chia
                </button>
              )}
            </div>

            {isSplit && (
              <p className="text-xs text-[var(--text-tertiary)] mb-3">
                Tổng các dòng phân chia phải bằng số tiền giao dịch.
              </p>
            )}

            {/* Standard category dropdown (hidden when split on) */}
            {!isSplit && (
              <>
                <select
                  id="categoryId"
                  value={formData.categoryId}
                  onChange={(e) => handleChange('categoryId', e.target.value)}
                  className={`w-full px-4 py-3 bg-[var(--input-background)] border rounded-[var(--radius-lg)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)] ${
                    errors.categoryId ? 'border-[var(--danger)]' : 'border-[var(--border)]'
                  }`}
                >
                  <option value="">Chọn danh mục</option>
                  {filteredCategories.map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.icon} {cat.name}
                    </option>
                  ))}
                </select>
                {errors.categoryId && (
                  <p className="mt-1 text-sm text-[var(--danger)]">{errors.categoryId}</p>
                )}

                {/* Category suggestions */}
                {!isSplit && categorySuggestions.length > 0 && !formData.categoryId && (
                  <div className="mt-2">
                    <p className="text-xs text-[var(--text-tertiary)] mb-1.5 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> Gợi ý
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {categorySuggestions.map(s => (
                        <button key={s.id} type="button"
                          onClick={() => handleChange('categoryId', s.id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors hover:border-[var(--primary)] hover:text-[var(--primary)]"
                          style={{ borderColor: s.color + '60', color: s.color, backgroundColor: s.color + '10' }}>
                          {s.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* ─── Split Editor ────────────────────────────────────────── */}
            {isSplit && (
              <div className="space-y-3">
                {/* Smart helpers */}
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={distributeEvenly}
                    disabled={totalAmount <= 0}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-lg)] text-xs font-medium bg-[var(--surface)] border border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--primary)] hover:text-[var(--primary)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Shuffle className="w-3.5 h-3.5" />
                    Chia đều
                  </button>
                  <button
                    type="button"
                    onClick={autoFillRemaining}
                    disabled={remaining <= 0}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-lg)] text-xs font-medium bg-[var(--surface)] border border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--primary)] hover:text-[var(--primary)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ArrowDownToLine className="w-3.5 h-3.5" />
                    Tự điền phần còn lại
                  </button>
                </div>

                {/* Line items */}
                {splitLines.map((line, idx) => {
                  const lineErrors = splitErrors[line.id] || {};
                  return (
                    <div
                      key={line.id}
                      className="relative p-4 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card)]"
                    >
                      {/* Index badge + delete */}
                      <div className="flex items-center justify-between mb-3">
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[var(--surface)] text-xs font-medium text-[var(--text-secondary)]">
                          #{idx + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeSplitLine(line.id)}
                          disabled={splitLines.length <= 1}
                          className="p-1 rounded-[var(--radius-sm)] text-[var(--text-tertiary)] hover:text-[var(--danger)] hover:bg-[var(--danger-light)] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {/* Category */}
                        <div>
                          <select
                            value={line.categoryId}
                            onChange={(e) => updateSplitLine(line.id, 'categoryId', e.target.value)}
                            className={`w-full px-3 py-2 text-sm bg-[var(--input-background)] border rounded-[var(--radius-md)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)] ${
                              lineErrors.categoryId ? 'border-[var(--danger)]' : 'border-[var(--border)]'
                            }`}
                          >
                            <option value="">Chọn danh mục</option>
                            {filteredCategories.map(cat => (
                              <option key={cat.id} value={cat.id}>
                                {cat.icon} {cat.name}
                              </option>
                            ))}
                          </select>
                          {lineErrors.categoryId && (
                            <p className="mt-0.5 text-xs text-[var(--danger)]">{lineErrors.categoryId}</p>
                          )}
                        </div>

                        {/* Amount */}
                        <div>
                          <AmountInput
                            value={line.amount}
                            onChange={(raw) => updateSplitLine(line.id, 'amount', raw)}
                            error={lineErrors.amount}
                            compact
                          />
                        </div>
                      </div>

                      {/* Note */}
                      <input
                        type="text"
                        placeholder="Ghi chú dòng (tuỳ chọn)"
                        value={line.note}
                        onChange={(e) => updateSplitLine(line.id, 'note', e.target.value)}
                        className="w-full mt-3 px-3 py-2 text-sm bg-[var(--input-background)] border border-[var(--border)] rounded-[var(--radius-md)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]"
                      />
                    </div>
                  );
                })}

                {/* Add line */}
                <button
                  type="button"
                  onClick={addSplitLine}
                  className="w-full py-2.5 border-2 border-dashed border-[var(--border)] rounded-[var(--radius-lg)] text-sm font-medium text-[var(--text-secondary)] hover:border-[var(--primary)] hover:text-[var(--primary)] transition-colors flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  Thêm dòng
                </button>

                {/* ── Remaining status bar ──────────────────────────────── */}
                <SplitStatusBar
                  total={totalAmount}
                  allocated={allocated}
                  remaining={remaining}
                  currencySymbol={currencySymbol}
                />

                {errors._split && (
                  <p className="text-sm text-[var(--danger)]">{errors._split}</p>
                )}
              </div>
            )}
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2" htmlFor="date">
              Ngày
            </label>
            <div className="relative">
              <input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => handleChange('date', e.target.value)}
                className="w-full px-4 py-3 bg-[var(--input-background)] border border-[var(--border)] rounded-[var(--radius-lg)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]"
              />
            </div>
            {/* Keep original date toggle (duplicate mode only) */}
            {isDuplicateMode && sourceTransaction && (
              <label className="flex items-center gap-3 mt-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={keepOriginalDate}
                  onChange={(e) => {
                    setKeepOriginalDate(e.target.checked);
                    handleChange('date', e.target.checked
                      ? sourceTransaction.date
                      : new Date().toISOString().split('T')[0]
                    );
                  }}
                  className="w-4 h-4 rounded border-[var(--border)] text-[var(--primary)] focus:ring-[var(--focus-ring)]"
                />
                <span className="text-sm text-[var(--text-secondary)]">
                  Giữ ngày cũ ({sourceTransaction.date})
                </span>
              </label>
            )}
          </div>

          {/* Merchant */}
          {merchants.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-2" htmlFor="merchantId">
                Đơn vị
              </label>
              <select
                id="merchantId"
                value={formData.merchantId}
                onChange={(e) => handleChange('merchantId', e.target.value)}
                className="w-full px-4 py-3 bg-[var(--input-background)] border border-[var(--border)] rounded-[var(--radius-lg)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]"
              >
                <option value="">Không chọn</option>
                {merchants.map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Tags */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <label className="block text-sm font-medium text-[var(--text-primary)]">
                Nhãn
              </label>
              {autoSetFields.has('tagIds') && (
                <AutoChip onDiscard={() => discardAutoField('tagIds')} />
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {selectedTagObjects.map(tag => (
                <TagChip
                  key={tag.id}
                  name={tag.name}
                  color={tag.color}
                  onRemove={() => {
                    handleChange('tagIds', formData.tagIds.filter(tid => tid !== tag.id));
                  }}
                />
              ))}
              <button
                type="button"
                onClick={() => setShowTagPicker(true)}
                className="inline-flex items-center gap-1 px-3 py-1.5 border border-dashed border-[var(--border)] rounded-full text-sm text-[var(--text-secondary)] hover:border-[var(--primary)] hover:text-[var(--primary)] transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Thêm nhãn
              </button>
            </div>
            {/* Tag suggestions */}
            {tagSuggestions.length > 0 && (
              <div className="mt-2">
                <p className="text-xs text-[var(--text-tertiary)] mb-1.5 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Gợi ý
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {tagSuggestions.map(s => (
                    <button key={s.id} type="button"
                      onClick={() => handleChange('tagIds', [...formData.tagIds, s.id])}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors hover:border-[var(--primary)] hover:text-[var(--primary)]"
                      style={{ borderColor: s.color + '60', color: s.color, backgroundColor: s.color + '10' }}>
                      {s.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2" htmlFor="notes">
              Ghi chú
            </label>
            <textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              placeholder="Thêm ghi chú..."
              rows={3}
              className="w-full px-4 py-3 bg-[var(--input-background)] border border-[var(--border)] rounded-[var(--radius-lg)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)] resize-none"
            />
          </div>

          {/* Attachments */}
          <CloudAttachmentSection
            attachments={formAttachments}
            onChange={setFormAttachments}
          />

          {/* Actions */}
          <div className="flex flex-col-reverse md:flex-row gap-3 pt-2">
            <button
              type="button"
              onClick={() => nav.goBack()}
              className="flex-1 md:flex-none px-6 py-2.5 border border-[var(--border)] text-[var(--text-primary)] rounded-[var(--radius-lg)] font-medium hover:bg-[var(--surface)] transition-colors"
            >
              Huỷ
            </button>
            <button
              type="submit"
              disabled={!!isSaveDisabled}
              className="flex-1 md:flex-none px-6 py-2.5 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white rounded-[var(--radius-lg)] font-medium transition-colors shadow-[var(--shadow-sm)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {mode === 'edit' ? 'Lưu thay đổi' : 'Thêm giao dịch'}
            </button>
          </div>
        </form>
      </div>

      {/* Tag Picker Modal */}
      <TagPickerModal
        isOpen={showTagPicker}
        onClose={() => setShowTagPicker(false)}
        selectedTagIds={formData.tagIds}
        onApply={(tagIds) => {
          handleChange('tagIds', tagIds);
          setShowTagPicker(false);
        }}
      />

      {/* Override Rule Suggestion Modal */}
      {overridePrompt && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50" onClick={() => setOverridePrompt(null)}>
          <div className="bg-[var(--card)] w-full max-w-md rounded-t-[var(--radius-xl)] sm:rounded-[var(--radius-xl)] p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">Cập nhật rule?</h3>
            <p className="text-sm text-[var(--text-secondary)] mb-6">
              Bạn vừa đổi từ "<span className="font-semibold">{overridePrompt.oldLabel}</span>" → "<span className="font-semibold">{overridePrompt.newLabel}</span>". Bạn có muốn cập nhật quy tắc này cho lần sau không?
            </p>
            <div className="flex gap-3">
              <button onClick={() => setOverridePrompt(null)}
                className="flex-1 px-4 py-2.5 border border-[var(--border)] text-[var(--text-secondary)] rounded-[var(--radius-lg)] font-medium hover:bg-[var(--surface)] transition-colors">
                Không
              </button>
              <button onClick={() => {
                // Update the rule action
                if (overridePrompt) {
                  updateAutoRule(overridePrompt.ruleId, {
                    actions: autoRules.find(r => r.id === overridePrompt.ruleId)?.actions.map(a =>
                      a.type === overridePrompt.actionType ? { ...a, value: overridePrompt.newValue } : a
                    ) || [],
                  });
                  toast.success(`Đã cập nhật rule "${overridePrompt.ruleName}"`);
                }
                setOverridePrompt(null);
              }}
                className="flex-1 px-4 py-2.5 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white rounded-[var(--radius-lg)] font-medium transition-colors">
                Cập nhật rule
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Chat Transaction Parser */}
      <ChatTransactionParser isOpen={showChatParser} onClose={() => setShowChatParser(false)} />
    </div>
  );
}

// ─── Split Status Bar ─────────────────────────────────────────────────────────
function SplitStatusBar({
  total,
  allocated,
  remaining,
  currencySymbol,
}: {
  total: number;
  allocated: number;
  remaining: number;
  currencySymbol: string;
}) {
  const fmt = (n: number) =>
    new Intl.NumberFormat('vi-VN').format(Math.abs(n));

  let statusColor: string;
  let statusBg: string;
  let statusBorder: string;
  let statusIcon: string;
  let statusText: string;

  if (remaining === 0 && total > 0) {
    statusColor = 'text-[var(--success)]';
    statusBg = 'bg-[var(--success-light)]';
    statusBorder = 'border-[var(--success)]';
    statusIcon = '✅';
    statusText = 'Đã phân chia đủ';
  } else if (remaining > 0) {
    statusColor = 'text-[var(--warning)]';
    statusBg = 'bg-[var(--warning-light)]';
    statusBorder = 'border-[var(--warning)]';
    statusIcon = '⚠️';
    statusText = `Còn thiếu ${fmt(remaining)} ${currencySymbol}`;
  } else {
    statusColor = 'text-[var(--danger)]';
    statusBg = 'bg-[var(--danger-light)]';
    statusBorder = 'border-[var(--danger)]';
    statusIcon = '❌';
    statusText = `Vượt quá ${fmt(remaining)} ${currencySymbol}`;
  }

  // Progress bar width (capped at 100%)
  const pct = total > 0 ? Math.min((allocated / total) * 100, 100) : 0;

  return (
    <div className={`rounded-[var(--radius-lg)] border ${statusBorder} ${statusBg} p-3 space-y-2`}>
      {/* Progress bar */}
      <div className="h-1.5 w-full rounded-full bg-[var(--border)] overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{
            width: `${pct}%`,
            backgroundColor: remaining === 0 && total > 0
              ? 'var(--success)'
              : remaining < 0
                ? 'var(--danger)'
                : 'var(--warning)',
          }}
        />
      </div>

      <div className="flex items-center justify-between text-xs">
        <div className="space-y-0.5">
          <div className="text-[var(--text-secondary)]">
            Tổng: <span className="font-medium text-[var(--text-primary)]">{fmt(total)} {currencySymbol}</span>
          </div>
          <div className="text-[var(--text-secondary)]">
            Đã phân chia: <span className="font-medium text-[var(--text-primary)]">{fmt(allocated)} {currencySymbol}</span>
          </div>
        </div>
        <div className={`font-medium ${statusColor} text-right`}>
          {statusIcon} {statusText}
        </div>
      </div>
    </div>
  );
}

// ─── Auto Chip ──────────────────────────────────────────────────────────────
function AutoChip({ onDiscard }: { onDiscard: () => void }) {
  return (
    <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-[var(--info)] text-white hover:bg-[var(--info-hover)] transition-colors cursor-pointer">
      <Sparkles className="w-3.5 h-3.5" />
      Tự động
      <button
        type="button"
        onClick={onDiscard}
        className="p-0.5"
      >
        <XIcon className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
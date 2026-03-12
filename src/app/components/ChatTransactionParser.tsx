import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  Check,
  ChevronRight,
  HelpCircle,
  Sparkles,
  X,
} from "lucide-react";
import { useToast } from "../contexts/ToastContext";

export interface QuickParserAccount {
  id: string;
  name: string;
  status?: string | null;
  providerName?: string | null;
  accountType?: string | null;
  currencyCode?: string | null;
}

export interface QuickParserCategory {
  id: string;
  name: string;
  categoryType: string;
  archivedAt?: string | null;
}

export interface QuickParserMerchant {
  id: string;
  name: string;
  defaultCategoryId?: string | null;
  isHidden?: boolean;
}

export interface QuickTransactionDraft {
  type: "income" | "expense";
  amount: string;
  accountId: string;
  categoryId: string;
  description: string;
  merchantId?: string;
  merchantName?: string;
}

interface ChatTransactionParserProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: QuickParserAccount[];
  categories: QuickParserCategory[];
  merchants: QuickParserMerchant[];
  onApply: (draft: QuickTransactionDraft) => void;
}

const ACCOUNT_ALIASES: Record<string, string[]> = {
  momo: ["momo"],
  vcb: ["vietcombank", "vcb"],
  vietcombank: ["vietcombank", "vcb"],
  tcb: ["techcombank", "tcb"],
  techcombank: ["techcombank", "tcb"],
  mb: ["mbbank", "mb bank", "mb"],
  cash: ["tiền mặt", "cash"],
  "tiền mặt": ["tiền mặt", "cash"],
  tienmat: ["tiền mặt", "cash"],
  visa: ["visa", "thẻ tín dụng", "credit"],
};

const INCOME_KEYWORDS = [
  "lương",
  "thu",
  "nhận",
  "thưởng",
  "bonus",
  "salary",
  "income",
  "hoàn tiền",
  "refund",
];

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function parseAmount(
  text: string,
): { amount: number; remaining: string } | null {
  const patterns = [
    {
      regex: /(\+?)(\d+[.,]\d+)\s*(?:tr|trieu|triệu)/i,
      multiplier: 1_000_000,
      dotThousands: false,
    },
    {
      regex: /(\+?)(\d+)\s*(?:tr|trieu|triệu|m(?!o))/i,
      multiplier: 1_000_000,
      dotThousands: false,
    },
    {
      regex: /(\+?)(\d+[.,]?\d*)\s*(?:k|ng|nghin|nghìn|ngan|ngàn)/i,
      multiplier: 1_000,
      dotThousands: false,
    },
    {
      regex: /(\+?)(\d{1,3}(?:\.\d{3})+)(?!\w)/i,
      multiplier: 1,
      dotThousands: true,
    },
    { regex: /(\+?)(\d{4,})(?!\w)/i, multiplier: 1, dotThousands: false },
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern.regex);
    if (!match) continue;

    let numStr = match[2];
    if (pattern.dotThousands) {
      numStr = numStr.replace(/\./g, "");
    } else {
      numStr = numStr.replace(",", ".");
    }

    const num = parseFloat(numStr) * pattern.multiplier;
    if (!Number.isNaN(num) && num > 0) {
      const remaining = text.replace(match[0], "").replace(/\s+/g, " ").trim();
      return { amount: Math.round(num), remaining };
    }
  }

  return null;
}

function detectType(text: string) {
  const lower = normalizeText(text);
  for (const kw of INCOME_KEYWORDS) {
    if (lower.includes(normalizeText(kw))) return "income" as const;
  }
  return "expense" as const;
}

function findAccount(text: string, accounts: QuickParserAccount[]) {
  const normalized = normalizeText(text);
  const tokens = normalized.split(" ").filter(Boolean);
  let exact: QuickParserAccount | null = null;
  let matches: QuickParserAccount[] = [];
  let matchedToken = "";

  for (const token of tokens) {
    const alias = ACCOUNT_ALIASES[token];
    if (alias?.length) {
      const found = accounts.filter((account) =>
        alias.some((candidate) =>
          normalizeText(account.name).includes(normalizeText(candidate)),
        ),
      );
      if (found.length === 1) {
        exact = found[0];
        matchedToken = token;
        break;
      }
      if (found.length > matches.length) {
        matches = found;
        matchedToken = token;
      }
    }

    const direct = accounts.filter((account) =>
      normalizeText(account.name).includes(token),
    );
    if (direct.length === 1) {
      exact = direct[0];
      matchedToken = token;
      break;
    }
    if (direct.length > matches.length) {
      matches = direct;
      matchedToken = token;
    }
  }

  const remaining = matchedToken
    ? text
        .replace(new RegExp(matchedToken, "i"), "")
        .replace(/\s+/g, " ")
        .trim()
    : text;

  return { exact, matches, remaining };
}

function findMerchant(text: string, merchants: QuickParserMerchant[]) {
  const normalized = normalizeText(text);

  const exact = merchants.find(
    (merchant) => normalizeText(merchant.name) === normalized,
  );
  if (exact) {
    return {
      merchant: exact,
      remaining: "",
    };
  }

  let best: QuickParserMerchant | null = null;
  for (const merchant of merchants) {
    const merchantName = normalizeText(merchant.name);
    if (normalized.includes(merchantName)) {
      if (!best || merchantName.length > normalizeText(best.name).length) {
        best = merchant;
      }
    }
  }

  if (best) {
    return {
      merchant: best,
      remaining: text
        .replace(new RegExp(best.name, "i"), "")
        .replace(/\s+/g, " ")
        .trim(),
    };
  }

  return {
    merchant: null,
    remaining: text,
  };
}

function findCategory(
  text: string,
  categories: QuickParserCategory[],
  type: "income" | "expense",
) {
  const eligible = categories.filter((category) => {
    if (category.archivedAt) return false;
    return category.categoryType === type || category.categoryType === "both";
  });

  const normalized = normalizeText(text);
  const exact = eligible.find(
    (category) => normalizeText(category.name) === normalized,
  );
  if (exact) return exact;

  let best: QuickParserCategory | null = null;
  for (const category of eligible) {
    const categoryName = normalizeText(category.name);
    if (normalized.includes(categoryName)) {
      if (!best || categoryName.length > normalizeText(best.name).length) {
        best = category;
      }
    }
  }

  return best;
}

type ParseResult = {
  amount: number;
  type: "income" | "expense";
  accountId: string;
  accountMatches: QuickParserAccount[];
  categoryId: string;
  merchantId: string;
  description: string;
  customMerchantName: string;
  confidence: string[];
  errors: string[];
};

function parseTransactionText(
  rawText: string,
  accounts: QuickParserAccount[],
  categories: QuickParserCategory[],
  merchants: QuickParserMerchant[],
): ParseResult {
  let text = rawText.trim();
  const result: ParseResult = {
    amount: 0,
    type: "expense",
    accountId: "",
    accountMatches: [],
    categoryId: "",
    merchantId: "",
    description: "",
    customMerchantName: "",
    confidence: [],
    errors: [],
  };

  const amountResult = parseAmount(text);
  if (amountResult) {
    result.amount = amountResult.amount;
    result.confidence.push(
      `Số tiền = ${new Intl.NumberFormat("vi-VN").format(amountResult.amount)}đ`,
    );
    text = amountResult.remaining;
  } else {
    result.errors.push("Không tìm thấy số tiền.");
  }

  result.type = detectType(rawText);
  result.confidence.push(
    `Loại = ${result.type === "income" ? "Thu nhập" : "Chi tiêu"}`,
  );

  const activeAccounts = accounts.filter(
    (account) => account.status !== "archived",
  );
  const accountResult = findAccount(text, activeAccounts);
  if (accountResult.exact) {
    result.accountId = accountResult.exact.id;
    result.confidence.push(`Tài khoản = ${accountResult.exact.name}`);
    text = accountResult.remaining;
  } else if (accountResult.matches.length > 1) {
    result.accountMatches = accountResult.matches;
    result.errors.push("Có nhiều tài khoản khớp, vui lòng chọn.");
    text = accountResult.remaining;
  } else {
    result.errors.push("Chưa nhận diện được tài khoản.");
  }

  const merchantResult = findMerchant(
    text,
    merchants.filter((item) => !item.isHidden),
  );
  if (merchantResult.merchant) {
    result.merchantId = merchantResult.merchant.id;
    result.confidence.push(`Merchant = ${merchantResult.merchant.name}`);
    text = merchantResult.remaining;
  }

  const categoryFromText = findCategory(text, categories, result.type);
  if (categoryFromText) {
    result.categoryId = categoryFromText.id;
    result.confidence.push(`Danh mục = ${categoryFromText.name}`);
    text = text
      .replace(new RegExp(categoryFromText.name, "i"), "")
      .replace(/\s+/g, " ")
      .trim();
  } else if (merchantResult.merchant?.defaultCategoryId) {
    result.categoryId = merchantResult.merchant.defaultCategoryId;
  }

  result.description = text.replace(/\s+/g, " ").trim();
  if (!result.description) {
    result.description = result.type === "income" ? "Khoản thu" : "Khoản chi";
  }

  if (!result.merchantId) {
    const tokens = text.split(" ").filter((item) => item.length >= 2);
    if (tokens.length >= 2) {
      result.customMerchantName = tokens.slice(0, 3).join(" ");
    }
  }

  return result;
}

export function ChatTransactionParser({
  isOpen,
  onClose,
  accounts,
  categories,
  merchants,
  onApply,
}: ChatTransactionParserProps) {
  const toast = useToast();
  const inputRef = useRef<HTMLInputElement>(null);

  const [inputText, setInputText] = useState("");
  const [parsed, setParsed] = useState<ParseResult | null>(null);
  const [showHelp, setShowHelp] = useState(false);

  const [editType, setEditType] = useState<"income" | "expense">("expense");
  const [editAmount, setEditAmount] = useState("");
  const [editAccountId, setEditAccountId] = useState("");
  const [editCategoryId, setEditCategoryId] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editMerchantId, setEditMerchantId] = useState("");
  const [editMerchantName, setEditMerchantName] = useState("");

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setInputText("");
      setParsed(null);
      setShowHelp(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!parsed) return;
    setEditType(parsed.type);
    setEditAmount(String(parsed.amount || ""));
    setEditAccountId(parsed.accountId || parsed.accountMatches[0]?.id || "");
    setEditCategoryId(parsed.categoryId || "");
    setEditDescription(parsed.description || "");
    setEditMerchantId(parsed.merchantId || "");
    setEditMerchantName(parsed.customMerchantName || "");
  }, [parsed]);

  const filteredCategories = useMemo(() => {
    return categories.filter((category) => {
      if (category.archivedAt) return false;
      return (
        category.categoryType === editType || category.categoryType === "both"
      );
    });
  }, [categories, editType]);

  const visibleMerchants = useMemo(() => {
    return merchants.filter((merchant) => !merchant.isHidden);
  }, [merchants]);

  const handleParse = () => {
    const trimmed = inputText.trim();
    if (!trimmed) return;

    const result = parseTransactionText(
      trimmed,
      accounts,
      categories,
      merchants,
    );
    setParsed(result);

    if (result.errors.length > 0 && result.amount === 0) {
      toast.warning('Chưa hiểu rõ nội dung, thử ví dụ: "cafe 45k momo"');
    }
  };

  const handleApply = () => {
    const amount = Number(editAmount || 0);
    if (amount <= 0) {
      toast.error("Vui lòng nhập số tiền hợp lệ");
      return;
    }

    if (!editAccountId) {
      toast.error("Vui lòng chọn tài khoản");
      return;
    }

    if (!editDescription.trim()) {
      toast.error("Vui lòng nhập mô tả");
      return;
    }

    onApply({
      type: editType,
      amount: String(amount),
      accountId: editAccountId,
      categoryId: editCategoryId,
      description: editDescription.trim(),
      ...(editMerchantId
        ? { merchantId: editMerchantId }
        : editMerchantName.trim()
          ? { merchantName: editMerchantName.trim() }
          : {}),
    });

    toast.success("Đã áp dụng dữ liệu vào form");
    onClose();
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter") {
      event.preventDefault();
      handleParse();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-[var(--card)] w-full max-w-2xl rounded-t-[var(--radius-xl)] sm:rounded-[var(--radius-xl)] max-h-[90vh] overflow-y-auto"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-[var(--divider)]">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[var(--primary)]" />
            <h3 className="text-lg font-semibold text-[var(--text-primary)]">
              Nhập nhanh (chat)
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowHelp((prev) => !prev)}
              className="p-1.5 rounded-[var(--radius-md)] hover:bg-[var(--surface)] transition-colors"
            >
              <HelpCircle className="w-5 h-5 text-[var(--text-tertiary)]" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-[var(--radius-md)] hover:bg-[var(--surface)] transition-colors"
            >
              <X className="w-5 h-5 text-[var(--text-secondary)]" />
            </button>
          </div>
        </div>

        <div className="p-4 space-y-4">
          {showHelp && (
            <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-4 text-sm text-[var(--text-secondary)]">
              <p className="font-medium text-[var(--text-primary)] mb-2">
                Ví dụ nhập nhanh:
              </p>
              <div className="space-y-1">
                <p>• cafe 45k momo</p>
                <p>• lương 15tr vcb</p>
                <p>• ăn tối 120k tiền mặt</p>
                <p>• mua sách 250k techcombank</p>
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={(event) => setInputText(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder='Ví dụ: "cafe 45k momo"'
              className="flex-1 px-4 py-3 bg-[var(--input-background)] border border-[var(--border)] rounded-[var(--radius-lg)]"
            />
            <button
              type="button"
              onClick={handleParse}
              className="px-4 py-3 rounded-[var(--radius-lg)] bg-[var(--primary)] text-white font-medium hover:opacity-90"
            >
              Phân tích
            </button>
          </div>

          {!!parsed && (
            <div className="space-y-4">
              {parsed.confidence.length > 0 && (
                <div className="rounded-[var(--radius-lg)] bg-[var(--success-light)] border border-[var(--success)]/20 p-4">
                  <div className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-[var(--success)] mt-0.5" />
                    <div className="space-y-1">
                      {parsed.confidence.map((item) => (
                        <p
                          key={item}
                          className="text-sm text-[var(--text-secondary)]"
                        >
                          {item}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {parsed.errors.length > 0 && (
                <div className="rounded-[var(--radius-lg)] bg-[var(--warning-light)] border border-[var(--warning)]/20 p-4">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-[var(--warning)] mt-0.5" />
                    <div className="space-y-1">
                      {parsed.errors.map((item) => (
                        <p
                          key={item}
                          className="text-sm text-[var(--text-secondary)]"
                        >
                          {item}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div className="rounded-[var(--radius-lg)] border border-[var(--border)] p-4 space-y-4">
                <div className="flex items-center gap-2">
                  <ChevronRight className="w-4 h-4 text-[var(--text-tertiary)]" />
                  <h4 className="font-medium text-[var(--text-primary)]">
                    Chỉnh lại trước khi áp dụng
                  </h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                      Loại
                    </label>
                    <select
                      value={editType}
                      onChange={(event) =>
                        setEditType(event.target.value as "income" | "expense")
                      }
                      className="w-full px-4 py-2.5 bg-[var(--input-background)] border border-[var(--border)] rounded-[var(--radius-lg)]"
                    >
                      <option value="expense">Chi tiêu</option>
                      <option value="income">Thu nhập</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                      Số tiền
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={editAmount}
                      onChange={(event) => setEditAmount(event.target.value)}
                      className="w-full px-4 py-2.5 bg-[var(--input-background)] border border-[var(--border)] rounded-[var(--radius-lg)]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                      Tài khoản
                    </label>
                    <select
                      value={editAccountId}
                      onChange={(event) => setEditAccountId(event.target.value)}
                      className="w-full px-4 py-2.5 bg-[var(--input-background)] border border-[var(--border)] rounded-[var(--radius-lg)]"
                    >
                      <option value="">Chọn tài khoản</option>
                      {accounts
                        .filter((account) => account.status !== "archived")
                        .map((account) => (
                          <option key={account.id} value={account.id}>
                            {account.name}
                          </option>
                        ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                      Danh mục
                    </label>
                    <select
                      value={editCategoryId}
                      onChange={(event) =>
                        setEditCategoryId(event.target.value)
                      }
                      className="w-full px-4 py-2.5 bg-[var(--input-background)] border border-[var(--border)] rounded-[var(--radius-lg)]"
                    >
                      <option value="">Chọn danh mục</option>
                      {filteredCategories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                      Mô tả
                    </label>
                    <input
                      type="text"
                      value={editDescription}
                      onChange={(event) =>
                        setEditDescription(event.target.value)
                      }
                      className="w-full px-4 py-2.5 bg-[var(--input-background)] border border-[var(--border)] rounded-[var(--radius-lg)]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                      Merchant có sẵn
                    </label>
                    <select
                      value={editMerchantId}
                      onChange={(event) => {
                        setEditMerchantId(event.target.value);
                        if (event.target.value) {
                          setEditMerchantName("");
                        }
                      }}
                      className="w-full px-4 py-2.5 bg-[var(--input-background)] border border-[var(--border)] rounded-[var(--radius-lg)]"
                    >
                      <option value="">Không chọn</option>
                      {visibleMerchants.map((merchant) => (
                        <option key={merchant.id} value={merchant.id}>
                          {merchant.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {!editMerchantId && (
                    <div>
                      <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                        Merchant mới
                      </label>
                      <input
                        type="text"
                        value={editMerchantName}
                        onChange={(event) =>
                          setEditMerchantName(event.target.value)
                        }
                        placeholder="Ví dụ: Highlands Coffee"
                        className="w-full px-4 py-2.5 bg-[var(--input-background)] border border-[var(--border)] rounded-[var(--radius-lg)]"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col-reverse sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-[var(--radius-lg)] border border-[var(--border)] text-[var(--text-primary)]"
                >
                  Huỷ
                </button>
                <button
                  type="button"
                  onClick={handleApply}
                  className="px-4 py-2.5 rounded-[var(--radius-lg)] bg-[var(--primary)] text-white font-medium"
                >
                  Áp dụng vào form
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

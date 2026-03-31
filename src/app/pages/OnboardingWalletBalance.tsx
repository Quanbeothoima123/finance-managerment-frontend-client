import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowLeft,
  Wallet,
  Banknote,
  Landmark,
  Smartphone,
  Plus,
  Trash2,
  X,
  Check,
  Loader2,
} from "lucide-react";
import { useToast } from "../contexts/ToastContext";
import { useAuth } from "../hooks/useAuth";
import { onboardingService } from "../services/onboardingService";
import {
  formatWithDots,
  stripToDigits,
  numberToVietnameseWords,
} from "../components/AmountInput";
import { maskAccountNumber } from "../utils/accountHelpers";
import { getApiErrorMessage } from "../utils/authError";
import { resolveOnboardingPath } from "../types/onboarding";

type WalletType = "cash" | "ewallet" | "bank";

interface OnboardingWallet {
  id: string;
  name: string;
  type: WalletType;
  balance: string;
  icon: string;
  color: string;
  provider?: string;
  accountNumber?: string;
  accountOwnerName?: string;
}

const WALLET_TYPE_META: Record<
  WalletType,
  { label: string; icon: typeof Wallet; color: string }
> = {
  cash: { label: "Tiền mặt", icon: Banknote, color: "#10B981" },
  ewallet: { label: "Ví điện tử", icon: Smartphone, color: "#8B5CF6" },
  bank: { label: "Ngân hàng", icon: Landmark, color: "#3B82F6" },
};

const QUICK_SUGGESTIONS = [
  {
    name: "MoMo",
    type: "ewallet" as WalletType,
    color: "#D91C5C",
    icon: "smartphone",
  },
  {
    name: "ZaloPay",
    type: "ewallet" as WalletType,
    color: "#008FE5",
    icon: "smartphone",
  },
  {
    name: "Vietcombank",
    type: "bank" as WalletType,
    color: "#0E7C3A",
    icon: "landmark",
  },
  {
    name: "Techcombank",
    type: "bank" as WalletType,
    color: "#E4002B",
    icon: "landmark",
  },
  {
    name: "MB",
    type: "bank" as WalletType,
    color: "#004A8F",
    icon: "landmark",
  },
];

const EWALLET_PROVIDERS = [
  "MoMo",
  "ZaloPay",
  "ShopeePay",
  "Viettel Money",
  "Khác",
];
const BANK_SUGGESTIONS = ["Vietcombank", "Techcombank", "MB", "ACB"];

let walletCounter = 1;
function genId() {
  return `onb-wallet-${walletCounter++}-${Date.now()}`;
}

export default function OnboardingWalletBalance() {
  const navigate = useNavigate();
  const toast = useToast();
  const { isAuthenticated, isHydrated } = useAuth();

  const [currency, setCurrency] = useState("VND");
  const [wallets, setWallets] = useState<OnboardingWallet[]>([
    {
      id: genId(),
      name: "Tiền mặt",
      type: "cash",
      balance: "0",
      icon: "banknote",
      color: "#10B981",
    },
  ]);
  const [showCreateSheet, setShowCreateSheet] = useState(false);
  const [createType, setCreateType] = useState<WalletType>("cash");
  const [createName, setCreateName] = useState("");
  const [createBalance, setCreateBalance] = useState("0");
  const [createProvider, setCreateProvider] = useState("");
  const [createProviderOther, setCreateProviderOther] = useState("");
  const [createAccountNumber, setCreateAccountNumber] = useState("");
  const [createOwnerName, setCreateOwnerName] = useState("");
  const [createError, setCreateError] = useState("");
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isHydrated) return;
    if (!isAuthenticated) {
      navigate("/auth/login", { replace: true });
      return;
    }

    let isMounted = true;

    const loadState = async () => {
      try {
        const state = await onboardingService.getState();
        if (!isMounted) return;

        setCurrency(state.ledger.baseCurrencyCode || "VND");
        if (state.onboarding.completed) {
          navigate("/home", { replace: true });
          return;
        }
      } catch (error) {
        if (!isMounted) return;
        toast.error(
          getApiErrorMessage(error, "Không thể tải dữ liệu onboarding."),
        );
      } finally {
        if (isMounted) setIsBootstrapping(false);
      }
    };

    loadState();
    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, isHydrated, navigate, toast]);

  const availableSuggestions = useMemo(
    () =>
      QUICK_SUGGESTIONS.filter(
        (item) => !wallets.some((wallet) => wallet.name === item.name),
      ),
    [wallets],
  );

  const canContinue = wallets.length > 0 && !isSubmitting && !isBootstrapping;

  const updateWallet = (id: string, partial: Partial<OnboardingWallet>) => {
    setWallets((prev) =>
      prev.map((wallet) =>
        wallet.id === id ? { ...wallet, ...partial } : wallet,
      ),
    );
  };

  const updateWalletBalance = (id: string, rawValue: string) => {
    const digits = stripToDigits(rawValue);
    if (digits.length > 15) return;
    const cleaned = digits.replace(/^0+/, "") || (digits.length > 0 ? "0" : "");
    updateWallet(id, {
      balance: cleaned === "0" && digits === "" ? "" : cleaned,
    });
  };

  const deleteWallet = (id: string) => {
    if (wallets.length <= 1) {
      toast.error("Cần ít nhất 1 ví để tiếp tục.");
      return;
    }
    setWallets((prev) => prev.filter((wallet) => wallet.id !== id));
  };

  const addQuickSuggestion = (
    suggestion: (typeof QUICK_SUGGESTIONS)[number],
  ) => {
    setWallets((prev) => [
      ...prev,
      {
        id: genId(),
        name: suggestion.name,
        type: suggestion.type,
        balance: "0",
        icon: suggestion.icon,
        color: suggestion.color,
        provider:
          suggestion.type === "bank"
            ? suggestion.name
            : suggestion.type === "ewallet"
              ? suggestion.name
              : undefined,
      },
    ]);
  };

  const resetCreateForm = (type: WalletType) => {
    setCreateType(type);
    setCreateName("");
    setCreateBalance("0");
    setCreateProvider("");
    setCreateProviderOther("");
    setCreateAccountNumber("");
    setCreateOwnerName("");
    setCreateError("");
  };

  const handleCreateWallet = () => {
    if (!createName.trim()) {
      setCreateError("Vui lòng nhập tên ví.");
      return;
    }

    if (createType === "bank" && !createAccountNumber.trim()) {
      setCreateError("Vui lòng nhập số tài khoản cho ví ngân hàng.");
      return;
    }

    const provider =
      createType === "cash"
        ? undefined
        : createProvider === "Khác"
          ? createProviderOther.trim() || undefined
          : createProvider.trim() || undefined;

    setWallets((prev) => [
      ...prev,
      {
        id: genId(),
        name: createName.trim(),
        type: createType,
        balance: createBalance || "0",
        icon:
          createType === "cash"
            ? "banknote"
            : createType === "bank"
              ? "landmark"
              : "smartphone",
        color: WALLET_TYPE_META[createType].color,
        provider,
        accountNumber: createAccountNumber.trim() || undefined,
        accountOwnerName: createOwnerName.trim() || undefined,
      },
    ]);
    setShowCreateSheet(false);
    resetCreateForm(createType);
    toast.success("Đã thêm ví mới.");
  };

  const persistWallets = async (
    items: OnboardingWallet[],
    skipMode = false,
  ) => {
    setIsSubmitting(true);
    try {
      const result = await onboardingService.saveAccounts({
        accounts: items.map((wallet) => ({
          name: wallet.name,
          type: wallet.type,
          openingBalanceMinor: parseInt(wallet.balance, 10) || 0,
          currencyCode: currency,
          providerName: wallet.provider || null,
          iconKey: wallet.icon,
          colorHex: wallet.color,
          accountNumber: wallet.accountNumber || null,
          accountOwnerName: wallet.accountOwnerName || null,
        })),
      });

      toast.success(
        skipMode
          ? "Đã tạo ví mặc định."
          : `Đã tạo ${result.count} ví thành công!`,
      );
      navigate(resolveOnboardingPath(result.nextStep), { replace: true });
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Không thể lưu danh sách ví."));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = () => {
    void persistWallets(
      [
        {
          id: genId(),
          name: "Tiền mặt",
          type: "cash",
          balance: "0",
          icon: "wallet",
          color: "#10B981",
        },
      ],
      true,
    );
  };

  const handleContinue = () => {
    if (!wallets.length) {
      toast.error("Cần ít nhất 1 ví để tiếp tục.");
      return;
    }
    void persistWallets(wallets, false);
  };

  return (
    <div className="min-h-screen bg-[var(--background)] flex flex-col">
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-center justify-between px-4 py-4 sm:px-6"
      >
        <button
          onClick={() => navigate("/onboarding/currency-date")}
          disabled={isSubmitting}
          className="p-2 -ml-2 rounded-[var(--radius-md)] hover:bg-[var(--surface)] transition-colors disabled:opacity-50"
        >
          <ArrowLeft className="w-5 h-5 text-[var(--text-primary)]" />
        </button>

        <div className="flex flex-col items-center gap-1">
          <span className="text-xs text-[var(--text-tertiary)]">Bước 2/3</span>
          <div className="w-24 h-1 bg-[var(--surface)] rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-[var(--primary)] rounded-full"
              initial={{ width: "33%" }}
              animate={{ width: "66%" }}
              transition={{ duration: 0.6, delay: 0.3 }}
            />
          </div>
        </div>

        <button
          onClick={handleSkip}
          disabled={isSubmitting || isBootstrapping}
          className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors px-2 py-1 disabled:opacity-50"
        >
          Bỏ qua
        </button>
      </motion.header>

      <div className="flex-1 px-4 sm:px-6 pb-6 flex flex-col max-w-lg mx-auto w-full overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="mt-4 mb-5"
        >
          <h1 className="text-2xl font-semibold text-[var(--text-primary)] mb-2">
            Tạo ví ban đầu
          </h1>
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
            Thêm ít nhất 1 ví để bắt đầu nhập giao dịch. Nếu chưa chắc số dư, cứ
            để 0 — bạn chỉnh lại sau.
          </p>
        </motion.div>

        {isBootstrapping && (
          <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)] mb-4">
            <Loader2 className="w-4 h-4 animate-spin" />
            Đang đồng bộ thông tin ví mặc định...
          </div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="bg-[var(--surface-elevated)] border border-[var(--border)] rounded-[var(--radius-xl)] p-4 mb-4 shadow-[var(--shadow-sm)]"
        >
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-[var(--text-primary)]">
              Danh sách ví
            </h2>
            <button
              onClick={() => {
                resetCreateForm("cash");
                setShowCreateSheet(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-[var(--radius-md)] bg-[var(--primary)] text-white text-sm"
            >
              <Plus className="w-4 h-4" />
              Thêm ví
            </button>
          </div>

          <div className="space-y-3">
            {wallets.map((wallet) => {
              const meta = WALLET_TYPE_META[wallet.type];
              const Icon = meta.icon;
              const amountInWords = numberToVietnameseWords(
                parseInt(wallet.balance || "0", 10),
              );
              return (
                <div
                  key={wallet.id}
                  className="bg-[var(--background)] border border-[var(--border)] rounded-[var(--radius-lg)] p-4"
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div
                      className="w-11 h-11 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: `${wallet.color}20` }}
                    >
                      <Icon
                        className="w-5 h-5"
                        style={{ color: wallet.color }}
                      />
                    </div>
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-center justify-between gap-3">
                        <input
                          value={wallet.name}
                          onChange={(event) =>
                            updateWallet(wallet.id, {
                              name: event.target.value,
                            })
                          }
                          className="flex-1 bg-transparent text-sm font-medium text-[var(--text-primary)] outline-none"
                        />
                        <button
                          onClick={() => deleteWallet(wallet.id)}
                          className="p-2 rounded-[var(--radius-md)] hover:bg-[var(--surface)] text-[var(--text-tertiary)]"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-[11px] text-[var(--text-tertiary)]">
                        {meta.label}
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-3">
                    <div>
                      <label className="block text-xs text-[var(--text-tertiary)] mb-1">
                        Số dư ban đầu ({currency})
                      </label>
                      <input
                        value={formatWithDots(wallet.balance || "0")}
                        onChange={(event) =>
                          updateWalletBalance(wallet.id, event.target.value)
                        }
                        inputMode="numeric"
                        className="w-full px-3 py-2.5 bg-[var(--input-background)] border border-[var(--border)] rounded-[var(--radius-md)] text-[var(--text-primary)] outline-none"
                      />
                      <p className="text-[11px] text-[var(--text-tertiary)] mt-1">
                        {amountInWords || "Không đồng"}
                      </p>
                    </div>

                    {wallet.type !== "cash" && (
                      <>
                        <div>
                          <label className="block text-xs text-[var(--text-tertiary)] mb-1">
                            Nhà cung cấp / ngân hàng
                          </label>
                          <input
                            value={wallet.provider || ""}
                            onChange={(event) =>
                              updateWallet(wallet.id, {
                                provider: event.target.value,
                              })
                            }
                            className="w-full px-3 py-2.5 bg-[var(--input-background)] border border-[var(--border)] rounded-[var(--radius-md)] text-[var(--text-primary)] outline-none"
                          />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs text-[var(--text-tertiary)] mb-1">
                              Số tài khoản / mã ví
                            </label>
                            <input
                              value={wallet.accountNumber || ""}
                              onChange={(event) =>
                                updateWallet(wallet.id, {
                                  accountNumber: event.target.value,
                                })
                              }
                              className="w-full px-3 py-2.5 bg-[var(--input-background)] border border-[var(--border)] rounded-[var(--radius-md)] text-[var(--text-primary)] outline-none"
                            />
                            {wallet.accountNumber && (
                              <p className="text-[11px] text-[var(--text-tertiary)] mt-1">
                                {maskAccountNumber(wallet.accountNumber)}
                              </p>
                            )}
                          </div>
                          <div>
                            <label className="block text-xs text-[var(--text-tertiary)] mb-1">
                              Tên chủ tài khoản
                            </label>
                            <input
                              value={wallet.accountOwnerName || ""}
                              onChange={(event) =>
                                updateWallet(wallet.id, {
                                  accountOwnerName: event.target.value,
                                })
                              }
                              className="w-full px-3 py-2.5 bg-[var(--input-background)] border border-[var(--border)] rounded-[var(--radius-md)] text-[var(--text-primary)] outline-none"
                            />
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="bg-[var(--surface-elevated)] border border-[var(--border)] rounded-[var(--radius-xl)] p-4 mb-4 shadow-[var(--shadow-sm)]"
        >
          <h2 className="text-sm font-medium text-[var(--text-primary)] mb-3">
            Gợi ý nhanh
          </h2>
          <div className="flex flex-wrap gap-2">
            {availableSuggestions.map((item) => (
              <button
                key={item.name}
                onClick={() => addQuickSuggestion(item)}
                className="px-3 py-2 rounded-full border border-[var(--border)] bg-[var(--background)] text-sm text-[var(--text-primary)] hover:border-[var(--primary)]"
              >
                + {item.name}
              </button>
            ))}
          </div>
        </motion.div>

        <div className="flex-1 min-h-4" />

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.45 }}
          className="mt-6 sticky bottom-4"
        >
          <button
            onClick={handleContinue}
            disabled={!canContinue}
            className={`w-full py-3.5 rounded-[var(--radius-lg)] font-medium text-base transition-all shadow-[var(--shadow-sm)] ${canContinue ? "bg-[var(--primary)] text-[var(--primary-foreground)] hover:bg-[var(--primary-hover)] active:scale-[0.98]" : "bg-[var(--border)] text-[var(--text-tertiary)] cursor-not-allowed"}`}
          >
            {isSubmitting ? "Đang lưu..." : "Tiếp tục"}
          </button>
          <p className="text-center text-xs text-[var(--text-tertiary)] mt-3">
            Bạn có thể chỉnh lại ví trong phần Accounts sau khi vào app.
          </p>
        </motion.div>
      </div>

      <AnimatePresence>
        {showCreateSheet && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/50"
              onClick={() => setShowCreateSheet(false)}
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 320 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-[var(--card)] rounded-t-[var(--radius-2xl)] shadow-2xl"
            >
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full bg-[var(--border)]" />
              </div>
              <div className="px-5 pb-6">
                <div className="flex items-center justify-between pb-4">
                  <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                    Thêm ví mới
                  </h3>
                  <button
                    onClick={() => setShowCreateSheet(false)}
                    className="p-2 rounded-[var(--radius-md)] hover:bg-[var(--surface)]"
                  >
                    <X className="w-5 h-5 text-[var(--text-secondary)]" />
                  </button>
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  {(["cash", "ewallet", "bank"] as WalletType[]).map((type) => (
                    <button
                      key={type}
                      onClick={() => resetCreateForm(type)}
                      className={`px-3 py-2 rounded-full border text-sm ${createType === type ? "border-[var(--primary)] bg-[var(--primary-light)] text-[var(--primary)]" : "border-[var(--border)] text-[var(--text-secondary)]"}`}
                    >
                      {WALLET_TYPE_META[type].label}
                    </button>
                  ))}
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-[var(--text-tertiary)] mb-1">
                      Tên ví
                    </label>
                    <input
                      value={createName}
                      onChange={(e) => setCreateName(e.target.value)}
                      className="w-full px-3 py-2.5 bg-[var(--input-background)] border border-[var(--border)] rounded-[var(--radius-md)] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-[var(--text-tertiary)] mb-1">
                      Số dư ban đầu
                    </label>
                    <input
                      value={formatWithDots(createBalance || "0")}
                      onChange={(e) =>
                        setCreateBalance(stripToDigits(e.target.value) || "0")
                      }
                      inputMode="numeric"
                      className="w-full px-3 py-2.5 bg-[var(--input-background)] border border-[var(--border)] rounded-[var(--radius-md)] outline-none"
                    />
                  </div>
                  {createType !== "cash" && (
                    <>
                      <div>
                        <label className="block text-xs text-[var(--text-tertiary)] mb-1">
                          {createType === "bank"
                            ? "Ngân hàng"
                            : "Nhà cung cấp ví điện tử"}
                        </label>
                        <select
                          value={createProvider}
                          onChange={(e) => setCreateProvider(e.target.value)}
                          className="w-full px-3 py-2.5 bg-[var(--input-background)] border border-[var(--border)] rounded-[var(--radius-md)] outline-none"
                        >
                          <option value="">Chọn...</option>
                          {(createType === "bank"
                            ? BANK_SUGGESTIONS
                            : EWALLET_PROVIDERS
                          ).map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      </div>
                      {createProvider === "Khác" && (
                        <input
                          value={createProviderOther}
                          onChange={(e) =>
                            setCreateProviderOther(e.target.value)
                          }
                          placeholder="Nhập tên nhà cung cấp"
                          className="w-full px-3 py-2.5 bg-[var(--input-background)] border border-[var(--border)] rounded-[var(--radius-md)] outline-none"
                        />
                      )}
                      <input
                        value={createAccountNumber}
                        onChange={(e) => setCreateAccountNumber(e.target.value)}
                        placeholder="Số tài khoản / mã ví"
                        className="w-full px-3 py-2.5 bg-[var(--input-background)] border border-[var(--border)] rounded-[var(--radius-md)] outline-none"
                      />
                      <input
                        value={createOwnerName}
                        onChange={(e) => setCreateOwnerName(e.target.value)}
                        placeholder="Tên chủ tài khoản"
                        className="w-full px-3 py-2.5 bg-[var(--input-background)] border border-[var(--border)] rounded-[var(--radius-md)] outline-none"
                      />
                    </>
                  )}
                </div>

                {createError && (
                  <p className="text-sm text-[var(--danger)] mt-3">
                    {createError}
                  </p>
                )}

                <button
                  onClick={handleCreateWallet}
                  className="w-full mt-5 py-3 rounded-[var(--radius-lg)] bg-[var(--primary)] text-white font-medium inline-flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  Lưu ví
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

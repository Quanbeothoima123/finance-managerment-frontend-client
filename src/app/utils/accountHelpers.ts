export function normalizeFrontendAccountType(type?: string): string {
  if (!type) return "cash";

  const normalized = String(type).trim().toLowerCase();
  const map: Record<string, string> = {
    cash: "cash",
    bank: "bank",
    ewallet: "ewallet",
    "e-wallet": "ewallet",
    e_wallet: "ewallet",
    credit: "credit",
    "credit-card": "credit",
    credit_card: "credit",
    savings: "savings",
    investment: "investment",
  };

  return map[normalized] || "cash";
}

export function maskAccountNumber(
  num?: string | null,
  type?: string,
  hideCompletely?: boolean,
): string {
  if (!num || num.length < 4) return num || "";

  if (hideCompletely) {
    return "••••••••";
  }

  if (
    (type === "ewallet" || type === "e_wallet") &&
    num.length >= 9 &&
    num.length <= 12
  ) {
    const last3 = num.slice(-3);
    const first2 = num.slice(0, 2);
    return `${first2}xx xxx ${last3}`;
  }

  const last4 = num.slice(-4);
  return `****${last4}`;
}

export function getAccountTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    bank: "Ngân hàng",
    cash: "Tiền mặt",
    ewallet: "Ví điện tử",
    e_wallet: "Ví điện tử",
    credit: "Thẻ tín dụng",
    credit_card: "Thẻ tín dụng",
    investment: "Đầu tư",
    savings: "Tiết kiệm",
  };

  return labels[type] || type;
}

export function getAccountSubtitle(
  account: {
    type?: string;
    accountType?: string;
    providerName?: string | null;
    accountNumber?: string | null;
  },
  hideNumbers?: boolean,
): string {
  const parts: string[] = [];

  if (account.providerName) {
    parts.push(account.providerName);
  }

  if (account.accountNumber) {
    parts.push(
      maskAccountNumber(
        account.accountNumber,
        account.type || account.accountType,
        hideNumbers,
      ),
    );
  }

  return parts.join(" • ");
}

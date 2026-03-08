/**
 * Mask an account/phone number, showing only the last 4 digits.
 * If `hideCompletely` is true, shows only dots (for global hide setting).
 * E.g., "19036699999999" → "****9999", "0901234567" → "09xx xxx 567"
 */
export function maskAccountNumber(num?: string, type?: string, hideCompletely?: boolean): string {
  if (!num || num.length < 4) return num || '';
  
  // If global hide is on, show fully hidden
  if (hideCompletely) {
    return '••••••••';
  }
  
  // For phone-like numbers (e-wallet), show format like 09xx xxx 234
  if (type === 'cash' && num.length >= 9 && num.length <= 12) {
    const last3 = num.slice(-3);
    const first2 = num.slice(0, 2);
    return `${first2}xx xxx ${last3}`;
  }
  
  // Default: show ****LAST4
  const last4 = num.slice(-4);
  return `****${last4}`;
}

/**
 * Get a display-friendly label for account type.
 */
export function getAccountTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    bank: 'Ngân hàng',
    cash: 'Tiền mặt',
    credit: 'Thẻ tín dụng',
    investment: 'Đầu tư',
    savings: 'Tiết kiệm',
  };
  return labels[type] || type;
}

/**
 * Build a subtitle string for account display: Provider • Masked Number
 */
export function getAccountSubtitle(account: {
  type: string;
  accountNumber?: string;
  accountOwnerName?: string;
  name?: string;
}, hideNumbers?: boolean): string {
  const parts: string[] = [];
  
  if (account.accountNumber) {
    parts.push(hideNumbers ? '••••••••' : maskAccountNumber(account.accountNumber, account.type));
  }
  
  return parts.join(' • ');
}
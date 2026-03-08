import React, { useMemo, useRef, useCallback } from 'react';

// ============================================================
// Vietnamese number-to-words conversion
// ============================================================

const DIGITS = ['không', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'];

function readThreeDigits(
  hundreds: number,
  tens: number,
  units: number,
  hasHigherGroup: boolean,
): string {
  const parts: string[] = [];

  // Hundreds
  if (hundreds > 0) {
    parts.push(`${DIGITS[hundreds]} trăm`);
  } else if (hasHigherGroup && (tens > 0 || units > 0)) {
    parts.push('không trăm');
  }

  // Tens & units
  if (tens > 1) {
    let tenPart = `${DIGITS[tens]} mươi`;
    if (units === 1) {
      tenPart += ' mốt';
    } else if (units === 4) {
      tenPart += ' tư';
    } else if (units === 5) {
      tenPart += ' lăm';
    } else if (units > 0) {
      tenPart += ` ${DIGITS[units]}`;
    }
    parts.push(tenPart);
  } else if (tens === 1) {
    let tenPart = 'mười';
    if (units === 5) {
      tenPart += ' lăm';
    } else if (units > 0) {
      tenPart += ` ${DIGITS[units]}`;
    }
    parts.push(tenPart);
  } else if (units > 0) {
    if (hundreds > 0 || hasHigherGroup) {
      parts.push(`lẻ ${DIGITS[units]}`);
    } else {
      parts.push(DIGITS[units]);
    }
  }

  return parts.join(' ');
}

// Vietnamese group names by position (groups of 3 from right)
const GROUP_SUFFIX: string[] = ['', 'nghìn', 'triệu', 'tỷ', 'nghìn tỷ', 'triệu tỷ'];

export function numberToVietnameseWords(num: number): string {
  if (num === 0) return 'Không đồng';
  if (!Number.isFinite(num) || num < 0) return '';
  if (num >= 1e15) return 'Số quá lớn';

  const numStr = Math.floor(num).toString();

  // Split into groups of 3 from the right
  const groups: number[] = [];
  let i = numStr.length;
  while (i > 0) {
    const start = Math.max(0, i - 3);
    groups.unshift(parseInt(numStr.slice(start, i), 10));
    i = start;
  }

  const totalGroups = groups.length;
  const resultParts: string[] = [];

  for (let g = 0; g < totalGroups; g++) {
    const groupValue = groups[g];
    const posFromRight = totalGroups - 1 - g;

    if (groupValue === 0) continue;

    const hundreds = Math.floor(groupValue / 100);
    const tens = Math.floor((groupValue % 100) / 10);
    const units = groupValue % 10;
    // hasHigherGroup = there are non-zero groups that came before this one in the output
    const hasHigherGroup = resultParts.length > 0;

    const words = readThreeDigits(hundreds, tens, units, hasHigherGroup);
    const suffix = posFromRight < GROUP_SUFFIX.length ? GROUP_SUFFIX[posFromRight] : '';

    resultParts.push(words + (suffix ? ' ' + suffix : ''));
  }

  if (resultParts.length === 0) return 'Không đồng';

  const text = resultParts.join(' ');
  return text.charAt(0).toUpperCase() + text.slice(1) + ' đồng';
}

// ============================================================
// Format number with Vietnamese thousands separator (dots)
// ============================================================

export function formatWithDots(raw: string): string {
  if (!raw) return '';
  const digits = raw.replace(/\D/g, '');
  if (!digits) return '';
  // Remove leading zeros (but keep at least one digit)
  const cleaned = digits.replace(/^0+/, '') || '0';
  if (cleaned === '0' && digits.length > 0 && digits !== '0') {
    // All zeros edge case
    return '0';
  }
  return cleaned.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

export function stripToDigits(value: string): string {
  return value.replace(/\D/g, '');
}

// ============================================================
// AmountInput component
// ============================================================

interface AmountInputProps {
  value: string; // raw numeric string (e.g. "1000000")
  onChange: (rawValue: string) => void;
  error?: string;
  id?: string;
  /** Compact mode: no label, no words, smaller input */
  compact?: boolean;
}

export function AmountInput({ value, onChange, error, id = 'amount', compact = false }: AmountInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const displayValue = useMemo(() => formatWithDots(value), [value]);

  const numericValue = useMemo(() => {
    const n = parseInt(value, 10);
    return isNaN(n) ? 0 : n;
  }, [value]);

  const wordsText = useMemo(() => {
    if (numericValue <= 0) return '';
    return numberToVietnameseWords(numericValue);
  }, [numericValue]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const rawInput = e.target.value;
      const digits = stripToDigits(rawInput);

      // Prevent extremely long inputs
      if (digits.length > 15) return;

      // Remove leading zeros (keep empty string if all zeros stripped, so user can clear)
      const cleaned = digits.replace(/^0+/, '') || (digits.length > 0 ? '0' : '');

      // Calculate cursor position after formatting
      const input = inputRef.current;
      if (input) {
        const cursorPos = input.selectionStart ?? 0;
        // Count how many real digits are before the cursor in the current input
        const dotsBeforeCursor = (rawInput.slice(0, cursorPos).match(/\./g) || []).length;
        const digitsBefore = cursorPos - dotsBeforeCursor;

        // Format new value
        const newFormatted = formatWithDots(cleaned);

        // Find the position of the digitsBefore-th digit in the new formatted string
        let newCursor = 0;
        let digitCount = 0;
        for (let ci = 0; ci < newFormatted.length; ci++) {
          if (newFormatted[ci] !== '.') {
            digitCount++;
          }
          if (digitCount >= digitsBefore) {
            newCursor = ci + 1;
            break;
          }
        }
        if (digitCount < digitsBefore) {
          newCursor = newFormatted.length;
        }

        // Update value (store raw digits without leading zeros)
        onChange(cleaned === '0' && digits === '' ? '' : cleaned);

        // Restore cursor after React renders
        requestAnimationFrame(() => {
          if (input) {
            input.setSelectionRange(newCursor, newCursor);
          }
        });
      } else {
        onChange(cleaned === '0' && digits === '' ? '' : cleaned);
      }
    },
    [onChange],
  );

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    // Allow: Backspace, Delete, Tab, Escape, Enter, Arrow keys, Home, End
    const allowedKeys = [
      'Backspace',
      'Delete',
      'Tab',
      'Escape',
      'Enter',
      'ArrowLeft',
      'ArrowRight',
      'ArrowUp',
      'ArrowDown',
      'Home',
      'End',
    ];
    if (allowedKeys.includes(e.key)) return;
    if (e.ctrlKey || e.metaKey) return;

    // Only allow digits
    if (!/^\d$/.test(e.key)) {
      e.preventDefault();
    }
  }, []);

  return (
    <div>
      {!compact && (
        <label htmlFor={id} className="block text-sm font-medium text-[var(--text-primary)] mb-2">
          Số tiền <span className="text-[var(--danger)]">*</span>
        </label>
      )}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          inputMode="numeric"
          id={id}
          value={displayValue}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="0"
          autoComplete="off"
          className={`w-full ${compact ? 'px-3 py-2 pr-12 text-sm' : 'px-4 py-3 pr-16 text-2xl font-semibold'} bg-[var(--input-background)] border rounded-[var(--radius-lg)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)] tabular-nums ${
            error ? 'border-[var(--danger)]' : 'border-[var(--border)]'
          }`}
        />
        <div className={`absolute ${compact ? 'right-3' : 'right-4'} top-1/2 -translate-y-1/2 ${compact ? 'text-xs' : 'text-lg'} text-[var(--text-secondary)] pointer-events-none select-none`}>
          VND
        </div>
      </div>
      {/* Amount in Vietnamese words */}
      {!compact && wordsText && (
        <p className="mt-1.5 text-xs text-[var(--text-tertiary)] italic transition-all">
          {wordsText}
        </p>
      )}
      {error && <p className={`${compact ? 'mt-0.5 text-xs' : 'mt-1 text-sm'} text-[var(--danger)]`}>{error}</p>}
    </div>
  );
}
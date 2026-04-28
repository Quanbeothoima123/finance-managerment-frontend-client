import { useTranslation } from 'react-i18next';

export function useLocaleFormat() {
  const { i18n } = useTranslation();
  const locale = i18n.language === 'vi' ? 'vi-VN' : 'en-US';

  const formatCurrency = (amount: number, currency = 'VND') =>
    new Intl.NumberFormat(locale, { style: 'currency', currency }).format(amount);

  const formatDate = (date: Date | string) =>
    new Intl.DateTimeFormat(locale, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(new Date(date));

  const formatNumber = (value: number) =>
    new Intl.NumberFormat(locale).format(value);

  return { formatCurrency, formatDate, formatNumber, locale };
}

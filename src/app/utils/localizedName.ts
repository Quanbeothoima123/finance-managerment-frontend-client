import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

export interface LocalizableItem {
  name: string;
  nameEn?: string | null;
}

export function getLocalizedName(item: LocalizableItem, language: string): string {
  if (language === 'en' && item.nameEn) return item.nameEn;
  return item.name;
}

export function useLocalizedName() {
  const { i18n } = useTranslation();
  return useCallback(
    (item: LocalizableItem) => getLocalizedName(item, i18n.language),
    [i18n.language]
  );
}

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import viCommon from './locales/vi/common.json';
import viAuth from './locales/vi/auth.json';
import viOnboarding from './locales/vi/onboarding.json';
import viHome from './locales/vi/home.json';
import viTransactions from './locales/vi/transactions.json';
import viAccounts from './locales/vi/accounts.json';
import viBudgets from './locales/vi/budgets.json';
import viGoals from './locales/vi/goals.json';
import viInsights from './locales/vi/insights.json';
import viSettings from './locales/vi/settings.json';
import viCommunity from './locales/vi/community.json';
import viTagsRules from './locales/vi/tags-rules.json';
import viReports from './locales/vi/reports.json';
import viCategories from './locales/vi/categories.json';
import viMerchants from './locales/vi/merchants.json';

import enCommon from './locales/en/common.json';
import enAuth from './locales/en/auth.json';
import enOnboarding from './locales/en/onboarding.json';
import enHome from './locales/en/home.json';
import enTransactions from './locales/en/transactions.json';
import enAccounts from './locales/en/accounts.json';
import enBudgets from './locales/en/budgets.json';
import enGoals from './locales/en/goals.json';
import enInsights from './locales/en/insights.json';
import enSettings from './locales/en/settings.json';
import enCommunity from './locales/en/community.json';
import enTagsRules from './locales/en/tags-rules.json';
import enReports from './locales/en/reports.json';
import enCategories from './locales/en/categories.json';
import enMerchants from './locales/en/merchants.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      vi: {
        common: viCommon,
        auth: viAuth,
        onboarding: viOnboarding,
        home: viHome,
        transactions: viTransactions,
        accounts: viAccounts,
        budgets: viBudgets,
        goals: viGoals,
        insights: viInsights,
        settings: viSettings,
        community: viCommunity,
        tagsRules: viTagsRules,
        reports: viReports,
        categories: viCategories,
        merchants: viMerchants,
      },
      en: {
        common: enCommon,
        auth: enAuth,
        onboarding: enOnboarding,
        home: enHome,
        transactions: enTransactions,
        accounts: enAccounts,
        budgets: enBudgets,
        goals: enGoals,
        insights: enInsights,
        settings: enSettings,
        community: enCommunity,
        tagsRules: enTagsRules,
        reports: enReports,
        categories: enCategories,
        merchants: enMerchants,
      },
    },
    defaultNS: 'common',
    fallbackLng: 'vi',
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'app-language',
    },
  });

export default i18n;

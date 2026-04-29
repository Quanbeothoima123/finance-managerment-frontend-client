import React from "react";
import { useTranslation } from "react-i18next";
import { Layout } from "../components/Layout";
import RecurringRulesList from "./RecurringRulesList";

export default function RecurringRulesListWithLayout() {
  const { t } = useTranslation("common");
  return (
    <Layout title={t("page_titles.recurring_rules")}>
      <RecurringRulesList />
    </Layout>
  );
}
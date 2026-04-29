import React from "react";
import { useTranslation } from "react-i18next";
import { Layout } from "../components/Layout";
import RecurringRuleDetail from "./RecurringRuleDetail";

export default function RecurringRuleDetailWithLayout() {
  const { t } = useTranslation("common");
  return (
    <Layout title={t("page_titles.recurring_rule_detail")}>
      <RecurringRuleDetail />
    </Layout>
  );
}
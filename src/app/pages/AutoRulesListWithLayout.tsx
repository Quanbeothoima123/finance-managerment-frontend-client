import React from "react";
import { useTranslation } from "react-i18next";
import { Layout } from "../components/Layout";
import AutoRulesList from "./AutoRulesList";

export default function AutoRulesListWithLayout() {
  const { t } = useTranslation("common");
  return (
    <Layout title={t("page_titles.auto_rules")}>
      <AutoRulesList />
    </Layout>
  );
}
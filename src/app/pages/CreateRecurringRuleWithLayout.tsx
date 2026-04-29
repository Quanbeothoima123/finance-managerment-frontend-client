import React from "react";
import { useTranslation } from "react-i18next";
import { Layout } from "../components/Layout";
import CreateRecurringRule from "./CreateRecurringRule";

export default function CreateRecurringRuleWithLayout() {
  const { t } = useTranslation("common");
  return (
    <Layout title={t("page_titles.create_recurring_rule")}>
      <CreateRecurringRule />
    </Layout>
  );
}
import React from "react";
import { useTranslation } from "react-i18next";
import { Layout } from "../components/Layout";
import EditRecurringRule from "./EditRecurringRule";

export default function EditRecurringRuleWithLayout() {
  const { t } = useTranslation("common");
  return (
    <Layout title={t("page_titles.edit_recurring_rule")}>
      <EditRecurringRule />
    </Layout>
  );
}
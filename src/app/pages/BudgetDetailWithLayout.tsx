import React from "react";
import { useTranslation } from "react-i18next";
import { Layout } from "../components/Layout";
import BudgetDetail from "./BudgetDetail";

export default function BudgetDetailWithLayout() {
  const { t } = useTranslation("common");
  return (
    <Layout title={t("page_titles.budget_detail")}>
      <BudgetDetail />
    </Layout>
  );
}
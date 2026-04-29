import React from "react";
import { useTranslation } from "react-i18next";
import { Layout } from "../components/Layout";
import EditBudget from "./EditBudget";

export default function EditBudgetWithLayout() {
  const { t } = useTranslation("common");
  return (
    <Layout title={t("page_titles.edit_budget")}>
      <EditBudget />
    </Layout>
  );
}
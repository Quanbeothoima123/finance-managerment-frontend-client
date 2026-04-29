import React from "react";
import { useTranslation } from "react-i18next";
import { Layout } from "../components/Layout";
import CreateBudget from "./CreateBudget";

export default function CreateBudgetWithLayout() {
  const { t } = useTranslation("common");
  return (
    <Layout title={t("page_titles.create_budget")}>
      <CreateBudget />
    </Layout>
  );
}
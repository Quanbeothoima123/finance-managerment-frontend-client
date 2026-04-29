import React from "react";
import { useTranslation } from "react-i18next";
import { Layout } from "../components/Layout";
import AddBudgetItem from "./AddBudgetItem";

export default function AddBudgetItemWithLayout() {
  const { t } = useTranslation("common");
  return (
    <Layout title={t("page_titles.add_budget_item")}>
      <AddBudgetItem />
    </Layout>
  );
}
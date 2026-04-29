import React from "react";
import { useTranslation } from "react-i18next";
import { Layout } from "../components/Layout";
import AddEditTransaction from "./AddEditTransaction";

export default function AddEditTransactionWithLayout() {
  const { t } = useTranslation("common");
  return (
    <Layout title={t("page_titles.add_edit_transaction")}>
      <AddEditTransaction />
    </Layout>
  );
}
import React from "react";
import { useTranslation } from "react-i18next";
import { Layout } from "../components/Layout";
import TransactionDetail from "./TransactionDetail";

export default function TransactionDetailWithLayout() {
  const { t } = useTranslation("common");
  return (
    <Layout title={t("page_titles.transaction_detail")}>
      <TransactionDetail />
    </Layout>
  );
}
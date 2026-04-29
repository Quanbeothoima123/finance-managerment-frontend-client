import React from "react";
import { useTranslation } from "react-i18next";
import { Layout } from "../components/Layout";
import TransactionsList from "./TransactionsList";

export default function TransactionsListWithLayout() {
  const { t } = useTranslation("common");
  return (
    <Layout title={t("page_titles.transactions")}>
      <TransactionsList />
    </Layout>
  );
}

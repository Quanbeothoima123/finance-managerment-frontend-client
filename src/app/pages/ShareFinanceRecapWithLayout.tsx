import React from "react";
import { useTranslation } from "react-i18next";
import { Layout } from "../components/Layout";
import ShareFinanceRecap from "./ShareFinanceRecap";

export default function ShareFinanceRecapWithLayout() {
  const { t } = useTranslation("common");
  return (
    <Layout title={t("page_titles.share_finance_recap")}>
      <ShareFinanceRecap />
    </Layout>
  );
}
import React from "react";
import { useTranslation } from "react-i18next";
import { Layout } from "../components/Layout";
import MonthlyRecap from "./MonthlyRecap";

export default function MonthlyRecapWithLayout() {
  const { t } = useTranslation("common");
  return (
    <Layout title={t("page_titles.monthly_recap")}>
      <MonthlyRecap />
    </Layout>
  );
}
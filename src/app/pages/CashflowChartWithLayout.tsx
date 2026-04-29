import React from "react";
import { useTranslation } from "react-i18next";
import { Layout } from "../components/Layout";
import CashflowChart from "./CashflowChart";

export default function CashflowChartWithLayout() {
  const { t } = useTranslation("common");
  return (
    <Layout title={t("page_titles.cashflow_chart")}>
      <CashflowChart />
    </Layout>
  );
}
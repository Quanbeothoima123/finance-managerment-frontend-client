import React from "react";
import { useTranslation } from "react-i18next";
import { Layout } from "../components/Layout";
import MonthlySummaryReport from "./MonthlySummaryReport";

export default function MonthlySummaryReportWithLayout() {
  const { t } = useTranslation("common");
  return (
    <Layout title={t("page_titles.monthly_summary_report")}>
      <MonthlySummaryReport />
    </Layout>
  );
}
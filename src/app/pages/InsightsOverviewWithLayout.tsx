import React from "react";
import { useTranslation } from "react-i18next";
import { Layout } from "../components/Layout";
import InsightsOverview from "./InsightsOverview";

export default function InsightsOverviewWithLayout() {
  const { t } = useTranslation("common");
  return (
    <Layout title={t("page_titles.insights")}>
      <InsightsOverview />
    </Layout>
  );
}
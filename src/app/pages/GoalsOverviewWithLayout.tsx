import React from "react";
import { useTranslation } from "react-i18next";
import { Layout } from "../components/Layout";
import GoalsOverview from "./GoalsOverview";

export default function GoalsOverviewWithLayout() {
  const { t } = useTranslation("common");
  return (
    <Layout title={t("page_titles.goals")}>
      <GoalsOverview />
    </Layout>
  );
}
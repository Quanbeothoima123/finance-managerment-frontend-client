import React from "react";
import { useTranslation } from "react-i18next";
import { Layout } from "../components/Layout";
import WeeklyRecapDetail from "./WeeklyRecapDetail";

export default function WeeklyRecapDetailWithLayout() {
  const { t } = useTranslation("common");
  return (
    <Layout title={t("page_titles.weekly_recap_detail")}>
      <WeeklyRecapDetail />
    </Layout>
  );
}
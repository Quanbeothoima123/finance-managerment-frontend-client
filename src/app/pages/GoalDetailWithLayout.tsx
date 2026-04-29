import React from "react";
import { useTranslation } from "react-i18next";
import { Layout } from "../components/Layout";
import GoalDetail from "./GoalDetail";

export default function GoalDetailWithLayout() {
  const { t } = useTranslation("common");
  return (
    <Layout title={t("page_titles.goal_detail")}>
      <GoalDetail />
    </Layout>
  );
}
import React from "react";
import { useTranslation } from "react-i18next";
import { Layout } from "../components/Layout";
import EditGoal from "./EditGoal";

export default function EditGoalWithLayout() {
  const { t } = useTranslation("common");
  return (
    <Layout title={t("page_titles.edit_goal")}>
      <EditGoal />
    </Layout>
  );
}
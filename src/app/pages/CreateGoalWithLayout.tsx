import React from "react";
import { useTranslation } from "react-i18next";
import { Layout } from "../components/Layout";
import CreateGoal from "./CreateGoal";

export default function CreateGoalWithLayout() {
  const { t } = useTranslation("common");
  return (
    <Layout title={t("page_titles.create_goal")}>
      <CreateGoal />
    </Layout>
  );
}
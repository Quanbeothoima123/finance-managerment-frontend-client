import React from "react";
import { useTranslation } from "react-i18next";
import { Layout } from "../components/Layout";
import AddGoalContribution from "./AddGoalContribution";

export default function AddGoalContributionWithLayout() {
  const { t } = useTranslation("common");
  return (
    <Layout title={t("page_titles.add_goal_contribution")}>
      <AddGoalContribution />
    </Layout>
  );
}
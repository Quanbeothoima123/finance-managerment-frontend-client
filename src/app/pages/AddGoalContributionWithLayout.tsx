import React from "react";
import { Layout } from "../components/Layout";
import AddGoalContribution from "./AddGoalContribution";

export default function AddGoalContributionWithLayout() {
  return (
    <Layout title="Thêm đóng góp">
      <AddGoalContribution isModal={false} />
    </Layout>
  );
}

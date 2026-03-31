import React from "react";
import { Layout } from "../components/Layout";
import GoalsOverview from "./GoalsOverview";

export default function GoalsOverviewWithLayout() {
  return (
    <Layout title="Mục tiêu">
      <GoalsOverview />
    </Layout>
  );
}

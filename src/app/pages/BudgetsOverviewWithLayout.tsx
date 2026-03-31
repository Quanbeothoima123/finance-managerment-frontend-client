import React from "react";
import { Layout } from "../components/Layout";
import BudgetsOverview from "./BudgetsOverview";

export default function BudgetsOverviewWithLayout() {
  return (
    <Layout title="Ngân sách">
      <BudgetsOverview />
    </Layout>
  );
}

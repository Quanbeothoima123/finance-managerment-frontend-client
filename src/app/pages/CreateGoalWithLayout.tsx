import React from "react";
import { Layout } from "../components/Layout";
import CreateEditGoal from "./CreateEditGoal";

export default function CreateGoalWithLayout() {
  return (
    <Layout title="Tạo mục tiêu">
      <CreateEditGoal mode="create" />
    </Layout>
  );
}

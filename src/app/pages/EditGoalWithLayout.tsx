import React from "react";
import { Layout } from "../components/Layout";
import CreateEditGoal from "./CreateEditGoal";

export default function EditGoalWithLayout() {
  return (
    <Layout title="Chỉnh sửa mục tiêu">
      <CreateEditGoal mode="edit" />
    </Layout>
  );
}

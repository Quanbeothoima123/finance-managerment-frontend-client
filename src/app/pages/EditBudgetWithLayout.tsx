import React from "react";
import { Layout } from "../components/Layout";
import CreateEditBudget from "./CreateEditBudget";

export default function EditBudgetWithLayout() {
  return (
    <Layout title="Chỉnh sửa ngân sách">
      <CreateEditBudget mode="edit" />
    </Layout>
  );
}

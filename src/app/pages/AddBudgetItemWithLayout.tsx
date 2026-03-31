import React from "react";
import { Layout } from "../components/Layout";
import AddBudgetItem from "./AddBudgetItem";

export default function AddBudgetItemWithLayout() {
  return (
    <Layout title="Thêm danh mục ngân sách">
      <AddBudgetItem isModal={false} />
    </Layout>
  );
}

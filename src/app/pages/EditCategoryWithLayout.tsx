import React from "react";
import { Layout } from "../components/Layout";
import CreateEditCategory from "./CreateEditCategory";

export default function EditCategoryWithLayout() {
  return (
    <Layout title="Chỉnh sửa danh mục">
      <CreateEditCategory mode="edit" />
    </Layout>
  );
}

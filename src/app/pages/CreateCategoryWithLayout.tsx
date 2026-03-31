import React from "react";
import { Layout } from "../components/Layout";
import CreateEditCategory from "./CreateEditCategory";

export default function CreateCategoryWithLayout() {
  return (
    <Layout title="Tạo danh mục">
      <CreateEditCategory mode="create" />
    </Layout>
  );
}

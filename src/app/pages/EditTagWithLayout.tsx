import React from "react";
import { Layout } from "../components/Layout";
import CreateEditTag from "./CreateEditTag";

export default function EditTagWithLayout() {
  return (
    <Layout title="Chỉnh sửa nhãn">
      <CreateEditTag mode="edit" />
    </Layout>
  );
}

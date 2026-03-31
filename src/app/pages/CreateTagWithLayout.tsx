import React from "react";
import { Layout } from "../components/Layout";
import CreateEditTag from "./CreateEditTag";

export default function CreateTagWithLayout() {
  return (
    <Layout title="Tạo nhãn">
      <CreateEditTag mode="create" />
    </Layout>
  );
}

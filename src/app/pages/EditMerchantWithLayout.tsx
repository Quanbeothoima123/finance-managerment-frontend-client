import React from "react";
import { Layout } from "../components/Layout";
import CreateEditMerchant from "./CreateEditMerchant";

export default function EditMerchantWithLayout() {
  return (
    <Layout title="Chỉnh sửa nhà cung cấp">
      <CreateEditMerchant mode="edit" />
    </Layout>
  );
}

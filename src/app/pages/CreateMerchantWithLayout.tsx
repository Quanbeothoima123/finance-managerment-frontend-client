import React from "react";
import { Layout } from "../components/Layout";
import CreateEditMerchant from "./CreateEditMerchant";

export default function CreateMerchantWithLayout() {
  return (
    <Layout title="Thêm nhà cung cấp">
      <CreateEditMerchant mode="create" />
    </Layout>
  );
}

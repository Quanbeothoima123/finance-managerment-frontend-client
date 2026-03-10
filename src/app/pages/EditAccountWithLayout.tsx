import React from "react";
import { Layout } from "../components/Layout";
import CreateEditAccount from "./CreateEditAccount";

export default function EditAccountWithLayout() {
  return (
    <Layout title="Chỉnh sửa tài khoản">
      <CreateEditAccount mode="edit" />
    </Layout>
  );
}

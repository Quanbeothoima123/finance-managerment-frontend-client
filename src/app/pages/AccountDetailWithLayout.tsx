import React from "react";
import { Layout } from "../components/Layout";
import AccountDetail from "./AccountDetail";

export default function AccountDetailWithLayout() {
  return (
    <Layout title="Chi tiết tài khoản">
      <AccountDetail />
    </Layout>
  );
}

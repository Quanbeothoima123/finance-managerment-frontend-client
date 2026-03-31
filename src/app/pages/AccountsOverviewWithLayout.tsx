import React from "react";
import { Layout } from "../components/Layout";
import AccountsOverview from "./AccountsOverview";

export default function AccountsOverviewWithLayout() {
  return (
    <Layout title="Ví & Tài khoản">
      <AccountsOverview />
    </Layout>
  );
}

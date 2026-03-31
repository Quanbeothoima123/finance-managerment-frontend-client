import React from "react";
import { Layout } from "../components/Layout";
import AddTransfer from "./AddTransfer";

export default function AddTransferWithLayout() {
  return (
    <Layout title="Chuyển tiền" showBackButton>
      <AddTransfer />
    </Layout>
  );
}

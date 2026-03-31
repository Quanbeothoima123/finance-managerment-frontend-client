import React from "react";
import { Layout } from "../components/Layout";
import AddEditTransaction from "./AddEditTransaction";

export default function AddEditTransactionWithLayout() {
  return (
    <Layout title="Giao dịch" showBackButton>
      <AddEditTransaction />
    </Layout>
  );
}

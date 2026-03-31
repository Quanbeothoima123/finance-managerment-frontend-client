import React from "react";
import { Layout } from "../components/Layout";
import TransactionsList from "./TransactionsList";

export default function TransactionsListWithLayout() {
  return (
    <Layout title="Giao dịch">
      <TransactionsList />
    </Layout>
  );
}

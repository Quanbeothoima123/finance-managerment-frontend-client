import React from "react";
import { Layout } from "../components/Layout";
import CreateRecurringRule from "./CreateRecurringRule";

export default function CreateRecurringRuleWithLayout() {
  return (
    <Layout title="Tạo định kỳ">
      <CreateRecurringRule />
    </Layout>
  );
}

import React from "react";
import { Layout } from "../components/Layout";
import GeneratePreviewDemo from "./GeneratePreviewDemo";

export default function GeneratePreviewDemoWithLayout() {
  return (
    <Layout title="Xem trước">
      <GeneratePreviewDemo />
    </Layout>
  );
}

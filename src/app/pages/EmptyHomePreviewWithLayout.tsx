import React from "react";
import { Layout } from "../components/Layout";
import EmptyHomePreview from "./EmptyHomePreview";

export default function EmptyHomePreviewWithLayout() {
  return (
    <Layout title="Home (Empty State)" showBackButton>
      <EmptyHomePreview />
    </Layout>
  );
}

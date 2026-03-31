import React from "react";
import { Layout } from "../components/Layout";
import TagsList from "./TagsList";

export default function TagsListWithLayout() {
  return (
    <Layout title="Nhãn">
      <TagsList />
    </Layout>
  );
}

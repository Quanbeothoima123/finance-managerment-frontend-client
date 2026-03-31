import React from "react";
import { Layout } from "../components/Layout";
import CategoriesList from "./CategoriesList";

export default function CategoriesListWithLayout() {
  return (
    <Layout title="Danh mục">
      <CategoriesList />
    </Layout>
  );
}

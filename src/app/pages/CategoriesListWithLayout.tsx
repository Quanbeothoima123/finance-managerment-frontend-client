import React from "react";
import { useTranslation } from "react-i18next";
import { Layout } from "../components/Layout";
import CategoriesList from "./CategoriesList";

export default function CategoriesListWithLayout() {
  const { t } = useTranslation("common");
  return (
    <Layout title={t("page_titles.categories")}>
      <CategoriesList />
    </Layout>
  );
}
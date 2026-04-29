import React from "react";
import { useTranslation } from "react-i18next";
import { Layout } from "../components/Layout";
import CreateCategory from "./CreateCategory";

export default function CreateCategoryWithLayout() {
  const { t } = useTranslation("common");
  return (
    <Layout title={t("page_titles.create_category")}>
      <CreateCategory />
    </Layout>
  );
}
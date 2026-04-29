import React from "react";
import { useTranslation } from "react-i18next";
import { Layout } from "../components/Layout";
import EditCategory from "./EditCategory";

export default function EditCategoryWithLayout() {
  const { t } = useTranslation("common");
  return (
    <Layout title={t("page_titles.edit_category")}>
      <EditCategory />
    </Layout>
  );
}
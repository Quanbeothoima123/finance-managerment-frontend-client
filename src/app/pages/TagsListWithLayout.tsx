import React from "react";
import { useTranslation } from "react-i18next";
import { Layout } from "../components/Layout";
import TagsList from "./TagsList";

export default function TagsListWithLayout() {
  const { t } = useTranslation("common");
  return (
    <Layout title={t("page_titles.tags")}>
      <TagsList />
    </Layout>
  );
}
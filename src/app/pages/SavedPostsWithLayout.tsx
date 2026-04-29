import React from "react";
import { useTranslation } from "react-i18next";
import { Layout } from "../components/Layout";
import SavedPosts from "./SavedPosts";

export default function SavedPostsWithLayout() {
  const { t } = useTranslation("common");
  return (
    <Layout title={t("page_titles.saved_posts")}>
      <SavedPosts />
    </Layout>
  );
}
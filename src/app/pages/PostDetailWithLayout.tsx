import React from "react";
import { useTranslation } from "react-i18next";
import { Layout } from "../components/Layout";
import PostDetail from "./PostDetail";

export default function PostDetailWithLayout() {
  const { t } = useTranslation("common");
  return (
    <Layout title={t("page_titles.post_detail")}>
      <PostDetail />
    </Layout>
  );
}
import React from "react";
import { useTranslation } from "react-i18next";
import { Layout } from "../components/Layout";
import CreatePost from "./CreatePost";

export default function CreatePostWithLayout() {
  const { t } = useTranslation("common");
  return (
    <Layout title={t("page_titles.create_post")}>
      <CreatePost />
    </Layout>
  );
}
import React from "react";
import { useTranslation } from "react-i18next";
import { Layout } from "../components/Layout";
import TopicDetail from "./TopicDetail";

export default function TopicDetailWithLayout() {
  const { t } = useTranslation("common");
  return (
    <Layout title={t("page_titles.topic_detail")}>
      <TopicDetail />
    </Layout>
  );
}
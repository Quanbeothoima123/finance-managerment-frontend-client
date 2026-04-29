import React from "react";
import { useTranslation } from "react-i18next";
import { Layout } from "../components/Layout";
import CommunityFeed from "./CommunityFeed";

export default function CommunityFeedWithLayout() {
  const { t } = useTranslation("common");
  return (
    <Layout title={t("page_titles.community_feed")}>
      <CommunityFeed />
    </Layout>
  );
}
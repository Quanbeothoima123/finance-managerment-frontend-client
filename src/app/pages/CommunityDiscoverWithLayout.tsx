import React from "react";
import { useTranslation } from "react-i18next";
import { Layout } from "../components/Layout";
import CommunityDiscover from "./CommunityDiscover";

export default function CommunityDiscoverWithLayout() {
  const { t } = useTranslation("common");
  return (
    <Layout title={t("page_titles.community_discover")}>
      <CommunityDiscover />
    </Layout>
  );
}
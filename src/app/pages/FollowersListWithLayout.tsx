import React from "react";
import { useTranslation } from "react-i18next";
import { Layout } from "../components/Layout";
import FollowersList from "./FollowersList";

export default function FollowersListWithLayout() {
  const { t } = useTranslation("common");
  return (
    <Layout title={t("page_titles.followers_list")}>
      <FollowersList />
    </Layout>
  );
}
import React from "react";
import { useTranslation } from "react-i18next";
import { Layout } from "../components/Layout";
import PublicProfile from "./PublicProfile";

export default function PublicProfileWithLayout() {
  const { t } = useTranslation("common");
  return (
    <Layout title={t("page_titles.public_profile")}>
      <PublicProfile />
    </Layout>
  );
}
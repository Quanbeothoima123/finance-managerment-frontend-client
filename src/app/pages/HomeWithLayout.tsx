import React from "react";
import { useTranslation } from "react-i18next";
import { Layout } from "../components/Layout";
import HomeContent from "./Home";

export default function HomeWithLayout() {
  const { t } = useTranslation("common");
  return (
    <Layout title={t("page_titles.home")}>
      <HomeContent />
    </Layout>
  );
}

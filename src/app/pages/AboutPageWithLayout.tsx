import React from "react";
import { useTranslation } from "react-i18next";
import { Layout } from "../components/Layout";
import AboutPage from "./AboutPage";

export default function AboutPageWithLayout() {
  const { t } = useTranslation("common");
  return (
    <Layout title={t("page_titles.about")}>
      <AboutPage />
    </Layout>
  );
}
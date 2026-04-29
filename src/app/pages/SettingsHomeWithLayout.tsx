import React from "react";
import { useTranslation } from "react-i18next";
import { Layout } from "../components/Layout";
import SettingsHome from "./SettingsHome";

export default function SettingsHomeWithLayout() {
  const { t } = useTranslation("common");
  return (
    <Layout title={t("page_titles.settings")}>
      <SettingsHome />
    </Layout>
  );
}
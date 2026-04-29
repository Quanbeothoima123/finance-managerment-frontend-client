import React from "react";
import { useTranslation } from "react-i18next";
import { Layout } from "../components/Layout";
import GeneralSettings from "./GeneralSettings";

export default function GeneralSettingsWithLayout() {
  const { t } = useTranslation("common");
  return (
    <Layout title={t("page_titles.settings")}>
      <GeneralSettings />
    </Layout>
  );
}
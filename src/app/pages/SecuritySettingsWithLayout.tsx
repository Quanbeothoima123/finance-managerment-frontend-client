import React from "react";
import { useTranslation } from "react-i18next";
import { Layout } from "../components/Layout";
import SecuritySettings from "./SecuritySettings";

export default function SecuritySettingsWithLayout() {
  const { t } = useTranslation("common");
  return (
    <Layout title={t("page_titles.security_settings")}>
      <SecuritySettings />
    </Layout>
  );
}
import React from "react";
import { useTranslation } from "react-i18next";
import { Layout } from "../components/Layout";
import DataBackupSettings from "./DataBackupSettings";

export default function DataBackupSettingsWithLayout() {
  const { t } = useTranslation("common");
  return (
    <Layout title={t("page_titles.data_backup_settings")}>
      <DataBackupSettings />
    </Layout>
  );
}
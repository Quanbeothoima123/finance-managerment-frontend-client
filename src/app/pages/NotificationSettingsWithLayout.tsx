import React from "react";
import { useTranslation } from "react-i18next";
import { Layout } from "../components/Layout";
import NotificationSettings from "./NotificationSettings";

export default function NotificationSettingsWithLayout() {
  const { t } = useTranslation("common");
  return (
    <Layout title={t("page_titles.notification_settings")}>
      <NotificationSettings />
    </Layout>
  );
}
import React from "react";
import { useTranslation } from "react-i18next";
import { Layout } from "../components/Layout";
import SocialNotifications from "./SocialNotifications";

export default function SocialNotificationsWithLayout() {
  const { t } = useTranslation("common");
  return (
    <Layout title={t("page_titles.social_notifications")}>
      <SocialNotifications />
    </Layout>
  );
}
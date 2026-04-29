import React from "react";
import { useTranslation } from "react-i18next";
import { Layout } from "../components/Layout";
import NotificationsInbox from "./NotificationsInbox";

export default function NotificationsInboxWithLayout() {
  const { t } = useTranslation("common");
  return (
    <Layout title={t("page_titles.notifications_inbox")}>
      <NotificationsInbox />
    </Layout>
  );
}
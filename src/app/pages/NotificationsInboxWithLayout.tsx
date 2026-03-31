import React from "react";
import { Layout } from "../components/Layout";
import NotificationsInbox from "./NotificationsInbox";

export default function NotificationsInboxWithLayout() {
  return (
    <Layout title="Thông báo">
      <NotificationsInbox />
    </Layout>
  );
}

import React from "react";
import { useTranslation } from "react-i18next";
import { Layout } from "../components/Layout";
import AttachmentLibrary from "./AttachmentLibrary";

export default function AttachmentLibraryWithLayout() {
  const { t } = useTranslation("common");
  return (
    <Layout title={t("page_titles.attachments")}>
      <AttachmentLibrary />
    </Layout>
  );
}
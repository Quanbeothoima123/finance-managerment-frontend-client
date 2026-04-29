import React from "react";
import { useTranslation } from "react-i18next";
import { Layout } from "../components/Layout";
import EditTag from "./EditTag";

export default function EditTagWithLayout() {
  const { t } = useTranslation("common");
  return (
    <Layout title={t("page_titles.edit_tag")}>
      <EditTag />
    </Layout>
  );
}
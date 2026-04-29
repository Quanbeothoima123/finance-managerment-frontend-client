import React from "react";
import { useTranslation } from "react-i18next";
import { Layout } from "../components/Layout";
import CreateTag from "./CreateTag";

export default function CreateTagWithLayout() {
  const { t } = useTranslation("common");
  return (
    <Layout title={t("page_titles.create_tag")}>
      <CreateTag />
    </Layout>
  );
}
import React from "react";
import { useTranslation } from "react-i18next";
import { Layout } from "../components/Layout";
import RestoreData from "./RestoreData";

export default function RestoreDataWithLayout() {
  const { t } = useTranslation("common");
  return (
    <Layout title={t("page_titles.restore_data")}>
      <RestoreData />
    </Layout>
  );
}
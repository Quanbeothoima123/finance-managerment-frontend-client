import React from "react";
import { useTranslation } from "react-i18next";
import { Layout } from "../components/Layout";
import ExportCenter from "./ExportCenter";

export default function ExportCenterWithLayout() {
  const { t } = useTranslation("common");
  return (
    <Layout title={t("page_titles.export")}>
      <ExportCenter />
    </Layout>
  );
}
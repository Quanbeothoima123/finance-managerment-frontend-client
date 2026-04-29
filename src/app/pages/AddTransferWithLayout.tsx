import React from "react";
import { useTranslation } from "react-i18next";
import { Layout } from "../components/Layout";
import AddTransfer from "./AddTransfer";

export default function AddTransferWithLayout() {
  const { t } = useTranslation("common");
  return (
    <Layout title={t("page_titles.add_transfer")}>
      <AddTransfer />
    </Layout>
  );
}
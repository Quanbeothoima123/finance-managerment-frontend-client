import React from "react";
import { useTranslation } from "react-i18next";
import { Layout } from "../components/Layout";
import EditMerchant from "./EditMerchant";

export default function EditMerchantWithLayout() {
  const { t } = useTranslation("common");
  return (
    <Layout title={t("page_titles.edit_merchant")}>
      <EditMerchant />
    </Layout>
  );
}
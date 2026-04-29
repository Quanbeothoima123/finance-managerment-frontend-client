import React from "react";
import { useTranslation } from "react-i18next";
import { Layout } from "../components/Layout";
import CreateMerchant from "./CreateMerchant";

export default function CreateMerchantWithLayout() {
  const { t } = useTranslation("common");
  return (
    <Layout title={t("page_titles.create_merchant")}>
      <CreateMerchant />
    </Layout>
  );
}
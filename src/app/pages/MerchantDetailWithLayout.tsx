import React from "react";
import { useTranslation } from "react-i18next";
import { Layout } from "../components/Layout";
import MerchantDetail from "./MerchantDetail";

export default function MerchantDetailWithLayout() {
  const { t } = useTranslation("common");
  return (
    <Layout title={t("page_titles.merchant_detail")}>
      <MerchantDetail />
    </Layout>
  );
}
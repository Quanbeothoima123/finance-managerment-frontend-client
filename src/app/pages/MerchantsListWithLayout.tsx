import React from "react";
import { useTranslation } from "react-i18next";
import { Layout } from "../components/Layout";
import MerchantsList from "./MerchantsList";

export default function MerchantsListWithLayout() {
  const { t } = useTranslation("common");
  return (
    <Layout title={t("page_titles.merchants")}>
      <MerchantsList />
    </Layout>
  );
}
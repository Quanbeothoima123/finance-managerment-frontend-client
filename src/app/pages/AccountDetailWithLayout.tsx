import React from "react";
import { useTranslation } from "react-i18next";
import { Layout } from "../components/Layout";
import AccountDetail from "./AccountDetail";

export default function AccountDetailWithLayout() {
  const { t } = useTranslation("common");
  return (
    <Layout title={t("page_titles.account_detail")}>
      <AccountDetail />
    </Layout>
  );
}
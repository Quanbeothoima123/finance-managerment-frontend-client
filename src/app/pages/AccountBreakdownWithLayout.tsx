import React from "react";
import { useTranslation } from "react-i18next";
import { Layout } from "../components/Layout";
import AccountBreakdown from "./AccountBreakdown";

export default function AccountBreakdownWithLayout() {
  const { t } = useTranslation("common");
  return (
    <Layout title={t("page_titles.account_breakdown")}>
      <AccountBreakdown />
    </Layout>
  );
}
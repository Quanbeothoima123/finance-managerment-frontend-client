import React from "react";
import { useTranslation } from "react-i18next";
import { Layout } from "../components/Layout";
import AccountsOverview from "./AccountsOverview";

export default function AccountsOverviewWithLayout() {
  const { t } = useTranslation("common");
  return (
    <Layout title={t("page_titles.accounts_overview")}>
      <AccountsOverview />
    </Layout>
  );
}

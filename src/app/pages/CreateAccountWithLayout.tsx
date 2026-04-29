import React from "react";
import { useTranslation } from "react-i18next";
import { Layout } from "../components/Layout";
import CreateAccount from "./CreateAccount";

export default function CreateAccountWithLayout() {
  const { t } = useTranslation("common");
  return (
    <Layout title={t("page_titles.create_account")}>
      <CreateAccount />
    </Layout>
  );
}
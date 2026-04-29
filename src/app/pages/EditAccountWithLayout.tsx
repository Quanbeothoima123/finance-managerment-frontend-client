import React from "react";
import { useTranslation } from "react-i18next";
import { Layout } from "../components/Layout";
import EditAccount from "./EditAccount";

export default function EditAccountWithLayout() {
  const { t } = useTranslation("common");
  return (
    <Layout title={t("page_titles.edit_account")}>
      <EditAccount />
    </Layout>
  );
}
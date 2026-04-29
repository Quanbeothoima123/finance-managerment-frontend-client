import React from "react";
import { useTranslation } from "react-i18next";
import { Layout } from "../components/Layout";
import EditAutoRule from "./EditAutoRule";

export default function EditAutoRuleWithLayout() {
  const { t } = useTranslation("common");
  return (
    <Layout title={t("page_titles.edit_auto_rule")}>
      <EditAutoRule />
    </Layout>
  );
}
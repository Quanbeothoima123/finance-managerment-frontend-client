import React from "react";
import { useTranslation } from "react-i18next";
import { Layout } from "../components/Layout";
import CreateAutoRule from "./CreateAutoRule";

export default function CreateAutoRuleWithLayout() {
  const { t } = useTranslation("common");
  return (
    <Layout title={t("page_titles.create_auto_rule")}>
      <CreateAutoRule />
    </Layout>
  );
}
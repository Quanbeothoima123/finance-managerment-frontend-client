import React from "react";
import { useTranslation } from "react-i18next";
import { Layout } from "../components/Layout";
import CategoryBreakdown from "./CategoryBreakdown";

export default function CategoryBreakdownWithLayout() {
  const { t } = useTranslation("common");
  return (
    <Layout title={t("page_titles.category_breakdown")}>
      <CategoryBreakdown />
    </Layout>
  );
}
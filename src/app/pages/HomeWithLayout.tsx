import React from "react";
import { Layout } from "../components/Layout";
import HomeContent from "./Home";

export default function HomeWithLayout() {
  return (
    <Layout title="Tổng quan">
      <HomeContent />
    </Layout>
  );
}

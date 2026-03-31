import React from "react";
import { Layout } from "../components/Layout";
import AboutPage from "./AboutPage";

export default function AboutPageWithLayout() {
  return (
    <Layout title="Giới thiệu">
      <AboutPage />
    </Layout>
  );
}

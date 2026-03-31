import React from "react";
import { Layout } from "../components/Layout";
import SecuritySettings from "./SecuritySettings";

export default function SecuritySettingsWithLayout() {
  return (
    <Layout title="Bảo mật">
      <SecuritySettings />
    </Layout>
  );
}

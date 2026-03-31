import React from "react";
import { Layout } from "../components/Layout";
import DataBackupSettings from "./DataBackupSettings";

export default function DataBackupSettingsWithLayout() {
  return (
    <Layout title="Dữ liệu & Sao lưu">
      <DataBackupSettings />
    </Layout>
  );
}

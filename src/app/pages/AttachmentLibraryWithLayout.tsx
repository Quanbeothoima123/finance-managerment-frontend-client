import React from "react";
import { Layout } from "../components/Layout";
import AttachmentLibrary from "./AttachmentLibrary";

export default function AttachmentLibraryWithLayout() {
  return (
    <Layout title="Đính kèm">
      <AttachmentLibrary />
    </Layout>
  );
}

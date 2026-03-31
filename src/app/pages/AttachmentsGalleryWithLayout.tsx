import React from "react";
import { Layout } from "../components/Layout";
import AttachmentsGallery from "./AttachmentsGallery";

export default function AttachmentsGalleryWithLayout() {
  return (
    <Layout title="Hoá đơn">
      <AttachmentsGallery />
    </Layout>
  );
}

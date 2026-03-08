import React from 'react';
import { Layout } from '../components/Layout';
import ExportCenter from './ExportCenter';

export default function ExportCenterWithLayout() {
  return (
    <Layout title="Xuất dữ liệu">
      <ExportCenter />
    </Layout>
  );
}

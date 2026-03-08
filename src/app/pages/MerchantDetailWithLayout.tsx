import React from 'react';
import { Layout } from '../components/Layout';
import MerchantDetail from './MerchantDetail';

export default function MerchantDetailWithLayout() {
  return (
    <Layout title="Chi tiết nhà cung cấp">
      <MerchantDetail />
    </Layout>
  );
}

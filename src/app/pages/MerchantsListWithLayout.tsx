import React from 'react';
import { Layout } from '../components/Layout';
import MerchantsList from './MerchantsList';

export default function MerchantsListWithLayout() {
  return (
    <Layout title="Nhà cung cấp">
      <MerchantsList />
    </Layout>
  );
}

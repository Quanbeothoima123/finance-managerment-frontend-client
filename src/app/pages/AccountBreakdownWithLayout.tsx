import React from 'react';
import { Layout } from '../components/Layout';
import AccountBreakdown from './AccountBreakdown';

export default function AccountBreakdownWithLayout() {
  return (
    <Layout title="Phân tích tài khoản">
      <AccountBreakdown />
    </Layout>
  );
}

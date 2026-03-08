import React from 'react';
import { Layout } from '../components/Layout';
import InsightsOverview from './InsightsOverview';

export default function InsightsOverviewWithLayout() {
  return (
    <Layout title="Thống kê & Báo cáo">
      <InsightsOverview />
    </Layout>
  );
}

import React from 'react';
import { Layout } from '../components/Layout';
import CashflowChart from './CashflowChart';

export default function CashflowChartWithLayout() {
  return (
    <Layout title="Biểu đồ dòng tiền">
      <CashflowChart />
    </Layout>
  );
}

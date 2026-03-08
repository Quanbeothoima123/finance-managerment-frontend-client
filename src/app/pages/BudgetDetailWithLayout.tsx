import React from 'react';
import { Layout } from '../components/Layout';
import BudgetDetail from './BudgetDetail';

export default function BudgetDetailWithLayout() {
  return (
    <Layout title="Chi tiết ngân sách">
      <BudgetDetail />
    </Layout>
  );
}

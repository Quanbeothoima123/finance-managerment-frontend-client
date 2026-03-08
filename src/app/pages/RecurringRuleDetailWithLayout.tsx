import React from 'react';
import { Layout } from '../components/Layout';
import RecurringRuleDetail from './RecurringRuleDetail';

export default function RecurringRuleDetailWithLayout() {
  return (
    <Layout title="Chi tiết giao dịch định kỳ">
      <RecurringRuleDetail />
    </Layout>
  );
}

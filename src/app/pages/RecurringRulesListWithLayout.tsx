import React from 'react';
import { Layout } from '../components/Layout';
import RecurringRulesList from './RecurringRulesList';

export default function RecurringRulesListWithLayout() {
  return (
    <Layout title="Giao dịch định kỳ">
      <RecurringRulesList />
    </Layout>
  );
}

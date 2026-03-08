import React from 'react';
import { Layout } from '../components/Layout';
import AutoRulesList from './AutoRulesList';

export default function AutoRulesListWithLayout() {
  return (
    <Layout title="Quy tắc tự động">
      <AutoRulesList />
    </Layout>
  );
}

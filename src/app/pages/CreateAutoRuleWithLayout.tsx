import React from 'react';
import { Layout } from '../components/Layout';
import CreateAutoRule from './CreateAutoRule';

export default function CreateAutoRuleWithLayout() {
  return (
    <Layout title="Tạo quy tắc">
      <CreateAutoRule />
    </Layout>
  );
}

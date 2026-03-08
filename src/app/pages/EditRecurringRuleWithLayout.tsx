import React from 'react';
import { Layout } from '../components/Layout';
import CreateRecurringRule from './CreateRecurringRule';

export default function EditRecurringRuleWithLayout() {
  return (
    <Layout title="Chỉnh sửa giao dịch định kỳ">
      <CreateRecurringRule />
    </Layout>
  );
}

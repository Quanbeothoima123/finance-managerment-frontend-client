import React from 'react';
import { Layout } from '../components/Layout';
import CreateEditBudget from './CreateEditBudget';

export default function CreateBudgetWithLayout() {
  return (
    <Layout title="Tạo ngân sách">
      <CreateEditBudget mode="create" />
    </Layout>
  );
}

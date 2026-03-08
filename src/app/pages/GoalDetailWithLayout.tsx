import React from 'react';
import { Layout } from '../components/Layout';
import GoalDetail from './GoalDetail';

export default function GoalDetailWithLayout() {
  return (
    <Layout title="Chi tiết mục tiêu">
      <GoalDetail />
    </Layout>
  );
}

import React from 'react';
import { Layout } from '../components/Layout';
import CategoryBreakdown from './CategoryBreakdown';

export default function CategoryBreakdownWithLayout() {
  return (
    <Layout title="Phân tích danh mục">
      <CategoryBreakdown />
    </Layout>
  );
}

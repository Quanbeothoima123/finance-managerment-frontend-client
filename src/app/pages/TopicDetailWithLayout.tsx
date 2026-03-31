import React from 'react';
import { Layout } from '../components/Layout';
import TopicDetail from './TopicDetail';

export default function TopicDetailWithLayout() {
  return (
    <Layout title="Chu de">
      <TopicDetail />
    </Layout>
  );
}

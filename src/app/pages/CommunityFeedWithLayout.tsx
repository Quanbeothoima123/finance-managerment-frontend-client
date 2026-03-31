import React from 'react';
import { Layout } from '../components/Layout';
import CommunityFeed from './CommunityFeed';

export default function CommunityFeedWithLayout() {
  return (
    <Layout title="Cong dong">
      <CommunityFeed />
    </Layout>
  );
}

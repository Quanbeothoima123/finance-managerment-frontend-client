import React from 'react';
import { Layout } from '../components/Layout';
import PublicProfile from './PublicProfile';

export default function PublicProfileWithLayout() {
  return (
    <Layout title="Ho so">
      <PublicProfile />
    </Layout>
  );
}

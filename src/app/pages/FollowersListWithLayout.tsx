import React from 'react';
import { Layout } from '../components/Layout';
import FollowersList from './FollowersList';

export default function FollowersListWithLayout() {
  return (
    <Layout title="Nguoi theo doi">
      <FollowersList />
    </Layout>
  );
}

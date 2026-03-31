import React from 'react';
import { Layout } from '../components/Layout';
import SocialNotifications from './SocialNotifications';

export default function SocialNotificationsWithLayout() {
  return (
    <Layout title="Thong bao cong dong">
      <SocialNotifications />
    </Layout>
  );
}

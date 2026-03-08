import React from 'react';
import { Layout } from '../components/Layout';
import NotificationSettings from './NotificationSettings';

export default function NotificationSettingsWithLayout() {
  return (
    <Layout title="Cài đặt thông báo">
      <NotificationSettings />
    </Layout>
  );
}

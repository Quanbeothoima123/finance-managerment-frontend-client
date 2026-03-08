import React from 'react';
import { Layout } from '../components/Layout';
import SettingsHome from './SettingsHome';

export default function SettingsHomeWithLayout() {
  return (
    <Layout title="Cài đặt">
      <SettingsHome />
    </Layout>
  );
}

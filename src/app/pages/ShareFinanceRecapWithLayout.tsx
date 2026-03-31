import React from 'react';
import { Layout } from '../components/Layout';
import ShareFinanceRecap from './ShareFinanceRecap';

export default function ShareFinanceRecapWithLayout() {
  return (
    <Layout title="Chia se Recap">
      <ShareFinanceRecap />
    </Layout>
  );
}

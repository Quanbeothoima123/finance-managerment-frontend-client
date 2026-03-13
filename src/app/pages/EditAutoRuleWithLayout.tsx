import React from 'react';
import { Layout } from '../components/Layout';
import CreateAutoRule from './CreateAutoRule';

export default function EditAutoRuleWithLayout() {
  return (
    <Layout title="Chỉnh sửa quy tắc">
      <CreateAutoRule mode="edit" />
    </Layout>
  );
}

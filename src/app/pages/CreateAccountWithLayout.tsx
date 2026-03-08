import React from 'react';
import { Layout } from '../components/Layout';
import CreateEditAccount from './CreateEditAccount';

export default function CreateAccountWithLayout() {
  return (
    <Layout title="Tạo tài khoản">
      <CreateEditAccount mode="create" />
    </Layout>
  );
}
